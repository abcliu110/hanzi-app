# 交接 · 语法白板第 1 期 · 02 引擎原语 E1–E14 + review 模板

依据：设计 §7.1、§7.2、§7.3。前置：01 基线（`tools/wb/baseline.json`）。

## 改了什么（`newhanzi/wb/wb-engine.js`）
| 编号 | 内容 |
|---|---|
| E0（结构） | 新增 `PAL` 色板常量与分层注释（cls / role / judge / story），`INK/GRAY/ACC/OK/BAD/BLUE/LINE/SYM` 改为取 `PAL`。**本提交色值不变**，换色在 04 单独提交。新增成分墨 `PAL.role #4f5d7a`（`ROLE`）。 |
| E1 | 属性时间线 `c.track / c.key / c.at`：每个元素每个属性只注册一个求值器，按关键帧求值（瞬变 / 线性 / ease / 弧线）。`recolor`、`fade` 改走时间线 → **修掉 recolor 颜色覆盖缺陷**（同一词块两次 recolor，后者不再在自己 t0 前抹掉前者）。 |
| E2 | `c.move(g, [{t,x,y,d,arc}])`（不在 t0 前隐藏）、`c.chunk(gs)`、`c.into(g, fn)`（把成分线画进词块组，随块移动）、构建时排版 `lay(ws, gap, cx)`。 |
| E3 | `c.gap(cx, y, w, t0, {phi, sub, until})` 虚线空位（∅、下标）。 |
| E4 | `c.hub` 枢纽圈（强调色实线椭圆）、`c.guard` 保护标签（强调色虚线框 +「不能剪」）。 |
| E6 | `c.stair(x0, x1, y, cuts, label, t0)` 台阶线一行（第 3 期 nest 用）。 |
| E7 | `c.role(kind, x0, x1, y, t0, {size})`：zhu ═、wei ＿、bin ～、ding（）、zhuang〔〕、bu〈〉、bar ‖，固定成分墨。 |
| E8 | `c.tag(cx, y, text, t0)` 语义角色标签（叙事墨小字 + 虚线框）。 |
| E9（部分） | 种子改为 `20261104 + 原始序号 × 1000`，`buildScene` 收原始序号；`c.lv = sc.lv || 1`。档位过滤 UI 在 05。 |
| E10 | `C(v)` 语义色键解析：`'verb' / 'role' / 'acc'…` 查 `PAL`；旧 `#rrggbb` 原样通过（兼容期）。`mark` 的 `m.col`、`arrows.col` 都经 `C()`。 |
| E11 | `c.strike` 删除线、`c.sink` 下沉 + 淡出。 |
| E12 | `c.shake(g, t0, d, A, f)` 确定性正弦摇晃（叠加在 transform 时间线上）。 |
| E13 | `c.pic` 情境卡（暂只文字，图标待 Q22）、`c.state2` 前后两格。 |
| E14 | `term(s, lv)`：`{t:键}` 占位，在 `T()`、`wrap()`、旁白里按**幕自己的 lv** 替换；`{t:键|term|kid|short|ks}` 强制形式。术语表 `terms.js` 在 05。 |
| E15（部分） | 新模板 `review`（回练幕纯观看版，§5.5）。`trunk` 在 06；`morph / nest / valence` 留第 2、3 期。 |
| mark 新可选参数 | `m.role`（成分线）、`m.hub`（枢纽圈）、`m.tag`（角色标签）、`d.gap`（词距，给括号留位）。不写这些参数时输出与旧版逐字节一致。 |
| 导出 | `NHZWB.PAL / term / TPL`（自测与 lint 用）。 |

新增 `tools/wb/selftest.py`：引擎自测（recolor 不覆盖、fade 接力、move 终点与弧线、shake 归位、sink、E14 替换、全部新原语可画、确定性）。

## 判断与偏离
- E14 按**幕的 lv** 替换，而不是播放器当前档位：这样同一幕在任何档位下 SVG 完全一致（满足设计 §8「渲染 2」），也符合 Q23（L1 幕用儿童名、L2 用术语）。
- E6 / E12 / E13 原本属于第 2、3 期，原语很小，先实现并自测；对应模板未做。

## 怎么验证
```bash
python3 tools/wb/baseline.py      # ✓ 512 幕一致，0 幕不同（本提交实测）
python3 tools/wb/selftest.py      # ✓ 引擎自测全部通过
python3 tools/wb/check_wb.py --all  # 99 项全过（实测）
node tools/check_scripts.js       # 通过
```

## 已知问题
- 引擎沿用旧行为：元素从「隐藏」再变「显示」后会留下 `style=""`，所以「刚建好就 seek」与「先 seek(0) 再 seek」innerHTML 字面不同（画面相同）。check_wb 与 baseline 都用固定顺序，不受影响。
- `pic` 暂无线条图标。

## 下一步
- 03：`check_wb.py --lint` 与 R1–R13。
