/* 首页打卡与星星卡片。
 * 打卡按日期记（新键 nhz_checkin，{YYYY-MM-DD: true}），打卡本身不记星；
 * 星星来自任务/复习/测验完成（键 nhz_stars，helper 见 today-task.js）。
 * 本卡只读现有记录，不改已有面板与样式。file:// 与 http:// 通用。 */
(function () {
  'use strict';
  var box = document.getElementById('checkinCard');
  if (!box) return;
  var rowsEl = document.getElementById('ckRows');
  var KEY = 'nhz_checkin';

  function todayStr() {
    if (window.NHZStars) return window.NHZStars.today();
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function loadCk() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function saveCk(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function starsTotal() {
    if (window.NHZStars) return window.NHZStars.total();
    try { var v = JSON.parse(localStorage.getItem('nhz_stars') || 'null'); return (v && v.total) || 0; }
    catch (e) { return 0; }
  }
  function weekCount(ck) {
    var now = new Date();
    var day = (now.getDay() + 6) % 7; /* 周一=0 */
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    var n = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      var s = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      if (ck[s]) n++;
    }
    return n;
  }

  function render() {
    var t = todayStr();
    var ck = loadCk();
    var done = !!ck[t];
    rowsEl.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid var(--line)">' +
      '<span style="flex:1"><b style="font-size:15px">⭐ 星星</b> <span style="opacity:.75">共 ' + starsTotal() + ' 颗（任务 / 复习 / 测验完成得来，每日每种最多 1 颗）</span></span></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid var(--line)">' +
      '<span style="flex:1"><b style="font-size:15px">📅 打卡</b> <span style="opacity:.75">本周已打卡 ' + weekCount(ck) + ' 天</span></span>' +
      (done
        ? '<span style="color:var(--accent-deep);font-weight:bold">✅ 今日已打卡</span>'
        : '<button type="button" id="ckBtn" style="background:var(--accent-soft);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-size:15px;font-weight:bold;color:var(--ink);cursor:pointer">今日打卡</button>') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 2px">' +
      '<span style="flex:1"><b style="font-size:15px">📊 家长周报</b> <span style="opacity:.75">本周学习一页汇总</span></span>' +
      '<a href="weekly.html" style="color:var(--accent-deep);font-weight:bold;text-decoration:none">查看 →</a></div>';
    var btn = document.getElementById('ckBtn');
    if (btn) btn.addEventListener('click', function () {
      var d = loadCk();
      d[t] = true;
      saveCk(d);
      render();
    });
  }

  render();
})();
