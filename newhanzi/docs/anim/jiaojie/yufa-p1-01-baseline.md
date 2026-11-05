# 交接 · 语法白板第 1 期 · 01 渲染哈希基线

依据：`docs/anim/baiban-yufa-gaijin-sheji.md` §7.3、§9 第 1 期第 1 条。

## 改了什么
- 新增拍摄脚本 `tools/wb/baseline.py`：一次加载 rough.js、引擎和全部 `wb/s/*.js`，对 `wb/index.js` 里 99 项、512 幕，在每幕 0.35 / 0.7 / 1.0 倍时长处取 `svg.innerHTML` 的 SHA-1（浏览器内 `crypto.subtle` 计算）。
- 新增基线 `tools/wb/baseline.json`（约 77 KB，入库）：`语法点名 → [{d: 时长秒, h: [三帧哈希]} …]`，以引擎 `73749c25` 为准。
- 引擎、场景均未改动。

## 涉及文件
- `tools/wb/baseline.py`（新）
- `tools/wb/baseline.json`（新）

## 怎么验证
```bash
python3 tools/wb/baseline.py            # 对比，期望：✓ 对比基线：512 幕一致，0 幕不同
python3 tools/wb/baseline.py --write    # 重拍（只在有意改变画面时用，如换色板）
python3 tools/wb/baseline.py --only 主语 --dump /tmp/svg   # 导出 SVG 看差异
python3 tools/wb/baseline.py --skip 主语,谓语             # 对比时跳过已回炉的项
python3 tools/wb/baseline.py --cmp-nocolor /tmp/a /tmp/b # 两份 dump 去掉 fill/stroke 后是否一致
python3 tools/wb/baseline.py --lv 1     # 以某档位挂载后拍（档位切换不改画面的验证）
```
- 已做过变异测试：把引擎 `BLUE` 改一位，120 幕报不同；改回后 512 幕一致。
- 全量拍一次约 2 秒；依赖 `pip install playwright && python3 -m playwright install chromium`。

## 已知问题
- innerHTML 与字体无关，但与 Chromium 的 SVG 序列化有关；换大版本 Chromium 理论上可能改变序列化格式（属性顺序、数字格式），届时全部重拍即可。
- 只拍三帧，不是逐帧；中间时刻的回归要靠 `check_wb.py` 的逐 0.5 秒渲染。

## 下一步
- 02：引擎原语 E1–E15（不含 E0 换色），合入后本基线必须 512 幕 100% 一致。
