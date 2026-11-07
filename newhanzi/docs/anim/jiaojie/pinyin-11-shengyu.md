# 拼音区 · 11 交接剩余项补完（交接）

日期：2026-11-07（负责人：「读设计文档和交接文档，缺的东西补起来」；11-06「不做特效」= 不做 3D/悬浮装饰，教学示意图保持朴素静态 / 简单步进）

## 改了什么
1. **字卡「读一读」改真人发音**（pinyin-10 遗留）：`zika.js` 去掉 Web Speech（`speak()` 已删）。按钮只播第一个读音的 audio-cmn 真人单音节（`NHZPinyinAudio`，如「绿」→ `cmn-lv4.mp3`）；没有录音的读音（轻声 men、de 等）按钮灰掉，写「读一读（暂无录音）」。**词语、例句**：字卡上本来就没有词句朗读按钮，这次没加；要不要给词句配音（edge-tts + 人耳复核，或自录）仍待负责人拍板。
2. **复韵母动程 `anim glide`、前后鼻 `anim nasal` 做成静态步进示意图**（pinyin-08 遗留），只画器官线条和箭头，不画人脸：
   - glide：左「嘴张多大」（开口椭圆，虚线是起点口形）、右「舌头在哪儿」（舌位梯形，小球 + 箭头从 from 滑到 to）。三步：① 起点 ② 滑过去（ui/iu 显示藏着的 e/o）③ 收住。「▶ 听」播录音并走一遍三步（减少动效时直接到第 3 步）。按 `fuyunmu.js` 的 `params.items`（f/from/to/play/open/round/hidden/note）画；round 不写时按字母推（u ü o 圆唇）。L3 加一句「收尾往往只滑到靠近 i/u 的地方（通行描写）」。
   - nasal：口腔侧剖面（嘴在左）前鼻、后鼻两图并排同步走三步：① 先读元音（软腭抬起，气流从嘴出）② 收尾：舌尖顶牙床 / 舌根贴软腭（红圈标接触点）③ 软腭放下，气流箭头走鼻腔。前鼻、后鼻各一个「▶ 听」。支持 `biyunmu.js` 的对象写法（front/back + 说明）和 `yibian.js` 的数组写法 `[['an','ang'],…]`（录音按韵母单念表自动借 yin/ying 等）。L2 起标「牙床」「软腭」。
   - `fallback` 保留：画不出来（params 缺失或出错）时显示 fallback；画出来时 fallback 收在「看文字说明」折叠里。
   - 舌位、口腔剖面都是**示意图**（通行描写），不是测量值。
3. **听音选韵母判分**（pinyin-content-b 建议）：kp.js `finalAnswer()`——j q x 后的 u 还原成 ü（jué → üe、jūn → ün）；**另修一个已有 bug**：y w 开头的零声母音节以前按书写式判（yǔ 的答案成了「yu」，不在选项里，页面会硬塞一个「yu」选项），现在取韵母本身（yǔ → ü、yún → ün、wèi → ui、yǒu → iu）。单韵母页 u/ü 听音题受影响，校验脚本也查出来了（20 处）。
   - 加回题目：复韵母「听音选韵母」pool 加 jue2 que4 xue2（答 üe）；鼻韵母「听音选韵母」pool 加 jun1 qun2 xun2、options 加 ün；两处 note 改写。
   - `tools/check_pinyin_content.js`：quiz-listen 写了 options 时，逐个检查 pool 音节的标准答案在 options 里（与 kp.js 同一判分口径）；glide/nasal 列为已实现（fallback 不再强制，建议保留）。
