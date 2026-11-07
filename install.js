/* PWA 安装入口（首页）：浏览器安装提示处理 + iOS 手动添加到主屏幕说明。
 * 仅在可安装时出现，不常驻打扰：
 *   支持 beforeinstallprompt 的浏览器：捕获事件 → 显示“安装到主屏幕”条 →
 *     点[安装]调 prompt()，点[不用了]仅本会话关闭；
 *   iOS Safari（无 beforeinstallprompt）：显示手动说明（分享 → 添加到主屏幕），
 *     点[知道了]仅本会话关闭；
 *   已安装（standalone 显示模式或 navigator.standalone）或不支持时不显示。
 * file:// 下无 serviceWorker，beforeinstallprompt 不会触发，入口自然不出现。
 * 测试用覆盖：window.NHZ_INSTALL_TEST_IOS === true 时强制走 iOS 分支。
 * file:// 与 http:// 通用（纯 DOM，无 fetch）。 */
(function () {
  'use strict';
  var banner = null;
  var deferred = null;
  var DISMISS_KEY = 'nhz_install_dismissed'; /* sessionStorage：本会话内点过[不用了]/[知道了]后不再出现 */

  function dismissedThisSession() {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function dismissForSession() {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }
  /* 与 eye-care.js 的横幅共用同一排位：底部从 12px 起向上叠放，不重叠 */
  function restack() {
    var els = document.querySelectorAll('[data-nhz-banner]'), b = 12;
    Array.prototype.forEach.call(els, function (el) {
      el.style.bottom = b + 'px';
      b += el.offsetHeight + 8;
    });
  }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      !!window.navigator.standalone;
  }
  function isIOS() {
    if (window.NHZ_INSTALL_TEST_IOS) return true;
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }
  function hide() {
    if (banner) { banner.remove(); banner = null; restack(); }
  }
  function show(html) {
    if (banner || isStandalone() || dismissedThisSession()) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'status');
    banner.setAttribute('data-nhz-banner', 'install');
    banner.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:998;' +
      'background:var(--card);border:1px solid var(--line);border-radius:12px;' +
      'padding:12px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,.08)';
    banner.innerHTML = html;
    document.body.appendChild(banner);
    restack();
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    show('<span style="flex:1;font-size:15px">📲 把识字星球安装到主屏幕，打开更快，还能离线用。</span>' +
      '<button type="button" id="pwaInstall" style="background:var(--accent-soft);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-size:14px;font-weight:bold;color:var(--ink);cursor:pointer">安装</button>' +
      '<button type="button" id="pwaDismiss" style="background:none;border:none;padding:8px 4px;font-size:14px;color:var(--ink);opacity:.75;cursor:pointer">不用了</button>');
    var installBtn = document.getElementById('pwaInstall');
    var dismissBtn = document.getElementById('pwaDismiss');
    if (installBtn) installBtn.addEventListener('click', function () {
      if (!deferred) return;
      var d = deferred;
      deferred = null;
      if (d.prompt) d.prompt();
      hide();
    });
    if (dismissBtn) dismissBtn.addEventListener('click', function () { dismissForSession(); hide(); });
  });

  window.addEventListener('appinstalled', function () {
    deferred = null;
    hide();
  });

  if (isIOS() && !isStandalone()) {
    show('<span style="flex:1;font-size:15px">📲 iPhone 安装：点底部分享按钮 → “添加到主屏幕”，就能像 App 一样打开识字星球。</span>' +
      '<button type="button" id="pwaIosOk" style="background:var(--accent-soft);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font-size:14px;font-weight:bold;color:var(--ink);cursor:pointer">知道了</button>');
    var okBtn = document.getElementById('pwaIosOk');
    if (okBtn) okBtn.addEventListener('click', function () { dismissForSession(); hide(); });
  }
})();
