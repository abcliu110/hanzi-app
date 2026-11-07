/* 首页「逻辑一分钟」卡片（A22-8）：只读 localStorage nhz_logic_daily（games/luoji/daily.html 写入），
 * 不加载题池，首页不多拉数据。显示今天做没做、对没对，点击进每日一句页。 */
(function () {
  'use strict';
  var st = document.getElementById('ldStatus');
  if (!st) return;
  function pad(n) { return ('0' + n).slice(-2); }
  function render() {
    var d = new Date(), ds = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), rec = null;
    try { rec = (JSON.parse(localStorage.getItem('nhz_logic_daily') || 'null') || {})[ds] || null; } catch (e) {}
    st.textContent = !rec ? '今天的一句还没做，三选一找毛病，一分钟就好'
      : rec.ok ? '✅ 今天这句答对了，明天换新的一句'
      : '❌ 今天这句答错了，已进错题本';
  }
  render();
  window.addEventListener('pageshow', render);
  var home = document.getElementById('view-home');
  if (home && window.MutationObserver) {
    new MutationObserver(function () { if (home.style.display !== 'none') render(); })
      .observe(home, { attributes: true, attributeFilter: ['style'] });
  }
})();
