# 交接 · 语法白板第 2 期 · 01 公共词块行 Row（从 trunk 抽出）

依据：设计 §5.2、§7.1 E2；第 1 期交接 08-summary「第 2 期建议 1」。

## 改了什么
- `newhanzi/wb/wb-engine.js` 在 `TPL.trunk` 前新增公共函数：
  - `Row(c, {size, y})`：一行词块的容器。
  - `row.mk(w, role, ex)`：建块记录（字、成分、宽度 `wd`，宽度用 `textW` 在构建时算）。
  - `row.create(b, x0, t0, drop)`：画一个词块组（字 + 可选成分线，括号类成分线画在组里，块移动时跟着走）；`drop` 时从上方落入。
  - `row.place(L, X, t0, d0, drop)`：把词块序列排到 X（已画的块用 `move` 平移，新块 `create`）。
  - `layG(ws, gaps, cx)`：每两块之间间距可不同的排版（morph 的「块内紧、块间松」用）。原 `lay` 保持不动（浮点求和顺序不变，保证基线）。
- `TPL.trunk` 改为调用 `Row`：删掉内联的 `create`、`place` 循环和 `mk` 主体，只保留 trunk 自己的路标归属、主谓 ‖、公式行。rough 种子消耗顺序与原来逐行相同。

## 改了哪些文件
- `newhanzi/wb/wb-engine.js`
- `docs/anim/jiaojie/yufa-p2-01-row.md`（本文）

## 怎么验证
```bash
python3 tools/wb/baseline.py      # ✓ 对比基线：544 幕一致，0 幕不同（含第 1 期 7 项 trunk 幕）
python3 tools/wb/selftest.py      # ✓ 引擎自测全部通过
python3 tools/wb/check_wb.py --lint
node tools/check_scripts.js
```

## 已知问题
- `Row` 只管「一行」；多行（nest 的盒子、台阶线）在第 3 期另加。

## 下一步
- 02：`morph` 模板（整块移动 + 弧线换位、虚线空位、枢纽圈、失败抖动 ✗、两格状态图、同学错改）。
