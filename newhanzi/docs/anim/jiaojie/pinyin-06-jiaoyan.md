# 拼音区 · 06 内容文件校验脚本（交接）

日期：2026-11-06（负责人：「算了不做特效。你把内容补厚补强」；拼音区补厚第 1 路，框架任务负责写校验）

## 改了什么
- 新增 `tools/check_pinyin_content.js`：校验 `pinyin/content/*.js`（格式见 `pinyin/content/SCHEMA.md`）。
  - 用法：`node newhanzi/tools/check_pinyin_content.js`（查全部）或 `node newhanzi/tools/check_pinyin_content.js newhanzi/pinyin/content/danyunmu.js`（只查一个，写内容时自检用）。
  - **格式**：文件挂 `window.NHZ_PY_CONTENT[id]`，id = 文件名 = 菜单 id；一个文件一个知识点；必填 `name lead src kan ting lian yong`；块 `type` 必须在 SCHEMA 表里，各类型必填字段；`lv` 只能 1/2/3；表格每行格数 = 表头；`quiz-choose.answer` 不越界；scene 的 svg 必须以 `<svg` 开头、不许有脚本/事件属性。
  - **音频**：`play`（chips/groups/pairs）和 `quiz-listen.pool` 必须在 `pinyin/audio/index.js` 里（音节 + 声调，ü 写 v）；`hudu` 必须是 21 个声母之一，文件还没录只汇总提示一行，不算错。
  - **拼音**：`{py:…}` 内联（允许连写 `māma`、`Xī'ān`，自动切成合法音节）、`{zi:…}` 必须是汉字；words / verse / scene 的拼音逐个用 `NHZPinyinSyllable` 解析，且**音节数 = 汉字数**（儿化 r 算「儿」一个字）；`verse.real` 的字必须在句子里、读音能解析；`quiz-mark.items` 必须是不带调的合法音节；`quiz-build` 声母 × 韵母至少拼出一个合法音节。
  - **anim**：kind 只能 tone-road / bump / glide / nasal；框架还没实现的（glide、nasal）必须带 `fallback` 静态说明。
  - **数量下限**：看 ≥3 块、听读 ≥3 块、练 ≥3 种 `quiz-*` 题型、用 ≥2 块；词语 ≥8 个；至少 1 个 verse 且总行数 ≥2；L1/L2/L3 都有块；outline ≤1 块（outline 不计入块数）。
  - 退出码：有错误 1，只有提示 0。
- `tools/check_scripts.js` 末尾接入（CI 已跑 check_scripts）。

## 验证
- 用一个故意写错的样例（缺 fallback、音频键不存在、标调题带调、词语音节数不对、词语不足、儿歌只 1 行）逐条报错；目录里没有内容文件时输出「检查了 0 个知识点文件，全部通过」。
- `node tools/check_scripts.js` 全过。

## 给写内容的子任务
- 写完一个文件先跑 `node newhanzi/tools/check_pinyin_content.js newhanzi/pinyin/content/<id>.js`，0 错误再提交。
- 轻声音节不要写 `play`；韵母单念借零声母音节（i→yi1、ü→yu1、ui→wei1…）。
