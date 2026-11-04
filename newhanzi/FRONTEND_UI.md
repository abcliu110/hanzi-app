# newhanzi · 前端 UI 规范

适用范围：`newhanzi/` 下全部页面（`index.html`、`zika.html`、`bushou.html`、`shici.html`、`yuwen.html`、`grammar_lab.html`、`proto-yuwen.html` 等）及 `zika.css`。

与 Figma「识字星球」护眼方案对齐：每个页面都要做护眼色 + 平板/桌面，不只首页。

## 1. 颜色 Token

权威定义见 `zika.css` 顶部 `:root`：

| Token | 亮色 | 用途 |
|---|---|---|
| `--bg` | `#e4eedf` | 页面底 |
| `--card` | `#f2f6ee` | 顶栏/主卡片底 |
| `--surface` | `#f8faf5` | 更浅表面 |
| `--ink` | `#2c3328` | 正文 |
| `--muted` | `#6b7566` | 次要文字 |
| `--accent` | `#4a7a59` | 主强调 |
| `--accent-deep` | `#3d5a40` | 标题、深按钮 |
| `--accent-soft` | `#d3e5d6` | 浅底、芯片 |
| `--line` | `#d5dfd0` | 描边 |
| `--leaf` | `#9ed0ad` | 轻装饰 |
| `--green` / `--blue` / `--red` | `#3f8e6b` / `#4a7a8c` / `#b85a52` | 语义色（蓝为青灰，非亮蓝） |

深色模式：跟随 `prefers-color-scheme: dark`（见 `zika.css`），勿另起一套高对比霓虹色。

禁止主色：奶油纸 `#F5F1E6` / `#FBF8EF`；亮蓝紫 `#4f7cff` / `#eef2ff` / `#3730a3`。

## 2. 断点

| 断点 | 要求 |
|---|---|
| 默认 | 手机单列，大字号、大按钮 |
| `≥768px` | 平板：多列网格、收紧过大 hero、侧栏/双栏按页启用 |
| `≥1200px` | 桌面：内容 `max-width` 约 1100–1200px 居中或双栏；字卡等详情可并排 |

子页（部首/古诗/语法/实验）必须带与首页同一套 `@media (min-width:768px)` / `1200px`，禁止只有首页响应式。

## 3. 布局注意

- CSS Grid 子项默认 stretch：hero / CTA 区域用 `align-self: start`，避免平板上被拉高。
- 重复 CTA：桌面若侧栏已有入口，隐藏 hero 内重复按钮。
- 顶栏 sticky；返回与标题层级清晰。
- 焦点：`outline: 3px solid var(--accent)`。

## 4. 页面清单（改 UI 时逐页过）

- [ ] `index.html` 首页
- [ ] `zika.html` 字卡
- [ ] `bushou.html` 部首
- [ ] `shici.html` 古诗
- [ ] `yuwen.html` 语文
- [ ] `grammar_lab.html` 语法实验
- [ ] `proto-yuwen.html` 语文原型

## 5. 验收

1. 三端（手机/平板/桌面）抽查目标页。
2. 颜色全部来自 token；深色模式可读。
3. 无异常拉高的 hero；触控热区足够。
4. 只用 newhanzi 自己的 token（`zika.css` 的 `--accent`/`--ink`/`--line` 等）。（旧壳的 `--xzq-*` 变量已随根目录旧壳于 2026-11-04 删除，不再存在。）

## 6. 相关

- 产品 Spec：`SPEC.md`
- 仓库级说明：`../docs/frontend-ui.md`
- Agent 规则：`../.cursor/rules/frontend-ui.mdc`、本目录若有规则以仓库规则为准
