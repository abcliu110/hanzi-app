/* 拼音区 · 单韵母（a o e i u ü）。讲解、例词、儿歌、情境图全部自编；格式见 SCHEMA.md。
 * 录音：audio-cmn（王琛，CC BY-SA 3.0）；i、u、ü 单念借 yi、wu、yu 的录音。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['danyunmu'] = {
  id: 'danyunmu', name: '单韵母', lv: 'L1–L3',
  lead: 'a o e i u ü 六个单韵母：嘴巴张多大、圆不圆，读的时候口形从头到尾不变。',
  src: [
    '统编 2024 一上第 1 课 a o e、第 2 课 i u ü（单韵母 6 个）',
    '《汉语拼音方案》韵母表及说明 (1)(3)(4)',
    '教育部新闻办 2023 年答复：单韵母 o 参考「喔」ō 的发音',
    'GB/T 16159-2012 第 6.5.1 条（标调位置、i 上标调省点）'
  ],

  kan: [
    {
      type: 'scene', lv: 1, h: '看图记字母（点一张图，字母会出来对形状）',
      note: '情境图自编，只画物和动物。',
      items: [
        { letter: 'a', thing: '打哈欠的小河马，嘴巴张得又大又圆，像 a 的圆肚子', word: '啊', py: 'ā',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><ellipse cx="88" cy="88" rx="62" ry="48" class="svg-muted" opacity=".55"/><circle cx="46" cy="44" r="10" class="svg-muted"/><circle cx="118" cy="42" r="10" class="svg-muted"/><circle cx="60" cy="64" r="4" class="svg-ink"/><circle cx="92" cy="92" r="28" class="svg-panel"/><rect x="78" y="64" width="8" height="10" rx="2" class="svg-panel"/><rect x="98" y="64" width="8" height="10" rx="2" class="svg-panel"/><line x1="120" y1="68" x2="120" y2="122" class="svg-deep-s" stroke-width="6" stroke-linecap="round"/></svg>' },
        { letter: 'o', thing: '水上漂着一个圆圆的游泳圈，圆得像 o，看见它就想说「喔——好圆」', word: '喔', py: 'ō',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M0 112 Q25 102 50 112 T100 112 T150 112 T200 112 L200 150 L0 150 Z" class="svg-blue" opacity=".35"/><circle cx="92" cy="86" r="34" fill="none" class="svg-red-s" stroke-width="16"/><path d="M92 52 L92 60 M126 86 L118 86 M92 120 L92 112 M58 86 L66 86" class="svg-panel" stroke="#fff" stroke-width="6"/></svg>' },
        { letter: 'e', thing: '卷成 e 字形的小青虫趴在叶子上，肚子饿了', word: '饿', py: 'è',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M20 130 C60 80 140 70 185 110 C140 140 60 145 20 130 Z" class="svg-green" opacity=".35"/><path d="M62 84 L122 84 C122 52 62 52 62 84 C62 116 108 120 124 104" fill="none" class="svg-green-s" stroke-width="12" stroke-linecap="round"/><circle cx="128" cy="100" r="9" class="svg-green"/><circle cx="131" cy="97" r="2.5" class="svg-ink"/></svg>' },
        { letter: 'i', thing: '一根细细的小蜡烛，火苗像 i 头上的点', word: '一', py: 'yī',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><rect x="60" y="128" width="80" height="8" rx="4" class="svg-muted"/><rect x="90" y="62" width="16" height="66" rx="4" class="svg-accent"/><line x1="98" y1="62" x2="98" y2="52" class="svg-ink-s" stroke-width="2"/><path d="M98 22 C108 34 108 44 98 48 C88 44 88 34 98 22 Z" class="svg-red"/></svg>' },
        { letter: 'u', thing: '一只小碗，碗里装着五颗樱桃，碗口像 u', word: '五', py: 'wǔ',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M40 60 C40 140 150 140 150 60" fill="none" class="svg-deep-s" stroke-width="8" stroke-linecap="round"/><line x1="70" y1="132" x2="120" y2="132" class="svg-deep-s" stroke-width="6" stroke-linecap="round"/><circle cx="72" cy="96" r="9" class="svg-red"/><circle cx="92" cy="104" r="9" class="svg-red"/><circle cx="112" cy="98" r="9" class="svg-red"/><circle cx="82" cy="80" r="9" class="svg-red"/><circle cx="104" cy="80" r="9" class="svg-red"/></svg>' },
        { letter: 'ü', thing: '一把倒过来的伞在接雨，上面落下两颗雨滴，合起来像 ü', word: '雨', py: 'yǔ',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M40 70 C40 140 150 140 150 70 Z" class="svg-blue" opacity=".45"/><path d="M40 70 C40 140 150 140 150 70" fill="none" class="svg-blue-s" stroke-width="5"/><line x1="95" y1="70" x2="95" y2="22" class="svg-deep-s" stroke-width="4"/><path d="M70 24 C76 34 76 40 70 42 C64 40 64 34 70 24 Z" class="svg-blue"/><path d="M120 24 C126 34 126 40 120 42 C114 40 114 34 120 24 Z" class="svg-blue"/></svg>' }
      ]
    },
    {
      type: 'scene', lv: 1, h: '嘴巴张多大、圆不圆（只画口形，不画脸）',
      note: '椭圆是嘴巴张开的样子：越大张得越开，越圆嘴唇越圆。',
      items: [
        { letter: 'a', thing: '张得最大，不圆', word: '啊', py: 'ā',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><ellipse cx="100" cy="75" rx="58" ry="46" class="svg-accent" opacity=".7"/></svg>' },
        { letter: 'o', thing: '半张开，嘴唇拢圆', word: '喔', py: 'ō',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><circle cx="100" cy="75" r="32" class="svg-accent" opacity=".7"/></svg>' },
        { letter: 'e', thing: '半张开，嘴角向两边，不圆', word: '饿', py: 'è',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><ellipse cx="100" cy="75" rx="48" ry="20" class="svg-accent" opacity=".7"/></svg>' },
        { letter: 'i', thing: '只开一条缝，嘴角向两边', word: '衣', py: 'yī',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><ellipse cx="100" cy="75" rx="50" ry="7" class="svg-accent" opacity=".7"/></svg>' },
        { letter: 'u', thing: '嘴唇拢成小圆孔，往前突', word: '乌', py: 'wū',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><circle cx="100" cy="75" r="13" class="svg-accent" opacity=".7"/><path d="M100 40 L100 50 M100 100 L100 110" class="svg-muted-s" stroke-width="3"/></svg>' },
        { letter: 'ü', thing: '和 u 一样圆的小孔，但舌头在前面（像吹口哨）', word: '鱼', py: 'yú',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><circle cx="100" cy="75" r="11" class="svg-accent" opacity=".7"/><circle cx="84" cy="44" r="5" class="svg-deep"/><circle cx="116" cy="44" r="5" class="svg-deep"/></svg>' }
      ]
    },
    {
      type: 'table', lv: 1, h: '六个单韵母，一张表记住口形',
      head: ['韵母', '嘴巴张多大', '嘴唇圆不圆', '记一记（自编）'],
      rows: [
        ['a', '最大', '不圆', '嘴巴张大 {py:ā} {py:ā} {py:ā}'],
        ['o', '中等', '圆', '嘴唇拢圆 {py:ō} {py:ō} {py:ō}'],
        ['e', '中等', '不圆，嘴角往两边', '嘴巴扁扁 {py:ē} {py:ē} {py:ē}'],
        ['i', '最小，一条缝', '不圆，嘴角往两边', '牙齿对齐 {py:yī} {py:yī} {py:yī}'],
        ['u', '小', '最圆，往前突', '嘴巴突出 {py:wū} {py:wū} {py:wū}'],
        ['ü', '小', '圆', '先读 i 再把嘴唇拢圆 {py:yū} {py:yū} {py:yū}']
      ],
      note: '读单韵母时，口形从开始到结束都不变——这是它和复韵母（嘴形会滑动）最大的不同。'
    },
    {
      type: 'text', lv: 1, h: '口形不变，声音拉长',
      p: [
        '单韵母只有一个元音。读的时候嘴巴先摆好，再出声，声音可以拉长，但嘴巴不要动：{py:ā}——一直是大口形，{py:wū}——一直是小圆孔。',
        '如果读着读着嘴巴变了，比如 a 读到最后合上变成「ao」，那就不是单韵母了。'
      ]
    },
    {
      type: 'text', lv: 2, h: '舌头在哪里：高低、前后、圆唇',
      p: [
        '除了嘴巴张多大，舌头的位置也不一样。嘴巴张得越小，舌头越高：i、u、ü 舌头最高，a 舌头最低。',
        '舌头还分前后：i、ü 舌头往前（舌尖抵着下齿背），u、o、e 舌头往后缩，a 在中间。',
        '最容易混的是 i 和 ü：舌头的位置一模一样，只是 ü 要把嘴唇拢圆。试试先读 {py:yī}，舌头不动，慢慢把嘴唇拢圆，就变成了 {py:yū}。',
        'o 和 e 也是一对：舌头都往后缩、高度差不多，o 嘴唇圆，e 嘴唇不圆。先读 {py:ō}，嘴角往两边一拉，就变成了 {py:ē}。'
      ]
    },
    {
      type: 'table', lv: 2, h: '舌位与圆唇对照',
      head: ['韵母', '舌头高低', '舌头前后', '嘴唇'],
      rows: [
        ['i', '高', '前', '不圆'],
        ['ü', '高', '前', '圆'],
        ['u', '高', '后', '圆'],
        ['o', '半高', '后', '圆'],
        ['e', '半高', '后', '不圆'],
        ['a', '低', '中', '不圆']
      ],
      note: '按《汉语拼音方案》读音描写整理；表里只比较六个单韵母之间的相对位置。'
    },
    {
      type: 'text', lv: 2, h: 'o 读「喔」，不读「欧」也不读「窝」',
      p: [
        '单念 o 时，参考「喔」{py:ō} 的读音：上下嘴唇拢圆，舌头往后缩，口形从头到尾不变。',
        '常见的两种读错：读成「欧」（嘴巴从 o 滑到 u，变成复韵母 ou），读成「窝」（前面多了一个 u 的过渡，变成 wo）。',
        '声调符号标在单韵母上：{py:mā} 的调号在 a 上；i 上标调时省掉 i 上的点，写成 {py:mǐ}。'
      ],
      note: '依据：教育部新闻办 2023 年答复「单韵母 o 可以参考『喔』（ō）的发音」；GB/T 16159-2012 第 6.5.1 条。'
    },
    {
      type: 'scene', lv: 3, h: '元音舌位图（抽象示意）',
      note: '四边形左边是舌头靠前，右边是靠后；上面是舌位高，下面是低。示意图自绘，比例不精确。',
      items: [
        { letter: 'i ü u', thing: '六个单韵母在舌位四边形里的大致位置（ü 和 i 同一点，嘴唇圆；u、o 圆唇，e 不圆）', word: '鱼', py: 'yú',
          svg: '<svg viewBox="0 0 200 150" aria-hidden="true"><path d="M30 18 L180 18 L180 134 L95 134 Z" fill="none" class="svg-muted-s" stroke-width="2.5"/><circle cx="38" cy="24" r="5" class="svg-deep"/><text x="30" y="44" font-size="14" class="svg-ink">i ü</text><circle cx="172" cy="24" r="5" class="svg-deep"/><text x="160" y="44" font-size="14" class="svg-ink">u</text><circle cx="172" cy="62" r="5" class="svg-deep"/><text x="150" y="66" font-size="14" class="svg-ink">o e</text><circle cx="128" cy="128" r="5" class="svg-deep"/><text x="120" y="120" font-size="14" class="svg-ink">a</text><text x="40" y="148" font-size="11" class="svg-muted">前</text><text x="168" y="148" font-size="11" class="svg-muted">后</text></svg>' }
      ]
    },
    {
      type: 'text', lv: 3, h: '学理：方案里的单元音韵母不止 6 个',
      p: [
        '《汉语拼音方案》韵母表除了 a o e i u ü，说明里还写到三个：ê（单用时写 ê，如叹词「欸」），er（「儿」，作韵尾时写 r），以及「知、蚩、诗、日、资、雌、思」的韵母（写成 i，学理上叫舌尖元音，常记作 -i）。教材只把 a o e i u ü 叫单韵母，er 放到复韵母那一课，-i 放进整体认读音节。',
        '修订前的教材曾经把 y、w 跟 i、u、ü 放在一起讲；2024 版统编一上把 y、w 拆出去单独设课，单韵母就是 6 个。',
        'b p m f 后面的 o（bo po mo fo）实际读音里带一点 u 那样的圆唇过渡，有学者认为这是省写形式。这一点属于学界讨论，教学时单念 o 仍按「喔」{py:ō}，拼 {py:bō} 时自然连读即可。',
        'ü 在 j q x 和 y 后面省掉两点（{py:jú}、{py:yú}），在 n l 后面保留（{py:nǚ}、{py:lǜ}），因为 nu、lu 也存在，去掉点就分不清了。'
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (1)(2)(3)(4)；人教社一上拼音单元修订研究（2025）；o 的圆唇过渡见长江日报 2023 年报道中学者观点。'
    }
  ],

  ting: [
    {
      type: 'chips', lv: 1, h: '六个单韵母（点一下听，长按/再点出四声）',
      items: [
        { t: 'a', play: 'a1', tones: 'a' },
        { t: 'o', play: 'o1', tones: 'o' },
        { t: 'e', play: 'e1', tones: 'e' },
        { t: 'i', play: 'yi1', tones: 'yi', borrow: 1 },
        { t: 'u', play: 'wu1', tones: 'wu', borrow: 1 },
        { t: 'ü', play: 'yu1', tones: 'yu', borrow: 1 }
      ],
      note: 'i、u、ü 单念和音节 yi、wu、yu 读音一样，这里借用 yi、wu、yu 的录音。'
    },
    {
      type: 'groups', lv: 1, h: '四声读一读（带调的单韵母）',
      groups: [
        { label: 'a', items: [{ t: 'ā', play: 'a1', sub: '啊' }, { t: 'á', play: 'a2' }, { t: 'ǎ', play: 'a3' }, { t: 'à', play: 'a4' }] },
        { label: 'o', items: [{ t: 'ō', play: 'o1', sub: '喔' }, { t: 'ó', play: 'o2', sub: '哦' }, { t: 'ǒ', play: 'o3' }, { t: 'ò', play: 'o4' }] },
        { label: 'e', items: [{ t: 'ē', play: 'e1' }, { t: 'é', play: 'e2', sub: '鹅' }, { t: 'ě', play: 'e3' }, { t: 'è', play: 'e4', sub: '饿' }] },
        { label: 'i（借 yi）', items: [{ t: 'ī', play: 'yi1', sub: '衣', borrow: 1 }, { t: 'í', play: 'yi2', sub: '姨', borrow: 1 }, { t: 'ǐ', play: 'yi3', sub: '椅', borrow: 1 }, { t: 'ì', play: 'yi4', sub: '亿', borrow: 1 }] },
        { label: 'u（借 wu）', items: [{ t: 'ū', play: 'wu1', sub: '乌', borrow: 1 }, { t: 'ú', play: 'wu2', sub: '无', borrow: 1 }, { t: 'ǔ', play: 'wu3', sub: '五', borrow: 1 }, { t: 'ù', play: 'wu4', sub: '雾', borrow: 1 }] },
        { label: 'ü（借 yu）', items: [{ t: 'ǖ', play: 'yu1', borrow: 1 }, { t: 'ǘ', play: 'yu2', sub: '鱼', borrow: 1 }, { t: 'ǚ', play: 'yu3', sub: '雨', borrow: 1 }, { t: 'ǜ', play: 'yu4', sub: '玉', borrow: 1 }] }
      ],
      note: '小字是读这个音的常用字（自选）；没有合适常用字的格子不标字。'
    },
    {
      type: 'pairs', lv: 1, h: '对比听：u 和 ü',
      pairs: [
        [{ t: 'ū', play: 'wu1', borrow: 1 }, { t: 'ǖ', play: 'yu1', borrow: 1 }],
        [{ t: 'ú', play: 'wu2', borrow: 1 }, { t: 'ǘ', play: 'yu2', borrow: 1 }],
        [{ t: 'ǔ', play: 'wu3', borrow: 1 }, { t: 'ǚ', play: 'yu3', borrow: 1 }],
        [{ t: 'ù', play: 'wu4', borrow: 1 }, { t: 'ǜ', play: 'yu4', borrow: 1 }]
      ],
      tip: '两个都是小圆嘴。u 舌头往后缩，ü 舌头放在前面、像 i 一样贴着下牙。'
    },
    {
      type: 'pairs', lv: 2, h: '对比听：i 和 ü（舌头不动，只拢圆嘴唇）',
      pairs: [
        [{ t: 'ī', play: 'yi1', borrow: 1 }, { t: 'ǖ', play: 'yu1', borrow: 1 }],
        [{ t: 'í', play: 'yi2', borrow: 1 }, { t: 'ǘ', play: 'yu2', borrow: 1 }],
        [{ t: 'ǐ', play: 'yi3', borrow: 1 }, { t: 'ǚ', play: 'yu3', borrow: 1 }],
        [{ t: 'ì', play: 'yi4', borrow: 1 }, { t: 'ǜ', play: 'yu4', borrow: 1 }]
      ],
      tip: '读 i 时嘴角往两边，读 ü 时嘴唇拢圆——舌头的位置是一样的。'
    },
    {
      type: 'pairs', lv: 2, h: '对比听：o 和 e（舌头不动，只改嘴唇）',
      pairs: [
        [{ t: 'ō', play: 'o1' }, { t: 'ē', play: 'e1' }],
        [{ t: 'ó', play: 'o2' }, { t: 'é', play: 'e2' }],
        [{ t: 'ǒ', play: 'o3' }, { t: 'ě', play: 'e3' }],
        [{ t: 'ò', play: 'o4' }, { t: 'è', play: 'e4' }]
      ],
      tip: 'o 嘴唇圆，e 嘴角往两边拉开。'
    },
    {
      type: 'groups', lv: 2, h: '单韵母进了音节（声母 + 单韵母）',
      groups: [
        { label: 'a', items: [{ t: 'bā', play: 'ba1' }, { t: 'mǎ', play: 'ma3' }, { t: 'dà', play: 'da4' }] },
        { label: 'o', items: [{ t: 'pō', play: 'po1' }, { t: 'mó', play: 'mo2' }, { t: 'fó', play: 'fo2' }] },
        { label: 'e', items: [{ t: 'gē', play: 'ge1' }, { t: 'hé', play: 'he2' }, { t: 'kè', play: 'ke4' }] },
        { label: 'i', items: [{ t: 'mǐ', play: 'mi3' }, { t: 'dì', play: 'di4' }, { t: 'pí', play: 'pi2' }] },
        { label: 'u', items: [{ t: 'bù', play: 'bu4' }, { t: 'lù', play: 'lu4' }, { t: 'shū', play: 'shu1' }] },
        { label: 'ü', items: [{ t: 'lǜ', play: 'lv4' }, { t: 'nǚ', play: 'nv3' }, { t: 'jú', play: 'ju2' }] }
      ],
      note: '最后一组：ü 跟 n、l 拼保留两点（nǚ、lǜ），跟 j 拼省掉两点（jú），读音不变。'
    },
    {
      type: 'text', lv: 3, h: '录音说明',
      p: [
        'i、u、ü 没有单独的录音，借用音节 yi、wu、yu：按《汉语拼音方案》韵母表说明 (4)，i、u、ü 自成音节时写成 yi、wu、yu，读音不变。',
        'o 的录音按「喔」ō 选用，上线前需要人耳再确认一遍是否接近「喔」、没有滑向「欧」或「窝」。ê 没有录音，所以本页不放 ê 的发音按钮。'
      ]
    }
  ],

  lian: [
    {
      type: 'quiz-listen', lv: 1, h: '听音选韵母（6 选 1）',
      pool: ['a1', 'a2', 'a3', 'a4', 'o1', 'o2', 'o3', 'o4', 'e1', 'e2', 'e3', 'e4', 'yi1', 'yi2', 'yi3', 'yi4', 'wu1', 'wu2', 'wu3', 'wu4', 'yu1', 'yu2', 'yu3', 'yu4'],
      ask: 'final', options: ['a', 'o', 'e', 'i', 'u', 'ü'],
      note: 'i、u、ü 的题用 yi、wu、yu 的录音。'
    },
    {
      type: 'quiz-listen', lv: 1, h: '听音选声调（只出单韵母）',
      pool: ['a1', 'a2', 'a3', 'a4', 'o1', 'o2', 'o3', 'o4', 'e1', 'e2', 'e3', 'e4', 'yi1', 'yi2', 'yi3', 'yi4', 'wu1', 'wu2', 'wu3', 'wu4', 'yu1', 'yu2', 'yu3', 'yu4'],
      ask: 'tone'
    },
    {
      type: 'quiz-listen', lv: 1, h: 'u 还是 ü？',
      pool: ['wu1', 'wu2', 'wu3', 'wu4', 'yu1', 'yu2', 'yu3', 'yu4'],
      ask: 'final', options: ['u', 'ü'],
      note: '错了就回到「听读」里的 u / ü 对比听。'
    },
    {
      type: 'quiz-find', lv: 1, h: '找一找：点出所有的 ü',
      target: 'ü', distract: ['u', 'ū', 'ù'], n: 12
    },
    {
      type: 'quiz-choose', lv: 1, h: '想一想',
      items: [
        { q: '哪个单韵母读的时候嘴巴张得最大？', options: ['a', 'o', 'i'], answer: 0, why: 'a 嘴巴张得最大；i 只开一条缝。' },
        { q: '哪个单韵母读的时候嘴唇拢成最小的圆孔、往前突？', options: ['u', 'e', 'a'], answer: 0, why: 'u 嘴唇最圆、往前突。' },
        { q: '单念 o，听起来像哪个字？', options: ['喔', '欧', '窝'], answer: 0, why: 'o 参考「喔」ō；读成「欧」「窝」都多了滑动或过渡。' },
        { q: '下面哪一个不是单韵母？', options: ['ai', 'e', 'ü'], answer: 0, why: 'ai 读的时候嘴巴从 a 滑到 i，是复韵母。' },
        { q: '读单韵母时，嘴巴要不要变？', options: ['从头到尾不变', '要从大变小'], answer: 0, why: '单韵母只有一个元音，口形不变；嘴巴会滑动的是复韵母。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 2, h: '舌头和嘴唇',
      items: [
        { q: 'i 和 ü 有什么不同？', options: ['舌头一样，ü 嘴唇圆', 'ü 舌头更低', 'ü 嘴巴张得更大'], answer: 0, why: 'i 和 ü 舌位相同，只差圆唇。' },
        { q: 'o 和 e 有什么不同？', options: ['o 嘴唇圆，e 不圆', 'o 舌头在前', 'e 嘴巴张得最大'], answer: 0, why: 'o、e 舌头都往后缩，区别在嘴唇圆不圆。' },
        { q: '哪个单韵母舌位最低？', options: ['a', 'i', 'u'], answer: 0, why: '嘴巴张得越大舌头越低，a 最低。' },
        { q: '「绿」的拼音怎么写？', options: ['lǜ', 'lù', 'lǜ'], answer: 0, why: 'ü 跟 l 拼保留两点，调号标在 ü 上；lù 是「路」。' },
        { q: '「米」读第三声，拼音哪个写对了？', options: ['mǐ', 'mì', 'mí'], answer: 0, why: '第三声的调号是 ˇ；标在 i 上时省掉 i 上的点（GB/T 16159-2012 6.5.1）。' }
      ]
    },
    {
      type: 'quiz-mark', lv: 2, h: '标调练习：调号落在哪个字母上',
      items: ['ma', 'bo', 'de', 'mi', 'pu', 'lü', 'nü', 'ju'],
      note: '单韵母音节只有一个元音，调号就标在它上面；标在 i 上要去掉点。'
    },
    {
      type: 'quiz-choose', lv: 3, h: '深一点',
      items: [
        { q: '《汉语拼音方案》里，「知、蚩、诗」的韵母写成什么？', options: ['i', 'e', 'ü'], answer: 0, why: '方案韵母表说明 (1)：知蚩诗日资雌思的韵母写成 i，学理上是舌尖元音 -i。' },
        { q: '「欸」单用时的韵母写成哪个？', options: ['ê', 'e', 'ei'], answer: 0, why: '方案韵母表说明 (3)：ㄝ 单用时写成 ê。' },
        { q: '为什么 nǚ 不能省掉两点？', options: ['nu 也是一个音节，省了分不清', 'n 后面不能写 ü', '为了好看'], answer: 0, why: 'n、l 既能拼 u 也能拼 ü，所以要保留两点；j q x 不和 u 相拼，才可以省。' }
      ]
    }
  ],

  yong: [
    {
      type: 'words', lv: 1, h: '读词语（自编，点拼音听，点汉字去字卡）',
      items: [
        { w: '阿姨', py: 'ā yí' },
        { w: '木鱼', py: 'mù yú' },
        { w: '大米', py: 'dà mǐ' },
        { w: '读书', py: 'dú shū' },
        { w: '绿色', py: 'lǜ sè' },
        { w: '鳄鱼', py: 'è yú' },
        { w: '雨衣', py: 'yǔ yī' },
        { w: '河马', py: 'hé mǎ' },
        { w: '大哥', py: 'dà gē' },
        { w: '衣服', py: 'yī fu' },
        { w: '拔河', py: 'bá hé' },
        { w: '乌鸦', py: 'wū yā' }
      ],
      note: '按字标原调；「衣服」的「服」读轻声，不可点。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌（自编）', title: '绿雨衣',
      lines: [
        { w: '小雨滴，往下落，', py: 'xiǎo yǔ dī, wǎng xià luò,' },
        { w: '鳄鱼穿上绿雨衣。', py: 'è yú chuān shàng lǜ yǔ yī.' },
        { w: '乌鸦站在大树上，', py: 'wū yā zhàn zài dà shù shang,' },
        { w: '阿姨送它一把伞。', py: 'ā yí sòng tā yī bǎ sǎn.' }
      ],
      real: { '小': 'xiáo', '一': 'yì' },
      note: '正文按字标原调。L2 起在字上方显示实际读音：「小雨」两个三声相连，「小」读得像 xiáo；「一把」的「一」在三声前读 yì（GB/T 16159-2012 6.5.2 教学可按变调标）。'
    },
    {
      type: 'verse', lv: 2, h: '短句：找出单韵母', title: '读一读',
      lines: [
        { w: '河马和鳄鱼在河里拔河。', py: 'hé mǎ hé è yú zài hé li bá hé.' },
        { w: '大哥读书，阿姨买米。', py: 'dà gē dú shū, ā yí mǎi mǐ.' }
      ],
      real: { '买': 'mái' },
      note: '读完数一数：哪些音节的韵母是单韵母？「买米」两个三声相连，「买」读得像 mái。'
    }
  ]
};
