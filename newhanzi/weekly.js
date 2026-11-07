/* 家长周报：本地生成的一页汇总，只读现有学习记录，不写任何新键。
 * 取数口径（与页内文案一致）：
 *   本周 = 本地日期的周一~周日；本周学字 = nhz_learned 中首次学习日期落在本周的字；
 *   掌握率 = 已稳 ÷ 复习项总数（复习项 = nhz_srs 中的题；已稳 = iv>=5，见 SRS_MODEL_SPEC.md §3）；
 *   薄弱点 = nhz_wrong 按（来源 · 点）计数前 5；打卡 = nhz_checkin 落在本周的天数；
 *   星星 = nhz_stars 本周各日之和与累计总数；任务全完成 = nhz_task 本周三项全勾的天数。
 *   复习（A23 阶段三，2026-11-07 FUXI）= nhz_review_log（review-log.js 的 NHZReviewLog，复习页每复习一道记一笔）：
 *     本周复习道数 / 记得道数 / 复习天数、逐日条、连续复习天数（到今天，今天还没复习则到昨天）、与上周比；
 *     今日待复习 = NHZReviewToday()（与首页、复习页同口径）；未来 7 天到期 = nhz_srs 中 next 落在此后 7 天、且有题面的。
 * file:// 与 http:// 通用（纯 localStorage，无 fetch）。 */
