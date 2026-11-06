# 拼音区「补厚补强」第 3 路交接：复韵母 · 鼻韵母 · 音节总表

负责人原话：「算了不做特效。你把内容补厚补强」。本路只写内容文件，不改 pinyin.html / pinyin.js / kp.js / zika.css / 校验脚本。

## 交付
| 文件 | 看 | 听读 | 练（题型） | 用 | 词语 | 儿歌/短句 |
|---|---|---|---|---|---|---|
| `pinyin/content/fuyunmu.js` | 7 | 5 | 6 块（listen / mark / build / choose） | 3 | 14 | 1 首 4 行 + 短句 2 行 |
| `pinyin/content/biyunmu.js` | 8 | 6 | 8 块（listen×3 / build / find / choose×3） | 3 | 14 | 1 首 4 行 + 短句 3 行 |
| `pinyin/content/yinjiebiao.js` | 7 | 5 | 5 块（choose×3 / build / listen） | 3 | 10 | 1 首 4 行 + 短句 2 行 |

三个文件 L1/L2/L3 都有块；`node tools/check_pinyin_content.js` 全过（第一次就过，之后又修了一处 quiz-listen 选项问题，见下）。用框架 worktree 的 kp.js 本地渲染过 768/1280 两种宽度：无页面报错，scrollWidth = clientWidth（宽表在 `.tblwrap` 里横向滚动）。

## 内容要点
- **复韵母**：情境卡 9 张（白菜、杯子、乌龟、小猫、小狗、皮球、树叶、月亮、兔子耳朵，只画物和动物）；`anim glide`（params.items：f/from/to/play/open/round/hidden）+ fallback；iou/uei 省写表、标调与 er、ye/yue（L2）；前响/后响/中响表、韵腹弱化与 ao 写法的学理（L3）。成对听 ai/ei、ao/ou、ie/üe、ui/iu、é/ér。
- **鼻韵母**：情境卡 9 张（山、花盆、树林、车轮、白云、糖、台灯、星星、闹钟）；`anim nasal`（params.pairs 前/后 + 部位说明）+ fallback；前后鼻成对听 7 对（L1）+ un/ong、ün/iong（L2）；un=uen、ün 去点、ong 必带声母、yuan yin yun ying（L2）；《方案》35 格四呼表（★ 标教材 24 韵母）、-n/-ng 学理、看声旁记前后鼻（L3）。
- **音节总表**：L1 小表 14 声母 × 单韵母（只配一年级识字表字）；L2 四呼规律表 + 按《方案》四列分的 4 张全表（415 个音节都在格子里，yai 除外，见 L3 说明），每格 `{py:}` 可点 + `{zi:}` 链字卡；L3 空格原因（j q x 腭化互补、f 不拼 i、b p m f 合口只有 u、er/ong）和表的来源。练：「能不能拼」12 题 quiz-choose、全声母拼读机、j q x 听音选声母。

## 录音的借用（都在页面上注明了）
ui→wei、iu→you、ie→ye、üe→yue、in→yin、un→wen、ün→yun、ing→ying（`tones` 也用借的音节）。ong 没有录音：芯片不写 play（显示「无单念录音」），另设「ong 要和声母一起读」块（dong hong long song zhong gong）。

## 音节总表的生成方法（脚本没有提交）
1. `S = require('pinyin/syllable.js')`，`T = require('pinyin/syllables.js')`；对 `T.main` 每个音节 `S.parse(s)`，取 `initial` 和 `final`（完整式，iu/ui/un 已还原，ju 的 u 已还原为 ü），放进 `grid[initial|final]`。
2. 列：开口 `a o e -i er ai ei ao ou an en ang eng ong`；齐齿 `i ia ie iao iou ian in iang ing iong`；合口 `u ua uo uai uei uan uen uang ueng`；撮口 `ü üe üan ün`。行：21 个声母 + 零声母，整行全空的不列。
3. 配字：在 `ziku/pinyin.csv` 前 3500 行（且 `data/zika/<字>.js` 存在）里找主读音等于该音节的字，排序为：`data/grade_map.js` 册次（1上 → 6下）优先，同册按表中顺序，不在识字表的排后。显示 `S.mark(书写式, 那个字的声调)` + `{zi:字}`；没有带调字、只有轻声字的写 `me {zi:么} 轻声`（不可点）；3500 字里没有的写 `{py:…1} ·罕`。
4. L1 小表：b p m f d t n l g k h j q x × a o e i u ü，只给 1上/1下 的字，罕用音节写「—」。
5. 生成结果放在 yinjiebiao.js 的 `/* GENERATED:xx 开始/结束 */` 之间，表头、各行都是普通 table 块。

## 需要框架注意
- `quiz-listen ask:'final'` 按 `finalWritten` 判答案，所以 jue/que/xue/jun/qun/xun 的答案是 ue/un，不是 üe/ün。为此复韵母的 üe 只出 lve4、nve4，鼻韵母的听音题不考 ün（页面已说明）。如果以后要考，建议 kp.js 在 j q x 后把 u 还原成 ü 再比。
- `anim glide`、`anim nasal` 的 params 是我拟的结构，框架实现时可以按需改字段名；fallback 已写好。
- `quiz-find` 的 target/distract 用的是韵母串（ing / in eng ang），kp.js 的找一找按字符串比较，可以用。

## 依据
统编 2024 一上第 10–14 课（韵母分组、整体认读随课出现）；《汉语拼音方案》韵母表及说明 (2)(4)(5)；GB/T 16159-2012 第 6.5.1、6.5.2 条；pinyin/syllables.js；调研报告 /workspace/work/pinyin-research-2026-11-06.md。例词、例句、儿歌、情境图全部自编。腭化、韵腹弱化、ao 写法、ong/iong 归呼的描写是语音学/音韵学的通行说法，只放在 L3，写明「通行说法」。
