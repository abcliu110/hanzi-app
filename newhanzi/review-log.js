/* 复习记录与今日待复习计数（阶段三「每日复习接入」，2026-11-07 fuxi-loop）。
 *
 * 1) NHZReviewLog：复习页（fuxi.html）每复习一道记一笔，键 nhz_review_log：
 *      { days: { 'YYYY-MM-DD': { n: 复习道数, ok: 记得/答对道数, ids: { 题id: 1 } } } }
 *    ids 只保留当天（用于「今天已复习的题不再回到今日队列」），旧日只留 n/ok；保留最近 120 天。
 *    这是复习活动日志，不是掌握度：三态仍由 nhz_srs 派生（SRS_MODEL_SPEC.md §3），本键不参与三态。
 * 2) NHZReviewToday()：今日待复习数，口径与 fuxi.js 今日队列一致：
 *      到期 = nhz_srs 中 next<=now 且有题面（错题本 nhz_wrong 或题面库 nhz_srs_face）的；
 *      回炉 = 错题本中 iv=0 或尚无 srs、未到期的；两者都去掉今天已复习过的。
 *    首页（index.js / today-task.js）与复习页共用，保证首页数字 = 点进去看到的道数。
 * 纯 localStorage，file:// 与 http:// 通用。
 */
(function () {
  'use strict';
  var LK = 'nhz_review_log', KEEP_DAYS = 120;
  function load(k, fb) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; }
    catch (e) { return fb; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pad(n) { return ('0' + n).slice(-2); }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dayStr(new Date()); }
  function loadLog() {
    var v = load(LK, null);
    if (!v || typeof v !== 'object' || !v.days || typeof v.days !== 'object') v = { days: {} };
    return v;
  }
  function prune(log, t) {
    var cut = new Date();
    cut.setDate(cut.getDate() - KEEP_DAYS);
    var cs = dayStr(cut);
    Object.keys(log.days).forEach(function (d) {
      if (d < cs) { delete log.days[d]; return; }
      if (d !== t && log.days[d] && log.days[d].ids) delete log.days[d].ids;
    });
  }

  window.NHZReviewLog = window.NHZReviewLog || {
    today: today,
    /* 记一笔：同一题当天重复复习只计一次道数，记得与否以最后一次为准 */
    mark: function (id, ok) {
      if (!id) return;
      var log = loadLog(), t = today();
      prune(log, t);
      var d = log.days[t] || (log.days[t] = { n: 0, ok: 0, ids: {} });
      d.ids = d.ids || {};
      var prev = d.ids[id];
      if (!prev) { d.n++; if (ok) d.ok++; }
      else if (prev === 2 && !ok) d.ok = Math.max(0, d.ok - 1);
      else if (prev === 1 && ok) d.ok++;
      d.ids[id] = ok ? 2 : 1;
      save(LK, log);
    },
    doneToday: function () {
      var d = loadLog().days[today()];
      return (d && d.ids) ? d.ids : {};
    },
    /* 某天的 {n, ok}；无记录为 {n:0, ok:0} */
    day: function (ds) {
      var d = loadLog().days[ds];
      return { n: (d && d.n) || 0, ok: (d && d.ok) || 0 };
    },
    days: function () { return Object.keys(loadLog().days).sort(); }
  };

  window.NHZReviewToday = window.NHZReviewToday || function () {
    var wrong = load('nhz_wrong', []), srs = load('nhz_srs', {}), faces = load('nhz_srs_face', {});
    if (!Array.isArray(wrong)) wrong = [];
    if (!srs || typeof srs !== 'object') srs = {};
    if (!faces || typeof faces !== 'object') faces = {};
    var done = window.NHZReviewLog.doneToday(), now = Date.now();
    var inWrong = {}, due = 0, retry = 0, id;
    wrong.forEach(function (w) { if (w && w.id) inWrong[w.id] = 1; });
    var dueIds = {};
    for (id in srs) {
      if (!(srs[id] && typeof srs[id].next === 'number' && srs[id].next <= now)) continue;
      if (!inWrong[id] && !faces[id]) continue;
      dueIds[id] = 1;
      if (!done[id]) due++;
    }
    wrong.forEach(function (w) {
      if (!w || !w.id || dueIds[w.id] || done[w.id]) return;
      var s = srs[w.id];
      if (!s || s.iv === 0) retry++;
    });
    return { due: due, retry: retry, total: due + retry, doneToday: Object.keys(done).length };
  };
})();