4. **拼读机显示同音字**（pinyin-content-a 提的）：quiz-build「碰！」之后，在 3500 字库（`data/pinyin_lookup.js`）里找**主读音**（第一个读音）正好是这个带调音节的字，按识字表册次（`data/grade_map.js`，1上→6下）排序，先显示 16 个、「全部 N 个」展开，每个字链 `zika.html?zi=`。两个数据文件按需加载（本来就在 sw CORE）。只算主读音，多音字的次读音不列（如「把 bà」不会出现在 bà 下）。
5. **字卡拆拼直达具体声母/韵母**（pinyin-10 遗留）：拆拼一行改成三个链接：声母 → `pinyin.html?t=shengmu&k=j`；韵母 → 单/复/鼻韵母页 `&k=<韵母>`（j q x 后 u 按 ü，如「菊」→ `?t=danyunmu&k=ü`；三拼韵母 ia uang… 去拼读页）；「怎么拼 ›」→ 拼读页。整体认读 → `?t=zhengti&k=ri`；y w 开头 → `?t=yw&k=yu`。
   - `pinyin.js` 读 `&k=`，`NHZPinyinKP.render(el, c, m, {focus})` 找当前档位可见的第一个同名芯片：滚到中间、描边（`.kp-focus`），四声芯片自动展开。找不到就停在页首。另导出 `NHZPinyinKP.focus(key)`。
6. **儿化与 verse.real**（pinyin-content-c 第 2、3 条）：
   - 儿化：维持「不播」，不拿基本音节顶替——内联 `{py:huār}`、词语/儿歌里的儿化音节加虚下划线 + 提示「儿化没有录音，不播」；情境卡点 `py:'huār'` 也不再播 hua1（之前会播）。「儿化：先听基本音」那组芯片本来就写明是基本音，没动。
   - `verse.real` 支持数组，按全首出现顺序：`real:{'一':['yì','yí','']}`，`''` = 这一处读原调不标；字符串写法照旧（每处都标）。各行共用计数。校验脚本同步（数组长度不能超过出现次数）。现有 12 个文件的 real 逐条核过（一、不、小、我、只、买 的变调都对），没有需要改成数组的。
7. **L3 变调小路拥挤**（pinyin-09 遗留）：`.road.mini` 在 L3 不画右侧小调形，刻度只标 1/3/5、字号 10px，调值改为右上角 13px。

文档：`pinyin/content/SCHEMA.md` 补了 glide/nasal params、real 数组、`&k=` 直达、听音选韵母判分口径。

## 验证
- `tests/pinyin.spec.js` 19/19（新增 7 个：glide 步进/听/藏字母、nasal 两图步进/接触点/气流/数组写法、听音选韵母 ü 还原与零声母、字卡读一读真人音 + 无录音禁用 + 不调 Web Speech、拆拼直达 + `&k=` 描边展开、拼读机同音字、儿化不播 + real 数组 + L3 小路）。
- `tests/smoke.spec.js` 中 zika / pinyin / sw / 768·1280 无溢出 108 项通过。
- `node tools/check_pinyin_content.js` 12 个文件全过（2 条提示：呼读音未录）；`node tools/check_scripts.js` 全过；`python3 tools/gen_sw_core.py` 已重跑。
- 截图（仓库外）：`/workspace/work/shots-py-rest/`（glide / nasal / 拼读机同音字 / 声母页 &k=zh 直达 / 字卡「菊」拆拼 / L3 变调小路，各 768、1280），页面无报错、无横向溢出。

## 没做（需负责人拍板）
- 21 个声母呼读音录音（`pinyin/audio/hudu/`）。
- zh ch sh r 情境图是否换成更像字母的物件。
- 声母页是否拆成分课子页。
- 其他模块改容器查询。
- 字卡与拼音区的词语、例句是否配真人/edge-tts 录音（这次只改了单字）。

## 已知 / 以后
- 同音字只按主读音；要不要把次读音也列（标「多音」）可再定。
- 舌位梯形、口腔剖面坐标是手写示意，若负责人要更精确的侧剖面，可另画。
- 「直达」找的是芯片文字；三拼韵母（ia、uang 等）在拼读页没有同名芯片，只停在页首。
