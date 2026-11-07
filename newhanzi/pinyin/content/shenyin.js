/* 拼音区 · 易错读音 · 审音改读（shenyin）。只收能在原文里核到的条目。
 * 一手来源：教育部 2016-06-06《〈普通话异读词审音表（修订稿）〉征求意见公告》附件（W020160606277722984732.doc，
 *   左栏「原审音表」= 1985 年表，右栏「新审订」= 2016 修订稿；空 = 不改）。
 * 状态：2016 修订稿至今未正式发布，现行仍以 1985 年表为准（人民网 2022-08-31 等报道；教育部语用所 2019 年回应「还应以原读音为准」）。
 * 「旧读」（1985 年以前的读法）依据：人民网上海频道 2022-08-31《一骑（qí）红尘妃子笑？……近40年前就确定了！》。
 * 讲解全部自编。 */
(function () {
  'use strict';
  /* ---- 生成块（只用已有块类型 table / quiz-choose，见 SCHEMA.md「易错读音」）---- */
  function key(p) { /* 'zhǎng' → 'zhang3'；轻声 / 无调 → '' */
    var t = 0, s = String(p).normalize('NFD').replace(/[\u0304\u0301\u030c\u0300]/g, function (m) { t = { '\u0304': 1, '\u0301': 2, '\u030c': 3, '\u0300': 4 }[m]; return ''; });
    return t ? s.normalize('NFC').replace(/ü/g, 'v') + t : '';
  }
  function flat(a) { return [].concat.apply([], a); }
  var SY = []; /* 审音条目（看里两张表登记），练习题从这里出 */
  function isPy(s) { return /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/.test(String(s)); }
  /* 现行规范读音：1985 表里改定的 = now；2016 修订稿条目现行仍是原表 = old（old 不是纯拼音的条目不出「选读音」题） */
  function cur(it) { return it.ed === '1985' ? it.now : it.old; }
  function shenyin(b) {
    b.items.forEach(function (it) { it.ed = b.ed; it.lv = b.lv; SY.push(it); });
    if (b.ed === '1985') return { type: 'table', lv: b.lv, h: b.h, head: ['字', '词语', '1985 年以前', '现行规范', '审音表原文', '说明'],
      rows: b.items.map(function (it) { return ['{zi:' + it.zi + '}', it.w, '旧读 ' + it.old, '{py:' + it.now + '}', it.entry, it.note]; }),
      note: '现行规范＝1985 年《普通话异读词审音表》，学校、字典、普通话考试都按它。' };
    return { type: 'table', lv: b.lv, h: b.h, head: ['字', '词语', '现行（1985 原表）', '修订稿「拟改」', '修订稿原文', '说明'],
      rows: b.items.map(function (it) { return ['{zi:' + it.zi + '}', it.w, isPy(it.old) ? '{py:' + it.old + '}' : it.old, '拟改 ' + it.now, it.entry, it.note]; }),
      note: '2016 年《普通话异读词审音表（修订稿）》是征求意见稿，到现在没有正式发布；这一栏所列只是「拟改」，考试、朗读仍按左边的现行读音。' };
  }
  /* 练：kind = pick 按现行规范选读音 / hear 听音判断 */
  function quiz(kind, lv, h) {
    var items = [];
    SY.forEach(function (it, n) {
      var c = cur(it), other = it.ed === '1985' ? it.old : it.now;
      if (!isPy(c) || !isPy(other) || c === other) return;
      if (kind === 'pick') items.push({ q: '按现行规范，「' + it.w + '」的「' + it.zi + '」怎么读？', options: ['{py:' + c + '}', '{py:' + other + '}'], answer: 0,
        why: it.ed === '1985' ? '1985 年审音表：' + it.entry + '。' : '现行仍按 1985 年原表读 {py:' + c + '}；{py:' + other + '} 只是 2016 修订稿的「拟改」。' });
      if (kind === 'hear') { var say = n % 2 ? other : c; if (key(say)) items.push({ q: '「' + it.w + '」的「' + it.zi + '」：听到的是不是现行规范读音？', play: key(say), options: ['是', '不是'], answer: say === c ? 0 : 1, why: '刚才是 {py:' + say + '}，现行规范读 {py:' + c + '}。' }); }
    });
    return { type: 'quiz-choose', kind: kind, rv: '审音改读', lv: lv, h: h, items: items };
  }

  var C = (window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['shenyin'] = {
    id: 'shenyin', name: '审音改读', lv: 'L2–L3',
    lead: '有些字的「标准读音」是国家专门审定过的。1985 年定下来的，早就是规范；2016 年的修订稿还只是征求意见稿，没有正式发布。',
    src: [
      '《普通话异读词审音表》（1985 年 12 月，国家语委、国家教委、广播电视部发布）',
      '《普通话异读词审音表（修订稿）》征求意见稿，教育部、国家语委普通话审音委员会，2016-06-06 公布（教育部语言文字应用研究所普通话审音委员会秘书处收意见），附件左栏为 1985 原表、右栏为新审订',
      '人民网上海频道 2022-08-31：2016 年征求意见稿尚未定稿公布，通行读音仍参照 1985 年审音表',
      '《现代汉语词典》第 7 版（2016）'
    ],

    /* ================= 看 ================= */
    kan: [
      { type: 'text', lv: 1, h: '审音表是什么',
        p: [
          '同一个词，有人这样读，有人那样读，就叫「异读」。国家请专家把常用的异读词定一个标准读音，编成《普通话异读词审音表》。',
          '我们现在用的是 1985 年的表。学校、字典、普通话考试都按它来。',
          '2016 年专家又出了一份修订稿，请大家提意见。它到现在还没有正式发布，所以不能当成新规定。'
        ] },
      shenyin({ lv: 2, ed: '1985', h: '1985 年已经改定的读音（现在的规范）',
        items: [
          { zi: '凿', w: '确凿', old: 'zuò', now: 'záo', entry: '凿záo（统读）', note: '「确凿」的「凿」以前读 zuò，1985 年起统读 záo。' },
          { zi: '呆', w: '呆板', old: 'ái', now: 'dāi', entry: '呆dāi（统读）', note: '「呆板」以前读 áibǎn，现在读 dāibǎn。' },
          { zi: '绩', w: '成绩', old: 'jī', now: 'jì', entry: '绩jì（统读）', note: '「成绩」「功绩」的「绩」都读四声。' },
          { zi: '卓', w: '卓越', old: 'zhuō', now: 'zhuó', entry: '卓zhuó（统读）', note: '「卓越」「卓有成效」的「卓」读二声。' },
          { zi: '哮', w: '咆哮', old: 'xiāo', now: 'xiào', entry: '哮xiào（统读）', note: '「咆哮」「哮喘」的「哮」读四声。' },
          { zi: '驯', w: '驯服', old: 'xún', now: 'xùn', entry: '驯xùn（统读）', note: '「驯服」「驯养」的「驯」读四声。' },
          { zi: '啥', w: '干啥', old: 'shà', now: 'shá', entry: '啥 shá （统读）', note: '「啥」读二声。' },
          { zi: '骑', w: '坐骑', old: 'jì', now: 'qí', entry: '骑qí （统读）', note: '古时「骑」作名词（骑的马、骑兵）读 jì，1985 年起统读 qí。词典里还注明「旧读 jì」。' }
        ] }),
      shenyin({ lv: 2, ed: '2016', h: '2016 年修订稿提出的改动（征求意见稿，没有正式发布）',
        items: [
          { zi: '说', w: '说服', old: '（原表未收）', now: 'shuō', entry: '说(一) shuō ～服 (二) shuì 游～ ～客', note: '「说服」一直读 shuō，修订稿把它写进表里，免得和「游说」的 shuì 混。这不是改读。' },
          { zi: '靡', w: '风靡', old: 'mǐ', now: 'mí', entry: '靡 mí（统读）', note: '原表：靡费读 mí，风靡、委靡、披靡读 mǐ；修订稿建议统读 mí。' },
          { zi: '颈', w: '脖颈子', old: 'gěng', now: 'jǐng', entry: '颈jǐng（统读）（“脖梗子”不写作“脖颈子”）', note: '修订稿让「颈」只读 jǐng，口语里的 bógěngzi 写成「脖梗子」。' },
          { zi: '葛', w: '葛藤', old: 'gé', now: 'gě', entry: '葛gě〔统读〕', note: '原表：植物「葛」读 gé，姓读 gě；修订稿建议统读 gě。' },
          { zi: '杉', w: '杉木', old: 'shā', now: 'shān', entry: '杉 shān（统读）', note: '原表：杉木、杉篙口语读 shā；修订稿建议统读 shān。' },
          { zi: '熏', w: '煤气熏着了', old: 'xùn', now: 'xūn', entry: '熏xūn（统读）', note: '原表：「煤气熏着了」读 xùn；修订稿建议统读 xūn。' },
          { zi: '芥', w: '芥蓝', old: 'gài', now: 'jiè', entry: '芥 （统读）jiè', note: '原表：芥菜（盖菜）、芥蓝读 gài；修订稿建议统读 jiè。' },
          { zi: '虹', w: '彩虹', old: 'jiàng（口语单说）', now: 'hóng', entry: '虹 hóng（统读）（口语单说也读jiàng）', note: '修订稿定为统读 hóng，口语单说也可以读 jiàng。' },
          { zi: '壳', w: '甲壳', old: 'qiào', now: 'ké', entry: '壳 ké（除“地壳、金蝉脱壳”中的“壳”读qiào外，其余读为ké）', note: '原表：地壳、甲壳、躯壳读 qiào；修订稿只留「地壳、金蝉脱壳」读 qiào。' },
          { zi: '胖', w: '心宽体胖', old: '（原表只收心广体胖 pán）', now: 'pàng', entry: '胖（一）pán 心广体～（安舒义）（二）pàng 心宽体～（发胖义）', note: '「心广体胖」读 pán（安舒），「心宽体胖」读 pàng（发胖）。' },
          { zi: '晕', w: '晕车', old: 'yùn', now: 'yūn', entry: '晕（一）yūn（昏迷、发昏义）～倒 头～ 血～ ～车（二）yùn（光圈义）月～ 红～', note: '原表：晕车、血晕读 yùn；修订稿按意思分：发昏读 yūn，光圈读 yùn。' },
          { zi: '鲜', w: '鲜为人知', old: '（原表未收）', now: 'xiǎn', entry: '鲜 (一)xiān 屡见不～ 数见不～ (二) xiǎn ～为人知 寡廉～耻', note: '「鲜为人知」的「鲜」是「少」的意思，读三声，修订稿把它写进了表。' },
          { zi: '纪', w: '姓纪', old: 'jǐ', now: 'jì', entry: '统读jì（纪姓旧读jǐ）', note: '原表：姓读 jǐ；修订稿建议统读 jì。' }
        ] }),
      { type: 'text', lv: 3, h: '深一点：怎么看待「读音被改了」的说法',
        p: [
          '网上常说「这些字的读音改了」，其实要分三种：① 1985 年就改定了，比如「确凿 {py:záo}」「呆板 {py:dāi}」；② 一直就是这样读，比如「说服 {py:shuō}」；③ 只在 2016 年征求意见稿里「拟改」，比如「风靡」拟改读 {py:mí}（现行仍读 {py:mǐ}）。',
          '只有第①种是现行规范。第③种还没有正式发布，考试和课本仍以 1985 年的表和《现代汉语词典》为准。',
          '修订稿的原则之一是「以北京语音系统为审音依据」，并「尽量减少没有别义作用或语体差异的异读」，所以很多条目都改成了「统读」。'
        ] }
    ],

    /* ================= 听读 ================= */
    ting: [
      { type: 'pairs', lv: 1, h: '1985 年改定：左边是现在的规范读音，右边是旧读',
        pairs: [
          [{ t: 'záo', play: 'zao2', sub: '确凿 ✓' }, { t: 'zuò', play: 'zuo4', sub: '旧读' }],
          [{ t: 'dāi', play: 'dai1', sub: '呆板 ✓' }, { t: 'ái', play: 'ai2', sub: '旧读' }],
          [{ t: 'jì', play: 'ji4', sub: '成绩 ✓' }, { t: 'jī', play: 'ji1', sub: '旧读' }],
          [{ t: 'zhuó', play: 'zhuo2', sub: '卓越 ✓' }, { t: 'zhuō', play: 'zhuo1', sub: '旧读' }],
          [{ t: 'xiào', play: 'xiao4', sub: '咆哮 ✓' }, { t: 'xiāo', play: 'xiao1', sub: '旧读' }],
          [{ t: 'xùn', play: 'xun4', sub: '驯服 ✓' }, { t: 'xún', play: 'xun2', sub: '旧读' }]
        ] },
      { type: 'chips', lv: 2, h: '一直这样读，不要被传言带偏',
        items: [{ t: 'shuō', play: 'shuo1', sub: '说服' }, { t: 'shuì', play: 'shui4', sub: '游说' }, { t: 'qí', play: 'qi2', sub: '坐骑' }, { t: 'shá', play: 'sha2', sub: '干啥' }] },
      { type: 'pairs', lv: 3, h: '2016 修订稿的建议：左边是 1985 年原表，右边是修订稿（未发布）',
        pairs: [
          [{ t: 'shā', play: 'sha1', sub: '杉木 现行' }, { t: 'shān', play: 'shan1', sub: '修订稿' }],
          [{ t: 'gé', play: 'ge2', sub: '葛藤 现行' }, { t: 'gě', play: 'ge3', sub: '修订稿' }],
          [{ t: 'mǐ', play: 'mi3', sub: '风靡 现行' }, { t: 'mí', play: 'mi2', sub: '修订稿' }],
          [{ t: 'yùn', play: 'yun4', sub: '晕车 现行' }, { t: 'yūn', play: 'yun1', sub: '修订稿' }]
        ],
        tip: '考试、朗读请用左边的现行读音。' }
    ],

    /* ================= 练 ================= */
    lian: [
      quiz('pick', 2, '按现行规范选读音'),
      { type: 'quiz-choose', kind: 'judge', rv: '审音改读', lv: 2, h: '判断：这个说法对不对',
        items: [
          { q: '「确凿」的「凿」读 záo，是 2016 年才改的。', options: ['对', '不对'], answer: 1, why: '1985 年的审音表就定为 záo 了。' },
          { q: '「说服」的「说」本来读 shuì，后来才改成 shuō。', options: ['对', '不对'], answer: 1, why: '词典一直注 shuō，读 shuì 的是「游说」「说客」。' },
          { q: '2016 年的审音表修订稿已经正式发布了。', options: ['对', '不对'], answer: 1, why: '它是征求意见稿，到现在还没有正式发布，仍以 1985 年的表为准。' },
          { q: '按现行规范，「骑」统读 qí。', options: ['对', '不对'], answer: 0, why: '1985 年审音表：骑 qí（统读）。' },
          { q: '修订稿建议「风靡」的「靡」改读 mí，所以现在就该读 mí。', options: ['对', '不对'], answer: 1, why: '修订稿只是「拟改」，没有正式发布；现行仍按 1985 年原表读 {py:mǐ}。' }
        ] },
      quiz('hear', 2, '听一听：这是不是现在的规范读音')
    ],

    /* ================= 用 ================= */
    yong: [
      { type: 'words', lv: 1, h: '读一读：按现行规范',
        items: [
          { w: '确凿', py: 'què záo' }, { w: '呆板', py: 'dāi bǎn' }, { w: '成绩', py: 'chéng jì' }, { w: '卓越', py: 'zhuó yuè' },
          { w: '咆哮', py: 'páo xiào' }, { w: '驯服', py: 'xùn fú' }, { w: '说服', py: 'shuō fú' }, { w: '游说', py: 'yóu shuì' }
        ] },
      { type: 'verse', lv: 2, h: '自编短句', title: '读准规范音',
        lines: [
          { w: '证据确凿不呆板，', py: 'zhèng jù què záo bù dāi bǎn,' },
          { w: '成绩卓越人人夸。', py: 'chéng jì zhuó yuè rén rén kuā.' }
        ],
        real: { '不': 'bú' } }
    ]
  };
  ['kan', 'ting', 'lian', 'yong'].forEach(function (k) { C[k] = flat(C[k]); });
  /* zidu：本页当作「这个字的读音」展示的 [字, 拼音]，tools/check_pinyin_content.js 逐条核对 ziku/model-3500.json */
  C.zidu = [];
  SY.forEach(function (it) { if (isPy(cur(it))) C.zidu.push([it.zi, cur(it)]); if (it.ed === '2016' && isPy(it.now)) C.zidu.push([it.zi, it.now]); });
})();
