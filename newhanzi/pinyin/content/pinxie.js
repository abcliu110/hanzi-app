/* 拼音区 · 拼写规则（pinxie）。讲解、例词、例句、儿歌、情境图全部自编；规则条款见 src。
 * 格式见 pinyin/content/SCHEMA.md。只引用 pinyin/audio/index.js 里有的音节键。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['pinxie'] = {
  id: 'pinxie', name: '拼写规则', lv: 'L1–L3',
  lead: '同一个音，拼音要按规矩写：调号戴在哪个字母上，ü 的两点什么时候摘，y、w 什么时候请出来，哪些字母可以省，什么时候加一撇，大写字母怎么用。',
  src: [
    '《汉语拼音方案》（1958）：字母表、韵母表说明 (4)(5)、声调符号、隔音符号',
    'GB/T 16159-2012《汉语拼音正词法基本规则》第 5.1、5.5、6.1.1.1、6.1.2.1、6.1.2.4、6.3.1、6.3.2、6.5.1、6.5.2、6.6.1、6.6.2、7.1 条',
    '教育部《汉语拼音的教学特色》（标调口诀、ü 省点口诀）',
    '《义务教育语文课程标准（2022 年版）》第一学段：认识大写字母，熟记《汉语拼音字母表》；学会音序检字法',
    '统编 2024 一上第 6 课（j q x 与 ü）、第 9 课（y w）、第 10–14 课（iu ui un 省写）'
  ],

  /* ================= 看 ================= */
  kan: [
    { type: 'text', lv: 1, h: '调号是一顶小帽子：戴在最响的字母头上',
      p: [
        '一个音节里可能有好几个元音字母，调号只戴一个。谁读得最响亮，帽子就给谁。',
        '先找 a：{py:hǎo} {py:huā} {py:tiān}，有 a 就戴在 a 上。',
        '没有 a，再找 o 或 e：{py:duō} {py:gěi} {py:xué}。',
        'i 和 u 手拉手站在一起，帽子戴在后面那个字母上：{py:liú} {py:guì} {py:jiǔ} {py:shuǐ}。',
        '只有一个元音，就戴在它头上：{py:bǐ} {py:lù} {py:nǚ}。戴在 i 头上时，i 的小点要摘掉，不然点和帽子会挤在一起：{py:bǐ} {py:xīn}。'
      ],
      note: '标调口诀「有 a 不放过，没有 a 找 o e，i u 并列标在后，这样标调不会错」引自教育部《汉语拼音的教学特色》，和 GB/T 16159-2012 第 6.5.1 条一致；「小帽子」的说法和例子为自编。' },

    { type: 'scene', lv: 1, h: 'ü 的「眼镜」：遇到 j q x y 摘下来，遇到 n l 不摘',
      items: [
        { letter: 'ju', thing: '一朵菊花', word: '菊', py: 'jú',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><circle cx="50" cy="40" r="9"/><ellipse cx="50" cy="20" rx="6" ry="11"/><ellipse cx="50" cy="60" rx="6" ry="11"/><ellipse cx="30" cy="40" rx="11" ry="6"/><ellipse cx="70" cy="40" rx="11" ry="6"/><path d="M50 71 V94 M50 84 q-12 -4 -16 -12"/></svg>' },
        { letter: 'quan', thing: '套圈用的大圆圈', word: '圈', py: 'quān',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><circle cx="50" cy="52" r="32"/><circle cx="50" cy="52" r="24" stroke-width="2" stroke-dasharray="6 6"/></svg>' },
        { letter: 'xue', thing: '一片雪花', word: '雪', py: 'xuě',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M50 12 V88 M17 31 L83 69 M17 69 L83 31"/><path d="M42 20 L50 28 L58 20 M42 80 L50 72 L58 80"/></svg>' },
        { letter: 'yu', thing: '水里的小鱼', word: '鱼', py: 'yú',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><path d="M18 50 Q45 22 72 50 Q45 78 18 50 Z"/><path d="M72 50 L90 36 L90 64 Z"/><circle cx="32" cy="46" r="3" fill="currentColor"/><path d="M10 84 q10 -6 20 0 q10 6 20 0 q10 -6 20 0" stroke-width="3"/></svg>' },
        { letter: 'lü', thing: '长耳朵的小毛驴', word: '驴', py: 'lǘ',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="22" y="44" width="46" height="24" rx="11"/><path d="M66 48 L78 30 L90 36 L80 52 Z"/><path d="M78 30 L74 12 M83 32 L86 14"/><path d="M30 68 V88 M42 68 V88 M54 68 V88 M62 68 V88"/><path d="M22 52 q-10 4 -8 16"/></svg>' },
        { letter: 'lü', thing: '一片绿叶', word: '绿', py: 'lǜ',
          svg: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M20 80 Q20 24 82 18 Q78 78 20 80 Z"/><path d="M20 80 L66 34 M40 60 L38 44 M52 48 L64 50"/></svg>' }
      ],
      note: '前四个：ü 跟 j、q、x 相拼或自己出门（写成 yu），两点摘掉，读音还是 ü。后两个：跟 l 相拼，两点留着，因为 lu 是另一个音（路 lù）。依据《汉语拼音方案》韵母表说明 (4)；口诀「j q x y 四兄弟，和 ü 相拼把点去」见教育部《汉语拼音的教学特色》。图为自编，只画物和动物。' },

    { type: 'table', lv: 2, h: 'ü 上两点：省还是不省，为什么',
      head: ['ü 前面是', '怎么写', '为什么可以 / 不可以省', '例'],
      rows: [
        ['j、q、x', '省点：ju qu xu、jue que xue、juan quan xuan、jun qun xun', 'j q x 从来不和 u 相拼，看到 ju 就知道里面是 ü，不会弄错', '{py:jú}{zi:菊} {py:quān}{zi:圈} {py:xuě}{zi:雪}'],
        ['没有声母', '前面加 y，省点：yu yue yuan yun', '有 y 在前面开门，也不会和 wu 弄混', '{py:yú}{zi:鱼} {py:yuè}{zi:月} {py:yún}{zi:云}'],
        ['n、l', '不省：nü lü、nüe lüe', 'nu、lu 也是音节，省了就分不清', '{py:nǚ}{zi:女} / {py:nǔ}{zi:努}；{py:lǜ}{zi:绿} / {py:lù}{zi:路}'],
        ['其他声母', '不出现', 'b p m f d t g k h zh ch sh r z c s 都不和 ü 相拼', '—']
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (4)。' },

    { type: 'table', lv: 2, h: 'y、w 什么时候来，iou uei uen 什么时候省',
      head: ['韵母', '前面没有声母时', '前面有声母时'],
      rows: [
        ['i、in、ing', '前面加 y：yi yin ying', '照写：{py:bǐ} {py:xīn} {py:líng}'],
        ['ia ie iao iou ian iang iong', 'i 改成 y：ya ye yao you yan yang yong', 'iou 省写成 iu：{py:niú} {py:liù}；其余照写：{py:jiā} {py:xiǎo}'],
        ['u', '前面加 w：wu', '照写：{py:lù} {py:hú}'],
        ['ua uo uai uei uan uen uang ueng', 'u 改成 w：wa wo wai wei wan wen wang weng', 'uei 省写成 ui：{py:guì} {py:shuǐ}；uen 省写成 un：{py:lún} {py:chūn}'],
        ['ü üe üan ün', '前面加 y，ü 去点：yu yue yuan yun', 'j q x 后去点；n l 后留点（见上表）']
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (4)(5)。统编 2024 一上第 9 课 y、w 单独设课，y、w 不算声母，声母是 21 个。' },

    { type: 'text', lv: 2, h: '隔音符号：两个音节挤在一起时，加一撇隔开',
      p: [
        '拼音按词连着写时，a、o、e 开头的音节如果跟在别的音节后面，可能看不清在哪儿断开，就在它前面加一个小撇「\'」，叫隔音符号。',
        "Xī'ān（西安）：不加撇写成 xian，就和一个音节的 {py:xiān}（先）一样了。",
        "fāng'àn（方案）：不加撇写成 fangan，也可能被读成 fān gàn。",
        "píng'ān（平安）、hǎi'ōu（海鸥）、Tiān'ānmén（天安门）、kě'ài（可爱）：后一个音节都是 a、o、e 开头。",
        'i、u、ü 开头的音节不用加撇：它们没有声母时本来就写成 y、w 开头，y、w 已经把界限隔开了，比如 dàyú（大鱼）、xiàwǔ（下午）。'
      ],
      note: '依据：《汉语拼音方案》第五部分「隔音符号」（方案原例 pi\'ao 皮袄）。上面的词例为自选。课本给每个字单独注音（GB/T 16159-2012 第 7.1 条按字注音）时，音节本来就分开写，所以课本上很少看到这一撇。' },

    { type: 'table', lv: 2, h: '大写字母和小写字母：《汉语拼音字母表》',
      head: ['', '1', '2', '3', '4', '5', '6', '7'],
      rows: [
        ['第一行', 'A a', 'B b', 'C c', 'D d', 'E e', 'F f', 'G g'],
        ['第二行', 'H h', 'I i', 'J j', 'K k', 'L l', 'M m', 'N n'],
        ['第三行', 'O o', 'P p', 'Q q', 'R r', 'S s', 'T t', ''],
        ['第四行', 'U u', 'V v', 'W w', 'X x', 'Y y', 'Z z', '']
      ],
      note: '26 个字母，顺序和英文字母一样。分成四行是本页为了好记自编的分法，可以照这个节奏唱着背。v 只用来拼写外来语、少数民族语言和地方话，普通话音节里不用（《汉语拼音方案》字母表）。课标要求一、二年级认识大写字母、熟记字母表。' },

    { type: 'text', lv: 3, h: '规则背后的道理',
      p: [
        '省点为什么只在 j q x y 后面：普通话里 j、q、x 只和 i、ü 开头的韵母相拼，从不和 u 相拼；y 开头的 yu 也不会和 wu 撞车。所以两点写不写都不会读错，就省掉了，这叫「省写」，只是为了写起来简便，和发音无关。n、l 后面 u 和 ü 都能出现（{py:nǔ} / {py:nǚ}），所以必须留着。',
        'iou、uei、uen 为什么能省：前面有声母时，中间的 o、e 读得很弱，几乎听不出来，于是写成 iu、ui、un（《方案》说明 (5)）。省掉的正好是韵腹，调号没地方戴了，所以规定标在后一个字母上：{py:liú} {py:guì}（GB/T 16159-2012 第 6.5.1 条）。un 里的 u 本来就是唯一剩下的元音，直接标在 u 上：{py:lún}。',
        'y、w 不是声母：它们是零声母音节的书写方式，作用是隔开音节，和隔音符号是同一个目的。所以 2024 版教材明确声母是 21 个，y、w 单独成课。',
        '隔音符号只管 a、o、e 开头的音节，原因同上：i、u、ü 开头的音节在没有声母时已经改写成 y、w 开头。'
      ] },

    { type: 'text', lv: 3, h: '正词法入门：拼音写句子的规矩',
      p: [
        '按词连写（GB/T 16159-2012 第 5.1 条）：拼音写句子时，一个词的几个音节连在一起写，词和词之间空一格。「鸭子」是一个词，写成 yāzi；「子」这类后附成分和前面连写（第 5.5 条）。',
        '名词和后面的方位词分写（第 6.1.1.1 条）：「河里」写成 hé li，「里」在这里读轻声，不标调。',
        '句首大写（第 6.3.1 条）：句子第一个字母大写，句末用小圆点「.」。',
        '专有名词大写（第 6.3.2 条）：地名、国名、节日名等首字母大写，比如 Běijīng（北京）、Sìchuān（四川）。',
        '课本为什么一个字一个字地注音：GB/T 16159-2012 第 7.1 条变通规则规定，小学低年级和幼儿识字读物可以按字注音。所以一年级课本的写法不算错，只是还没用上正词法。',
        "移行（第 6.6.1 条）：一行写不下时，要按音节断开，在断开处加连接号「-」，音节内部不能拆：guāng-（下一行）míng，不能拆成 gu-āngmíng。带隔音符号的词移行时，去掉隔音符号，改加连接号（第 6.6.2 条）：Xī-（下一行）ān。"
      ],
      note: '例句「小鸭子在河里游」「小熊猫住在四川」为自编，见「用」里的对照表。' }
  ],

  /* ================= 听读 ================= */
  ting: [
    { type: 'pairs', lv: 1, h: '两点不能乱摘：ü 和 u 对比听',
      pairs: [
        [{ t: 'nǚ 女', play: 'nv3' }, { t: 'nǔ 努', play: 'nu3' }],
        [{ t: 'lǜ 绿', play: 'lv4' }, { t: 'lù 路', play: 'lu4' }],
        [{ t: 'lǘ 驴', play: 'lv2' }, { t: 'lú 炉', play: 'lu2' }],
        [{ t: 'lǚ 旅', play: 'lv3' }, { t: 'lǔ 鲁', play: 'lu3' }],
        [{ t: 'nüè 虐', play: 'nve4' }, { t: 'lüè 略', play: 'lve4' }]
      ],
      tip: '左右两个读音不一样：n、l 后面摘了两点，nǚ 就变成了 nǔ。最后一对都留着两点，听 n 和 l 的不同。' },

    { type: 'chips', lv: 1, h: '摘了眼镜还是 ü：j q x y 后面的「u」',
      items: [
        { t: 'jú', play: 'ju2', sub: '菊' }, { t: 'qù', play: 'qu4', sub: '去' }, { t: 'xū', play: 'xu1', sub: '需' },
        { t: 'yú', play: 'yu2', sub: '鱼' }, { t: 'xué', play: 'xue2', sub: '学' }, { t: 'yuè', play: 'yue4', sub: '月' },
        { t: 'juǎn', play: 'juan3', sub: '卷' }, { t: 'quān', play: 'quan1', sub: '圈' }, { t: 'qún', play: 'qun2', sub: '裙' },
        { t: 'yún', play: 'yun2', sub: '云' }
      ] },

    { type: 'chips', lv: 1, h: '调号戴在哪：点一点，听一听',
      items: [
        { t: 'hǎo', play: 'hao3', sub: '有 a 找 a' }, { t: 'tiān', play: 'tian1', sub: '有 a 找 a' },
        { t: 'duō', play: 'duo1', sub: '没 a 找 o' }, { t: 'xué', play: 'xue2', sub: '没 a 找 e' },
        { t: 'liú', play: 'liu2', sub: 'iu 标后' }, { t: 'guì', play: 'gui4', sub: 'ui 标后' },
        { t: 'bǐ', play: 'bi3', sub: 'i 去点' }, { t: 'lǜ', play: 'lv4', sub: 'ü 上标' }
      ] },

    { type: 'groups', lv: 2, h: '省写的音节：读的时候中间藏着一个弱弱的音',
      groups: [
        { label: 'iu = iou', items: [{ t: 'niú', play: 'niu2', sub: '牛' }, { t: 'liù', play: 'liu4', sub: '六' }, { t: 'qiū', play: 'qiu1', sub: '秋' }, { t: 'jiǔ', play: 'jiu3', sub: '九' }] },
        { label: 'ui = uei', items: [{ t: 'duì', play: 'dui4', sub: '对' }, { t: 'shuǐ', play: 'shui3', sub: '水' }, { t: 'huī', play: 'hui1', sub: '灰' }, { t: 'zuǐ', play: 'zui3', sub: '嘴' }] },
        { label: 'un = uen', items: [{ t: 'lún', play: 'lun2', sub: '轮' }, { t: 'chūn', play: 'chun1', sub: '春' }, { t: 'dūn', play: 'dun1', sub: '蹲' }, { t: 'gǔn', play: 'gun3', sub: '滚' }] },
        { label: '没有声母时写全', items: [{ t: 'yóu', play: 'you2', sub: '油（iou）' }, { t: 'wèi', play: 'wei4', sub: '喂（uei）' }, { t: 'wén', play: 'wen2', sub: '闻（uen）' }] }
      ] },

    { type: 'groups', lv: 2, h: '加不加那一撇，读法不一样',
      groups: [
        { label: 'xiān 先：一个音节', items: [{ t: 'xiān', play: 'xian1', sub: '先' }] },
        { label: "Xī'ān 西安：两个音节", items: [{ t: 'xī', play: 'xi1', sub: '西' }, { t: 'ān', play: 'an1', sub: '安' }] },
        { label: "fāng'àn 方案", items: [{ t: 'fāng', play: 'fang1', sub: '方' }, { t: 'àn', play: 'an4', sub: '案' }] },
        { label: '不加撇可能读成 fān gàn', items: [{ t: 'fān', play: 'fan1', sub: '翻' }, { t: 'gàn', play: 'gan4', sub: '干' }] },
        { label: "hǎi'ōu 海鸥", items: [{ t: 'hǎi', play: 'hai3', sub: '海' }, { t: 'ōu', play: 'ou1', sub: '鸥' }] }
      ] }
  ],

  /* ================= 练 ================= */
  lian: [
    { type: 'quiz-mark', lv: 1, h: '标调练习：点调号该戴的字母',
      items: ['hao', 'tian', 'huai', 'duo', 'gei', 'xue', 'dou', 'mei', 'liu', 'gui', 'jiu', 'shui', 'niu', 'sui', 'bi', 'xin', 'lü', 'nü', 'yue', 'qiu', 'xiong', 'lüe', 'pie', 'zuo'] },

    { type: 'quiz-choose', lv: 1, h: 'ü 的两点：留还是摘',
      items: [
        { q: '「菊」的拼音是哪个？', options: ['jú', 'jǘ'], answer: 0, why: 'j 后面的 ü 摘掉两点写成 ju，读音还是 ü。' },
        { q: '「绿」的拼音是哪个？', options: ['lǜ', 'lù'], answer: 0, why: 'l 后面的 ü 不摘点。lù 是「路」。' },
        { q: '「女」的拼音是哪个？', options: ['nǚ', 'nǔ'], answer: 0, why: 'n 后面的 ü 不摘点。nǔ 是「努」。' },
        { q: '「鱼」的拼音是哪个？', options: ['yú', 'yǘ', 'ǘ'], answer: 0, why: 'ü 自己出门要请 y 开门，写成 yu，两点摘掉。' },
        { q: '「雪」的拼音是哪个？', options: ['xuě', 'xüě'], answer: 0, why: 'x 后面的 ü 摘点：xue。' },
        { q: '「去」的拼音是哪个？', options: ['qù', 'qǜ'], answer: 0, why: 'q 后面的 ü 摘点：qu。' },
        { q: '「驴」的拼音是哪个？', options: ['lǘ', 'lú'], answer: 0, why: 'l 后面留点。lú 是「炉」。' },
        { q: '哪一组声母后面的 ü 要摘点？', options: ['j q x y', 'n l', 'b p m f'], answer: 0, why: 'j q x y 四个，和 ü 相拼把点去；n l 留点；b p m f 不和 ü 相拼。' }
      ] },

    { type: 'quiz-find', lv: 1, h: '找一找：哪些是戴着眼镜的 ü', target: 'ü', distract: ['u', 'n', 'y'], n: 12 },

    { type: 'quiz-listen', lv: 2, h: '听音选：留点的 ü 还是 u', ask: 'syllable',
      pool: ['nv3', 'nu3', 'lv4', 'lu4', 'lv2', 'lu2', 'lv3', 'lu3', 'nve4', 'lve4'] },

    { type: 'quiz-choose', lv: 2, h: '改错：哪个写法是对的',
      items: [
        { q: '「流」的拼音哪个对？', options: ['liú', 'lióu', 'líu'], answer: 0, why: 'iou 前面有声母，省写成 iu；i u 并排，调号标在后一个 u 上。' },
        { q: '「贵」的拼音哪个对？', options: ['guì', 'guèi', 'gúi'], answer: 0, why: 'uei 前面有声母，省写成 ui；调号标在后一个 i 上，i 的点去掉。' },
        { q: '「论」的拼音哪个对？', options: ['lùn', 'luèn'], answer: 0, why: 'uen 前面有声母，省写成 un。' },
        { q: '「云」的拼音哪个对？', options: ['yún', 'ǘn', 'yǘn'], answer: 0, why: 'ün 没有声母，前面加 y，两点去掉：yun。' },
        { q: '「我」的拼音哪个对？', options: ['wǒ', 'uǒ'], answer: 0, why: 'uo 没有声母时，u 改写成 w：wo。' },
        { q: '「月」的拼音哪个对？', options: ['yuè', 'üè', 'yüè'], answer: 0, why: 'üe 没有声母，前面加 y，两点去掉：yue。' },
        { q: '「有」的拼音哪个对？', options: ['yǒu', 'iǒu', 'yiǒu'], answer: 0, why: 'iou 没有声母时，i 改成 y：you。' },
        { q: '「西安」按词连写，哪个对？', options: ["Xī'ān", 'Xiān', "xī'ān"], answer: 0, why: 'ān 是 a 开头，跟在 xī 后面要加隔音符号，不然像「先」；西安是地名，开头大写（GB/T 16159-2012 第 6.3.2 条）。' },
        { q: '「平安」按词连写，哪个对？', options: ["píng'ān", 'píngān'], answer: 0, why: '不加撇，píngān 也可以读成 pín gān。' },
        { q: '哪个音节跟在别的音节后面时，可能要加隔音符号？', options: ['ōu', 'yā', 'wū', 'yú'], answer: 0, why: '只有 a、o、e 开头的音节要考虑加撇；y、w 开头的已经隔开了。' },
        { q: '大写字母 Q 的小写是哪个？', options: ['q', 'p', 'g'], answer: 0, why: 'Q 的小写是 q；p 的大写是 P，g 的大写是 G。' },
        { q: '字母表里，紧跟在 N 后面的是哪个字母？', options: ['O', 'M', 'P'], answer: 0, why: '…… L M N O P Q ……' }
      ] },

    { type: 'quiz-choose', lv: 3, h: '正词法小测',
      items: [
        { q: '「小鸭子在河里游。」用正词法写，哪一种对？', options: ['Xiǎo yāzi zài hé li yóu.', 'xiǎo yā zi zài hé lǐ yóu.', 'XiǎoYāzi zàiHéli yóu.'], answer: 0, why: '句首大写（6.3.1）；「鸭子」一个词连写（5.1、5.5）；「河」和方位词「里」分写，里读轻声不标调（6.1.1.1、6.5.1）。第二种是低年级的按字注音写法（7.1），注音可以，但不是正词法；「里」也该标轻声。' },
        { q: '「西安」写到一行末尾要换行，怎么断？', options: ['Xī- ／（下一行）ān', "Xī'- ／（下一行）ān", 'X- ／（下一行）ī\'ān'], answer: 0, why: 'GB/T 16159-2012 第 6.6.2 条：去掉隔音符号，加连接号。' },
        { q: '「光明」移行，哪种断法对？', options: ['guāng- ／（下一行）míng', 'gu- ／（下一行）āngmíng', 'guān- ／（下一行）gmíng'], answer: 0, why: '第 6.6.1 条：按音节分开，音节内部不能拆。' },
        { q: '下面哪个词的拼音开头要大写？', options: ['四川', '大树', '小狗'], answer: 0, why: '四川是地名，专有名词首字母大写（第 6.3.2 条）：Sìchuān。' },
        { q: '为什么 j q x 后面的 ü 可以省掉两点？', options: ['j q x 不和 u 相拼，省了也不会读错', '因为 ü 写起来太麻烦，随便省', '因为 j q x 后面的 ü 读成 u'], answer: 0, why: '省点只是书写上的简便，读音仍是 ü（《方案》说明 (4)）。' },
        { q: 'liú 的调号为什么标在 u 上？', options: ['liu 是 iou 的省写，韵腹 o 没写出来，规定标在后一个字母', '因为 u 比 i 大', '因为 i 上已经有点'], answer: 0, why: 'GB/T 16159-2012 第 6.5.1 条：iu、ui 标在后面的字母上。' },
        { q: '字母 v 在汉语拼音里用来做什么？', options: ['拼写外来语、少数民族语言和地方话', '代替 ü 写在课本上', '是第 22 个声母'], answer: 0, why: '《汉语拼音方案》字母表的规定。电脑输入法用 v 打 ü，只是打字习惯，不是拼写规则。' },
        { q: '一年级课本一个字一个字注音，算不算错？', options: ['不算错，这是低年级识字读物的变通规则', '算错，必须按词连写', '算错，必须全部大写'], answer: 0, why: 'GB/T 16159-2012 第 7.1 条：根据识字需要，可按字注音。' }
      ] }
  ],

  /* ================= 用 ================= */
  yong: [
    { type: 'words', lv: 1, h: '读一读：找找省点、省写和 y、w',
      items: [
        { w: '菊花', py: 'jú huā' }, { w: '下雪', py: 'xià xuě' }, { w: '小鱼', py: 'xiǎo yú' }, { w: '绿叶', py: 'lǜ yè' },
        { w: '毛驴', py: 'máo lǘ' }, { w: '白云', py: 'bái yún' }, { w: '牛奶', py: 'niú nǎi' }, { w: '水杯', py: 'shuǐ bēi' },
        { w: '春天', py: 'chūn tiān' }, { w: '圆圈', py: 'yuán quān' }, { w: '平安', py: 'píng ān' }, { w: '海鸥', py: 'hǎi ōu' },
        { w: '月亮', py: 'yuè liang' }, { w: '乌云', py: 'wū yún' }
      ],
      note: '按字注音（GB/T 16159-2012 第 7.1 条），所以「平安」「海鸥」这里不需要隔音符号；按词连写时要写成 píng\'ān、hǎi\'ōu。「月亮」的「亮」读轻声，不标调，不可点。' },

    { type: 'verse', lv: 1, h: '儿歌', title: '小毛驴',
      lines: [
        { w: '小毛驴，走河边，', py: 'xiǎo máo lǘ, zǒu hé biān,' },
        { w: '河水绿，白云软。', py: 'hé shuǐ lǜ, bái yún ruǎn.' },
        { w: '小鱼吐出小圆圈，', py: 'xiǎo yú tǔ chū xiǎo yuán quān,' },
        { w: '一圈一圈追着船。', py: 'yī quān yī quān zhuī zhe chuán.' }
      ],
      real: { '一': 'yì' },
      note: '自编。找一找：驴、绿留着两点（l 后面）；鱼、云、圆、圈的 ü 摘了两点；水、追是 uei 的省写；「着」读轻声。「一」后面是一声，实际读 yì（GB/T 16159-2012 第 6.5.2 条：正文标原调，教学可显示变调）。' },

    { type: 'text', lv: 2, h: '用字母表查字典（音序检字法）',
      p: [
        '想查「鱼」字：先拼出 {py:yú}，第一个字母是 y，大写是 Y。',
        '在字典的「汉语拼音音节索引」里找到大写字母 Y，再往下找音节 yu，翻到它后面的页码，就能找到「鱼」。',
        '同一个字母下面，音节也按字母表的顺序排：ya 在 yan 前面，yan 在 yang 前面，yu 在 yue 前面。所以熟记字母表，查字典就快。'
      ],
      note: '课标第一学段：学会用音序检字法和部首检字法查字典。' },

    { type: 'table', lv: 3, h: '同一句话的两种写法：按字注音和按词连写',
      head: ['汉字', '按字注音（低年级课本，GB/T 7.1）', '按词连写（正词法）'],
      rows: [
        ['小鸭子在河里游。', 'xiǎo yā zi zài hé li yóu.', 'Xiǎo yāzi zài hé li yóu.'],
        ['小熊猫住在四川。', 'xiǎo xióng māo zhù zài sì chuān.', 'Xiǎoxióngmāo zhù zài Sìchuān.'],
        ['海鸥飞到天安门。', 'hǎi ōu fēi dào tiān ān mén.', "Hǎi'ōu fēidào Tiān'ānmén."],
        ['月亮照着小河。', 'yuè liang zhào zhe xiǎo hé.', 'Yuèliang zhàozhe xiǎo hé.']
      ],
      note: '例句自编。看右栏：句首大写（6.3.1）；专有名词大写（6.3.2）；一个词的音节连写（5.1）；按词连写后才需要隔音符号；单音节动词和单音节补语连写，如 fēidào（6.1.2.4）；动词和「着」连写，如 zhàozhe（6.1.2.1）。' }
  ]
};
