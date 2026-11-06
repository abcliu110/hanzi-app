/* 拼音区 · 易混音（yibian）。辨析口诀、例词、绕口短句、情境图全部自编；依据见 src。
 * 格式见 pinyin/content/SCHEMA.md。只引用 pinyin/audio/index.js 里有的音节键。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['yibian'] = {
  id: 'yibian', name: '易混音', lv: 'L1–L3',
  lead: '有的字母长得像，有的音听着像。一组一组摆在一起，比着看、比着听，找到它们不一样的那一点，就不容易混了。',
  src: [
    '《汉语拼音方案》声母表、韵母表',
    '统编 2024 一上第 3–8 课、第 13–14 课；语文园地二「比一比」（b—d、f—t）、语文园地三（z/zh、c/ch、s/sh）',
    '教育部《汉语拼音的教学特色》（送气音用手掌体验；形近字母要借助口诀记形）',
    '人教社《统编小学语文教科书一年级上册拼音单元修订研究》（2025）：b/d/p/q 混淆率 40%–50%、平翘舌错误率 35%–45%（文中所引二手数据）',
    '教育部新闻办 2023 年答复：单韵母 o 可以参考「喔」（ō）的发音'
  ],

  /* ================= 看 ================= */
  kan: [
    { type: 'mirror', lv: 1, h: 'b d p q 照镜子：左右翻、上下翻', base: 'b',
      note: 'b 左右一翻成 d，上下一翻成 p，左右上下都翻成 q。四个字母其实是同一个形状换了方向，所以最容易混。' },

    { type: 'scene', lv: 1, h: '一个字母一个记号：圆圈在哪边',
      items: [
        { letter: 'b', thing: '竖着提手、右下鼓起来的布包', word: '包', py: 'bāo',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M36 12 V86"/><path d="M36 50 Q74 46 74 68 Q74 88 50 88 Q36 88 36 80"/><path d="M48 66 h14" stroke-width="3"/></svg>' },
        { letter: 'd', thing: '左下一颗圆豆子，右边竖着长出豆芽', word: '豆', py: 'dòu',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="46" cy="68" r="18"/><path d="M64 86 V14"/><path d="M64 30 q14 -14 24 -6 q-10 12 -24 6" stroke-width="3"/></svg>' },
        { letter: 'p', thing: '吸管朝下，右上冒出一个圆泡泡', word: '泡', py: 'pào',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M36 16 V90"/><circle cx="56" cy="34" r="18"/><circle cx="82" cy="14" r="5" stroke-width="3"/><circle cx="84" cy="34" r="3" stroke-width="2"/></svg>' },
        { letter: 'q', thing: '左上一个圆气球，绳子从右边垂下来', word: '球', py: 'qiú',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="44" cy="34" r="18"/><path d="M62 30 V90"/><path d="M62 90 q-6 4 -2 8" stroke-width="3"/></svg>' },
        { letter: 'f', thing: '头上弯钩挂风铃，中间一根横杆', word: '风', py: 'fēng',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M44 90 V28 Q44 12 60 12 Q72 12 74 22"/><path d="M28 44 H62"/><path d="M74 22 V30"/><path d="M66 42 Q74 28 82 42 Z" stroke-width="3"/></svg>' },
        { letter: 't', thing: '小桃树：一横是树枝，树干脚下往右弯', word: '桃', py: 'táo',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M44 12 V74 Q44 88 60 88 Q70 88 74 80"/><path d="M26 36 H64"/><path d="M64 36 q8 2 6 12 q-10 2 -10 -6 z" stroke-width="3"/></svg>' }
      ],
      note: '图为自编，只画物。点图看字母和图的形状对一对：圆圈（肚子）在右下是 b，在左下是 d，在右上是 p，在左上是 q。' },

    { type: 'text', lv: 1, h: '自编辨形口诀',
      p: [
        'b d p q：「右下鼓肚 b 布包，左下圆豆 d 发芽；右上冒泡 p 泡泡，左上气球 q 飘飘。」',
        'n 和 u：「n 是小门口朝下，u 是小碗口朝上。」n 上下一翻就是 u，看清门口朝哪儿。',
        'n 和 m：「n 有一个门洞，m 有两个门洞。」',
        'f 和 t：「f 头上弯钩挂风铃，t 脚下弯弯小桃树。」弯钩在上是 f，在下是 t。',
        't 和 l：「t 身上有一横，l 光溜溜一根棍。」'
      ],
      note: '口诀为本页自编。形近字母成对出现的编排见统编一上语文园地二「比一比」。' },

    { type: 'text', lv: 1, h: '自编辨音口诀：听着像的几组',
      p: [
        '送气不送气：「p t k q c ch，出口吹出一口气；b d g j z zh，轻轻出口不吹气。」',
        'n 和 l：「n 走鼻子嗡嗡嗡，l 走舌边溜溜溜。」',
        '平舌翘舌：「z c s 舌头平平躺，zh ch sh 舌尖翘起来。」',
        '前鼻后鼻：「前鼻 n，舌尖往前顶；后鼻 ng，舌根往后缩。」',
        'f 和 h：「f 上牙碰下唇，h 嘴唇不碰气从喉咙来。」',
        'o 和 ou、uo：「o 嘴圆圆不变样，喔喔一口读到底；ou、uo 嘴要变。」',
        'u 和 ü：「u 嘴圆圆往前嘟，i 把嘴唇撮圆就是 ü。」'
      ],
      note: '口诀为本页自编。' },

    { type: 'table', lv: 2, h: '听着像的几组：发音要领',
      head: ['易混的一组', '怎么分', '听一听'],
      rows: [
        ['送气和不送气：b/p d/t g/k j/q z/c zh/ch', '手掌放在嘴前：p t k q c ch 会冲出一股气，叫送气音；b d g j z zh 气很弱，叫不送气音。', '{py:bā} / {py:pā}，{py:dù} / {py:tù}'],
        ['鼻音和边音：n/l', 'n 的气从鼻子出来，捏住鼻子就发不出；l 舌尖抵住上牙床，气从舌头两边出来，捏住鼻子照样能发。', '{py:nán} / {py:lán}，{py:niú} / {py:liú}'],
        ['平舌和翘舌：z/zh c/ch s/sh', 'z c s 舌尖平平地抵住上门牙背后；zh ch sh 舌尖翘起来，抵住上牙床后面硬硬的地方（硬腭前部）。', '{py:zǎo} / {py:zhǎo}，{py:sān} / {py:shān}'],
        ['前鼻和后鼻：an/ang en/eng in/ing', '前鼻音 -n 收尾时舌尖往前抵住上牙床；后鼻音 -ng 收尾时舌头往后缩，舌根抬起来，嘴巴不闭。', '{py:fēn} / {py:fēng}，{py:jīn} / {py:jīng}'],
        ['f 和 h', 'f 上牙轻轻碰下唇；h 嘴唇不碰，气从喉咙后面摩擦出来。', '{py:fēi} / {py:huī}，{py:fú} / {py:hú}'],
        ['o 和 ou、uo', '单韵母 o 读「喔」：嘴唇拢圆，从头到尾嘴形不变；ou「欧」和 uo「窝」都是嘴形会变的复韵母。', '{py:ō} / {py:ōu} / {py:wō}'],
        ['u 和 ü', '两个都圆唇。u 舌头往后缩，嘴唇往前突；ü 舌头在前，和 i 一样，只是把嘴唇撮圆。', '{py:wǔ} / {py:yǔ}，{py:nǔ} / {py:nǚ}']
      ],
      note: '送气音用手掌体验的方法见教育部《汉语拼音的教学特色》；o 的读音依据教育部新闻办 2023 年答复。' },

    { type: 'anim', lv: 2, h: '前鼻音和后鼻音：舌头停在哪儿', kind: 'nasal',
      params: { pairs: [['an', 'ang'], ['en', 'eng'], ['in', 'ing']] },
      fallback: '前鼻音（an en in）：发完元音，舌尖往前抬，抵住上门牙后面的牙床，声音从鼻子出来，收得短。后鼻音（ang eng ing）：发完元音，舌头往后缩，舌根抬起来贴住软腭，嘴巴保持张开，声音从鼻子出来，收得深一些。比着读：{py:fēn}—{py:fēng}，{py:xīn}—{py:xīng}，{py:bān}—{py:bāng}。' },

    { type: 'text', lv: 3, h: '为什么会混：原理和方言',
      p: [
        '送气不是清浊：普通话的 b d g 和 p t k 发音时声带都不振动，都是清辅音，区别只在后面有没有一股强气流。英语里 b 和 p 主要靠声带振不振动来分，所以学过英语的孩子容易把 b 读得「发闷带声」，其实只要读得不送气就对了。',
        '形近字母为什么难：b d p q 是同一个形状翻了方向。生活里一个杯子转个方向还是杯子，所以孩子一开始会觉得它们「是一样的」，要专门训练「方向也算数」。人教社修订研究引用的数据是 b/d/p/q 混淆率 40%–50%（二手数据）。',
        '方言的影响：不少方言没有翘舌音，会把 zh ch sh 读成 z c s；有的方言 n 和 l 不分；有的方言 in/ing、en/eng 不分；还有的方言 f 和 h 会互换。说方言的地方，这几组要多听多比。',
        '单韵母 o：教育部新闻办 2023 年答复，单韵母 o 可以参考「喔」ō 的发音，是舌位半高、舌头靠后、圆唇的元音。bo po mo fo 实际读起来带一点从 u 到 o 的圆唇过渡，这是学者的分析，课本仍写成 bo po mo fo。'
      ],
      note: '方言情况为概括说明，不同地区差别很大。' }
  ],

  /* ================= 听读 ================= */
  ting: [
    { type: 'pairs', lv: 1, h: '送气不送气：手掌放在嘴前听一听、试一试',
      pairs: [
        [{ t: 'bā 八', play: 'ba1' }, { t: 'pā 趴', play: 'pa1' }],
        [{ t: 'dù 肚', play: 'du4' }, { t: 'tù 兔', play: 'tu4' }],
        [{ t: 'gē 哥', play: 'ge1' }, { t: 'kē 科', play: 'ke1' }],
        [{ t: 'jī 鸡', play: 'ji1' }, { t: 'qī 七', play: 'qi1' }],
        [{ t: 'zǎo 早', play: 'zao3' }, { t: 'cǎo 草', play: 'cao3' }],
        [{ t: 'zhuō 桌', play: 'zhuo1' }, { t: 'chuō 戳', play: 'chuo1' }]
      ],
      tip: '每对左边不送气，右边送气。读右边时，手心能感到一股气。' },

    { type: 'pairs', lv: 1, h: 'n 和 l：捏住鼻子试试',
      pairs: [
        [{ t: 'nán 南', play: 'nan2' }, { t: 'lán 蓝', play: 'lan2' }],
        [{ t: 'nǎo 脑', play: 'nao3' }, { t: 'lǎo 老', play: 'lao3' }],
        [{ t: 'niú 牛', play: 'niu2' }, { t: 'liú 流', play: 'liu2' }],
        [{ t: 'nǐ 你', play: 'ni3' }, { t: 'lǐ 里', play: 'li3' }],
        [{ t: 'nù 怒', play: 'nu4' }, { t: 'lù 路', play: 'lu4' }]
      ],
      tip: '捏住鼻子读：n 开头的发不出来，l 开头的照样能读。' },

    { type: 'pairs', lv: 1, h: '平舌和翘舌：舌尖平着还是翘起来',
      pairs: [
        [{ t: 'zāi 栽', play: 'zai1' }, { t: 'zhāi 摘', play: 'zhai1' }],
        [{ t: 'zǎo 早', play: 'zao3' }, { t: 'zhǎo 找', play: 'zhao3' }],
        [{ t: 'cā 擦', play: 'ca1' }, { t: 'chā 叉', play: 'cha1' }],
        [{ t: 'cí 词', play: 'ci2' }, { t: 'chí 池', play: 'chi2' }],
        [{ t: 'sān 三', play: 'san1' }, { t: 'shān 山', play: 'shan1' }],
        [{ t: 'sì 四', play: 'si4' }, { t: 'shì 是', play: 'shi4' }]
      ],
      tip: '左边平舌，右边翘舌。' },

    { type: 'pairs', lv: 1, h: '前鼻和后鼻：收得早还是收得深',
      pairs: [
        [{ t: 'bān 班', play: 'ban1' }, { t: 'bāng 帮', play: 'bang1' }],
        [{ t: 'fēn 分', play: 'fen1' }, { t: 'fēng 风', play: 'feng1' }],
        [{ t: 'jīn 金', play: 'jin1' }, { t: 'jīng 京', play: 'jing1' }],
        [{ t: 'xīn 心', play: 'xin1' }, { t: 'xīng 星', play: 'xing1' }],
        [{ t: 'lín 林', play: 'lin2' }, { t: 'líng 铃', play: 'ling2' }],
        [{ t: 'chuán 船', play: 'chuan2' }, { t: 'chuáng 床', play: 'chuang2' }]
      ],
      tip: '左边前鼻音，右边后鼻音。' },

    { type: 'pairs', lv: 2, h: 'f 和 h、u 和 ü、o 和 ou / uo',
      pairs: [
        [{ t: 'fēi 飞', play: 'fei1' }, { t: 'huī 灰', play: 'hui1' }],
        [{ t: 'fú 福', play: 'fu2' }, { t: 'hú 湖', play: 'hu2' }],
        [{ t: 'wǔ 五', play: 'wu3' }, { t: 'yǔ 雨', play: 'yu3' }],
        [{ t: 'nǔ 努', play: 'nu3' }, { t: 'nǚ 女', play: 'nv3' }],
        [{ t: 'ō 喔', play: 'o1' }, { t: 'ōu 欧', play: 'ou1' }],
        [{ t: 'ō 喔', play: 'o1' }, { t: 'wō 窝', play: 'wo1' }]
      ],
      tip: 'o 的录音来自 audio-cmn 单音节库，是否完全接近「喔」请老师或家长听一下再用。' }
  ],

  /* ================= 练 ================= */
  lian: [
    { type: 'quiz-find', lv: 1, h: '找一找：点出所有的 b', target: 'b', distract: ['d', 'p', 'q'], n: 12 },
    { type: 'quiz-find', lv: 1, h: '找一找：点出所有的 q', target: 'q', distract: ['p', 'b', 'd', 'g'], n: 12 },
    { type: 'quiz-find', lv: 1, h: '找一找：点出所有的 n', target: 'n', distract: ['u', 'm', 'h'], n: 12 },
    { type: 'quiz-find', lv: 2, h: '找一找：点出所有的 f', target: 'f', distract: ['t', 'l', 'j'], n: 12 },

    { type: 'quiz-find', lv: 2, h: '找一找：点出所有翘舌的 sh', target: 'sh', distract: ['s', 'x', 'h'], n: 12 },
    { type: 'quiz-find', lv: 2, h: '找一找：点出所有后鼻韵母 ing', target: 'ing', distract: ['in', 'en', 'ang'], n: 12 },
    { type: 'quiz-find', lv: 2, h: '找一找：点出所有单韵母 o', target: 'o', distract: ['ou', 'uo', 'ao'], n: 12 },

    { type: 'quiz-choose', lv: 1, h: '看形状选字母',
      items: [
        { q: '竖线在左边，圆肚子在右下，是哪个字母？', options: ['b', 'd', 'p', 'q'], answer: 0, why: '右下鼓肚 b 布包。' },
        { q: '圆圈在左下，竖线在右边往上长，是哪个？', options: ['d', 'b', 'q', 'p'], answer: 0, why: '左下圆豆 d 发芽。' },
        { q: '圆圈在右上，竖线在左边往下，是哪个？', options: ['p', 'q', 'b', 'd'], answer: 0, why: '右上冒泡 p 泡泡。' },
        { q: '圆圈在左上，竖线在右边往下，是哪个？', options: ['q', 'p', 'd', 'g'], answer: 0, why: '左上气球 q 飘飘。' },
        { q: '一个门洞，门口朝下，是哪个？', options: ['n', 'u', 'm', 'h'], answer: 0, why: 'n 是小门口朝下；u 是小碗口朝上。' },
        { q: '头上有弯钩，中间一横，是哪个？', options: ['f', 't', 'l', 'j'], answer: 0, why: '弯钩在上是 f，在下是 t。' },
        { q: '把 b 左右翻一下，变成哪个？', options: ['d', 'p', 'q'], answer: 0, why: '左右翻，肚子从右边到了左边：d。' },
        { q: '把 b 上下翻一下，变成哪个？', options: ['p', 'd', 'q'], answer: 0, why: '上下翻，肚子从下面到了上面：p。' }
      ] },

    { type: 'quiz-listen', lv: 1, h: '听音选声母：送气还是不送气', ask: 'initial',
      pool: ['ba1', 'pa1', 'da1', 'ta1', 'du4', 'tu4', 'ge1', 'ke1', 'ji1', 'qi1', 'bu4', 'pu4'] },

    { type: 'quiz-listen', lv: 1, h: '听音选声母：n 还是 l', ask: 'initial',
      pool: ['nan2', 'lan2', 'nao3', 'lao3', 'niu2', 'liu2', 'ni3', 'li3', 'nu4', 'lu4', 'na2', 'la2'] },

    { type: 'quiz-listen', lv: 2, h: '听音选声母：平舌还是翘舌', ask: 'initial',
      pool: ['zai1', 'zhai1', 'zao3', 'zhao3', 'ca1', 'cha1', 'ci2', 'chi2', 'san1', 'shan1', 'si4', 'shi4', 'zu3', 'zhu3'] },

    { type: 'quiz-listen', lv: 2, h: '听音选韵母：前鼻还是后鼻', ask: 'final',
      pool: ['ban1', 'bang1', 'fen1', 'feng1', 'jin1', 'jing1', 'xin1', 'xing1', 'lin2', 'ling2', 'men2', 'meng2'] },

    { type: 'quiz-listen', lv: 2, h: '听音选音节：u 还是 ü', ask: 'syllable',
      pool: ['wu3', 'yu3', 'nu3', 'nv3', 'lu4', 'lv4', 'wu2', 'yu2'] },

    { type: 'quiz-listen', lv: 2, h: '听音选声母：f 还是 h', ask: 'initial',
      pool: ['fei1', 'hei1', 'fu2', 'hu2', 'fan4', 'han4', 'fen1', 'hen1'] },

    { type: 'quiz-listen', lv: 2, h: '听音选韵母：o、ou 还是 uo', ask: 'final',
      pool: ['o1', 'ou1', 'wo1', 'o2', 'ou3', 'wo3'] },

    { type: 'quiz-choose', lv: 3, h: '想一想：为什么不一样',
      items: [
        { q: '普通话里 b 和 p 最主要的区别是什么？', options: ['p 送气，b 不送气', 'b 声带振动，p 不振动', 'b 嘴巴张得大'], answer: 0, why: '普通话的 b、p 都是清辅音，区别在送气。' },
        { q: '捏住鼻子，哪个音还能发出来？', options: ['l', 'n', 'm'], answer: 0, why: 'n、m 是鼻音，气从鼻子出；l 是边音，气从舌头两边出。' },
        { q: '发 zh 的时候，舌尖在哪里？', options: ['翘起来，抵住硬腭前部', '平伸，抵住上门牙背', '缩在下牙后面不动'], answer: 0, why: 'zh ch sh 是翘舌音；z c s 舌尖平伸。' },
        { q: '后鼻音 -ng 收尾时，舌头怎么动？', options: ['往后缩，舌根抬起贴住软腭', '舌尖抵住上牙床', '两片嘴唇闭上'], answer: 0, why: '舌尖抵上牙床是前鼻音 -n；双唇闭上是 m。' },
        { q: '单韵母 o 可以参考哪个字的读音？', options: ['喔', '欧', '窝'], answer: 0, why: '教育部新闻办 2023 年答复：单韵母 o 可以参考「喔」ō。欧是 ou，窝是 uo。' },
        { q: 'i 和 ü 最主要的不同是什么？', options: ['ü 嘴唇撮圆，i 不圆', 'ü 舌头靠后，i 舌头靠前', 'ü 是鼻音'], answer: 0, why: 'i 和 ü 舌位一样，只差圆唇。' },
        { q: '方言区的孩子把「山」读成 sān，是哪一组混了？', options: ['平翘舌', '前后鼻', 'n/l'], answer: 0, why: '山 shān 是翘舌，读成平舌 s 就混了。' }
      ] }
  ],

  /* ================= 用 ================= */
  yong: [
    { type: 'words', lv: 1, h: '读一读：找找易混的音',
      items: [
        { w: '布包', py: 'bù bāo' }, { w: '豆苗', py: 'dòu miáo' }, { w: '皮球', py: 'pí qiú' }, { w: '兔子', py: 'tù zi' },
        { w: '南瓜', py: 'nán guā' }, { w: '蓝天', py: 'lán tiān' }, { w: '老牛', py: 'lǎo niú' }, { w: '森林', py: 'sēn lín' },
        { w: '星星', py: 'xīng xing' }, { w: '春风', py: 'chūn fēng' }, { w: '竹子', py: 'zhú zi' }, { w: '早晨', py: 'zǎo chen' },
        { w: '茶杯', py: 'chá bēi' }, { w: '飞鸟', py: 'fēi niǎo' }, { w: '花朵', py: 'huā duǒ' }, { w: '小鱼', py: 'xiǎo yú' }
      ],
      note: '轻声字（兔子的子、星星的第二个星、竹子的子、早晨的晨）不标调，不可点。' },

    { type: 'verse', lv: 1, h: '比一比，读一读（自编绕口短句）', title: '一句一组',
      lines: [
        { w: '爸爸搬白布，婆婆拍皮球。', py: 'bà ba bān bái bù, pó po pāi pí qiú.' },
        { w: '老牛拉粮，奶奶拿篮。', py: 'lǎo niú lā liáng, nǎi nai ná lán.' },
        { w: '四只小狮子，吃了十个柿子。', py: 'sì zhī xiǎo shī zi, chī le shí gè shì zi.' },
        { w: '春风吹进林，铃铛叮叮响。', py: 'chūn fēng chuī jìn lín, líng dang dīng dīng xiǎng.' }
      ],
      note: '自编。第一句 b/p，第二句 n/l，第三句平舌 s 和翘舌 sh、ch、zh，第四句前鼻和后鼻。先慢读，再读快。' },

    { type: 'verse', lv: 1, h: '儿歌：镜子里的字母', title: '圆圈去哪儿',
      lines: [
        { w: '布包挂在右下边，', py: 'bù bāo guà zài yòu xià biān,' },
        { w: '豆子落在左下边，', py: 'dòu zi luò zài zuǒ xià biān,' },
        { w: '泡泡飘到右上边，', py: 'pào pao piāo dào yòu shàng biān,' },
        { w: '气球飞到左上边。', py: 'qì qiú fēi dào zuǒ shàng biān.' }
      ],
      note: '自编。四句依次对应 b、d、p、q 的圆圈位置。' },

    { type: 'words', lv: 2, h: '成对的词：只差一点点',
      items: [
        { w: '大肚', py: 'dà dù' }, { w: '白兔', py: 'bái tù' }, { w: '牛奶', py: 'niú nǎi' }, { w: '流水', py: 'liú shuǐ' },
        { w: '三本', py: 'sān běn' }, { w: '山顶', py: 'shān dǐng' }, { w: '金鱼', py: 'jīn yú' }, { w: '北京', py: 'běi jīng' },
        { w: '飞机', py: 'fēi jī' }, { w: '灰色', py: 'huī sè' }
      ],
      note: '两两一对：肚/兔（d/t）、牛/流（n/l）、三/山（s/sh）、金/京（in/ing）、飞/灰（f/h）。' }
  ]
};
