/* 拼音区：菜单 → 知识点详情。导航只用界面层级（FRONTEND_UI.md §7），不用浏览器历史。 */
(function () {
  var MENU = window.NHZ_PINYIN_MENU || [];
  var home = document.getElementById('pyHome');
  var detail = document.getElementById('pyDetail');
  var grid = document.getElementById('pyGrid');

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* ---- 芯片发音（pinyin-04）：只播 pinyin/audio 里的真人录音；没有音频的芯片不可点 ---- */
  var S = window.NHZPinyinSyllable, A = window.NHZPinyinAudio;
  var INITIAL = {}; ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s'].forEach(function (i) { INITIAL[i] = 1; });
  /* 单韵母、复韵母、鼻韵母单念时的读音 = 对应零声母音节（i→yi、ui→wei、iu→you…）；ong 单念没有对应音节 */
  var FINAL_AS = { a: 'a', o: 'o', e: 'e', i: 'yi', u: 'wu', 'ü': 'yu', ai: 'ai', ei: 'ei', ui: 'wei', ao: 'ao', ou: 'ou',
    iu: 'you', ie: 'ye', 'üe': 'yue', er: 'er', an: 'an', en: 'en', 'in': 'yin', un: 'wen', 'ün': 'yun',
    ang: 'ang', eng: 'eng', ing: 'ying' };
  function akey(w) { return w.replace(/ü/g, 'v'); }

  /* 判断芯片怎么发音：{kind:'hudu'|'tone'|'tones'|'none', ...} */
  function chipAudio(label) {
    var t = String(label).trim(), target = t;
    var arrow = t.split('→'); if (arrow.length === 2) target = arrow[1].trim();
    if (INITIAL[target]) return { kind: 'hudu', ini: target, ok: !!(A && A.hasHudu(target)) };
    if (!S || !A) return { kind: 'none' };
    var r = S.parse(target);
    if (r.ok && r.tone >= 1 && r.tone <= 4) {
      return r.audio && A.hasSyl(akey(r.written), r.tone) ? { kind: 'tone', syl: akey(r.written), tone: r.tone } : { kind: 'none' };
    }
    if (/[\u0300-\u036f]/.test(target.normalize('NFD').replace(/\u0308/g, ''))) return { kind: 'none' };
    var syl = FINAL_AS[target] || (r.ok && r.legal ? r.written : '');
    if (!syl || !A.hasSyl(akey(syl), 1)) return { kind: 'none' };
    return { kind: 'tones', show: target, syl: akey(syl), as: FINAL_AS[target] && FINAL_AS[target] !== target ? syl : '' };
  }

  function chipHtml(c) {
    var a = Array.isArray(c) ? c : [c], label = String(a[0]);
    var small = a[1] ? '<small>' + esc(a[1]) + '</small>' : '';
    if (label.indexOf('/') >= 0 && label.indexOf('→') < 0) {
      return '<span class="py-pair">' + label.split('/').map(function (x) { return chipHtml([x]); }).join('<i>/</i>') + '</span>';
    }
    var au = chipAudio(label);
    if (au.kind === 'hudu' && !au.ok) {
      return '<span class="py-chip is-wait" aria-disabled="true" title="声母呼读音待录音">' + esc(label) + small + '<em>待录音</em></span>';
    }
    if (au.kind === 'none') return '<span class="py-chip is-mute" aria-disabled="true" title="这个暂时没有录音">' + esc(label) + small + '</span>';
    var d = ' data-kind="' + au.kind + '"';
    if (au.kind === 'hudu') d += ' data-ini="' + esc(au.ini) + '"';
    else d += ' data-syl="' + esc(au.syl) + '"' + (au.tone ? ' data-tone="' + au.tone + '"' : '') +
      (au.show ? ' data-show="' + esc(au.show) + '"' : '') + (au.as ? ' data-as="' + esc(au.as) + '"' : '');
    var tip = au.kind === 'tones' ? '点开听四个声调' : '点一下听读音';
    return '<button type="button" class="py-chip is-play"' + d + ' title="' + tip + '"' +
      (au.kind === 'tones' ? ' aria-expanded="false"' : '') + '>' + esc(label) + small + '</button>';
  }

  function chips(list) {
    return '<div class="py-row">' + list.map(chipHtml).join('') + '</div>';
  }

  function closeTones() {
    var bar = detail.querySelector('.py-tones'); if (bar) bar.parentNode.removeChild(bar);
    var open = detail.querySelector('.py-chip[aria-expanded="true"]'); if (open) open.setAttribute('aria-expanded', 'false');
  }

  function openTones(chip) {
    var was = chip.getAttribute('aria-expanded') === 'true';
    closeTones();
    if (was) return;
    var syl = chip.getAttribute('data-syl'), show = chip.getAttribute('data-show'), as = chip.getAttribute('data-as');
    var h = '<div class="py-tones" role="group" aria-label="' + esc(show) + ' 的四个声调"><span class="py-tones-h">' + esc(show) + '</span>';
    for (var t = 1; t <= 4; t++) {
      var lab = S.mark(show, t), has = A.hasSyl(syl, t);
      h += has ? '<button type="button" class="py-tone" data-syl="' + esc(syl) + '" data-tone="' + t + '">' + esc(lab) + '</button>'
        : '<span class="py-tone is-mute" aria-disabled="true">' + esc(lab) + '</span>';
    }
    if (as) h += '<span class="py-tones-n">单念时和音节 ' + esc(as) + ' 读法一样</span>';
    h += '</div>';
    var row = chip.closest('.py-row');
    row.insertAdjacentHTML('afterend', h);
    chip.setAttribute('aria-expanded', 'true');
  }

  function flash(el) {
    el.classList.add('is-on');
    setTimeout(function () { el.classList.remove('is-on'); }, 600);
  }

  detail.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.py-chip.is-play, .py-tone[data-tone]') : null;
    if (!b || !A) return;
    var kind = b.getAttribute('data-kind');
    if (kind === 'tones') { openTones(b); return; }
    flash(b);
    if (kind === 'hudu') A.playHudu(b.getAttribute('data-ini'));
    else A.playSyl(b.getAttribute('data-syl'), +b.getAttribute('data-tone'));
  });

  grid.innerHTML = MENU.map(function (m) {
    return '<button type="button" class="py-card" data-id="' + esc(m.id) + '">' +
      '<span class="hd"><span class="no">' + m.no + '</span><b>' + esc(m.name) + '</b>' +
      '<span class="lv">' + esc(m.lv) + '</span></span>' +
      '<div class="ex">' + esc(m.ex) + '</div>' +
      '<div class="ds">' + esc(m.ds) + '</div></button>';
  }).join('');

  function showHome() {
    if (A) A.stop();
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
    if (A) A.stop();
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
