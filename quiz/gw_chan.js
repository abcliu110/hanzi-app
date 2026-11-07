/* 古文产出题型生成器（A22-9 · docs/gaijin/guwen-gaijin-sheji.md P1-C）
 * 题目全部由 data/guwen.js 篇目的逐句标注自动生成，不手写、不补内容：
 *   cut  断句   ← 句.停（教参/教案的朗读停顿，出处在 句.停源）：在字缝里点出 / 的位置
 *   order 排序  ← 句.今 按标点切块（≥3 块）打乱，排回通顺今译；今 不足 3 块时用 句.停 的节拍块排回原文语序
 *   fill 填今译 ← 句.对（只收有出处的注释）：选出加点字的今义；该今义在 句.今 里恰好出现一次时，今译里挖成横线
 * 字段格式见 tools/content/fix_gw_ju_tingdui.py 头注。缺字段就不出该题。
 * 用法：NHZGwChan.build(NHZ_GUWEN.texts) -> {cut:[], order:[], fill:[]}；node 下 module.exports 同名。
 */
(function (root) {
'use strict';

var PAUSE = /[，。！？；：、]/;          /* 停顿标点：标点处本来就停，不再出缝 */
var HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
var MAX_CUT = 24;                        /* 一道断句题最多这么多字，长句按分句切成几段 */

function hash(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h < 0 ? -h : h;
}
/* 确定性洗牌：同一道题每次生成都一样（错题本 id 才稳定）；显示时引擎还会再洗选项 */
function seeded(arr, seed) {
  var a = arr.slice(), s = seed || 1, i, j, t;
  for (i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    j = s % (i + 1);
    t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* 断句：把 停 串解析成 {text 原文, han[] 汉字在 text 中的下标, gaps[] 可点的缝, ans[] 正确的缝}
   缝 k = 第 k 个汉字和第 k+1 个汉字之间；两字之间夹着停顿标点的不算缝（《》“” 不挡缝） */
function parseTing(ting) {
  var text = '', han = [], ans = [], i, c;
  for (i = 0; i < ting.length; i++) {
    c = ting.charAt(i);
    if (c === '/') { if (han.length) ans.push(han.length - 1); continue; }
    if (HAN.test(c)) han.push(text.length);
    text += c;
  }
  var gaps = [];
  for (i = 0; i + 1 < han.length; i++) {
    var mid = text.slice(han[i] + 1, han[i + 1]);
    if (!PAUSE.test(mid)) gaps.push(i);
  }
  ans = ans.filter(function (k) { return gaps.indexOf(k) >= 0; });
  return { text: text, han: han, gaps: gaps, ans: ans };
}
/* 长句按分句（停顿标点后切）贪心拼段，每段 ≤ MAX_CUT 字 */
function splitTing(ting) {
  var hanLen = ting.replace(/\//g, '').split('').filter(function (c) { return HAN.test(c); }).length;
  if (hanLen <= MAX_CUT) return [ting];
  var parts = ting.match(/[^，。！？；：]+[，。！？；：]?[”’」]*/g) || [ting];
  var out = [], buf = '', n = 0;
  parts.forEach(function (p) {
    var m = p.split('').filter(function (c) { return HAN.test(c); }).length;
    if (buf && n + m > MAX_CUT) { out.push(buf); buf = ''; n = 0; }
    buf += p; n += m;
  });
  if (buf) out.push(buf);
  return out;
}

function clauses(s) {
  return String(s || '').split(/[，。！？；：、“”‘’「」]+/).filter(function (x) { return x; });
}

function build(texts) {
  var R = { cut: [], order: [], fill: [] };
  (texts || []).forEach(function (t) {
    var ju = t && t['句'];
    if (!Array.isArray(ju) || !ju.length) return;
    var title = t.title;
    /* 本篇全部注释，供填今译干扰项 */
    var allDui = [];
    ju.forEach(function (s) { (s['对'] || []).forEach(function (d) { if (d && d[0] && d[1]) allDui.push(d); }); });

    ju.forEach(function (s, si) {
      var yuan = s['原'] || '', jin = s['今'] || '';
      /* cut */
      if (s['停'] && s['停'].replace(/\//g, '') === yuan) {
        splitTing(s['停']).forEach(function (piece) {
          var p = parseTing(piece);
          if (!p.ans.length || p.gaps.length < 2) return;
          R.cut.push({ gw: 1, t: title, ting: piece, jin: jin, src: s['停源'] || '' });
        });
      }
      /* order：今 按标点切块 */
      var jc = clauses(jin);
      if (jin && jc.length >= 3 && jc.length <= 7) {
        var ansJ = jc.join('');
        var itJ = seeded(jc, hash(title + si + 'j'));
        if (itJ.join('') === ansJ) itJ = itJ.slice(1).concat(itJ.slice(0, 1));
        if (itJ.join('') !== ansJ) R.order.push({ gw: 1, t: title, kind: 'jin',
          prompt: '《' + title + '》把这句的今译排通顺：' + yuan,
          items: itJ, answer: ansJ, full: jin });
      } else if (s['停'] && s['停'].replace(/\//g, '') === yuan) {
        var yc = s['停'].split(/[\/，。！？；：、“”‘’「」]+/).filter(function (x) { return x; });
        var ansY = yc.join('');
        if (yc.length >= 3 && yc.length <= 8) {
          var itY = seeded(yc, hash(title + si + 'y'));
          if (itY.join('') === ansY) itY = itY.slice(1).concat(itY.slice(0, 1));
          if (itY.join('') !== ansY) R.order.push({ gw: 1, t: title, kind: 'yuan',
            prompt: '《' + title + '》按原文语序排好这句的节拍' + (jin ? '（今译：' + jin + '）' : ''),
            items: itY, answer: ansY, full: s['停'] });
        }
      }
      /* fill */
      (s['对'] || []).forEach(function (d) {
        if (!d || !d[0] || !d[1]) return;
        var w = d[0], g = d[1], pos = d[2] && typeof d[2].i === 'number' ? d[2].i : yuan.indexOf(w);
        if (yuan.substr(pos, w.length) !== w) pos = yuan.indexOf(w);
        if (pos < 0) return;
        var pool = allDui.filter(function (x) {
          return x[0] !== w && x[1] !== g && x[1].indexOf(g) < 0 && g.indexOf(x[1]) < 0;
        }).map(function (x) { return x[1]; });
        var uniq = [];
        pool.forEach(function (x) { if (uniq.indexOf(x) < 0) uniq.push(x); });
        if (uniq.length < 3) return;                     /* 本篇注释不够三个干扰项就不出，不跨篇硬凑 */
        var dis = seeded(uniq, hash(title + w + g)).slice(0, 3);
        var opts = seeded([g].concat(dis), hash(w + title));
        var k1 = jin.indexOf(g), blank = (k1 >= 0 && jin.indexOf(g, k1 + 1) < 0)
          ? jin.slice(0, k1) + '___' + jin.slice(k1 + g.length) : '';
        R.fill.push({ gw: 1, t: title, yuan: yuan, i: pos, w: w, jin: blank,
          opts: opts, a: opts.indexOf(g),
          exp: '「' + w + '」：' + g + '。' + (jin ? '整句今译：' + jin : '') });
      });
    });
  });
  return R;
}

var API = { build: build, parseTing: parseTing, splitTing: splitTing, clauses: clauses };
root.NHZGwChan = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
