/* 拼音区 · 易错读音 · 易读错的字（yicuo）。这些字不是多音字（或词里只有一种读法），却常被读错：读半边、看错形近字、习惯性误读。
 * 讲解、提示全部自编。basis: '85' = 《普通话异读词审音表》（1985）该字「统读」；'现汉' = 《现代汉语词典》第 7 版。
 * 字在 3500 字库里时，py 必须是字库读音之一（tools/check_pinyin_content.js 校验）；不在 3500 字库的字不收（炽、犷、涎已删）。 */
(function () {
  'use strict';
  /* ---- 生成块（只用已有块类型 table / quiz-choose，见 SCHEMA.md「易错读音」）---- */
  function key(p) { /* 'zhǎng' → 'zhang3'；轻声 / 无调 → '' */
    var t = 0, s = String(p).normalize('NFD').replace(/[\u0304\u0301\u030c\u0300]/g, function (m) { t = { '\u0304': 1, '\u0301': 2, '\u030c': 3, '\u0300': 4 }[m]; return ''; });
    return t ? s.normalize('NFC').replace(/ü/g, 'v') + t : '';
  }
  function flat(a) { return [].concat.apply([], a); }
  var MIS = []; /* 所有易读错条目（看里各表登记），练习题从这里出 */
  var BASIS = { '85': '1985 审音表', '现汉': '《现汉》第 7 版' };
  function pyOf(it) { return it.wpy.split(' ')[it.w.indexOf(it.zi)]; }
  function wrongPy(it) { var a = it.wpy.split(' '); a[it.w.indexOf(it.zi)] = it.wrong; return a.join(' '); }
  function misread(b) {
    b.items.forEach(function (it) { it.lv = b.lv; MIS.push(it); });
    return { type: 'table', lv: b.lv, h: b.h, head: ['字', '词语', '正确读音', '常读错成', '为什么'],
      rows: b.items.map(function (it) { return ['{zi:' + it.zi + '}', it.w, '{py:' + it.wpy + '}', '✗ ' + it.wrong, it.type + '：' + it.why + '（' + (BASIS[it.basis] || it.basis) + '）']; }),
      note: '「1985 审音表」＝《普通话异读词审音表》统读条；「《现汉》第 7 版」＝《现代汉语词典》第 7 版。错读只写成文字，不放录音。' };
  }
  /* 练：kind = pick 看词选音 / wrong 找注音错的 / hear 听音判断；lv = 只出这一档表里的字 */
  function quiz(kind, lv, h) {
    var L = MIS.filter(function (it) { return it.lv === lv; }), items = [];
    L.forEach(function (it, n) {
      var r = pyOf(it);
      if (kind === 'pick') items.push({ q: '「' + it.w + '」里的「' + it.zi + '」怎么读？', options: ['{py:' + r + '}', '{py:' + it.wrong + '}'], answer: 0, why: it.why });
      if (kind === 'wrong') {
        var o1 = L[(n + 1) % L.length], o2 = L[(n + 2) % L.length];
        items.push({ q: '哪个词的注音不对？', options: [it.w + ' {py:' + wrongPy(it) + '}', o1.w + ' {py:' + o1.wpy + '}', o2.w + ' {py:' + o2.wpy + '}'], answer: 0, why: '「' + it.w + '」读 {py:' + it.wpy + '}。' + it.why });
      }
      if (kind === 'hear') {
        var say = n % 2 ? it.wrong : r;
        if (key(say)) items.push({ q: '「' + it.w + '」的「' + it.zi + '」：听到的读音对不对？', play: key(say), options: ['对', '不对'], answer: say === r ? 0 : 1, why: '刚才是 {py:' + say + '}。「' + it.zi + '」读 {py:' + r + '}。' });
      }
    });
    return { type: 'quiz-choose', kind: kind, rv: '易读错的字', lv: lv, h: h, items: items };
  }

  var C = (window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['yicuo'] = {
    id: 'yicuo', name: '易读错的字', lv: 'L1–L3',
    lead: '有的字不是多音字，却总被读错：看见右边认识就照着读（读半边），把它看成长得像的字，或者跟着别人读错成了习惯。',
    src: [
      '《普通话异读词审音表》（1985，国家语委、国家教委、广播电视部发布）各字「统读」条；以教育部 2016-06-06 公布的修订稿征求意见稿附件左栏原表核对',
      '《现代汉语词典》第 7 版（商务印书馆，2016）',
      '《通用规范汉字表》（2013）；读音与本 App 3500 字库（ziku/model-3500.json）一致'
    ],

    /* ================= 看 ================= */
    kan: [
      { type: 'text', lv: 1, h: '三种常见的读错',
        p: [
          '读半边：看到「堤」右边是「是」，以为读「提」，其实「河堤」的「堤」读 {py:dī}。',
          '看成形近字：「立即」的「即」和「既然」的「既」长得像，一个读 {py:jí}，一个读 {py:jì}。',
          '习惯误读：大家都说「友谊 yí」，其实「谊」只读 {py:yì}。',
          '下面每一行：左边是词和正确读音（可以点着听），中间是常见的错读，右边告诉你为什么容易错。'
        ] },
      misread({ lv: 1, h: '小学阶段：先把这些读准',
        items: [
          { zi: '溪', w: '小溪', wpy: 'xiǎo xī', wrong: 'qī', type: '习惯误读', why: '溪只读 xī，没有 qī 的读音。', basis: '85' },
          { zi: '筑', w: '建筑', wpy: 'jiàn zhù', wrong: 'zhú', type: '习惯误读', why: '上面是竹字头，就容易读成 zhú。', basis: '85' },
          { zi: '谊', w: '友谊', wpy: 'yǒu yì', wrong: 'yí', type: '习惯误读', why: '「友谊」连读时常被说成 yí，其实是四声。', basis: '85' },
          { zi: '室', w: '教室', wpy: 'jiào shì', wrong: 'shǐ', type: '习惯误读', why: '「室」只读四声 shì。', basis: '85' },
          { zi: '质', w: '质量', wpy: 'zhì liàng', wrong: 'zhǐ', type: '习惯误读', why: '「质」只读四声 zhì。', basis: '85' },
          { zi: '危', w: '危险', wpy: 'wēi xiǎn', wrong: 'wéi', type: '习惯误读', why: '「危」是一声，不是二声。', basis: '85' },
          { zi: '微', w: '微笑', wpy: 'wēi xiào', wrong: 'wéi', type: '习惯误读', why: '「微」是一声 wēi。', basis: '85' },
          { zi: '帆', w: '帆船', wpy: 'fān chuán', wrong: 'fán', type: '读半边', why: '右边是「凡」fán，可「帆」读一声 fān。', basis: '85' },
          { zi: '堤', w: '河堤', wpy: 'hé dī', wrong: 'tí', type: '读半边', why: '和「提」只差偏旁，就读成 tí 了。', basis: '85' },
          { zi: '潜', w: '潜水', wpy: 'qián shuǐ', wrong: 'qiǎn', type: '形近字', why: '和「浅」都带三点水，容易读成 qiǎn。', basis: '85' },
          { zi: '框', w: '框架', wpy: 'kuàng jià', wrong: 'kuāng', type: '读半边', why: '右边「匡」读 kuāng，「框」读四声。', basis: '85' },
          { zi: '档', w: '档案', wpy: 'dàng àn', wrong: 'dǎng', type: '习惯误读', why: '「档」只读四声 dàng。', basis: '85' },
          { zi: '暂', w: '暂时', wpy: 'zàn shí', wrong: 'zhàn', type: '习惯误读', why: '平舌 z，不是翘舌 zh。', basis: '85' },
          { zi: '塑', w: '塑料', wpy: 'sù liào', wrong: 'shuò', type: '读半边', why: '上面是「朔」shuò，可「塑」读 sù。', basis: '85' },
          { zi: '携', w: '携带', wpy: 'xié dài', wrong: 'xī', type: '习惯误读', why: '「携」读二声 xié。', basis: '85' },
          { zi: '括', w: '包括', wpy: 'bāo kuò', wrong: 'guā', type: '形近字', why: '和「刮」都有「舌」，可「括」读 kuò。', basis: '85' },
          { zi: '矿', w: '矿山', wpy: 'kuàng shān', wrong: 'guǎng', type: '读半边', why: '右边是「广」guǎng，「矿」读 kuàng。', basis: '85' },
          { zi: '即', w: '立即', wpy: 'lì jí', wrong: 'jì', type: '形近字', why: '和「既」长得像。即＝立刻，读 jí。', basis: '现汉' },
          { zi: '既', w: '既然', wpy: 'jì rán', wrong: 'jí', type: '形近字', why: '和「即」长得像。既然、既……又……读 jì。', basis: '现汉' },
          { zi: '召', w: '号召', wpy: 'hào zhào', wrong: 'zhāo', type: '读半边', why: '跟「招」混了，「召」读四声 zhào。', basis: '85' },
          { zi: '脊', w: '脊背', wpy: 'jǐ bèi', wrong: 'jí', type: '习惯误读', why: '「脊」读三声 jǐ。', basis: '85' },
          { zi: '捕', w: '捕捉', wpy: 'bǔ zhuō', wrong: 'pǔ', type: '读半边', why: '跟「浦」混了，「捕」读 bǔ。', basis: '85' },
          { zi: '茁', w: '茁壮', wpy: 'zhuó zhuàng', wrong: 'chū', type: '读半边', why: '下面是「出」，可「茁」读 zhuó。', basis: '85' },
          { zi: '慨', w: '慷慨', wpy: 'kāng kǎi', wrong: 'gài', type: '形近字', why: '和「概」长得像，「慨」读 kǎi。', basis: '85' },
          { zi: '溉', w: '灌溉', wpy: 'guàn gài', wrong: 'kǎi', type: '形近字', why: '和「慨」长得像，「溉」读 gài。', basis: '现汉' },
          { zi: '徊', w: '徘徊', wpy: 'pái huái', wrong: 'huí', type: '读半边', why: '右边是「回」huí，「徊」读 huái。', basis: '85' },
          { zi: '处', w: '处理', wpy: 'chǔ lǐ', wrong: 'chù', type: '多音混淆', why: '「处理」是办事，读三声 chǔ。', basis: '现汉' },
          { zi: '符', w: '符合', wpy: 'fú hé', wrong: 'fǔ', type: '习惯误读', why: '「符」读二声 fú。', basis: '现汉' },
          { zi: '氛', w: '气氛', wpy: 'qì fēn', wrong: 'fèn', type: '习惯误读', why: '「氛」读一声 fēn。', basis: '现汉' },
          { zi: '绽', w: '绽放', wpy: 'zhàn fàng', wrong: 'dìng', type: '读半边', why: '右边是「定」，可「绽」读 zhàn。', basis: '现汉' },
          { zi: '伪', w: '伪装', wpy: 'wěi zhuāng', wrong: 'wèi', type: '读半边', why: '右边是「为」，可「伪」读三声 wěi。', basis: '85' },
          { zi: '浸', w: '浸泡', wpy: 'jìn pào', wrong: 'qīn', type: '形近字', why: '和「侵」长得像，「浸」读 jìn。', basis: '85' },
          { zi: '殊', w: '特殊', wpy: 'tè shū', wrong: 'zhū', type: '读半边', why: '右边是「朱」zhū，「殊」读 shū。', basis: '85' },
          { zi: '屹', w: '屹立', wpy: 'yì lì', wrong: 'qǐ', type: '读半边', why: '右边是「乞」qǐ，「屹」读 yì。', basis: '85' },
          { zi: '储', w: '储存', wpy: 'chǔ cún', wrong: 'chú', type: '习惯误读', why: '「储」读三声 chǔ。', basis: '85' },
          { zi: '触', w: '接触', wpy: 'jiē chù', wrong: 'chǔ', type: '习惯误读', why: '「触」读四声 chù。', basis: '85' },
          { zi: '蹈', w: '舞蹈', wpy: 'wǔ dǎo', wrong: 'dào', type: '习惯误读', why: '「蹈」读三声 dǎo。', basis: '85' },
          { zi: '妨', w: '妨碍', wpy: 'fáng ài', wrong: 'fāng', type: '读半边', why: '右边是「方」fāng，「妨」读二声。', basis: '85' },
          { zi: '肪', w: '脂肪', wpy: 'zhī fáng', wrong: 'fāng', type: '读半边', why: '右边是「方」fāng，「肪」读二声。', basis: '85' },
          { zi: '沸', w: '沸腾', wpy: 'fèi téng', wrong: 'fú', type: '读半边', why: '右边是「弗」fú，「沸」读 fèi。', basis: '85' },
          { zi: '迹', w: '足迹', wpy: 'zú jì', wrong: 'jī', type: '习惯误读', why: '「迹」读四声 jì。', basis: '85' },
          { zi: '鞠', w: '鞠躬', wpy: 'jū gōng', wrong: 'jú', type: '习惯误读', why: '「鞠」读一声 jū。', basis: '85' },
          { zi: '俱', w: '俱乐部', wpy: 'jù lè bù', wrong: 'jū', type: '习惯误读', why: '「俱」读四声 jù。', basis: '85' },
          { zi: '湃', w: '澎湃', wpy: 'péng pài', wrong: 'bài', type: '读半边', why: '右边是「拜」bài，「湃」读 pài。', basis: '85' },
          { zi: '畔', w: '河畔', wpy: 'hé pàn', wrong: 'bàn', type: '读半边', why: '右边是「半」bàn，「畔」读 pàn。', basis: '85' },
          { zi: '僻', w: '偏僻', wpy: 'piān pì', wrong: 'bì', type: '读半边', why: '右边是「辟」，「僻」读 pì。', basis: '85' },
          { zi: '漱', w: '漱口', wpy: 'shù kǒu', wrong: 'sòu', type: '读半边', why: '右边像「嗽」，可「漱」读 shù。', basis: '85' },
          { zi: '隧', w: '隧道', wpy: 'suì dào', wrong: 'suí', type: '习惯误读', why: '「隧」读四声 suì。', basis: '85' },
          { zi: '晰', w: '清晰', wpy: 'qīng xī', wrong: 'xí', type: '习惯误读', why: '「晰」读一声 xī。', basis: '85' },
          { zi: '械', w: '机械', wpy: 'jī xiè', wrong: 'jiè', type: '读半边', why: '右边是「戒」jiè，「械」读 xiè。', basis: '85' },
          { zi: '馨', w: '温馨', wpy: 'wēn xīn', wrong: 'xīng', type: '习惯误读', why: '前鼻音 xīn，不是后鼻音。', basis: '85' },
          { zi: '穴', w: '洞穴', wpy: 'dòng xué', wrong: 'xuè', type: '习惯误读', why: '「穴」读二声 xué。', basis: '85' },
          { zi: '屿', w: '岛屿', wpy: 'dǎo yǔ', wrong: 'yù', type: '习惯误读', why: '「屿」读三声 yǔ。', basis: '85' },
          { zi: '茎', w: '根茎', wpy: 'gēn jīng', wrong: 'jìng', type: '形近字', why: '和「径」「颈」长得像，「茎」读一声 jīng。', basis: '85' }
        ] }),
      misread({ lv: 2, h: '初中阶段：书面词里的难读字',
        items: [
          { zi: '酗', w: '酗酒', wpy: 'xù jiǔ', wrong: 'xiōng', type: '读半边', why: '右边是「凶」xiōng，「酗」读 xù。', basis: '现汉' },
          { zi: '挫', w: '挫折', wpy: 'cuò zhé', wrong: 'cuō', type: '习惯误读', why: '「挫」读四声 cuò。', basis: '现汉' },
          { zi: '哺', w: '哺育', wpy: 'bǔ yù', wrong: 'pǔ', type: '读半边', why: '跟「浦」混了，「哺」读 bǔ。', basis: '85' },
          { zi: '惩', w: '惩罚', wpy: 'chéng fá', wrong: 'chěng', type: '习惯误读', why: '「惩」读二声 chéng。', basis: '85' },
          { zi: '秩', w: '秩序', wpy: 'zhì xù', wrong: 'shī', type: '读半边', why: '右边是「失」shī，「秩」读 zhì。', basis: '85' },
          { zi: '撰', w: '撰写', wpy: 'zhuàn xiě', wrong: 'xuǎn', type: '读半边', why: '右边像「选」，「撰」读 zhuàn。', basis: '现汉' },
          { zi: '矗', w: '矗立', wpy: 'chù lì', wrong: 'zhí', type: '读半边', why: '由三个「直」组成，可读 chù。', basis: '现汉' },
          { zi: '憎', w: '憎恨', wpy: 'zēng hèn', wrong: 'zèng', type: '习惯误读', why: '「憎」读一声 zēng。', basis: '85' },
          { zi: '酵', w: '发酵', wpy: 'fā jiào', wrong: 'xiào', type: '读半边', why: '右边是「孝」xiào，「酵」读 jiào。', basis: '85' },
          { zi: '辱', w: '侮辱', wpy: 'wǔ rǔ', wrong: 'rù', type: '习惯误读', why: '「辱」读三声 rǔ。', basis: '85' },
          { zi: '阐', w: '阐述', wpy: 'chǎn shù', wrong: 'shàn', type: '读半边', why: '里面像「单」shàn（姓），「阐」读 chǎn。', basis: '85' },
          { zi: '淆', w: '混淆', wpy: 'hùn xiáo', wrong: 'yáo', type: '读半边', why: '右边是「肴」yáo，「淆」读 xiáo。', basis: '85' },
          { zi: '颇', w: '颇为', wpy: 'pō wéi', wrong: 'pǒ', type: '习惯误读', why: '「颇」读一声 pō。', basis: '85' },
          { zi: '剖', w: '解剖', wpy: 'jiě pōu', wrong: 'pāo', type: '习惯误读', why: '「剖」读 pōu，韵母是 ou。', basis: '85' },
          { zi: '沼', w: '沼泽', wpy: 'zhǎo zé', wrong: 'zhāo', type: '读半边', why: '右边是「召」，「沼」读三声 zhǎo。', basis: '85' },
          { zi: '挟', w: '挟持', wpy: 'xié chí', wrong: 'jiā', type: '读半边', why: '右边是「夹」jiā，「挟」读 xié。', basis: '85' },
          { zi: '暇', w: '无暇', wpy: 'wú xiá', wrong: 'jiǎ', type: '读半边', why: '右边像「假」，「暇」读 xiá。', basis: '85' },
          { zi: '灼', w: '灼热', wpy: 'zhuó rè', wrong: 'sháo', type: '读半边', why: '右边是「勺」sháo，「灼」读 zhuó。', basis: '85' },
          { zi: '拙', w: '笨拙', wpy: 'bèn zhuō', wrong: 'chū', type: '读半边', why: '右边是「出」，「拙」读 zhuō。', basis: '85' },
          { zi: '蜕', w: '蜕变', wpy: 'tuì biàn', wrong: 'duì', type: '读半边', why: '右边是「兑」duì，「蜕」读 tuì。', basis: '85' },
          { zi: '贿', w: '贿赂', wpy: 'huì lù', wrong: 'yǒu', type: '读半边', why: '右边是「有」，「贿」读 huì。', basis: '85' },
          { zi: '吮', w: '吮吸', wpy: 'shǔn xī', wrong: 'yǔn', type: '读半边', why: '右边是「允」yǔn，「吮」读 shǔn。', basis: '现汉' },
          { zi: '诽', w: '诽谤', wpy: 'fěi bàng', wrong: 'fēi', type: '读半边', why: '右边是「非」fēi，「诽」读三声 fěi。', basis: '现汉' },
          { zi: '寝', w: '寝室', wpy: 'qǐn shì', wrong: 'qǐng', type: '习惯误读', why: '前鼻音 qǐn，不是 qǐng。', basis: '现汉' },
          { zi: '嗜', w: '嗜好', wpy: 'shì hào', wrong: 'qí', type: '读半边', why: '右边是「耆」qí，「嗜」读 shì。', basis: '现汉' },
          { zi: '赡', w: '赡养', wpy: 'shàn yǎng', wrong: 'zhān', type: '读半边', why: '右边是「詹」zhān，「赡」读 shàn。', basis: '现汉' },
          { zi: '迄', w: '迄今', wpy: 'qì jīn', wrong: 'qǐ', type: '读半边', why: '里面是「乞」qǐ，「迄」读四声 qì。', basis: '现汉' },
          { zi: '畸', w: '畸形', wpy: 'jī xíng', wrong: 'qí', type: '读半边', why: '右边是「奇」qí，「畸」读 jī。', basis: '现汉' },
          { zi: '庇', w: '包庇', wpy: 'bāo bì', wrong: 'pì', type: '习惯误读', why: '「庇」读 bì。', basis: '85' },
          { zi: '濒', w: '濒临', wpy: 'bīn lín', wrong: 'pín', type: '读半边', why: '右边是「频」pín，「濒」读 bīn。', basis: '85' },
          { zi: '雌', w: '雌雄', wpy: 'cí xióng', wrong: 'cī', type: '读半边', why: '左边是「此」，「雌」读二声 cí。', basis: '85' },
          { zi: '悼', w: '哀悼', wpy: 'āi dào', wrong: 'zhuō', type: '读半边', why: '右边是「卓」，「悼」读 dào。', basis: '85' },
          { zi: '踱', w: '踱步', wpy: 'duó bù', wrong: 'dù', type: '读半边', why: '右边是「度」dù，「踱」读 duó。', basis: '85' },
          { zi: '讽', w: '讽刺', wpy: 'fěng cì', wrong: 'fèng', type: '习惯误读', why: '「讽」读三声 fěng。', basis: '85' },
          { zi: '缚', w: '束缚', wpy: 'shù fù', wrong: 'bó', type: '形近字', why: '和「博」「搏」右边一样，「缚」读 fù。', basis: '85' },
          { zi: '褐', w: '褐色', wpy: 'hè sè', wrong: 'hé', type: '习惯误读', why: '「褐」读四声 hè。', basis: '85' },
          { zi: '诲', w: '教诲', wpy: 'jiào huì', wrong: 'huǐ', type: '形近字', why: '和「悔」右边一样，「诲」读四声 huì。', basis: '85' },
          { zi: '嫉', w: '嫉妒', wpy: 'jí dù', wrong: 'jì', type: '习惯误读', why: '「嫉」读二声 jí。', basis: '85' },
          { zi: '歼', w: '歼灭', wpy: 'jiān miè', wrong: 'qiān', type: '读半边', why: '右边是「千」qiān，「歼」读 jiān。', basis: '85' },
          { zi: '窘', w: '窘迫', wpy: 'jiǒng pò', wrong: 'jūn', type: '读半边', why: '下面是「君」jūn，「窘」读 jiǒng。', basis: '85' },
          { zi: '揩', w: '揩汗', wpy: 'kāi hàn', wrong: 'jiē', type: '读半边', why: '右边是「皆」jiē，「揩」读 kāi。', basis: '85' },
          { zi: '皿', w: '器皿', wpy: 'qì mǐn', wrong: 'xuè', type: '形近字', why: '和「血」只差一撇，「皿」读 mǐn。', basis: '85' },
          { zi: '酿', w: '酝酿', wpy: 'yùn niàng', wrong: 'niáng', type: '读半边', why: '右边像「娘」，「酿」读四声 niàng。', basis: '85' },
          { zi: '胚', w: '胚胎', wpy: 'pēi tāi', wrong: 'pī', type: '读半边', why: '右边是「丕」pī，「胚」读 pēi。', basis: '85' },
          { zi: '譬', w: '譬如', wpy: 'pì rú', wrong: 'bì', type: '读半边', why: '上面是「辟」，「譬」读 pì。', basis: '85' },
          { zi: '聘', w: '聘请', wpy: 'pìn qǐng', wrong: 'pìng', type: '习惯误读', why: '前鼻音 pìn，不是 pìng。', basis: '85' },
          { zi: '嵌', w: '镶嵌', wpy: 'xiāng qiàn', wrong: 'kàn', type: '读半边', why: '下面有「欠」，「嵌」读 qiàn。', basis: '85' },
          { zi: '摄', w: '摄影', wpy: 'shè yǐng', wrong: 'niè', type: '读半边', why: '右边是「聂」niè，「摄」读 shè。', basis: '85' },
          { zi: '署', w: '署名', wpy: 'shǔ míng', wrong: 'shù', type: '习惯误读', why: '「署」读三声 shǔ。', basis: '85' },
          { zi: '曙', w: '曙光', wpy: 'shǔ guāng', wrong: 'shù', type: '习惯误读', why: '「曙」读三声 shǔ。', basis: '85' },
          { zi: '硕', w: '硕果', wpy: 'shuò guǒ', wrong: 'shí', type: '读半边', why: '左边是「石」shí，「硕」读 shuò。', basis: '85' },
          { zi: '髓', w: '骨髓', wpy: 'gǔ suǐ', wrong: 'suí', type: '读半边', why: '右边是「随」suí，「髓」读三声 suǐ。', basis: '85' },
          { zi: '唾', w: '唾沫', wpy: 'tuò mo', wrong: 'chuí', type: '读半边', why: '右边是「垂」chuí，「唾」读 tuò。', basis: '85' },
          { zi: '紊', w: '紊乱', wpy: 'wěn luàn', wrong: 'wén', type: '读半边', why: '上面是「文」wén，「紊」读三声 wěn。', basis: '85' },
          { zi: '肴', w: '菜肴', wpy: 'cài yáo', wrong: 'xiáo', type: '形近字', why: '和「淆」混了，「肴」读 yáo。', basis: '85' },
          { zi: '掷', w: '投掷', wpy: 'tóu zhì', wrong: 'zhèng', type: '读半边', why: '右边是「郑」zhèng，「掷」读 zhì。', basis: '85' },
          { zi: '蠕', w: '蠕动', wpy: 'rú dòng', wrong: 'ruǎn', type: '读半边', why: '右边是「需」，跟「软」混了，「蠕」读 rú。', basis: '85' },
          { zi: '膜', w: '薄膜', wpy: 'bó mó', wrong: 'mò', type: '读半边', why: '右边是「莫」mò，「膜」读二声 mó。', basis: '85' }
        ] }),
      { type: 'table', lv: 2, h: '读半边：能读半边的字，也有不能的',
        head: ['声旁', '能照着读', '不能照着读'],
        rows: [
          ['青 {py:qīng}', '清 {py:qīng}、蜻 {py:qīng}', '倩 {py:qiàn}、靖 {py:jìng}'],
          ['方 {py:fāng}', '芳 {py:fāng}', '妨 {py:fáng}、肪 {py:fáng}（声调变了）'],
          ['半 {py:bàn}', '伴 {py:bàn}、拌 {py:bàn}', '畔 {py:pàn}、判 {py:pàn}'],
          ['甫 {py:fǔ}', '辅 {py:fǔ}、腑 {py:fǔ}', '捕 {py:bǔ}、哺 {py:bǔ}'],
          ['勺 {py:sháo}', '芍 {py:sháo}', '灼 {py:zhuó}、酌 {py:zhuó}']
        ],
        note: '形声字的声旁只能「提示」读音。古今读音变化很大，不认识的字一定要查字典。' },
      { type: 'text', lv: 3, h: '深一点：为什么规范读音要「统读」',
        p: [
          '1985 年的《普通话异读词审音表》把很多只有一个意思、却有两种读法的字定成一个读音，叫「统读」。比如「谊」统读 {py:yì}，「室」统读 {py:shì}，「框」统读 {py:kuàng}。',
          '这些字在词典里只有一个读音，读别的音就是读错。本页每个字后面的「85」表示依据是 1985 审音表的统读条，「现汉」表示依据是《现代汉语词典》第 7 版。',
          '2016 年公布过一份审音表修订稿（征求意见稿），到现在还没有正式发布，所以本页仍以 1985 年的表为准。'
        ] }
    ],

    /* ================= 听读 ================= */
    ting: [
      { type: 'pairs', lv: 1, h: '对比听：左边是对的，右边是常见的错读',
        pairs: [
          [{ t: 'xī', play: 'xi1', sub: '小溪 ✓' }, { t: 'qī', play: 'qi1', sub: '✗' }],
          [{ t: 'zhù', play: 'zhu4', sub: '建筑 ✓' }, { t: 'zhú', play: 'zhu2', sub: '✗' }],
          [{ t: 'yì', play: 'yi4', sub: '友谊 ✓' }, { t: 'yí', play: 'yi2', sub: '✗' }],
          [{ t: 'shì', play: 'shi4', sub: '教室 ✓' }, { t: 'shǐ', play: 'shi3', sub: '✗' }],
          [{ t: 'wēi', play: 'wei1', sub: '危险 ✓' }, { t: 'wéi', play: 'wei2', sub: '✗' }],
          [{ t: 'dī', play: 'di1', sub: '河堤 ✓' }, { t: 'tí', play: 'ti2', sub: '✗' }]
        ],
        tip: '先听对的，再听错的，最后再听一遍对的，把正确的留在耳朵里。' },
      { type: 'chips', lv: 1, h: '跟读：一声字常被读成二声',
        items: [
          { t: 'wēi', play: 'wei1', sub: '微笑' }, { t: 'fān', play: 'fan1', sub: '帆船' }, { t: 'fēn', play: 'fen1', sub: '气氛' },
          { t: 'xī', play: 'xi1', sub: '清晰' }, { t: 'jū', play: 'ju1', sub: '鞠躬' }, { t: 'jīng', play: 'jing1', sub: '根茎' }
        ] },
      { type: 'pairs', lv: 2, h: '前鼻音和后鼻音',
        pairs: [
          [{ t: 'xīn', play: 'xin1', sub: '温馨 ✓' }, { t: 'xīng', play: 'xing1', sub: '✗' }],
          [{ t: 'qǐn', play: 'qin3', sub: '寝室 ✓' }, { t: 'qǐng', play: 'qing3', sub: '✗' }],
          [{ t: 'pìn', play: 'pin4', sub: '聘请 ✓' }, { t: 'pìng', play: 'ping4', sub: '✗' }]
        ],
        tip: '前鼻音舌尖抵住上牙床收音，后鼻音舌根往后缩。' },
      { type: 'chips', lv: 2, h: '跟读：平舌和翘舌',
        items: [
          { t: 'zàn', play: 'zan4', sub: '暂时' }, { t: 'zēng', play: 'zeng1', sub: '憎恨' },
          { t: 'zhì', play: 'zhi4', sub: '秩序' }, { t: 'zhuó', play: 'zhuo2', sub: '茁壮' }, { t: 'shù', play: 'shu4', sub: '漱口' }
        ] },
      { type: 'text', lv: 3, h: '听辨方法',
        p: ['只差声调的（{py:yì}/{py:yí}），先听调型；只差声母或韵母的（{py:dī}/{py:tí}），先听开头送不送气。录音来自真人单音节，词语请连起来自己读。'] }
    ],

    /* ================= 练 ================= */
    lian: [
      quiz('pick', 1, '看词选读音'),
      quiz('wrong', 1, '找出读错的：哪个注音不对'),
      quiz('hear', 1, '听音判断：听到的读音对不对'),
      quiz('pick', 2, '看词选读音：书面词里的难读字'),
      quiz('wrong', 2, '找出读错的：书面词'),
      quiz('hear', 2, '听音判断：书面词里的难读字')
    ],

    /* ================= 用 ================= */
    yong: [
      { type: 'words', lv: 1, h: '读一读：小学课文里常见',
        items: [
          { w: '小溪', py: 'xiǎo xī' }, { w: '建筑', py: 'jiàn zhù' }, { w: '友谊', py: 'yǒu yì' }, { w: '教室', py: 'jiào shì' },
          { w: '危险', py: 'wēi xiǎn' }, { w: '帆船', py: 'fān chuán' }, { w: '河堤', py: 'hé dī' }, { w: '舞蹈', py: 'wǔ dǎo' },
          { w: '茁壮', py: 'zhuó zhuàng' }, { w: '澎湃', py: 'péng pài' }
        ] },
      { type: 'verse', lv: 1, h: '自编儿歌', title: '小溪边',
        lines: [
          { w: '小溪弯弯过河堤，', py: 'xiǎo xī wān wān guò hé dī,' },
          { w: '帆船轻轻向前移。', py: 'fān chuán qīng qīng xiàng qián yí.' },
          { w: '教室窗前齐微笑，', py: 'jiào shì chuāng qián qí wēi xiào,' },
          { w: '我们友谊长又长。', py: 'wǒ men yǒu yì cháng yòu cháng.' }
        ] },
      { type: 'words', lv: 2, h: '读一读：书面词',
        items: [
          { w: '秩序', py: 'zhì xù' }, { w: '惩罚', py: 'chéng fá' }, { w: '发酵', py: 'fā jiào' }, { w: '混淆', py: 'hùn xiáo' },
          { w: '沼泽', py: 'zhǎo zé' }, { w: '笨拙', py: 'bèn zhuō' }, { w: '濒临', py: 'bīn lín' }, { w: '摄影', py: 'shè yǐng' }
        ] },
      { type: 'verse', lv: 3, h: '短句：一句话里三个难读字', title: '读准它',
        lines: [
          { w: '沼泽边的芦苇矗立着。', py: 'zhǎo zé biān de lú wěi chù lì zhe.' },
          { w: '面团发酵后要混匀。', py: 'miàn tuán fā jiào hòu yào hùn yún.' }
        ] }
    ]
  };
  ['kan', 'ting', 'lian', 'yong'].forEach(function (k) { C[k] = flat(C[k]); });
  /* zidu：本页当作「这个字的读音」展示的 [字, 拼音]，tools/check_pinyin_content.js 逐条核对 ziku/model-3500.json */
  C.zidu = [];
  MIS.forEach(function (it) { C.zidu.push([it.zi, pyOf(it)]); });
})();
