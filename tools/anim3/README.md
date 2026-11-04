# tools/anim3 · anim-engine 图示的生成与校验

`newhanzi/anim-engine.js` 是纯函数（数据 → SMIL SVG），本目录放调用它的脚本，保证图示可重跑、可校验。

| 文件 | 作用 |
|---|---|
| `gen_zika_split.js` | 字卡“拆合”动画：`build` 重新生成并写回 `newhanzi/data/zika/<字>.js` 的 `图示`；`check` 只校验 |
| `zika_split_spec.json` | 每个字的部件 / 位移 / 颜色 / 标注；`strokes_idx` 人工指定某部件对应本字第几笔（0 起） |
| `mmah_subset.json` | [makemeahanzi](https://github.com/skishore/makemeahanzi) `dictionary.txt` 子集（decomposition + matches），用于把部件对到笔画 |
| `check_anim.js` | 全站图示扫描：字卡/诗词/古文/语文/部首里的 SVG 文本不得含字体常缺字符 |
| `common.js` | 公共函数 |

规则：
- 拆合动画开头、结尾的整字必须是字卡字本身（2026-11-04 前 631 个是部件串，如 付→亻寸）。
- 动画里不输出 CJK 扩展区、U+9FA6 以后的新增字（龸 等）、私用区、部首补充、CJK 笔画字符；
  这类部件和数据占位符（◇ ④ ②）改用本字对应笔画的轮廓（hanzi-writer-data）画出来。

改部件：编辑 `zika_split_spec.json` → `node tools/anim3/gen_zika_split.js build` → `check`。
`tests/anim3.spec.js` 在 CI 里跑两个 check。

makemeahanzi 数据与 hanzi-writer-data 同源（Arphic Public License / LGPL，见上游 COPYING）。
