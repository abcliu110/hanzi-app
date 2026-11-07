/* 拼音区知识点页渲染（window.NHZPinyinKP）。内容来自 pinyin/content/<id>.js（格式见 pinyin/content/SCHEMA.md）。
 *   NHZPinyinKP.render(el, content, menuItem)  → 把知识点页画进 el
 *   NHZPinyinKP.stop()                          → 停止音频和动画（离开页面时调用）
 *   NHZPinyinKP.level() / setLevel(1|2|3)       → 浅 / 中 / 深（默认 2，存 localStorage 'nhz-py-lv'）
 * 只播 pinyin/audio 里的真人录音（NHZPinyinAudio），不用 Web Speech。不做 3D/悬浮特效。
 * 块类型：text chips groups table pairs scene mirror anim(tone-road|bump|glide|nasal) quiz-listen quiz-choose quiz-build
 *         quiz-mark quiz-find words verse outline。glide / nasal 是静态步进示意图（点「下一步」），画不出来时退回 fallback。 */
(function () {
  'use strict';
  var S = window.NHZPinyinSyllable, A = window.NHZPinyinAudio;
  var LS_KEY = 'nhz-py-lv';
  var LVN = ['浅', '中', '深'];
  var STAGES = [['kan', '看', '看一看'], ['ting', '听读', '听一听，读一读'], ['lian', '练', '随机出题，判对错，不扣分'], ['yong', '用', '点拼音听音节，点汉字去字卡']];
  var INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
  var HUDU_ZI = { b: '玻', p: '坡', m: '摸', f: '佛', d: '得', t: '特', n: '讷', l: '勒', g: '哥', k: '科', h: '喝', j: '基', q: '欺', x: '希', zh: '知', ch: '蚩', sh: '诗', r: '日', z: '资', c: '雌', s: '思' };
  /* 韵母单念 = 零声母音节的录音 */
  var FINAL_AS = { a: 'a', o: 'o', e: 'e', i: 'yi', u: 'wu', 'ü': 'yu', ai: 'ai', ei: 'ei', ui: 'wei', ao: 'ao', ou: 'ou', iu: 'you', ie: 'ye', 'üe': 'yue', er: 'er',
    an: 'an', en: 'en', 'in': 'yin', un: 'wen', 'ün': 'yun', ang: 'ang', eng: 'eng', ing: 'ying', ia: 'ya', ua: 'wa', uo: 'wo', iao: 'yao', uai: 'wai',
    ian: 'yan', uan: 'wan', 'üan': 'yuan', iang: 'yang', uang: 'wang', ueng: 'weng', iong: 'yong' };
  var ROADN = { 1: ['一声', '平路', '高高的，一直平着走'], 2: ['二声', '上坡', '从中间往上爬'], 3: ['三声', '先下坡再上坡', '先往下走，再拐上去'], 4: ['四声', '下坡', '从最高处一路冲下来'] };
  var MARKS = { 1: 'ˉ', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' };
  var VAL = { 1: '55', 2: '35', 3: '214', 4: '51' };
  var CONTOUR = { 1: [[0, 5], [1, 5]], 2: [[0, 3], [1, 5]], 3: [[0, 2], [0.42, 1], [1, 4]], 4: [[0, 5], [1, 1]] };

  var LV = 2;
  try { var sv = +localStorage.getItem(LS_KEY); if (sv >= 1 && sv <= 3) LV = sv; } catch (e) { /* 无痕模式 */ }
  var root = null, timers = [], rafs = [], onLevel = [];
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function akey(w) { return String(w).replace(/ü/g, 'v'); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function $(s, r) { return (r || root).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); }
  function has(syl, t) { return !!(A && A.hasSyl(akey(syl), t)); }
  function play(syl, t) { return A ? A.playSyl(akey(syl), t) : Promise.resolve(false); }
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function keyParts(k) { var m = /^([a-zü]+)([1-4])$/.exec(String(k || '').replace(/v/g, 'ü')); return m ? { syl: m[1], t: +m[2] } : null; }
  function stop() {
    if (A) A.stop();
    timers.forEach(clearTimeout); timers = [];
    rafs.forEach(function (r) { cancelAnimationFrame(r); }); rafs = [];
  }

  /* 一串拼音 → 合法音节（允许连写 māma、Xī'ān） */
  function sylOk(t) { var r = S.parse(t); return r.ok; }
  function segment(str) {
    var parts = String(str).toLowerCase().normalize('NFC').split(/['’\s]+/).filter(Boolean), out = [];
    for (var k = 0; k < parts.length; k++) {
      var p = parts[k];
      if (sylOk(p)) { out.push(p); continue; }
      var n = p.length, best = [[]];
      for (var i = 0; i < n; i++) {
        if (!best[i]) continue;
        for (var j = Math.min(n, i + 7); j > i; j--) if (!best[j] && sylOk(p.slice(i, j))) best[j] = best[i].concat([p.slice(i, j)]);
      }
      if (!best[n]) return null;
      out = out.concat(best[n]);
    }
    return out;
  }
  /* 一个带调音节 → 可点按钮（没有录音 = 普通文字） */
  function sylBtn(tok, cls) {
    var r = S.parse(tok);
    if (r.erhua) return '<span class="py" title="儿化没有录音">' + esc(tok) + '</span>';
    if (r.ok && r.audio && has(r.written, r.tone)) return '<button type="button" class="' + (cls || 'pyi') + ' t' + r.tone + '" data-syl="' + esc(akey(r.written)) + '" data-tone="' + r.tone + '">' + esc(tok) + '</button>';
    return '<span class="py">' + esc(tok) + '</span>';
  }
  /* 段落里的 {py:} {zi:} */
  function inline(str, plain) { /* plain：只上色不做按钮（用在按钮里面，避免按钮嵌套） */
    return esc(str).replace(/\{(py|zi):([^}]*)\}/g, function (_, k, v) {
      if (k === 'zi') return '<a class="zi-l" href="zika.html?zi=' + encodeURIComponent(v) + '" title="打开「' + v + '」字卡">' + v + '</a>';
      var raw = v.replace(/&#39;/g, "'");
      if (plain) { var pr = S.parse(raw); return '<span class="py' + (pr.ok ? ' t' + pr.tone : '') + '">' + v + '</span>'; }
      var words = raw.split(/\s+/).filter(Boolean);
      return '<span class="py">' + words.map(function (w) {
        var seg = segment(w.replace(/[，。,.!?！？]/g, ''));
        if (!seg || seg.length === 1) return seg ? sylBtn(w) : esc(w);
        /* 连写：按音节逐个可点，显示仍连写 */
        return seg.map(function (s) { return sylBtn(s); }).join('');
      }).join(' ') + '</span>';
    });
  }

  /* ---------------- 芯片 ---------------- */
  function chip(it) {
    var t = it.t, sub = it.sub ? '<small>' + esc(it.sub) + '</small>' : '';
    if (it.hudu) {
      if (A && A.hasHudu(it.hudu)) return '<button type="button" class="py-chip is-play" data-kind="hudu" data-ini="' + esc(it.hudu) + '" title="点一下听呼读音">' + esc(t) + sub + '</button>';
      return '<span class="py-chip is-wait" aria-disabled="true" title="声母呼读音待录音">' + esc(t) + sub + '<em>待录音' + (HUDU_ZI[it.hudu] ? ' · ' + HUDU_ZI[it.hudu] : '') + '</em></span>';
    }
    if (it.tones) {
      var ts = akey(it.tones);
      if (!has(ts, 1) && !has(ts, 2) && !has(ts, 3) && !has(ts, 4)) return '<span class="py-chip is-mute" aria-disabled="true" title="这个暂时没有录音">' + esc(t) + sub + '</span>';
      return '<button type="button" class="py-chip is-play" data-kind="tones" data-show="' + esc(t) + '" data-syl="' + esc(ts) + '" aria-expanded="false" title="点开听四个声调">' + esc(t) + sub + '</button>';
    }
    var k = keyParts(it.play);
    if (!it.play) return '<span class="py-chip is-static">' + esc(t) + sub + '</span>'; /* 介母等静态块 */
    if (k && has(k.syl, k.t)) return '<button type="button" class="py-chip is-play" data-kind="tone" data-syl="' + esc(akey(k.syl)) + '" data-tone="' + k.t + '" title="点一下听读音"><span class="t' + k.t + '">' + esc(t) + '</span>' + sub + '</button>';
    return '<span class="py-chip is-mute" aria-disabled="true" title="这个暂时没有录音">' + esc(t) + sub + '</span>';
  }
  function chipRow(items) { return '<div class="prow">' + (items || []).map(chip).join('') + '</div>'; }
  function openTones(c) {
    var was = c.getAttribute('aria-expanded') === 'true';
    $$('.py-tones').forEach(function (b) { b.parentNode.removeChild(b); });
    $$('.py-chip[aria-expanded="true"]').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
    if (was) return;
    var syl = c.getAttribute('data-syl'), show = c.getAttribute('data-show');
    var base = S.parse(show), lab = base.ok || base.legal || /^[a-zü]+$/.test(show) ? show : syl.replace(/v/g, 'ü');
    var h = '<div class="py-tones" role="group" aria-label="' + esc(show) + ' 的四个声调"><span class="py-tones-h">' + esc(show) + '</span>';
    for (var t = 1; t <= 4; t++) {
      var m = S.mark(lab, t);
      h += has(syl, t) ? '<button type="button" class="py-tone t' + t + '" data-syl="' + esc(syl) + '" data-tone="' + t + '">' + esc(m) + '</button>' : '<span class="py-tone is-mute" aria-disabled="true">' + esc(m) + '</span>';
    }
    var plain = syl.replace(/v/g, 'ü');
    if (plain !== lab) h += '<span class="py-tones-n">单念时和音节 ' + esc(plain) + ' 读法一样</span>';
    c.closest('.prow').insertAdjacentHTML('afterend', h + '</div>');
    c.setAttribute('aria-expanded', 'true');
  }

  /* ---------------- 注音字串（词语、儿歌） ---------------- */
  function zis(w, py, real) {
    var chars = Array.from(String(w)), toks = String(py || '').replace(/[，。！？、；：,.!?;:“”"（）()…—]/g, ' ').trim().split(/\s+/).filter(Boolean);
    var flat = [];
    toks.forEach(function (t) { (segment(t) || [t]).forEach(function (s) { flat.push(s); }); });
    var k = 0, out = '';
    chars.forEach(function (z) {
      if (!/[\u3400-\u9fff]/.test(z)) { out += '<span class="zi punc">' + (real ? '<span class="sd"></span>' : '') + '<span class="pyb nos" style="visibility:hidden">·</span><span class="zc">' + esc(z) + '</span></span>'; return; }
      var tok = flat[k] || '';
      var prev = flat[k - 1] && S.parse(flat[k - 1]);
      if (z === '儿' && prev && prev.erhua) { tok = ''; } else k++;
      var r = tok ? S.parse(tok) : null;
      var can = r && r.ok && !r.erhua && r.audio && has(r.written, r.tone);
      var pyb = !tok ? '<span class="pyb nos"></span>' : can ? '<button type="button" class="pyb t' + r.tone + '" data-syl="' + esc(akey(r.written)) + '" data-tone="' + r.tone + '">' + esc(tok) + '</button>'
        : '<span class="pyb nos t5" title="' + (r && r.erhua ? '儿化没有录音' : r && r.tone === 5 ? '轻声没有单字录音' : '没有录音') + '">' + esc(tok) + '</span>';
      var sd = real && real[z] ? '读 ' + esc(real[z]) : '';
      out += '<span class="zi">' + (real ? '<span class="sd">' + sd + '</span>' : '') + pyb + '<a href="zika.html?zi=' + encodeURIComponent(z) + '" title="打开「' + esc(z) + '」字卡">' + esc(z) + '</a></span>';
    });
    return '<div class="sent">' + out + '</div>';
  }

  /* ---------------- 声调路（anim tone-road） ---------------- */
  function pitch(tone, t) {
    var c = CONTOUR[tone];
    for (var i = 0; i < c.length - 1; i++) {
      if (t <= c[i + 1][0] || i === c.length - 2) {
        var a = c[i], b = c[i + 1], u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
        return a[1] + (b[1] - a[1]) * (1 - Math.cos(u * Math.PI)) / 2;
      }
    }
    return c[c.length - 1][1];
  }
  function drawRoad(cv, tone, p) {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 200, h = cv.clientHeight || 150;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    var L = LV === 3 ? 30 : 22, R = LV === 3 ? 52 : 22, T = LV === 3 ? 18 : 32, B = LV === 3 ? 16 : 12;
    var X = function (t) { return L + t * (w - L - R); }, Y = function (v) { return T + (5 - v) / 4 * (h - T - B); };
    var col = css('--t' + tone) || css('--accent'), ink = css('--ink'), muted = css('--muted'), soft = css('--accent-soft'), line = css('--line');
    var N = 60, i, t;
    if (LV === 3) {
      g.font = '12px system-ui,sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (i = 1; i <= 5; i++) { g.strokeStyle = line; g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(i)); g.lineTo(w - R, Y(i)); g.stroke(); g.fillStyle = muted; g.fillText(String(i), L - 8, Y(i)); }
      g.setLineDash([]);
      var bx = w - 12; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, Y(5)); g.lineTo(bx, Y(1)); g.stroke();
      g.beginPath(); for (i = 0; i <= N; i++) { t = i / N; var xx = bx - 30 + t * 30, yy = Y(pitch(tone, t)); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke();
    } else {
      g.fillStyle = soft; g.beginPath(); g.moveTo(X(0), h);
      for (i = 0; i <= N; i++) { t = i / N; g.lineTo(X(t), Y(pitch(tone, t)) + 4); }
      g.lineTo(X(1), h); g.closePath(); g.fill();
    }
    g.strokeStyle = col; g.lineWidth = LV === 3 ? 4 : 6; g.lineCap = 'round'; g.beginPath();
    for (i = 0; i <= N; i++) { t = i / N; var x = X(t), y = Y(pitch(tone, t)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    if (LV === 3) { g.fillStyle = col; g.font = '700 22px system-ui,sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(VAL[tone], L + 4, tone === 3 ? T - 4 : h - B - 26); }
    if (LV === 2) {
      /* 调号用线条画（调号字形在很多字体里太小）：放在离路远的角——一二声右下，三声左上，四声右上 */
      var mw = 34, mh = 22, mx0 = tone === 3 ? L + 2 : w - R - mw - 4, my0 = tone >= 3 ? 6 : h - B - mh - 6;
      var MK = { 1: [[0, .5], [1, .5]], 2: [[0, 1], [1, 0]], 3: [[0, 0], [.5, 1], [1, 0]], 4: [[0, 0], [1, 1]] }[tone];
      g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      MK.forEach(function (pt, k) { var xx2 = mx0 + pt[0] * mw, yy2 = my0 + pt[1] * mh; if (k) g.lineTo(xx2, yy2); else g.moveTo(xx2, yy2); });
      g.stroke();
    }
    var px = X(p), py = Y(pitch(tone, p)), d = 0.01;
    var ang = Math.atan2(Y(pitch(tone, Math.min(1, p + d))) - Y(pitch(tone, Math.max(0, p - d))), X(Math.min(1, p + d)) - X(Math.max(0, p - d)));
    g.save(); g.translate(px, py); g.rotate(ang); if (LV !== 3) g.translate(0, 3);
    if (LV === 3) { g.fillStyle = ink; g.beginPath(); g.arc(0, -7, 7, 0, Math.PI * 2); g.fill(); }
    else {
      g.fillStyle = col; g.strokeStyle = ink; g.lineWidth = 1.5;
      g.beginPath(); if (g.roundRect) g.roundRect(-16, -18, 32, 11, 4); else g.rect(-16, -18, 32, 11); g.fill(); g.stroke();
      g.beginPath(); if (g.roundRect) g.roundRect(-8, -26, 15, 9, 3); else g.rect(-8, -26, 15, 9); g.fill(); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.arc(-9, -5, 4.5, 0, Math.PI * 2); g.arc(9, -5, 4.5, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  function roadSvg(t) {
    var pts = [];
    for (var i = 0; i <= 20; i++) { var u = i / 20; pts.push((4 + u * 32).toFixed(1) + ',' + (4 + (5 - pitch(t, u)) / 4 * 20).toFixed(1)); }
    return '<svg viewBox="0 0 40 28" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--t' + t + ')" stroke-width="3.5" stroke-linecap="round"/></svg>';
  }
  /* 变调：params {from:[3,3], to:[2,3], syl:['ni','hao']} → 「书上写」一行、「读的时候」一行，点一行按顺序走并播放 */
  function animToneSandhi(box, P) {
    var syl = P.syl || [], rows = [['书上写', P.from || []], ['读的时候', P.to || []]];
    box.innerHTML = rows.map(function (r, ri) {
      return '<div class="prow sandhi" data-row="' + ri + '"><span class="lab">' + r[0] + '</span>' + syl.map(function (sy, i) {
        var t = r[1][i] || 1;
        return '<span class="road mini"><span class="rh"><span class="py t' + t + '">' + esc(S.mark(sy, t)) + '</span></span><canvas aria-hidden="true" data-t="' + t + '"></canvas></span>';
      }).join('') + '<button type="button" class="kp-btn" data-sandhi="' + ri + '">▶ 听</button></div>';
    }).join('') + '<p class="note">只有单音节录音：这里按顺序放两个单字，真正说话时要连着读。</p>';
    function draw() { $$('canvas', box).forEach(function (cv) { drawRoad(cv, +cv.getAttribute('data-t'), 0); }); }
    box.addEventListener('click', function (e) {
      var bt = e.target.closest('[data-sandhi]'); if (!bt) return;
      var ri = +bt.getAttribute('data-sandhi'), cvs = $$('.prow[data-row="' + ri + '"] canvas', box);
      cvs.reduce(function (p, cv, i) {
        return p.then(function () {
          var t = +cv.getAttribute('data-t'); play(syl[i], t);
          return new Promise(function (res) {
            var t0 = performance.now(), dur = t === 3 ? 1000 : 750;
            if (reduce) { drawRoad(cv, t, 1); return later(res, dur); }
            (function step(now) { var q = Math.min(1, (now - t0) / dur); drawRoad(cv, t, q); if (q < 1) rafs.push(requestAnimationFrame(step)); else res(); })(t0);
          });
        });
      }, Promise.resolve());
    });
    onLevel.push(draw); draw();
  }
  function animToneRoad(box, b) {
    if (b.params && b.params.from && b.params.to) { animToneSandhi(box, b.params); return; }
    var syls = (b.params && b.params.syls) || [['ma', '妈麻马骂'], ['a', ''], ['ba', '八拔把爸'], ['yi', '衣姨椅意'], ['wu', '乌无五雾']];
    var cur = syls[0][0], prog = { 1: 0, 2: 0, 3: 0, 4: 0 };
    box.innerHTML = '<div class="roads"></div><div class="prow"><span class="lab">换个音节：</span>' + syls.map(function (x, i) {
      return '<button type="button" class="pchip" data-ts="' + esc(x[0]) + '" aria-pressed="' + (i === 0) + '">' + esc(x[0]) + (x[1] ? '<small>' + esc(x[1]) + '</small>' : '') + '</button>';
    }).join('') + '</div><div class="prow"><button type="button" class="kp-btn pri" data-all="1">四段连着走</button><span class="note">只画小车和路。</span></div>';
    var roads = $('.roads', box);
    function chars() { return (syls.filter(function (x) { return x[0] === cur; })[0] || ['', ''])[1]; }
    function draw() {
      roads.innerHTML = [1, 2, 3, 4].map(function (t) {
        var c = chars(), desc = LV === 1 ? ROADN[t][2] : (LV === 2 ? '调号 ' + MARKS[t] + ' 和路一个样' : '调值 ' + VAL[t]);
        return '<button type="button" class="road" data-road="' + t + '"><div class="rh"><b class="t' + t + '">' + ROADN[t][0] + '</b><span class="rd">' + (LV === 3 ? '' : ROADN[t][1]) + '</span>' +
          '<span class="py t' + t + '">' + esc(S.mark(cur, t)) + '</span></div><canvas aria-hidden="true"></canvas><div class="rd">' + esc(desc) + (c ? ' · ' + c.charAt(t - 1) : '') + '</div></button>';
      }).join('');
      $$('.road', roads).forEach(function (r) { var t = +r.getAttribute('data-road'); drawRoad($('canvas', r), t, prog[t]); });
    }
    function run(t) {
      var r = $('.road[data-road="' + t + '"]', roads); if (!r) return Promise.resolve();
      $$('.road', roads).forEach(function (x) { x.classList.remove('playing'); }); r.classList.add('playing');
      play(cur, t);
      var dur = t === 3 ? 1100 : 800, t0 = performance.now(), cv = $('canvas', r);
      return new Promise(function (res) {
        if (reduce) { prog[t] = 1; drawRoad(cv, t, 1); r.classList.remove('playing'); return res(); }
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur); prog[t] = p; drawRoad(cv, t, p);
          if (p < 1) rafs.push(requestAnimationFrame(step)); else { r.classList.remove('playing'); res(); }
        })(t0);
      });
    }
    box.addEventListener('click', function (e) {
      var r = e.target.closest('.road'); if (r) { run(+r.getAttribute('data-road')); return; }
      var s = e.target.closest('[data-ts]');
      if (s) { cur = s.getAttribute('data-ts'); prog = { 1: 0, 2: 0, 3: 0, 4: 0 }; $$('[data-ts]', box).forEach(function (x) { x.setAttribute('aria-pressed', x === s ? 'true' : 'false'); }); draw(); return; }
      var all = e.target.closest('[data-all]');
      if (all) {
        all.disabled = true;
        [1, 2, 3, 4].reduce(function (p, t) { return p.then(function () { return run(t); }).then(function () { return new Promise(function (r2) { later(r2, 350); }); }); }, Promise.resolve())
          .then(function () { all.disabled = false; });
      }
    });
    onLevel.push(draw);
    draw();
  }

  /* ---------------- 碰撞拼读（anim bump / quiz-build 共用） ---------------- */
  function finalAudio(fin) { /* 韵母单念用哪个音节的录音 */ var f = FINAL_AS[fin]; return f || ''; }
  function buildSyl(ini, fin) { /* 声母 + 韵母（书写式）→ 书写音节：j q x 后 ü 写 u */
    var f = fin;
    if (/^[jqx]$/.test(ini) && /^ü/.test(f)) f = 'u' + f.slice(1);
    return ini + f;
  }
  /* parts: [{t, cls:'ini'|'med'|'fin', key:'a1'?}]；res: {t:'bā', key:'ba1'}；hudu: 先播的呼读音；direct: 直呼（不分步） */
  function bumpParts(stage, parts, res, hudu, direct, done) {
    var eq = parts.map(function (x) { return x.t; }).join(' – ') + ' → ';
    stage.innerHTML = '<span class="eq">' + esc(eq + '?') + '</span>' + parts.map(function (x) {
      var k = keyParts(x.key), tag = x.cls === 'fin' ? 'button type="button"' : 'span';
      var au = k && has(k.syl, k.t) ? ' data-syl="' + esc(akey(k.syl)) + '" data-tone="' + k.t + '"' : '';
      var tcls = k ? ' class="t' + k.t + '"' : '';
      return '<' + tag + ' class="bk ' + x.cls + (direct || x.cls === 'fin' ? '' : ' away') + '"' + (x.cls === 'fin' && au ? ' title="点一下听韵母"' : '') + au + '><span' + tcls + '>' + esc(x.t) + '</span></' + tag.split(' ')[0] + '>';
    }).join('');
    var rk = keyParts(res.key);
    return {
      go: function () {
        if (hudu && A && A.hasHudu(hudu)) A.playHudu(hudu);
        $$('.bk.away', stage).forEach(function (x) { x.classList.remove('away'); });
        later(function () {
          if (rk) play(rk.syl, rk.t);
          stage.innerHTML = '<span class="eq">' + esc(eq + res.t) + '</span><button type="button" class="bk merged"' + (rk && has(rk.syl, rk.t) ? ' data-syl="' + esc(akey(rk.syl)) + '" data-tone="' + rk.t + '"' : '') + ' title="再听一遍"><span' + (rk ? ' class="t' + rk.t + '"' : '') + '>' + esc(res.t) + '</span></button>';
          if (done) done(res.t);
        }, reduce || direct ? 0 : (parts.length > 2 ? 320 : 200));
      }
    };
  }
  function bumpStage(stage, ini, med, fin, tone, done) {
    /* ini 声母；med 介母（三拼，可空）；fin 韵母（不带调书写式） */
    var syl = buildSyl(ini, (med || '') + fin), fa = finalAudio((med || '') + fin);
    var parts = [{ t: ini, cls: 'ini' }];
    if (med) parts.push({ t: med, cls: 'med' });
    parts.push({ t: S.mark(fin, tone) || fin, cls: 'fin', key: fa ? fa + tone : '' });
    return bumpParts(stage, parts, { t: S.mark(syl, tone), key: syl + tone }, ini, false, done);
  }
  function animBump(box, b) {
    var P = b.params || {}, steps;
    if (P.steps) { /* 内容约定：{mode:'two'|'three'|'merge'|'direct', steps:[{parts:[{t,play?,hudu?}], result, play}]} */
      steps = P.steps.map(function (st) {
        var n = st.parts.length;
        return { label: st.result, direct: P.mode === 'direct', hudu: (st.parts[0] && st.parts[0].hudu) || '',
          parts: st.parts.map(function (x, i) { return { t: x.t, cls: i === n - 1 ? 'fin' : i === 0 ? 'ini' : 'med', key: x.play || '' }; }),
          res: { t: st.result, key: st.play } };
      });
    } else { /* 简写：{items:['bā','guā'], three:true} */
      steps = (P.items || ['bā', 'pó', 'mǐ', 'fù']).map(function (str) {
        var r = S.parse(str); if (!r.ok || !r.initial) return null;
        var tone = r.tone >= 1 && r.tone <= 4 ? r.tone : 1, fw = r.finalWritten, med = '';
        if (P.three && r.medial && fw.length > 1 && fw.charAt(0) === r.medial.replace('ü', 'u')) { med = fw.charAt(0); fw = fw.slice(1); }
        var parts = [{ t: r.initial, cls: 'ini' }];
        if (med) parts.push({ t: med, cls: 'med' });
        var fa = finalAudio(fw);
        parts.push({ t: S.mark(fw, tone), cls: 'fin', key: fa ? fa + tone : '' });
        return { label: str, parts: parts, res: { t: str, key: (r.audio || '') }, hudu: r.initial, direct: false };
      }).filter(Boolean);
    }
    var idx = 0, ctl = null;
    box.innerHTML = '<div class="prow">' + steps.map(function (x, i) { return '<button type="button" class="pchip" data-bi="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(x.label) + '</button>'; }).join('') + '</div>' +
      '<div class="bump" aria-live="polite"></div><div class="prow"><button type="button" class="kp-btn pri" data-go="1">' + (P.mode === 'direct' ? '直接读' : '碰！') + '</button><button type="button" class="kp-btn" data-re="1">再来</button>' +
      '<span class="note">' + (P.mode === 'direct' ? '看到音节，一口气读出来。' : '两块之间不留空：声母只占极短的一下。') + '</span></div>';
    var stage = $('.bump', box);
    function setup() { var x = steps[idx]; if (!x) return; ctl = bumpParts(stage, x.parts, x.res, x.hudu, x.direct); }
    box.addEventListener('click', function (e) {
      var c = e.target.closest('[data-bi]');
      if (c) { idx = +c.getAttribute('data-bi'); $$('[data-bi]', box).forEach(function (y) { y.setAttribute('aria-pressed', y === c ? 'true' : 'false'); }); setup(); return; }
      if (e.target.closest('[data-go]') && ctl) { ctl.go(); ctl = null; return; }
      if (e.target.closest('[data-re]')) setup();
    });
    setup();
  }

  /* ---------------- 复韵母动程（anim glide）、前后鼻（anim nasal）：静态步进示意图 ----------------
   * 负责人 2026-11-06「不做特效」：只画器官线条和箭头（口形开口、舌位图、口腔侧剖面），不画人脸；点「下一步」看变化。
   * 舌位为示意（通行描写），不是精确测量值。 */
  var GSTEP = ['起点', '滑过去', '收住'];
  function vowelPos(f, ch) { /* 舌位图坐标：x 0=前 1=后，y 0=高 1=低 */
    if (ch === 'i') return [0.04, 0];
    if (ch === 'ü') return [0.14, 0];
    if (ch === 'u') return [1, 0];
    if (ch === 'o') return f === 'ao' ? [0.96, 0.22] : [1, 0.36];
    if (ch === 'e') return f === 'ei' ? [0.16, 0.36] : [0.22, 0.62];
    if (ch === 'a') return f === 'ao' ? [0.9, 1] : [0.12, 1];
    return [0.5, 0.5];
  }
  function isRound(ch) { return ch === 'u' || ch === 'ü' || ch === 'o'; }
  function lipShape(open, round) { return { rx: round ? 20 : (open <= 1 ? 46 : 38), ry: { 1: 7, 2: 16, 3: 28 }[open] || 12 }; }
  function trap(p) { var y = 22 + p[1] * 104, xl = 186 + p[1] * 34; return [xl + p[0] * (306 - xl), y]; }
  function glideSvg(it, step) {
    var op = it.open || [2, 1], rd = it.round || [isRound(it.from) ? 1 : 0, isRound(it.to) ? 1 : 0];
    var a = lipShape(op[0], rd[0]), b = lipShape(op[1], rd[1]);
    var cur = step === 0 ? a : step === 1 ? { rx: (a.rx + b.rx) / 2, ry: (a.ry + b.ry) / 2 } : b;
    var p0 = trap(vowelPos(it.f, it.from)), p1 = trap(vowelPos(it.f, it.to));
    var mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    var h = '<svg class="gsvg" viewBox="0 0 320 150" role="img" aria-label="' + esc(it.f + ' 口形和舌位示意：第 ' + (step + 1) + ' 步') + '">';
    /* 左：口形开口（只画开口线条） */
    h += '<text x="75" y="14" class="glab">嘴张多大</text>';
    if (step > 0) h += '<ellipse cx="75" cy="80" rx="' + a.rx + '" ry="' + a.ry + '" class="gghost"/>';
    h += '<ellipse cx="75" cy="80" rx="' + cur.rx + '" ry="' + cur.ry + '" class="gmouth"/>';
    h += '<text x="75" y="140" class="gcap">' + esc(step === 0 ? it.from : step === 1 ? it.from + ' → ' + it.to : it.to) + (step === 2 || step === 0 ? (((step ? rd[1] : rd[0]) ? ' 圆' : ' 不圆')) : '') + '</text>';
    /* 右：舌位图（梯形），小球从 from 滑到 to */
    h += '<text x="246" y="14" class="glab">舌头在哪儿</text>';
    h += '<polygon points="186,22 306,22 306,126 220,126" class="gtrap"/>';
    h += '<text x="186" y="140" class="gax">前</text><text x="306" y="140" class="gax">后</text><text x="176" y="26" class="gax">高</text><text x="208" y="128" class="gax">低</text>';
    h += '<circle cx="' + p0[0] + '" cy="' + p0[1] + '" r="5" class="gdot0"/><text x="' + (p0[0] + (p0[0] > 280 ? -16 : 16)) + '" y="' + (p0[1] + 5) + '" class="gv">' + esc(it.from) + '</text>';
    h += '<circle cx="' + p1[0] + '" cy="' + p1[1] + '" r="5" class="gdot1' + (step === 2 ? ' on' : '') + '"/><text x="' + (p1[0] + (p1[0] > 280 ? -16 : 16)) + '" y="' + (p1[1] + 5) + '" class="gv">' + esc(it.to) + '</text>';
    if (step >= 1) {
      var ex = step === 1 ? mx : p1[0] - (p1[0] - p0[0]) * 0.12, ey = step === 1 ? my : p1[1] - (p1[1] - p0[1]) * 0.12;
      h += '<line x1="' + p0[0] + '" y1="' + p0[1] + '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '" class="garrow" marker-end="url(#gah)"/>';
      if (it.hidden && step === 1) h += '<text x="' + mx + '" y="' + (my - 8) + '" class="ghid">（' + esc(it.hidden) + '）</text>';
    }
    var ball = step === 0 ? p0 : step === 1 ? [mx, my] : p1;
    h += '<circle cx="' + ball[0] + '" cy="' + ball[1] + '" r="8" class="gball"/>';
    h += '<defs><marker id="gah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="gahd"/></marker></defs>';
    return h + '</svg>';
  }
  function animGlide(box, b) {
    var P = b.params || {}, items = (P.items || []).filter(function (x) { return x && x.f && x.from && x.to; });
    if (!items.length) throw new Error('glide 没有 items');
    var idx = 0, step = 0;
    box.innerHTML = '<div class="prow">' + items.map(function (x, i) { return '<button type="button" class="pchip" data-gi="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(x.f) + '</button>'; }).join('') + '</div>' +
      '<div class="gstage"></div><p class="gcapt" aria-live="polite"></p>' +
      '<div class="prow"><button type="button" class="kp-btn" data-gs="-1">上一步</button><button type="button" class="kp-btn pri" data-gs="1">下一步</button><button type="button" class="kp-btn" data-gplay="1">▶ 听</button>' +
      '<span class="note gnote"></span></div>' + (P.hint ? '<p class="note">' + inline(P.hint) + '</p>' : '') +
      (b.fallback ? '<details class="gfb"><summary>看文字说明</summary><div class="fallback">' + inline(b.fallback) + '</div></details>' : '');
    function cap(it) {
      if (step === 0) return '① 先摆好 ' + it.from + ' 的样子' + (isRound(it.from) ? '（嘴唇圆）' : '') + '。';
      if (step === 1) return '② 一边出声，一边往 ' + it.to + ' 滑，声音不断开' + (it.hidden ? '；中间藏着一个 ' + it.hidden + '（' + it.f + ' 是省写）' : '') + '。';
      return '③ 滑到 ' + it.to + ' 附近就收住：' + it.f + ' 是一个音，不是两下。' + (LV >= 3 ? ' 收尾往往只滑到靠近 ' + it.to + ' 的地方（通行描写，示意图）。' : '');
    }
    function draw() {
      var it = items[idx];
      $('.gstage', box).innerHTML = glideSvg(it, step);
      $('.gcapt', box).textContent = cap(it);
      $('.gnote', box).textContent = '第 ' + (step + 1) + ' / 3 步 · ' + GSTEP[step] + (it.note ? ' · 录音' + it.note : '');
      $('[data-gs="-1"]', box).disabled = step === 0;
      $('[data-gs="1"]', box).disabled = step === 2;
      var k = keyParts(it.play); $('[data-gplay]', box).disabled = !(k && has(k.syl, k.t));
    }
    box.addEventListener('click', function (e) {
      var c = e.target.closest('[data-gi]');
      if (c) { idx = +c.getAttribute('data-gi'); step = 0; $$('[data-gi]', box).forEach(function (y) { y.setAttribute('aria-pressed', y === c ? 'true' : 'false'); }); draw(); return; }
      var s = e.target.closest('[data-gs]'); if (s) { step = Math.max(0, Math.min(2, step + +s.getAttribute('data-gs'))); draw(); return; }
      if (e.target.closest('[data-gplay]')) {
        var k = keyParts(items[idx].play); if (k) play(k.syl, k.t);
        step = 0; draw(); if (!reduce) { later(function () { step = 1; draw(); }, 180); later(function () { step = 2; draw(); }, 420); } else { step = 2; draw(); }
      }
    });
    onLevel.push(draw); draw();
  }

  /* 前后鼻：口腔侧剖面（嘴在左），只画上颚、牙床、软腭、舌头的线条和气流箭头 */
  var NAS_TONGUE = {
    a: 'M36,96 C60,90 108,88 146,102 Q158,116 160,140',
    e: 'M36,90 C60,80 108,76 144,94 Q158,112 160,140',
    i: 'M36,82 C50,66 92,60 138,84 Q156,104 160,140',
    n: 'M46,51 C44,62 62,74 100,77 C128,80 148,98 160,140',
    ng: 'M36,92 C62,90 96,76 120,58 C132,49 144,56 152,80 Q158,104 160,140'
  };
  function nasVowel(f) { var v = String(f).replace(/ng?$/, ''); v = v.charAt(v.length - 1); return v === 'a' ? 'a' : v === 'i' || v === 'ü' ? 'i' : 'e'; }
  function nasalSvg(f, back, step) {
    var vel = step === 0 ? 'M126,42 Q150,44 162,56' : 'M126,42 Q140,48 142,70'; /* 软腭：读元音时抬起关住鼻腔，收鼻音时放下 */
    var tongue = step === 0 ? NAS_TONGUE[nasVowel(f)] : NAS_TONGUE[back ? 'ng' : 'n'];
    var h = '<svg class="nsvg" viewBox="0 0 200 150" role="img" aria-label="' + esc(f + (back ? ' 后鼻' : ' 前鼻') + '口腔侧面示意：第 ' + (step + 1) + ' 步') + '">';
    h += '<path d="M12,40 Q18,30 38,28 L150,26 Q174,28 178,52 L180,146" class="nwall"/>'; /* 鼻腔顶、咽后壁 */
    h += '<text x="100" y="20" class="nlab">鼻腔</text>';
    h += '<path d="M14,48 Q22,52 24,58 L32,58" class="nwall"/><path d="M32,58 L33,70" class="ntooth"/>'; /* 上唇、上牙 */
    h += '<path d="M32,58 Q40,48 52,46 Q90,38 126,42" class="nwall"/>'; /* 牙床、硬腭 */
    h += '<path d="' + vel + '" class="nvel"/>';
    h += '<path d="M33,84 L32,96" class="ntooth"/><path d="M14,104 Q22,100 24,96 L32,96" class="nwall"/>'; /* 下牙、下唇 */
    h += '<path d="' + tongue + '" class="ntongue"/>';
    if (LV >= 2) h += '<path d="M40,14 L44,46" class="nlead"/><text x="38" y="11" class="nlab sm">牙床</text><path d="M168,14 L144,54" class="nlead"/><text x="172" y="11" class="nlab sm">软腭</text>';
    if (step >= 1) {
      var pt = back ? [134, 53] : [46, 50];
      h += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="7" class="nhit"/>';
      h += '<text x="88" y="142" class="nlab">' + (back ? '舌根抬起，贴住软腭' : '舌尖抬起，顶住牙床') + '</text>';
    } else h += '<text x="88" y="142" class="nlab">先读 ' + esc(nasVowel(f) === 'i' ? (f.charAt(0) === 'ü' ? 'ü' : 'i') : nasVowel(f)) + '，嘴张开</text>';
    if (step === 0) h += '<path d="M118,72 Q70,68 6,74" class="nair" marker-end="url(#nah)"/>';
    if (step === 2) h += '<path d="M164,66 Q168,38 148,35 L16,35" class="nair" marker-end="url(#nah)"/>';
    h += '<defs><marker id="nah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="gahd"/></marker></defs>';
    return h + '</svg>';
  }
  function animNasal(box, b) {
    var P = b.params || {};
    var pairs = (P.pairs || []).map(function (p) {
      if (Array.isArray(p)) return { front: { f: p[0] }, back: { f: p[1] } };
      return p && p.front && p.back ? p : null;
    }).filter(Boolean);
    pairs.forEach(function (p) { [p.front, p.back].forEach(function (x) { if (!x.play && FINAL_AS[x.f]) x.play = FINAL_AS[x.f] + '1'; }); });
    if (!pairs.length) throw new Error('nasal 没有 pairs');
    var idx = 0, step = 0;
    var CAP = ['① 先读前面的元音：嘴张开，声音从嘴里出来（软腭抬起，关住鼻腔）。', '② 收尾：', '③ 嘴里的路被舌头堵住，软腭放下，声音从鼻子出来。'];
    box.innerHTML = '<div class="prow">' + pairs.map(function (p, i) { return '<button type="button" class="pchip" data-ni="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(p.front.f + ' / ' + p.back.f) + '</button>'; }).join('') + '</div>' +
      '<div class="nstage"></div><p class="gcapt" aria-live="polite"></p>' +
      '<div class="prow"><button type="button" class="kp-btn" data-ns="-1">上一步</button><button type="button" class="kp-btn pri" data-ns="1">下一步</button>' +
      '<button type="button" class="kp-btn" data-np="front">▶ 听前鼻</button><button type="button" class="kp-btn" data-np="back">▶ 听后鼻</button><span class="note gnote"></span></div>' +
      (b.fallback ? '<details class="gfb"><summary>看文字说明</summary><div class="fallback">' + inline(b.fallback) + '</div></details>' : '');
    function draw() {
      var p = pairs[idx];
      $('.nstage', box).innerHTML = [['front', '前鼻'], ['back', '后鼻']].map(function (s) {
        var x = p[s[0]];
        return '<figure class="ncol"><figcaption><b class="py">' + esc(x.f) + '</b> ' + s[1] + (x.note ? ' <small>录音' + esc(x.note) + '</small>' : '') + '</figcaption>' + nasalSvg(x.f, s[0] === 'back', step) + '</figure>';
      }).join('');
      $('.gcapt', box).textContent = step === 1 ? CAP[1] + (P.front ? '前鼻 —— ' + P.front.replace(/^前鼻[^：]*：/, '') + '；后鼻 —— ' + String(P.back || '').replace(/^后鼻[^：]*：/, '') : '前鼻舌尖往上顶住牙床；后鼻舌尖放下，舌根抬起贴住软腭。') : CAP[step];
      $('.gnote', box).textContent = '第 ' + (step + 1) + ' / 3 步 · 口腔侧面示意图（嘴在左边）';
      $('[data-ns="-1"]', box).disabled = step === 0;
      $('[data-ns="1"]', box).disabled = step === 2;
      ['front', 'back'].forEach(function (s) { var k = keyParts(p[s].play); $('[data-np="' + s + '"]', box).disabled = !(k && has(k.syl, k.t)); $('[data-np="' + s + '"]', box).textContent = '▶ 听 ' + p[s].f; });
    }
    box.addEventListener('click', function (e) {
      var c = e.target.closest('[data-ni]');
      if (c) { idx = +c.getAttribute('data-ni'); step = 0; $$('[data-ni]', box).forEach(function (y) { y.setAttribute('aria-pressed', y === c ? 'true' : 'false'); }); draw(); return; }
      var s = e.target.closest('[data-ns]'); if (s) { step = Math.max(0, Math.min(2, step + +s.getAttribute('data-ns'))); draw(); return; }
      var pl = e.target.closest('[data-np]'); if (pl) { var k = keyParts(pairs[idx][pl.getAttribute('data-np')].play); if (k) play(k.syl, k.t); }
    });
    onLevel.push(draw); draw();
  }

  /* ---------------- 练 ---------------- */
  function quizShell(box, startTxt) {
    box.innerHTML = '<div class="qtop"><button type="button" class="kp-btn pri" data-q="again">▶ 开始</button><button type="button" class="kp-btn" data-q="next">下一题</button><span class="qscore">答对 0 / 0</span></div>' +
      '<div class="qq"></div><div class="qopts"></div><div class="qfb" aria-live="polite">' + esc(startTxt) + '</div>';
  }
  /* 听音选韵母的标准答案（韵母表里的写法）：j q x 后的 u 还原成 ü（jué → üe、jūn → ün）；
     y w 开头的零声母音节取韵母本身（yǔ → ü、yún → ün、yuè → üe、wǔ → u、yī → i；iou/uei/uen 用表里的 iu/ui/un） */
  function finalAnswer(r) {
    if (!r.initial && r.final && /^[yw]/.test(r.written || '')) return ({ iou: 'iu', uei: 'ui', uen: 'un' })[r.final] || r.final;
    var fw = r.finalWritten || r.written;
    return /^[jqx]$/.test(r.initial) && /^u/.test(fw) ? 'ü' + fw.slice(1) : fw;
  }
  function quizListen(box, b) {
    var pool = (b.pool || []).map(keyParts).filter(function (k) { return k && has(k.syl, k.t); });
    var ask = b.ask, q = null, right = 0, total = 0, answered = false;
    function answerOf(k) {
      var r = S.parse(k.syl + k.t);
      if (ask === 'tone') return String(k.t);
      if (ask === 'initial') return r.initial || '零声母';
      if (ask === 'final') return finalAnswer(r);
      return S.mark(k.syl, k.t);
    }
    var allOpts = b.options || (ask === 'tone' ? ['1', '2', '3', '4'] : pool.map(answerOf).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    function optLabel(v) {
      if (ask === 'tone') return roadSvg(+v) + '<span class="py t' + v + '">' + S.mark('a', +v) + '</span><span>' + ROADN[v][0] + '</span>';
      return '<span class="py">' + esc(v) + '</span>';
    }
    function next() {
      var k = pick(pool); q = { k: k, ans: answerOf(k) }; answered = false;
      var opts = allOpts.slice();
      if (ask !== 'tone' && opts.length > 4) opts = shuffle([q.ans].concat(shuffle(opts.filter(function (o) { return o !== q.ans; })).slice(0, 3)));
      if (opts.indexOf(q.ans) < 0) opts = shuffle([q.ans].concat(opts.slice(0, 3)));
      $('.qopts', box).innerHTML = opts.map(function (o) { return '<button type="button" class="qopt" data-ans="' + esc(o) + '">' + optLabel(o) + '</button>'; }).join('');
      $('[data-q="again"]', box).textContent = '▶ 再听一遍';
      $('.qfb', box).textContent = ask === 'tone' ? '听一听，是哪一种路？' : ask === 'initial' ? '这个音节的声母是哪一个？' : ask === 'final' ? '这个音节的韵母是哪一个？' : '听到的是哪个音节？';
      play(k.syl, k.t);
    }
    quizShell(box, '点「开始」出题并播放。');
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      var c = btn.getAttribute('data-q');
      if (c === 'again') { if (q) play(q.k.syl, q.k.t); else next(); return; }
      if (c === 'next') { next(); return; }
      if (btn.hasAttribute('data-cmp')) { var kp = keyParts(btn.getAttribute('data-cmp')); if (kp) play(kp.syl, kp.t); return; }
      var a = btn.getAttribute('data-ans'); if (a == null || !q) return;
      if (answered) return;
      answered = true; total++;
      var ok = a === q.ans; if (ok) right++;
      $$('.qopt', box).forEach(function (o) { var v = o.getAttribute('data-ans'); if (v === q.ans) o.classList.add('right'); else if (v === a) o.classList.add('wrong'); });
      $('.qscore', box).textContent = '答对 ' + right + ' / ' + total;
      var said = '<span class="py t' + q.k.t + '">' + esc(S.mark(q.k.syl, q.k.t)) + '</span>';
      var fb = ok ? '<span class="ok">对了！</span> 是 ' + said + '。' : '<span class="no">再听听。</span> 刚才是 ' + said + '。';
      if (!ok && ask === 'tone' && has(q.k.syl, +a)) {
        fb += ' 对比听：<button type="button" class="pchip" data-cmp="' + esc(q.k.syl + q.k.t) + '"><span class="t' + q.k.t + '">' + esc(S.mark(q.k.syl, q.k.t)) + '</span></button>' +
          '<button type="button" class="pchip" data-cmp="' + esc(q.k.syl + a) + '"><span class="t' + a + '">' + esc(S.mark(q.k.syl, +a)) + '</span></button>';
      } else if (!ok) {
        var other = pool.filter(function (k) { return answerOf(k) === a && k.t === q.k.t; })[0] || pool.filter(function (k) { return answerOf(k) === a; })[0];
        if (other) fb += ' 对比听：<button type="button" class="pchip" data-cmp="' + esc(q.k.syl + q.k.t) + '">' + esc(S.mark(q.k.syl, q.k.t)) + '</button><button type="button" class="pchip" data-cmp="' + esc(other.syl + other.t) + '">' + esc(S.mark(other.syl, other.t)) + '</button>';
      }
      if (b.tip && !ok) fb += ' <span class="note">' + inline(b.tip) + '</span>';
      $('.qfb', box).innerHTML = fb;
    });
  }
  function quizChoose(box, b) {
    var order = shuffle(b.items || []), k = -1, right = 0, total = 0, answered = false;
    box.innerHTML = '<div class="qtop"><span class="target"></span><span class="qscore">答对 0 / 0</span></div><div class="qq"></div><div class="qopts"></div><div class="qfb" aria-live="polite"></div>' +
      '<div class="prow"><button type="button" class="kp-btn" data-q="next">下一题</button></div>';
    function next() {
      k = (k + 1) % order.length; answered = false;
      var it = order[k], idx = shuffle(it.options.map(function (_, i) { return i; }));
      $('.target', box).textContent = '第 ' + (k + 1) + ' / ' + order.length + ' 题';
      $('.qq', box).innerHTML = inline(it.q);
      $('.qopts', box).innerHTML = idx.map(function (i) { return '<button type="button" class="qopt" data-i="' + i + '">' + inline(it.options[i], true) + '</button>'; }).join('');
      $('.qfb', box).innerHTML = '';
    }
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      if (btn.getAttribute('data-q') === 'next') { next(); return; }
      var i = btn.getAttribute('data-i');
      if (i == null || btn.classList.contains('pyi')) return;
      if (answered) return;
      answered = true; total++;
      var it = order[k], ok = +i === it.answer; if (ok) right++;
      $$('.qopt', box).forEach(function (o) { var v = +o.getAttribute('data-i'); if (v === it.answer) o.classList.add('right'); else if (v === +i) o.classList.add('wrong'); });
      $('.qscore', box).textContent = '答对 ' + right + ' / ' + total;
      $('.qfb', box).innerHTML = (ok ? '<span class="ok">对了！</span> ' : '<span class="no">再想想。</span> 答案是「' + inline(it.options[it.answer]) + '」。 ') + (it.why ? inline(it.why) : '');
    });
    if (order.length) next();
  }
  function quizBuild(box, b) {
    var inis = b.initials || [], fins = b.finals || [], tones = b.tones || [1, 2, 3, 4];
    var st = { i: inis[0], f: fins[0], t: tones[0] }, ctl = null;
    box.innerHTML = '<div class="prow"><span class="lab">声母</span><span class="bsel" data-row="i"></span></div><div class="prow"><span class="lab">韵母</span><span class="bsel" data-row="f"></span></div>' +
      '<div class="prow"><span class="lab">声调</span><span class="bsel" data-row="t"></span></div><div class="bump" aria-live="polite"></div>' +
      '<div class="prow"><button type="button" class="kp-btn pri" data-go="1">碰！</button><button type="button" class="kp-btn" data-re="1">再来</button><span class="note qmsg"></span></div>';
    function legal(i, f, t) { var s = buildSyl(i, f); return S.isLegal(s) && has(s, t); }
    function row(key, list, lab) {
      $('[data-row="' + key + '"]', box).innerHTML = list.map(function (v) {
        var ok = key === 'i' ? fins.some(function (f) { return legal(v, f, st.t); }) : key === 'f' ? legal(st.i, v, st.t) : legal(st.i, st.f, v);
        return '<button type="button" class="pchip' + (ok ? '' : ' mute') + '" data-' + key + '="' + esc(v) + '" aria-pressed="' + (String(v) === String(st[key])) + '">' + (lab ? lab(v) : esc(v)) + '</button>';
      }).join('');
    }
    function render() {
      row('i', inis); row('f', fins); row('t', tones, function (t) { return '<span class="t' + t + '">' + S.mark('a', t) + ' ' + ROADN[t][0] + '</span>'; });
      var s = buildSyl(st.i, st.f), ok = legal(st.i, st.f, st.t);
      ctl = ok ? bumpStage($('.bump', box), st.i, '', st.f, st.t, function (out) { $('.qmsg', box).textContent = '碰出来了：' + out + '。点它再听一遍。'; }) : null;
      if (!ok) $('.bump', box).innerHTML = '<span class="eq">' + esc(st.i + ' – ' + st.f) + '</span><span class="note">普通话里没有 ' + esc(s) + (S.isLegal(s) ? '（这个声调没有录音）' : '') + ' 这个音节</span>';
      $('[data-go]', box).disabled = !ok;
      $('.qmsg', box).textContent = ok ? '先点韵母块听一听，再点「碰！」' : st.i + ' 和 ' + st.f + ' 不能这样拼。';
    }
    box.addEventListener('click', function (e) {
      var c = e.target.closest('[data-i],[data-f],[data-t]');
      if (c && c.closest('.bsel')) {
        if (c.hasAttribute('data-i')) st.i = c.getAttribute('data-i');
        if (c.hasAttribute('data-f')) st.f = c.getAttribute('data-f');
        if (c.hasAttribute('data-t')) st.t = +c.getAttribute('data-t');
        render(); return;
      }
      if (e.target.closest('[data-go]') && ctl) { ctl.go(); ctl = null; $('[data-go]', box).disabled = true; return; }
      if (e.target.closest('[data-re]')) render();
    });
    render();
  }
  function markReason(w, idx) {
    var ch = w.charAt(idx), p = S.parse(w);
    if (w.indexOf('a') >= 0) return '有 a 就标在 a 上。';
    if (/[oe]/.test(w)) return '没有 a，就找 ' + ch + '。';
    if (/iu|ui/.test(w)) {
      var s = '没有 a、o、e，i 和 u 并排，标在后一个 ' + ch + ' 上。';
      if (LV >= 3 && p.ok) s += ' 学理：' + w + ' 是 ' + p.initial + ' + ' + p.final + ' 的省写，韵腹 ' + p.nucleus + ' 没写出来，所以规定标在后一个字母上。';
      return s;
    }
    return '只有一个元音，就标在它上面' + (ch === 'i' ? '；标在 i 上时，i 的点要去掉。' : '。');
  }
  function quizMark(box, b) {
    var order = shuffle(b.items || []), k = -1, right = 0, total = 0, done = false, tried = false, tone = 1;
    function render() {
      k = (k + 1) % order.length; done = false; tried = false;
      var w = order[k]; tone = [1, 2, 3, 4].filter(function (t) { return has(w, t); }); tone = tone.length ? pick(tone) : 1 + rnd(4);
      box.innerHTML = '<div class="qtop"><span class="target">给 <b class="py">' + esc(w) + '</b> 标上 <b class="t' + tone + '">' + ROADN[tone][0] + '</b>（像 <span class="py t' + tone + '">' + S.mark('a', tone) + '</span> 上面的调号）：点调号该在的字母</span><span class="qscore">一次答对 ' + right + ' / ' + total + '</span></div>' +
        '<div class="letters">' + w.split('').map(function (c, i) { return '<button type="button" class="letter" data-li="' + i + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<div class="qfb" aria-live="polite"></div><div class="prow"><button type="button" class="kp-btn" data-q="next">下一个</button></div>';
    }
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      if (btn.getAttribute('data-q') === 'next') { render(); return; }
      var i = btn.getAttribute('data-li'); if (i == null || done) return;
      var w = order[k], exp = S.expectedToneIndex(w); i = +i;
      done = i === exp;
      if (!tried) { tried = true; total++; if (done) right++; }
      btn.classList.add(done ? 'right' : 'wrong');
      var marked = S.mark(w, tone);
      if (done) {
        $$('.letter', box).forEach(function (x) { x.disabled = true; });
        btn.textContent = marked.charAt(exp);
        $('.qfb', box).innerHTML = '<span class="ok">对了！</span> ' + sylBtn(marked, 'pchip') + ' ' + esc(markReason(w, exp));
        if (has(w, tone)) play(w, tone);
      } else $('.qfb', box).innerHTML = '<span class="no">不在 ' + esc(w.charAt(i)) + ' 上。</span> 想想口诀：有 a 不放过，没有 a 找 o e，i u 并列标在后。';
      $('.qscore', box).textContent = '一次答对 ' + right + ' / ' + total;
    });
    if (order.length) render();
  }
  function quizFind(box, b) {
    var n = b.n || 12;
    function round() {
      var target = b.target, cnt = Math.max(2, Math.round(n / 3)), found = 0, tiles = [];
      for (var i = 0; i < n; i++) tiles.push(i < cnt ? target : pick(b.distract));
      tiles = shuffle(tiles);
      box.innerHTML = '<div class="target">点出所有的 <b class="py">' + esc(target) + '</b></div><div class="grid-tiles">' + tiles.map(function (c) { return '<button type="button" class="tile" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<div class="prow"><span class="qfb" aria-live="polite">一共 ' + cnt + ' 个，找到 0 个。</span><button type="button" class="kp-btn" data-q="next" style="margin-left:auto">换一盘</button></div>';
      box.onclick = function (e) {
        var bt = e.target.closest('button'); if (!bt) return;
        if (bt.getAttribute('data-q') === 'next') { round(); return; }
        if (!bt.classList.contains('tile') || bt.classList.contains('right')) return;
        var c = bt.getAttribute('data-c');
        if (c === target) { bt.classList.add('right'); found++; $('.qfb', box).textContent = found === cnt ? '全找到了！' : '一共 ' + cnt + ' 个，找到 ' + found + ' 个。'; }
        else { bt.classList.add('wrong'); $('.qfb', box).textContent = '这个是 ' + c + '，再看看。'; later(function () { bt.classList.remove('wrong'); }, 900); }
      };
    }
    round();
  }

  /* ---------------- 看：情境卡、镜子 ---------------- */
  function sceneHtml(b) {
    return '<div class="scenes">' + (b.items || []).map(function (it) {
      var cap = '<b>' + esc(it.letter) + '</b>' + esc(it.thing || '') + (it.word ? '。' + esc(it.word) + (it.py ? ' <span class="py">' + esc(it.py) + '</span>' : '') : '');
      return '<button type="button" class="scene" data-letter="' + esc(it.letter) + '"' + (it.py ? ' data-word="' + esc(it.py) + '"' : '') + '><div class="pic">' + (it.svg || '') +
        '<span class="sl" aria-hidden="true">' + esc(it.letter) + '</span></div><div class="sc">' + cap + '</div></button>';
    }).join('') + '</div>';
  }
  var MNAME = { '1,1': 'b', '-1,1': 'd', '1,-1': 'p', '-1,-1': 'q' };
  var MTIP = { b: 'b 的肚子在竖线右下边。左右一翻就成了 d，上下一翻就成了 p。', d: 'd：肚子跑到了竖线左下边。', p: 'p：竖线朝下，肚子在右上边。', q: 'q：竖线朝下，肚子在左上边。' };
  function mirror(box, b) {
    var base = b.base || 'b', mx = 1, my = 1;
    var start = { b: [1, 1], d: [-1, 1], p: [1, -1], q: [-1, -1] }[base] || [1, 1];
    box.innerHTML = '<div class="mirror"><div class="mglyph" aria-live="polite"><span>b</span></div><div><div class="mname py">' + esc(base) + '</div>' +
      '<div class="prow"><button type="button" class="kp-btn" data-m="lr">左右翻</button><button type="button" class="kp-btn" data-m="ud">上下翻</button><button type="button" class="kp-btn" data-m="0">回到 ' + esc(base) + '</button></div>' +
      '<div class="mtips"></div></div></div>';
    function upd() {
      var sx = mx * start[0], sy = my * start[1], n = MNAME[sx + ',' + sy];
      $('.mglyph span', box).style.transform = 'scale(' + sx + ',' + sy + ')';
      $('.mname', box).textContent = n; $('.mtips', box).textContent = MTIP[n];
      if (A && A.hasHudu(n)) A.playHudu(n);
    }
    box.addEventListener('click', function (e) {
      var m = e.target.closest('[data-m]'); if (!m) return;
      var k = m.getAttribute('data-m'); if (k === 'lr') mx = -mx; else if (k === 'ud') my = -my; else { mx = 1; my = 1; }
      upd();
    });
    var sx = start[0], sy = start[1]; $('.mglyph span', box).style.transform = 'scale(' + sx + ',' + sy + ')'; $('.mtips', box).textContent = MTIP[base] || '';
  }

  /* ---------------- 块 ---------------- */
  var LATER = []; /* 需要 DOM 就绪后再挂交互的块 */
  function blockHtml(b, bi) {
    var lv = b.lv || 1, id = 'kpb' + bi;
    var head = b.h ? '<div class="blk-h"><b>' + inline(b.h || '') + '</b>' + (lv > 1 ? '<span class="tag">L' + lv + '</span>' : '') + '</div>' : (lv > 1 ? '<div class="blk-h"><span class="tag">L' + lv + '</span></div>' : '');
    var body = '';
    switch (b.type) {
      case 'text': body = (b.p || []).map(function (p) { return '<p>' + inline(p) + '</p>'; }).join(''); break;
      case 'outline': body = (b.p || []).map(function (p) { return '<p>' + inline(p) + '</p>'; }).join(''); break;
      case 'chips': body = chipRow(b.items); break;
      case 'groups': body = (b.groups || []).map(function (g) { return '<div class="prow"><span class="lab">' + esc(g.label) + '</span>' + (g.items || []).map(chip).join('') + '</div>'; }).join(''); break;
      case 'table': body = '<div class="tblwrap"><table class="ptable"><tr>' + (b.head || []).map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr>' +
        (b.rows || []).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; break;
      case 'pairs': body = '<div class="prow">' + (b.pairs || []).map(function (p) { return '<span class="pair">' + chip(p[0]) + '<span class="sl">/</span>' + chip(p[1]) + '</span>'; }).join('') + '</div>' + (b.tip ? '<p class="note">' + inline(b.tip) + '</p>' : ''); break;
      case 'scene': body = sceneHtml(b); break;
      case 'words': body = '<div class="pwords">' + (b.items || []).map(function (it) { return '<div class="word">' + zis(it.w, it.py) + '</div>'; }).join('') + '</div>'; break;
      case 'verse': body = (b.title ? '<div class="verse-t">' + esc(b.title) + '</div>' : '') + (b.lines || []).map(function (l) { return zis(l.w, l.py, b.real); }).join(''); break;
      case 'anim':
        if (b.kind === 'tone-road' || b.kind === 'bump' || b.kind === 'glide' || b.kind === 'nasal') { body = '<div class="kp-mount" id="' + id + '"></div>'; LATER.push([id, b]); }
        else body = '<div class="fallback">' + inline(b.fallback || '动画还在做，先看文字说明。') + '</div>';
        break;
      case 'mirror': case 'quiz-listen': case 'quiz-choose': case 'quiz-build': case 'quiz-mark': case 'quiz-find':
        body = '<div class="' + (b.type === 'mirror' ? 'kp-mount' : 'quiz') + '" id="' + id + '"></div>'; LATER.push([id, b]); break;
      default: body = '';
    }
    if (b.p && b.type !== 'text' && b.type !== 'outline') body += b.p.map(function (p) { return '<p>' + inline(p) + '</p>'; }).join('');
    return '<div class="blk' + (b.type === 'outline' ? ' kp-outline' : '') + '" data-lv="' + lv + '" data-type="' + esc(b.type) + '">' + head + body + (b.note ? '<p class="note">' + inline(b.note) + '</p>' : '') + '</div>';
  }
  function mount(id, b) {
    var el = document.getElementById(id); if (!el) return;
    try {
      if (b.type === 'anim' && b.kind === 'tone-road') animToneRoad(el, b);
      else if (b.type === 'anim' && b.kind === 'bump') animBump(el, b);
      else if (b.type === 'anim' && b.kind === 'glide') animGlide(el, b);
      else if (b.type === 'anim' && b.kind === 'nasal') animNasal(el, b);
      else if (b.type === 'mirror') mirror(el, b);
      else if (b.type === 'quiz-listen') quizListen(el, b);
      else if (b.type === 'quiz-choose') quizChoose(el, b);
      else if (b.type === 'quiz-build') quizBuild(el, b);
      else if (b.type === 'quiz-mark') quizMark(el, b);
      else if (b.type === 'quiz-find') quizFind(el, b);
    } catch (e) {
      /* 没画出来：有 fallback 就退回静态文字说明 */
      el.innerHTML = b.fallback ? '<div class="fallback">' + inline(b.fallback) + '</div>' : '<p class="note">这一块没能显示（' + esc(e.message) + '）</p>';
      if (window.console) console.error(e);
    }
  }

  function applyLevel() {
    if (!root) return;
    root.setAttribute('data-level', LV);
    $$('.kp-seg button').forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-lv') === LV ? 'true' : 'false'); });
    $$('.blk[data-lv]').forEach(function (el) { el.classList.toggle('lvhide', +el.getAttribute('data-lv') > LV); });
    $$('.more').forEach(function (m) { m.parentNode.removeChild(m); });
    $$('.stage').forEach(function (st) {
      var hid = $$('.blk[data-lv]', st).filter(function (b) { return +b.getAttribute('data-lv') > LV; }).length;
      if (hid) st.insertAdjacentHTML('beforeend', '<div class="more">深一点还有 ' + hid + ' 块（选「' + LVN[LV] + '」' + (LV === 1 ? '或「深」' : '') + '可看）</div>');
    });
    onLevel.forEach(function (f) { f(); });
  }
  function setLevel(n) {
    LV = Math.max(1, Math.min(3, +n || 2));
    try { localStorage.setItem(LS_KEY, String(LV)); } catch (e) { /* 忽略 */ }
    applyLevel();
  }

  function render(el, c, m) {
    stop(); onLevel = []; LATER = [];
    root = el;
    var bi = 0;
    var h = '<div class="kp" data-kp="' + esc(c.id) + '"><div class="kp-head"><h2>' + esc(c.name || (m && m.name)) + '</h2>' + (m && m.ex ? '<span class="ex">' + esc(m.ex) + '</span>' : '') + (c.lv ? '<span class="tag">' + esc(c.lv) + '</span>' : '') + '</div>' +
      '<p class="kp-lead">' + inline(c.lead || '') + '</p>' +
      '<div class="kp-nav">' + STAGES.map(function (s) { return '<button type="button" class="kp-btn kp-jump" data-to="kp-' + s[0] + '">' + s[1] + '</button>'; }).join('') +
      '<div class="kp-seg" role="group" aria-label="深浅档位">' + [1, 2, 3].map(function (l) { return '<button type="button" data-lv="' + l + '" aria-pressed="' + (l === LV) + '">' + LVN[l - 1] + '<small>L' + l + '</small></button>'; }).join('') + '</div></div>';
    STAGES.forEach(function (s) {
      h += '<section class="stage" id="kp-' + s[0] + '"><h3><span class="sn">' + s[1] + '</span>' + s[1] + ' <small>' + s[2] + '</small></h3>';
      (c[s[0]] || []).forEach(function (b) { h += blockHtml(b, bi++); });
      h += '</section>';
    });
    if (c.src && c.src.length) h += '<p class="kp-src">依据：' + c.src.map(inline).join('；') + '。讲解、例词、儿歌均为自编。</p>';
    h += '</div>';
    el.innerHTML = h;
    root = el.querySelector('.kp');
    LATER.forEach(function (x) { mount(x[0], x[1]); });
    applyLevel();
  }

  /* 全局点击：段内跳转、档位、发音、四声条、情境卡 */
  document.addEventListener('click', function (e) {
    if (!root || !root.isConnected || !root.contains(e.target)) return;
    var j = e.target.closest('.kp-jump');
    if (j) { var t = document.getElementById(j.getAttribute('data-to')); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return; }
    var l = e.target.closest('.kp-seg button'); if (l) { setLevel(l.getAttribute('data-lv')); return; }
    var sc = e.target.closest('.scene');
    if (sc) {
      sc.classList.toggle('show');
      var lt = sc.getAttribute('data-letter');
      if (A && A.hasHudu(lt)) A.playHudu(lt);
      else { var wd = segment(sc.getAttribute('data-word') || ''); if (wd && wd[0]) { var r = S.parse(wd[0]); if (r.audio) play(r.written, r.tone); } }
      return;
    }
    var c = e.target.closest('.py-chip.is-play');
    if (c) {
      var k = c.getAttribute('data-kind');
      if (k === 'tones') { openTones(c); return; }
      if (k === 'hudu') { A.playHudu(c.getAttribute('data-ini')); return; }
    }
    var p = e.target.closest('[data-syl][data-tone]');
    if (p && !p.disabled && !p.closest('.road')) {
      play(p.getAttribute('data-syl'), +p.getAttribute('data-tone'));
      p.classList.add('flash'); later(function () { p.classList.remove('flash'); }, 450);
    }
  });
  var rz = null;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (root && root.isConnected) onLevel.forEach(function (f) { f(); }); }, 150); });

  window.NHZPinyinKP = { render: render, stop: stop, level: function () { return LV; }, setLevel: setLevel, segment: segment };
})();
