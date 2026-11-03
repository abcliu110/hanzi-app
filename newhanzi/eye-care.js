/* 护眼提醒（首页版）：用眼时长提醒 + 休息提醒，非侵入式，可关闭。
 * 规则：本页持续使用满 20 分钟（切后台/切标签页时暂停计时），
 *   在页面底部弹一条不拦截操作的小横幅，提醒看看远处、眨眨眼；
 *   [知道了] 仅关闭本次，20 分钟后若仍在使用再提醒；
 *   [今日不再提醒] 则当天不再弹出（记入 nhz_eye，次日自动恢复）。
 * 本页为单页应用宿主（模块页切换不刷新），计时覆盖首页与内置面板；
 *   iframe 子页（语法/古文等）各有独立文档，本版暂不重复挂提醒，避免多处叠弹。
 * 存储：仅 nhz_eye = {muted: 'YYYY-MM-DD'} 一个键；累计分钟仅内存，不落盘。
 * 测试用覆盖（生产默认 60 秒 tick / 20 分钟提醒）：window.NHZ_EYE_TICK_MS / window.NHZ_EYE_MINUTES。
 * file:// 与 http:// 通用（纯 DOM + localStorage，无 fetch）。 */
(function () {
  'use strict';
  var KEY = 'nhz_eye';
  var TICK_MS = window.NHZ_EYE_TICK_MS || 60000;
  var LIMIT_MIN = window.NHZ_EYE_MINUTES || 20;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  if (load().muted === todayStr()) return; /* 今日已选不再提醒 */

  var minutes = 0;
  var banner = null;

  function show() {
    if (banner) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'status');
    banner.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:999;' +
      'background:var(--card);border:1px solid var(--line);border-radius:12px;' +
      'padding:12px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,.08)';
    banner.innerHTML =
      '<span style="flex:1;font-size:15px">👀 用眼 ' + LIMIT_MIN + ' 分钟了，休息一下眼睛吧——看看远处，眨眨眼，放松一会儿。</span>' +
      '<button type="button" id="eyeOk" style="background:var(--accent-soft);border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:14px;font-weight:bold;color:var(--ink);cursor:pointer">知道了</button>' +
      '<button type="button" id="eyeMute" style="background:none;border:none;padding:8px 4px;font-size:14px;color:var(--ink);opacity:.75;cursor:pointer;text-decoration:underline">今日不再提醒</button>';
    document.body.appendChild(banner);
    document.getElementById('eyeOk').addEventListener('click', function () {
      banner.remove();
      banner = null;
      minutes = 0; /* 仅关闭本次，下个 20 分钟块再提醒 */
    });
    document.getElementById('eyeMute').addEventListener('click', function () {
      var d = load();
      d.muted = todayStr();
      save(d);
      banner.remove();
      banner = null;
      clearInterval(timer); /* 当天不再提醒：停掉计时，避免下一 tick 又弹 */
    });
  }

  var timer = setInterval(function () {
    if (document.hidden) return; /* 切后台不计时 */
    if (banner) return; /* 已弹出时不再重复计时 */
    minutes += TICK_MS / 60000;
    if (minutes >= LIMIT_MIN) show();
  }, TICK_MS);
})();
