/* 画中有诗（A22-12，设计 docs/gaijin/shici-gaijin-sheji.md P1-3）
 * 题目自动生成：wb/index.js 里「诗:题目|作者」登记 + data/shici.js 诗句，只读，不改数据文件。
 * 终帧取法：不用收卷幕（含全诗文本，会泄题），用最后一幕纯画面幕（无 lines 字段），
 * 以 wb 播放器 seek(scene, dur) 渲染到终帧，静态展示（去掉页签/播放条/字幕、禁点播）。
 * scroll 模板还会把本幕 line 画在板顶，quiz 帧里把这行句字与圈字环藏掉（见 hideCaption），
 * 只留物件线稿，否则看图猜句等于照着念。
 * 供 quiz/engine.js 的 hua 题型与 games/shici/huazhong.html 共用。
 */
(function () {
'use strict';

function stripLine(s) {
  return String(s == null ? '' : s).replace(/[\s，。！？；、·]+$/g, '').replace(/^\s+/g, '');
}
function shuffle(arr) {
  var a = arr.slice(), i, j, t;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* 最后一幕纯画面幕：倒序找第一个没有 lines（收卷/全文）字段的幕；都没有则取最后一幕 */
function picSceneIdx(scenes) {
  var i;
  for (i = scenes.length - 1; i >= 0; i--) {
    if (!scenes[i].lines) return i;
  }
  return scenes.length - 1;
}

/* poems: NHZ_SHICI.poems；entries: [{key:'诗:题目|作者', file:'sc_xxx'}]；
   specs: {key: NHZWB.add 拦截到的场景 spec}。返回 quiz engine hua 题 [{q, opts, a, exp, wbName, wbFile, scene, title, author}] */
function buildQuestions(poems, entries, specs) {
  var pool = [], i, j, p, ls;
  poems.forEach(function (po) {
    (po.lines || []).forEach(function (l) {
      var s = stripLine(l);
      if (s.length >= 4) pool.push(s);
    });
  });
  var out = [];
  entries.forEach(function (e) {
    var bar = e.key.lastIndexOf('|');
    if (bar < 0) return;
    var title = e.key.slice(2, bar), author = e.key.slice(bar + 1), poem = null;
    for (i = 0; i < poems.length; i++) {
      if (poems[i].title === title && poems[i].author === author) { poem = poems[i]; break; }
    }
    if (!poem || !poem.lines || !poem.lines.length) return;
    var spec = specs[e.key];
    if (!spec || !spec.scenes || !spec.scenes.length) return;
    var scene = picSceneIdx(spec.scenes);
    /* 画面幕的诗句在幕顶层 line，或在 beats[] 某 beat 的 line 里（scroll 模板后者常见） */
    var scLine = stripLine((spec.scenes[scene] || {}).line || '');
    if (!scLine && spec.scenes[scene] && spec.scenes[scene].beats) {
      for (j = spec.scenes[scene].beats.length - 1; j >= 0; j--) {
        if (spec.scenes[scene].beats[j].line) { scLine = stripLine(spec.scenes[scene].beats[j].line); break; }
      }
    }
    var poemLines = poem.lines.map(stripLine).filter(function (s) { return s.length > 0; });
    var poemSet = {};
    poemLines.forEach(function (s) { poemSet[s] = 1; });
    /* 正确答案：优先取该幕 line（画面正画的句子）；否则取本诗第一句像样的长句 */
    var correct = '';
    if (scLine && poemSet[scLine]) correct = scLine;
    else {
      for (j = 0; j < poemLines.length; j++) {
        if (poemLines[j].length >= 4) { correct = poemLines[j]; break; }
      }
      if (!correct) correct = poemLines[0];
    }
    /* 干扰句：诗库其他诗的句子，排除本诗全部句子与正确答案，去重后随机取 3 句 */
    var seen = {}, ds = [];
    shuffle(pool).forEach(function (s) {
      if (ds.length >= 3) return;
      if (s === correct || poemSet[s] || seen[s]) return;
      seen[s] = 1; ds.push(s);
    });
    if (ds.length < 3) return;
    var opts = shuffle([correct].concat(ds));
    out.push({
      q: '看这幅白板画，它画的是哪一句诗？',
      opts: opts, a: opts.indexOf(correct),
      exp: '《' + poem.title + '》·' + poem.author + '：' + poem.lines.join(''),
      wbName: e.key, wbFile: e.file, scene: scene,
      title: poem.title, author: poem.author
    });
  });
  return out;
}

/* ---------- 终帧挂载（engine.js renderQ 里调用） ---------- */
var loadedScripts = {};
function loadSeq(wbDir, list, cb) {
  var i = 0;
  (function next(ok) {
    if (!ok) return cb(false);
    if (i >= list.length) return cb(true);
    var src = wbDir + list[i++];
    if (loadedScripts[src]) return next(true);
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { loadedScripts[src] = 1; next(true); };
    s.onerror = function () { next(false); };
    document.head.appendChild(s);
  })(true);
}
var curPlayer = null;

/* 藏掉板顶的句字（scroll 模板把本幕 line 画在 y=70、字号 40 的一行，quiz 里留着等于泄题），
   以及圈字环（rough 椭圆组，包围盒约 124×124、中心 y≈58）；物件线稿全部保留。
   判据只认 scroll 模板的句字签名（y=70 且 size=40）与环的几何尺寸，不碰其他元素。 */
function hideCaption(svg) {
  if (!svg) return;
  var gs = svg.querySelectorAll('g'), i, g;
  for (i = 0; i < gs.length; i++) {
    g = gs[i];
    if (g.y === 70 && g.size === 40 && g.querySelector('text')) { g.style.display = 'none'; continue; }
    if (g.parentNode === svg) {
      try {
        var bb = g.getBBox();
        if (bb.width >= 110 && bb.width <= 140 && bb.height >= 110 && bb.height <= 140 &&
            Math.abs((bb.y + bb.height / 2) - 58) <= 22) g.style.display = 'none';
      } catch (e) { /* getBBox 不可用时跳过，不阻塞答题 */ }
    }
  }
}

function mountFrame(el, q, wbDir) {
  if (!el) return;
  if (!q || !q.wbName || !q.wbFile) {
    el.innerHTML = '<div class="qz-wb-load">（这道题没有配画）</div>';
    return;
  }
  if (curPlayer) { try { curPlayer.destroy(); } catch (e) {} curPlayer = null; }
  loadSeq(wbDir, ['rough.js', 'wb-engine.js', 'terms.js', 's/' + q.wbFile + '.js'], function (ok) {
    if (!document.body.contains(el)) return; /* 已切到下一题，丢弃 */
    if (!ok || !window.NHZWB || !window.NHZWB.has(q.wbName)) {
      el.innerHTML = '<div class="qz-wb-load">🎨 白板画加载失败，先看选项猜一猜吧～</div>';
      return;
    }
    var pl = window.NHZWB.mount(el, q.wbName);
    if (!pl) {
      el.innerHTML = '<div class="qz-wb-load">🎨 白板画加载失败，先看选项猜一猜吧～</div>';
      return;
    }
    curPlayer = pl;
    /* 定格画：去掉页签/播放条/字幕，禁点播，只留画板 */
    ['.wb-tabs', '.wb-ctl', '.wb-cap', '.wb-more'].forEach(function (sel) {
      var n = el.querySelector(sel);
      if (n) n.parentNode.removeChild(n);
    });
    if (pl.svg) pl.svg.style.pointerEvents = 'none';
    try {
      var durs = pl.durations();
      var d = durs[q.scene];
      if (typeof d === 'number') pl.seek(q.scene, d);
    } catch (e) { /* 终帧失败时留首帧画面，不阻塞答题 */ }
    hideCaption(pl.svg);
  });
}

window.NHZQuizHua = { buildQuestions: buildQuestions, mountFrame: mountFrame, stripLine: stripLine };
})();
