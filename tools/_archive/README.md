# tools/_archive · 已失效工具（只读归档）

2026-11-04 归档。保留源码供查阅/找回思路，**不要再运行，也不要在新代码里引用**。

| 目录 | 原用途 | 为什么失效 |
|---|---|---|
| `anim/` | 字义白板动画 v1 工具链（`draft.py` 初稿、`tts.py` 配音、`mix.py` 混音、`export.py` 导出、`polycheck.py` 多音字核对等） | 读写仓库根 `anim/`（`<字>.json`、`art/`、`hz/` 等）并依赖根目录 `xzq-anim.js`；根 `anim/` 与旧壳已于 2026-11-04 删除 |
| `anim2/` | 白板动画引擎 v2（Canvas + rough.js）构建与回归脚本 | 数据同样来自已删除的根 `anim/`，产物输出到 `dist/anim2/xzq-anim2.js`，现主线 `newhanzi/` 不再使用 |

现主线动画：`newhanzi/anim-engine.js`（及动画相关新工具，见 `newhanzi/ANIMATION_PATTERNS.md`、`docs/anim/`）。
历史设计与交接文档仍在 `docs/anim/`（其中提到的 `tools/anim/`、`tools/anim2/` 路径即本目录下对应子目录）。

如需复活：先恢复根 `anim/` 数据（git 历史中 2026-11-04 删除旧壳之前的提交），再把目录移回 `tools/`。
