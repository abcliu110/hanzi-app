/* 互动学习引擎 · 纯前端零依赖
 * 数据: quiz/data_<tab>.js  ->  window.NHZ_QUIZ = {tab, title, modes:{choice:[],judge:[],...}}
 * 错题本: localStorage['nhz_quiz_wrong'] = {tab:{mode:[q,...]}}
 */
(function () {
'use strict';

/* ---------- 基础 ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function $(id) { return document.getElementById(id); }
function shuffle(arr) {
  var a = arr.slice(), i, j, t;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
/* 选项洗牌（2026-11-05 内容审查 F6）：choice/blank/spot/rewrite 每次出题打乱选项，
   重映射答案下标 a 与「误解标注.选项」字母；选项里有「都对 / B和C」这类指位置的就不打乱。
   返回新对象，原题对象不变（错题本、统一错题本仍按原题存，id 不受洗牌影响）。 */
var SHUF_MODES = { choice: 1, blank: 1, spot: 1, rewrite: 1, fill: 1, hua: 1 };
function shuffleOpts(m, q) {
  if (!SHUF_MODES[m] || !q || !Array.isArray(q.opts) || q.opts.length < 2 || typeof q.a !== 'number') return q;
  for (var t = 0; t < q.opts.length; t++) {
    if (/都对|都不对|以上|[A-D]和[A-D]|[A-D]、[A-D]|[A-D]项/.test(String(q.opts[t]))) return q;
  }
  var idx = shuffle(q.opts.map(function (o, i) { return i; }));
  var v = {}, k;
  for (k in q) if (Object.prototype.hasOwnProperty.call(q, k)) v[k] = q[k];
  v.opts = idx.map(function (i) { return q.opts[i]; });
  v.a = idx.indexOf(q.a);
  if (Array.isArray(q['误解标注'])) {
    v['误解标注'] = q['误解标注'].map(function (mz) {
      var o = {}, kk;
      for (kk in mz) if (Object.prototype.hasOwnProperty.call(mz, kk)) o[kk] = mz[kk];
      var oi = typeof mz['选项'] === 'string' ? mz['选项'].charCodeAt(0) - 65 : -1;
      if (oi >= 0 && oi < q.opts.length) o['选项'] = String.fromCharCode(65 + idx.indexOf(oi));
      return o;
    });
  }
  return v;
}
function getParam(name) {
  var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search || '');
  return m ? decodeURIComponent(m[1]) : '';
}
/* 简答宽松比对（A23-4 最小可用版，不做 NLP）：只保留汉字/字母/数字，
   去掉全部空格与标点后逐字比对；同义改写判错，见数据文件头注。 */
function normalizeShort(s) {
  return String(s == null ? '' : s).replace(/[^\u3400-\u9fff\uf900-\ufaffA-Za-z0-9]/g, '');
}
function shortAnswers(q) {
  if (!q) return [];
  var a = q.a;
  if (Array.isArray(a)) return a.slice();
  var out = a != null ? [a] : [];
  if (Array.isArray(q.alt)) out = out.concat(q.alt);
  return out;
}
function shortOk(q, input) {
  var v = normalizeShort(input);
  if (!v) return false;
  return shortAnswers(q).some(function (a) { return normalizeShort(a) === v; });
}
/* A22-12：从 engine.js 自身的 script 路径推导 wb 目录（quiz/index.html 下为 ../wb/，
   games/shici/huazhong.html 下为 ../../quiz/../wb/，浏览器按相对路径归一化） */
function engineWbDir() {
  var ss = document.querySelectorAll('script[src]'), i, s;
  for (i = ss.length - 1; i >= 0; i--) {
    s = ss[i].getAttribute('src') || '';
    if (/(^|\/)engine\.js$/.test(s)) return s.replace(/engine\.js$/, '') + '../wb/';
  }
  return '../wb/';
}

/* ---------- 模式元数据 ---------- */
var MODES = {
  choice:  { name: '选择题',   icon: '📝', desc: '四选一，答错看解析' },
  judge:   { name: '判断题',   icon: '⚡', desc: '对错闪电战' },
  tag:     { name: '点选标注', icon: '🏷️', desc: '先点词，再点标签' },
  order:   { name: '排序组装', icon: '🧩', desc: '点词按顺序拼句子' },
  blank:   { name: '填空',     icon: '✏️', desc: '选词填进横线里' },
  match:   { name: '连线配对', icon: '🔗', desc: '左右点选配成对' },
  spot:    { name: '找错改错', icon: '🔍', desc: '先找病因，再看改正' },
  rewrite: { name: '句式改写', icon: '🔄', desc: '换个说法来表达' },
  /* A22-7 论证地图（设计 docs/gaijin/luoji-gaijin-sheji.md P1-1）：tag 题里标签恰为「论点 / 论据 / 论证」的，
     按树形挂卡渲染（论点在顶、论证是连接、论据在下）。数据仍是 tag 题、错题本仍记在 tag 下，只换显示与交互外观。 */
  map:     { name: '论证地图', icon: '🌳', desc: '把卡片挂到论证树上' },
  /* A22-9 古文产出题型（docs/gaijin/guwen-gaijin-sheji.md P1-C）：题目由 data/guwen.js 句.停/今/对 经 gw_chan.js 自动生成 */
  cut:     { name: '断句',     icon: '✂️', desc: '在字缝里点出朗读停顿' },
  short:   { name: '简答',     icon: '✍️', desc: '自己写答案，对照后自评' },
  /* A23 提取练习升级（FUXI）：不给选项的填空，题目由 quiz/recall_gen.js 从各区 blank 题与古文重点词注自动生成 */
  recall:  { name: '填空·自己写', icon: '🖊️', desc: '不给选项，先自己想再对答案' },
  fill:    { name: '填今译',   icon: '🈳', desc: '选出画线字词的今译' },
  gworder: { name: '排今译',   icon: '🧩', desc: '把今译词块排回通顺的话' },
  /* A22-12 画中有诗（设计 docs/gaijin/shici-gaijin-sheji.md P1-3）：题面为 scroll 白板终帧，
     四选一诗句；题目由 quiz/hua_gen.js 从 wb 登记 + data/shici.js 自动生成，数据仍是 choice 形 */
  hua:     { name: '画中有诗', icon: '🎨', desc: '看白板定格画，猜是哪句诗' }
};
var MAP_TAGS = ['论点', '论证', '论据'];   /* 树上自上而下的顺序 */
function isMap(q) {
  if (!q || !Array.isArray(q.tags) || q.tags.length !== 3 || !Array.isArray(q.tokens)) return false;
  for (var i = 0; i < MAP_TAGS.length; i++) if (q.tags.indexOf(MAP_TAGS[i]) < 0) return false;
  return q.tokens.every(function (t) { return t && q.tags.indexOf(t.tag) >= 0; });
}
/* 模式卡/顶栏显示用：整组 tag 题都是论证题时显示为「论证地图」 */
function modeMeta(m, q) {
  if (m === 'order' && (q ? q.gw : (S.modes.order && S.modes.order.length && S.modes.order.every(function (x) { return x && x.gw; })))) return MODES.gworder;
  if (m === 'tag') {
    if (q ? isMap(q) : (S.modes.tag && S.modes.tag.length && S.modes.tag.every(isMap))) return MODES.map;
  }
  return MODES[m];
}
var MODE_ORDER = ['choice', 'judge', 'tag', 'order', 'blank', 'match', 'spot', 'rewrite', 'cut', 'fill', 'hua', 'recall', 'short'];
var TAB_NAMES = { yuwen: '语法', shici: '古诗词', bushou: '部首', zika: '识字', logic: '逻辑', lab: '实验', guwen: '古文' };

/* ---------- 会话状态 ---------- */
var S = {
  tab: 'yuwen', title: '', modes: {},
  view: 'home', mode: null, list: [], idx: 0,
  score: 0, streak: 0, best: 0, correct: 0,
  startT: 0, locked: false
};
var cur = null; /* 当前题的临时交互状态 */

/* ---------- 错题本 ---------- */
var WB_KEY = 'nhz_quiz_wrong';
/* 复习/错题统一记录（与 fuxi.js 同款 helper，保持一致，勿单改一处）：
   答错 -> 进统一错题本并安排明天复习；答对复习项 -> 推进间隔。
   静默失败，不影响答题反馈；不碰 quiz 自有错题本 nhz_quiz_wrong 的逻辑。 */
window.NHZReview = window.NHZReview || (function () {
  var WK = 'nhz_wrong', SK = 'nhz_srs';
  var IV = [1, 2, 4, 7, 15, 30];
  function load(k, fb) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; }
    catch (e) { return fb; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return 'q' + (h < 0 ? -h : h);
  }
  function idOf(it) { return hash(it.q + '\n' + (it.options || []).join('\n') + '\n' + it.answer); }
  function record(it, correct) {
    if (!it || !it.q) return;
    var id = idOf(it);
    var wrong = load(WK, []), srs = load(SK, {}), now = Date.now();
    if (correct) {
      if (srs[id]) {
        var iv = Math.min(srs[id].iv + 1, IV.length - 1);
        srs[id] = { iv: iv, next: now + IV[iv] * 86400000 };
        save(SK, srs);
      }
    } else {
      var found = false;
      for (var i = 0; i < wrong.length; i++) {
        if (wrong[i].id === id) {
          wrong[i] = { id: id, q: it.q, options: it.options || [], answer: it.answer,
            解析: it['解析'] || '', src: it.src, point: it.point, addedAt: wrong[i].addedAt || now };
          found = true; break;
        }
      }
      if (!found) wrong.push({ id: id, q: it.q, options: it.options || [], answer: it.answer,
        解析: it['解析'] || '', src: it.src, point: it.point, addedAt: now });
      save(WK, wrong);
      srs[id] = { iv: 0, next: now + IV[0] * 86400000 };
      save(SK, srs);
    }
  }
  function review(id, remembered) {
    var srs = load(SK, {}), now = Date.now();
    if (!srs[id]) return false;
    if (remembered) {
      var iv = Math.min(srs[id].iv + 1, IV.length - 1);
      srs[id] = { iv: iv, next: now + IV[iv] * 86400000 };
    } else {
      srs[id] = { iv: 0, next: now + IV[0] * 86400000 };
    }
    save(SK, srs);
    return true;
  }
  function clearWrong(id) {
    var wrong = load(WK, []), srs = load(SK, {}), nw = [];
    for (var i = 0; i < wrong.length; i++) if (wrong[i].id !== id) nw.push(wrong[i]);
    save(WK, nw);
    if (srs[id]) { delete srs[id]; save(SK, srs); }
  }
  return { record: record, review: review, clearWrong: clearWrong,
    loadWrong: function () { return load(WK, []); },
    loadSrs: function () { return load(SK, {}); } };
})();

