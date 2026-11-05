# 交接 · 语法白板第 1 期 · 03 check_wb.py --lint 与 R1–R13、渲染 1–2

依据：设计 §8。

## 改了什么
- 新增 `tools/wb/wblint.py`：纯 Python 静态检查，不需要 Playwright。自带一个小的 JS 字面量解析器（对象 / 数组 / 单双引号字符串 / 数字 / 布尔 / 注释），解析 `NHZWB.add('名', {...})` 与 `terms.js`。
- `tools/wb/check_wb.py`：
  - `--lint [-v] [名称…]`：调用 wblint，不加载 Playwright。
  - 渲染 1：默认在容器宽 **700（平板）和 1100（桌面）** 两档各跑一遍原有检查（报错、逐 0.5 秒渲染、出框、重叠、确定性）；`--w 700` 可只测一档。
  - 渲染 2：引擎提供 `NHZWB.LV` 后（05 加入），对每幕在浅 / 中 / 深三档各挂载一次，同一幕同一 t 的 SVG 必须一致。
  - 有 `terms.js` 时自动注入。

## 规则
| 编号 | 实现 | 级别 |
|---|---|---|
| R1 | 场景文件里的 `#rgb/#rrggbb/rgb(` | STRICT 项错误，其余警告 |
| R2 | lv ∈ {1,2,3}；title/end 不带 lv | 错误 |
| R3 | lv:3 必须有非空 src | 错误 |
| R4 | 每项 ≥1 幕 lv=1（缺省 lv 视为 1）；缺 lv=3 警告（STRICT 项错误） | 错误/警告 |
| R5 | 解析引擎 `PAL` 与分层注释，跨层 ΔE76 ≥ 20；名词 vs 正文墨写死豁免 | 错误 |
| R6 | `col/tone` 不得用 `ok/bad`、`role`；成分线不得同染词类色；未知成分线 kind | 错误 |
| R7 | note/up 含施事、受事、话题、本体、喻体等，却用成分线或词类色/手填色 | STRICT 错误，其余警告 |
| R8 | trunk：否定词须在 keep；生长出的数量词须 keep 或 cutOk | 错误 |
| R9 | review/morph `ok:false`、`wrongTry`、`absurd` 须同幕改正；fix 须有 good | 错误 |
| R10 | `{t:键}` 必须在 terms.js；terms 每条须有 t、kid | 错误 |
| R11 | 每幕强调色（`acc` 或手填色）不止一种 | 警告 |
| R12 | 引擎 `CPS = 3.5`、`THINK = 4`；场景数据不许写 `min/think` | 错误 |
| R13 | 引擎「播放器」分界注释之前不得出现 `Math.random / Date / performance.` | 错误 |

`STRICT`（wblint.py 顶部）为空；07 每回炉一项就把它加进去。

## 当前结果（本提交，换色前）
`✗ lint：3 错误，142 警告`
- 3 个 R5 错误正是设计 §2.1 列的旧色板近色：acc/adv 13.6、ok/prep 14.0、cmp/role 16.6 —— 由 04 换色板消除。
- 警告：R1×29（与设计 §2.1 的 29 处一致）、R11×9、R4×99（全部缺 L3）、R7×5。

## 怎么验证
```bash
python3 tools/wb/check_wb.py --lint        # 汇总
python3 tools/wb/check_wb.py --lint -v     # 看警告明细
python3 tools/wb/check_wb.py 主语 定语     # 两档宽度渲染检查（实测通过）
```

## 已知问题
- 出框 / 重叠检查按 viewBox 坐标计算，两档宽度结果理论上相同；两档实跑主要防将来布局依赖容器宽度。
- `--all` 两档约 90 秒。
- R7 只看 note/up 文字里的角色词，属启发式。

## 下一步
- 04：新色板 + 清理 29 处手填色 + 重拍基线。
