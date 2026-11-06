/* 拼音区 · 复韵母（ai ei ui ao ou iu ie üe + 特殊韵母 er）
 * 格式见 pinyin/content/SCHEMA.md。讲解、例词、儿歌、情境全部自编。
 * 单念录音：ai ei ao ou er 用本身的音节；ui iu ie üe 单念没有独立录音，借零声母音节
 *   ui→wei、iu→you、ie→ye、üe→yue（韵母单念和零声母音节读音相同，只是写法加了 y/w），页面上都注明「借」。
 * 依据：统编 2024 一上第 10 课（ai ei ui）、第 11 课（ao ou iu）、第 12 课（ie üe er）；
 *   《汉语拼音方案》韵母表及说明 (2)(5)；GB/T 16159-2012 第 6.5.1 条（标调位置）。 */
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['fuyunmu'] = {
  id: 'fuyunmu', name: '复韵母', lv: 'L1–L3',
  lead: '两个元音手拉手：从前一个滑到后一个，嘴形一路在变，中间不断开。er 是特殊韵母，舌头要卷起来。',
  src: ['统编 2024 一上第 10、11、12 课', '《汉语拼音方案》韵母表及说明 (2)(5)', 'GB/T 16159-2012 第 6.5.1 条'],

  /* ================= 看 ================= */
  kan: [
    {
      type: 'scene', lv: 1, h: '一个东西，一个韵母',
      note: '点图看韵母。叶 yè、月 yuè 是整体认读音节，读法和 ie、üe 一样。',
      items: [
        { letter: 'ai', thing: '一棵白菜', word: '菜', py: 'cài',
          svg: '<svg viewBox="0 0 200 150"><path d="M64 136 C34 118 36 62 64 42 C76 72 80 112 64 136 Z" class="svg-green"/><path d="M116 136 C146 118 144 62 116 42 C104 72 100 112 116 136 Z" class="svg-green" opacity=".75"/><path d="M90 140 C68 110 70 52 90 24 C110 52 112 110 90 140 Z" class="svg-panel svg-green-s" stroke-width="4"/><path d="M90 132 L90 40" class="svg-green-s" stroke-width="2"/></svg>' },
        { letter: 'ei', thing: '一个杯子', word: '杯', py: 'bēi',
          svg: '<svg viewBox="0 0 200 150"><rect x="56" y="42" width="62" height="88" rx="9" class="svg-panel svg-deep-s" stroke-width="5"/><path d="M118 62 C146 62 146 106 118 106" fill="none" class="svg-deep-s" stroke-width="6"/><path d="M62 66 L112 66" class="svg-accent-s" stroke-width="4"/><path d="M76 34 C70 24 82 18 76 8 M96 34 C90 24 102 18 96 8" fill="none" class="svg-muted-s" stroke-width="3"/></svg>' },
        { letter: 'ui', thing: '一只乌龟', word: '龟', py: 'guī',
          svg: '<svg viewBox="0 0 200 150"><ellipse cx="44" cy="122" rx="12" ry="8" class="svg-green"/><ellipse cx="116" cy="122" rx="12" ry="8" class="svg-green"/><path d="M30 112 C30 62 130 62 130 112 Z" class="svg-green"/><path d="M50 106 L64 82 L96 82 L110 106 M64 82 L80 70 L96 82" fill="none" class="svg-deep-s" stroke-width="3"/><circle cx="146" cy="104" r="13" class="svg-green"/><circle cx="150" cy="100" r="2.5" class="svg-deep"/></svg>' },
        { letter: 'ao', thing: '一只小猫', word: '猫', py: 'māo',
          svg: '<svg viewBox="0 0 200 150"><path d="M50 62 L56 26 L80 50 Z M130 62 L124 26 L100 50 Z" class="svg-accent"/><circle cx="90" cy="88" r="44" class="svg-panel svg-accent-s" stroke-width="5"/><circle cx="74" cy="80" r="5" class="svg-deep"/><circle cx="106" cy="80" r="5" class="svg-deep"/><path d="M84 98 L90 104 L96 98" fill="none" class="svg-deep-s" stroke-width="3"/><path d="M40 96 L70 100 M40 110 L70 106 M140 96 L110 100 M140 110 L110 106" class="svg-muted-s" stroke-width="2"/></svg>' },
        { letter: 'ou', thing: '一只小狗', word: '狗', py: 'gǒu',
          svg: '<svg viewBox="0 0 200 150"><circle cx="90" cy="84" r="42" class="svg-panel svg-deep-s" stroke-width="5"/><path d="M52 52 C30 60 30 104 46 112 C56 96 58 72 52 52 Z M128 52 C150 60 150 104 134 112 C124 96 122 72 128 52 Z" class="svg-deep"/><circle cx="76" cy="78" r="5" class="svg-deep"/><circle cx="104" cy="78" r="5" class="svg-deep"/><ellipse cx="90" cy="98" rx="9" ry="6" class="svg-deep"/><path d="M90 104 L90 112" class="svg-deep-s" stroke-width="3"/></svg>' },
        { letter: 'iu', thing: '一个皮球', word: '球', py: 'qiú',
          svg: '<svg viewBox="0 0 200 150"><circle cx="88" cy="80" r="52" class="svg-panel svg-red-s" stroke-width="5"/><path d="M40 62 C70 82 108 82 136 62 M40 100 C70 80 108 80 136 100" fill="none" class="svg-red-s" stroke-width="5"/><path d="M60 140 L118 140" class="svg-muted-s" stroke-width="4"/></svg>' },
        { letter: 'ie', thing: '一片树叶', word: '叶', py: 'yè',
          svg: '<svg viewBox="0 0 200 150"><path d="M30 120 C40 40 110 20 140 30 C140 70 110 130 30 120 Z" class="svg-green"/><path d="M30 120 C70 90 100 60 140 30 M66 92 L64 64 M88 72 L94 50 M78 84 L104 88" fill="none" class="svg-deep-s" stroke-width="3"/></svg>' },
        { letter: 'üe', thing: '一弯月亮', word: '月', py: 'yuè',
          svg: '<svg viewBox="0 0 200 150"><path d="M100 18 C50 28 40 120 104 134 C70 112 66 48 100 18 Z" class="svg-accent"/><circle cx="40" cy="36" r="3" class="svg-accent"/><circle cx="132" cy="56" r="3" class="svg-accent"/><circle cx="140" cy="118" r="2.5" class="svg-accent"/></svg>' },
        { letter: 'er', thing: '小兔子竖起的长耳朵', word: '耳', py: 'ěr',
          svg: '<svg viewBox="0 0 200 150"><ellipse cx="70" cy="44" rx="11" ry="36" class="svg-panel svg-deep-s" stroke-width="4"/><ellipse cx="106" cy="44" rx="11" ry="36" class="svg-panel svg-deep-s" stroke-width="4"/><ellipse cx="70" cy="46" rx="4" ry="24" class="svg-red" opacity=".5"/><ellipse cx="106" cy="46" rx="4" ry="24" class="svg-red" opacity=".5"/><circle cx="88" cy="104" r="34" class="svg-panel svg-deep-s" stroke-width="4"/><circle cx="76" cy="98" r="4" class="svg-deep"/><circle cx="100" cy="98" r="4" class="svg-deep"/><circle cx="88" cy="112" r="4" class="svg-red"/></svg>' }
      ]
    },
    {
      type: 'anim', lv: 1, kind: 'glide', h: '滑着读：嘴形从这儿滑到那儿',
      params: {
        items: [
          { f: 'ai', from: 'a', to: 'i', play: 'ai1', open: [3, 1] },
          { f: 'ei', from: 'e', to: 'i', play: 'ei1', open: [2, 1] },
          { f: 'ao', from: 'a', to: 'o', play: 'ao1', open: [3, 2], round: [0, 1] },
          { f: 'ou', from: 'o', to: 'u', play: 'ou1', open: [2, 1], round: [1, 1] },
          { f: 'ui', from: 'u', to: 'i', play: 'wei1', open: [1, 1], hidden: 'e', note: '借 wei' },
          { f: 'iu', from: 'i', to: 'u', play: 'you1', open: [1, 1], hidden: 'o', note: '借 you' },
          { f: 'ie', from: 'i', to: 'e', play: 'ye1', open: [1, 2], note: '借 ye' },
          { f: 'üe', from: 'ü', to: 'e', play: 'yue1', open: [1, 2], note: '借 yue' }
        ],
        hint: '小球从第一个字母滑到第二个字母，声音不断开；ai ao 嘴巴从大到小，ie üe 从小到大。'
      },
      fallback: '把两个字母想成两块石头，声音是一个小球：从第一块石头上出发，顺着坡滑到第二块，不停、不跳。ai：嘴先张大读 a，一边出声一边往 i 收小。ao：先张大，再慢慢收圆。ou：先半圆，再更圆更小。ei：从 e 的扁口滑到 i。ie、üe 正好反过来：先小后大。'
    },
    {
      type: 'text', lv: 1, h: '复韵母怎么读',
      p: [
        '单韵母读的时候嘴形不动；复韵母读的时候嘴形要<b>动</b>。两个字母要读成<b>一个</b>音，不能读成两下。',
        '比一比：{py:ài}（爱）是一口气滑过去的；要是读成「a——i」两个音，就不是复韵母了。',
        '前一个字母读得响一点、长一点，后一个字母轻轻带过：{py:māo}（猫）、{py:gǒu}（狗）、{py:bái}（白）。'
      ]
    },
    {
      type: 'table', lv: 2, h: '藏起来的字母：ui iu 是省写',
      head: ['完整的韵母', '前面有声母时写成', '例子', '前面没有声母时写成'],
      rows: [
        ['uei', 'ui（e 藏起来）', '{py:guì}（柜）{py:shuǐ}（水）', '{py:wèi}（喂）'],
        ['iou', 'iu（o 藏起来）', '{py:niú}（牛）{py:liù}（六）', '{py:yǒu}（有）'],
        ['ie', 'ie', '{py:xiě}（写）{py:tiē}（贴）', '{py:yè}（叶）'],
        ['üe', 'üe；遇 j q x 写 ue', '{py:xué}（学）{py:lüè}（略）', '{py:yuè}（月）']
      ],
      note: '《汉语拼音方案》韵母表说明 (5)：iou、uei 前面加声母时写成 iu、ui。说明 (4)：i 行、ü 行韵母前面没有声母时用 y 开头。'
    },
    {
      type: 'text', lv: 2, h: '调号标在哪儿；er 为什么特殊',
      p: [
        '复韵母里有 a 就标 a：{py:hǎo}、{py:lái}；没有 a 就标 o 或 e：{py:gǒu}、{py:bēi}、{py:xiè}、{py:yuè}。',
        '<b>iu、ui 标在后一个字母上</b>：{py:liù}、{py:qiú}、{py:guì}、{py:shuǐ}。因为原来的 o、e 被省掉了，调号就放在写出来的最后一个元音上。标在 i 上时，i 上的小点不写。',
        'er 是<b>特殊韵母</b>：读的时候舌尖往上卷。它不和任何声母相拼，只能自己成音节：{py:ér}（儿）、{py:ěr}（耳）、{py:èr}（二）。',
        'ie、üe 前面没有声母时写成 ye、yue，这两个是<b>整体认读音节</b>：{py:yè}、{py:yuè}，看到就直接读，不用拼。'
      ],
      note: '标调规则：GB/T 16159-2012 第 6.5.1 条；er：《汉语拼音方案》韵母表说明 (2)；ye、yue 归入整体认读音节：统编 2024 一上第 12 课。'
    },
    {
      type: 'table', lv: 3, h: '前响、后响、中响：响亮的元音在哪儿',
      head: ['类型', '响亮的元音（韵腹）', '《方案》里的复韵母', '教材第 10–12 课学到的'],
      rows: [
        ['前响复韵母', '第一个元音，后面的元音轻、短、往上收', 'ai ei ao ou', 'ai ei ao ou'],
        ['后响复韵母', '后一个元音，前面的 i u ü 是介音，一带而过', 'ia ie ua uo üe', 'ie üe'],
        ['中响复韵母', '中间的元音，两头轻', 'iao iou uai uei', 'iu（iou）ui（uei）'],
        ['特殊韵母', '一个卷舌元音，不是两个元音', 'er', 'er']
      ],
      note: '分类是语音学通行的说法（按韵腹的位置）。教材只拿出 8 个复韵母单独教，ia ua uo iao uai 等放在三拼音节里学。'
    },
    {
      type: 'text', lv: 3, h: '为什么能省写：被省掉的元音本来就弱',
      p: [
        'iou、uei 带声母时，中间的 o、e 读得很短很弱，在第一声、第二声里尤其不明显，所以《方案》规定省写成 iu、ui；在第三、四声里还能听出一点：对比 {py:liú} 和 {py:liǔ}、{py:guī} 和 {py:guì}。不带声母时（you、wei）中间的元音清楚，就不省。',
        'ao 的实际收尾音接近 u，《方案》写成 o。一种通行解释是：手写时 au 容易和 an 混淆。同理，ie、üe 里的 e 读音其实是 ê（不是单念的 e），写作 e 是因为在这里不会读错。',
        'er 是一个卷舌的元音，作韵尾时只写 r，叫儿化：{py:huā} 加 r 写成 huār（花儿）。儿化放在变调和轻声那一节细讲。'
      ],
      note: '依据：《汉语拼音方案》韵母表说明 (2)(3)(5)；韵腹弱化、ao 收尾音的描写为语音学教材的通行说法，作学理参考，不作考点。'
    }
  ],

  /* ================= 听读 ================= */
  ting: [
    {
      type: 'chips', lv: 1, h: '9 个韵母，点开听四声',
      items: [
        { t: 'ai', play: 'ai1', tones: 'ai' },
        { t: 'ei', play: 'ei1', tones: 'ei' },
        { t: 'ui', play: 'wei1', tones: 'wei', sub: '借 wei' },
        { t: 'ao', play: 'ao1', tones: 'ao' },
        { t: 'ou', play: 'ou1', tones: 'ou' },
        { t: 'iu', play: 'you1', tones: 'you', sub: '借 you' },
        { t: 'ie', play: 'ye1', tones: 'ye', sub: '借 ye' },
        { t: 'üe', play: 'yue1', tones: 'yue', sub: '借 yue' },
        { t: 'er', play: 'er2', tones: 'er', sub: '特殊韵母' }
      ],
      note: '录音是音节录音（Chen Wang，audio-cmn）。ui iu ie üe 没有单念录音，借零声母音节 wei you ye yue：读音和韵母单念相同，只是写法前面加了 y、w。'
    },
    {
      type: 'groups', lv: 1, h: '带上声母读一读（按课）',
      groups: [
        { label: '第 10 课 ai ei ui', items: [
          { t: 'bái', play: 'bai2', sub: '白' }, { t: 'mài', play: 'mai4', sub: '卖' }, { t: 'hēi', play: 'hei1', sub: '黑' },
          { t: 'fēi', play: 'fei1', sub: '飞' }, { t: 'shuǐ', play: 'shui3', sub: '水' }, { t: 'duì', play: 'dui4', sub: '对' } ] },
        { label: '第 11 课 ao ou iu', items: [
          { t: 'māo', play: 'mao1', sub: '猫' }, { t: 'cǎo', play: 'cao3', sub: '草' }, { t: 'gǒu', play: 'gou3', sub: '狗' },
          { t: 'zǒu', play: 'zou3', sub: '走' }, { t: 'niú', play: 'niu2', sub: '牛' }, { t: 'liù', play: 'liu4', sub: '六' } ] },
        { label: '第 12 课 ie üe er', items: [
          { t: 'xiě', play: 'xie3', sub: '写' }, { t: 'tiē', play: 'tie1', sub: '贴' }, { t: 'xuě', play: 'xue3', sub: '雪' },
          { t: 'jué', play: 'jue2', sub: '决' }, { t: 'èr', play: 'er4', sub: '二' }, { t: 'ěr', play: 'er3', sub: '耳' } ] }
      ]
    },
    {
      type: 'pairs', lv: 1, h: '像不像？成对听',
      pairs: [
        [{ t: 'mài', play: 'mai4' }, { t: 'mèi', play: 'mei4' }],
        [{ t: 'dào', play: 'dao4' }, { t: 'dòu', play: 'dou4' }],
        [{ t: 'xiě', play: 'xie3' }, { t: 'xuě', play: 'xue3' }],
        [{ t: 'jiē', play: 'jie1' }, { t: 'juē', play: 'jue1' }],
        [{ t: 'shuǐ', play: 'shui3' }, { t: 'jiǔ', play: 'jiu3' }],
        [{ t: 'é', play: 'e2' }, { t: 'ér', play: 'er2' }]
      ],
      tip: 'ai 开口大，ei 开口小；ao 收尾是圆的，ou 一开始就圆；ie 嘴角往两边，üe 嘴唇先撮圆；ér 舌头卷起来，é 舌头不卷。ui 和 iu 字母顺序相反：先 u 后 i 是 ui，先 i 后 u 是 iu。'
    },
    {
      type: 'chips', lv: 2, h: '没有声母时怎么写：加 y、w',
      items: [
        { t: 'wēi', play: 'wei1', tones: 'wei', sub: 'uei→wei' },
        { t: 'yōu', play: 'you1', tones: 'you', sub: 'iou→you' },
        { t: 'yē', play: 'ye1', tones: 'ye', sub: 'ie→ye' },
        { t: 'yuē', play: 'yue1', tones: 'yue', sub: 'üe→yue' }
      ],
      note: '前面没有声母时，iou、uei 不省写，写成 you、wei；ye、yue 是整体认读音节。《汉语拼音方案》韵母表说明 (4)。'
    },
    {
      type: 'groups', lv: 3, h: '同一个韵母，四个声调里听「藏起来的元音」',
      groups: [
        { label: 'iu = iou', items: [
          { t: 'diū', play: 'diu1', sub: '丢' }, { t: 'liú', play: 'liu2', sub: '流' }, { t: 'jiǔ', play: 'jiu3', sub: '九' }, { t: 'xiù', play: 'xiu4', sub: '秀' } ] },
        { label: 'ui = uei', items: [
          { t: 'duī', play: 'dui1', sub: '堆' }, { t: 'huí', play: 'hui2', sub: '回' }, { t: 'guǐ', play: 'gui3', sub: '鬼' }, { t: 'duì', play: 'dui4', sub: '对' } ] }
      ],
      note: '仔细听：第三、四声里中间的 o、e 比第一、二声明显一些。这是学理上的观察，读的时候照常滑过去即可。'
    }
  ],

  /* ================= 练 ================= */
  lian: [
    {
      type: 'quiz-listen', lv: 1, h: '听音选韵母', ask: 'final',
      pool: ['bai2', 'mai4', 'cai4', 'hei1', 'fei1', 'mei4', 'shui3', 'gui4', 'dui4', 'mao1', 'cao3', 'hao3', 'gou3', 'zou3', 'tou2', 'niu2', 'liu4', 'qiu2', 'xie3', 'tie1', 'jie3', 'lve4', 'nve4'],
      note: 'üe 用 lüè（略）、nüè（虐）来听：n、l 后面的 ü 两点不省，看得最清楚。jué、xué 里的 ue 也是 üe，在「带上声母读一读」里听。',
      options: ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe']
    },
    {
      type: 'quiz-mark', lv: 1, h: '调号该落在哪个字母上？',
      items: ['hao', 'mai', 'bei', 'gou', 'liu', 'gui', 'shui', 'jiu', 'xie', 'yue', 'que', 'dui']
    },
    {
      type: 'quiz-build', lv: 1, h: '拼读机：声母碰复韵母',
      initials: ['b', 'm', 'f', 'd', 'l', 'g', 'h', 'j', 'x', 'sh'],
      finals: ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe'],
      tones: [1, 2, 3, 4]
    },
    {
      type: 'quiz-choose', lv: 1, h: '想一想',
      items: [
        { q: '读 {py:ài} 的时候，嘴巴怎么变？', options: ['从大变小', '从小变大', '一直不动'], answer: 0, why: 'ai 从 a 滑到 i，a 张得大，i 张得小。' },
        { q: '「月」的拼音怎么写？', options: ['yuè', 'üè', 'yüè'], answer: 0, why: 'üe 前面没有声母时写成 yue，ü 上两点省略。yue 是整体认读音节。' },
        { q: '哪个音节的调号标对了？', options: ['liù', 'lìu', 'líù'], answer: 0, why: 'iu 的调号标在后一个字母 u 上。' },
        { q: 'er 能和声母 b 拼成 ber 吗？', options: ['不能，er 不和声母相拼', '能', '要看声调'], answer: 0, why: 'er 是特殊韵母，只能自己成音节：ér、ěr、èr。' },
        { q: '{py:shuǐ}（水）的韵母是哪个？', options: ['ui', 'iu', 'u'], answer: 0, why: 'sh + ui。先 u 后 i，是 ui。' },
        { q: '{py:niú}（牛）的韵母是哪个？', options: ['iu', 'ui', 'ou'], answer: 0, why: 'n + iu。先 i 后 u，是 iu。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 2, h: '省写和标调',
      items: [
        { q: '{py:guì} 的韵母写全了是什么？', options: ['uei', 'ui', 'ue'], answer: 0, why: 'uei 前面有声母时省写成 ui（《方案》说明 (5)）。' },
        { q: '「有」为什么写 yǒu 而不是 yǐu？', options: ['没有声母时 iou 不省写，i 改成 y', 'iu 前面要加 y', '为了好看'], answer: 0, why: '零声母时 iou 写成 you；只有前面有声母才省成 iu。' },
        { q: 'xué 里的 u 其实是哪个韵母的字母？', options: ['ü', 'u', 'o'], answer: 0, why: 'j q x 只和 ü 相拼，所以 xue 的 u 就是 ü，两点省略。' },
        { q: '下面哪个是整体认读音节？', options: ['ye', 'xie', 'mei'], answer: 0, why: 'ye、yue 直接认读；xie、mei 由声母和韵母拼成。' }
      ]
    },
    {
      type: 'quiz-choose', lv: 3, h: '前响、后响、中响',
      items: [
        { q: '哪一个是后响复韵母？', options: ['ie', 'ai', 'ou'], answer: 0, why: 'ie 前面的 i 是介音，一带而过，响的是后面的 e（ê）。ai、ou 是前响。' },
        { q: 'iou 是哪一类？', options: ['中响复韵母', '前响复韵母', '后响复韵母'], answer: 0, why: 'iou 两头 i、u 轻，中间 o 是韵腹。' },
        { q: '为什么 iu 的调号标在 u 上？', options: ['韵腹 o 被省掉了，规定标在后一个字母上', 'u 比 i 响', 'i 上已经有点了'], answer: 0, why: 'GB/T 16159-2012 第 6.5.1 条：iu、ui 两个字母并列时标在后一个上。' }
      ]
    }
  ],

  /* ================= 用 ================= */
  yong: [
    {
      type: 'words', lv: 1, h: '读词语',
      items: [
        { w: '白菜', py: 'bái cài' },
        { w: '飞机', py: 'fēi jī' },
        { w: '喝水', py: 'hē shuǐ' },
        { w: '小猫', py: 'xiǎo māo' },
        { w: '小狗', py: 'xiǎo gǒu' },
        { w: '皮球', py: 'pí qiú' },
        { w: '树叶', py: 'shù yè' },
        { w: '雪花', py: 'xuě huā' },
        { w: '耳朵', py: 'ěr duo' },
        { w: '贝壳', py: 'bèi ké' },
        { w: '牛奶', py: 'niú nǎi' },
        { w: '草帽', py: 'cǎo mào' },
        { w: '二月', py: 'èr yuè' },
        { w: '写字', py: 'xiě zì' }
      ],
      note: '「耳朵」的「朵」读轻声，不标调。'
    },
    {
      type: 'verse', lv: 1, h: '儿歌', title: '小白猫捞月亮',
      lines: [
        { w: '小白猫，爱喝水，', py: 'xiǎo bái māo, ài hē shuǐ,' },
        { w: '低头看见月亮美。', py: 'dī tóu kàn jiàn yuè liang měi.' },
        { w: '伸出小爪捞呀捞，', py: 'shēn chū xiǎo zhuǎ lāo ya lāo,' },
        { w: '月亮碎了又飞回。', py: 'yuè liang suì le yòu fēi huí.' }
      ],
      note: '找一找：白 ai、猫 ao、爱 ai、水 ui、头 ou、月 üe、美 ei、捞 ao、碎 ui、又 iu（you）、飞 ei、回 ui。「亮」「呀」「了」读轻声。'
    },
    {
      type: 'verse', lv: 2, h: '短句：读准相近的韵母', title: '比一比',
      lines: [
        { w: '我写字，小雪花在窗外跳舞。', py: 'wǒ xiě zì, xiǎo xuě huā zài chuāng wài tiào wǔ.' },
        { w: '老牛喝水，乌龟晒背。', py: 'lǎo niú hē shuǐ, wū guī shài bèi.' }
      ],
      real: { '我': 'wó', '小': 'xiáo' },
      note: '写 xiě / 雪 xuě：ie 和 üe；牛 niú / 水 shuǐ：iu 和 ui。L2 起显示实际读音：「我写」「小雪」都是两个三声相连，前一个字读得像第二声：wó、xiáo（GB/T 16159-2012 第 6.5.2 条，教学中可按变调标写）。'
    }
  ]
};
