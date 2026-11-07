/* 复习页：今日复习（到期项，显示答案后点 记得/忘了）+ 错题本（已掌握清除）。
 * 数据键 nhz_wrong / nhz_srs，与语法 bank、古文 bank、quiz 的错题钩子共用。
 * 不用旧 app 的键（xzq_learned / hz_wrong / hz_srs）。无外部依赖，file:// 可用。
 */
(function () {
  'use strict';

  /* ---- 与各页错题钩子同款 helper（保持一致，勿单改一处） ---- */
  window.NHZReview = window.NHZReview || (function () {
    var WK = 'nhz_wrong', SK = 'nhz_srs', FK = 'nhz_srs_face';
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
    // 已掌握清除：错题本、题面库与复习安排一起清
    function clearWrong(id) {
      var wrong = load(WK, []), srs = load(SK, {}), faces = load(FK, {}), nw = [];
      for (var i = 0; i < wrong.length; i++) if (wrong[i].id !== id) nw.push(wrong[i]);
      save(WK, nw);
      if (srs[id]) { delete srs[id]; save(SK, srs); }
      if (faces[id]) { delete faces[id]; save(FK, faces); }
    }
    // 新学"记得"：安排首次复习，并写入题面库（到期时靠题面库回放，不进错题本）
    function schedule(id, ivIdx, it) {
      if (!id) return;
      var srs = load(SK, {}), now = Date.now();
      var iv = Math.max(0, Math.min(ivIdx == null ? 0 : ivIdx, IV.length - 1));
      srs[id] = { iv: iv, next: now + IV[iv] * 86400000 };
      save(SK, srs);
      if (it && it.q) {
        var faces = load(FK, {});
        faces[id] = {
          id: id, q: it.q, options: it.options || [], answer: it.answer,
          解析: it['解析'] || '', src: it.src || '', point: it.point || ''
        };
        save(FK, faces);
      }
    }
    function faceOf(id) {
      var wrong = load(WK, []);
      for (var i = 0; i < wrong.length; i++) if (wrong[i].id === id) return wrong[i];
      return load(FK, {})[id] || null;
    }
    /* ---- SRS模型§3：三态派生视图（只读，不新增存储） ----
     * 未学：id ∉ nhz_srs
     * 学习中：srs[id].iv < 5
     * 已稳：srs[id].iv >= 5（IV.length - 1，30天档）
     */
    function stateOf(id) {
      var srs = load(SK, {});
      if (!srs[id]) return '未学';
      return srs[id].iv >= IV.length - 1 ? '已稳' : '学习中';
    }
    /* ---- SRS模型§8：阶段1效率引擎只读查询接口 ----
     * dueItems(now)：srs中 next <= now 的，按 (now - next) 降序（将忘/已忘优先）
     */
    function dueItems(now) {
      var srs = load(SK, {}), t = now == null ? Date.now() : now, out = [];
      for (var id in srs) {
        if (srs[id] && srs[id].next <= t) {
          out.push({ id: id, iv: srs[id].iv, next: srs[id].next });
        }
      }
      out.sort(function (a, b) { return (t - b.next) - (t - a.next); });
      return out;
    }
    /* wrongItems()：nhz_wrong中 iv=0 或不在srs的（错题回炉候选） */
    function wrongItems() {
      var wrong = load(WK, []), srs = load(SK, {}), out = [];
      for (var i = 0; i < wrong.length; i++) {
        var id = wrong[i].id;
        if (!srs[id] || srs[id].iv === 0) out.push(wrong[i]);
      }
      return out;
    }
    return { record: record, review: review, clearWrong: clearWrong, schedule: schedule, idOf: idOf,
      stateOf: stateOf, dueItems: dueItems, wrongItems: wrongItems, faceOf: faceOf,
      loadWrong: function () { return load(WK, []); },
      loadSrs: function () { return load(SK, {}); } };
  })();

  /* 星星（与 today-task.js、quiz/engine.js 同款 helper，保持一致，勿单改一处）：
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

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function optsHtml(w, revealed) {
    if (!w.options || !w.options.length) return '';
    return '<div class="fx-opts">' + w.options.map(function (o) {
      return '<span class="fx-opt' + (revealed && o === w.answer ? ' fx-right' : '') + '">' + esc(o) + '</span>';
    }).join('') + '</div>';
  }
  /* 新学只抽选择题：须有 opts 数组 + 数字下标答案 */
  function isChoiceQ(q) {
    return !!(q && q.q && Array.isArray(q.opts) && q.opts.length &&
      typeof q.a === 'number' && q.a >= 0 && q.a < q.opts.length && q.opts[q.a] != null);
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
  /* C段：从题库抽未见过的选择题；当日已抽的复用，避免每次渲染重抽 */
  function sampleFresh(n, seen) {
    if (n <= 0 || !window.NHZ_POOLS || !window.NHZ_POOLS.length) return [];
    try {
      var saved = JSON.parse(localStorage.getItem(QFRESH_KEY) || 'null');
      if (saved && saved.date === todayStr() && saved.items && saved.items.length) {
        var kept = saved.items.filter(function (it) {
          return it && it.options && it.options.length && it.answer != null && !seen[window.NHZReview.idOf(it)];
        });
        if (kept.length) return kept.slice(0, n);
      }
    } catch (e) {}
    var groups = {}, order = [];
    window.NHZ_POOLS.forEach(function (pool) {
      if (!pool || !pool.modes) return;
      var g = pool.tab || pool.title || '?';
      for (var mode in pool.modes) {
        (pool.modes[mode] || []).forEach(function (q) {
          if (!isChoiceQ(q)) return;
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
    var seen = {};
    /* 今天已在复习页做过的题不再回到今日队列（忘了的题明天再来；见 review-log.js） */
    var done = window.NHZReviewLog ? window.NHZReviewLog.doneToday() : {};
    wrong.forEach(function (w) { seen[w.id] = 1; });
    for (var sid in srs) seen[sid] = 1;
    for (var dn in done) seen[dn] = 1;
    /* A段：到期复习（错题本或题面库均可回放），将忘优先 */
    var due = [];
    for (var did in srs) {
      if (!(srs[did] && srs[did].next <= now)) continue;
      if (done[did]) continue;
      var face = window.NHZReview.faceOf(did);
      if (face) due.push({ it: face, qid: did, seg: 'due', k: now - srs[did].next });
    }
    due.sort(function (a, b) { return b.k - a.k; });
    var dueIds = {};
    due.forEach(function (e) { dueIds[e.qid] = 1; });
    /* B段：错题回炉——仅 iv=0 或尚无 srs 的未到期错题（已推进间隔的勿再塞回炉） */
    var retry = [];
    wrong.forEach(function (w) {
      if (dueIds[w.id] || done[w.id]) return;
      var s = srs[w.id];
      if (!s || s.iv === 0) retry.push({ it: w, qid: w.id, seg: 'retry', k: w.addedAt || 0 });
    });
    retry.sort(function (a, b) { return a.k - b.k; });
    /* 复习预算 = 会话上限 - 新学配额；到期优先占位后交错。
       计数以实际排入本节的为准（旧代码用排队前总数，超上限时标题数与实际卡数对不上）。 */
    var reviewBudget = Math.max(0, cfg.maxPerSession - cfg.newPerDay);
    var review = interleave(due.concat(retry).slice(0, reviewBudget));
    /* C段：新学配额 */
    var fresh = sampleFresh(Math.min(cfg.newPerDay, cfg.maxPerSession - review.length), seen)
      .map(function (it) { return { it: it, qid: window.NHZReview.idOf(it), seg: 'new' }; });
    var nDue = 0, nRetry = 0;
    review.forEach(function (e) { if (e.seg === 'due') nDue++; else if (e.seg === 'retry') nRetry++; });
    return {
      list: review.concat(fresh),
      cfg: cfg,
      counts: { due: nDue, retry: nRetry, fresh: fresh.length,
        more: (due.length + retry.length) - review.length }
    };
  }

  var app = document.getElementById('app');
  var lastNote = '';
  var queueIndex = {};
  var wrongFilter = '';

  var SEG_LABEL = { due: '到期复习', retry: '错题回炉', 'new': '新学' };

  /* 有 2 个以上选项且答案在选项里：直接点选作答（提取练习），否则「显示答案→记得/忘了」自评 */
  function canPick(w) {
    return !!(w && w.options && w.options.length >= 2 && w.options.indexOf(w.answer) >= 0);
  }
  function queueCardHtml(e) {
    var w = e.it, seg = e.seg, pick = canPick(w);
    var opts = '';
    if (pick) {
      opts = '<div class="fx-opts">' + w.options.map(function (o, i) {
        return '<button type="button" class="fx-opt fx-pick" data-act="pick" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else {
      opts = optsHtml(w, false);
    }
    return '<div class="fx-card" data-seg="' + seg + '" data-qid="' + esc(e.qid) + '">' +
      '<div class="fx-src"><span class="fx-seg fx-seg-' + seg + '">' + SEG_LABEL[seg] + '</span>' +
      esc(w.src || '') + (w.point ? ' · ' + esc(w.point) : '') + '</div>' +
      '<p class="fx-q">' + esc(w.q) + '</p>' + opts +
      (pick ? '<p class="fx-hint">先想一想，再点你选的答案。</p>' : '<p class="fx-hint">先在心里（或纸上）答出来，再看答案。</p>') +
      '<div class="fx-ans" hidden><p>答案：' + esc(w.answer) + '</p>' +
      (w['解析'] ? '<p>' + esc(w['解析']) + '</p>' : '') + '</div>' +
      (pick ? '' : '<button class="fx-btn" data-act="show">显示答案</button>') +
      '<span class="fx-grade" hidden><button class="fx-btn" data-act="remember">记得</button>' +
      '<button class="fx-btn" data-act="forget">忘了</button></span>' +
      '<p class="fx-res" hidden></p></div>';
  }

  function headText() {
    var left = document.querySelectorAll('.fx-qcard:not(.fx-done)').length;
    var c = window.NHZReviewToday ? window.NHZReviewToday() : null;
    var doneN = c ? c.doneToday : 0;
    if (!document.querySelectorAll('.fx-qcard').length) {
      return doneN ? '今天已复习 ' + doneN + ' 道，今日复习完成 🎉' : '';
    }
    return left ? '本节还剩 ' + left + ' 道' + (doneN ? ' · 今天已复习 ' + doneN + ' 道' : '')
      : '本节做完了！今天已复习 ' + doneN + ' 道 🎉';
  }
  function updateHead() {
    var el = document.getElementById('fxHead');
    if (el) el.textContent = headText();
    var note = document.getElementById('fxNote');
    if (note) note.textContent = lastNote;
  }

  function srcOf(w) { return w.src || '其他'; }

  function render() {
    var wrong = window.NHZReview.loadWrong();
    var srs = window.NHZReview.loadSrs();
    var built = buildQueue();
    var queue = built.list, cfg = built.cfg, counts = built.counts;
    queueIndex = {};
    queue.forEach(function (e) { queueIndex[e.qid] = e; });

    var h = '';
    h += '<section class="fx-section"><h2>今日复习' +
      (queue.length ? '（共' + queue.length + '道：到期' + counts.due + ' · 回炉' + counts.retry + ' · 新学' + counts.fresh +
        (counts.more > 0 ? ' · 另有' + counts.more + '道超出本节上限' : '') + '）' : '') + '</h2>';
    h += '<p class="fx-head" id="fxHead"></p>';
    h += '<div class="fx-cfg">每日新学 <input id="fxNew" type="number" min="0" max="20" value="' + cfg.newPerDay + '" style="width:52px"> 题' +
      '　单节上限 <select id="fxMax">' +
      [20, 25, 30].map(function (m) {
        return '<option value="' + m + '"' + (m === cfg.maxPerSession ? ' selected' : '') + '>' + m + '题</option>';
      }).join('') + '</select></div>';
    if (!queue.length) {
      h += '<p class="fx-empty">今天没有要复习的题了，好好休息。各区练习做错的题会自动排进这里。</p>';
    } else {
      queue.forEach(function (e) { h += queueCardHtml(e).replace('class="fx-card"', 'class="fx-card fx-qcard"'); });
    }
    h += '</section>';

    /* 错题本：按来源分组筛选，默认收起，避免一长串 */
    var bySrc = {}, srcOrder = [];
    wrong.forEach(function (w) {
      var k = srcOf(w);
      if (!bySrc[k]) { bySrc[k] = 0; srcOrder.push(k); }
      bySrc[k]++;
    });
    if (wrongFilter && !bySrc[wrongFilter]) wrongFilter = '';
    h += '<section class="fx-section"><details class="fx-wb"' + (wrongFilter ? ' open' : '') + '><summary><h2>错题本' +
      (wrong.length ? '（' + wrong.length + ' 道）' : '') + '</h2></summary>';
    if (!wrong.length) {
      h += '<p class="fx-empty">错题本是空的，做错的题目会自动记到这里。</p>';
    } else {
      if (srcOrder.length > 1) {
        h += '<div class="fx-chips"><button type="button" class="fx-chip' + (wrongFilter ? '' : ' on') + '" data-act="filter" data-src="">全部 ' + wrong.length + '</button>' +
          srcOrder.map(function (k) {
            return '<button type="button" class="fx-chip' + (wrongFilter === k ? ' on' : '') + '" data-act="filter" data-src="' + esc(k) + '">' + esc(k) + ' ' + bySrc[k] + '</button>';
          }).join('') + '</div>';
      }
      wrong.forEach(function (w) {
        if (wrongFilter && srcOf(w) !== wrongFilter) return;
        var s = srs[w.id];
        h += '<div class="fx-card" data-wrong="' + esc(w.id) + '">' +
          '<div class="fx-src">' + esc(w.src) + (w.point ? ' · ' + esc(w.point) : '') +
          (s ? ' · 下次复习：' + fmtDate(s.next) : '') + '</div>' +
          '<p class="fx-q">' + esc(w.q) + '</p>' + optsHtml(w, true) +
          '<p>答案：' + esc(w.answer) + '</p>' +
          (w['解析'] ? '<p>' + esc(w['解析']) + '</p>' : '') +
          '<button class="fx-btn" data-act="clear">已掌握，清除</button></div>';
      });
    }
    h += '</details></section>';
    h += '<p class="fx-note" id="fxNote"></p>';
    app.innerHTML = h;
    updateHead();
  }

  /* 一道题答完：回写复习安排 + 记复习日志，卡片原地变成「已复习」并显示答案，不整页重排 */
  function grade(card, remembered) {
    var seg = card.getAttribute('data-seg');
    var qid = card.getAttribute('data-qid');
    var entry = queueIndex[qid];
    if (card.classList.contains('fx-done')) return;
    if (seg === 'due') {
      /* 到期复习：记得推进间隔，忘了回到 1 天 */
      window.NHZReview.review(qid, remembered);
      if (!remembered && entry) window.NHZReview.record(entry.it, false);
      var s = window.NHZReview.loadSrs()[qid];
      lastNote = s ? (remembered ? '记得！下次复习：' + fmtDate(s.next) + '。'
        : '忘了也没关系，下次复习：' + fmtDate(s.next) + '。') : '已记录。';
    } else if (seg === 'retry') {
      /* 错题回炉：记得=推进间隔（勿清进度），忘了=重新安排明天；清除留给「已掌握」按钮 */
      if (remembered) {
        if (!window.NHZReview.loadSrs()[qid] && entry) window.NHZReview.record(entry.it, false);
        window.NHZReview.review(qid, true);
        var sr = window.NHZReview.loadSrs()[qid];
        lastNote = sr ? '记得！下次复习：' + fmtDate(sr.next) + '。' : '已记录。';
      } else if (entry) {
        window.NHZReview.record(entry.it, false);
        lastNote = '明天再复习这道。';
      }
    } else if (seg === 'new') {
      /* 新学：记得=安排首次复习（写题面库），忘了=记入错题本 */
      if (remembered) {
        window.NHZReview.schedule(qid, 0, entry && entry.it);
        lastNote = '新知识已学，明天第一次复习。';
      } else if (entry) {
        window.NHZReview.record(entry.it, false);
        lastNote = '已记入错题本，明天复习。';
      }
    }
    if (window.NHZReviewLog) window.NHZReviewLog.mark(qid, remembered);
    card.classList.add('fx-done');
    var ans = card.querySelector('.fx-ans'); if (ans) ans.hidden = false;
    var sh = card.querySelector('[data-act="show"]'); if (sh) sh.hidden = true;
    var gr = card.querySelector('.fx-grade'); if (gr) gr.hidden = true;
    var hint = card.querySelector('.fx-hint'); if (hint) hint.hidden = true;
    var res = card.querySelector('.fx-res');
    if (res) { res.hidden = false; res.textContent = (remembered ? '✅ ' : '🔁 ') + lastNote; }
    updateHead();
    /* 复习完成记星：刚答的是到期/回炉卡，且本节已无未做的到期/回炉卡（每日最多 1 颗） */
    if ((seg === 'due' || seg === 'retry') &&
        !document.querySelector('.fx-qcard[data-seg="due"]:not(.fx-done), .fx-qcard[data-seg="retry"]:not(.fx-done)')) {
      if (window.NHZStars && window.NHZStars.award('review')) {
        lastNote += ' ⭐ 今天的复习做完了，+1 颗星！';
        updateHead();
      }
    }
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
      /* 揭晓后再标正确选项，避免未回忆就看见答案 */
      var entryShow = queueIndex[card.getAttribute('data-qid')];
      if (entryShow && entryShow.it && entryShow.it.answer != null) {
        var opts = card.querySelectorAll('.fx-opt');
        for (var oi = 0; oi < opts.length; oi++) {
          if (opts[oi].textContent === entryShow.it.answer) opts[oi].classList.add('fx-right');
        }
      }
    } else if (act === 'pick') {
      if (card.classList.contains('fx-done')) return;
      var en = queueIndex[card.getAttribute('data-qid')];
      if (!en) return;
      var picked = en.it.options[+btn.getAttribute('data-i')];
      var ok = picked === en.it.answer;
      var ps = card.querySelectorAll('.fx-pick');
      for (var pi = 0; pi < ps.length; pi++) {
        ps[pi].disabled = true;
        if (en.it.options[pi] === en.it.answer) ps[pi].classList.add('fx-right');
      }
      if (!ok) btn.classList.add('fx-wrong');
      grade(card, ok);
    } else if (act === 'remember' || act === 'forget') {
      grade(card, act === 'remember');
    } else if (act === 'filter') {
      wrongFilter = btn.getAttribute('data-src') || '';
      render();
      var d = app.querySelector('.fx-wb'); if (d) d.open = true;
    } else if (act === 'clear') {
      window.NHZReview.clearWrong(card.getAttribute('data-wrong'));
      lastNote = '已从错题本清除。';
      render();
      var d2 = app.querySelector('.fx-wb'); if (d2) d2.open = true;
    }
  });

  render();
})();
