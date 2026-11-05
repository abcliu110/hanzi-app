/* newhanzi 首页：识字表式汉字列表
 * 借鉴：Pleco 声调五色 / Kanji Study 多视图切换 / 新华字典拼音·部首·笔画索引 /
 *       宝宝巴士识字表总览 / Skritter 已学计数 */
(function () {
  'use strict';

  /* 护眼：降低饱和，避免高亮紫/鲜红刺眼 */
  var TONE_COLORS = { 1: '#b85a52', 2: '#3f8e6b', 3: '#4a7a8c', 4: '#6d7a5c', 5: '#6b7566' };
  var LS_LEARNED = 'nhz_learned';
  var LS_VIEW = 'nhz_view';

  var IDX = [];
  var indexLoaded = false;  // 索引是否成功加载
  var indexError = false;
  var view = localStorage.getItem(LS_VIEW) || 'py';
  var onlyNew = false;
  var gradeFilter = ''; /* 按年级筛选：''=全部，'1上'...'6下'，'none'=未分级（不在 grade_map 中） */
  var learned = {}; // 字 -> 首次学习日期 YYYY-MM-DD（兼容老数组格式）
  /* 老数组格式没有学习日期：记作 'legacy'，计入已学总数，不计入今日/本周 */
  var LEGACY_DATE = 'legacy';
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  try {
    var raw = JSON.parse(localStorage.getItem(LS_LEARNED) || 'null');
    if (Array.isArray(raw)) {
      raw.forEach(function (z) { learned[z] = LEGACY_DATE; });
    } else if (raw) {
      learned = raw;
    }
  } catch (e) {}

  var listEl = document.getElementById('list');
  var railEl = document.getElementById('rail');
  var qEl = document.getElementById('q');
  var controlsEl = document.getElementById('controls');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function dueReviewCount() {
    var now = Date.now(), n = 0;
    try {
      var srs = JSON.parse(localStorage.getItem('nhz_srs') || '{}') || {};
      for (var id in srs) {
        if (srs[id] && typeof srs[id].next === 'number' && srs[id].next <= now) n++;
      }
    } catch (e) {}
    return n;
  }
  function updateProgress() {
    var keys = Object.keys(learned);
    var n = keys.length;
    var today = todayStr();
    var nToday = 0;
    keys.forEach(function (z) { if (learned[z] === today) nToday++; });
    var review = dueReviewCount();
    document.getElementById('learnedCount').textContent = '已学 ' + n + ' / 3500';
    document.getElementById('pfill').style.width = (n / 3500 * 100).toFixed(1) + '%';
    document.getElementById('stTotal').textContent = n;
    document.getElementById('stToday').textContent = nToday;
    document.getElementById('stReview').textContent = review;
    var pctEl = document.getElementById('heroPct');
    if (pctEl) pctEl.textContent = '完成度 ' + (n / 3500 * 100).toFixed(1) + '%';
    var chip = document.getElementById('reviewChip');
    if (chip) chip.textContent = '复习 ' + review;
    var pp = document.getElementById('prog-shizi');
    if (pp) pp.style.width = (n / 3500 * 100).toFixed(1) + '%';
    var ppt = document.getElementById('progtx-shizi');
    if (ppt) ppt.textContent = n + ' / 3500';
  }

  function rowHtml(e) {
    var color = TONE_COLORS[e.t] || TONE_COLORS[5];
    var mark = learned[e.z] ? '<span class="done" title="已学">✓</span>' : '';
    return '<a class="row" id="row-' + e.z + '" href="zika.html?zi=' + encodeURIComponent(e.z) + '">' +
      '<span class="rz">' + esc(e.z) + mark + '</span>' +
      '<span class="rpy" style="color:' + color + '">' + esc(e.py || '') + '</span>' +
      '<span class="rmeta">' + esc(e.bu) + '部 · ' + e.st + '画</span>' +
      '<span class="rgo">›</span></a>';
  }

  /* ---- 分组 ---- */
  function groupsFor(v, items) {
    var groups = [], map = {};
    function put(key, title, e) {
      if (!map[key]) { map[key] = { key: key, title: title, items: [] }; groups.push(map[key]); }
      map[key].items.push(e);
    }
    if (v === 'py') {
      items.forEach(function (e) { put(e.L, e.L, e); });
      groups.sort(function (a, b) {
        if (a.key === '#') return 1; if (b.key === '#') return -1;
        return a.key < b.key ? -1 : 1;
      });
      groups.forEach(function (g) {
        g.items.sort(function (a, b) {
          return a.tl < b.tl ? -1 : a.tl > b.tl ? 1 : a.st - b.st;
        });
      });
    } else if (v === 'bu') {
      // 部首本身的笔画数（从索引里查部首字，查不到放最后）
      var buStrokes = {};
      IDX.forEach(function (e) { if (buStrokes[e.z] === undefined) buStrokes[e.z] = e.st; });
      items.forEach(function (e) { put(e.bu, e.bu + '部', e); });
      groups.sort(function (a, b) {
        var sa = buStrokes[a.key], sb = buStrokes[b.key];
        sa = sa === undefined ? 999 : sa; sb = sb === undefined ? 999 : sb;
        if (sa !== sb) return sa - sb;
        return b.items.length - a.items.length;
      });
      groups.forEach(function (g) {
        g.items.sort(function (a, b) { return a.st - b.st || (a.tl < b.tl ? -1 : 1); });
      });
    } else {
      items.forEach(function (e) { put('s' + e.st, e.st + ' 画', e); });
      groups.sort(function (a, b) { return parseInt(a.key.slice(1), 10) - parseInt(b.key.slice(1), 10); });
      groups.forEach(function (g) {
        g.items.sort(function (a, b) { return a.tl < b.tl ? -1 : a.tl > b.tl ? 1 : 0; });
      });
    }
    return groups;
  }

  function railLabel(g, v) {
    if (v === 'py') return g.key;
    if (v === 'st') return g.key.slice(1);
    return g.key;
  }

  function render() {
    // 索引还没加载好：显示加载中/失败，不许显示"全部学完啦"
    if (!indexLoaded) {
      listEl.innerHTML = indexError
        ? '<div class="noresult">字库索引加载失败<br><small>请确认 data/index.js 文件存在</small></div>'
        : '<div class="noresult">字库加载中…</div>';
      railEl.innerHTML = '';
      railEl.style.display = 'none';
      return;
    }
    var q = qEl.value.trim().toLowerCase();
    var items = IDX;
    if (onlyNew) items = items.filter(function (e) { return !learned[e.z]; });
    if (gradeFilter) {
      var gm = window.NHZ_GRADE_MAP || {};
      if (gradeFilter === 'none') items = items.filter(function (e) { return !gm[e.z]; });
      else items = items.filter(function (e) { return gm[e.z] === gradeFilter; });
    }

    var html = '', rail = '';
    if (q) {
      // 搜索：扁平结果
      var hits = items.filter(function (e) {
        return e.z.indexOf(q) >= 0 || e.tl.indexOf(q) === 0 || e.py.indexOf(q) >= 0;
      }).slice(0, 300);
      html = hits.length
        ? '<div class="ghead">搜索到 ' + hits.length + ' 个字' +
          (hits.length >= 300 ? '（只显示前 300）' : '') + '</div>' +
          hits.map(rowHtml).join('')
        : '<div class="noresult">没有找到相关汉字<br><small>换个字或拼音试试</small></div>';
      railEl.innerHTML = '';
      railEl.style.display = 'none';
    } else {
      var groups = groupsFor(view, items);
      var parts = groups.map(function (g, i) {
        return '<div class="ghead" id="g-' + i + '">' + esc(g.title) +
          '<span class="gcount">' + g.items.length + '字</span></div>' +
          g.items.map(rowHtml).join('');
      });
      /* 年级筛空时分两种：该册尚无核对录入（待补） vs 该册字已学完（只看未学） */
      var gradeEmpty = '';
      if (gradeFilter && gradeFilter !== 'none') {
        var gm2 = window.NHZ_GRADE_MAP || {}, hasMapped = false;
        for (var k in gm2) if (gm2[k] === gradeFilter) { hasMapped = true; break; }
        if (!hasMapped) gradeEmpty = '<div class="noresult">该年级生字表待核对录入<br><small>目前按年级核对的字为 0 个；未分级的字请选“未分级”查看</small></div>';
      }
      html = parts.join('') || gradeEmpty || '<div class="noresult">全部学完啦 🎉</div>';
      rail = groups.map(function (g, i) {
        return '<button data-g="' + i + '">' + esc(railLabel(g, view)) + '</button>';
      }).join('');
      railEl.innerHTML = rail;
      railEl.style.display = '';
    }
    listEl.innerHTML = html;

    // 粘性分组头的 top = controls 高度
    var top = controlsEl.offsetHeight;
    Array.prototype.forEach.call(listEl.querySelectorAll('.ghead'), function (h) {
      h.style.top = top + 'px';
    });
  }

  railEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var g = document.getElementById('g-' + b.getAttribute('data-g'));
    if (g) g.scrollIntoView();
  });

  /* ---- 视图切换 ---- */
  var tabsEl = document.getElementById('tabs');
  function syncTabs() {
    Array.prototype.forEach.call(tabsEl.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('active', t.getAttribute('data-v') === view);
    });
  }
  tabsEl.addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    view = t.getAttribute('data-v');
    localStorage.setItem(LS_VIEW, view);
    syncTabs(); render();
  });

  document.getElementById('onlyNew').addEventListener('click', function () {
    onlyNew = !onlyNew;
    this.classList.toggle('on', onlyNew);
    this.textContent = onlyNew ? '✓ 只看未学' : '只看未学';
    render();
  });

  var gradeSel = document.getElementById('gradeSel');
  if (gradeSel) gradeSel.addEventListener('change', function () {
    gradeFilter = gradeSel.value;
    render();
  });

  var deb = null;
  qEl.addEventListener('input', function () {
    clearTimeout(deb);
    deb = setTimeout(render, 150);
  });

  /* ---- 入口：数据来自 data/index.js 的 window.NHZ_INDEX（file:// 与 http:// 通用） ---- */
  listEl.innerHTML = '<div class="noresult">字库加载中…</div>';
  if (window.NHZ_INDEX && window.NHZ_INDEX.length) {
    IDX = window.NHZ_INDEX;
    indexLoaded = true;
  } else {
    indexError = true;
  }
  syncTabs();
  updateProgress();
  render();

  window.addEventListener('resize', function () {
    var top = controlsEl.offsetHeight;
    Array.prototype.forEach.call(listEl.querySelectorAll('.ghead'), function (h) {
      h.style.top = top + 'px';
    });
  });
})();
