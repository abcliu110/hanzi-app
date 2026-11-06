# 拼音区 · 07 模块视图版式修正（交接）

日期：2026-11-06（按 pinyin-05 建议①②③；负责人「把内容补厚补强」，不做特效）

## 改了什么
1. `zika.css`：首页模块视图 `.page-home #view-module .app-main` 在 ≥768 改为 `display:block; max-width:1200px; margin:0 auto`（≥768 左右 24px，≥1200 左右 28px）。不再套用首页 hero/board 两列网格（首页早已没有英雄卡，左列一直空 260–280px）。首页本身（`#view-home`）不受影响。
2. `pinyin.html` 菜单：外层 `.py-wrap` 设 `container-type:inline-size`，`@container (min-width:880px)` 三列，默认两列；`max-width` 1100→1200。
3. 菜单卡片：`.py-card` 改 `flex-direction:column; justify-content:flex-start`（不再垂直居中下沉）；编号、标题、L 标签放进同一行 `.hd`（flex 对齐，L 标签 `margin-left:auto`，不再 float）。`pinyin.js` 卡片 HTML 相应调整。

## 实测（Playwright，模块面板位置 / iframe 宽）
| 视口 | 修前 | 修后 |
|---|---|---|
| 768 | x=300，宽 444 | x=24，宽 720 |
| 1280 | x=324，宽 848（识字 x=434 宽 628） | x=68，宽 1144（9 个模块一致） |
- 拼音菜单：768 两列、1280 三列，卡片标题全部顶部对齐。
- 其他 6 个 iframe 子页（语法 yuwen、阅读与写作、实验、部首、古诗、古文）和识字、逻辑两个非 iframe 面板在 768 / 1280 逐个截图：都居中、无横向溢出（iframe 内 scrollWidth = clientWidth）。截图在仓库外 `/workspace/work/py-shots-framework/{before,after}-{768,1280}-*.png`。

## 留给以后（没改）
- 子页内部断点仍按视口写：iframe 宽 720 / 1144，**永远进不了子页自己的 1200 桌面档**，部分进不了 768 档（720 < 768）。目前看都能用，但：
  - 语法（yuwen）1280 下内容区约 920px 宽，两边留白较多；实验（grammar_lab）顶部深色横幅比下面卡片网格宽。
  - 若要桌面三列/更宽，需要像拼音页一样改容器查询（每页一两行 CSS），建议各模块下次改动时顺手做。
- 识字面板 1280 现在铺满 1144 宽，字表仍 2 列（≥1440 视口才 3 列）。
