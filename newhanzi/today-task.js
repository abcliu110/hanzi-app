/* 首页今日任务卡片（v3.0 清单型：行列式任务清单）。
 * 只读现有学习记录，不改任何已有面板与样式：
 *   今天新学读 nhz_learned（当日首次学习日期 = 今天的字数），
 *   今日复习数取 review-log.js 的 NHZReviewToday()（与复习页今日队列同口径：有题面的到期 + 错题回炉 − 今天已复习），
 *   测验入口链到 quiz/index.html?tab=zika（与识字面板现有入口一致）。
 * 打勾按日期存 nhz_task（新键，不碰 nhz_learned/nhz_srs/nhz_wrong/nhz_quiz_wrong），
 * 三项全勾即完成当日任务，记 1 颗星（每日任务星最多 1 颗，见 NHZStars）。
 * file:// 与 http:// 通用（纯 localStorage，无 fetch）。 */
(function () {
  'use strict';

  /* 星星（与 fuxi.js、quiz/engine.js 同款 helper，保持一致，勿单改一处）：
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

  var TASK_KEY = 'nhz_task';
  var box = document.getElementById('todayTask');
  if (!box) return;
  var rowsEl = document.getElementById('ttRows');
  var noteEl = document.getElementById('ttNote');

  function todayStr() { return window.NHZStars.today(); }
  function loadTask() {
    try { var v = JSON.parse(localStorage.getItem(TASK_KEY) || 'null'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function saveTask(d) { try { localStorage.setItem(TASK_KEY, JSON.stringify(d)); } catch (e) {} }
  function loadObj(k, fb) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; }
    catch (e) { return fb; }
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function counts() {
    var today = todayStr(), now = Date.now();
    var learned = loadObj('nhz_learned', {});
    var nToday = 0;
    Object.keys(learned).forEach(function (z) { if (learned[z] === today) nToday++; });
    /* 今日复习：与复习页今日队列同口径（review-log.js NHZReviewToday），无该脚本时退回旧口径 */
    if (window.NHZReviewToday) {
      var rt = window.NHZReviewToday();
      return { nToday: nToday, due: rt.total, dueN: rt.due, retryN: rt.retry, doneToday: rt.doneToday };
    }
    var srs = loadObj('nhz_srs', {});
    var due = 0;
    Object.keys(srs).forEach(function (id) { if (srs[id] && srs[id].next <= now) due++; });
    return { nToday: nToday, due: due, dueN: due, retryN: 0, doneToday: 0 };
  }

  function render() {
    var t = todayStr();
    var all = loadTask();
    var day = all[t] || {};
    var c = counts();
    /* 今天在复习页做过题且已清空今日复习：自动勾上「今日复习」（只勾不取消） */
    if (!day.review && c.doneToday > 0 && c.due === 0) {
      all[t] = day; day.review = true;
      if (day.new && day.quiz && !day._star && window.NHZStars.award('task')) day._star = 1;
      saveTask(all);
    }
    var items = [
      { k: 'new', label: '📖 今天新学', sub: '已学 ' + c.nToday + ' 字', go: '识字', act: 'goShizi' },
      { k: 'review', label: '🔁 今日复习', sub: c.due
          ? '有 ' + c.due + ' 道待复习（到期 ' + c.dueN + ' · 错题回炉 ' + c.retryN + '）' + (c.doneToday ? '，已复习 ' + c.doneToday + ' 道' : '')
          : (c.doneToday ? '今天已复习 ' + c.doneToday + ' 道，复习完成' : '今天没有要复习的题'),
        go: '去复习', href: 'fuxi.html' },
      { k: 'quiz', label: '🎮 测验', sub: '来一轮互动练习', href: 'quiz/index.html?tab=zika' }
    ];
    rowsEl.innerHTML = items.map(function (it) {
      var go = it.href
        ? '<a href="' + esc(it.href) + '" style="color:var(--accent-deep);font-weight:bold;text-decoration:none">' + esc(it.go || '去看看') + ' →</a>'
        : '<button type="button" data-go="' + (it.act || it.k) + '" style="background:none;border:none;color:var(--accent-deep);font-weight:bold;font-size:15px;cursor:pointer;padding:0">' + esc(it.go) + ' →</button>';
      return '<label style="display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid var(--line)">' +
        '<input type="checkbox" data-task="' + it.k + '"' + (day[it.k] ? ' checked' : '') + ' style="width:20px;height:20px;flex:none">' +
        '<span style="flex:1"><b style="font-size:15px">' + esc(it.label) + '</b> <span style="color:var(--ink);opacity:.75">' + esc(it.sub) + '</span></span>' +
        go + '</label>';
    }).join('');
    var done = items.filter(function (it) { return day[it.k]; }).length;
    var starNote = day._star ? ' ⭐ 今日任务完成，+1 颗星' : '';
    noteEl.textContent = '完成 ' + done + ' / ' + items.length + ' 项' + (done === items.length ? '，今日任务完成！' : '') + starNote;
  }

  rowsEl.addEventListener('change', function (e) {
    var cb = e.target.closest('[data-task]');
    if (!cb) return;
    var t = todayStr();
    var all = loadTask();
    /* 仅保留最近 31 天的打勾记录，避免无限膨胀 */
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 31);
    var cut = cutoff.getFullYear() + '-' + ('0' + (cutoff.getMonth() + 1)).slice(-2) + '-' + ('0' + cutoff.getDate()).slice(-2);
    Object.keys(all).forEach(function (d) { if (d < cut) delete all[d]; });
    all[t] = all[t] || {};
    all[t][cb.getAttribute('data-task')] = cb.checked;
    if (all[t].new && all[t].review && all[t].quiz && !all[t]._star) {
      if (window.NHZStars.award('task')) all[t]._star = 1;
    }
    saveTask(all);
    render();
  });

  rowsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (!b) return;
    if (b.getAttribute('data-go') === 'goShizi') {
      var panelBtn = document.querySelector('.panel[data-m="shizi"]');
      if (panelBtn) panelBtn.click();
    }
  });

  /* 回到首页时刷新计数（模块页内学习后不刷新页面也能看到最新数） */
  var homeView = document.getElementById('view-home');
  if (homeView && window.MutationObserver) {
    var lastVisible = homeView.style.display !== 'none';
    new MutationObserver(function () {
      var vis = homeView.style.display !== 'none';
      if (vis && !lastVisible) render();
      lastVisible = vis;
    }).observe(homeView, { attributes: true, attributeFilter: ['style'] });
  }

  render();
})();
