/* 界面层级导航核心（全站子页共用，不使用浏览器历史）。
 *
 * 子页用法：声明自己当前所在层级，例如
 *     NHZNavPage.set(['语法', '名词'], [showList, null]);   // 第 i 项 = 回到第 i 层的函数
 * 本文件负责：
 *   1. 把面包屑 postMessage 给首页（首页顶栏据此显示层级、决定「← 返回」是回上一级还是回首页）；
 *   2. 响应首页发来的 up / go 命令；
 *   3. 单独打开页面（不在首页 iframe 里）时，显示「← 返回上一层」：先回页内上一级，到最外层才跳到上级页面。
 * 页面若已自行定义 window.NHZNav（如古文），则沿用它，本文件只补命令监听和单独打开时的按钮。 */
(function () {
  var names = [], fns = [];
  var inFrame = window.self !== window.top;

  function notify() {
    if (inFrame) {
      try { window.parent.postMessage({ nhzNav: 1, page: location.pathname, crumbs: names.slice() }, '*'); } catch (e) {}
    }
    refreshBtn();
  }
  function api() {
    return window.NHZNav || {
      crumbs: function () { return names.slice(); },
      up: function () {
        if (names.length < 2) return false;
        var f = fns[names.length - 2];
        if (typeof f === 'function') { f(); return true; }
        return false;
      },
      go: function (i) {
        if (i < 0 || i >= names.length - 1) return false;
        var f = fns[i];
        if (typeof f === 'function') { f(); return true; }
        return false;
      }
    };
  }
  window.NHZNavPage = {
    set: function (n, f) { names = n || []; fns = f || []; notify(); },
    notify: notify
  };
  if (!window.NHZNav) window.NHZNav = api();

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.nhzCmd) return;
    var nav = window.NHZNav;
    if (!nav) return;
    if (d.nhzCmd === 'up') nav.up();
    else if (d.nhzCmd === 'go') nav.go(d.i || 0);
  });

  /* ---------- 单独打开页面时的「← 返回上一层」 ---------- */
  var btn = null;
  function parentUrl() {
    var p = location.pathname;
    if (p.indexOf('/games/shici/jichu/') >= 0) return '../../../shici.html';
    if (p.indexOf('/games/shici/') >= 0) return '../../shici.html';
    if (p.indexOf('/games/yufa/') >= 0) return '../../yuwen.html';
    if (p.indexOf('/games/luoji/') >= 0) return '../../yuwen.html';
    if (p.indexOf('/quiz/') >= 0) return '../index.html';
    return 'index.html';
  }
  function refreshBtn() { /* 层级变化不改变按钮文案；点击时再判断 */ }
  function onClick(ev) {
    var nav = window.NHZNav;
    if (nav && nav.crumbs && nav.crumbs().length > 1 && nav.up()) { ev.preventDefault(); return; }
    /* 最外层：按链接 href 跳到上级页面 */
  }
  function mount() {
    if (inFrame || btn || document.querySelector('[data-nav-up]')) return;
    var bar = document.querySelector('.topbar');
    if (bar) {
      var links = bar.querySelectorAll('a,button');
      for (var i = 0; i < links.length; i++) { if (/返回|←/.test(links[i].textContent || '')) return; }
    }
    if (!document.getElementById('nav-up-style')) {
      var st = document.createElement('style');
      st.id = 'nav-up-style';
      st.textContent =
        '[data-nav-up]{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;' +
        'border:1px solid rgba(128,128,128,.4);background:rgba(128,128,128,.12);color:inherit;' +
        'font:600 15px/1.2 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;text-decoration:none;white-space:nowrap;' +
        'cursor:pointer;transition:background .15s,border-color .15s;}' +
        '[data-nav-up]:hover{background:rgba(128,128,128,.22);border-color:rgba(128,128,128,.6);}' +
        '[data-nav-up]:focus-visible{outline:2px solid #4a7a59;outline-offset:2px;}' +
        '[data-nav-up].nav-up-float{position:fixed;left:14px;bottom:14px;z-index:50;' +
        'background:rgba(255,255,255,.7);color:#2c3328;border-color:#d5dfd0;box-shadow:0 2px 8px rgba(0,0,0,.08);}';
      document.head.appendChild(st);
    }
    btn = document.createElement('a');
    btn.setAttribute('data-nav-up', '1');
    btn.href = parentUrl();
    btn.textContent = '← 返回上一层';
    btn.addEventListener('click', onClick);
    if (bar) { btn.style.marginRight = '10px'; bar.insertBefore(btn, bar.firstChild); }
    else { btn.className = 'nav-up-float'; document.body.appendChild(btn); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
