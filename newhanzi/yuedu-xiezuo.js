/* 阅读与写作独立页（程序型）：数据走 yuwen/data.js 的 reading/writing，
 * 不混入语法页。渲染顺序按 v3.0 程序型范式：一句话 → 步骤卡 → 全程演示 → 易错。
 * 注意：数据中没有独立的决策树字段（30 点 0 命中），本页不编造决策树，
 * 步骤卡取“怎么认”、全程演示取“例句解析”（与 yuwen.js 程序型渲染约定一致）。
 * file:// 可用：数据经 <script> 标签加载。 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var MODULES = [
    { key: 'reading', title: '阅读', icon: '📖' },
    { key: 'writing', title: '写作', icon: '✏️' }
  ];

  /* 展平：[{mod, cat, it}]，顺序与 data.js 一致 */
  function allPoints() {
    var Y = window.NHZ_YUWEN || {};
    var out = [];
    MODULES.forEach(function (m) {
      var sec = Y[m.key];
      if (!sec || !sec.categories) return;
      sec.categories.forEach(function (c) {
        (c.items || []).forEach(function (it) {
          out.push({ mod: m, cat: c.name || '', it: it });
        });
      });
    });
    return out;
  }

  /* 程序型详情体：与 yuwen.js 程序型节标题、类名一致 */
  function detailHtml(p) {
    var it = p.it, step = 0, body = '';
    function stepHead(title) {
      step++;
      return '<div class="yw-step"><span class="yw-stepnum">' + step + '</span><span class="yw-steptitle">' + title + '</span></div>';
    }
    body += '<div class="yw-typetag" style="--tc:#7a5a3a">程序型</div>';
    if (it['讲解'] || it['口诀'] || (it['例子'] && it['例子'].length)) {
      body += stepHead('一句话');
      if (it['讲解']) body += '<p class="yw-exp">' + esc(it['讲解']) + '</p>';
      if (it['口诀']) body += '<div class="yw-koujue2">🗣️ 口诀：' + esc(it['口诀']) + '</div>';
      if (it['例子'] && it['例子'].length) {
        body += '<div class="words">' + it['例子'].map(function (w) {
          return '<span>' + esc(w) + '</span>';
        }).join('') + '</div>';
      }
    }
    if (it['怎么认'] && it['怎么认'].length) {
      body += stepHead('🃏 步骤卡') + '<div class="yw-stepcards">' +
        it['怎么认'].map(function (s, si) {
          return '<div class="yw-stepcard"><span class="yw-stepcard-n">' + (si + 1) + '</span><span>' + esc(s) + '</span></div>';
        }).join('') + '</div>';
    }
    if (it['例句解析'] && it['例句解析'].length) {
      body += stepHead('🎬 全程演示') +
        it['例句解析'].map(function (e) {
          return '<p class="yw-exp">📝 ' + esc(e['句'] || '') + '<br>↳ ' + esc(e['析'] || '') + '</p>';
        }).join('');
    }
    if (it['易错']) body += '<div class="warn">⚠️ ' + esc(it['易错']) + '</div>';
    return body;
  }

  var points = [];
  var listEl, detailEl, qEl;

  function match(p, q) {
    if (!q) return true;
    var hay = (p.it.name || '') + ' ' + (p.it['讲解'] || '') + ' ' + (p.it['口诀'] || '');
    return hay.indexOf(q) >= 0;
  }

  function renderList() {
    var q = (qEl.value || '').trim();
    var html = '';
    var counts = { reading: 0, writing: 0 };
    points.forEach(function (p) { if (match(p, q)) counts[p.mod.key]++; });
    html += '<p class="src-note">阅读 ' + counts.reading + ' 点 · 写作 ' + counts.writing + ' 点 · 程序型范式：步骤卡 → 全程演示（决策树内容待增补，不编造）。</p>';
    MODULES.forEach(function (m) {
      var cats = {};
      var order = [];
      points.forEach(function (p, idx) {
        if (p.mod.key !== m.key || !match(p, q)) return;
        if (!cats[p.cat]) { cats[p.cat] = []; order.push(p.cat); }
        cats[p.cat].push(idx);
      });
      if (!order.length) return;
      html += '<h2 style="margin:20px 0 10px">' + m.icon + ' ' + m.title + '</h2>';
      order.forEach(function (cat) {
        html += '<h3 style="margin:14px 0 8px">' + esc(cat) + '</h3><div class="yw-grid">';
        cats[cat].forEach(function (idx) {
          var it = points[idx].it;
          html += '<button class="yw-head" data-idx="' + idx + '"><span class="yw-ico">' + m.icon + '</span>' +
            '<span class="yw-name">' + esc(it.name || '') + '</span>' +
            (it['口诀'] ? '<span class="yw-kj">' + esc(it['口诀']) + '</span>' : '') +
            '<span class="yw-arrow">▾</span></button>';
        });
        html += '</div>';
      });
    });
    if (!counts.reading && !counts.writing) html += '<p class="src-note">没有找到相关知识点，换个词试试。</p>';
    listEl.innerHTML = html;
  }

  function showDetail(idx) {
    var p = points[idx];
    if (!p) return;
    listEl.style.display = 'none';
    detailEl.style.display = 'block';
    detailEl.innerHTML =
      '<div style="display:flex;gap:10px;margin-bottom:16px">' +
      '<button class="yw-back" id="yxBack">← 返回列表</button>' +
      '<button class="yw-back" id="yxHome">🏠 主页</button></div>' +
      '<div class="yw-detail-head"><span class="yw-ico-lg">' + p.mod.icon + '</span>' +
      '<div><h2>' + esc(p.it.name || '') + '</h2>' +
      (p.it['口诀'] ? '<p class="yw-kj-lg">' + esc(p.it['口诀']) + '</p>' : '') + '</div></div>' +
      '<div class="yw-detail-body">' + detailHtml(p) + '</div>';
    document.getElementById('yxBack').addEventListener('click', function () {
      detailEl.style.display = 'none';
      detailEl.innerHTML = '';
      listEl.style.display = '';
      window.scrollTo(0, 0);
    });
    document.getElementById('yxHome').addEventListener('click', function () {
      if (window.self !== window.top) { window.top.location.href = 'index.html'; }
      else { window.location.href = 'index.html'; }
    });
    window.scrollTo(0, 0);
  }

  function main() {
    listEl = document.getElementById('yxlist');
    detailEl = document.getElementById('yxdetail');
    qEl = document.getElementById('yq');
    points = allPoints();
    if (!points.length) {
      listEl.innerHTML = '<p class="src-note">阅读与写作数据未加载，请检查 yuwen/data.js。</p>';
      return;
    }
    renderList();
    qEl.addEventListener('input', renderList);
    listEl.addEventListener('click', function (e) {
      var head = e.target.closest('.yw-head');
      if (head) showDetail(parseInt(head.getAttribute('data-idx'), 10));
    });
  }

  main();
})();
