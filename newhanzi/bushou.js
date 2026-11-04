/* newhanzi 偏旁部首知识库：含义 + 说解 + 例字 + 含此部首的字 */
(function () {
  'use strict';

  var DATA = (window.NHZ_BUSHOU || []).slice();
  var listEl = document.getElementById('bslist');
  var detailEl = document.getElementById('bsdetail');
  var qEl = document.getElementById('bq');
  var controlsEl = document.getElementById('bscontrols');
  var ppsecEl = document.getElementById('ppsec');
  var filter = 'all';
  /* 当前在详情页展示的列表项（body 节点被搬走，返回时搬回） */
  var detailItemEl = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function zikaLink(z) {
    return 'zika.html?zi=' + encodeURIComponent(z);
  }

  /* 动画图解挂载表：部首名 → anim.js 里的函数名（对不上就不显示） */
  var EVO_ANIM = { '马': 'bsAnimEvoMa', '鱼': 'bsAnimEvoYu', '日': 'bsAnimEvoRi', '车': 'bsAnimEvoChe' };
  var BIAN_ANIM = { '氵': '氵', '扌': '扌', '亻': '亻', '忄': '忄' };
  var LIUSHU_ANIM = { '木': 'bsAnimXiangxing', '亻': 'bsAnimHuiyi', '氵': 'bsAnimXingsheng' };
  function animHtml(fn, arg) {
    try {
      if (typeof window[fn] !== 'function') return '';
      var s = arg === undefined ? window[fn]() : window[fn](arg);
      return '<div class="bs-anim">' + s + '</div>';
    } catch (e) { return ''; }
  }

  function itemHtml(r, i) {
    var head_sub = r.meaning || (r.shuowen ? '《说文解字》有讲解' : '');
    var html = '<div class="yw-item bs-item" data-i="' + i + '">' +
      '<div class="bs-head">' +
      '<span class="bs-char">' + esc(r.bushou) + '</span>' +
      '<span class="bs-info"><span class="bs-meaning">' + esc(head_sub) + '</span>' +
      '<span class="bs-sub">' + (r.benzi ? '本字「' + esc(r.benzi) + '」 · ' : '') + r.count + '字</span></span>' +
      '<span class="bs-count">' + r.count + '字</span>' +
      '<span class="bs-arrow">▾</span></div>' +
      '<div class="bs-body">';

    if (r.bianti) {
      html += '<div class="bs-sec"><h4>变体</h4><div class="bs-sem">' + esc(r.bianti) + '</div>';
      if (BIAN_ANIM[r.bushou]) html += animHtml('bsAnimBian', BIAN_ANIM[r.bushou]);
      html += '</div>';
    }
    if (r.shuowen) {
      html += '<div class="bs-sec"><h4>《说文解字》</h4><div class="bs-shuowen">「' + esc(r.shuowen) + '」' +
        (r.shuowen_url ? ' <a href="' + esc(r.shuowen_url) + '" target="_blank" rel="noopener">汉典原文 ↗</a>' : '') +
        '</div></div>';
    }
    if (r['图示']) {
      html += '<div class="bs-sec"><h4>看图说话</h4><div class="yw-diagram">' + r['图示'] +
        '<div style="text-align:center;margin-top:8px;"><button class="back" style="padding:8px 16px;font-size:14px;" onclick="var d=this.closest(\'.yw-diagram\');var s=d.querySelector(\'svg\');if(s){var c=s.cloneNode(true);s.parentNode.replaceChild(c,s);}">↻ 重播动画</button></div></div></div>';
    }
    if (r.evo) {
      html += '<div class="bs-sec"><h4>字形演变</h4><div class="bs-sem">🦴 ' + esc(r.evo) + '</div>';
      if (EVO_ANIM[r.bushou]) html += animHtml(EVO_ANIM[r.bushou]);
      html += '</div>';
    }
    if (LIUSHU_ANIM[r.bushou]) {
      html += '<div class="bs-sec"><h4>六书示意</h4>' + animHtml(LIUSHU_ANIM[r.bushou]) + '</div>';
    }
    if (r.semantic) html += '<div class="bs-sec"><h4>语义场</h4><div class="bs-sem">' + esc(r.semantic) + '</div></div>';
    if (r.examples && r.examples.length) {
      html += '<div class="bs-sec"><h4>代表例字</h4><div class="bs-ex">' +
        r.examples.map(function (e) {
          var inner = esc(e.z) + '<small>' + esc(e.w) + '</small>';
          return e.in3500 ? '<a href="' + zikaLink(e.z) + '">' + inner + '</a>'
                          : '<span class="bs-explain">' + inner + '</span>';
        }).join('') + '</div></div>';
    }
    if (r.chars && r.chars.length) {
      var fmCount = r.fm ? Object.keys(r.fm).length : 0;
      html += '<div class="bs-sec"><h4>含此部首的字（' + r.chars.length +
        (fmCount ? '，' + fmCount + '字有家族含义' : '') + '）</h4><div class="bs-grid">' +
        r.chars.map(function (z) {
          var fm = (r.fm && r.fm[z]) || '';
          return '<a href="' + zikaLink(z) + '" class="' + (fm ? 'hasfm' : '') + '">' +
            '<span class="bs-z">' + esc(z) + '</span>' +
            (fm ? '<span class="bs-fm">' + esc(fm) + '</span>' : '') + '</a>';
        }).join('') + '</div></div>';
    }
    return html + '</div></div>';
  }

  function render() {
    var q = qEl.value.trim();
    var html = '';
    var n = 0;
    DATA.forEach(function (r, i) {
      if (filter === 'rich' && !r.has_meaning) return;
      if (q) {
        var hay = r.bushou + ' ' + (r.benzi || '') + ' ' + (r.meaning || '') +
          ' ' + (r.semantic || '') + ' ' + (r.bianti || '');
        if (hay.indexOf(q) < 0) return;
      }
      html += itemHtml(r, i);
      n++;
    });
    listEl.innerHTML = html || '<div class="noresult">没找到相关部首，换个词试试</div>';
  }

  /* 独立详情视图（对标 yuwen.js showDetail）：把 body 节点直接搬到详情区，避免复制导致 ID 重复 */
  function showDetail(headEl) {
    var itemEl = headEl.closest('.bs-item');
    var bodyEl = itemEl ? itemEl.querySelector('.bs-body') : null;
    if (!itemEl || !bodyEl) return;
    detailItemEl = itemEl;
    listEl.style.display = 'none';
    if (controlsEl) controlsEl.style.display = 'none';
    if (ppsecEl) ppsecEl.style.display = 'none';
    detailEl.style.display = 'block';
    var charHtml = headEl.querySelector('.bs-char').innerHTML;
    var infoHtml = headEl.querySelector('.bs-info').innerHTML;
    detailEl.innerHTML =
      '<div style="margin:6px 0 14px"><button class="yw-back" id="bsBack">← 返回列表</button></div>' +
      '<div class="bs-detail-head"><span class="bs-char">' + charHtml + '</span>' +
      '<div class="bs-info">' + infoHtml + '</div></div>' +
      '<div id="bsDetailBody"></div>';
    document.getElementById('bsDetailBody').appendChild(bodyEl);
    document.getElementById('bsBack').addEventListener('click', hideDetail);
    window.scrollTo(0, 0);
  }

  function hideDetail() {
    /* 把 body 节点搬回原列表项 */
    var bodyEl = document.querySelector('#bsDetailBody .bs-body');
    if (bodyEl && detailItemEl) detailItemEl.appendChild(bodyEl);
    detailItemEl = null;
    detailEl.style.display = 'none';
    detailEl.innerHTML = '';
    listEl.style.display = '';
    if (controlsEl) controlsEl.style.display = '';
    if (ppsecEl) ppsecEl.style.display = '';
    window.scrollTo(0, 0);
  }

  /* 列表标题点击 → 进入独立详情页（事件委托，render 后无需重绑） */
  listEl.addEventListener('click', function (e) {
    var h = e.target.closest('.bs-head');
    if (h && listEl.style.display !== 'none') {
      showDetail(h);
    }
  });

  var t = null;
  qEl.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(render, 200);
  });

  document.querySelectorAll('.bs-filter .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('.bs-filter .chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      filter = c.getAttribute('data-f');
      render();
    });
  });

  document.getElementById('navtitle').textContent = '偏旁部首（' + DATA.length + '）';
  render();

  /* 直达：bushou.html?b=氵 → 自动进入该部首的详情页 */
  (function () {
    var m = /[?&]b=([^&]+)/.exec(location.search);
    if (!m) return;
    var target = decodeURIComponent(m[1]);
    // render 后按 bushou 查找
    var items = listEl.querySelectorAll('.bs-item');
    for (var i = 0; i < items.length; i++) {
      var head = items[i].querySelector('.bs-char');
      if (head && head.textContent === target) {
        var h = items[i].querySelector('.bs-head');
        if (h) setTimeout(function (hh) { showDetail(hh); }, 60, h);
        break;
      }
    }
  })();
})();
