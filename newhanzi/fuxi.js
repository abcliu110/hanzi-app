/* 复习页：今日复习（到期项，显示答案后点 记得/忘了）+ 错题本（已掌握清除）。
 * 数据键 nhz_wrong / nhz_srs，与语法 bank、古文 bank、quiz 的错题钩子共用。
 * 不用旧 app 的键（xzq_learned / hz_wrong / hz_srs）。无外部依赖，file:// 可用。
 */
(function () {
  'use strict';

  /* ---- 与各页错题钩子同款 helper（保持一致，勿单改一处） ---- */
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
    // correct=true：复习项答对 -> 推进间隔；correct=false：答错 -> 进错题本并安排明天复习
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
    // 复习页自评：记得 -> 推进间隔，忘了 -> 回到 1 天
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
    // 已掌握清除：错题本与复习安排一起清
    function clearWrong(id) {
      var wrong = load(WK, []), srs = load(SK, {}), nw = [];
      for (var i = 0; i < wrong.length; i++) if (wrong[i].id !== id) nw.push(wrong[i]);
      save(WK, nw);
      if (srs[id]) { delete srs[id]; save(SK, srs); }
    }
    // 新学"记得"：直接安排首次复习（默认 1 天后），不进错题本
    function schedule(id, ivIdx) {
      if (!id) return;
      var srs = load(SK, {}), now = Date.now();
      var iv = Math.max(0, Math.min(ivIdx || 0, IV.length - 1));
      srs[id] = { iv: iv, next: now + IV[iv] * 86400000 };
      save(SK, srs);
    }
    return { record: record, review: review, clearWrong: clearWrong, schedule: schedule, idOf: idOf,
      loadWrong: function () { return load(WK, []); },
      loadSrs: function () { return load(SK, {}); } };
  })();

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function optsHtml(w) {
    if (!w.options || !w.options.length) return '';
    return '<div class="fx-opts">' + w.options.map(function (o) {
      return '<span class="fx-opt' + (o === w.answer ? ' fx-right' : '') + '">' + esc(o) + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- 今日队列（阶段1效率引擎） ----------
   * 三段配比：A到期复习（逾期越久越优先）→ B错题回炉（未掌握先错先来）→ C新学配额（题库未见题）
   * 会话封顶 maxPerSession（默认25题≈10-15分钟）；复习段按 point 跨律交错打散。
   * 只改出题逻辑，不碰内容数据。
   */
  var QCFG_KEY = 'nhz_queue_cfg', QFRESH_KEY = 'nhz_queue_fresh';
  function loadQCfg() {
    var c = null;
    try { c = JSON.parse(localStorage.getItem(QCFG_KEY) || 'null'); } catch (e) {}
    return {
      newPerDay: (c && c.newPerDay != null) ? Math.max(0, Math.min(20, +c.newPerDay || 0)) : 5,
      maxPerSession: (c && c.maxPerSession) ? +c.maxPerSession : 25
    };
  }
  function saveQCfg(cfg) { try { localStorage.setItem(QCFG_KEY, JSON.stringify(cfg)); } catch (e) {} }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  /* 跨律交错：按 point/src 分组轮取，避免同一律连续出现 */
  function interleave(list) {
    var groups = {}, order = [];
    list.forEach(function (e) {
      var g = (e.it && (e.it.point || e.it.src)) || '?';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(e);
    });
    if (order.length <= 1) return list.slice();
    var out = [], more = true;
    while (more) {
      more = false;
      for (var i = 0; i < order.length; i++) {
        var g = groups[order[i]];
        if (g.length) { out.push(g.shift()); more = true; }
      }
    }
    return out;
  }
  function normalizeFresh(pool, q) {
    var opts = q.opts || [];
    return {
      q: q.q, options: opts.slice(), answer: opts[q.a],
      '解析': q.exp || '', src: pool.title || pool.tab || '',
      point: pool.title || pool.tab || ''
    };
  }
  /* C段：从题库抽未见过的新题；当日已抽的复用，避免每次渲染重抽 */
  function sampleFresh(n, seen) {
    if (n <= 0 || !window.NHZ_POOLS || !window.NHZ_POOLS.length) return [];
    try {
      var saved = JSON.parse(localStorage.getItem(QFRESH_KEY) || 'null');
      if (saved && saved.date === todayStr() && saved.items && saved.items.length) {
        var kept = saved.items.filter(function (it) { return !seen[window.NHZReview.idOf(it)]; });
        if (kept.length) return kept.slice(0, n);
      }
    } catch (e) {}
    var groups = {}, order = [];
    window.NHZ_POOLS.forEach(function (pool) {
      if (!pool || !pool.modes) return;
      var g = pool.tab || pool.title || '?';
      for (var mode in pool.modes) {
        (pool.modes[mode] || []).forEach(function (q) {
          if (!q || !q.q) return;
          var it = normalizeFresh(pool, q);
          var id = window.NHZReview.idOf(it);
          if (seen[id]) return;
          seen[id] = 1;
          if (!groups[g]) { groups[g] = []; order.push(g); }
          groups[g].push(it);
        });
      }
    });
    var out = [], more = true;
    while (more && out.length < n) {
      more = false;
      for (var i = 0; i < order.length && out.length < n; i++) {
        var arr = groups[order[i]];
        if (arr.length) { out.push(arr.shift()); more = true; }
      }
    }
    try { localStorage.setItem(QFRESH_KEY, JSON.stringify({ date: todayStr(), items: out })); } catch (e) {}
    return out;
  }
  function buildQueue() {
    var cfg = loadQCfg();
    var wrong = window.NHZReview.loadWrong();
    var srs = window.NHZReview.loadSrs();
    var now = Date.now();
    var byId = {};
    wrong.forEach(function (w) { byId[w.id] = w; });
    var seen = {};
    for (var id in byId) seen[id] = 1;
    for (var sid in srs) seen[sid] = 1;
    /* A段：到期复习，将忘优先（逾期毫秒数倒序） */
    var due = [];
    for (var did in srs) {
      if (srs[did].next <= now && byId[did]) {
        due.push({ it: byId[did], qid: did, seg: 'due', k: now - srs[did].next });
      }
    }
    due.sort(function (a, b) { return b.k - a.k; });
    /* B段：错题回炉（错题本中有但未到期），先错先来 */
    var retry = [];
    wrong.forEach(function (w) {
      var s = srs[w.id];
      if (!s || s.next > now) retry.push({ it: w, qid: w.id, seg: 'retry', k: w.addedAt || 0 });
    });
    retry.sort(function (a, b) { return a.k - b.k; });
    /* 复习预算 = 会话上限 - 新学配额；到期优先占位后交错 */
    var reviewBudget = Math.max(0, cfg.maxPerSession - cfg.newPerDay);
    var review = interleave(due.concat(retry).slice(0, reviewBudget));
    /* C段：新学配额 */
    var fresh = sampleFresh(Math.min(cfg.newPerDay, cfg.maxPerSession - review.length), seen)
      .map(function (it) { return { it: it, qid: window.NHZReview.idOf(it), seg: 'new' }; });
    return {
      list: review.concat(fresh),
      cfg: cfg,
      counts: { due: due.length, retry: retry.length, fresh: fresh.length }
    };
  }

  var app = document.getElementById('app');
  var lastNote = '';
  var queueIndex = {};

  var SEG_LABEL = { due: '到期复习', retry: '错题回炉', 'new': '新学' };

  function queueCardHtml(e) {
    var w = e.it, seg = e.seg;
    return '<div class="fx-card" data-seg="' + seg + '" data-qid="' + esc(e.qid) + '">' +
      '<div class="fx-src"><span class="fx-seg fx-seg-' + seg + '">' + SEG_LABEL[seg] + '</span>' +
      esc(w.src || '') + (w.point ? ' · ' + esc(w.point) : '') + '</div>' +
      '<p class="fx-q">' + esc(w.q) + '</p>' + optsHtml(w) +
      '<div class="fx-ans" hidden><p>答案：' + esc(w.answer) + '</p>' +
      (w['解析'] ? '<p>' + esc(w['解析']) + '</p>' : '') + '</div>' +
      '<button class="fx-btn" data-act="show">显示答案</button>' +
      '<span class="fx-grade" hidden><button class="fx-btn" data-act="remember">记得</button>' +
      '<button class="fx-btn" data-act="forget">忘了</button></span></div>';
  }

  function render() {
    var wrong = window.NHZReview.loadWrong();
    var srs = window.NHZReview.loadSrs();
    var now = Date.now();
    var built = buildQueue();
    var queue = built.list, cfg = built.cfg, counts = built.counts;
    queueIndex = {};
    queue.forEach(function (e) { queueIndex[e.qid] = e; });

    var h = '';
    h += '<section class="fx-section"><h2>今日队列' +
      (queue.length ? '（共' + queue.length + '道：到期' + counts.due + ' · 回炉' + counts.retry + ' · 新学' + counts.fresh + '）' : '') + '</h2>';
    h += '<div class="fx-cfg">每日新学 <input id="fxNew" type="number" min="0" max="20" value="' + cfg.newPerDay + '" style="width:52px"> 题' +
      '　单节上限 <select id="fxMax">' +
      [20, 25, 30].map(function (m) {
        return '<option value="' + m + '"' + (m === cfg.maxPerSession ? ' selected' : '') + '>' + m + '题</option>';
      }).join('') + '</select></div>';
    if (!queue.length) {
      h += '<p class="fx-empty">今天没有到期的复习，好好休息。</p>';
    } else {
      queue.forEach(function (e) { h += queueCardHtml(e); });
    }
    h += '</section>';
    h += '<section class="fx-section"><h2>错题本' + (wrong.length ? '（' + wrong.length + ' 道）' : '') + '</h2>';
    if (!wrong.length) {
      h += '<p class="fx-empty">错题本是空的，做错的题目会自动记到这里。</p>';
    } else {
      wrong.forEach(function (w) {
        var s = srs[w.id];
        h += '<div class="fx-card" data-wrong="' + esc(w.id) + '">' +
          '<div class="fx-src">' + esc(w.src) + ' · ' + esc(w.point) +
          (s ? ' · 下次复习：' + fmtDate(s.next) : '') + '</div>' +
          '<p class="fx-q">' + esc(w.q) + '</p>' + optsHtml(w) +
          '<p>答案：' + esc(w.answer) + '</p>' +
          (w['解析'] ? '<p>' + esc(w['解析']) + '</p>' : '') +
          '<button class="fx-btn" data-act="clear">已掌握，清除</button></div>';
      });
    }
    h += '</section>';
    h += '<p class="fx-note" id="fxNote">' + esc(lastNote) + '</p>';
    app.innerHTML = h;
  }

  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'fxNew' || t.id === 'fxMax') {
      var cfg = loadQCfg();
      if (t.id === 'fxNew') cfg.newPerDay = Math.max(0, Math.min(20, +t.value || 0));
      else cfg.maxPerSession = +t.value || 25;
      saveQCfg(cfg);
      /* 新学配额变化时清掉当日已抽新题，重新按配额抽 */
      if (t.id === 'fxNew') { try { localStorage.removeItem(QFRESH_KEY); } catch (err) {} }
      render();
    }
  });

  app.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    var card = btn.closest('.fx-card');
    if (act === 'show') {
      card.querySelector('.fx-ans').hidden = false;
      btn.hidden = true;
      card.querySelector('.fx-grade').hidden = false;
    } else if (act === 'remember' || act === 'forget') {
      var seg = card.getAttribute('data-seg');
      var qid = card.getAttribute('data-qid');
      var remembered = act === 'remember';
      var entry = queueIndex[qid];
      if (seg === 'due') {
        /* 到期复习：记得推进间隔，忘了回到 1 天 */
        window.NHZReview.review(qid, remembered);
        var s = window.NHZReview.loadSrs()[qid];
        lastNote = s ? (remembered ? '记得！下次复习：' + fmtDate(s.next) + '。'
          : '忘了也没关系，下次复习：' + fmtDate(s.next) + '。') : '已记录。';
      } else if (seg === 'retry') {
        /* 错题回炉：记得=已掌握清除，忘了=重新安排明天 */
        if (remembered) {
          window.NHZReview.clearWrong(qid);
          lastNote = '已掌握，从错题本清除。';
        } else if (entry) {
          window.NHZReview.record(entry.it, false);
          lastNote = '明天再复习这道。';
        }
      } else if (seg === 'new') {
        /* 新学：记得=安排首次复习，忘了=记入错题本 */
        if (remembered) {
          window.NHZReview.schedule(qid, 0);
          lastNote = '新知识已学，明天第一次复习。';
        } else if (entry) {
          window.NHZReview.record(entry.it, false);
          lastNote = '已记入错题本，明天复习。';
        }
      }
      render();
    } else if (act === 'clear') {
      window.NHZReview.clearWrong(card.getAttribute('data-wrong'));
      lastNote = '已从错题本清除。';
      render();
    }
  });

  render();
})();
