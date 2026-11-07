/* 拼音区 · y 和 w（零声母音节的写法）。讲解、例词、儿歌、情境图全部自编；格式见 SCHEMA.md。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['yw'] = {
  id: 'yw', name: 'y 和 w', lv: 'L1–L3',
  lead: 'i、u、ü 打头的音节前面没有声母时，请 y、w 来「开门」：yi wu yu、ya wo yue……y、w 不是声母。',
  src: [
    '统编 2024 一上第 9 课 y w（声母 21 个，y、w 不算声母，单独设课）',
    '《汉语拼音方案》韵母表说明 (4)(5)',
    '人教社《统编小学语文教科书一年级上册拼音单元修订研究》（2025）'
  ],

  kan: [
    {
      type: 'text', lv: 1, h: 'y、w 是开门的小帮手',
      p: [
        'i、u、ü 平时跟在声母后面，比如 {py:bǐ}、{py:dù}、{py:lǜ}。可是有时候前面没有声母，它们要自己出门，这时就请 y、w 来帮忙开门。',
        'i 请 y：{py:yī}；u 请 w：{py:wū}；ü 也请 y，出门时把两点摘下来放好：{py:yú}。读音一点都没变。',
        'y、w 只是开门的，不是声母。2024 年的新课本里，声母是 21 个，不算 y 和 w。'
      ]
    },
    {
      type: 'scene', lv: 1, h: '看图记字母',
      note: '情境图自编，只画物和动物。',
      items: [
        { letter: 'y', thing: '分了叉的小树枝，像 y，枝头挂着一片叶子', word: '叶', py: 'yè',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M60 24 L96 78 M136 24 L96 78 L74 136" fill="none" class="svg-deep-s" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M136 24 C160 14 172 30 162 46 C146 52 134 40 136 24 Z" class="svg-green"/></svg>' },
        { letter: 'w', thing: '小青蛙跳进水里，溅起 w 形的水花', word: '蛙', py: 'wā',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M0 116 Q25 106 50 116 T100 116 T150 116 T200 116 L200 150 L0 150 Z" class="svg-blue" opacity=".35"/><path d="M50 50 L72 100 L96 64 L120 100 L142 50" fill="none" class="svg-blue-s" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="96" cy="118" rx="22" ry="8" class="svg-green"/><circle cx="88" cy="110" r="4" class="svg-green"/><circle cx="104" cy="110" r="4" class="svg-green"/></svg>' },
        { letter: 'yu', thing: '小鱼游出门，头上的两颗泡泡飘走了——ü 去掉两点写成 yu', word: '鱼', py: 'yú',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M50 84 C70 54 120 54 140 84 C120 114 70 114 50 84 Z" class="svg-accent"/><path d="M140 84 L170 64 L170 104 Z" class="svg-accent"/><circle cx="72" cy="80" r="4" class="svg-ink"/><circle cx="64" cy="34" r="8" fill="none" class="svg-blue-s" stroke-width="3" opacity=".6"/><circle cx="86" cy="20" r="6" fill="none" class="svg-blue-s" stroke-width="3" opacity=".4"/></svg>' }
      ]
    },
    {
      type: 'table', lv: 1, h: '开门三句话（看「原来」怎样变成「写成」）',
      head: ['原来', '写成', '怎么变'],
      rows: [
        ['i', '{py:yī}', '前面加 y'],
        ['u', '{py:wū}', '前面加 w'],
        ['ü', '{py:yū}', '前面加 y，摘掉两点'],
        ['ia', '{py:yā}', 'i 改成 y'],
        ['ua', '{py:wā}', 'u 改成 w'],
        ['üe', '{py:yuē}', '前面加 y，摘掉两点']
      ],
      note: '自编口诀：i 自己出门加个 y，后面有伴改成 y；u 自己出门加个 w，后面有伴改成 w；ü 出门总是加 y，两点摘下装口袋。'
    },
    {
      type: 'table', lv: 2, h: '全表：零声母音节怎么写',
      head: ['韵母（完整式）', '自己出门写成', '规则'],
      rows: [
        ['i', '{py:yī}', '加 y'],
        ['in', '{py:yīn}', '加 y'],
        ['ing', '{py:yīng}', '加 y'],
        ['ia', '{py:yā}', 'i 改 y'],
        ['ie', '{py:yē}', 'i 改 y'],
        ['iao', '{py:yāo}', 'i 改 y'],
        ['iou', '{py:yōu}', 'i 改 y'],
        ['ian', '{py:yān}', 'i 改 y'],
        ['iang', '{py:yāng}', 'i 改 y'],
        ['iong', '{py:yōng}', 'i 改 y'],
        ['u', '{py:wū}', '加 w'],
        ['ua', '{py:wā}', 'u 改 w'],
        ['uo', '{py:wō}', 'u 改 w'],
        ['uai', '{py:wāi}', 'u 改 w'],
        ['uei', '{py:wēi}', 'u 改 w'],
        ['uan', '{py:wān}', 'u 改 w'],
        ['uen', '{py:wēn}', 'u 改 w'],
        ['uang', '{py:wāng}', 'u 改 w'],
        ['ueng', '{py:wēng}', 'u 改 w'],
        ['ü', '{py:yū}', '加 y，去两点'],
        ['üe', '{py:yuē}', '加 y，去两点'],
        ['üan', '{py:yuān}', '加 y，去两点'],
        ['ün', '{py:yūn}', '加 y，去两点']
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (4)。iong 的 i 改 y（yong），按书写归 i 行。'
    },
    {
      type: 'text', lv: 2, h: '规则一句话',
      p: [
        'i 行：i、in、ing 前面加 y（yi yin ying）；其余把 i 改成 y（ya ye yao you yan yang yong）。',
        'u 行：u 前面加 w（wu）；其余把 u 改成 w（wa wo wai wei wan wen wang weng）。',
        'ü 行：一律前面加 y，并且省掉两点（yu yue yuan yun）。读的时候还是 ü，不是 u。',
        '注意 you、wei、wen：它们的完整式是 iou、uei、uen。前面有声母时又会省写成 iu、ui、un（{py:liú}、{py:guì}、{py:lún}）——同一个韵母，有声母、没声母写法不一样。'
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (4)(5)。'
    },
    {
      type: 'text', lv: 3, h: '学理：y、w 为什么不是声母',
      p: [
        '普通话里 yi、wu、yu、ya、wa 这些音节开头没有辅音，叫零声母音节。y、w 并不代表一个辅音，它们的作用是让音节的开头清楚、分得开，所以叫隔音字母。',
        '想一想：「大衣」如果不用 y，写成 daī，就容易读成 dāi（呆）；「木屋」如果不用 w，写成 mùū，两个 u 挨在一起分不清。用了 y、w，音节边界一眼就能看出来：{py:dà} {py:yī}、{py:mù} {py:wū}。',
        '老课本把 y、w 算进声母，说声母有 23 个，那是为了教学方便的叫法；《汉语拼音方案》的声母表本来就是 21 个，没有 y、w。2024 年统编一上按方案改成 21 个，把 y、w 单独设课。',
        'ye、yue 里的 e 实际读 ê（嘴角往两边拉开的 e），和单念的 e 不一样；yan 里的 a 实际也读得偏高。这些是音值细节，教学时整体记读音就行。'
      ],
      note: '依据：《汉语拼音方案》声母表、韵母表说明 (3)(4)；人教社一上拼音单元修订研究（2025）。'
    }
  ],

  ting: [
    {
      type: 'chips', lv: 1, h: 'yi wu yu（点一下听，再点出四声）',
      items: [
        { t: 'yī', play: 'yi1', sub: '衣', tones: 'yi' },
        { t: 'wū', play: 'wu1', sub: '乌', tones: 'wu' },
        { t: 'yū', play: 'yu1', tones: 'yu' }
      ],
      note: 'yi wu yu 的读音和单韵母 i u ü 一样，是整体认读音节。'
    },
    {
      type: 'groups', lv: 1, h: '四声读一读',
      groups: [
        { label: 'yi', items: [{ t: 'yī', play: 'yi1', sub: '衣' }, { t: 'yí', play: 'yi2', sub: '姨' }, { t: 'yǐ', play: 'yi3', sub: '椅' }, { t: 'yì', play: 'yi4', sub: '亿' }] },
        { label: 'wu', items: [{ t: 'wū', play: 'wu1', sub: '乌' }, { t: 'wú', play: 'wu2', sub: '无' }, { t: 'wǔ', play: 'wu3', sub: '五' }, { t: 'wù', play: 'wu4', sub: '雾' }] },
        { label: 'yu', items: [{ t: 'yū', play: 'yu1' }, { t: 'yú', play: 'yu2', sub: '鱼' }, { t: 'yǔ', play: 'yu3', sub: '雨' }, { t: 'yù', play: 'yu4', sub: '玉' }] },
        { label: 'ya', items: [{ t: 'yā', play: 'ya1', sub: '鸭' }, { t: 'yá', play: 'ya2', sub: '牙' }, { t: 'yǎ', play: 'ya3', sub: '哑' }, { t: 'yà', play: 'ya4' }] },
        { label: 'wa', items: [{ t: 'wā', play: 'wa1', sub: '蛙' }, { t: 'wá', play: 'wa2', sub: '娃' }, { t: 'wǎ', play: 'wa3', sub: '瓦' }, { t: 'wà', play: 'wa4', sub: '袜' }] }
      ]
    },
    {
      type: 'groups', lv: 2, h: '全家福：y、w 开头的音节（点开出四声）',
      groups: [
        { label: 'y + i 行', items: [{ t: 'yā', play: 'ya1', tones: 'ya' }, { t: 'yē', play: 'ye1', tones: 'ye' }, { t: 'yāo', play: 'yao1', tones: 'yao' }, { t: 'yōu', play: 'you1', tones: 'you' }, { t: 'yān', play: 'yan1', tones: 'yan' }, { t: 'yīn', play: 'yin1', tones: 'yin' }, { t: 'yāng', play: 'yang1', tones: 'yang' }, { t: 'yīng', play: 'ying1', tones: 'ying' }, { t: 'yōng', play: 'yong1', tones: 'yong' }] },
        { label: 'w + u 行', items: [{ t: 'wā', play: 'wa1', tones: 'wa' }, { t: 'wō', play: 'wo1', tones: 'wo' }, { t: 'wāi', play: 'wai1', tones: 'wai' }, { t: 'wēi', play: 'wei1', tones: 'wei' }, { t: 'wān', play: 'wan1', tones: 'wan' }, { t: 'wēn', play: 'wen1', tones: 'wen' }, { t: 'wāng', play: 'wang1', tones: 'wang' }, { t: 'wēng', play: 'weng1', tones: 'weng' }] },
        { label: 'y + ü 行', items: [{ t: 'yuē', play: 'yue1', tones: 'yue' }, { t: 'yuān', play: 'yuan1', tones: 'yuan' }, { t: 'yūn', play: 'yun1', tones: 'yun' }] }
      ],
      note: '复韵母、鼻韵母还没学到的，先听一听、认一认。'
    },
    {
      type: 'pairs', lv: 1, h: '对比听：y 后面是 i 还是 ü',
      pairs: [
        [{ t: 'yí', play: 'yi2' }, { t: 'yú', play: 'yu2' }],
        [{ t: 'yì', play: 'yi4' }, { t: 'yù', play: 'yu4' }],
        [{ t: 'yè', play: 'ye4' }, { t: 'yuè', play: 'yue4' }],
        [{ t: 'yīn', play: 'yin1' }, { t: 'yūn', play: 'yun1' }]
      ],
      tip: 'yu 里的 u 读 ü（嘴唇圆）；yi 嘴角往两边。写的时候都是 y 开头，要靠听嘴唇圆不圆。'
    },
    {
      type: 'pairs', lv: 2, h: '对比听：y 开头还是 w 开头',
      pairs: [
        [{ t: 'yā', play: 'ya1' }, { t: 'wā', play: 'wa1' }],
        [{ t: 'yān', play: 'yan1' }, { t: 'wān', play: 'wan1' }],
        [{ t: 'yáng', play: 'yang2' }, { t: 'wáng', play: 'wang2' }],
        [{ t: 'yǒu', play: 'you3' }, { t: 'wǒ', play: 'wo3' }]
      ],
      tip: 'y 开头嘴角先往两边（像 i），w 开头嘴唇先拢圆（像 u）。'
    },
    {
      type: 'text', lv: 3, h: '录音说明',
      p: [
        '本页所有发音按钮都是带 y、w 的音节录音（yi、wu、yu、ya、wa……），没有借音。',
        'ye、yue 的 e 读 ê；上线前请人耳确认 yē、yuē 的录音收尾没有读成单念的 e。'
      ]
    }
  ],

  lian: [
    {
      type: 'quiz-choose', lv: 1, h: '想一想',
      items: [
        { q: 'y 和 w 是声母吗？', options: ['不是', '是'], answer: 0, why: '2024 年统编一上：声母 21 个，y、w 不算声母，它们是帮 i、u、ü 开门的字母。' },
        { q: 'yu 里的 u，读音像哪个？', options: ['ü', 'u'], answer: 0, why: 'ü 遇到 y 摘掉两点，读音还是 ü。' },
        { q: 'u 自己出门，写成什么？', options: ['wu', 'yu', 'w'], answer: 0, why: 'u 前面加 w，写成 wu。' },
        { q: 'i 自己出门，写成什么？', options: ['yi', 'y', 'wi'], answer: 0, why: 'i 前面加 y，写成 yi。' },
        { q: '「鱼」的拼音哪个写对了？', options: ['yú', 'yǘ', 'ǘ'], answer: 0, why: 'ü 出门加 y，两点要摘掉：yú。' }
      ]
    },
    {
      type: 'quiz-listen', lv: 1, h: '听音选音节',
      pool: ['yi1', 'yi2', 'yi3', 'yi4', 'wu1', 'wu2', 'wu3', 'wu4', 'yu1', 'yu2', 'yu3', 'yu4', 'ya1', 'wa1', 'ye4', 'yue4'],
      ask: 'syllable'
    },
    {
      type: 'quiz-find', lv: 1, h: '找一找：点出所有的 y',
      target: 'y', distract: ['v', 'x', 'u'], n: 12
    },
    {
      type: 'quiz-find', lv: 1, h: '找一找：点出所有的 w',
      target: 'w', distract: ['m', 'v', 'n'], n: 12
    },
    {
      type: 'quiz-choose', lv: 2, h: '还原题：去掉 y、w，原来是哪个韵母（选完整式）？',
      items: [
        { q: 'yu → ?', options: ['ü', 'u', 'iu'], answer: 0, why: 'ü 加 y、去两点写成 yu。' },
        { q: 'wei → ?', options: ['uei', 'ei', 'ui'], answer: 0, why: 'uei 的 u 改成 w。注意：前面有声母时又省写成 ui（如 guì）。' },
        { q: 'you → ?', options: ['iou', 'ou', 'iu'], answer: 0, why: 'iou 的 i 改成 y。有声母时省写成 iu（如 liù）。' },
        { q: 'yun → ?', options: ['ün', 'un', 'in'], answer: 0, why: 'ün 加 y、去两点写成 yun。' },
        { q: 'ying → ?', options: ['ing', 'in', 'eng'], answer: 0, why: 'ing 前面加 y。' },
        { q: 'wen → ?', options: ['uen', 'en', 'un'], answer: 0, why: 'uen 的 u 改成 w；有声母时省写成 un（如 lùn）。' },
        { q: 'yue → ?', options: ['üe', 'ue', 'ie'], answer: 0, why: 'üe 加 y、去两点写成 yue。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 2, h: '改写题：前面没有声母，怎么写？',
      items: [
        { q: 'i + ang（没有声母）写成？', options: ['yang', 'iang', 'yiang'], answer: 0, why: 'i 后面还有字母，把 i 改成 y。' },
        { q: 'u + o（没有声母）写成？', options: ['wo', 'uo', 'wuo'], answer: 0, why: 'u 后面还有字母，把 u 改成 w。' },
        { q: 'ü + an（没有声母）写成？', options: ['yuan', 'üan', 'yüan'], answer: 0, why: 'ü 行一律加 y，并去掉两点。' },
        { q: 'i + n（没有声母）写成？', options: ['yin', 'yn', 'in'], answer: 0, why: 'i、in、ing 是「加 y」，不是改 y。' },
        { q: 'u + ai（没有声母）写成？', options: ['wai', 'uai', 'wuai'], answer: 0, why: '把 u 改成 w。' }
      ]
    },
    {
      type: 'quiz-mark', lv: 2, h: '标调练习：y、w 开头的音节',
      items: ['you', 'wei', 'yue', 'yao', 'wai', 'yuan', 'ying', 'wen', 'yu', 'wo'],
      note: '调号不会标在 y、w 上：它们不是元音。'
    },
    {
      type: 'quiz-choose', lv: 3, h: '深一点',
      items: [
        { q: 'y、w 在拼音里主要起什么作用？', options: ['隔开音节，让开头清楚', '代表一个辅音', '表示声调'], answer: 0, why: 'y、w 是隔音字母，零声母音节用它们开头，音节界限才清楚。' },
        { q: '「大衣」不用 y，写成 daī，容易读成什么？', options: ['dāi', 'dàyī', 'dī'], answer: 0, why: '没有 y 隔开，a 和 i 会连成复韵母 ai。' },
        { q: '《汉语拼音方案》声母表有几个声母？', options: ['21 个', '23 个', '24 个'], answer: 0, why: '方案声母表 21 个，没有 y、w；「23 个」是旧教材把 y、w 算进去的教学说法。' }
      ]
    }
  ],

  yong: [
    {
      type: 'words', lv: 1, h: '读词语（自编，点拼音听，点汉字去字卡）',
      items: [
        { w: '鸭子', py: 'yā zi' },
        { w: '叶子', py: 'yè zi' },
        { w: '乌云', py: 'wū yún' },
        { w: '青蛙', py: 'qīng wā' },
        { w: '游泳', py: 'yóu yǒng' },
        { w: '玩具', py: 'wán jù' },
        { w: '尾巴', py: 'wěi ba' },
        { w: '月亮', py: 'yuè liang' },
        { w: '太阳', py: 'tài yáng' },
        { w: '牙齿', py: 'yá chǐ' },
        { w: '鱼塘', py: 'yú táng' },
        { w: '外衣', py: 'wài yī' }
      ],
      note: '按字标原调；「子」「巴」「亮」在这里读轻声，不可点。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌（自编）', title: '雨停了',
      lines: [
        { w: '乌云走，太阳笑，', py: 'wū yún zǒu, tài yáng xiào,' },
        { w: '青蛙跳上大荷叶。', py: 'qīng wā tiào shàng dà hé yè.' },
        { w: '小鸭游，小鱼摇，', py: 'xiǎo yā yóu, xiǎo yú yáo,' },
        { w: '弯弯月亮挂树梢。', py: 'wān wān yuè liang guà shù shāo.' }
      ],
      note: '读完圈一圈：哪些音节是 y、w 开头的？（云、阳、蛙、叶、鸭、游、鱼、摇、弯、月）'
    },
    {
      type: 'verse', lv: 2, h: '短句：y、w 开门', title: '读一读',
      lines: [
        { w: '我有一件外衣。', py: 'wǒ yǒu yī jiàn wài yī.' },
        { w: '小鱼游到月亮旁边。', py: 'xiǎo yú yóu dào yuè liang páng biān.' }
      ],
      real: { '我': 'wó', '一': 'yí' },
      note: '正文标原调。L2 起显示实际读音：「我有」两个三声相连，「我」读得像 wó；「一件」的「一」在四声前读 yí。'
    }
  ]
};
