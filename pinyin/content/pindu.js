/* 拼音区 · 拼读（两拼、三拼、声介合拼、支架法、直呼）。讲解、例词、儿歌全部自编；格式见 SCHEMA.md。
 * 拼读口诀「前音轻短后音重，两音相连猛一碰」引自教育部《汉语拼音的教学特色》；
 * 三拼口诀「声轻介快韵母响」是通行教学口诀。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['pindu'] = {
  id: 'pindu', name: '拼读', lv: 'L1–L3',
  lead: '声母轻轻短短，一碰韵母就合成一个音节：b–ā→bā，g–u–ā→guā；熟了以后看到音节直接读出来。',
  src: [
    '统编 2024 一上第 3 课起（b–ā→bā 两拼）、第 5 课起（g–u–ā→guā 三拼）',
    '教育部《汉语拼音的教学特色》（翟京华，2018）：「前音轻短后音重，两音相连猛一碰」',
    '调研报告 §3.1：两拼、三拼、声介合拼、支架法、直呼；韵母定调法；音节本位的讨论'
  ],

  kan: [
    {
      type: 'text', lv: 1, h: '小声母轻轻一碰大韵母',
      p: [
        '声母是个小个子，声音又轻又短；韵母是个大个子，声音又响又长。拼的时候，声母轻轻一碰韵母，马上合成一个音节：b–ā→{py:bā}。',
        '中间不能停：读成「b……ā」两个音分开，就拼不成了。',
        '拼读口诀：「前音轻短后音重，两音相连猛一碰。」'
      ],
      note: '口诀引自教育部《汉语拼音的教学特色》。'
    },
    {
      type: 'anim', lv: 1, h: '两拼碰一碰', kind: 'bump',
      params: {
        mode: 'two',
        steps: [
          { parts: [{ t: 'b', hudu: 'b' }, { t: 'ā', play: 'a1' }], result: 'bā', play: 'ba1' },
          { parts: [{ t: 'm', hudu: 'm' }, { t: 'ǎ', play: 'a3' }], result: 'mǎ', play: 'ma3' },
          { parts: [{ t: 'd', hudu: 'd' }, { t: 'ù', play: 'wu4', borrow: 1 }], result: 'dù', play: 'du4' },
          { parts: [{ t: 'l', hudu: 'l' }, { t: 'ǜ', play: 'yu4', borrow: 1 }], result: 'lǜ', play: 'lv4' }
        ]
      },
      fallback: '声母块（小、颜色淡）停一下，立刻冲上韵母块，两块之间不留空，合成一个音节块并播放：b–ā→bā、m–ǎ→mǎ、d–ù→dù、l–ǜ→lǜ。'
    },
    {
      type: 'anim', lv: 2, h: '三拼：中间的介母快快滑过', kind: 'bump',
      params: {
        mode: 'three',
        steps: [
          { parts: [{ t: 'g', hudu: 'g' }, { t: 'u' }, { t: 'ā', play: 'a1' }], result: 'guā', play: 'gua1' },
          { parts: [{ t: 'h', hudu: 'h' }, { t: 'u' }, { t: 'ā', play: 'a1' }], result: 'huā', play: 'hua1' },
          { parts: [{ t: 'x', hudu: 'x' }, { t: 'i' }, { t: 'ā', play: 'a1' }], result: 'xiā', play: 'xia1' },
          { parts: [{ t: 'd', hudu: 'd' }, { t: 'u' }, { t: 'ō', play: 'o1' }], result: 'duō', play: 'duo1' }
        ]
      },
      fallback: '三块排成一行：声母（轻）、介母 i/u/ü（快）、带调韵母（响）。声母冲出，介母一闪而过，撞上韵母合成 guā、huā、xiā、duō。口诀：声轻介快韵母响。'
    },
    {
      type: 'anim', lv: 2, h: '声介合拼：先把声母和介母合在一起', kind: 'bump',
      params: {
        mode: 'merge',
        steps: [
          { parts: [{ t: 'gu' }, { t: 'āng', play: 'ang1' }], result: 'guāng', play: 'guang1' },
          { parts: [{ t: 'ji' }, { t: 'ā', play: 'a1' }], result: 'jiā', play: 'jia1' },
          { parts: [{ t: 'xi' }, { t: 'ǎo', play: 'ao3' }], result: 'xiǎo', play: 'xiao3' },
          { parts: [{ t: 'hu' }, { t: 'ǒ', play: 'o3' }], result: 'huǒ', play: 'huo3' }
        ]
      },
      fallback: '声母和介母先合成一块（gu、ji、xi、hu），再碰带调韵母：gu–āng→guāng、ji–ā→jiā、xi–ǎo→xiǎo、hu–ǒ→huǒ。适合三拼总丢介母的孩子。'
    },
    {
      type: 'anim', lv: 3, h: '直呼：看到音节直接读', kind: 'bump',
      params: {
        mode: 'direct',
        steps: [
          { parts: [{ t: 'b' }, { t: 'ā' }], result: 'bā', play: 'ba1' },
          { parts: [{ t: 'g' }, { t: 'u' }, { t: 'ā' }], result: 'guā', play: 'gua1' },
          { parts: [{ t: 'zh' }, { t: 'uāng' }], result: 'zhuāng', play: 'zhuang1' }
        ]
      },
      fallback: '所有块同时出现、立刻合成一个音节块并播放，不再分步：bā、guā、zhuāng。'
    },
    {
      type: 'table', lv: 2, h: '五种拼读方法',
      head: ['方法', '怎么读', '例子', '什么时候用'],
      rows: [
        ['两拼', '声母 + 韵母，一碰就合', 'b–ā→{py:bā}', '刚开始学'],
        ['三拼', '声母 + 介母 + 韵母，声轻介快韵母响', 'g–u–ā→{py:guā}', '有介母 i、u、ü 的音节'],
        ['声介合拼', '声母和介母先合，再碰韵母', 'gu–āng→{py:guāng}', '三拼总丢介母时'],
        ['支架法', '先摆好声母的口形（不出声），直接发带调韵母', '嘴唇闭好摆 b，发 ā→{py:bā}', '从拼读过渡到直呼'],
        ['直呼', '看到音节直接读出', '{py:zhuāng}', '最终目标']
      ],
      note: '方法名称和做法来自通行教学材料（调研报告 §3.1）；例子自选。'
    },
    {
      type: 'text', lv: 2, h: '支架法和韵母定调法',
      p: [
        '支架法：声母像搭好的架子。读 {py:pō} 时，先把双唇闭好、做出 p 的样子（不出声），然后一张嘴直接读 ō，声母就「带」出来了。这样声母不会拖长。',
        '韵母定调法：先把带调的韵母读准，再和声母拼，声调就跟着韵母走：h–ǔ→{py:hǔ}、m–à→{py:mà}。所以要先熟练读带调韵母（ā á ǎ à）。',
        '三拼最容易丢介母：guā 读成 gā、huā 读成 hā。介母要快，但不能省。'
      ]
    },
    {
      type: 'text', lv: 3, h: '学理：呼读音只是名字，拼的时候用本音',
      p: [
        'b 叫「玻」、d 叫「得」、g 叫「哥」，这是呼读音：为了好叫，在声母后面加了一个元音。真正拼的时候，要用声母本身的音（本音），后面那个元音不能带进去。',
        '如果把呼读音整个带进去，就成了「两个音节拼一个音节」：bō–ā 读出来是「玻啊」，拼不出 bā；bō–ài 也拼不出 bài。有学者因此批评按呼读音拼读的做法，主张少呼读、早直呼。',
        '所以碰撞动画里声母块只停很短，两块之间不留空；呼读音录音要比音节短很多（0.2–0.3 秒），不能拿音节 bō 顶替。',
        '直呼是拼读的目标：熟练以后不再分步，看到 {py:guāng} 就直接读出来。'
      ],
      note: '依据：调研报告 §3.1（史冠新《汉语语音音节本位辨正》的讨论，属学者观点；「两音相连怎样才能猛一碰」，江苏教育研究 2009）。'
    }
  ],

  ting: [
    {
      type: 'groups', lv: 1, h: '两拼三段听：声母（呼读）→ 带调韵母 → 音节',
      groups: [
        { label: 'b–ā→bā', items: [{ t: 'b', hudu: 'b' }, { t: 'ā', play: 'a1' }, { t: 'bā', play: 'ba1' }] },
        { label: 'm–ǎ→mǎ', items: [{ t: 'm', hudu: 'm' }, { t: 'ǎ', play: 'a3' }, { t: 'mǎ', play: 'ma3' }] },
        { label: 'h–ǔ→hǔ', items: [{ t: 'h', hudu: 'h' }, { t: 'ǔ', play: 'wu3', borrow: 1 }, { t: 'hǔ', play: 'hu3' }] },
        { label: 'd–à→dà', items: [{ t: 'd', hudu: 'd' }, { t: 'à', play: 'a4' }, { t: 'dà', play: 'da4' }] },
        { label: 'l–ǜ→lǜ', items: [{ t: 'l', hudu: 'l' }, { t: 'ǜ', play: 'yu4', borrow: 1 }, { t: 'lǜ', play: 'lv4' }] },
        { label: 'p–ó→pó', items: [{ t: 'p', hudu: 'p' }, { t: 'ó', play: 'o2' }, { t: 'pó', play: 'po2' }] }
      ],
      note: '呼读音还没录好时显示「待录音」，不拿音节顶替。韵母 u、ü 单念借 wu、yu 的录音。'
    },
    {
      type: 'groups', lv: 2, h: '三拼听一听：声母 → 介母 → 韵母 → 音节',
      groups: [
        { label: 'g–u–ā→guā', items: [{ t: 'g', hudu: 'g' }, { t: 'u' }, { t: 'ā', play: 'a1' }, { t: 'guā', play: 'gua1' }] },
        { label: 'h–u–ā→huā', items: [{ t: 'h', hudu: 'h' }, { t: 'u' }, { t: 'ā', play: 'a1' }, { t: 'huā', play: 'hua1' }] },
        { label: 'x–i–ā→xiā', items: [{ t: 'x', hudu: 'x' }, { t: 'i' }, { t: 'ā', play: 'a1' }, { t: 'xiā', play: 'xia1' }] },
        { label: 'j–i–ā→jiā', items: [{ t: 'j', hudu: 'j' }, { t: 'i' }, { t: 'ā', play: 'a1' }, { t: 'jiā', play: 'jia1' }] },
        { label: 'h–u–ǒ→huǒ', items: [{ t: 'h', hudu: 'h' }, { t: 'u' }, { t: 'ǒ', play: 'o3' }, { t: 'huǒ', play: 'huo3' }] },
        { label: 'k–u–ài→kuài', items: [{ t: 'k', hudu: 'k' }, { t: 'u' }, { t: 'ài', play: 'ai4' }, { t: 'kuài', play: 'kuai4' }] }
      ],
      note: '介母块不放录音：介母要读得极快，单独录一个完整的 wu、yi 反而会教成拖长。'
    },
    {
      type: 'pairs', lv: 2, h: '对比听：丢了介母就变成另一个音',
      pairs: [
        [{ t: 'guā', play: 'gua1' }, { t: 'gā', play: 'ga1' }],
        [{ t: 'huā', play: 'hua1' }, { t: 'hā', play: 'ha1' }],
        [{ t: 'liǎng', play: 'liang3' }, { t: 'lǎng', play: 'lang3' }],
        [{ t: 'kuài', play: 'kuai4' }, { t: 'kài', play: 'kai4' }],
        [{ t: 'duō', play: 'duo1' }, { t: 'dōu', play: 'dou1' }]
      ],
      tip: '左边是三拼音节，右边少了介母（最后一对是常见的「uo / ou」混淆）。介母读得快，但一定要读出来。'
    },
    {
      type: 'groups', lv: 1, h: '同一个声母，换四个声调（韵母定调）',
      groups: [
        { label: 'b + a', items: [{ t: 'bā', play: 'ba1', sub: '八' }, { t: 'bá', play: 'ba2', sub: '拔' }, { t: 'bǎ', play: 'ba3', sub: '把' }, { t: 'bà', play: 'ba4', sub: '爸' }] },
        { label: 'h + u', items: [{ t: 'hū', play: 'hu1', sub: '呼' }, { t: 'hú', play: 'hu2', sub: '湖' }, { t: 'hǔ', play: 'hu3', sub: '虎' }, { t: 'hù', play: 'hu4', sub: '护' }] },
        { label: 'g + ua', items: [{ t: 'guā', play: 'gua1', sub: '瓜' }, { t: 'guǎ', play: 'gua3', sub: '寡' }, { t: 'guà', play: 'gua4', sub: '挂' }] }
      ],
      note: '韵母的声调变了，音节的声调就跟着变。'
    },
    {
      type: 'text', lv: 3, h: '录音说明',
      p: [
        '音节录音都来自 audio-cmn。21 个声母的呼读音（玻 坡 摸 佛……）需要另外录制，放进 pinyin/audio/hudu/ 后，本页的声母芯片和碰撞动画会自动先播呼读音。',
        '呼读音要又轻又短；录好后请人耳确认长度明显短于对应音节。'
      ]
    }
  ],

  lian: [
    {
      type: 'quiz-build', lv: 1, h: '拼读机：声母 + 单韵母 + 声调',
      initials: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'],
      finals: ['a', 'o', 'e', 'i', 'u', 'ü'],
      tones: [1, 2, 3, 4],
      note: '不存在的组合（如 fi、bü）会灰掉；拼出来后点一下再听。'
    },
    {
      type: 'quiz-build', lv: 2, h: '三拼机：声母 + 介母开头的韵母',
      initials: ['g', 'k', 'h', 'zh', 'sh'],
      finals: ['ua', 'uo', 'uai', 'uang'],
      tones: [1, 2, 3, 4],
      note: '口诀：声轻介快韵母响。'
    },
    {
      type: 'quiz-build', lv: 2, h: '三拼机：j q x 和 i 开头的韵母',
      initials: ['j', 'q', 'x', 'l', 'n'],
      finals: ['ia', 'ie', 'iao', 'ian', 'iang'],
      tones: [1, 2, 3, 4]
    },
    {
      type: 'quiz-listen', lv: 1, h: '听音选声母',
      pool: ['ba1', 'pa1', 'ma1', 'fa1', 'da1', 'ta1', 'na1', 'la1', 'bu4', 'pu4', 'mu4', 'fu4', 'du4', 'tu4', 'nu4', 'lu4'],
      ask: 'initial'
    },
    {
      type: 'quiz-listen', lv: 2, h: '听音选韵母：有没有介母？',
      pool: ['gua1', 'ga1', 'hua1', 'ha1', 'guo2', 'ge2', 'kua4', 'ka3', 'huo3', 'he2', 'jia1', 'ji1', 'xia4', 'xi4'],
      ask: 'final'
    },
    {
      type: 'quiz-choose', lv: 1, h: '找朋友：拼出来是哪个？',
      items: [
        { q: 'b – ā → ?', options: ['bā', 'pā', 'dā'], answer: 0, why: 'b 碰 ā，合成 bā。' },
        { q: 'm – ǎ → ?', options: ['mǎ', 'mà', 'nǎ'], answer: 0, why: '声调跟着韵母：ǎ 是三声，拼出 mǎ。' },
        { q: 'h – ǔ → ?', options: ['hǔ', 'hù', 'fǔ'], answer: 0, why: '韵母 ǔ 是三声，拼出 hǔ（虎）。' },
        { q: 'l – ǜ → ?', options: ['lǜ', 'lù', 'nǜ'], answer: 0, why: 'l 和 ü 拼，两点保留：lǜ（绿）。' },
        { q: '哪种读法是对的？', options: ['b–ā 一碰就合成 bā', '先读「玻」再读「啊」'], answer: 0, why: '声母要轻短，一碰就合；「玻—啊」是两个音节，拼不出 bā。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 2, h: '三拼和接龙',
      items: [
        { q: 'g – u – ā → ?', options: ['guā', 'gā', 'gū'], answer: 0, why: '声轻介快韵母响：介母 u 不能丢。' },
        { q: 'x – i – ǎo → ?', options: ['xiǎo', 'xǎo', 'xiā'], answer: 0, why: 'x、i、ǎo 连起来是 xiǎo（小）。' },
        { q: 'gu – āng（声介合拼）→ ?', options: ['guāng', 'gāng', 'guān'], answer: 0, why: '先合 gu，再碰 āng：guāng（光）。' },
        { q: '拼音接龙：huā 的韵母是 ua，下一个用 ua 的音节是？', options: ['guā', 'gē', 'huǒ'], answer: 0, why: 'guā 的韵母也是 ua，可以接上。' },
        { q: '拼音接龙：duō 的韵母是 uo，下一个用 uo 的音节是？', options: ['huǒ', 'dōu', 'duì'], answer: 0, why: 'huǒ 的韵母是 uo；dōu 是 ou，不一样。' },
        { q: '「支架法」读 pō 时先做什么？', options: ['摆好 p 的口形，不出声', '大声读「坡」', '先读 ō 再读 p'], answer: 0, why: '先摆声母口形（支架），再直接发带调韵母，声母就带出来了。' }
      ],
      note: '拼音接龙的玩法见人教社一上拼音单元修订研究（2025）；题目自编。'
    },
    {
      type: 'quiz-mark', lv: 2, h: '标调练习：三拼音节调号标在哪',
      items: ['gua', 'huo', 'xia', 'jiao', 'duo', 'liang', 'kuai', 'guang', 'xiao', 'jia'],
      note: '介母 i、u 不是韵腹，调号标在后面的主要元音上（GB/T 16159-2012 第 6.5.1 条）。'
    },
    {
      type: 'quiz-choose', lv: 3, h: '深一点',
      items: [
        { q: '为什么不能「玻—啊」拼 bā？', options: ['「玻」是呼读音，带了元音 o，成了两个音节', '「玻」声调不对', '可以这样拼'], answer: 0, why: '呼读音只是声母的名字；拼读要用本音，不能把后面的元音带进去。' },
        { q: '拼读的最终目标是什么？', options: ['直呼：看到音节直接读', '每个音节都分三步拼', '只记呼读音'], answer: 0, why: '两拼、三拼、支架法都是过渡，熟练后要直呼。' },
        { q: '三拼时最常见的错误是？', options: ['丢掉介母（guā 读成 gā）', '声调读得太准', '韵母读得太响'], answer: 0, why: '介母要快，但不能省；丢了就变成另一个音节。' }
      ]
    }
  ],

  yong: [
    {
      type: 'words', lv: 1, h: '拼一拼，读词语（自编，点拼音听，点汉字去字卡）',
      items: [
        { w: '西瓜', py: 'xī guā' },
        { w: '花朵', py: 'huā duǒ' },
        { w: '大虾', py: 'dà xiā' },
        { w: '火车', py: 'huǒ chē' },
        { w: '回家', py: 'huí jiā' },
        { w: '月光', py: 'yuè guāng' },
        { w: '木马', py: 'mù mǎ' },
        { w: '拖把', py: 'tuō bǎ' },
        { w: '过河', py: 'guò hé' },
        { w: '画画', py: 'huà huà' },
        { w: '老虎', py: 'lǎo hǔ' },
        { w: '下雨', py: 'xià yǔ' }
      ],
      note: '先分步拼，再试着直呼。按字标原调；「老虎」两个三声相连，「老」实际读得像 láo。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌（自编）', title: '火车运西瓜',
      lines: [
        { w: '西瓜圆，花朵红，', py: 'xī guā yuán, huā duǒ hóng,' },
        { w: '小虾过河找朋友。', py: 'xiǎo xiā guò hé zhǎo péng you.' },
        { w: '火车开，叫一声，', py: 'huǒ chē kāi, jiào yī shēng,' },
        { w: '拉着西瓜回家中。', py: 'lā zhe xī guā huí jiā zhōng.' }
      ],
      real: { '一': 'yì' },
      note: '三拼音节：瓜、花、朵、虾、过、火、叫、家。L2 起显示「一声」的「一」实际读 yì（GB/T 16159-2012 6.5.2）。'
    },
    {
      type: 'verse', lv: 2, h: '短句：直呼小挑战', title: '读一读',
      lines: [
        { w: '小猫抓花，大狗追瓜。', py: 'xiǎo māo zhuā huā, dà gǒu zhuī guā.' },
        { w: '火光亮亮，照着大家。', py: 'huǒ guāng liàng liàng, zhào zhe dà jiā.' }
      ],
      note: '先不看分步，直接读；读不出来再用三拼或声介合拼。'
    }
  ]
};
