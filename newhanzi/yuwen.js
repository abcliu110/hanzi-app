/* newhanzi 语文知识库：语法 / 阅读理解 / 写作 */
(function () {
  'use strict';

  var MODULES = [
    { key: 'grammar', file: 'yuwen/grammar.json', label: '语法' },
    { key: 'reading', file: 'yuwen/reading.json', label: '阅读理解' },
    { key: 'writing', file: 'yuwen/writing.json', label: '写作' }
  ];
  var DATA = {};
  var active = 'grammar';

  var listEl = document.getElementById('ywlist');
  var tabsEl = document.getElementById('ywtabs');
  var stdEl = document.getElementById('ywstd');
  var qEl = document.getElementById('yq');
  var controlsEl = document.getElementById('ywcontrols');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function itemHtml(it) {
    var body = '';
    if (it['讲解']) body += '<p class="yw-exp">' + esc(it['讲解']) + '</p>';
    if (it['口诀']) body += '<div class="yw-koujue2">🗣️ 口诀：' + esc(it['口诀']) + '</div>';
    if (it['例子'] && it['例子'].length) {
      body += '<div class="words">' + it['例子'].map(function (w) {
        return '<span>' + esc(w) + '</span>';
      }).join('') + '</div>';
    }
    if (it['易错']) body += '<div class="warn">⚠️ ' + esc(it['易错']) + '</div>';
    return '<div class="yw-item">' +
      '<button class="yw-head"><span class="yw-name">' + esc(it.name || '') + '</span>' +
      (it['口诀'] ? '<span class="yw-kj">' + esc(it['口诀']) + '</span>' : '') +
      '<span class="yw-arrow">▾</span></button>' +
      '<div class="yw-body">' + body + '</div></div>';
  }

  function render() {
    var d = DATA[active];
    if (!d) return;
    var q = qEl.value.trim();
    stdEl.textContent = d['标准'] || '';

    var html = '';
    d.categories.forEach(function (c, ci) {
      var items = c.items;
      if (q) {
        items = items.filter(function (it) {
          return (it.name || '').indexOf(q) >= 0 ||
            (it['讲解'] || '').indexOf(q) >= 0 ||
            (it['口诀'] || '').indexOf(q) >= 0;
        });
        if (!items.length) return;
      }
      html += '<div class="ghead" id="ywc-' + ci + '">' + esc(c.name) +
        '<span class="gcount">' + items.length + '条</span></div>' +
        items.map(itemHtml).join('');
    });
    listEl.innerHTML = html ||
      '<div class="noresult">没找到相关知识点，换个词试试</div>';

    var top = controlsEl.offsetHeight;
    Array.prototype.forEach.call(listEl.querySelectorAll('.ghead'), function (h) {
      h.style.top = top + 'px';
    });
  }

  function syncTabs() {
    tabsEl.innerHTML = MODULES.map(function (m) {
      var n = DATA[m.key] ? DATA[m.key].categories.reduce(function (a, c) { return a + c.items.length; }, 0) : 0;
      return '<button class="tab' + (m.key === active ? ' active' : '') + '" data-m="' + m.key + '">' +
        esc(m.label) + (n ? ' ' + n : '') + '</button>';
    }).join('');
  }

  tabsEl.addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    active = t.getAttribute('data-m');
    qEl.value = '';
    syncTabs(); render();
    window.scrollTo(0, 0);
  });

  listEl.addEventListener('click', function (e) {
    var h = e.target.closest('.yw-head');
    if (!h) return;
    h.parentElement.classList.toggle('open');
  });

  var deb = null;
  qEl.addEventListener('input', function () {
    clearTimeout(deb);
    deb = setTimeout(render, 150);
  });

  window.addEventListener('resize', function () {
    var top = controlsEl.offsetHeight;
    Array.prototype.forEach.call(listEl.querySelectorAll('.ghead'), function (h) {
      h.style.top = top + 'px';
    });
  });

  Promise.all(MODULES.map(function (m) {
    return fetch(m.file).then(function (r) { return r.json(); }).then(function (d) {
      DATA[m.key] = d;
    });
  })).then(function () {
    syncTabs(); render();
  }).catch(function () {
    listEl.innerHTML = '<div class="noresult">知识库加载失败</div>';
  });
})();
