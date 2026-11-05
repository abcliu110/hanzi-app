# 交接 · 语法白板第 1 期 · 05 lv 过滤、浅 / 中 / 深三档、terms.js

依据：设计 §4.1、§4.3、§4.4、§7.1 E9 / E14。

## 改了什么
- `newhanzi/wb/wb-engine.js` 播放器：
  - 控制条新增「浅 / 中 / 深」分段按钮（每个 ≥44px 高）：浅 = lv≤1，中 = lv≤2（**默认**，Q16），深 = 全部；`title` / `end` 任何档位都显示；缺 lv 视为 1（Q18），所以旧 92 项在任何档位下幕数不变。
  - 选择存 `localStorage('nhz_wb_lv')`（try/catch），下次挂载记住。
  - 幕标签按钮、自动连播只走可见幕；标签序号按可见幕重排。
  - 有被过滤掉的幕时，控制条下方显示「深一点还有 N 幕（选「中」或「深」可看）」。
  - 切档：停播；当前幕不可见则跳到第一可见幕。
  - 种子按原始序号（02 已改），所以切档不改变任何一幕的手绘抖动。
  - API：`seek / seekRaw / durations` 均按原始序号；新增 `visible()`、`level()`、`name`；`NHZWB.LV`。
- 新增 `newhanzi/wb/terms.js`：设计 §4.3 全表 24 条（zhu … bc），字段 `t / kid / s / k / deep`。
- `newhanzi/yuwen.js`：白板按需注入顺序改为 `rough.js → wb-engine.js → terms.js → s/<id>.js`。
- `tools/wb/selftest.py`：加三档测试（默认中、浅档 3 幕、深档 5 幕、存档、重挂记住、按钮 ≥44px、提示文字）。

## 怎么验证
```bash
python3 tools/wb/selftest.py           # ✓
python3 tools/wb/baseline.py           # ✓ 512 幕一致
python3 tools/wb/baseline.py --lv 1    # ✓ 512 幕一致（以「浅」挂载，画面不变）
python3 tools/wb/check_wb.py 主语      # 含渲染 2：三档下同幕同 t SVG 一致
```
- 768 / 1280 视口实截图：控制条一行放得下（播放、进度、浅中深、朗读），页面无横向滚动（scrollWidth = 视口宽）。

## 判断
- 术语按「幕自己的 lv」替换（见 02 交接），不随播放器档位变；这样满足「档位切换前后同一幕 SVG 一致」。
- kid 名取设计表原文（如「谁 / 什么」），L2 标签会显示「主语（谁 / 什么）」；公式行用简称 `s` / `k`。

## 已知问题
- 进度条只表示当前幕进度（与旧版相同），总时长未显示。
- 「深一点还有 N 幕」放在控制条下方而非进度条正下方（进度条在同一行内）。

## 下一步
- 06：`trunk` 模板。
