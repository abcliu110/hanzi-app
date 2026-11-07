/* 提取练习升级（A23 · MASTER_PLAN 阶段三「提取练习升级（填空/简答题型）」，2026-11-07 FUXI）
 * 不给选项、先自己写（或在心里答）再对答案、答不上的自评——全部由仓库已有数据自动生成，不手写一道题：
 *   recall「填空·自己写」
 *     ← 各区 quiz/data_<tab>.js 的 blank 填空题：去掉选项，标准答案 = opts[a]，解析 = 原题 exp；
 *     ← 古文 data/guwen.js 各篇「重点」词注（[词, 今义]）：词在本篇原文里只出现一次的才出题
 *        （出现多次可能义项不同，不出），题面带上该词所在的句子，答案 = 注释今义；
 *   short「简答·自评」追加
 *     ← 古文 data/guwen.js 各篇 句.原 / 句.今：原句译成现代汉语，答案 = 句.今（与 data_short.js 同格式，
 *        已在 data_short.js 里的同题不重复出）。
 * 判分：写了且与答案（或「、；」分开的任一义项）逐字一致（去空格标点）直接算对；否则亮出参考答案，
 *   由孩子自评「我答对了 / 没答对」——同义说法算不算对由人判断，不做 NLP。
 * 记录：引擎 finishQuestion 照常写 nhz_quiz_wrong 与 NHZReview（nhz_wrong / nhz_srs），复习页按「显示答案→记得/忘了」回放。
 * 用法：NHZRecallGen.fromBlank(blankList) / NHZRecallGen.guwen(NHZ_GUWEN.texts) -> {recall:[], short:[]}；node 下 module.exports 同名。
 */
(function (root) {
'use strict';

var HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
var MAX_CTX = 32;   /* 题面里带的原句最长这么多字，长句只带词所在的分句 */

function count(hay, needle) {
  if (!needle) return 0;
  var n = 0, i = hay.indexOf(needle);
  while (i >= 0) { n++; i = hay.indexOf(needle, i + needle.length); }
  return n;
}
/* 词所在的整句（。！？；结尾）；超长时退到逗号分句 */
function contextOf(text, w) {
  text = String(text).replace(/[“”‘’「」『』]/g, '');   /* 引号会被切成半边，题面里一律去掉 */
  var sents = text.match(/[^。！？；]+[。！？；]?[”’」]*/g) || [text];
  for (var i = 0; i < sents.length; i++) {
    var s = sents[i].replace(/^\s+|\s+$/g, '');
    if (s.indexOf(w) < 0) continue;
    if (s.length <= MAX_CTX) return s;
    var cl = s.match(/[^，、：]+[，、：]?/g) || [s];
    for (var j = 0; j < cl.length; j++) if (cl[j].indexOf(w) >= 0) return cl[j].replace(/[，、：]$/, '');
    return s;
  }
  return '';
}
/* 注释今义里的并列义项（「拉、拿」「全、都」）各自也算对 */
function altsOf(mean) {
  mean = String(mean);
  var extra = [], m = /（一说([^）]+)）/.exec(mean);
  var base = mean.replace(/（[^）]*）/g, '');
  if (base !== mean && HAN.test(base)) extra.push(base);   /* 「按时（一说时常）」：按时、时常都算对 */
  if (m) extra.push(m[1]);
  var parts = base.split(/[、；;\/]/).map(function (p) { return p.replace(/^\s+|\s+$/g, ''); })
    .filter(function (p) { return HAN.test(p); });
  return extra.concat(parts.length > 1 ? parts : []);
}

/* 各区 blank 填空题 → 不给选项的填空 */
function fromBlank(list) {
  var out = [];
  (list || []).forEach(function (q) {
    if (!q || typeof q.s !== 'string' || !Array.isArray(q.opts) || typeof q.a !== 'number') return;
    var ans = q.opts[q.a];
    if (ans == null || !String(ans).replace(/\s/g, '')) return;
    var it = { s: q.s, a: String(ans), exp: q.exp || '', from: 'blank' };
    if (q.point) it.point = q.point;
    if (q.t) it.t = q.t;
    out.push(it);
  });
  return out;
}

/* 古文：重点词注 → recall；句.今 → short */
function guwen(texts, existingShort) {
  var recall = [], short = [], seenQ = {};
  (existingShort || []).forEach(function (q) { if (q && q.q) seenQ[q.q] = 1; });
  (texts || []).forEach(function (t) {
    if (!t || !t.title) return;
    var yuan = String(t['原文'] || '');
    var srcTxt = t.source ? '出自' + t.source + '。' : '';
    (t['重点'] || []).forEach(function (p) {
      if (!Array.isArray(p) || !p[0] || !p[1]) return;
      var w = String(p[0]), mean = String(p[1]);
      if (count(yuan, w) !== 1) return;
      var ctx = contextOf(yuan, w);
      if (!ctx) return;
      var it = {
        q: '《' + t.title + '》「' + ctx + '」里，「' + w + '」是什么意思？',
        a: mean, t: t.title, from: 'zhongdian',
        exp: '本篇重点词注释：' + w + '——' + mean + '。' + srcTxt
      };
      var al = altsOf(mean);
      if (al.length) it.alt = al;
      recall.push(it);
    });
    (t['句'] || []).forEach(function (j) {
      if (!j || !j['原'] || !j['今']) return;
      var q = '《' + t.title + '》把这句译成现代汉语：' + j['原'];
      if (seenQ[q]) return;
      seenQ[q] = 1;
      short.push({ q: q, a: j['今'], t: t.title, from: 'ju', exp: srcTxt + '原文：' + j['原'] });
    });
  });
  return { recall: recall, short: short };
}

var api = { fromBlank: fromBlank, guwen: guwen, contextOf: contextOf, altsOf: altsOf };
root.NHZRecallGen = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
