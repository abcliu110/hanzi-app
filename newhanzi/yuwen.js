/* newhanzi 语文知识库：语法 / 阅读理解 / 写作 */
(function () {
  'use strict';

  var MODULES = [
    { key: 'grammar', file: 'yuwen/grammar.json', label: '语法' },
    { key: 'logic', file: 'yuwen/logic.json', label: '逻辑学' },
    { key: 'reading', file: 'yuwen/reading.json', label: '阅读理解' },
    { key: 'writing', file: 'yuwen/writing.json', label: '写作' }
  ];
  var DATA = {};
  var active = 'grammar';
  var animData = {};
  var quizData = {};
  var gameData = {};
  /* 支持 ?tab=logic 直接进逻辑学 */
  try {
    var mm = location.search.match(/[?&]tab=([a-z]+)/);
    if (mm && mm[1]) {
      var valid = MODULES.some(function (m) { return m.key === mm[1]; });
      if (valid) active = mm[1];
    }
  } catch (e) {}

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

  function itemHtml(it, idx) {
    var body = '';
    var hasVisual = it['类比'] || it['图示'] || it['动画'] || it['小测'];
    /* 1. 打个比方 */
    if (it['类比']) body += '<div class="yw-analogy">💡 打个比方：' + esc(it['类比']) + '</div>';
    /* 2. 看图说话 */
    if (it['图示']) body += '<div class="yw-diagram">' + it['图示'] + '</div>';
    /* 3. 动手试试（动画） */
    if (it['动画'] && it['动画'].steps && it['动画'].steps.length) {
      var aid = 'anim' + idx + '_' + Math.floor(Math.random() * 100000);
      body += '<div class="yw-anim" id="' + aid + '">' +
        '<div class="yw-anim-tokens">' + it['动画'].steps[0].tokens.map(function (t) {
          return '<span class="tok">' + esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="yw-anim-note">' + esc(it['动画'].steps[0].note || '') + '</div>' +
        '<div class="yw-anim-ctrl"><button data-aid="' + aid + '" data-act="play">▶ 播放</button>' +
        '<button data-aid="' + aid + '" data-act="step">单步</button></div></div>';
      /* 存步骤数据供播放器用 */
      animData[aid] = it['动画'].steps;
    }
    /* 3b. 互动游戏 */
    if (it['游戏']) {
      var gid = 'game' + idx + '_' + Math.floor(Math.random() * 100000);
      gameData[gid] = it['游戏'];
      body += '<div class="yw-game" id="' + gid + '">' +
        '<div class="game-title">🎮 ' + esc(it['游戏'].title || '互动练习') + '</div>' +
        '<div class="game-area"></div>' +
        '<div class="game-fb"></div></div>';
    }
    /* 4. 规则一句话 */
    if (it['讲解']) body += '<p class="yw-exp">' + esc(it['讲解']) + '</p>';
    if (it['口诀']) body += '<div class="yw-koujue2">🗣️ 口诀：' + esc(it['口诀']) + '</div>';
    if (it['例子'] && it['例子'].length) {
      body += '<div class="words">' + it['例子'].map(function (w) {
        return '<span>' + esc(w) + '</span>';
      }).join('') + '</div>';
    }
    /* 5. 易错诊所 */
    if (it['易错']) body += '<div class="warn">⚠️ ' + esc(it['易错']) + '</div>';
    /* 6. 小测 */
    if (it['小测'] && it['小测'].length) {
      body += '<div class="yw-quiz">' + it['小测'].map(function (q, qi) {
        var qid = 'q' + idx + '_' + qi + '_' + Math.floor(Math.random() * 100000);
        quizData[qid] = q;
        return '<div class="quiz-q" id="' + qid + '"><div class="quiz-t">' + (qi + 1) + '. ' + esc(q.q) + '</div>' +
          '<div class="quiz-opts">' + q.options.map(function (op, oi) {
            return '<button data-qid="' + qid + '" data-oi="' + oi + '">' + esc(op) + '</button>';
          }).join('') + '</div><div class="quiz-fb"></div></div>';
      }).join('') + '</div>';
    }
    return '<div class="yw-item">' +
      '<button class="yw-head"><span class="yw-name">' + esc(it.name || '') + '</span>' +
      (hasVisual ? '<span class="yw-badge">✨图解</span>' : '') +
      (it['subtitle'] ? '<span class="yw-sub">' + esc(it['subtitle']) + '</span>' : '') +
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
        items.map(function (it, ii) { return itemHtml(it, ci + '_' + ii); }).join('');
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
    if (h) { h.parentElement.classList.toggle('open'); return; }

    /* 动画播放器 */
    var ab = e.target.closest('[data-aid]');
    if (ab) {
      var aid = ab.getAttribute('data-aid');
      var act = ab.getAttribute('data-act');
      var steps = animData[aid];
      var box = document.getElementById(aid);
      if (!steps || !box) return;
      var toks = box.querySelectorAll('.tok');
      var note = box.querySelector('.yw-anim-note');
      var cur = parseInt(box.getAttribute('data-cur') || '0', 10);
      e.stopPropagation();
      if (act === 'step') {
        cur = (cur + 1) % steps.length;
      } else { /* play: 从头播 */
        cur = 0;
        var timer = setInterval(function () {
          showStep(cur);
          cur++;
          if (cur >= steps.length) clearInterval(timer);
        }, 1200);
        return;
      }
      showStep(cur);
      function showStep(i) {
        box.setAttribute('data-cur', i);
        for (var k = 0; k < toks.length; k++) {
          toks[k].classList.toggle('on', k === i);
        }
        note.textContent = steps[i].note || '';
      }
      return;
    }

    /* 小测 */
    var qb = e.target.closest('[data-qid]');
    if (qb) {
      var qid = qb.getAttribute('data-qid');
      var oi = parseInt(qb.getAttribute('data-oi'), 10);
      var q = quizData[qid];
      var qbox = document.getElementById(qid);
      if (!q || !qbox) return;
      e.stopPropagation();
      var fb = qbox.querySelector('.quiz-fb');
      var btns = qbox.querySelectorAll('[data-oi]');
      for (var b = 0; b < btns.length; b++) btns[b].classList.remove('right', 'wrong');
      if (oi === q.answer) {
        qb.classList.add('right');
        fb.innerHTML = '✅ 答对了！' + (q['解析'] ? esc(q['解析']) : '');
      } else {
        qb.classList.add('wrong');
        btns[q.answer].classList.add('right');
        fb.innerHTML = '❌ 再想想。' + (q['解析'] ? esc(q['解析']) : '');
      }
      return;
    }
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

  /* 数据来自 yuwen/data.js 的 window.NHZ_YUWEN（file:// 与 http:// 通用） */
  var src = window.NHZ_YUWEN || {};
  MODULES.forEach(function (m) { if (src[m.key]) DATA[m.key] = src[m.key]; });
  if (Object.keys(DATA).length) {
    syncTabs(); render();
  } else {
    listEl.innerHTML = '<div class="noresult">知识库加载失败，请确认 yuwen/data.js 存在</div>';
  }
})();