(function () {
  'use strict';
  var app = document.getElementById('app');
  if (!app) return;

  function load(k, fb) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; }
    catch (e) { return fb; }
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return ('0' + n).slice(-2); }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtShort(ds) {
    var p = ds.split('-');
    return parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
  }
  function inWeek(ds, mon, sun) { return ds >= mon && ds <= sun; }

  var now = new Date();
  var day = (now.getDay() + 6) % 7; /* 周一=0 */
  var monD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  var sunD = new Date(monD.getFullYear(), monD.getMonth(), monD.getDate() + 6);
  var mon = fmt(monD), sun = fmt(sunD);

  var learned = load('nhz_learned', {});
  var weekChars = 0, totalChars = 0;
  /* 老数组格式没有学习日期：计入总数（与首页“已学”一致），不计入本周 */
  if (Array.isArray(learned)) {
    var l2 = {};
    learned.forEach(function (z) { l2[z] = 'legacy'; });
    learned = l2;
  }
  Object.keys(learned).forEach(function (z) {
    totalChars++;
    if (/^\d{4}-\d{2}-\d{2}$/.test(learned[z]) && inWeek(learned[z], mon, sun)) weekChars++;
  });

  var srs = load('nhz_srs', {});
  var steady = 0, learning = 0;
  Object.keys(srs).forEach(function (id) {
    if (srs[id] && srs[id].iv >= 5) steady++;
    else if (srs[id]) learning++;
  });
  var tracked = steady + learning;
  var rate = tracked ? Math.round(steady / tracked * 100) : null;

  var wrong = load('nhz_wrong', []);
  var weekWrong = 0;
  var byPoint = {};
  wrong.forEach(function (w) {
    if (w.addedAt && inWeek(fmt(new Date(w.addedAt)), mon, sun)) weekWrong++;
    var k = (w.src || '') + (w.point ? ' · ' + w.point : '');
    if (k) byPoint[k] = (byPoint[k] || 0) + 1;
  });
  var weak = Object.keys(byPoint).map(function (k) { return { k: k, n: byPoint[k] }; })
    .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);

  var ck = load('nhz_checkin', {});
  var weekCk = 0;
  Object.keys(ck).forEach(function (d) { if (inWeek(d, mon, sun)) weekCk++; });

  var stars = load('nhz_stars', {});
  var weekStars = 0;
  if (stars.days) Object.keys(stars.days).forEach(function (d) {
    if (inWeek(d, mon, sun)) {
      var dayStars = stars.days[d];
      Object.keys(dayStars).forEach(function (s) { weekStars += dayStars[s] || 0; });
    }
  });

  var task = load('nhz_task', {});
  var weekTaskFull = 0;
  Object.keys(task).forEach(function (d) {
    if (inWeek(d, mon, sun) && task[d].new && task[d].review && task[d].quiz) weekTaskFull++;
  });

  /* ---- 复习（nhz_review_log，只读） ---- */
  var RL = window.NHZReviewLog, rv = null;
  if (RL) {
    var wkDays = [], wkN = 0, wkOk = 0, wkActive = 0, lastN = 0, i;
    for (i = 0; i < 7; i++) {
      var dd = fmt(new Date(monD.getFullYear(), monD.getMonth(), monD.getDate() + i));
      var rec = RL.day(dd);
      wkDays.push({ d: dd, n: rec.n, ok: rec.ok, future: dd > fmt(now) });
      wkN += rec.n; wkOk += rec.ok; if (rec.n) wkActive++;
      lastN += RL.day(fmt(new Date(monD.getFullYear(), monD.getMonth(), monD.getDate() + i - 7))).n;
    }
    /* 连续复习天数：从今天往回数（今天还没复习就从昨天数） */
    var streak = 0, cur = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!RL.day(fmt(cur)).n) cur.setDate(cur.getDate() - 1);
    while (RL.day(fmt(cur)).n && streak < 400) { streak++; cur.setDate(cur.getDate() - 1); }
    /* 未来 7 天到期（有题面的才算，与复习页能回放的口径一致） */
    var faces = load('nhz_srs_face', {}), inWrong = {}, soon = 0, tNow = Date.now();
    wrong.forEach(function (w) { if (w && w.id) inWrong[w.id] = 1; });
    Object.keys(srs).forEach(function (id) {
      var s = srs[id];
      if (s && typeof s.next === 'number' && s.next > tNow && s.next <= tNow + 7 * 86400000 &&
          (inWrong[id] || (faces && faces[id]))) soon++;
    });
    rv = { days: wkDays, n: wkN, ok: wkOk, active: wkActive, lastN: lastN, streak: streak, soon: soon,
      today: window.NHZReviewToday ? window.NHZReviewToday() : null };
  }

  var h = '';
  h += '<section class="wk-section"><h2>📊 本周（' + esc(fmtShort(mon)) + ' ~ ' + esc(fmtShort(sun)) + '）</h2>';
  h += '<div class="wk-grid">' +
    '<div class="wk-cell"><b>' + weekChars + '</b><span>本周学字</span></div>' +
    '<div class="wk-cell"><b>' + weekCk + ' / 7</b><span>打卡天数</span></div>' +
    '<div class="wk-cell"><b>' + weekTaskFull + '</b><span>任务全完成天数</span></div>' +
    '<div class="wk-cell"><b>' + weekStars + '</b><span>本周星星（累计 ' + (stars.total || 0) + '）</span></div></div></section>';
  h += '<section class="wk-section"><h2>掌握情况</h2>' +
    '<p class="wk-p">已学字累计 ' + totalChars + ' 字。复习项共 ' + tracked + ' 道（已稳 ' + steady + ' · 学习中 ' + learning + '），' +
    (rate === null ? '暂无复习项，尚无掌握率。' : '掌握率 ' + rate + '%（已稳 ÷ 复习项总数）。') + '</p>' +
    '<p class="wk-p">错题本共 ' + wrong.length + ' 道，本周新增 ' + weekWrong + ' 道。</p></section>';
  if (rv) {
    var WD = ['一', '二', '三', '四', '五', '六', '日'], maxN = 1;
    rv.days.forEach(function (d) { if (d.n > maxN) maxN = d.n; });
    h += '<section class="wk-section" id="wkReview"><h2>🔁 复习</h2>';
    h += '<div class="wk-grid">' +
      '<div class="wk-cell"><b id="wkRvN">' + rv.n + '</b><span>本周复习道数</span></div>' +
      '<div class="wk-cell"><b>' + (rv.n ? Math.round(rv.ok / rv.n * 100) + '%' : '—') + '</b><span>记得 ' + rv.ok + ' 道（记得 ÷ 复习）</span></div>' +
      '<div class="wk-cell"><b id="wkRvDays">' + rv.active + ' / 7</b><span>复习天数</span></div>' +
      '<div class="wk-cell"><b id="wkRvStreak">' + rv.streak + '</b><span>连续复习天数</span></div></div>';
    h += '<div class="wk-bars">' + rv.days.map(function (d, k) {
      var hpx = d.n ? Math.max(6, Math.round(d.n / maxN * 64)) : 0;
      return '<div class="wk-bar' + (d.future ? ' future' : '') + '" title="' + esc(fmtShort(d.d)) + '：复习 ' + d.n + ' 道，记得 ' + d.ok + ' 道">' +
        '<em>' + (d.n || (d.future ? '' : '0')) + '</em><i style="height:' + hpx + 'px"></i><span>' + WD[k] + '</span></div>';
    }).join('') + '</div>';
    var cmp = rv.lastN ? '上周复习 ' + rv.lastN + ' 道。' : '上周没有复习记录。';
    var td = rv.today;
    h += '<p class="wk-p">' + cmp + (td ? '今天' + (td.total ? '还有 ' + td.total + ' 道待复习（到期 ' + td.due + ' · 错题回炉 ' + td.retry + '）' : '的复习已做完') + '，' : '') +
      '未来 7 天还有 ' + rv.soon + ' 道到期。</p>';
    if (!rv.n && !rv.lastN) h += '<p class="wk-p">复习记录从「今日复习」页开始累计：各区做错的题会自动排进复习，每天点开做一遍即可。</p>';
    h += '</section>';
  }
  h += '<section class="wk-section"><h2>薄弱点（错题最多前 5）</h2>';
  if (!weak.length) {
    h += '<p class="wk-p">暂无错题，继续保持！</p>';
  } else {
    h += '<div class="wk-weak">' + weak.map(function (w) {
      return '<div class="wk-row"><span>' + esc(w.k) + '</span><b>' + w.n + ' 道</b></div>';
    }).join('') + '</div>';
  }
  h += '</section>';
  h += '<p class="wk-note">本页数据全部来自本机学习记录，未上传任何信息。</p>';
  app.innerHTML = h;
})();
