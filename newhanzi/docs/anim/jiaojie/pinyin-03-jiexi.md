# 拼音区 · 03 音节解析器与合法音节表（交接）

日期：2026-11-06

## 改了什么
- `pinyin/syllable.js`（浏览器 `window.NHZPinyinSyllable`；node `require`）：
  - `parse('guì')` → 声母 `initial`、韵母完整式 `final`（uei）和书写式 `finalWritten`（ui）、介母/韵腹/韵尾（按书写字母）、四呼 `hu`、声调 `tone`（轻声 5）、整体认读 `wholeRead`、零声母 `zeroInitial`、`yw`、还原记录 `restore`、调号实际/应在位置、儿化 `erhua`、`legal`、叹词 `interjection`、音频名 `audio`（如 `nv3`、`qu4`）、`errors`。
  - 还原：yu→ü、yi→i、y→i、wu→u、w→u；j q x 后 u→ü；iu→iou、ui→uei、un→uen；zhi…si 韵母记 `-i`。
  - 标调位置按 GB/T 16159-2012 6.5.1：有 a 标 a，没 a 找 o e，iu/ui 标后一个，单个 i u ü 标自己；m n ng 标在 m/n。
  - 错误码：`empty chars multi_tone tone_position spelling not_legal unknown_final`。spelling 查：jü/qü/xü/yü（应省两点）、nue/lue（应写 nüe/lüe）、非 n l j q x 声母跟 ü。
  - `mark('liu', 2)` → `liú`（给 UI 生成四声按钮用）；`isLegal`、`LEGAL`、`WHOLE_READ`、`FINALS`。
  - 输入可以是调号或数字调（ma3、lv4、lu:4、ma0/ma5）。
- `pinyin/syllables.js`：合法音节表。`main` 415 个＝audio-cmn 文件名去掉 `_` 开头和残留 `*5`，v 写回 ü，jv 并入 ju；`interj` 7 个叹词音节（yo ê m n ng hm hng），解析器认为合法但没有音频。表比教材宽（含 fe fiao cei tei den kei nou rua yai 等），只用来判断拼写能否成立。
- `tools/check_pinyin_syllables.js`：① 解析器自测 23 例 + mark 往返；② 字库 3500 字（`fix_pinyin.py` 用的同一批：`data/index.js` py、`data/pinyin_lookup.js`、`data/zika/<字>.js` 读音.拼音 + 读音.罕用读音）逐条解析、查合法音节和标调位置；③ 合法音节表 ↔ 音频清单一致（每个 main 音节 1–4 声都有）。已接进 `tools/check_scripts.js`，`tests/pinyin.spec.js` 加了 node 校验和浏览器加载两个用例。
- `tools/pinyin_syllable_known.json`：已知问题登记表（只登记不改字库；新问题让 CI 失败，登记过但已修好的也会提醒删表）。目前为空。

## 字库检查结果（2026-11-06）
- 3500 字共 11917 条读音（去重 1201 个带调音节），**全部能解析、都在合法音节表里、调号位置全部符合 6.5.1，没有查出拼写错误**。登记表为空。
- 值得留意但不算错（未改数据）：
  - 叹词音节 2 个没有音频：哟 yo、哼 hng。
  - 轻声读音 49 条（主读音或常用音里的 le、men、de、zi、tou 等，罕用里的 戌 qu、栅 shi），audio-cmn 没有轻声录音，这些点不出声，要靠词语音频。
  - 用到的罕用音节：这 zhèi、谁 shéi、爪 zhuǎ、转 zhuǎi、拽 zhuāi/zhuài、刷 shuà —— 都是词典读音，有音频。
  - 字卡里另有 `unihan拼音` 字段（3527 条），也全部能解析；它不是主数据，没进 CI。
- 合法表里 415 个音节，字库用到 402 个（另有 2 个叹词）；15 个没用到：cei chua den dia ei eng fe fiao kei lo nou nun rua tei yai。

## 验证
- `node tools/check_scripts.js`：全过。
- `PW_NO_SERVER=1 npx playwright test tests/pinyin.spec.js`：5/5 通过。

## 未做 / 以后
- 解析器还没接进字卡（字卡拼音可点拆读是下一步，见调研报告 §5.2）。
- 合法表只判断「音节能不能拼」，不判断「这个音节有没有这个声调的字」（audio-cmn 每个音节都录了四声）。音节总表要显示「只有存在的声调」，还需要从字库/词典反查。
- 「一」「不」变调、上声变调不在解析器里（属语流音变，按 GB/T 6.5.2 字库标原调）。
