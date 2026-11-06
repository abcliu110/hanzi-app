/* 拼音区：菜单 → 知识点详情。导航只用界面层级（FRONTEND_UI.md §7），不用浏览器历史。 */
(function () {
  var MENU = window.NHZ_PINYIN_MENU || [];
  var home = document.getElementById('pyHome');
  var detail = document.getElementById('pyDetail');
  var grid = document.getElementById('pyGrid');

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function chips(list) {
    return '<div class="py-row">' + list.map(function (c) {
      var a = Array.isArray(c) ? c : [c];
      return '<span class="py-chip">' + esc(a[0]) + (a[1] ? '<small>' + esc(a[1]) + '</small>' : '') + '</span>';
    }).join('') + '</div>';
  }

  grid.innerHTML = MENU.map(function (m) {
    return '<button type="button" class="py-card" data-id="' + esc(m.id) + '">' +
      '<span class="lv">' + esc(m.lv) + '</span>' +
      '<span class="no">' + m.no + '</span><b>' + esc(m.name) + '</b>' +
      '<div class="ex">' + esc(m.ex) + '</div>' +
      '<div class="ds">' + esc(m.ds) + '</div></button>';
  }).join('');

  function showHome() {
    detail.style.display = 'none';
    home.style.display = '';
    window.scrollTo(0, 0);
    if (window.NHZNavPage) NHZNavPage.set(['拼音'], []);
  }

  function showDetail(id) {
    var m = MENU.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var h = '';
    (m.secs || []).forEach(function (s) {
      h += '<div class="py-sec"><h3>' + esc(s.h) + '</h3>';
      if (s.chips) h += chips(s.chips);
      if (s.groups) s.groups.forEach(function (g) { h += '<div class="py-grp">' + esc(g[0]) + '</div>' + chips(g[1]); });
      (s.p || []).forEach(function (t) { h += '<p>' + esc(t) + '</p>'; });
      if (s.note) h += '<p class="note">' + esc(s.note) + '</p>';
      h += '</div>';
    });
    if (m.todo) h += '<div class="py-todo">' + esc(m.todo) + '</div>';
    detail.innerHTML = h;
    home.style.display = 'none';
    detail.style.display = '';
    window.scrollTo(0, 0);
    if (window.NHZNavPage) NHZNavPage.set(['拼音', m.name], [showHome, null]);
  }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.py-card') : null;
    if (b) showDetail(b.getAttribute('data-id'));
  });

  var q = /[?&]t=(\w+)/.exec(location.search);
  if (q) showDetail(q[1]); else showHome();
})();
