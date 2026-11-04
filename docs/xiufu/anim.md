# 修复记录 · anim（2026-11-04）

负责区：`newhanzi/anim-engine.js`、`newhanzi/data/zika/*.js`、`newhanzi/zika.js`、`newhanzi/shici.html` 重播按钮、
`newhanzi/data/index.js` / `pinyin_lookup.js`（读音）、`tools/anim3/`、`newhanzi/tools/`。

## 1. P0 拆合动画不显示本字 —— 已修
- 根因：`anim-engine.js` `split()` 的整字 = `parts.map(text).join('')`，ecbd4d5f / e9c7036f 生成时没传整字；
  另有 31 个字（业 两 伞 受…）部件是占位符 ◇/④，且 4 个标注被截断（病、考）。
- 引擎：`split()` 新增 `whole`（不给时仍按部件拼接，语法区“花+草=花草”类不受影响）；部件可带 `strokes/bbox`，
  用本字笔画轮廓（hanzi-writer-data）画出来，不再输出文字。
- 生成脚本：`tools/anim3/gen_zika_split.js build|check`（spec：`tools/anim3/zika_split_spec.json`，由旧 SVG 反解；
  部件↔笔画对应用 makemeahanzi `matches`，子集 `tools/anim3/mmah_subset.json`；7 个对不上的字在 spec 里手填 `strokes_idx`）。
- 结果：662 个全部重生成；整字 = 字卡字；93 个含扩展区/私用区/U+9FA6 后新增字（龸 𠃌 𫥞 𧾷 ⺊ 䒑…）或占位符的部件改为笔画图形；
  check 0 问题。`tests/anim3.spec.js` 在 CI 跑 check。
- 其他图示扫描：`tools/anim3/check_anim.js`（诗词/古文/语文/语法/部首 577 个）：无扩展区字符、标签配对；
  语文区 9 个 split 是词语拆分，整体=部件拼接，正确。
- 提交：064a4fbc（rebase 后见 git log “识字拆合动画”）

## 2. 重播 —— 已修
- shici.html 两处改为克隆替换 svg（`.sc-anim` 容器内 `querySelector('svg')`）；字卡机制图加“↻ 重播”，同法。
- Playwright：字卡、古诗知识卡、古诗意象卡三处验证“svg 被替换且时间线回到 0”。
- 提交：311cf91d、cf19562b、272b34dd（以 git log 为准）

## 3. zika.html?zi=%E0%A4 —— 已修
- decodeURIComponent 包 try/catch，显示“链接里的汉字编码不对…回首页选字”；有 Playwright 用例。

## 4. 主读音 —— 已修（部分需拍板）
- `newhanzi/tools/pinyin_fix.json` 人工表 + `newhanzi/tools/fix_pinyin.py apply|check`；`tests/pinyin.spec.js` 跑 check。
- 106 字逐个判断：48 字改首音，58 字复核后维持。
- 182 字的古音/罕用/专名读音（佛 bì/bó、净 chēng、冯 píng、戌 qu、们 mén…）移到 `读音.罕用读音`：
  首页索引和查表不出现，字卡显示为小字“（古音/罕用：…）”，朗读不读。
- 顺带：索引里 104 字 `tl`/`t` 字段错（如 蠢 tl=chǔn、t=5，导致声调颜色错、按 chun 搜不到），apply 时一并重算。
- 未改：`newhanzi/ziku/model-3500.json`（源数据，不在负责区）；重跑 build_filemode/promote_aux 之后要再跑 `fix_pinyin.py apply`。

## 问题 / 遗留
- 部首区 120 个图示中 90 个有内容空位：“口（）”空括号、“💡 含口的字多与相关”缺关键词、31 处“部首含义”占位文字
  （0a5c0a4f 生成，数据源缺 meaning/semantic）。bushou/data.js 不在负责区，未改；check_anim.js 会给告警。
- 诗词区个别图示文字过长（如“二、成员阵列（名句对谱号）📜 例句…”整段塞进一行 SVG 文本），会溢出，属内容问题。
- 本机无中文字体，拆合动画只做了笔画图形位置/大小的截图检查，文字部件效果需在真机看一眼。
- 字源/组件动画以外：34 个当初因占位符跳过、没有拆合动画的字，现在可以用笔画图形补上，但“冻结清单：新动画”，未做。

## 需要拍板
- 读音不确定（两音都常用，按我的判断排序）：为 wéi、处 chǔ、曲 qǔ、杆 gǎn、舍 shè、挣 zhèng、咽 yān、差 chā、卷 juǎn、
  拧 níng、呀 yā、啦 lā、吧 ba、裳 cháng、撩 liáo、臊 sào、煞 shà、更 gèng、吱 zhī、拗 ào、蛤 há、只 zhǐ。
- “罕用读音”清单（182 字）是我按现代汉语常用度判断的；古文里会遇到的（夫 fú、说 yuè、汤 shāng、将 qiāng 等）没有标罕用。
  雨 yù、语 yù、食 sì、莫 mù、能 nài 这类古文读音标了罕用，若希望古文常见音不降级，请指出。
