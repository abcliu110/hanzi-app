/* 拼音区 · 音节总表（声母 × 韵母）
 * 格式见 pinyin/content/SCHEMA.md。讲解、例词、儿歌全部自编。
 * 表格是生成的（标有 GENERATED 的块），生成方法：
 *   1. 合法音节取 pinyin/syllables.js 的 main（415 个，不含叹词），逐个用 pinyin/syllable.js 的 parse() 得到
 *      声母 initial 和完整式韵母 final（iu→iou、ui→uei、un→uen 已还原；ju 的 u 已还原为 ü），放进「声母 × 韵母」格子。
 *   2. 韵母按《汉语拼音方案》韵母表的列分四张表：第一列（开口，含 -i、er，ong 按《方案》排在这一列）、
 *      i 列（齐齿，iong 按《方案》排在这一列）、u 列（合口）、ü 列（撮口）。只有一行全空的声母不列。
 *      yai（崖的旧读）是 iai 韵母，表里没有这一列，只在 L3 说明里提到。
 *   3. 每格显示书写式加调号，再配一个字：在 3500 个有字卡的常用字（ziku/pinyin.csv 前 3500 行、data/zika/<字>.js 存在）里，
 *      找主读音是这个音节的字，按统编教材识字表首次出现的册次（data/grade_map.js）优先、同册按出现顺序，取第一个；
 *      调号就用这个字的声调。3500 字里没有字的音节标「·罕」并用第一声；只有轻声字的（me 么、ne 呢）写成不可点的「轻声」。
 *   4. L1 小表：声母 b–x × 单韵母 a o e i u ü，只给一年级识字表（1上、1下）里的字；罕用音节（lo 等）显示为「—」。
 *   所有可点的 {py:} 都已核对 pinyin/audio/index.js 有对应音频键（audio-cmn 415 个音节 × 四声都有录音）。
 *   重新生成：按以上规则用 node 读这三个文件即可（脚本见交接文档 docs/anim/jiaojie/pinyin-content-b.md）。
 * 依据：《汉语拼音方案》韵母表；pinyin/syllables.js 合法音节表；统编 2024 一上第 3–14 课。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['yinjiebiao'] = {
  id: 'yinjiebiao', name: '音节总表', lv: 'L1–L3',
  lead: '声母竖着站，韵母横着排，交叉的格子就是音节。有拼音的格子能拼，「—」的格子不能拼；空格背后都有规律。',
  src: ['《汉语拼音方案》韵母表', 'pinyin/syllables.js 合法音节 415 个（+7 叹词）', '统编 2024 一上第 3–14 课', '统编教材识字表（选字用）'],

  /* ================= 看 ================= */
  kan: [
    {
      type: 'text', lv: 1, h: '音节表怎么看',
      p: [
        '最左边一列是<b>声母</b>，最上面一行是<b>韵母</b>。从声母往右走，从韵母往下走，两条线碰到的格子，就是它们拼出来的音节：b 碰 a 是 {py:bā}（{zi:八}）。',
        '格子里有拼音的，就<b>能拼</b>，点一点能听；格子里是「—」的，就<b>不能拼</b>，普通话里没有这个音。',
        '先看下面的小表：14 个声母碰 6 个单韵母。'
      ]
    },
    {
      type: 'table', lv: 1, h: '小表：声母 × 单韵母（点拼音听）',
      /* GENERATED:l1 开始（勿手改，见文件头生成方法） */
      head: ['声母', 'a', 'o', 'e', 'i', 'u', 'ü'],
      rows: [
        ['b', '{py:bā} {zi:八}', '{py:bō} {zi:拨}', '—', '{py:bǐ} {zi:笔}', '{py:bù} {zi:步}', '—'],
        ['p', '{py:pà} {zi:怕}', '{py:pó}', '—', '{py:pí} {zi:皮}', '{py:pū}', '—'],
        ['m', '{py:mā} {zi:妈}', '{py:mò}', 'me {zi:么} 轻声', '{py:mǐ} {zi:米}', '{py:mù} {zi:目}', '—'],
        ['f', '{py:fǎ} {zi:法}', '{py:fó}', '—', '—', '{py:fú} {zi:福}', '—'],
        ['d', '{py:dà} {zi:大}', '—', '{py:dé} {zi:得}', '{py:dì} {zi:地}', '{py:dú} {zi:读}', '—'],
        ['t', '{py:tā} {zi:他}', '—', '{py:tè}', '{py:tī} {zi:踢}', '{py:tǔ} {zi:土}', '—'],
        ['n', '{py:nǎ} {zi:哪}', '—', 'ne {zi:呢} 轻声', '{py:nǐ} {zi:你}', '{py:nǔ}', '{py:nǚ} {zi:女}'],
        ['l', '{py:là} {zi:落}', '—', '{py:lè} {zi:乐}', '{py:lì} {zi:力}', '{py:lù} {zi:路}', '{py:lǜ} {zi:绿}'],
        ['g', '{py:gà}', '—', '{py:gē} {zi:哥}', '—', '{py:gǔ} {zi:古}', '—'],
        ['k', '{py:kǎ} {zi:卡}', '—', '{py:kě} {zi:可}', '—', '{py:kū} {zi:哭}', '—'],
        ['h', '{py:hā}', '—', '{py:hé} {zi:禾}', '—', '{py:hú} {zi:胡}', '—'],
        ['j', '—', '—', '—', '{py:jí} {zi:级}', '—', '{py:jù} {zi:句}'],
        ['q', '—', '—', '—', '{py:qī} {zi:七}', '—', '{py:qù} {zi:去}'],
        ['x', '—', '—', '—', '{py:xī} {zi:西}', '—', '{py:xǔ} {zi:许}']
      ],
      /* GENERATED:l1 结束 */
      note: '格子里的字是一年级识字表里的字。me（么）、ne（呢）平常读轻声，没有录音。'
    },
    {
      type: 'text', lv: 1, h: '小表里藏着的秘密',
      p: [
        '<b>j q x 很挑朋友</b>：只和 i、ü 拼，不和 a o e u 拼。和 ü 拼的时候，两点去掉：{py:jù}、{py:qù}、{py:xǔ}。',
        '<b>g k h 正好相反</b>：不和 i、ü 拼。所以没有 gi、ki、hi。',
        '<b>f 不和 i 拼</b>：有 {py:fú}，没有 fi。',
        '<b>和 ü 拼的声母很少</b>：b p m f d t g k h 都不和 ü 拼，只有 n、l 和 j q x。n、l 后面的 ü 要带两点：{py:nǚ}（{zi:女}）、{py:lǜ}（{zi:绿}）。'
      ]
    },
    {
      type: 'table', lv: 2, h: '四呼规律：哪组声母和哪类韵母拼',
      head: ['声母', '开口呼（a o e 开头）', '齐齿呼（i 开头）', '合口呼（u 开头）', '撮口呼（ü 开头）'],
      rows: [
        ['b p m', '能', '能', '只有 u：{py:bù} {py:pǔ} {py:mù}', '不能'],
        ['f', '能', '不能（fiao 是罕用口语音）', '只有 u：{py:fú}', '不能'],
        ['d t', '能', '能', '能', '不能'],
        ['n l', '能', '能', '能', '能：{py:nǚ} {py:lüè}'],
        ['g k h', '能', '不能', '能', '不能'],
        ['j q x', '不能', '能', '不能', '能（写成 ju qu xu）'],
        ['zh ch sh r', '能', '不能', '能', '不能'],
        ['z c s', '能', '不能', '能', '不能'],
        ['零声母', '{py:ān} {py:ò} {py:ér}', '写 y：{py:yī} {py:yā}', '写 w：{py:wǔ} {py:wā}', '写 yu：{py:yú} {py:yuè}']
      ],
      note: '四呼按韵母开头的音分：开口呼（不是 i u ü 开头）、齐齿呼（i）、合口呼（u）、撮口呼（ü）。zhi chi shi ri zi ci si 的 i 是 -i，归开口呼。'
    },
    {
      type: 'text', lv: 2, h: '规律有什么用',
      p: [
        '<b>j q x 和 g k h、z c s、zh ch sh 正好「你有我没有」</b>：j q x 只占齐齿、撮口两格；g k h、z c s、zh ch sh r 只占开口、合口两格。所以看到 j q x 后面的 u，一定是 ü，两点省了也不会读错。',
        '<b>n l 两边都能拼</b>，所以 {py:nǚ}（女）和 {py:nǔ}（努）、{py:lǜ}（绿）和 {py:lù}（路）都存在，ü 的两点<b>不能</b>省。',
        '<b>查拼写对不对</b>：写出 gi、fi、jo、bü 这样的音节，一查表就知道写错了。'
      ],
      note: '《汉语拼音方案》韵母表说明 (4)：ü 行韵母跟 j q x 拼时写成 ju qu xu，跟 n l 拼时仍写 nü lü。'
    },
    {
      type: 'text', lv: 3, h: '空格从哪儿来',
      p: [
        '<b>j q x 只拼 i、ü</b>：j q x 的发音部位在舌面前部，舌面前部抬起时，后面自然接 i、ü 一类的音。音韵学的通行说法是：j q x 是由 g k h 和 z c s 在 i、ü 前面变来的（腭化），所以它们分工互补，各占一半格子。',
        '<b>f 不拼 i</b>：f 是上齿碰下唇的唇齿音，普通话里它后面没有 i 介音；fiao（覅）是方言口语字的读音，录在合法音节表里，课本不学。',
        '<b>b p m f 的合口呼只有 u</b>：没有 buo、puo，写成 bo、po；《方案》用 o 记这个音，学界对它带不带 u 介音有讨论。',
        '<b>er 只能单用，ong 不能单用</b>：er 自成音节，不跟声母；ueng 没有声母时写 weng，有声母时都写成 ong。',
        '<b>还有些格子很少见</b>：表里标「·罕」的（fe、dei、den、tei、nou、lo、kei、zhei、shei、cei、cen、ei、eng、fiao、dia、nun、chua、rua）在 3500 个常用字里没有字，多是口语、方言或叹词的读音；yai（崖的旧读）是 iai 韵母，这一列表里没画。'
      ],
      note: '腭化来源为汉语音韵学通行说法；f、bo 的说法见调研报告 §3；罕用音节清单由本表生成脚本对照 3500 字得出。'
    },
    {
      type: 'text', lv: 3, h: '这张表从哪儿来',
      p: [
        '本表的音节来自 App 的合法音节表：415 个基本音节（不带调），来源是 audio-cmn 录音的文件名，去掉普通话里不存在的组合，再和《汉语拼音方案》对过；另有 yo、ê、m、n、ng、hm、hng 7 个叹词音节，不进表。常说普通话有「四百来个基本音节、一千二百多个带调音节」，就是这样算的：不是每个音节四个声调都有字。',
        '表的列按《汉语拼音方案》韵母表排，也就是 35 格的四列。教材把 24 个韵母分成单韵母、复韵母、鼻韵母教，查表时要换一种眼光：iu 在 iou 那一列，ui 在 uei 那一列，un 在 uen 那一列，ju 在 ü 那一列。ong 在《方案》里排在第一列，iong 排在 i 列，按实际读音它们分别属于合口呼、撮口呼。'
      ],
      note: '依据：pinyin/syllables.js 文件说明；《汉语拼音方案》韵母表。'
    }
  ],

  /* ================= 听读 ================= */
  ting: [
    {
      type: 'groups', lv: 1, h: '横着读一行，竖着读一列',
      groups: [
        { label: '横着读：b 这一行', items: [
          { t: 'bā', play: 'ba1', sub: '八' }, { t: 'bō', play: 'bo1', sub: '拨' }, { t: 'bǐ', play: 'bi3', sub: '笔' }, { t: 'bù', play: 'bu4', sub: '步' },
          { t: 'bái', play: 'bai2', sub: '白' }, { t: 'bāo', play: 'bao1', sub: '包' } ] },
        { label: '竖着读：a 这一列', items: [
          { t: 'bā', play: 'ba1', sub: '八' }, { t: 'pà', play: 'pa4', sub: '怕' }, { t: 'mā', play: 'ma1', sub: '妈' }, { t: 'fǎ', play: 'fa3', sub: '法' },
          { t: 'dà', play: 'da4', sub: '大' }, { t: 'tā', play: 'ta1', sub: '他' } ] },
        { label: '竖着读：i 这一列（g k h 没有）', items: [
          { t: 'bǐ', play: 'bi3', sub: '笔' }, { t: 'mǐ', play: 'mi3', sub: '米' }, { t: 'dì', play: 'di4', sub: '地' }, { t: 'nǐ', play: 'ni3', sub: '你' },
          { t: 'qī', play: 'qi1', sub: '七' }, { t: 'xī', play: 'xi1', sub: '西' } ] }
      ]
    },
    {
      type: 'table', lv: 2, h: '开口呼音节（《方案》第一列 + -i、er）',
      /* GENERATED:kai 开始（勿手改，见文件头生成方法） */
      head: ['声母', 'a', 'o', 'e', '-i（zhi 等）', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong'],
      rows: [
        ['b', '{py:bā} {zi:八}', '{py:bō} {zi:拨}', '—', '—', '—', '{py:bái} {zi:白}', '{py:běi} {zi:北}', '{py:bāo} {zi:包}', '—', '{py:bān} {zi:班}', '{py:běn} {zi:本}', '{py:bǎng} {zi:膀}', '{py:bèng} {zi:蹦}', '—'],
        ['p', '{py:pà} {zi:怕}', '{py:pó} {zi:婆}', '—', '—', '—', '{py:pái} {zi:排}', '{py:péi} {zi:赔}', '{py:pǎo} {zi:跑}', '{py:pōu} {zi:剖}', '{py:pàn} {zi:盼}', '{py:pén} {zi:盆}', '{py:pàng} {zi:胖}', '{py:péng} {zi:朋}', '—'],
        ['m', '{py:mā} {zi:妈}', '{py:mò} {zi:漠}', 'me {zi:么} 轻声', '—', '—', '{py:mài} {zi:迈}', '{py:měi} {zi:美}', '{py:máo} {zi:毛}', '{py:móu} {zi:谋}', '{py:mǎn} {zi:满}', '{py:mén} {zi:们}', '{py:máng} {zi:忙}', '{py:měng} {zi:猛}', '—'],
        ['f', '{py:fǎ} {zi:法}', '{py:fó} {zi:佛}', '{py:fē} ·罕', '—', '—', '—', '{py:fēi} {zi:飞}', '—', '{py:fǒu} {zi:否}', '{py:fǎn} {zi:反}', '{py:fēn} {zi:分}', '{py:fàng} {zi:放}', '{py:fēng} {zi:风}', '—'],
        ['d', '{py:dà} {zi:大}', '—', '{py:dé} {zi:得}', '—', '—', '{py:dài} {zi:袋}', '{py:dēi} ·罕', '{py:dāo} {zi:刀}', '{py:dōu} {zi:都}', '{py:dān} {zi:单}', '{py:dēn} ·罕', '{py:dǎng} {zi:党}', '{py:dēng} {zi:灯}', '{py:dōng} {zi:东}'],
        ['t', '{py:tā} {zi:他}', '—', '{py:tè} {zi:特}', '—', '—', '{py:tài} {zi:太}', '{py:tēi} ·罕', '{py:táo} {zi:桃}', '{py:tóu} {zi:头}', '{py:tán} {zi:潭}', '—', '{py:tāng} {zi:汤}', '{py:téng} {zi:疼}', '{py:tōng} {zi:通}'],
        ['n', '{py:nǎ} {zi:哪}', '—', 'ne {zi:呢} 轻声', '—', '—', '{py:nǎi} {zi:奶}', '{py:nèi} {zi:内}', '{py:nào} {zi:闹}', '{py:nōu} ·罕', '{py:nán} {zi:南}', '{py:nèn} {zi:嫩}', '{py:náng} {zi:囊}', '{py:néng} {zi:能}', '{py:nóng} {zi:农}'],
        ['l', '{py:là} {zi:落}', '{py:lō} ·罕', '{py:lè} {zi:乐}', '—', '—', '{py:lái} {zi:来}', '{py:lèi} {zi:泪}', '{py:lǎo} {zi:老}', '{py:lóu} {zi:楼}', '{py:lán} {zi:蓝}', '—', '{py:làng} {zi:浪}', '{py:lěng} {zi:冷}', '{py:lóng} {zi:龙}'],
        ['g', '{py:gà} {zi:尬}', '—', '{py:gē} {zi:哥}', '—', '—', '{py:gǎi} {zi:改}', '{py:gěi} {zi:给}', '{py:gāo} {zi:高}', '{py:gǒu} {zi:狗}', '{py:gǎn} {zi:感}', '{py:gēn} {zi:跟}', '{py:gǎng} {zi:港}', '{py:gēng} {zi:更}', '{py:gōng} {zi:工}'],
        ['k', '{py:kǎ} {zi:卡}', '—', '{py:kě} {zi:可}', '—', '—', '{py:kāi} {zi:开}', '{py:kēi} ·罕', '{py:kào} {zi:靠}', '{py:kǒu} {zi:口}', '{py:kàn} {zi:看}', '{py:kěn} {zi:肯}', '{py:káng} {zi:扛}', '{py:kēng} {zi:坑}', '{py:kōng} {zi:空}'],
        ['h', '{py:hā} {zi:哈}', '—', '{py:hé} {zi:禾}', '—', '—', '{py:hái} {zi:还}', '{py:hēi} {zi:黑}', '{py:hǎo} {zi:好}', '{py:hòu} {zi:后}', '{py:hǎn} {zi:喊}', '{py:hěn} {zi:很}', '{py:háng} {zi:行}', '{py:héng} {zi:恒}', '{py:hóng} {zi:红}'],
        ['zh', '{py:zhā} {zi:查}', '—', '{py:zhè} {zi:这}', '{py:zhǐ} {zi:纸}', '—', '{py:zhāi} {zi:摘}', '{py:zhēi} ·罕', '{py:zhǎo} {zi:找}', '{py:zhōu} {zi:周}', '{py:zhàn} {zi:站}', '{py:zhēn} {zi:真}', '{py:zhāng} {zi:张}', '{py:zhèng} {zi:正}', '{py:zhòng} {zi:众}'],
        ['ch', '{py:chá} {zi:茶}', '—', '{py:chē} {zi:车}', '{py:chǐ} {zi:尺}', '—', '{py:chái} {zi:柴}', '—', '{py:cháo} {zi:朝}', '{py:chǒu} {zi:丑}', '{py:chǎn} {zi:产}', '{py:chén} {zi:尘}', '{py:chǎng} {zi:厂}', '{py:chéng} {zi:成}', '{py:chóng} {zi:虫}'],
        ['sh', '{py:shā} {zi:沙}', '—', '{py:shé} {zi:舌}', '{py:shí} {zi:十}', '—', '{py:shài} {zi:晒}', '{py:shēi} ·罕', '{py:shǎo} {zi:少}', '{py:shǒu} {zi:手}', '{py:shān} {zi:山}', '{py:shēn} {zi:身}', '{py:shàng} {zi:上}', '{py:shēng} {zi:升}', '—'],
        ['r', '—', '—', '{py:rè} {zi:热}', '{py:rì} {zi:日}', '—', '—', '—', '{py:rào} {zi:绕}', '{py:ròu} {zi:肉}', '{py:rán} {zi:然}', '{py:rén} {zi:人}', '{py:ràng} {zi:让}', '{py:rēng} {zi:扔}', '{py:róng} {zi:榕}'],
        ['z', '{py:zá} {zi:砸}', '—', '{py:zé} {zi:泽}', '{py:zì} {zi:字}', '—', '{py:zài} {zi:在}', '{py:zéi} {zi:贼}', '{py:zǎo} {zi:早}', '{py:zǒu} {zi:走}', '{py:zàn} {zi:赞}', '{py:zěn} {zi:怎}', '{py:zāng} {zi:脏}', '{py:zēng} {zi:曾}', '{py:zǒng} {zi:总}'],
        ['c', '{py:cā} {zi:擦}', '—', '{py:cè} {zi:册}', '{py:cí} {zi:词}', '—', '{py:cài} {zi:菜}', '{py:cēi} ·罕', '{py:cǎo} {zi:草}', '{py:còu} {zi:凑}', '{py:cān} {zi:参}', '{py:cēn} ·罕', '{py:cáng} {zi:藏}', '{py:céng} {zi:层}', '{py:cóng} {zi:从}'],
        ['s', '{py:sǎ} {zi:洒}', '—', '{py:sè} {zi:色}', '{py:sì} {zi:四}', '—', '{py:sài} {zi:赛}', '—', '{py:sǎo} {zi:扫}', '{py:sōu} {zi:搜}', '{py:sān} {zi:三}', '{py:sēn} {zi:森}', '{py:sàng} {zi:丧}', '{py:sēng} {zi:僧}', '{py:sòng} {zi:送}'],
        ['零声母（y w）', '{py:ā} {zi:啊}', '{py:ò} {zi:哦}', '{py:è} {zi:饿}', '—', '{py:èr} {zi:二}', '{py:ài} {zi:爱}', '{py:ēi} ·罕', '{py:ǎo} {zi:袄}', '{py:ǒu} {zi:偶}', '{py:ān} {zi:安}', '{py:ēn} {zi:恩}', '{py:áng} {zi:昂}', '{py:ēng} ·罕', '—']
      ],
      /* GENERATED:kai 结束 */
      note: '点拼音听。调号用的是格子里那个字的声调。「·罕」= 3500 个常用字里没有这个音的字。'
    },
    {
      type: 'table', lv: 2, h: '齐齿呼音节（i 开头）',
      /* GENERATED:qi 开始（勿手改，见文件头生成方法） */
      head: ['声母', 'i', 'ia', 'ie', 'iao', 'iou（iu）', 'ian', 'in', 'iang', 'ing', 'iong'],
      rows: [
        ['b', '{py:bǐ} {zi:笔}', '—', '{py:bié} {zi:别}', '{py:biǎo} {zi:表}', '—', '{py:biān} {zi:边}', '{py:bīn} {zi:缤}', '—', '{py:bīng} {zi:冰}', '—'],
        ['p', '{py:pí} {zi:皮}', '—', '{py:piě} {zi:撇}', '{py:piāo} {zi:飘}', '—', '{py:piàn} {zi:片}', '{py:pīn} {zi:拼}', '—', '{py:píng} {zi:萍}', '—'],
        ['m', '{py:mǐ} {zi:米}', '—', '{py:miè} {zi:灭}', '{py:miáo} {zi:苗}', '{py:miù} {zi:谬}', '{py:miàn} {zi:面}', '{py:mín} {zi:民}', '—', '{py:míng} {zi:名}', '—'],
        ['f', '—', '—', '—', '{py:fiāo} ·罕', '—', '—', '—', '—', '—', '—'],
        ['d', '{py:dì} {zi:地}', '{py:diā} ·罕', '{py:dié} {zi:蝶}', '{py:diào} {zi:掉}', '{py:diū} {zi:丢}', '{py:diǎn} {zi:点}', '—', '—', '{py:dīng} {zi:丁}', '—'],
        ['t', '{py:tī} {zi:踢}', '—', '{py:tiě} {zi:铁}', '{py:tiáo} {zi:条}', '—', '{py:tiān} {zi:天}', '—', '—', '{py:tīng} {zi:听}', '—'],
        ['n', '{py:nǐ} {zi:你}', '—', '{py:niē} {zi:捏}', '{py:niǎo} {zi:鸟}', '{py:niú} {zi:牛}', '{py:nián} {zi:年}', '{py:nín} {zi:您}', '{py:niáng} {zi:娘}', '{py:níng} {zi:凝}', '—'],
        ['l', '{py:lì} {zi:力}', '{py:liǎ} {zi:俩}', '{py:liè} {zi:烈}', '{py:liào} {zi:料}', '{py:liù} {zi:六}', '{py:lián} {zi:莲}', '{py:lín} {zi:林}', '{py:liǎng} {zi:两}', '{py:lìng} {zi:令}', '—'],
        ['j', '{py:jí} {zi:级}', '{py:jiā} {zi:家}', '{py:jiě} {zi:姐}', '{py:jiào} {zi:叫}', '{py:jiǔ} {zi:九}', '{py:jiān} {zi:间}', '{py:jīn} {zi:今}', '{py:jiāng} {zi:江}', '{py:jīng} {zi:睛}', '{py:jiǒng} {zi:窘}'],
        ['q', '{py:qī} {zi:七}', '{py:qiā} {zi:掐}', '{py:qiě} {zi:且}', '{py:qiáo} {zi:桥}', '{py:qiū} {zi:秋}', '{py:qián} {zi:前}', '{py:qīn} {zi:亲}', '{py:qiǎng} {zi:抢}', '{py:qīng} {zi:青}', '{py:qióng} {zi:穷}'],
        ['x', '{py:xī} {zi:西}', '{py:xià} {zi:下}', '{py:xiě} {zi:写}', '{py:xiào} {zi:校}', '{py:xiū} {zi:休}', '{py:xiān} {zi:先}', '{py:xīn} {zi:心}', '{py:xiàng} {zi:向}', '{py:xìng} {zi:姓}', '{py:xióng} {zi:熊}'],
        ['零声母（y w）', '{py:yī} {zi:一}', '{py:yā} {zi:鸭}', '{py:yè} {zi:夜}', '{py:yáo} {zi:摇}', '{py:yòu} {zi:右}', '{py:yán} {zi:言}', '{py:yīn} {zi:音}', '{py:yáng} {zi:羊}', '{py:yǐng} {zi:影}', '{py:yòng} {zi:用}']
      ],
      /* GENERATED:qi 结束 */
      note: '没有声母时 i 写成 y 或加 y：yī、yā、yè…… iou 有声母时写成 iu：niú、liù。'
    },
    {
      type: 'table', lv: 2, h: '合口呼音节（u 开头）',
      /* GENERATED:he 开始（勿手改，见文件头生成方法） */
      head: ['声母', 'u', 'ua', 'uo', 'uai', 'uei（ui）', 'uan', 'uen（un）', 'uang', 'ueng'],
      rows: [
        ['b', '{py:bù} {zi:步}', '—', '—', '—', '—', '—', '—', '—', '—'],
        ['p', '{py:pū} {zi:扑}', '—', '—', '—', '—', '—', '—', '—', '—'],
        ['m', '{py:mù} {zi:目}', '—', '—', '—', '—', '—', '—', '—', '—'],
        ['f', '{py:fú} {zi:福}', '—', '—', '—', '—', '—', '—', '—', '—'],
        ['d', '{py:dú} {zi:读}', '—', '{py:duō} {zi:多}', '—', '{py:duì} {zi:对}', '{py:duǎn} {zi:短}', '{py:dūn} {zi:蹲}', '—', '—'],
        ['t', '{py:tǔ} {zi:土}', '—', '{py:tuō} {zi:托}', '—', '{py:tuǐ} {zi:腿}', '{py:tuán} {zi:团}', '{py:tūn} {zi:吞}', '—', '—'],
        ['n', '{py:nǔ} {zi:努}', '—', '{py:nuò} {zi:诺}', '—', '—', '{py:nuǎn} {zi:暖}', '{py:nūn} ·罕', '—', '—'],
        ['l', '{py:lù} {zi:路}', '—', '{py:luò} {zi:骆}', '—', '—', '{py:luàn} {zi:乱}', '{py:lún} {zi:轮}', '—', '—'],
        ['g', '{py:gǔ} {zi:古}', '{py:guā} {zi:瓜}', '{py:guǒ} {zi:果}', '{py:guài} {zi:怪}', '{py:guī} {zi:龟}', '{py:guān} {zi:关}', '{py:gùn} {zi:棍}', '{py:guāng} {zi:光}', '—'],
        ['k', '{py:kū} {zi:哭}', '{py:kuà} {zi:跨}', '{py:kuò} {zi:阔}', '{py:kuài} {zi:快}', '{py:kuí} {zi:葵}', '{py:kuān} {zi:宽}', '{py:kūn} {zi:昆}', '{py:kuáng} {zi:狂}', '—'],
        ['h', '{py:hú} {zi:胡}', '{py:huà} {zi:画}', '{py:huǒ} {zi:火}', '{py:huái} {zi:怀}', '{py:huì} {zi:会}', '{py:huān} {zi:欢}', '{py:hún} {zi:浑}', '{py:huáng} {zi:黄}', '—'],
        ['zh', '{py:zhú} {zi:竹}', '{py:zhuā} {zi:抓}', '{py:zhuō} {zi:桌}', '{py:zhuài} {zi:拽}', '{py:zhuī} {zi:追}', '{py:zhuān} {zi:专}', '{py:zhǔn} {zi:准}', '{py:zhuāng} {zi:装}', '—'],
        ['ch', '{py:chǔ} {zi:处}', '{py:chuā} ·罕', '{py:chuò} {zi:绰}', '{py:chuāi} {zi:揣}', '{py:chuī} {zi:吹}', '{py:chuān} {zi:川}', '{py:chūn} {zi:春}', '{py:chuáng} {zi:床}', '—'],
        ['sh', '{py:shū} {zi:书}', '{py:shuā} {zi:刷}', '{py:shuō} {zi:说}', '{py:shuǎi} {zi:甩}', '{py:shuǐ} {zi:水}', '{py:shuān} {zi:拴}', '{py:shùn} {zi:顺}', '{py:shuāng} {zi:双}', '—'],
        ['r', '{py:rù} {zi:入}', '{py:ruā} ·罕', '{py:ruò} {zi:弱}', '—', '{py:ruì} {zi:锐}', '{py:ruǎn} {zi:软}', '{py:rùn} {zi:润}', '—', '—'],
        ['z', '{py:zú} {zi:足}', '—', '{py:zuò} {zi:坐}', '—', '{py:zuì} {zi:最}', '{py:zuàn} {zi:钻}', '{py:zūn} {zi:遵}', '—', '—'],
        ['c', '{py:cū} {zi:粗}', '—', '{py:cuò} {zi:错}', '—', '{py:cuì} {zi:翠}', '{py:cuàn} {zi:窜}', '{py:cūn} {zi:村}', '—', '—'],
        ['s', '{py:sù} {zi:诉}', '—', '{py:suǒ} {zi:所}', '—', '{py:suī} {zi:虽}', '{py:suàn} {zi:算}', '{py:sūn} {zi:孙}', '—', '—'],
        ['零声母（y w）', '{py:wǔ} {zi:五}', '{py:wā} {zi:蛙}', '{py:wǒ} {zi:我}', '{py:wài} {zi:外}', '{py:wèi} {zi:卫}', '{py:wǎn} {zi:晚}', '{py:wén} {zi:文}', '{py:wáng} {zi:王}', '{py:wēng} {zi:翁}']
      ],
      /* GENERATED:he 结束 */
      note: '没有声母时 u 写成 w 或加 w：wǔ、wā、wǒ…… uei、uen 有声母时写成 ui、un。'
    },
    {
      type: 'table', lv: 2, h: '撮口呼音节（ü 开头）',
      /* GENERATED:cuo 开始（勿手改，见文件头生成方法） */
      head: ['声母', 'ü', 'üe', 'üan', 'ün'],
      rows: [
        ['n', '{py:nǚ} {zi:女}', '{py:nüè} {zi:疟}', '—', '—'],
        ['l', '{py:lǜ} {zi:绿}', '{py:lüè} {zi:掠}', '—', '—'],
        ['j', '{py:jù} {zi:句}', '{py:jué} {zi:觉}', '{py:juān} {zi:鹃}', '{py:jūn} {zi:军}'],
        ['q', '{py:qù} {zi:去}', '{py:què} {zi:雀}', '{py:quān} {zi:圈}', '{py:qún} {zi:群}'],
        ['x', '{py:xǔ} {zi:许}', '{py:xué} {zi:学}', '{py:xuǎn} {zi:选}', '{py:xún} {zi:寻}'],
        ['零声母（y w）', '{py:yú} {zi:鱼}', '{py:yuè} {zi:月}', '{py:yuán} {zi:原}', '{py:yún} {zi:云}']
      ],
      /* GENERATED:cuo 结束 */
      note: '只有 n l j q x 和零声母。j q x 和 yu 开头时 ü 的两点省掉；n l 后面不省。'
    }
  ],

  /* ================= 练 ================= */
  lian: [
    {
      type: 'quiz-choose', lv: 1, h: '能不能拼？',
      items: [
        { q: 'g + i 能拼吗？', options: ['不能', '能'], answer: 0, why: 'g k h 不和 i、ü 拼，表里 g 的 i 格是「—」。' },
        { q: 'j + a 能拼吗？', options: ['不能', '能'], answer: 0, why: 'j q x 只和 i、ü 拼。「家」是 jiā，中间有 i。' },
        { q: 'f + i 能拼吗？', options: ['不能', '能'], answer: 0, why: 'f 不和 i 拼。{py:fú}（福）可以。' },
        { q: 'b + ü 能拼吗？', options: ['不能', '能'], answer: 0, why: '和 ü 拼的声母只有 n l j q x。' },
        { q: 'n + ü 能拼吗？', options: ['能', '不能'], answer: 0, why: '{py:nǚ}（女），ü 的两点要写。' },
        { q: 'x + ü 能拼吗？', options: ['能', '不能'], answer: 0, why: '{py:xǔ}，写的时候去掉两点：xu。' },
        { q: 'zh + i 能拼吗？', options: ['能', '不能'], answer: 0, why: '{py:zhǐ}（纸）是整体认读音节，这里的 i 不读 i。' },
        { q: 'd + u 能拼吗？', options: ['能', '不能'], answer: 0, why: '{py:dú}（读）。' },
        { q: 'k + ü 能拼吗？', options: ['不能', '能'], answer: 0, why: 'g k h 不和 ü 拼。' },
        { q: 'q + u 写成 qu，里面的 u 读什么？', options: ['ü', 'u'], answer: 0, why: 'q 不和 u 拼，所以 qu 的 u 一定是 ü。' },
        { q: 'h + ong 能拼吗？', options: ['能', '不能'], answer: 0, why: '{py:hóng}（红）。' },
        { q: 'b + er 能拼吗？', options: ['不能', '能'], answer: 0, why: 'er 不和任何声母拼。' }
      ]
    },
    {
      type: 'quiz-build', lv: 1, h: '拼读机：在表里随便碰（拼不出的会变灰）',
      initials: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'],
      finals: ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'],
      tones: [1, 2, 3, 4]
    },
    {
      type: 'quiz-listen', lv: 2, h: '听音选声母：j q x 还是别的', ask: 'initial',
      pool: ['ji1', 'qi1', 'xi1', 'ju4', 'qu4', 'xu1', 'gu1', 'ku1', 'hu2', 'zhu1', 'chu1', 'shu1', 'jia1', 'qiao2', 'xue2', 'ge1', 'ke3', 'he2'],
      options: ['j', 'q', 'x', 'g', 'k', 'h', 'zh', 'ch', 'sh']
    },
    {
      type: 'quiz-choose', lv: 2, h: '四呼规律',
      items: [
        { q: '哪一组声母只和齐齿呼、撮口呼拼？', options: ['j q x', 'g k h', 'z c s'], answer: 0, why: 'j q x 只拼 i、ü 开头的韵母。' },
        { q: '哪一组声母既能拼 u 也能拼 ü？', options: ['n l', 'd t', 'b p'], answer: 0, why: 'n l 四呼都能拼，所以 nü/nu、lü/lu 都有。' },
        { q: '为什么 ju 的 ü 可以省两点，lü 不可以？', options: ['j 不和 u 拼，l 和 u 也拼', '因为 j 比 l 好写', '规定，没有原因'], answer: 0, why: 'j 后面不会出现 u，省了点不会读错；l 后面 u、ü 都有，必须用两点区分。' },
        { q: '下面哪个音节写错了？', options: ['gi', 'gu', 'ge'], answer: 0, why: 'g 不和 i 拼，普通话里没有 gi。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 3, h: '空格的学理',
      items: [
        { q: 'j q x 和哪两组声母分工互补？', options: ['g k h 和 z c s', 'b p m 和 d t', 'n l 和 r'], answer: 0, why: '通行说法：j q x 是 g k h、z c s 在 i ü 前腭化而来，所以它们的格子一个有、另一个就没有。' },
        { q: 'iong 在《方案》里排在哪一列？按实际读音归哪一呼？', options: ['排在 i 列，归撮口呼', '排在 ü 列，归撮口呼', '排在 i 列，归齐齿呼'], answer: 0, why: '《方案》把 iong 放在 i 列；语音上它以 ü 类音开头，归撮口呼。' },
        { q: '合法音节表里的 415 个是什么？', options: ['不带调的基本音节', '带调音节', '常用汉字'], answer: 0, why: '415 个不带调；乘上实际有字的声调，就是一千多个带调音节。' }
      ]
    }
  ],

  /* ================= 用 ================= */
  yong: [
    {
      type: 'words', lv: 1, h: '读词语，在表里找到它们',
      items: [
        { w: '西瓜', py: 'xī guā' },
        { w: '飞机', py: 'fēi jī' },
        { w: '读书', py: 'dú shū' },
        { w: '书包', py: 'shū bāo' },
        { w: '学校', py: 'xué xiào' },
        { w: '小熊', py: 'xiǎo xióng' },
        { w: '绿草', py: 'lǜ cǎo' },
        { w: '大海', py: 'dà hǎi' },
        { w: '白云', py: 'bái yún' },
        { w: '去玩', py: 'qù wán' }
      ],
      note: '学 xué、熊 xióng、去 qù、云 yún 在撮口呼和齐齿呼那两张表里；绿 lǜ 在撮口呼表 l 那一行，两点不能省。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌', title: '音节表',
      lines: [
        { w: '声母竖着站，韵母横着排，', py: 'shēng mǔ shù zhe zhàn, yùn mǔ héng zhe pái,' },
        { w: '碰一碰，拼一拼，', py: 'pèng yi pèng, pīn yi pīn,' },
        { w: '拼得出来格子亮，', py: 'pīn de chū lái gé zi liàng,' },
        { w: '拼不出来格子白。', py: 'pīn bu chū lái gé zi bái.' }
      ],
      note: '「碰一碰」「拼一拼」中间的「一」、「拼得」的「得」、「拼不出」的「不」、「格子」的「子」都读轻声。'
    },
    {
      type: 'verse', lv: 2, h: '短句：u 还是 ü', title: '比一比',
      lines: [
        { w: '西瓜绿，橘子黄。', py: 'xī guā lǜ, jú zi huáng.' },
        { w: '小熊去学校，小鹿去读书。', py: 'xiǎo xióng qù xué xiào, xiǎo lù qù dú shū.' }
      ],
      note: '绿 lǜ 带两点，鹿 lù 不带；橘 jú、去 qù、学 xué 里的 u 都是 ü，两点省了。'
    }
  ]
};
