/* newhanzi 偏旁部首知识库：含义 + 说解 + 例字 + 含此部首的字 */
(function () {
  'use strict';

  var DATA = (window.NHZ_BUSHOU || []).slice();
  var listEl = document.getElementById('bslist');
  var qEl = document.getElementById('bq');
  var filter = 'all';

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
      '<div class="bs-body"><div class="yw-typetag" style="--tc:#3d5a40">词条型</div>';

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

    Array.prototype.forEach.call(listEl.querySelectorAll('.bs-head'), function (h) {
      h.addEventListener('click', function () {
        h.parentElement.classList.toggle('open');
      });
    });
  }

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

  /* 直达：bushou.html?b=氵 → 自动展开并滚动到该部首 */
  (function () {
    var m = /[?&]b=([^&]+)/.exec(location.search);
    if (!m) return;
    var target = decodeURIComponent(m[1]);
    var el = listEl.querySelector('.bs-item');
    // render 后按 bushou 查找
    var items = listEl.querySelectorAll('.bs-item');
    for (var i = 0; i < items.length; i++) {
      var head = items[i].querySelector('.bs-char');
      if (head && head.textContent === target) {
        items[i].classList.add('open');
        setTimeout(function (t) {
          t.scrollIntoView({ block: 'start' });
        }, 60, items[i]);
        break;
      }
    }
  })();
})();
