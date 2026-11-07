/* 拼音音节解析器（浏览器 + node 通用）。
 * 浏览器：先加载 pinyin/syllables.js，再加载本文件 → window.NHZPinyinSyllable
 * node：  const S = require('newhanzi/pinyin/syllable.js')（自动 require 同目录 syllables.js）
 *
 * S.parse('guì') → {
 *   ok, errors[], input, written:'gui', tone:4, initial:'g', final:'uei', finalWritten:'ui',
 *   medial:'u', nucleus:'e', coda:'i', hu:'合口呼', wholeRead:false, zeroInitial:false, yw:'',
 *   restore:[{from:'ui', to:'uei', rule:'省写'}], toneIndex:2, toneIndexExpected:2, erhua:false,
 *   legal:true, interjection:false, audio:'gui4'
 * }
 * 依据：《汉语拼音方案》（1958）韵母表说明 (1)(4)(5)、声调符号；GB/T 16159-2012 第 6.5.1 条（标调位置）。
 * - 输入可以是调号（ā）、数字调（ma3、lv4、lu:4）；轻声不标调，tone=5。
 * - medial/nucleus/coda 按书写字母给（ao 的韵尾写 o，ie/üe 的韵腹写 e，iong 的介母写 i、归撮口呼）。
 * - zhi chi shi ri zi ci si 的韵母记作 '-i'（舌尖元音）。
 * - errors 的 code：empty chars multi_tone tone_position spelling not_legal unknown_final。 */
