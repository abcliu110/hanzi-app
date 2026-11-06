/* 拼音区 · 鼻韵母（前鼻 an en in un ün · 后鼻 ang eng ing ong）
 * 格式见 pinyin/content/SCHEMA.md。讲解、例词、儿歌、情境全部自编。
 * 单念录音：an en ang eng 用本身的音节；in un ün ing 借零声母音节 yin wen yun ying（注明「借」）。
 *   ong 不能单独成音节，audio-cmn 没有 ong 的录音，页面用 hong dong zhong 等带声母的音节示范。
 * 依据：统编 2024 一上第 13 课（an en in un ün）、第 14 课（ang eng ing ong）；
 *   《汉语拼音方案》韵母表（35 格）及说明 (4)(5)；GB/T 16159-2012。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['biyunmu'] = {
  id: 'biyunmu', name: '鼻韵母', lv: 'L1–L3',
  lead: '韵母的尾巴是鼻音：前鼻韵母收在舌尖（-n），后鼻韵母收在舌根（-ng）。听出前后、读准前后，是这一课的关键。',
  src: ['统编 2024 一上第 13、14 课', '《汉语拼音方案》韵母表及说明 (4)(5)', 'GB/T 16159-2012'],

  /* ================= 看 ================= */
  kan: [
    {
      type: 'scene', lv: 1, h: '一个东西，一个韵母',
      note: '点图看韵母。上一排是前鼻韵母，下一排是后鼻韵母。云 yún 是整体认读音节，读法和 ün 一样。',
      items: [
        { letter: 'an', thing: '一座小山', word: '山', py: 'shān',
          svg: '<svg viewBox="0 0 200 150"><path d="M10 136 L62 52 L96 104 L118 74 L150 136 Z" class="svg-green"/><path d="M50 72 L62 52 L74 72 L66 68 L58 74 Z" class="svg-panel"/><circle cx="34" cy="34" r="12" class="svg-accent" opacity=".6"/></svg>' },
        { letter: 'en', thing: '一个花盆', word: '盆', py: 'pén',
          svg: '<svg viewBox="0 0 200 150"><path d="M46 84 L134 84 L120 138 L60 138 Z" class="svg-red" opacity=".85"/><rect x="40" y="76" width="100" height="14" rx="4" class="svg-red"/><path d="M90 76 L90 40" class="svg-green-s" stroke-width="5"/><path d="M90 54 C72 40 62 46 58 56 C72 62 84 60 90 54 Z M90 46 C106 32 118 38 122 48 C108 54 96 52 90 46 Z" class="svg-green"/></svg>' },
        { letter: 'in', thing: '一片树林', word: '林', py: 'lín',
          svg: '<svg viewBox="0 0 200 150"><path d="M40 20 L64 70 L16 70 Z M40 50 L70 104 L10 104 Z" class="svg-green"/><rect x="35" y="104" width="10" height="30" class="svg-deep"/><path d="M104 30 L130 82 L78 82 Z M104 60 L136 116 L72 116 Z" class="svg-green" opacity=".8"/><rect x="99" y="116" width="10" height="20" class="svg-deep"/></svg>' },
        { letter: 'un', thing: '一个车轮', word: '轮', py: 'lún',
          svg: '<svg viewBox="0 0 200 150"><circle cx="82" cy="78" r="56" class="svg-panel svg-deep-s" stroke-width="10"/><circle cx="82" cy="78" r="10" class="svg-deep"/><path d="M82 26 L82 130 M30 78 L134 78 M45 41 L119 115 M119 41 L45 115" class="svg-deep-s" stroke-width="4"/></svg>' },
        { letter: 'ün', thing: '一朵白云', word: '云', py: 'yún',
          svg: '<svg viewBox="0 0 200 150"><path d="M30 110 C10 110 10 80 34 78 C30 52 66 44 78 62 C88 36 128 40 128 70 C150 66 156 104 132 110 Z" class="svg-panel svg-blue-s" stroke-width="5"/><circle cx="150" cy="28" r="10" class="svg-accent" opacity=".6"/></svg>' },
        { letter: 'ang', thing: '一颗糖', word: '糖', py: 'táng',
          svg: '<svg viewBox="0 0 200 150"><path d="M46 76 L14 52 L20 76 L14 100 Z M134 76 L166 52 L160 76 L166 100 Z" class="svg-accent"/><ellipse cx="90" cy="76" rx="48" ry="32" class="svg-red"/><path d="M60 60 C80 70 100 82 120 92 M58 80 C74 88 92 96 108 104" fill="none" class="svg-accent-s" stroke-width="5" opacity=".8"/></svg>' },
        { letter: 'eng', thing: '一盏台灯', word: '灯', py: 'dēng',
          svg: '<svg viewBox="0 0 200 150"><path d="M50 70 L70 24 L110 24 L130 70 Z" class="svg-accent"/><path d="M90 70 L90 126" class="svg-deep-s" stroke-width="6"/><rect x="58" y="124" width="64" height="12" rx="5" class="svg-deep"/><path d="M60 82 L44 104 M90 84 L90 104 M120 82 L136 104" class="svg-accent-s" stroke-width="3" opacity=".6"/></svg>' },
        { letter: 'ing', thing: '一颗星星', word: '星', py: 'xīng',
          svg: '<svg viewBox="0 0 200 150"><path d="M86 14 L102 56 L146 58 L112 86 L124 130 L86 104 L48 130 L60 86 L26 58 L70 56 Z" class="svg-accent"/><circle cx="150" cy="120" r="4" class="svg-accent"/><circle cx="30" cy="22" r="3" class="svg-accent"/></svg>' },
        { letter: 'ong', thing: '一个闹钟', word: '钟', py: 'zhōng',
          svg: '<svg viewBox="0 0 200 150"><circle cx="58" cy="30" r="14" class="svg-red"/><circle cx="122" cy="30" r="14" class="svg-red"/><circle cx="90" cy="80" r="50" class="svg-panel svg-red-s" stroke-width="7"/><path d="M90 80 L90 48 M90 80 L112 92" class="svg-deep-s" stroke-width="5" stroke-linecap="round"/><path d="M60 128 L50 142 M120 128 L130 142" class="svg-red-s" stroke-width="6"/></svg>' }
      ]
    },
    {
      type: 'anim', lv: 1, kind: 'nasal', h: '收音在哪儿：舌尖还是舌根',
      params: {
        pairs: [
          { front: { f: 'an', play: 'an1' }, back: { f: 'ang', play: 'ang1' } },
          { front: { f: 'en', play: 'en1' }, back: { f: 'eng', play: 'eng1' } },
          { front: { f: 'in', play: 'yin1', note: '借 yin' }, back: { f: 'ing', play: 'ying1', note: '借 ying' } }
        ],
        front: '前鼻 -n：舌尖往上，顶住上牙后面的牙床（齿龈），声音从鼻子出来',
        back: '后鼻 -ng：舌尖放下，舌根往上抬，顶住口腔后上方（软腭），声音从鼻子出来',
        view: '口腔侧剖面，只画上颚、牙床、舌头的线条'
      },
      fallback: '前鼻韵母：读完元音，舌尖马上往上「顶」到上牙后面，收得早、收得短，所以叫前鼻。后鼻韵母：读完元音，舌尖放下，舌头的后部往上「抬」，声音在嘴巴深处收住，听起来更响、更长，所以叫后鼻。自己试：读 an 时舌尖最后在上面；读 ang 时舌尖最后在下面，嘴巴还张着。'
    },
    {
      type: 'text', lv: 1, h: '前鼻和后鼻，怎么分',
      p: [
        '<b>看</b>：后鼻韵母比前鼻韵母多一个 g。an 加 g 是 ang，en 加 g 是 eng，in 加 g 是 ing。',
        '<b>听</b>：前鼻收得早，像轻轻一点；后鼻收得深，像在嘴里多转一圈。{py:jīn}（金）和 {py:jīng}（京）、{py:shān}（山）和 {py:shāng}（伤），听听哪里不一样。',
        '<b>摸</b>：读完不要动，看看舌尖在哪儿：在上面是前鼻，在下面是后鼻。'
      ]
    },
    {
      type: 'table', lv: 2, h: '成对记：前鼻 ↔ 后鼻',
      head: ['前鼻韵母', '例子', '后鼻韵母', '例子'],
      rows: [
        ['an', '{py:bān}（班）{py:fàn}（饭）', 'ang', '{py:bāng}（帮）{py:fàng}（放）'],
        ['en', '{py:pén}（盆）{py:chén}（晨）', 'eng', '{py:péng}（棚）{py:chéng}（城）'],
        ['in', '{py:jīn}（金）{py:lín}（林）', 'ing', '{py:jīng}（京）{py:líng}（铃）'],
        ['un（uen）', '{py:dūn}（蹲）{py:lún}（轮）', 'ong', '{py:dōng}（东）{py:lóng}（龙）'],
        ['ün', '{py:xún}（寻）{py:qún}（裙）', 'iong（三拼）', '{py:xióng}（熊）{py:qióng}（穷）']
      ],
      note: 'un/ong、ün/iong 只是并排放着比较读音，不是严格的前后鼻对子；iong 在三拼音节里学。'
    },
    {
      type: 'text', lv: 2, h: '写法规则：un 是省写，ün 会摘掉两点，ong 不单独出现',
      p: [
        '<b>un 是 uen 的省写</b>：前面有声母时写 un，如 {py:lún}、{py:chūn}；前面没有声母时不省，写成 {py:wén}（文）。',
        '<b>ün 遇到 j q x y 摘掉两点</b>：{py:jūn}（军）、{py:qún}（裙）、{py:xún}（寻）、{py:yún}（云）。这时的 u 读 ü，不读 u。比较 {py:lún}（轮，u）和 {py:jūn}（军，ü）。',
        '<b>ong 前面一定有声母</b>：{py:hóng}（红）、{py:dōng}（东）、{py:zhōng}（中）。没有声母时，同一个韵母写成 {py:wēng}（翁）。',
        '<b>yin yun ying（还有 yuan）是整体认读音节</b>，看到直接读：{py:yīn}（音）、{py:yún}（云）、{py:yǐng}（影）、{py:yuǎn}（远）。'
      ],
      note: '《汉语拼音方案》韵母表说明 (4)(5)；ueng 只用于零声母 weng，带声母时写 ong（《方案》韵母表）。'
    },
    {
      type: 'table', lv: 3, h: '《汉语拼音方案》韵母表 35 格（★ = 教材 24 个韵母里的）',
      head: ['第一列（不带 i u ü）', 'i 列（齐齿）', 'u 列（合口）', 'ü 列（撮口）'],
      rows: [
        ['—', 'i ★', 'u ★', 'ü ★'],
        ['a ★', 'ia', 'ua', '—'],
        ['o ★', '—', 'uo', '—'],
        ['e ★', 'ie ★', '—', 'üe ★'],
        ['ai ★', '—', 'uai', '—'],
        ['ei ★', '—', 'uei（ui）★', '—'],
        ['ao ★', 'iao', '—', '—'],
        ['ou ★', 'iou（iu）★', '—', '—'],
        ['an ★', 'ian', 'uan', 'üan'],
        ['en ★', 'in ★', 'uen（un）★', 'ün ★'],
        ['ang ★', 'iang', 'uang', '—'],
        ['eng ★', 'ing ★', 'ueng', '—'],
        ['ong ★', 'iong', '—', '—']
      ],
      note: '13 行共 35 格，带 ★ 的 23 个加上表外的 er，就是教材的 24 个韵母。表外另有 -i（zhi chi shi ri zi ci si 的韵母）、er、ê，加起来常说「39 个韵母」（这是推算，《方案》原文没写 39）。'
    },
    {
      type: 'text', lv: 3, h: '-n 和 -ng 的学理',
      p: [
        '-n 是舌尖中鼻音：舌尖抵住上齿龈，软腭下垂，气流从鼻腔出来。-ng 是舌面后（舌根）鼻音：舌根抵住软腭，气流从鼻腔出来。两者都是韵尾，只做「收」的动作，不像声母 n 那样再放开。',
        '韵尾还会影响前面的元音：an 里的 a 偏前，ang 里的 a 偏后；ian、üan 里的 a 实际读得接近 ê。所以分前后鼻，不能只盯着最后一个音，整个韵母的音色都不同。',
        '35 格的排法和 24 个韵母的分组不是一回事：《方案》按开头是不是 i、u、ü 分列（四呼），教材按「单、复、鼻」分课。ong 在《方案》里排在第一列，但它实际读音以 u 类元音开头，语音学上归合口呼；iong 排在 i 列，实际归撮口呼。',
        '不少方言里 in/ing、en/eng 读成一样（多是只有一种），说这些方言的孩子学普通话时最容易混。记字的小办法：同一个声旁的字，前后鼻往往一样，见下面的表。'
      ],
      note: '依据：《汉语拼音方案》韵母表；鼻韵尾发音部位为语音学通行描写；方言前后鼻混同见调研报告 §3.3 常见错误清单。'
    },
    {
      type: 'table', lv: 3, h: '看声旁记前后鼻（自编整理）',
      head: ['声旁', '前鼻 / 后鼻', '例字'],
      rows: [
        ['分', '前鼻 en', '{py:fěn}（粉）{py:fèn}（份）{py:fēn}（芬）'],
        ['真', '前鼻 en', '{py:zhèn}（镇）{py:shèn}（慎）'],
        ['青', '后鼻 ing', '{py:qīng}（清）{py:qíng}（晴）{py:jīng}（睛）{py:qǐng}（请）'],
        ['令', '后鼻 ing', '{py:líng}（铃）{py:lǐng}（领）{py:líng}（零）'],
        ['生', '后鼻 eng/ing', '{py:shēng}（牲）{py:xīng}（星）{py:xìng}（姓）']
      ],
      note: '这是记字的小规律，不是规则：同声旁也有例外，以字典为准。'
    }
  ],

  /* ================= 听读 ================= */
  ting: [
    {
      type: 'chips', lv: 1, h: '9 个韵母，点开听四声',
      items: [
        { t: 'an', play: 'an1', tones: 'an' },
        { t: 'en', play: 'en1', tones: 'en' },
        { t: 'in', play: 'yin1', tones: 'yin', sub: '借 yin' },
        { t: 'un', play: 'wen1', tones: 'wen', sub: '借 wen' },
        { t: 'ün', play: 'yun1', tones: 'yun', sub: '借 yun' },
        { t: 'ang', play: 'ang1', tones: 'ang' },
        { t: 'eng', play: 'eng1', tones: 'eng' },
        { t: 'ing', play: 'ying1', tones: 'ying', sub: '借 ying' },
        { t: 'ong', sub: '无单念录音' }
      ],
      note: '录音是音节录音（Chen Wang，audio-cmn）。in un ün ing 没有单念录音，借零声母音节 yin wen yun ying。ong 不能单独成音节，没有录音，请听下面带声母的 ong。'
    },
    {
      type: 'pairs', lv: 1, h: '前鼻、后鼻，成对听',
      pairs: [
        [{ t: 'bān', play: 'ban1' }, { t: 'bāng', play: 'bang1' }],
        [{ t: 'shān', play: 'shan1' }, { t: 'shāng', play: 'shang1' }],
        [{ t: 'pén', play: 'pen2' }, { t: 'péng', play: 'peng2' }],
        [{ t: 'chén', play: 'chen2' }, { t: 'chéng', play: 'cheng2' }],
        [{ t: 'jīn', play: 'jin1' }, { t: 'jīng', play: 'jing1' }],
        [{ t: 'lín', play: 'lin2' }, { t: 'líng', play: 'ling2' }],
        [{ t: 'xīn', play: 'xin1' }, { t: 'xīng', play: 'xing1' }]
      ],
      tip: '每一对左边是前鼻、右边是后鼻。先听左边，再听右边：右边的尾巴更长、更「嗡」，像在嘴巴深处转了一下。'
    },
    {
      type: 'groups', lv: 1, h: '带上声母读一读（按课）',
      groups: [
        { label: '第 13 课 an en in un ün', items: [
          { t: 'shān', play: 'shan1', sub: '山' }, { t: 'fàn', play: 'fan4', sub: '饭' }, { t: 'mén', play: 'men2', sub: '门' },
          { t: 'gēn', play: 'gen1', sub: '根' }, { t: 'lín', play: 'lin2', sub: '林' }, { t: 'xīn', play: 'xin1', sub: '心' },
          { t: 'lún', play: 'lun2', sub: '轮' }, { t: 'chūn', play: 'chun1', sub: '春' }, { t: 'qún', play: 'qun2', sub: '裙' }, { t: 'jūn', play: 'jun1', sub: '军' } ] },
        { label: '第 14 课 ang eng ing ong', items: [
          { t: 'táng', play: 'tang2', sub: '糖' }, { t: 'fáng', play: 'fang2', sub: '房' }, { t: 'dēng', play: 'deng1', sub: '灯' },
          { t: 'fēng', play: 'feng1', sub: '风' }, { t: 'xīng', play: 'xing1', sub: '星' }, { t: 'tīng', play: 'ting1', sub: '听' },
          { t: 'hóng', play: 'hong2', sub: '红' }, { t: 'dōng', play: 'dong1', sub: '东' }, { t: 'zhōng', play: 'zhong1', sub: '中' } ] }
      ]
    },
    {
      type: 'chips', lv: 1, h: 'ong 要和声母一起读',
      items: [
        { t: 'dōng', play: 'dong1', tones: 'dong', sub: '冬' },
        { t: 'hóng', play: 'hong2', tones: 'hong', sub: '红' },
        { t: 'lóng', play: 'long2', tones: 'long', sub: '龙' },
        { t: 'sōng', play: 'song1', tones: 'song', sub: '松' },
        { t: 'zhōng', play: 'zhong1', tones: 'zhong', sub: '钟' },
        { t: 'gōng', play: 'gong1', tones: 'gong', sub: '公' }
      ],
      note: '听的时候把声母去掉，后面剩下的就是 ong。'
    },
    {
      type: 'chips', lv: 2, h: '整体认读：yuan yin yun ying',
      items: [
        { t: 'yuǎn', play: 'yuan3', tones: 'yuan', sub: '远' },
        { t: 'yīn', play: 'yin1', tones: 'yin', sub: '音' },
        { t: 'yún', play: 'yun2', tones: 'yun', sub: '云' },
        { t: 'yǐng', play: 'ying3', tones: 'ying', sub: '影' }
      ],
      note: '这 4 个看到就读，不拆开拼。统编 2024 一上第 13 课学 yuan yin yun，第 14 课学 ying。'
    },
    {
      type: 'pairs', lv: 2, h: '还有两对：un/ong、ün/iong',
      pairs: [
        [{ t: 'dūn', play: 'dun1' }, { t: 'dōng', play: 'dong1' }],
        [{ t: 'lún', play: 'lun2' }, { t: 'lóng', play: 'long2' }],
        [{ t: 'xún', play: 'xun2' }, { t: 'xióng', play: 'xiong2' }],
        [{ t: 'qún', play: 'qun2' }, { t: 'qióng', play: 'qiong2' }]
      ],
      tip: 'dūn 的 u 后面还有一个轻轻的 e（uen 省写），收在舌尖；dōng 收在舌根，嘴唇一直圆着。'
    }
  ],

  /* ================= 练 ================= */
  lian: [
    {
      type: 'quiz-listen', lv: 1, h: '听音选韵母', ask: 'final',
      pool: ['shan1', 'fan4', 'ban1', 'men2', 'gen1', 'pen2', 'lin2', 'xin1', 'jin1', 'lun2', 'chun1', 'dun1',
        'tang2', 'fang2', 'bang1', 'deng1', 'feng1', 'peng2', 'xing1', 'ting1', 'jing1', 'hong2', 'dong1', 'zhong1'],
      options: ['an', 'en', 'in', 'un', 'ang', 'eng', 'ing', 'ong'],
      note: 'ün 只和 j q x 相拼，写出来是 un（两点省了），所以这里不考 ün；ün 在下面的拼读机和「想一想」里练。'
    },
    {
      type: 'quiz-listen', lv: 1, h: '前后鼻对对碰：in 还是 ing', ask: 'final',
      pool: ['jin1', 'jing1', 'xin1', 'xing1', 'lin2', 'ling2', 'pin2', 'ping2', 'min2', 'ming2', 'qin2', 'qing2'],
      options: ['in', 'ing']
    },
    {
      type: 'quiz-listen', lv: 2, h: '前后鼻对对碰：an/ang、en/eng', ask: 'final',
      pool: ['ban1', 'bang1', 'fan2', 'fang2', 'tan2', 'tang2', 'zhan4', 'zhang4', 'ben1', 'beng1', 'chen2', 'cheng2', 'men2', 'meng2', 'fen1', 'feng1', 'pen2', 'peng2'],
      options: ['an', 'ang', 'en', 'eng']
    },
    {
      type: 'quiz-build', lv: 1, h: '拼读机：声母碰鼻韵母',
      initials: ['b', 'm', 'f', 'd', 'l', 'g', 'h', 'j', 'q', 'x', 'zh'],
      finals: ['an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'],
      tones: [1, 2, 3, 4]
    },
    {
      type: 'quiz-find', lv: 1, h: '找一找：点出所有的 ing', target: 'ing', distract: ['in', 'eng', 'ang'], n: 12
    },
    {
      type: 'quiz-choose', lv: 1, h: '想一想',
      items: [
        { q: '哪个是后鼻韵母？', options: ['ang', 'an', 'en'], answer: 0, why: '后鼻韵母都带 ng：ang eng ing ong。' },
        { q: '「星」{py:xīng} 的韵母是哪个？', options: ['ing', 'in', 'ong'], answer: 0, why: 'x + ing，收在舌根，是后鼻韵母。' },
        { q: '「云」的拼音怎么写？', options: ['yún', 'yǘn', 'ün'], answer: 0, why: 'ün 前面没有声母时写成 yun，ü 上两点省略。yun 是整体认读音节。' },
        { q: '读完前鼻韵母 an，舌尖在哪儿？', options: ['在上面，顶着上牙后面', '在下面', '伸到嘴外面'], answer: 0, why: '前鼻 -n 收在舌尖，舌尖往上顶。' },
        { q: '「门」{py:mén} 和「梦」{py:mèng}，哪个是前鼻？', options: ['门 mén', '梦 mèng', '都是'], answer: 0, why: 'en 是前鼻，eng 是后鼻。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 2, h: '写法规则',
      items: [
        { q: '{py:chūn} 的韵母写全了是什么？', options: ['uen', 'un', 'ün'], answer: 0, why: 'uen 前面有声母时省写成 un（《方案》说明 (5)）。' },
        { q: '{py:qún}（裙）里的 u 读什么？', options: ['ü', 'u', 'o'], answer: 0, why: 'q 只和 ü 相拼，所以 qun 的 u 是 ü，两点省略。' },
        { q: '下面哪个写法对？', options: ['hóng', 'óng', 'xóng'], answer: 0, why: 'ong 前面一定有声母；x 不和 ong 相拼（x 后面要用 iong：xióng）。' },
        { q: '哪一组都是整体认读音节？', options: ['yuan yin yun ying', 'yan yang yin ying', 'wen weng yun yin'], answer: 0, why: '统编教材的 16 个整体认读音节里，鼻韵母一类是 yuan yin yun ying。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 3, h: '学理',
      items: [
        { q: '-ng 的发音部位是？', options: ['舌根抵软腭', '舌尖抵上齿龈', '双唇闭合'], answer: 0, why: '-ng 是舌面后（舌根）鼻音；-n 是舌尖中鼻音。' },
        { q: '《方案》韵母表一共多少格？', options: ['35', '24', '39'], answer: 0, why: '韵母表 13 行共 35 格；24 是教材的分组，39 是加上 -i、er、ê 的推算数。' },
        { q: '按实际读音，iong 归哪一呼？', options: ['撮口呼', '齐齿呼', '开口呼'], answer: 0, why: '《方案》把 iong 排在 i 列，但它实际以 ü 类音开头，语音学上归撮口呼。' }
      ]
    }
  ],

  /* ================= 用 ================= */
  yong: [
    {
      type: 'words', lv: 1, h: '读词语',
      items: [
        { w: '森林', py: 'sēn lín' },
        { w: '白云', py: 'bái yún' },
        { w: '星星', py: 'xīng xing' },
        { w: '红灯', py: 'hóng dēng' },
        { w: '春天', py: 'chūn tiān' },
        { w: '山顶', py: 'shān dǐng' },
        { w: '冬瓜', py: 'dōng guā' },
        { w: '金鱼', py: 'jīn yú' },
        { w: '晴天', py: 'qíng tiān' },
        { w: '门铃', py: 'mén líng' },
        { w: '糖果', py: 'táng guǒ' },
        { w: '蜜蜂', py: 'mì fēng' },
        { w: '轮船', py: 'lún chuán' },
        { w: '裙子', py: 'qún zi' }
      ],
      note: '「星星」的第二个「星」、「裙子」的「子」读轻声，不标调。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌', title: '小白云看灯',
      lines: [
        { w: '天上一朵小白云，', py: 'tiān shàng yī duǒ xiǎo bái yún,' },
        { w: '飘到山顶去看灯。', py: 'piāo dào shān dǐng qù kàn dēng.' },
        { w: '山顶没有红灯笼，', py: 'shān dǐng méi yǒu hóng dēng long,' },
        { w: '只有星星亮晶晶。', py: 'zhǐ yǒu xīng xing liàng jīng jīng.' }
      ],
      real: { '一': 'yì', '只': 'zhí' },
      note: '找一找：天 ian、上 ang、云 ün（yun）、山 an、顶 ing、看 an、灯 eng、红 ong、星 ing、亮 iang、晶 ing。L2 起显示实际读音：「一朵」的「一」读 yì；「只有」两个三声相连，「只」读得像 zhí。'
    },
    {
      type: 'verse', lv: 1, h: '短句：前鼻后鼻比一比', title: '比一比',
      lines: [
        { w: '金鱼小，鲸鱼大。', py: 'jīn yú xiǎo, jīng yú dà.' },
        { w: '木盆放在木棚旁。', py: 'mù pén fàng zài mù péng páng.' },
        { w: '天晴了，小猫去弹琴。', py: 'tiān qíng le, xiǎo māo qù tán qín.' }
      ],
      note: '金 jīn / 鲸 jīng，盆 pén / 棚 péng，晴 qíng / 琴 qín：每一对左边前鼻、右边后鼻（第三对先后鼻再前鼻）。'
    }
  ]
};