/* 星星（与 today-task.js、fuxi.js 同款 helper，保持一致，勿单改一处）：
   每日每种来源最多 1 颗，轻量，不做上瘾机制。 */
window.NHZStars = window.NHZStars || (function () {
  var K = 'nhz_stars';
  function load() {
    try { var v = JSON.parse(localStorage.getItem(K) || 'null'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function save(d) { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function award(src) {
    var d = load(), t = today();
    d.days = d.days || {};
    d.days[t] = d.days[t] || {};
    if (d.days[t][src]) return false;
    d.days[t][src] = 1;
    d.total = (d.total || 0) + 1;
    save(d);
    return true;
  }
  function total() { return load().total || 0; }
  return { award: award, total: total, today: today };
})();
function wbLoad() {
  try { return JSON.parse(localStorage.getItem(WB_KEY)) || {}; }
  catch (e) { return {}; }
}
function wbSave(wb) {
  try { localStorage.setItem(WB_KEY, JSON.stringify(wb)); } catch (e) {}
}
function wbAdd(tab, mode, q) {
  var wb = wbLoad();
  wb[tab] = wb[tab] || {}; wb[tab][mode] = wb[tab][mode] || [];
  var key = JSON.stringify(q), arr = wb[tab][mode], i;
  for (i = 0; i < arr.length; i++) if (JSON.stringify(arr[i]) === key) return;
  arr.push(q); wbSave(wb);
}
function wbList(tab, mode) {
  var wb = wbLoad();
  return (wb[tab] && wb[tab][mode]) ? wb[tab][mode].slice() : [];
}
function wbRemove(tab, mode, q) {
  var wb = wbLoad();
  if (!(wb[tab] && wb[tab][mode])) return;
  var key = JSON.stringify(q);
  wb[tab][mode] = wb[tab][mode].filter(function (x) { return JSON.stringify(x) !== key; });
  wbSave(wb);
}
function wbCount(tab) {
  var wb = wbLoad(), n = 0, m;
  if (!wb[tab]) return 0;
  for (m in wb[tab]) n += wb[tab][m].length;
  return n;
}

/* ---------- 视图 ---------- */
function showView(v) {
  S.view = v;
  ['home', 'quiz', 'done'].forEach(function (k) {
    $('view-' + k).hidden = (k !== v);
  });
  window.scrollTo(0, 0);
}
function availModes() {
  return MODE_ORDER.filter(function (m) {
    return S.modes[m] && S.modes[m].length > 0;
  });
}
function renderHome() {
  $('qzTitle').textContent = (S.title || TAB_NAMES[S.tab] || '互动') + ' · 互动练习';
  var ms = availModes(), h;
  if (!ms.length) {
    h = '<div class="qz-empty">📦 题库还在准备中，<br>先去看看知识卡吧～</div>';
  } else {
    h = '<div class="qz-modes">' + ms.map(function (m) {
      var meta = modeMeta(m);
      return '<button class="qz-mode" data-mode="' + m + '">' +
        '<div class="qz-mode-ic">' + meta.icon + '</div>' +
        '<div class="qz-mode-name">' + meta.name + '</div>' +
        '<div class="qz-mode-desc">' + meta.desc + '</div>' +
        '<div class="qz-mode-n">' + S.modes[m].length + ' 题</div></button>';
    }).join('') + '</div>';
  }
  if (S.point) h += '<a class="qz-wrong" href="index.html?tab=' + encodeURIComponent(S.tab) + '" style="display:block;text-align:center;text-decoration:none">看全部题目 →</a>';
  var wc = wbCount(S.tab);
  if (wc > 0) {
    h += '<button class="qz-wrong" data-mode="wrong">📓 错题重练' +
      '<span class="qz-wrong-n">（' + wc + ' 道待攻克）</span></button>';
  }
  $('view-home').innerHTML = h;
  showView('home');
}

/* ---------- 开局 ---------- */
function startMode(mode) {
  var list;
  if (mode === 'wrong') {
    list = [];
    availModes().forEach(function (m) {
      wbList(S.tab, m).forEach(function (q) { list.push({ _m: m, _q: q, _v: shuffleOpts(m, q) }); });
    });
    list = shuffle(list);
  } else {
    list = shuffle(S.modes[mode]).map(function (q) { return { _m: mode, _q: q, _v: shuffleOpts(mode, q) }; });
  }
  if (!list.length) return;
  S.mode = mode; S.list = list; S.idx = 0;
  S.score = 0; S.streak = 0; S.best = 0; S.correct = 0;
  S.startT = Date.now();
  renderQ();
  showView('quiz');
}

/* ---------- 答题 ---------- */
function renderQ() {
  var item = S.list[S.idx];
  S.locked = false;
  cur = { sel: -1, selL: null, done: 0, mistakes: 0, wrong: false, busy: false };
  $('qzProg').textContent = (S.idx + 1) + '/' + S.list.length;
  $('qzBar').style.width = Math.round(S.idx / S.list.length * 100) + '%';
  $('qzScore').textContent = S.score + ' 分';
  $('qzStreak').textContent = S.streak > 1 ? '🔥 ' + S.streak + ' 连击' : '';
  $('qzModeTag').textContent = S.mode === 'wrong'
    ? '📓 错题'
    : modeMeta(item._m, item._q).icon + ' ' + modeMeta(item._m, item._q).name;
  $('qbox').innerHTML = Render[item._m](item._v || item._q);
  /* A22-12：画中有诗题渲染后，把 wb 终帧挂进画框（hua_gen.js 未加载时只出选项，不阻塞答题） */
  if (item._m === 'hua' && window.NHZQuizHua && window.NHZQuizHua.mountFrame) {
    window.NHZQuizHua.mountFrame($('qbox').querySelector('.qz-wb'), item._v || item._q, engineWbDir());
  }
  $('qfb').innerHTML = '';
  $('qfb').hidden = true;
  $('btnNext').hidden = true;
}
function buildExp(m, q, pickedIdx) {
  var x = '';
  if (m === 'spot') {
    x = '<div class="qz-fix">✅ 改正：' + esc(q.fix) + '</div>';
  } else if (m === 'order') {
    x = '正确答案：' + esc(q.gw ? q.full : q.answer);
  } else if (m === 'cut') {
    x = '停顿：' + esc(q.ting) + (q.jin ? '<br>今译：' + esc(q.jin) : '') + (q.src ? '<div class="qz-sub">停顿出处：' + esc(q.src) + '</div>' : '');
  } else if (m === 'tag') {
    x = q.tokens.map(function (t) { return esc(t.t) + ' → ' + esc(t.tag); }).join('<br>');
  } else if (m === 'match') {
    x = '全部配对完成！';
  } else if (m === 'short' || m === 'recall') {
    x = (m === 'recall' ? '答案：' : '参考答案：') + esc(Array.isArray(q.a) ? q.a[0] : q.a);
  }
  /* 第三刀：选项级反馈——答错时指出具体误解 */
  if (pickedIdx != null && q['误解标注'] && q['误解标注'].length) {
    var optLabel = String.fromCharCode(65 + pickedIdx); // A/B/C/D
    for (var mi = 0; mi < q['误解标注'].length; mi++) {
      var mz = q['误解标注'][mi];
      if (mz['选项'] === optLabel) {
        x += '<div class="qz-miscon"><b>💡 你可能误解了：</b>' + esc(mz['误解']) + '</div>';
        if (mz['正反例'] && mz['正反例'].length) {
          x += '<div class="qz-pair">' + mz['正反例'].map(function (pr) {
            return '<p>' + esc(pr) + '</p>';
          }).join('') + '</div>';
        }
        break;
      }
    }
  }
  if (q.exp) x += (x ? '<br>' : '') + esc(q.exp);
  return x;
}
function finishQuestion(ok, expHtml) {
  if (S.locked) return;
  S.locked = true;
  var item = S.list[S.idx];
  if (ok) {
    S.score += 10; S.streak++; S.correct++;
    if (S.streak > S.best) S.best = S.streak;
    if (S.mode === 'wrong') wbRemove(S.tab, item._m, item._q);
  } else {
    S.streak = 0;
    if (S.mode !== 'wrong') wbAdd(S.tab, item._m, item._q);
  }
  /* 错题打通：单题可表述的模式答错进统一错题本，答对复习项推进间隔；
     不改反馈与计分，不碰 quiz 自有错题本。tag/match/order 以往因“无单题答案文本”
     暂不接入，现合成整题答案文本接入：tag=每词→正确分类，match=整组左→右配对，
     order=正确顺序（与已接入的 gw order 同形，答案取 full 或 answer）。 */
  (function () {
    var q = item._q, m = item._m, rec = null;
    if (m === 'choice') rec = { q: q.q, options: q.opts, answer: q.opts[q.a], 解析: q.exp || '' };
    else if (m === 'judge') rec = { q: q.q, options: ['正确', '错误'], answer: q.a ? '正确' : '错误', 解析: q.exp || '' };
    else if (m === 'blank') rec = { q: q.s, options: q.opts, answer: q.opts[q.a], 解析: q.exp || '' };
    else if (m === 'spot') rec = { q: q.s + ' ' + q.prompt, options: q.opts, answer: q.opts[q.a], 解析: q.exp || '' };
    else if (m === 'rewrite') rec = { q: q.from + ' → ' + q.target, options: q.opts, answer: q.opts[q.a], 解析: q.exp || '' };
    else if (m === 'fill') rec = { q: '《' + q.t + '》' + q.yuan + ' 中「' + q.w + '」的今译', options: q.opts, answer: q.opts[q.a], 解析: q.exp || '' };
    else if (m === 'hua') rec = { q: '画中有诗' + (q.title ? '《' + q.title + '》' : ''), options: q.opts, answer: q.opts[q.a], 解析: q.exp || '' };
    else if (m === 'cut') rec = { q: '断句：' + q.ting.replace(/\//g, '') + '（《' + q.t + '》）', options: [], answer: q.ting, 解析: q.src ? '停顿出处：' + q.src : '' };
    else if (m === 'order') rec = { q: q.prompt, options: [], answer: q.gw ? q.full : q.answer, 解析: q.exp || '' };
    else if (m === 'tag' && Array.isArray(q.tokens)) rec = { q: q.prompt, options: [],
      answer: q.tokens.map(function (t) { return t.t + '→' + t.tag; }).join('；'), 解析: q.exp || '' };
    else if (m === 'match' && Array.isArray(q.pairs)) rec = { q: q.title, options: [],
      answer: q.pairs.map(function (p) { return p[0] + '→' + p[1]; }).join('；'), 解析: '' };
    else if (m === 'short') rec = { q: q.q, options: [],
      answer: Array.isArray(q.a) ? q.a[0] : q.a, 解析: q.exp || '' };
    else if (m === 'recall') rec = { q: q.q || ('填空：' + q.s), options: [], answer: q.a, 解析: q.exp || '' };
    if (rec && rec.q && rec.answer != null) NHZReview.record({
      q: rec.q, options: rec.options, answer: rec.answer, 解析: rec.解析, src: '练习',
      point: (S.title || TAB_NAMES[S.tab] || '') + ' · ' + (modeMeta(m, q) ? modeMeta(m, q).name : m) }, ok);
  })();
  var fb = $('qfb');
  fb.innerHTML = '<div class="qz-fb ' + (ok ? 'ok' : 'no') + '">' +
    '<div class="qz-fb-t">' + (ok ? '✅ 答对了！' : '❌ 答错了，别灰心') + '</div>' +
    (expHtml ? '<div class="qz-fb-x">' + expHtml + '</div>' : '') + '</div>';
  fb.hidden = false;
  $('btnNext').hidden = false;
  $('qzScore').textContent = S.score + ' 分';
  $('qzStreak').textContent = S.streak > 1 ? '🔥 ' + S.streak + ' 连击' : '';
}
function nextQ() {
  S.idx++;
  if (S.idx >= S.list.length) renderDone();
  else renderQ();
}

/* ---------- 结算 ---------- */
function renderDone() {
  /* 测验完成记星（每日最多 1 颗，不改结算显示） */
  if (window.NHZStars) window.NHZStars.award('quiz');
  var secs = Math.round((Date.now() - S.startT) / 1000);
  var mm = Math.floor(secs / 60), ss = secs % 60;
  var acc = S.list.length ? Math.round(S.correct / S.list.length * 100) : 0;
  var h = '<div class="qz-done-ic">' + (acc >= 80 ? '🏆' : acc >= 60 ? '💪' : '📖') + '</div>' +
    '<div class="qz-done-score">' + S.score + ' 分</div>' +
    '<div class="qz-done-row"><span>答对</span><span>' + S.correct + ' / ' + S.list.length + ' 题</span></div>' +
    '<div class="qz-done-row"><span>正确率</span><span>' + acc + '%</span></div>' +
    '<div class="qz-done-row"><span>用时</span><span>' + mm + ' 分 ' + ss + ' 秒</span></div>' +
    '<div class="qz-done-row"><span>最高连击</span><span>' + S.best + '</span></div>';
  if (S.mode === 'wrong') {
    h += '<div class="qz-done-note">还剩 ' + wbCount(S.tab) + ' 道错题，继续加油！</div>';
  }
  h += '<div class="qz-done-btns">' +
    '<button class="qz-btn primary" id="btnAgain">🔁 再来一轮</button>' +
    '<button class="qz-btn" id="btnModes">📋 换个玩法</button></div>';
  $('view-done').innerHTML = h;
  showView('done');
}

/* ---------- 8 种题型渲染（纯 HTML，无 DOM 依赖，可单测） ---------- */
var Render = {
  /* choice: {q, opts:[4], a, exp} */
  choice: function (q) {
    return '<div class="qz-q">' + esc(q.q) + '</div><div class="qz-opts">' +
      q.opts.map(function (o, i) {
        return '<button class="qz-btn" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
  },
  /* judge: {q, a:bool, exp} */
  judge: function (q) {
    return '<div class="qz-q">' + esc(q.q) + '</div>' +
      '<div class="qz-opts qz-duo">' +
      '<button class="qz-btn big" data-act="judge" data-i="1">⭕ 对</button>' +
      '<button class="qz-btn big" data-act="judge" data-i="0">❌ 错</button></div>';
  },
  /* tag: {prompt, tokens:[{t,tag}], tags:[候选]} */
  tag: function (q) {
    if (isMap(q)) return Render.map(q);
    return '<div class="qz-q">' + esc(q.prompt) + '</div>' +
      '<div class="qz-sub">先点一个词，再点下面的标签</div>' +
      '<div class="qz-toks">' + q.tokens.map(function (t, i) {
        return '<button class="qz-tok" data-act="tok" data-i="' + i + '">' + esc(t.t) + '</button>';
      }).join('') + '</div>' +
      '<div class="qz-tagrow">' + q.tags.map(function (t, i) {
        return '<button class="qz-tagbtn" data-act="tagb" data-i="' + i + '">' + esc(t) + '</button>';
      }).join('') + '</div>' +
      '<div class="qz-rowbtns"><button class="qz-btn ghost" data-act="tagreset">↩ 重来</button></div>';
  },
  /* map（A22-7）：同 tag 数据；树上三个位置按钮仍用 data-act="tagb" + 标签下标，判分逻辑与 tag 共用 */
  map: function (q) {
    var slot = function (tg, cls) {
      var i = q.tags.indexOf(tg);
      return '<button class="qz-mslot ' + cls + '" data-act="tagb" data-i="' + i + '" data-tag="' + esc(tg) + '">' +
        '<span class="qz-mslot-tag">' + esc(tg) + '</span><span class="qz-mslot-body"></span></button>';
    };
    return '<div class="qz-q">' + esc(q.prompt) + '</div>' +
      '<div class="qz-sub">先点一张卡，再点树上该挂的位置</div>' +
      '<div class="qz-map">' + slot('论点', 'top') + '<div class="qz-mbranch"></div>' +
      slot('论证', 'mid') + '<div class="qz-mbranch"></div>' + slot('论据', 'bot') + '</div>' +
      '<div class="qz-toks qz-mcards">' + shuffle(q.tokens.map(function (t, i) { return i; })).map(function (i) {
        return '<button class="qz-tok" data-act="tok" data-i="' + i + '">' + esc(q.tokens[i].t) + '</button>';
      }).join('') + '</div>' +
      '<div class="qz-rowbtns"><button class="qz-btn ghost" data-act="tagreset">↩ 重来</button></div>';
  },
  /* order: {prompt, items:[打乱], answer} */
  order: function (q) {
    return '<div class="qz-q">' + esc(q.prompt) + '</div>' +
      '<div class="qz-sub">点词按顺序拼；点已拼的词可撤销</div>' +
      '<div class="qz-answer" id="qzAns"></div>' +
      '<div class="qz-toks" id="qzPool">' + q.items.map(function (t) {
        return '<button class="qz-tok" data-act="opick" data-t="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('') + '</div>' +
      '<div class="qz-rowbtns"><button class="qz-btn primary" data-act="osubmit">✓ 提交</button>' +
      '<button class="qz-btn ghost" data-act="oclear">清空</button></div>';
  },
  /* blank: {s:带___, opts:[4], a, exp} */
  blank: function (q) {
    var s = esc(q.s).replace(/___/g, '<span class="qz-blank">____</span>');
    return '<div class="qz-sent">' + s + '</div><div class="qz-opts">' +
      q.opts.map(function (o, i) {
        return '<button class="qz-btn" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
  },
  /* match: {title, pairs:[[左,右],...]} */
  match: function (q) {
    var idx = q.pairs.map(function (p, i) { return i; });
    var L = shuffle(idx), R = shuffle(idx);
    return '<div class="qz-q">' + esc(q.title) + '</div>' +
      '<div class="qz-sub">先点左边，再点右边配对</div>' +
      '<div class="qz-match"><div class="qz-mcol">' +
      L.map(function (i) {
        return '<button class="qz-mbtn" data-act="mL" data-i="' + i + '">' + esc(q.pairs[i][0]) + '</button>';
      }).join('') + '</div><div class="qz-mcol">' +
      R.map(function (i) {
        return '<button class="qz-mbtn" data-act="mR" data-i="' + i + '">' + esc(q.pairs[i][1]) + '</button>';
      }).join('') + '</div></div>';
  },
  /* spot: {s, prompt, opts:[4], a, fix, exp} */
  spot: function (q) {
    return '<div class="qz-sent">' + esc(q.s) + '</div>' +
      '<div class="qz-q">' + esc(q.prompt) + '</div><div class="qz-opts">' +
      q.opts.map(function (o, i) {
        return '<button class="qz-btn" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
  },
  /* cut（A22-9 断句）: {gw, t, ting:带 / 的原文, jin, src}；字缝按钮 data-act="gap"，提交 csubmit */
  cut: function (q) {
    var p = window.NHZGwChan.parseTing(q.ting), h = '', hi = 0, k;
    for (k = 0; k < p.text.length; k++) {
      var c = p.text.charAt(k);
      h += '<span class="qz-cch' + (k === p.han[hi] ? '' : ' pu') + '">' + esc(c) + '</span>';
      if (k === p.han[hi]) {
        if (p.gaps.indexOf(hi) >= 0) h += '<button class="qz-gap" data-act="gap" data-i="' + hi + '" aria-label="在这里停顿"></button>';
        hi++;
      }
    }
    return '<div class="qz-q">《' + esc(q.t) + '》这句朗读时在哪里停顿？</div>' +
      '<div class="qz-sub">点两个字之间的缝插入 /，再点一次取消；标点处本来就停，不用点</div>' +
      '<div class="qz-sent qz-cut">' + h + '</div>' +
      (q.jin ? '<div class="qz-sub">今译：' + esc(q.jin) + '</div>' : '') +
      '<div class="qz-rowbtns"><button class="qz-btn primary" data-act="csubmit">✓ 提交</button>' +
      '<button class="qz-btn ghost" data-act="cclear">清空</button></div>';
  },
  /* fill（A22-9 填今译）: {gw, t, yuan, i, w, jin:今译挖空（可空）, opts, a, exp} */
  fill: function (q) {
    var y = esc(q.yuan.slice(0, q.i)) + '<b class="qz-hl">' + esc(q.w) + '</b>' + esc(q.yuan.slice(q.i + q.w.length));
    return '<div class="qz-q">《' + esc(q.t) + '》句中画线的「' + esc(q.w) + '」，今译是什么？</div>' +
      '<div class="qz-sent">' + y + (q.jin ? '<div class="qz-sub">今译：' +
        esc(q.jin).replace(/___/g, '<span class="qz-blank">____</span>') + '</div>' : '') + '</div>' +
      '<div class="qz-opts">' + q.opts.map(function (o, i) {
        return '<button class="qz-btn" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
  },
  /* hua（A22-12 画中有诗）: {q, opts:[4], a, exp, wbName, wbFile, scene, title, author}；
     选项走通用 pick 判分，画框由 renderQ 后的 mountFrame 挂终帧 */
  hua: function (q) {
    return '<div class="qz-q">' + esc(q.q) + '</div>' +
      '<div class="qz-wb" data-wb="' + esc(q.wbName || '') + '"><div class="qz-wb-load">🎨 正在加载白板画…</div></div>' +
      '<div class="qz-opts">' +
      q.opts.map(function (o, i) {
        return '<button class="qz-btn" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
  },
  /* short（A23-4）: {q, a:答案字符串或数组, alt:[同义答案], exp}；recall（A23 FUXI）: {s 带___ 或 q, a, alt, exp}。
     自评流程（判分在 onTap）：可写可不写 →「对答案」→ 写的与答案逐字一致（去空格标点）直接算对；
     否则亮出参考答案，由孩子点「我答对了 / 没答对」 */
  short: function (q) { return selfBox(q, 'short'); },
  recall: function (q) { return selfBox(q, 'recall'); },
  /* rewrite: {from, target, opts:[3], a, exp} */
  rewrite: function (q) {
    return '<div class="qz-sent">' + esc(q.from) + '</div>' +
      '<div class="qz-q">👉 ' + esc(q.target) + '</div><div class="qz-opts">' +
      q.opts.map(function (o, i) {
        return '<button class="qz-btn" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
  }
};

function selfBox(q, m) {
  var stem = q.q ? '<div class="qz-q">' + esc(q.q) + '</div>'
    : '<div class="qz-sent">' + esc(q.s).replace(/___/g, '<span class="qz-blank">____</span>') + '</div>';
  var box = m === 'short'
    ? '<textarea id="qzShortIn" rows="3" style="width:100%;box-sizing:border-box;font-size:17px;padding:10px;border:1px solid #ccc;border-radius:10px" placeholder="在这里写答案（也可以只在心里想）…"></textarea>'
    : '<input id="qzShortIn" type="text" autocomplete="off" style="width:100%;box-sizing:border-box;font-size:18px;padding:10px;border:1px solid #ccc;border-radius:10px" placeholder="写出空里的答案（也可以只在心里想）">';
  return stem +
    '<div class="qz-sub">不给选项：先自己写出来（或在心里答），再点「对答案」</div>' + box +
    '<div class="qz-rowbtns"><button class="qz-btn primary" data-act="scheck">👀 对答案</button></div>' +
    '<div class="qz-self" id="qzSelf" hidden><div class="qz-sub">参考答案：<b>' + esc(Array.isArray(q.a) ? q.a[0] : q.a) + '</b></div>' +
    '<div class="qz-sub">和你想的一样吗？意思对就算对。</div>' +
    '<div class="qz-rowbtns"><button class="qz-btn primary" data-act="sself" data-ok="1">✅ 我答对了</button>' +
    '<button class="qz-btn" data-act="sself" data-ok="0">❌ 没答对</button></div></div>';
}

/* ---------- 点选交互（事件委托，全部点选、无拖拽） ---------- */
function onTap(el) {
  var act = el.getAttribute('data-act');
  var item = S.list[S.idx];
  if (!item) return;
  var m = item._m, q = item._v || item._q, i, k;

  /* 单选类：choice / blank / spot / rewrite 用 pick；judge 用 judge */
  if ((act === 'pick' || act === 'judge') && !S.locked) {
    i = parseInt(el.getAttribute('data-i'), 10);
    var ok, ci;
    if (act === 'judge') { ok = ((i === 1) === !!q.a); ci = q.a ? 0 : 1; }
    else { ok = (i === q.a); ci = q.a; }
    var btns = $('qbox').querySelectorAll('button[data-act="' + act + '"]');
    for (k = 0; k < btns.length; k++) {
      btns[k].style.pointerEvents = 'none';
      if (k === ci) btns[k].classList.add('right');
    }
    if (!ok) el.classList.add('wrong');
    finishQuestion(ok, buildExp(m, q, ok ? null : i));
    return;
  }
  /* 简答 / 填空·自己写：对答案时写对了直接算对；否则亮出参考答案自评。判完锁题（finishQuestion 内锁） */
  if ((m === 'short' || m === 'recall') && !S.locked && (act === 'scheck' || act === 'sself')) {
    var inp = $('qbox').querySelector('#qzShortIn'), selfEl = $('qbox').querySelector('#qzSelf');
    var lockS = function () {
      var allS = $('qbox').querySelectorAll('[data-act]');
      for (k = 0; k < allS.length; k++) allS[k].style.pointerEvents = 'none';
      if (inp) inp.readOnly = true;
    };
    if (act === 'scheck') {
      if (inp && shortOk(q, inp.value)) { lockS(); if (selfEl) selfEl.hidden = true; finishQuestion(true, buildExp(m, q)); return; }
      if (inp) inp.readOnly = true;
      el.style.display = 'none';
      if (selfEl) selfEl.hidden = false;
      return;
    }
    lockS();
    if (selfEl) selfEl.hidden = true;   /* 判完由反馈框显示答案与解析 */
    finishQuestion(el.getAttribute('data-ok') === '1', buildExp(m, q));
    return;
  }
  if (S.locked) return;

  /* 点选标注 */
  if (m === 'tag') {
    if (act === 'tagreset') { renderQ(); return; }
    if (act === 'tok') {
      i = parseInt(el.getAttribute('data-i'), 10);
      if (el.classList.contains('right') || el.classList.contains('wrong')) return;
      var toks = $('qbox').querySelectorAll('[data-act="tok"]');
      for (k = 0; k < toks.length; k++) toks[k].classList.remove('sel');
      el.classList.add('sel');
      cur.sel = i;
      return;
    }
    if (act === 'tagb') {
      if (cur.sel < 0) return;
      i = parseInt(el.getAttribute('data-i'), 10);
      var tokEl = $('qbox').querySelector('[data-act="tok"][data-i="' + cur.sel + '"]');
      var good = (q.tokens[cur.sel].tag === q.tags[i]);
      tokEl.classList.remove('sel');
      tokEl.classList.add(good ? 'right' : 'wrong');
      tokEl.innerHTML = esc(q.tokens[cur.sel].t) +
        '<span class="mini">' + esc(q.tags[i]) + (good ? ' ✓' : ' ✗') + '</span>';
      if (!good) cur.wrong = true;
      /* 论证地图：卡片文字挂到树上所点的位置 */
      if (el.classList.contains('qz-mslot')) {
        var mb = el.querySelector('.qz-mslot-body');
        if (mb) mb.innerHTML += '<span class="qz-mhung ' + (good ? 'right' : 'wrong') + '">' + esc(q.tokens[cur.sel].t) + (good ? ' ✓' : ' ✗') + '</span>';
        el.classList.add('filled');
      }
      cur.sel = -1;
      var ndone = $('qbox').querySelectorAll('.qz-tok.right, .qz-tok.wrong').length;
      if (ndone === q.tokens.length) finishQuestion(!cur.wrong, buildExp(m, q));
      return;
    }
  }

  /* 断句（A22-9） */
  if (m === 'cut') {
    if (act === 'gap') { el.classList.toggle('on'); return; }
    if (act === 'cclear') {
      var gs = $('qbox').querySelectorAll('.qz-gap.on');
      for (k = 0; k < gs.length; k++) gs[k].classList.remove('on');
      return;
    }
    if (act === 'csubmit') {
      var ansC = window.NHZGwChan.parseTing(q.ting).ans, okC = true;
      var gEls = $('qbox').querySelectorAll('.qz-gap');
      for (k = 0; k < gEls.length; k++) {
        var gi = parseInt(gEls[k].getAttribute('data-i'), 10), want = ansC.indexOf(gi) >= 0, on = gEls[k].classList.contains('on');
        if (want && on) gEls[k].classList.add('right');
        else if (want) { gEls[k].classList.add('miss'); okC = false; }
        else if (on) { gEls[k].classList.add('wrong'); okC = false; }
      }
      var allC = $('qbox').querySelectorAll('[data-act]');
      for (k = 0; k < allC.length; k++) allC[k].style.pointerEvents = 'none';
      finishQuestion(okC, buildExp(m, q));
      return;
    }
  }

  /* 排序组装 */
  if (m === 'order') {
    if (act === 'opick') {
      el.setAttribute('data-act', 'odrop');
      $('qzAns').appendChild(el);
      return;
    }
    if (act === 'odrop') {
      el.setAttribute('data-act', 'opick');
      $('qzPool').appendChild(el);
      return;
    }
    if (act === 'oclear') {
      var ans = $('qzAns'), pool = $('qzPool');
      while (ans.firstChild) {
        ans.firstChild.setAttribute('data-act', 'opick');
        pool.appendChild(ans.firstChild);
      }
      return;
    }
    if (act === 'osubmit') {
      var seq = [], kids = $('qzAns').children;
      for (k = 0; k < kids.length; k++) seq.push(kids[k].getAttribute('data-t'));
      var joined = seq.join('');
      var ok2 = (joined === q.answer);
      var all = $('qbox').querySelectorAll('[data-act]');
      for (k = 0; k < all.length; k++) all[k].style.pointerEvents = 'none';
      var ab = $('qzAns').querySelectorAll('.qz-tok');
      for (k = 0; k < ab.length; k++) ab[k].classList.add(ok2 ? 'right' : 'wrong');
      finishQuestion(ok2, buildExp(m, q));
      return;
    }
  }

  /* 连线配对 */
  if (m === 'match' && !cur.busy) {
    if (act === 'mL') {
      if (el.classList.contains('right')) return;
      var ls = $('qbox').querySelectorAll('[data-act="mL"]');
      for (k = 0; k < ls.length; k++) ls[k].classList.remove('sel');
      el.classList.add('sel');
      cur.selL = el.getAttribute('data-i');
      return;
    }
    if (act === 'mR') {
      if (el.classList.contains('right') || cur.selL === null) return;
      var li = cur.selL, ri = el.getAttribute('data-i');
      var lEl = $('qbox').querySelector('[data-act="mL"][data-i="' + li + '"]');
      if (li === ri) {
        lEl.classList.remove('sel'); lEl.classList.add('right');
        el.classList.add('right');
        cur.done++; cur.selL = null;
        if (cur.done === q.pairs.length) finishQuestion(cur.mistakes === 0, buildExp(m, q));
      } else {
        cur.busy = true; cur.mistakes++;
        lEl.classList.add('wrong'); el.classList.add('wrong');
        setTimeout(function () {
          lEl.classList.remove('wrong'); lEl.classList.remove('sel');
          el.classList.remove('wrong');
          cur.busy = false; cur.selL = null;
        }, 450);
      }
      return;
    }
  }
}

/* ---------- 数据加载（script 注入，file:// 可用） ---------- */
function loadData(tab) {
  var settled = false, extra = null;
  /* 每次都按当前 window.NHZ_* 重算，可重复调用：数据晚到时再调一次即可生效 */
  function apply() {
    var D = window.NHZ_QUIZ;
    if (D && D.modes) {
      S.title = D.title || '';
      S.modes = D.modes;
      if (tab === 'guwen' && extra) {
        /* A22-9：古文产出题型由篇目逐句标注生成；?text=篇名 只出这一篇的产出题 */
        var gm = {}, txt = getParam('text');
        Object.keys(D.modes).forEach(function (m) { gm[m] = D.modes[m]; });
        ['cut', 'order', 'fill'].forEach(function (m) {
          gm[m] = (extra[m] || []).filter(function (q) { return !txt || q.t === txt; });
        });
        if (txt && (gm.cut.length + gm.order.length + gm.fill.length)) {
          gm = { cut: gm.cut, order: gm.order, fill: gm.fill };
          S.title = (D.title || '') + ' · ' + txt;
          S.point = txt;
        }
        S.modes = gm;
      }
      /* ?point=专题名：只出该专题的题（逻辑题每题带 point）；没有匹配的题时退回全部 */
      var pt = getParam('point');
      if (pt) {
        var fm = {}, n = 0;
        Object.keys(D.modes).forEach(function (m) {
          fm[m] = (D.modes[m] || []).filter(function (q) { return q && q.point === pt; });
          n += fm[m].length;
        });
        if (n) { S.modes = fm; S.title = (D.title || '') + ' · ' + pt; S.point = pt; }
      }
      /* A23-4 简答：新文件 data_short.js 按 tab 挂载（不改旧 data 文件）；
         ?text=篇名 时只留该篇的，?point=专题 时只留该专题的（无 point 的简答题不混入专题卷） */
      var shortAll = (window.NHZ_SHORT && window.NHZ_SHORT[tab]) ? window.NHZ_SHORT[tab].slice() : [];
      /* A23 提取练习升级（FUXI）：recall 由本卷 blank 题去选项生成；古文另加重点词注 recall 与 句.今 简答 */
      var RG = window.NHZRecallGen, recallAll = [];
      if (RG) {
        recallAll = RG.fromBlank(S.modes.blank);
        if (tab === 'guwen' && window.NHZ_GUWEN) {
          var gq = RG.guwen(window.NHZ_GUWEN.texts, shortAll);
          recallAll = recallAll.concat(gq.recall);
          shortAll = shortAll.concat(gq.short);
        }
      }
      var byPt = function (q) { return q && (q.t === S.point || q.point === S.point); };
      if (S.point) { shortAll = shortAll.filter(byPt); if (tab === 'guwen') recallAll = recallAll.filter(byPt); }
      if (shortAll.length) S.modes.short = shortAll;
      if (recallAll.length) S.modes.recall = recallAll;
    }
  }
  /* 数据真正加载完成（含古文篇目）时调用。答题中途到达时只更新题库，不把用户踢回首页 */
  function ready() {
    settled = true;
    apply();
    if (S.view === 'home') renderHome();
  }
  function addScript(src, cb) {
    var el = document.createElement('script');
    el.src = src; el.onload = cb; el.onerror = cb;
    document.head.appendChild(el);
  }
  function loadShort(cb) {
    var next = function () { if (window.NHZRecallGen) cb(); else addScript('recall_gen.js', cb); };
    if (window.NHZ_SHORT) { next(); return; }
    addScript('data_short.js', next);
  }
  addScript('data_' + tab + '.js', function () {
    loadShort(function () {
    if (tab !== 'guwen') { ready(); return; }
    /* 古文：再加载篇目数据与产出题生成器（A22-9） */
    addScript('../data/guwen.js', function () {
      addScript('gw_chan.js', function () {
        try {
          if (window.NHZGwChan && window.NHZ_GUWEN) extra = window.NHZGwChan.build(window.NHZ_GUWEN.texts);
        } catch (e) { extra = null; }
        ready();
      });
    });
    });
  });
  /* 兜底（4 秒）：file:// 某些环境既不报 onload 也不报 onerror 时先显示已有内容。
     不标记 settled，所以数据之后到达时 ready() 仍会应用，不会锁死题库 */
  setTimeout(function () {
    if (settled) return;
    apply();
    renderHome();
  }, 4000);
}

/* ---------- 初始化 ---------- */
function init() {
  var tab = getParam('tab');
  if (!TAB_NAMES[tab]) tab = 'yuwen';
  S.tab = tab;
  /* 返回 = 界面上一层：做题/结算中先回「选模式」；已在选模式页，回到来源页（from 参数，缺省回首页）。不用浏览器历史。 */
  $('btnBack').addEventListener('click', function () {
    if (S.view && S.view !== 'home') { renderHome(); return; }
    var from = getParam('from');
    var ok = { 'yuwen.html': 1, 'guwen.html': 1, 'shici.html': 1, 'bushou.html': 1, 'grammar_lab.html': 1, 'yuedu-xiezuo.html': 1, 'fuxi.html': 1, 'index.html': 1 };
    window.location.href = '../' + (ok[from] ? from : 'index.html');
  });
  $('btnNext').addEventListener('click', nextQ);
  $('view-home').addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-mode]') : null;
    if (b) startMode(b.getAttribute('data-mode'));
  });
  $('view-done').addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    if (t.id === 'btnAgain') startMode(S.mode);
    else if (t.id === 'btnModes') renderHome();
  });
  $('qbox').addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if (el) onTap(el);
  });
  $('qzTitle').textContent = (TAB_NAMES[tab] || '互动') + ' · 互动练习';
  loadData(tab);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

/* node 单测导出（浏览器下 module 未定义，自动跳过） */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Render: Render, MODES: MODES, MODE_ORDER: MODE_ORDER, TAB_NAMES: TAB_NAMES, isMap: isMap,
    shuffle: shuffle, shuffleOpts: shuffleOpts, esc: esc, buildExp: buildExp,
    normalizeShort: normalizeShort, shortOk: shortOk, shortAnswers: shortAnswers,
    wbLoad: wbLoad, wbSave: wbSave, wbAdd: wbAdd, wbList: wbList,
    wbRemove: wbRemove, wbCount: wbCount, WB_KEY: WB_KEY
  };
}

})();
