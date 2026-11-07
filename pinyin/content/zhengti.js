/* 拼音区 · 整体认读音节（16 个）。讲解、例词、儿歌、情境图全部自编；格式见 SCHEMA.md。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['zhengti'] = {
  id: 'zhengti', name: '整体认读音节', lv: 'L1–L3',
  lead: 'zhi chi shi ri zi ci si、yi wu yu、ye yue yuan yin yun ying：16 个音节一口气整体读，不拆开拼。',
  src: [
    '统编 2024 一上：zi ci si（第 7 课）、zhi chi shi ri（第 8 课）、yi wu yu（第 9 课）、ye yue（第 12 课）、yuan yin yun（第 13 课）、ying（第 14 课）',
    '《汉语拼音方案》韵母表说明 (1)(4)',
    '教育部《汉语拼音的教学特色》（整体认读是拼音教学三个难点之一）'
  ],

  kan: [
    {
      type: 'text', lv: 1, h: '老朋友，见面直接叫名字',
      p: [
        '有 16 个音节像老朋友，见了面不用一个字母一个字母去拼，直接叫出整个名字就行，这叫整体认读音节。',
        '比如 {py:zhī}：看到它就整个读出来，就像「知道」的「知」；不要读成「zh——衣」。'
      ]
    },
    {
      type: 'scene', lv: 1, h: '看图认音节',
      note: '情境图自编，只画物。',
      items: [
        { letter: 'zhi', thing: '一张折了角的白纸', word: '纸', py: 'zhǐ',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M60 20 L130 20 L150 40 L150 132 L60 132 Z" class="svg-panel"/><path d="M60 20 L130 20 L150 40 L150 132 L60 132 Z" class="svg-muted-s" fill="none" stroke-width="3"/><path d="M130 20 L130 40 L150 40" class="svg-muted-s" fill="none" stroke-width="3"/><line x1="74" y1="60" x2="134" y2="60" class="svg-muted-s" stroke-width="2"/><line x1="74" y1="80" x2="134" y2="80" class="svg-muted-s" stroke-width="2"/><line x1="74" y1="100" x2="120" y2="100" class="svg-muted-s" stroke-width="2"/></svg>' },
        { letter: 'ri', thing: '圆圆的太阳', word: '日', py: 'rì',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><circle cx="100" cy="75" r="30" class="svg-red" opacity=".8"/><path d="M100 22 L100 36 M100 114 L100 128 M47 75 L61 75 M139 75 L153 75 M63 38 L73 48 M127 102 L137 112 M137 38 L127 48 M73 102 L63 112" class="svg-red-s" stroke-width="5" stroke-linecap="round"/></svg>' },
        { letter: 'si', thing: '一个蚕茧，抽出一根长长的丝', word: '丝', py: 'sī',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><ellipse cx="70" cy="78" rx="34" ry="24" class="svg-accent" opacity=".6"/><path d="M102 74 C120 40 140 110 158 70 C168 50 180 60 188 50" fill="none" class="svg-muted-s" stroke-width="2.5"/></svg>' },
        { letter: 'yue', thing: '弯弯的月亮', word: '月', py: 'yuè',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M110 20 C60 30 60 120 110 130 C80 110 80 40 110 20 Z" class="svg-accent"/><circle cx="150" cy="40" r="3" class="svg-accent"/><circle cx="160" cy="90" r="2.5" class="svg-accent"/></svg>' },
        { letter: 'yun', thing: '一朵软软的白云', word: '云', py: 'yún',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M50 100 C30 100 30 72 54 72 C56 48 90 44 100 64 C110 46 146 50 146 74 C170 74 170 100 150 100 Z" class="svg-blue" opacity=".35"/><path d="M50 100 C30 100 30 72 54 72 C56 48 90 44 100 64 C110 46 146 50 146 74 C170 74 170 100 150 100 Z" fill="none" class="svg-blue-s" stroke-width="3"/></svg>' }
      ]
    },
    {
      type: 'table', lv: 1, h: '拆开会错：为什么要整体读',
      head: ['音节', '硬拆开读', '会变成', '应该'],
      rows: [
        ['{py:zhī}', 'zh——衣', '一个怪怪的音，不是「知」', '整个读「知」'],
        ['{py:sì}', 's——衣', '一个普通话里没有的音', '整个读「四」'],
        ['{py:rì}', 'r——衣', '不是「日」', '整个读「日」'],
        ['{py:yī}', 'y——衣', 'y 自己不发音，拆了没意思', '整个读「衣」'],
        ['{py:yuè}', 'y——ü——è', '读得断断续续', '整个读「月」']
      ],
      note: 'zhi chi shi ri zi ci si 里的 i 不读「衣」，它只是占个位置，所以没法拆。'
    },
    {
      type: 'table', lv: 2, h: '16 个分三类',
      head: ['类', '音节', '特点'],
      rows: [
        ['第一类（7 个）', 'zhi chi shi ri zi ci si', '声母后面的 i 不读「衣」，读的是声母本身拉长的音'],
        ['第二类（3 个）', 'yi wu yu', 'i、u、ü 自己成音节，加上 y、w（ü 去两点），读音就是 i、u、ü'],
        ['第三类（6 个）', 'ye yue yuan yin yun ying', 'y 开头，读音和对应的韵母 ie、üe、üan、in、ün、ing 一样']
      ],
      note: '课本里按课出现：第 7 课 zi ci si，第 8 课 zhi chi shi ri，第 9 课 yi wu yu，第 12 课 ye yue，第 13 课 yuan yin yun，第 14 课 ying。'
    },
    {
      type: 'text', lv: 2, h: '哪些 y、w 开头的不算整体认读',
      p: [
        'ya、yao、you、yan、yang、yong、wa、wo、wai、wei、wan、wen、wang、weng 也是 y、w 开头，但课本把它们当作可以拼读的音节（如 y–ā→{py:yā}），不在 16 个里面。',
        '标调时，整体认读音节的调号照样按规则标：{py:zhǐ}、{py:yǐ} 标在 i 上并去掉点，{py:yuè}、{py:yè} 标在 e 上，{py:yún} 标在 u 上。'
      ]
    },
    {
      type: 'text', lv: 3, h: '学理：-i 是舌尖元音；「整体认读」是教学说法',
      p: [
        '《汉语拼音方案》韵母表说明 (1)：「知、蚩、诗、日、资、雌、思」等七个音节的韵母用 i。这个 i 不是「衣」，是舌尖元音：zi ci si 里是舌尖前元音（舌尖靠近上齿背），zhi chi shi ri 里是舌尖后元音（舌尖翘起），学理上常记作 -i。它只出现在这七个声母后面，从不单独出现，所以教学时干脆整个记。',
        '「整体认读音节」是语文教学的分类，《汉语拼音方案》里没有这个术语。方案只规定写法：i、u、ü 行自成音节时用 y、w（说明 (4)）。',
        'ye 的 e 实际读 ê，yuan 里的 a 实际偏向 ê，yun 的韵腹是 ü：这些读音和字面不完全一致，也是课本让孩子整体记的原因之一。'
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (1)(3)(4)；教育部《汉语拼音的教学特色》：「7 个整体认读音节里的 i 起标调作用，不能拼」。'
    }
  ],

  ting: [
    {
      type: 'groups', lv: 1, h: '按课本顺序听 16 个（点一下听，再点出四声）',
      groups: [
        { label: '第 7 课', items: [{ t: 'zī', play: 'zi1', tones: 'zi' }, { t: 'cī', play: 'ci1', tones: 'ci' }, { t: 'sī', play: 'si1', tones: 'si' }] },
        { label: '第 8 课', items: [{ t: 'zhī', play: 'zhi1', tones: 'zhi' }, { t: 'chī', play: 'chi1', tones: 'chi' }, { t: 'shī', play: 'shi1', tones: 'shi' }, { t: 'rì', play: 'ri4', tones: 'ri' }] },
        { label: '第 9 课', items: [{ t: 'yī', play: 'yi1', tones: 'yi' }, { t: 'wū', play: 'wu1', tones: 'wu' }, { t: 'yū', play: 'yu1', tones: 'yu' }] },
        { label: '第 12 课', items: [{ t: 'yē', play: 'ye1', tones: 'ye' }, { t: 'yuē', play: 'yue1', tones: 'yue' }] },
        { label: '第 13 课', items: [{ t: 'yuān', play: 'yuan1', tones: 'yuan' }, { t: 'yīn', play: 'yin1', tones: 'yin' }, { t: 'yūn', play: 'yun1', tones: 'yun' }] },
        { label: '第 14 课', items: [{ t: 'yīng', play: 'ying1', tones: 'ying' }] }
      ],
      note: '16 个都有真人录音，四声齐全。ri 常用字读四声（日），这里先放 rì。'
    },
    {
      type: 'groups', lv: 1, h: '四声带字读',
      groups: [
        { label: 'shi', items: [{ t: 'shī', play: 'shi1', sub: '诗' }, { t: 'shí', play: 'shi2', sub: '十' }, { t: 'shǐ', play: 'shi3', sub: '使' }, { t: 'shì', play: 'shi4', sub: '是' }] },
        { label: 'zi', items: [{ t: 'zī', play: 'zi1', sub: '资' }, { t: 'zǐ', play: 'zi3', sub: '紫' }, { t: 'zì', play: 'zi4', sub: '字' }] },
        { label: 'yu', items: [{ t: 'yú', play: 'yu2', sub: '鱼' }, { t: 'yǔ', play: 'yu3', sub: '雨' }, { t: 'yù', play: 'yu4', sub: '玉' }] },
        { label: 'yun', items: [{ t: 'yūn', play: 'yun1', sub: '晕' }, { t: 'yún', play: 'yun2', sub: '云' }, { t: 'yùn', play: 'yun4', sub: '运' }] },
        { label: 'ying', items: [{ t: 'yīng', play: 'ying1', sub: '鹰' }, { t: 'yíng', play: 'ying2', sub: '赢' }, { t: 'yǐng', play: 'ying3', sub: '影' }, { t: 'yìng', play: 'ying4', sub: '硬' }] }
      ],
      note: '只列有常用字的声调（自选字）。'
    },
    {
      type: 'pairs', lv: 2, h: '对比听：翘舌 zhi chi shi 和平舌 zi ci si',
      pairs: [
        [{ t: 'zhī', play: 'zhi1' }, { t: 'zī', play: 'zi1' }],
        [{ t: 'chī', play: 'chi1' }, { t: 'cī', play: 'ci1' }],
        [{ t: 'shī', play: 'shi1' }, { t: 'sī', play: 'si1' }],
        [{ t: 'zhì', play: 'zhi4' }, { t: 'zì', play: 'zi4' }],
        [{ t: 'shì', play: 'shi4' }, { t: 'sì', play: 'si4' }]
      ],
      tip: '翘舌：舌尖往上翘；平舌：舌尖平平地抵住上牙背。'
    },
    {
      type: 'pairs', lv: 2, h: '对比听：y 后面是 i 还是 ü',
      pairs: [
        [{ t: 'yē', play: 'ye1' }, { t: 'yuē', play: 'yue1' }],
        [{ t: 'yīn', play: 'yin1' }, { t: 'yūn', play: 'yun1' }],
        [{ t: 'yì', play: 'yi4' }, { t: 'yù', play: 'yu4' }]
      ],
      tip: '带 u 的（yue yun yu）嘴唇是圆的，读的是 ü。'
    },
    {
      type: 'text', lv: 3, h: '录音说明',
      p: [
        '本页 16 个音节都用 audio-cmn 真人音节录音，没有借音。',
        '上线前请人耳确认：rī、rí、rǐ 不是常用字音，录音是否自然；yē、yuē 的 e 是否读成 ê。'
      ]
    }
  ],

  lian: [
    {
      type: 'quiz-choose', lv: 1, h: '分一分：整体认读，还是拼着读？',
      items: [
        { q: 'zhi', options: ['整体认读', '拼着读'], answer: 0, why: 'zhi 是整体认读，i 不读「衣」。' },
        { q: 'zha', options: ['整体认读', '拼着读'], answer: 1, why: 'zh–ā→zhā，要拼。' },
        { q: 'ji', options: ['整体认读', '拼着读'], answer: 1, why: 'j–ī→jī，这里的 i 读「衣」，可以拼。' },
        { q: 'you', options: ['整体认读', '拼着读'], answer: 1, why: 'you 不在 16 个里面，课本当作拼读音节。' },
        { q: 'yue', options: ['整体认读', '拼着读'], answer: 0, why: 'yue 是整体认读（第 12 课）。' },
        { q: 'ying', options: ['整体认读', '拼着读'], answer: 0, why: 'ying 是整体认读（第 14 课）。' },
        { q: 'wa', options: ['整体认读', '拼着读'], answer: 1, why: 'wa 可以 w–ā 拼着读，不在 16 个里面。' },
        { q: 'si', options: ['整体认读', '拼着读'], answer: 0, why: 'si 是整体认读，i 不读「衣」。' },
        { q: 'ri', options: ['整体认读', '拼着读'], answer: 0, why: 'ri 是整体认读。' },
        { q: 'qu', options: ['整体认读', '拼着读'], answer: 1, why: 'q–ǖ→qū，u 其实是去了两点的 ü，可以拼。' },
        { q: 'yuan', options: ['整体认读', '拼着读'], answer: 0, why: 'yuan 是整体认读（第 13 课）。' },
        { q: 'yang', options: ['整体认读', '拼着读'], answer: 1, why: 'yang 不在 16 个里面。' }
      ]
    },
    {
      type: 'quiz-listen', lv: 1, h: '听音选音节（16 个整体认读）',
      pool: ['zhi1', 'chi1', 'shi1', 'ri4', 'zi1', 'ci1', 'si1', 'yi1', 'wu1', 'yu2', 'ye4', 'yue4', 'yuan2', 'yin1', 'yun2', 'ying1'],
      ask: 'syllable'
    },
    {
      type: 'quiz-find', lv: 1, h: '找一找：点出所有的 zh',
      target: 'zh', distract: ['z', 'ch', 'sh'], n: 12
    },
    {
      type: 'quiz-listen', lv: 2, h: '平舌还是翘舌？听音选声母',
      pool: ['zhi1', 'zhi4', 'zi1', 'zi4', 'chi1', 'chi2', 'ci2', 'ci4', 'shi2', 'shi4', 'si1', 'si4'],
      ask: 'initial', options: ['zh', 'z', 'ch', 'c', 'sh', 's']
    },
    {
      type: 'quiz-mark', lv: 2, h: '标调练习',
      items: ['zhi', 'shi', 'ri', 'yi', 'yun', 'ying', 'yue', 'yuan', 'ye', 'ci'],
      note: '口诀「有 a 不放过，没有 a 找 o e，i u 并列标在后」引自教育部《汉语拼音的教学特色》。'
    },
    {
      type: 'quiz-choose', lv: 3, h: '深一点',
      items: [
        { q: 'zhi 里的 i，学理上是什么音？', options: ['舌尖元音 -i', '和「衣」一样的 i', '不发音'], answer: 0, why: '方案韵母表说明 (1)：知蚩诗日资雌思的韵母写成 i，实际是舌尖元音。' },
        { q: '「整体认读音节」这个说法出自哪里？', options: ['语文教学的分类', '《汉语拼音方案》原文', '字典的规定'], answer: 0, why: '方案原文没有「整体认读」这个术语，它是教学上的分类。' },
        { q: 'zi 和 zhi 的 i，舌头有什么不同？', options: ['zi 舌尖平，zhi 舌尖翘', '一样', 'zi 舌头更低'], answer: 0, why: 'zi ci si 是舌尖前元音，zhi chi shi ri 是舌尖后元音。' }
      ]
    }
  ],

  yong: [
    {
      type: 'words', lv: 1, h: '读词语（自编，点拼音听，点汉字去字卡）',
      items: [
        { w: '白纸', py: 'bái zhǐ' },
        { w: '吃饭', py: 'chī fàn' },
        { w: '老师', py: 'lǎo shī' },
        { w: '日出', py: 'rì chū' },
        { w: '写字', py: 'xiě zì' },
        { w: '蚕丝', py: 'cán sī' },
        { w: '雨衣', py: 'yǔ yī' },
        { w: '树叶', py: 'shù yè' },
        { w: '公园', py: 'gōng yuán' },
        { w: '音乐', py: 'yīn yuè' },
        { w: '白云', py: 'bái yún' },
        { w: '老鹰', py: 'lǎo yīng' },
        { w: '刺猬', py: 'cì wei' },
        { w: '五个', py: 'wǔ gè' }
      ],
      note: '按字标原调；「刺猬」的「猬」读轻声，不可点。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌（自编）', title: '写日记',
      lines: [
        { w: '太阳出，日子新，', py: 'tài yáng chū, rì zi xīn,' },
        { w: '拿出白纸写个字。', py: 'ná chū bái zhǐ xiě gè zì.' },
        { w: '树叶黄，月亮圆，', py: 'shù yè huáng, yuè liang yuán,' },
        { w: '老鹰飞过白云边。', py: 'lǎo yīng fēi guò bái yún biān.' }
      ],
      note: '找一找：日、子、纸、字、叶、月、圆、鹰、云是整体认读音节。'
    },
    {
      type: 'verse', lv: 2, h: '短句：平舌翘舌分清楚', title: '读一读',
      lines: [
        { w: '小狮子吃了四个柿子。', py: 'xiǎo shī zi chī le sì gè shì zi.' },
        { w: '紫色的蚕丝织成字。', py: 'zǐ sè de cán sī zhī chéng zì.' }
      ],
      note: '狮 shī、吃 chī、柿 shì、织 zhī 是翘舌；子（这里读轻声 zi）、四 sì、紫 zǐ、丝 sī、字 zì 是平舌。慢慢读，再加快。'
    }
  ]
};