(function (root, factory) {
  var table = root && root.NHZ_PINYIN_SYLLABLES;
  if (!table && typeof require === 'function') { try { table = require('./syllables.js'); } catch (e) { table = null; } }
  var api = factory(table);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NHZPinyinSyllable = api;
})(typeof self !== 'undefined' ? self : this, function (TABLE) {
  'use strict';
  var INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's'];
  var MARK = { '\u0304': 1, '\u0301': 2, '\u030C': 3, '\u0300': 4 };
  var COMB = { 1: '\u0304', 2: '\u0301', 3: '\u030C', 4: '\u0300' };
  /* 韵母（完整式）→ [介母, 韵腹, 韵尾, 四呼]（按书写字母） */
  var FINALS = {
    'a': ['', 'a', '', '开口呼'], 'o': ['', 'o', '', '开口呼'], 'e': ['', 'e', '', '开口呼'], 'ê': ['', 'ê', '', '开口呼'],
    'er': ['', 'er', '', '开口呼'], '-i': ['', '-i', '', '开口呼'],
    'i': ['', 'i', '', '齐齿呼'], 'u': ['', 'u', '', '合口呼'], 'ü': ['', 'ü', '', '撮口呼'],
    'ia': ['i', 'a', '', '齐齿呼'], 'io': ['i', 'o', '', '齐齿呼'], 'ie': ['i', 'e', '', '齐齿呼'],
    'ua': ['u', 'a', '', '合口呼'], 'uo': ['u', 'o', '', '合口呼'], 'üe': ['ü', 'e', '', '撮口呼'],
    'ai': ['', 'a', 'i', '开口呼'], 'iai': ['i', 'a', 'i', '齐齿呼'], 'uai': ['u', 'a', 'i', '合口呼'],
    'ei': ['', 'e', 'i', '开口呼'], 'uei': ['u', 'e', 'i', '合口呼'],
    'ao': ['', 'a', 'o', '开口呼'], 'iao': ['i', 'a', 'o', '齐齿呼'],
    'ou': ['', 'o', 'u', '开口呼'], 'iou': ['i', 'o', 'u', '齐齿呼'],
    'an': ['', 'a', 'n', '开口呼'], 'ian': ['i', 'a', 'n', '齐齿呼'], 'uan': ['u', 'a', 'n', '合口呼'], 'üan': ['ü', 'a', 'n', '撮口呼'],
    'en': ['', 'e', 'n', '开口呼'], 'in': ['', 'i', 'n', '齐齿呼'], 'uen': ['u', 'e', 'n', '合口呼'], 'ün': ['', 'ü', 'n', '撮口呼'],
    'ang': ['', 'a', 'ng', '开口呼'], 'iang': ['i', 'a', 'ng', '齐齿呼'], 'uang': ['u', 'a', 'ng', '合口呼'],
    'eng': ['', 'e', 'ng', '开口呼'], 'ing': ['', 'i', 'ng', '齐齿呼'], 'ueng': ['u', 'e', 'ng', '合口呼'],
    'ong': ['', 'o', 'ng', '合口呼'], 'iong': ['i', 'o', 'ng', '撮口呼']
  };
  var SYLLABIC = { 'm': 1, 'n': 1, 'ng': 1, 'hm': 1, 'hng': 1 };
  var WHOLE = ['zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu', 'yu', 'ye', 'yue', 'yuan', 'yin', 'yun', 'ying'];
  var WHOLE_SET = {}; WHOLE.forEach(function (w) { WHOLE_SET[w] = 1; });
  var LEGAL = {}, INTERJ = {};
  if (TABLE) {
    (TABLE.main || []).forEach(function (s) { LEGAL[s] = 1; });
    (TABLE.interj || []).forEach(function (s) { INTERJ[s] = 1; });
  }

  /* GB/T 16159-2012 6.5.1：标在主要元音上；iu、ui 标在后一个字母；有 a 标 a，没 a 找 o e。返回书写串里的下标，-1 = 无元音 */
  function expectedToneIndex(w) {
    var i = w.indexOf('a'); if (i >= 0) return i;
    i = w.search(/[oeê]/); if (i >= 0) return i;
    i = w.indexOf('iu'); if (i >= 0) return i + 1;
    i = w.indexOf('ui'); if (i >= 0) return i + 1;
    i = w.search(/[iuü]/); if (i >= 0) return i;
    i = w.search(/[mn]/); return i;
  }

  /* 把不带调的书写式加上调号：mark('gui', 4) → 'guì'；tone 5/0 原样返回 */
  function mark(w, tone) {
    if (!COMB[tone]) return w;
    var i = expectedToneIndex(w); if (i < 0) return w;
    return (w.slice(0, i + 1) + COMB[tone] + w.slice(i + 1)).normalize('NFC');
  }

  /* 去调、取调号位置：返回 {plain, tone, toneIndex, marks, bad} */
  function stripTone(s) {
    var d = s.normalize('NFD'), plain = '', tone = 0, idx = -1, marks = 0, bad = '';
    for (var k = 0; k < d.length; k++) {
      var c = d[k];
      if (MARK[c]) { marks++; tone = MARK[c]; idx = plain.normalize('NFC').length - 1; continue; }
      plain += c;
    }
    plain = plain.normalize('NFC');
    if (/[^a-zêü]/.test(plain)) bad = plain.replace(/[a-zêü]/g, '');
    return { plain: plain, tone: tone, toneIndex: idx, marks: marks, bad: bad };
  }

  function parse(input) {
    var r = {
      ok: false, errors: [], input: input, written: '', tone: 5, initial: '', final: '', finalWritten: '',
      medial: '', nucleus: '', coda: '', hu: '', wholeRead: false, zeroInitial: false, yw: '', restore: [],
      toneIndex: -1, toneIndexExpected: -1, erhua: false, legal: false, interjection: false, audio: ''
    };
    function err(code, msg) { r.errors.push({ code: code, msg: msg }); }
    var s = String(input == null ? '' : input).trim().toLowerCase().replace(/^·/, '');
    if (!s) { err('empty', '空'); return r; }
    var numTone = 0, m = /^(.*?)([0-5])$/.exec(s);
    if (m) { s = m[1]; numTone = +m[2]; }
    var asciiU = /v|u:/.test(s);
    s = s.replace(/u:/g, 'ü').replace(/v/g, 'ü');
    var st = stripTone(s);
    if (st.bad) { err('chars', '含非拼音字符：' + st.bad); return r; }
    if (st.marks > 1) err('multi_tone', '有 ' + st.marks + ' 个调号');
    if (numTone && st.marks) err('multi_tone', '数字调和调号同时出现');
    var w = st.plain;
    r.tone = m ? (numTone === 0 ? 5 : numTone) : (st.tone || 5);
    r.toneIndex = st.toneIndex;
    /* 儿化：音节末尾的 r（er 本身除外） */
    if (w.length > 2 && /r$/.test(w) && w !== 'er') { r.erhua = true; w = w.slice(0, -1); }
    r.written = w;

    if (SYLLABIC[w] || w === 'ê') {
      r.final = r.finalWritten = r.nucleus = w; r.zeroInitial = true; r.hu = w === 'ê' ? '开口呼' : '';
      if (w === 'hm' || w === 'hng') { r.initial = 'h'; r.zeroInitial = false; r.final = r.finalWritten = r.nucleus = w.slice(1); }
    } else {
      var ini = '';
      for (var k = 0; k < INITIALS.length; k++) if (w.indexOf(INITIALS[k]) === 0) { ini = INITIALS[k]; break; }
      var rest = w.slice(ini.length), full = rest;
      r.initial = ini; r.zeroInitial = !ini; r.finalWritten = rest;
      if (!ini) {
        if (/^yu/.test(rest)) { full = 'ü' + rest.slice(2); r.yw = 'y'; r.restore.push({ from: 'yu', to: 'ü', rule: 'y 开头，ü 上两点省略' }); }
        else if (/^yi/.test(rest)) { full = 'i' + rest.slice(2); r.yw = 'y'; r.restore.push({ from: 'yi', to: 'i', rule: 'i 前加 y' }); }
        else if (/^y/.test(rest)) {
          if (/^yü/.test(rest)) {
            full = 'ü' + rest.slice(2); r.yw = 'y'; r.restore.push({ from: 'yu', to: 'ü', rule: 'y 开头，ü 上两点省略' });
            if (!asciiU) err('spelling', 'yü 应写成 yu（ü 上两点省略）');
          } else { full = 'i' + rest.slice(1); r.yw = 'y'; r.restore.push({ from: 'y', to: 'i', rule: 'i 改写成 y' }); }
        }
        else if (/^wu/.test(rest)) { full = 'u' + rest.slice(2); r.yw = 'w'; r.restore.push({ from: 'wu', to: 'u', rule: 'u 前加 w' }); }
        else if (/^w/.test(rest)) { full = 'u' + rest.slice(1); r.yw = 'w'; r.restore.push({ from: 'w', to: 'u', rule: 'u 改写成 w' }); }
      } else if (/^[jqx]$/.test(ini)) {
        if (/^u/.test(rest)) { full = 'ü' + rest.slice(1); r.restore.push({ from: 'u', to: 'ü', rule: 'j q x 后 ü 上两点省略' }); }
        else if (/^ü/.test(rest) && !asciiU) err('spelling', ini + 'ü 应写成 ' + ini + 'u（j q x 后 ü 上两点省略）');
      } else if (/^[nl]$/.test(ini) && /^ue/.test(rest)) {
        err('spelling', w + ' 应写成 ' + ini + 'üe（n l 后 ü 的两点不省）'); full = 'ü' + rest.slice(1);
      }
      if (ini && !/^[jqx]$/.test(ini) && /^ü/.test(full) && !/^[nl]$/.test(ini)) err('spelling', ini + ' 不跟 ü 相拼');
      /* 省写还原：iu→iou、ui→uei、un→uen（j q x 后的 un 已是 ün） */
      if (ini) {
        if (full === 'iu') { full = 'iou'; r.restore.push({ from: 'iu', to: 'iou', rule: '省写' }); }
        else if (full === 'ui') { full = 'uei'; r.restore.push({ from: 'ui', to: 'uei', rule: '省写' }); }
        else if (full === 'un') { full = 'uen'; r.restore.push({ from: 'un', to: 'uen', rule: '省写' }); }
        if (full === 'i' && /^(zh|ch|sh|r|z|c|s)$/.test(ini)) full = '-i';
      }
      r.final = full;
      var f = FINALS[full];
      if (!f) err('unknown_final', '韵母 ' + full + ' 不在《汉语拼音方案》韵母表里');
      else { r.medial = f[0]; r.nucleus = f[1]; r.coda = f[2]; r.hu = f[3]; }
    }
    r.wholeRead = !!WHOLE_SET[w];
    /* 标调位置（只查调号输入；数字调不查） */
    r.toneIndexExpected = expectedToneIndex(w);
    if (st.marks === 1 && r.toneIndex !== r.toneIndexExpected) {
      err('tone_position', '调号标在第 ' + (r.toneIndex + 1) + ' 个字母「' + w[r.toneIndex] + '」上，按 GB/T 16159-2012 6.5.1 应标在「' + w[r.toneIndexExpected] + '」上');
    }
    var key = w;
    r.legal = !!LEGAL[key];
    r.interjection = !r.legal && !!INTERJ[key];
    if (!r.legal && !r.interjection) err('not_legal', w + ' 不在合法音节表里');
    if (r.legal && r.tone >= 1 && r.tone <= 4) r.audio = w.replace(/ü/g, 'v') + r.tone;
    r.ok = r.errors.length === 0;
    return r;
  }

  /* 音节（不带调）在不在表里 */
  function isLegal(w) { return !!LEGAL[String(w).replace(/v/g, 'ü')]; }

  return {
    parse: parse, mark: mark, isLegal: isLegal, expectedToneIndex: expectedToneIndex,
    INITIALS: INITIALS.slice(), FINALS: FINALS, WHOLE_READ: WHOLE.slice(),
    LEGAL: Object.keys(LEGAL), INTERJECTION: Object.keys(INTERJ)
  };
});
