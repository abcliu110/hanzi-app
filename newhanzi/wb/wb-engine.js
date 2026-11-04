/* 识字星球 · 语法白板动画引擎（规范：docs/anim/baiban-yufa-guifan.md）
 * 依赖：wb/rough.js（rough.js 4.6.6，MIT）。挂 window.NHZWB。
 * 画面只由时间 t 决定（纯函数）：任意拖动到 t 都画出同一帧；固定 seed，不用随机数和时钟。
 *
 * 场景数据：NHZWB.add('名词', { scenes: [ {k:'模板名', ...参数}, ... ] })
 * 每个模板把参数排成若干「拍」（beat）：一句旁白 + 这句旁白期间画的东西。
 * 拍长 = max(画的时长, 旁白字数 / 3.5 字每秒 + 0.6 秒)；带 ask 的拍先停 4 秒「想一想」再揭晓。
 *
 * 模板（参数见各函数注释）：
 *   title  标题 + 口诀/一句话          cards  分类卡片（2–6 张）
 *   test   试搭配 ✓✗（每行一试）        mark   句子标注（符号帽 / 变灰 / 注释 / 提问）
 *   vs     左右对照辨析                 slots  槽位结构 + 零件替换 + 红线警示
 *   fix    病句：圈错 → 说原因 → 改对     link   两个分句 + 关联词 + 关系箭头
 *   rel    短语/成分：两块之间的关系箭头    steps  步骤卡
 *   line   时间轴                       end    口诀收尾
 * 词类符号 sym：noun adj pron verb adv prep conj interj（蒙氏），num quant aux part（灰底标签）。
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1200, H = 560;
  var INK = '#2c3328', GRAY = '#a3aa9c', ACC = '#c46a2b', OK = '#3f8e6b', BAD = '#b85a52', BLUE = '#4a7a8c', LINE = '#d5dfd0';
  var FONT = '"LXGW WenKai","Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC","Songti SC",serif';
  var SYM = {
    noun: ['名词', '#26221c', 'tri'], adj: ['形容词', '#274b8f', 'tri'], pron: ['代词', '#7b4ba8', 'tri'],
    verb: ['动词', '#c22f2f', 'circle'], adv: ['副词', '#e07b24', 'circle-sm'], prep: ['介词', '#3d8a4f', 'crescent'],
    conj: ['连词', '#d96a9b', 'bar'], interj: ['叹词', '#c9a227', 'excl'],
    num: ['数词', '#6b7566', 'tag'], quant: ['量词', '#6b7566', 'tag'], aux: ['助词', '#6b7566', 'tag'], part: ['语气词', '#6b7566', 'tag']
  };
  var REG = {};
  var CPS = 3.5;          /* 旁白每秒字数（三四年级慢速档） */
  var THINK = 4;          /* 先猜停顿秒数 */

  /* ---------- 基础工具 ---------- */
  function cl(x, a, b) { a = a || 0; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, x)); }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function P(t, t0, d) { return cl((t - t0) / (d || 1e-6)); }
  function len(s) { return String(s || '').replace(/[，。、；：！？“”‘’（）《》…—\s,.!?;:()]/g, '').length; }
  function sayDur(s) { return s ? len(s) / CPS + 0.6 : 0; }
  function textW(s, size) { var w = 0; String(s).split('').forEach(function (c) { w += /[\x00-\xff]/.test(c) ? size * .55 : size; }); return w; }

  /* ---------- 绘制上下文（每幕重建一次 DOM，之后只按 t 改属性） ---------- */
  function Ctx(svg, seed) {
    this.svg = svg; this.items = []; this.seed = seed; this.uid = 0;
    this.defs = this.E('defs', {}, svg); this.cur = this.E('g', {}, svg);
    this.rc = window.rough.svg(svg);
  }
  Ctx.prototype.E = function (tag, a, par) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    (par || this.cur).appendChild(e); return e;
  };
  Ctx.prototype.add = function (f) { this.items.push(f); };
  Ctx.prototype.G = function (fn) { var g = this.E('g', {}), o = this.cur; this.cur = g; if (fn) fn(g); this.cur = o; return g; };
  /* rough 图形，按 t 一笔一笔画出 */
  Ctx.prototype.R = function (kind, args, o, t0, d) {
    d = d || .7;
    var opt = { roughness: 1.1, bowing: 1, stroke: INK, strokeWidth: 2.4, seed: ++this.seed };
    for (var k in (o || {})) opt[k] = o[k];
    var g = this.rc[kind].apply(this.rc, args.concat([opt])); this.cur.appendChild(g);
    var ps = Array.prototype.slice.call(g.querySelectorAll('path'));
    ps.forEach(function (p) { if (p.getAttribute('stroke') !== 'none') { p.setAttribute('pathLength', 1); p.style.strokeDasharray = '1 1'; } });
    this.add(function (t) {
      g.style.display = t < t0 ? 'none' : '';
      var q = P(t, t0, d);
      ps.forEach(function (p, i) {
        var qi = cl(q * ps.length - i);
        if (p.getAttribute('stroke') === 'none') p.style.opacity = qi; else p.style.strokeDashoffset = 1 - qi;
      });
    });
    return g;
  };
  /* 手写字：从左到右揭开 */
  Ctx.prototype.T = function (x, y, s, o, t0, d) {
    o = o || {}; t0 = t0 || 0;
    var size = o.size || 34, anchor = o.anchor || 'middle', w = textW(s, size);
    var g = this.E('g', {});
    var tx = this.E('text', { x: x, y: y, 'font-size': size, fill: o.color || INK, 'text-anchor': anchor, 'font-family': FONT, 'font-weight': o.bold ? 700 : 400 }, g);
    tx.textContent = s;
    var id = 'wbc' + this.seed + '_' + (++this.uid), cp = this.E('clipPath', { id: id }, this.defs);
    var x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    var r = this.E('rect', { x: x0 - 6, y: y - size * 1.1, height: size * 1.5, width: 0 }, cp);
    g.setAttribute('clip-path', 'url(#' + id + ')');
    d = d === undefined ? Math.min(1.6, Math.max(.4, len(s) * .12)) : d;
    this.add(function (t) { r.setAttribute('width', (w + 12) * P(t, t0, d)); });
    g.tx = tx; g.w = w; g.x0 = x0; g.x1 = x0 + w; g.cx = x0 + w / 2; g.y = y; g.size = size; g.base = o.color || INK;
    return g;
  };
  Ctx.prototype.fade = function (g, t0, d, out) { this.add(function (t) { var q = P(t, t0, d || .5); g.style.opacity = out ? 1 - q : q; }); };
  Ctx.prototype.show = function (g, a, b) { this.add(function (t) { g.style.display = (t >= a && (b === undefined || t < b)) ? '' : 'none'; }); };
  Ctx.prototype.recolor = function (g, t0, col) { var self = this; this.add(function (t) { g.tx.setAttribute('fill', t >= t0 ? col : g.base); }); };
  Ctx.prototype.slide = function (g, x0, y0, x1, y1, t0, d) {
    this.add(function (t) { var q = ease(P(t, t0, d || .9)); g.setAttribute('transform', 'translate(' + (x0 + (x1 - x0) * q) + ',' + (y0 + (y1 - y0) * q) + ')'); g.style.display = t < t0 ? 'none' : ''; });
  };
  Ctx.prototype.check = function (x, y, t0) { return this.R('linearPath', [[[x - 20, y], [x - 5, y + 18], [x + 24, y - 22]]], { stroke: OK, strokeWidth: 6 }, t0, .5); };
  Ctx.prototype.cross = function (x, y, t0) {
    var s = this; return this.G(function () { s.R('line', [x - 18, y - 18, x + 18, y + 18], { stroke: BAD, strokeWidth: 6 }, t0, .25); s.R('line', [x + 18, y - 18, x - 18, y + 18], { stroke: BAD, strokeWidth: 6 }, t0 + .25, .25); });
  };
  Ctx.prototype.under = function (x1, x2, y, t0, col) { return this.R('line', [x1, y, x2, y], { stroke: col || ACC, strokeWidth: 4 }, t0, .4); };
  Ctx.prototype.ring = function (x, y, w, h, t0, col) { return this.R('ellipse', [x, y, w, h], { stroke: col || BAD, strokeWidth: 3.5 }, t0, .6); };
  Ctx.prototype.box = function (x, y, w, h, t0, o) { return this.R('rectangle', [x, y, w, h], o || {}, t0, .6); };
  /* 弧形箭头 */
  Ctx.prototype.arrow = function (x1, y1, x2, y2, bend, t0, col) {
    var s = this, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - (bend || 0);
    col = col || ACC;
    return this.G(function () {
      s.R('path', ['M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2], { stroke: col, strokeWidth: 3, roughness: .8 }, t0, .6);
      var a = Math.atan2(y2 - my, x2 - mx);
      s.R('linearPath', [[[x2 - 16 * Math.cos(a - .45), y2 - 16 * Math.sin(a - .45)], [x2, y2], [x2 - 16 * Math.cos(a + .45), y2 - 16 * Math.sin(a + .45)]]], { stroke: col, strokeWidth: 3, roughness: .6 }, t0 + .6, .2);
    });
  };
  /* 蒙氏符号帽 */
  Ctx.prototype.sym = function (key, cx, by, s, t0) {
    var d = SYM[key]; if (!d) return null;
    var c = d[1], sh = d[2], self = this, o = { fill: c, fillStyle: 'solid', stroke: c, strokeWidth: 1.5, roughness: .7 };
    if (sh === 'tri') return this.R('polygon', [[[cx, by - s * 1.7], [cx - s, by], [cx + s, by]]], o, t0, .45);
    if (sh === 'circle') return this.R('circle', [cx, by - s, s * 2], o, t0, .45);
    if (sh === 'circle-sm') return this.R('circle', [cx, by - s * .7, s * 1.3], o, t0, .45);
    if (sh === 'crescent') return this.R('path', ['M' + (cx - s) + ' ' + by + ' A' + s + ' ' + (s * 1.2) + ' 0 0 1 ' + (cx + s) + ' ' + by + ' L' + (cx + s * .5) + ' ' + by + ' A' + (s * .5) + ' ' + (s * .7) + ' 0 0 0 ' + (cx - s * .5) + ' ' + by + ' Z'], o, t0, .45);
    if (sh === 'bar') return this.R('rectangle', [cx - s * 1.2, by - s * .9, s * 2.4, s * .9], o, t0, .45);
    if (sh === 'excl') return this.G(function () { self.R('line', [cx, by - s * 1.8, cx, by - s * .7], { stroke: c, strokeWidth: 5 }, t0, .3); self.R('circle', [cx, by - s * .2, s * .45], o, t0 + .3, .15); });
    /* 灰底标签：汉语专用词类 */
    return this.G(function () { self.R('rectangle', [cx - s * 1.5, by - s * 1.3, s * 3, s * 1.3], { stroke: c, strokeWidth: 1.6, roughness: .6 }, t0, .4); self.T(cx, by - s * .3, d[0], { size: s * .85, color: c }, t0 + .2, .3); });
  };
  /* 词卡 */
  Ctx.prototype.card = function (cx, cy, s, t0, o) {
    o = o || {}; var size = o.size || 36, w = Math.max(size * 2.2, textW(s, size) + size * .9), h = size * 1.6, self = this;
    var g = this.G(function () { self.R('rectangle', [cx - w / 2, cy - h / 2, w, h], { stroke: o.color || INK, fill: o.fill, fillStyle: o.fill ? 'solid' : undefined }, t0, .5); self.T(cx, cy + size * .36, s, { size: size, color: o.color || INK, bold: o.bold }, t0 + .3, .4); });
    g.w = w; g.h = h; return g;
  };
  /* 一行句子：返回每个词 {g,cx,x0,x1} */
  Ctx.prototype.sentence = function (y, toks, t0, o) {
    o = o || {}; var size = o.size || 40, gap = o.gap === undefined ? size * .32 : o.gap, self = this;
    var ws = toks.map(function (w) { return textW(w, size); });
    var tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (toks.length - 1);
    var x = (o.cx || W / 2) - tot / 2, out = [];
    toks.forEach(function (w, i) {
      var g = self.T(x + ws[i] / 2, y, w, { size: size, color: o.color }, t0 + i * (o.step || .3), .3);
      out.push({ g: g, cx: x + ws[i] / 2, x0: x, x1: x + ws[i], w: ws[i] }); x += ws[i] + gap;
    });
    return out;
  };
  /* 想一想：右上角倒计时圈 */
  Ctx.prototype.think = function (t0) {
    var s = this, cx = W - 56, cy = 50;
    var g = this.G(function () {
      s.E('circle', { cx: cx, cy: cy, r: 24, fill: 'none', stroke: LINE, 'stroke-width': 6 });
      var c = s.E('circle', { cx: cx, cy: cy, r: 24, fill: 'none', stroke: ACC, 'stroke-width': 6, pathLength: 1, 'stroke-dasharray': '1 1', transform: 'rotate(-90 ' + cx + ' ' + cy + ')' });
      var q = s.E('text', { x: cx, y: cy + 9, 'text-anchor': 'middle', 'font-size': 26, fill: ACC, 'font-family': FONT }); q.textContent = '?';
      s.add(function (t) { c.style.strokeDashoffset = P(t, t0, THINK); });
    });
    this.show(g, t0, t0 + THINK);
  };

  /* ---------- 拍（beat）排时 ---------- */
  function Seq(cx, t0) { this.c = cx; this.t = t0 || .3; this.cues = []; }
  /* say：旁白；draw(t0) 返回画的时长；ask：先停 THINK 秒（字幕显示 “想一想……”） */
  Seq.prototype.beat = function (say, draw, opt) {
    opt = opt || {};
    if (opt.ask) { this.cues.push([this.t, opt.ask === true ? '想一想……' : opt.ask + '想一想……']); this.c.think(this.t); this.t += THINK; }
    if (say) this.cues.push([this.t, say]);
    var dd = draw ? (draw(this.t) || 0) : 0;
    this.t += Math.max(dd, sayDur(say), opt.min || 0) + (opt.gap === undefined ? .35 : opt.gap);
  };

  /* ---------- 模板 ---------- */
  var TPL = {};
  function heading(c, q, s, sub) {
    q.beat(null, function (t) { c.T(W / 2, 64, s, { size: 40, bold: 1 }, t, .8); if (sub) c.T(W / 2, 104, sub, { size: 24, color: GRAY }, t + .5, .6); return .6; }, { gap: .1 });
  }

  /* title：{t:'名词', sym:'noun', one:'一句话', kj:'口诀', say:'旁白'} */
  TPL.title = function (c, q, d) {
    q.beat(d.say || d.t, function (t) {
      if (d.sym) c.sym(d.sym, W / 2 - textW(d.t, 72) / 2 - 50, 200, 22, t);
      c.T(W / 2, 200, d.t, { size: 72, bold: 1 }, t + .2, .9); return 1.2;
    });
    if (d.one) q.beat(d.one, function (t) { c.T(W / 2, 300, d.one, { size: 34 }, t, 1.4); return 1.4; });
    if (d.kj) q.beat('口诀：' + d.kj, function (t) {
      var w = textW(d.kj, 36) + 70; c.box(W / 2 - w / 2, 370, w, 70, t, { stroke: ACC }); c.T(W / 2, 418, d.kj, { size: 36, color: ACC }, t + .4, 1.2); return 1.6;
    });
  };

  /* cards：{h:'分五类', items:[{n:'人物名词', w:'老师 妈妈', ex:'小明在教室里看书。', sym:'noun'}], end:'收尾一句'} */
  TPL.cards = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var n = d.items.length, cols = n <= 3 ? n : n === 4 ? 2 : 3, rows = Math.ceil(n / cols);
    if (n === 4 && d.row) { cols = 4; rows = 1; }
    if (n === 5 || n === 6) { cols = n; rows = 1; }
    var top = d.h ? 140 : 60, bottom = d.end ? 470 : 530, gx = 18, cw = (W - 60 - gx * (cols - 1)) / cols, ch = (bottom - top - 16 * (rows - 1)) / rows;
    var small = cols >= 5;
    d.items.forEach(function (it, i) {
      var col = i % cols, row = Math.floor(i / cols), x = 30 + col * (cw + gx), y = top + row * (ch + 16), cx = x + cw / 2;
      var say = it.say || (it.n + (it.w ? '：' + it.w.replace(/ /g, '、') : '') + (it.ex ? '。比如：' + it.ex : ''));
      q.beat(say, function (t) {
        c.box(x, y, cw, ch, t);
        var yy = y + (small ? 50 : 56);
        if (it.sym) c.sym(it.sym, x + cw - 24, y + 34, 9, t + .3);
        c.T(cx, yy, it.n, { size: small ? 28 : 34, bold: 1 }, t + .4, .6);
        if (it.w) wrap(c, it.w, cx, yy + (small ? 46 : 52), cw - 20, small ? 24 : 28, INK, t + .9);
        if (it.ex) wrap(c, it.ex, cx, Math.min(y + ch - (small ? 70 : 46), yy + (small ? 150 : 170)), cw - 20, small ? 22 : 24, BLUE, t + 1.6);
        return 2.2;
      });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 520, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };
  /* 自动折行文字（按宽度） */
  function wrap(c, s, cx, y, maxw, size, col, t0) {
    var lines = [], cur = '';
    String(s).split('').forEach(function (ch) { if (textW(cur + ch, size) > maxw && cur) { lines.push(cur); cur = ch; } else cur += ch; });
    if (cur) lines.push(cur);
    lines.forEach(function (ln, i) { c.T(cx, y + i * size * 1.3, ln, { size: size, color: col }, t0 + i * .4, .5); });
    return lines.length;
  }

  /* test：{h:'第一招：前面能加数量词吗？', rows:[{p:'三个', w:'书包', ok:true, r:'三个书包，能说，书包是名词。'}]}
   * 每行：词卡 → 试探词滑到前面 → 想一想 → ✓/✗ + 结论 */
  TPL.test = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var rows = d.rows, gapY = rows.length > 2 ? 120 : 160, y0 = d.h ? 200 : 140;
    rows.forEach(function (r, i) {
      var y = y0 + i * gapY, wx = 560, pw = 0;
      q.beat(r.say || ('试试“' + r.w + '”。'), function (t) {
        var wc = c.card(wx, y, r.w, t, { size: 38 });
        if (r.p) {
          var pc = c.G(function () { var g = c.card(0, 0, r.p, t + .8, { size: 38, color: ACC }); pw = g.w; });
          var after = r.after;
          var tx = after ? wx + wc.w / 2 + 70 : wx - wc.w / 2 - 70;
          c.slide(pc, after ? W + 80 : -100, y, tx, y, t + .8, 1);
        }
        return 2;
      });
      q.beat(r.r, function (t) {
        if (r.ok) c.check(840, y - 4, t); else c.cross(840, y - 4, t);
        if (r.note) c.T(1000, y + 10, r.note, { size: 24, color: r.ok ? OK : BAD }, t + .5, .8);
        return 1;
      }, { ask: i === 0 || r.ask ? (r.q || true) : false });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 525, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* mark：{h, s:['小狗','在','院子','里','跑'], say:'朗读句子', ask:'哪些是名词？',
   *        m:[{i:0, sym:'noun', say:'小狗是名词', note:'方位名词'}], gray:[1,4], lines:[{i:[0,1], c:'主语', say}], end} */
  TPL.mark = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var y = d.y || 300, toks;
    q.beat(d.say || d.s.join(''), function (t) { toks = c.sentence(y, d.s, t, { size: d.size || 46 }); return d.s.length * .3 + .4; });
    (d.m || []).forEach(function (m, k) {
      q.beat(m.say, function (t) {
        var idx = [].concat(m.i), a = toks[idx[0]], b = toks[idx[idx.length - 1]], cx = (a.x0 + b.x1) / 2;
        if (m.sym) c.sym(m.sym, cx, y - 58, m.small ? 9 : 13, t);
        if (m.u) c.under(a.x0 - 4, b.x1 + 4, y + 16, t, m.col);
        if (m.ring) c.ring(cx, y - 14, b.x1 - a.x0 + 40, 76, t, m.col || ACC);
        if (m.col) idx.forEach(function (j) { c.recolor(toks[j].g, t, m.col); });
        if (m.note) c.T(cx, y + (m.u ? 62 : 58) + (m.row || 0) * 34, m.note, { size: 24, color: m.col || ACC }, t + .4, .6);
        if (m.up) c.T(cx, y - (m.sym ? 100 : 70), m.up, { size: 24, color: m.col || ACC }, t + .3, .6);
        return .9;
      }, { ask: k === 0 && d.ask ? d.ask : false });
    });
    if (d.gray && d.gray.length) q.beat(d.graySay || '其余的词变灰。', function (t) { d.gray.forEach(function (j) { c.recolor(toks[j].g, t, GRAY); }); return .5; });
    (d.arrows || []).forEach(function (a) {
      q.beat(a.say, function (t) {
        var A = toks[a.f], B = toks[a.t];
        c.arrow(A.cx, y - 50, B.cx, y - 50, a.bend || 70, t, a.col);
        if (a.note) c.T((A.cx + B.cx) / 2, y - 50 - (a.bend || 70) / 2 - 18, a.note, { size: 24, color: a.col || ACC }, t + .6, .6);
        return 1;
      });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 520, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* vs：{h, L:{t:'的', s:['美丽','的','花'], k:1, n:'名词前'}, R:{...}, ask, end}
   * 左右两栏；k 是要点亮的词下标；n 是说明 */
  TPL.vs = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var top = d.h ? 140 : 70;
    [d.L, d.R].forEach(function (side, si) {
      var cx = si ? W * .75 : W * .25;
      q.beat(side.say || (side.t + '：' + (side.s ? side.s.join('') : '') + (side.n ? '。' + side.n : '')), function (t) {
        c.box(cx - 270, top, 540, 360, t, { stroke: si ? BLUE : INK });
        if (side.t) c.T(cx, top + 70, side.t, { size: 52, bold: 1, color: si ? BLUE : INK }, t + .3, .5);
        var y = top + 180, toks = side.s ? c.sentence(y, side.s, t + .8, { size: side.size || 40, cx: cx }) : null;
        if (toks && side.k !== undefined) [].concat(side.k).forEach(function (k) { c.recolor(toks[k].g, t + .8 + side.s.length * .3 + .3, ACC); c.under(toks[k].x0 - 3, toks[k].x1 + 3, y + 14, t + .8 + side.s.length * .3 + .3); });
        if (side.n) wrap(c, side.n, cx, top + 270, 480, 26, si ? BLUE : INK, t + 1.6 + (side.s ? side.s.length * .3 : 0));
        return 2.4 + (side.s ? side.s.length * .3 : 0);
      }, { ask: si === 1 && d.ask ? d.ask : false });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 530, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* slots：{h, slots:['谁','把','什么','怎么样'], key:1, ex:[['我','把','书','放好了']], bad:{s:['我','把','书'], say:'少了结果'}, end}
   * 不变的槽位画框依次亮起；每个例子把零件放进框；bad 红框打叉 */
  TPL.slots = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var n = d.slots.length, sw = Math.min(230, (W - 80) / n - 16), x0 = W / 2 - (n * sw + (n - 1) * 16) / 2, y = d.h ? 170 : 120;
    var X = d.slots.map(function (_, i) { return x0 + i * (sw + 16) + sw / 2; });
    q.beat(d.say || ('结构是：' + d.slots.join('，') + '。'), function (t) {
      d.slots.forEach(function (s, i) {
        var key = [].concat(d.key === undefined ? [] : d.key).indexOf(i) >= 0;
        c.box(X[i] - sw / 2, y, sw, 84, t + i * .5, { stroke: key ? ACC : INK, strokeWidth: key ? 3.4 : 2.4 });
        c.T(X[i], y + 54, s, { size: 32, color: key ? ACC : GRAY, bold: key }, t + i * .5 + .3, .4);
      });
      return n * .5 + .6;
    });
    var ey = y + 160;
    (d.ex || []).forEach(function (e, k) {
      var cy = ey + k * 92, say = e.say || e.s.join('');
      q.beat(say, function (t) {
        e.s.forEach(function (w, i) { if (w) { var g = c.T(X[i], cy, w, { size: 36, color: e.hl && e.hl.indexOf(i) >= 0 ? ACC : INK }, t + i * .35, .35); } });
        return e.s.length * .35 + .4;
      });
    });
    if (d.bad) {
      var by = ey + (d.ex || []).length * 92;
      q.beat(d.bad.say, function (t) {
        d.bad.s.forEach(function (w, i) { if (w) c.T(X[i], by, w, { size: 36 }, t + i * .3, .3); });
        var miss = d.bad.miss;
        if (miss !== undefined) { c.box(X[miss] - sw / 2 + 10, by - 44, sw - 20, 62, t + 1.2, { stroke: BAD, strokeWidth: 3 }); c.cross(X[miss], by - 14, t + 1.6); }
        else c.cross(X[n - 1] + sw / 2 + 40, by - 14, t + 1.4);
        return 2.2;
      }, { ask: d.bad.ask });
    }
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 530, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* fix：{h, bad:'句子', err:'错的片段', why:'原因', good:'改好的句子', ok:'改动片段', ask} 病句：读 → 想一想 → 圈错 → 原因 → 改对 */
  TPL.fix = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var y1 = d.h ? 210 : 160, g1;
    q.beat(d.read || d.bad, function (t) { g1 = c.T(W / 2, y1, d.bad, { size: 42 }, t, 1.4); return 1.5; });
    q.beat(d.why, function (t) {
      var i = d.bad.indexOf(d.err);
      if (i >= 0) {
        var pre = textW(d.bad.slice(0, i), 42), ew = textW(d.err, 42) || 42;
        var cx = g1.x0 + pre + ew / 2;
        c.ring(cx, y1 - 14, ew + 40, 74, t, BAD);
      }
      c.cross(g1.x1 + 50, y1 - 14, t + .5);
      wrap(c, d.why, W / 2, y1 + 80, W - 160, 28, BAD, t + .8);
      return 1.8;
    }, { ask: d.ask === undefined ? '哪里不对？' : d.ask });
    var y2 = y1 + 220, g2;
    q.beat(d.fixSay || ('改成：' + d.good), function (t) {
      g2 = c.T(W / 2, y2, d.good, { size: 42, color: OK }, t, 1.4);
      if (d.ok) {
        var i = d.good.indexOf(d.ok);
        if (i >= 0) c.under(g2.x0 + textW(d.good.slice(0, i), 42) - 2, g2.x0 + textW(d.good.slice(0, i + d.ok.length), 42) + 2, y2 + 14, t + 1.4, OK);
      }
      c.check(g2.x1 + 50, y2 - 14, t + 1.6);
      return 2.2;
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 530, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* link：{h, a:'天下雨了', b:'运动会延期了', w1:'因为', w2:'所以', rel:'原因 → 结果', ask} 两个分句框 + 关联词飞入 + 关系箭头 */
  TPL.link = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var y = d.h ? 260 : 220, xa = W * .3, xb = W * .7;
    var bw = Math.max(textW(d.a, 38), textW(d.b, 38)) + 80; bw = Math.min(bw, 520);
    q.beat(d.say || (d.a + '。' + d.b + '。'), function (t) {
      c.box(xa - bw / 2, y - 50, bw, 90, t); wrap(c, d.a, xa, y + 10, bw - 30, 38, INK, t + .4);
      c.box(xb - bw / 2, y - 50, bw, 90, t + 1.2); wrap(c, d.b, xb, y + 10, bw - 30, 38, INK, t + 1.6);
      return 2.6;
    });
    q.beat(d.wsay || ('用上“' + [d.w1, d.w2].filter(Boolean).join('……') + '”。'), function (t) {
      if (d.w1) { var g = c.G(function () { c.card(0, 0, d.w1, t, { size: 32, color: ACC }); }); c.slide(g, xa - bw / 2 + 40, -60, xa - bw / 2 + 40, y - 92, t, .9); }
      if (d.w2) { var g2 = c.G(function () { c.card(0, 0, d.w2, t + .6, { size: 32, color: ACC }); }); c.slide(g2, xb - bw / 2 + 40, -60, xb - bw / 2 + 40, y - 92, t + .6, .9); }
      return 1.8;
    });
    if (d.rel) q.beat(d.relSay || ('前后关系：' + d.rel + '。'), function (t) {
      c.arrow(xa, y + 50, xb, y + 50, -80, t, BLUE);
      c.T(W / 2, y + 150, d.rel, { size: 32, color: BLUE, bold: 1 }, t + .7, .8);
      return 1.6;
    }, { ask: d.ask });
    if (d.full) q.beat(d.full, function (t) { wrap(c, d.full, W / 2, y + 230, W - 120, 32, INK, t); return 1.8; });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 530, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* rel：{h, pairs:[{a:'老师', b:'同学', r:'和', kind:'并列', say}], end}
   * kind：并列（双向箭头）修饰（a→b 小箭头，a 灰框）陈述（a | b 竖线）支配（动作箭头 a→b）补充（b 回指 a） */
  TPL.rel = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var top = d.h ? 170 : 110, gap = Math.min(170, (500 - top) / d.pairs.length + 40);
    d.pairs.forEach(function (p, i) {
      var y = top + 40 + i * gap, xa = W / 2 - 170, xb = W / 2 + 170;
      q.beat(p.say || (p.a + (p.r || '') + p.b), function (t) {
        var A = c.card(xa, y, p.a, t, { size: 38 }), B = c.card(xb, y, p.b, t + .5, { size: 38 });
        var k = p.kind, la = xa + A.w / 2 + 10, lb = xb - B.w / 2 - 10;
        if (k === '并列') { c.arrow(la, y, lb, y, 0, t + 1.1, BLUE); c.arrow(lb, y + 8, la, y + 8, 0, t + 1.5, BLUE); }
        else if (k === '修饰' || k === '支配') c.arrow(la, y, lb, y, k === '修饰' ? 0 : 40, t + 1.1, k === '修饰' ? BLUE : '#c22f2f');
        else if (k === '补充') c.arrow(lb, y - 10, la, y - 10, 50, t + 1.1, ACC);
        else if (k === '陈述') c.R('line', [W / 2, y - 40, W / 2, y + 40], { stroke: INK, strokeWidth: 4 }, t + 1.1, .3);
        if (p.r) c.T(W / 2, y - 48, p.r, { size: 28, color: ACC }, t + 1.3, .4);
        if (p.n) c.T(W / 2, y + 68, p.n, { size: 24, color: GRAY }, t + 1.7, .6);
        return 2.4;
      }, { ask: p.ask });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 530, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* steps：{h, items:['先……','再……'], end} 步骤卡依次翻出，之间画箭头 */
  TPL.steps = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var n = d.items.length, top = d.h ? 150 : 90, rh = Math.min(96, (480 - top) / n);
    d.items.forEach(function (s, i) {
      var y = top + i * rh;
      q.beat((i + 1) + '。' + s, function (t) {
        c.R('circle', [110, y + rh / 2 - 6, 52], { fill: ACC, fillStyle: 'solid', stroke: ACC }, t, .4);
        var n2 = c.E('text', { x: 110, y: y + rh / 2 + 4, 'text-anchor': 'middle', 'font-size': 30, fill: '#fff', 'font-family': FONT }); n2.textContent = i + 1;
        c.show(n2, t + .3);
        wrap(c, s, 660, y + rh / 2 + 4, 960, Math.min(32, rh * .38), INK, t + .3);
        if (i < n - 1) c.R('line', [110, y + rh / 2 + 22, 110, y + rh - 14], { stroke: ACC, strokeWidth: 3 }, t + .6, .3);
        return 1.2;
      });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 530, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* line：{h, pts:[{x:'昨天', w:'我看过', n:'过去'}], end} 时间轴 */
  TPL.line = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var y = 300, n = d.pts.length;
    q.beat(d.say || null, function (t) { c.arrow(80, y, W - 60, y, 0, t, INK); return .9; }, { gap: .1 });
    d.pts.forEach(function (p, i) {
      var x = 160 + i * ((W - 320) / Math.max(1, n - 1));
      q.beat(p.say || (p.x + '：' + p.w), function (t) {
        c.R('circle', [x, y, 18], { fill: ACC, fillStyle: 'solid', stroke: ACC }, t, .3);
        c.T(x, y - 40, p.x, { size: 30, color: GRAY }, t + .2, .4);
        wrap(c, p.w, x, y + 70, 300, 34, INK, t + .5);
        if (p.n) c.T(x, y + 160, p.n, { size: 26, color: ACC }, t + 1, .5);
        return 1.6;
      });
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 520, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* end：{kj:'口诀', say, tip:'一句提醒'} */
  TPL.end = function (c, q, d) {
    q.beat(d.say || ('记住口诀：' + d.kj), function (t) {
      var w = Math.min(W - 80, textW(d.kj, 46) + 100);
      c.box(W / 2 - w / 2, 170, w, 120, t, { stroke: ACC, strokeWidth: 3 });
      c.T(W / 2, 248, d.kj, { size: 46, color: ACC, bold: 1 }, t + .5, 1.6); return 2.2;
    });
    if (d.tip) q.beat(d.tip, function (t) { wrap(c, d.tip, W / 2, 380, W - 160, 30, INK, t); return 1.6; });
  };

  /* ---------- 编排：每幕的 build 与时长（不建 DOM 也能算时长） ---------- */
  function buildScene(svg, sc, idx) {
    var c = new Ctx(svg, 20261104 + idx * 1000), q = new Seq(c, .3);
    if (!TPL[sc.k]) throw new Error('未知模板 ' + sc.k);
    TPL[sc.k](c, q, sc);
    return { c: c, cues: q.cues, dur: q.t + .8 };
  }

  /* ---------- 播放器 ---------- */
  function mount(el, name) {
    var spec = REG[name]; if (!spec) { el.textContent = '（暂无白板动画）'; return null; }
    var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    el.innerHTML = '';
    el.classList.add('wb');
    var tabs = document.createElement('div'); tabs.className = 'wb-tabs';
    var board = document.createElement('div'); board.className = 'wb-board';
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', name + ' 白板动画');
    var cap = document.createElement('div'); cap.className = 'wb-cap';
    var ctl = document.createElement('div'); ctl.className = 'wb-ctl';
    ctl.innerHTML = '<button type="button" class="wb-play">▶ 播放</button><input type="range" class="wb-bar" min="0" max="1000" value="0" aria-label="进度"><label class="wb-tts"><input type="checkbox" checked> 朗读</label>';
    board.appendChild(svg); board.appendChild(cap); el.appendChild(tabs); el.appendChild(board); el.appendChild(ctl);
    var pb = ctl.querySelector('.wb-play'), bar = ctl.querySelector('.wb-bar'), tts = ctl.querySelector('.wb-tts input');
    try { if (localStorage.getItem('nhz_wb_mute') === '1') tts.checked = false; } catch (e) {}
    tts.onchange = function () { try { localStorage.setItem('nhz_wb_mute', tts.checked ? '0' : '1'); } catch (e) {} if (!tts.checked) hush(); };

    var S = -1, t = 0, playing = false, last = 0, scene = null, spoken = -1, raf = 0;
    var scenes = spec.scenes;
    function hush() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }
    function speak(s) {
      if (!tts.checked) return;
      try { var u = new SpeechSynthesisUtterance(s.replace(/……/g, '')); u.lang = 'zh-CN'; u.rate = .85; hush(); window.speechSynthesis.speak(u); } catch (e) {}
    }
    function load(i) {
      S = i; while (svg.firstChild) svg.removeChild(svg.firstChild);
      scene = buildScene(svg, scenes[i], i); spoken = -1;
      Array.prototype.forEach.call(tabs.children, function (b, k) { b.classList.toggle('on', k === i); });
    }
    function render() {
      var tt = reduce && !playing ? scene.dur : t;
      scene.c.items.forEach(function (f) { f(tt); });
      var k = -1; scene.cues.forEach(function (cu, j) { if (tt >= cu[0]) k = j; });
      cap.textContent = k >= 0 ? scene.cues[k][1] : '';
      bar.value = Math.round(tt / scene.dur * 1000);
      if (playing && k !== spoken) { spoken = k; if (k >= 0) speak(scene.cues[k][1]); }
    }
    function stop(label) { playing = false; cancelAnimationFrame(raf); pb.textContent = label || '▶ 播放'; hush(); }
    function loop(ts) {
      if (!playing) return;
      t = Math.min(scene.dur, t + (ts - last) / 1000); last = ts; render();
      if (t >= scene.dur) {
        if (S < scenes.length - 1) { load(S + 1); t = 0; render(); }
        else { stop('↻ 重播'); return; }
      }
      raf = requestAnimationFrame(loop);
    }
    function play() {
      if (S === scenes.length - 1 && t >= scene.dur) { load(0); t = 0; }
      playing = true; spoken = -1; pb.textContent = '❚❚ 暂停'; last = performance.now(); raf = requestAnimationFrame(loop);
    }
    pb.onclick = function () { if (playing) stop(); else play(); };
    bar.oninput = function () { t = bar.value / 1000 * scene.dur; spoken = -1; hush(); render(); };
    svg.addEventListener('click', function () { if (playing) stop(); else play(); });
    scenes.forEach(function (sc, i) {
      var b = document.createElement('button'); b.type = 'button';
      b.textContent = (i + 1) + ' ' + (sc.tab || sc.h || sc.t || '');
      b.onclick = function () { stop(); load(i); t = 0; render(); };
      tabs.appendChild(b);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && playing) stop(); });
    load(0); render();
    var api = {
      play: play, pause: function () { stop(); },
      seek: function (i, sec) { if (S !== i) load(i); t = sec; render(); return scene.dur; },
      durations: function () { return scenes.map(function (sc, i) { var s = document.createElementNS(NS, 'svg'); return buildScene(s, sc, i).dur; }); },
      scene: function () { return S; }, el: el, svg: svg,
      destroy: function () { stop(); el.innerHTML = ''; }
    };
    el._wb = api;
    return api;
  }

  /* ---------- 样式（只注入一次） ---------- */
  function css() {
    if (document.getElementById('wb-css')) return;
    var st = document.createElement('style'); st.id = 'wb-css';
    st.textContent =
      '.wb{margin:8px 0 4px}.wb-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}' +
      '.wb-tabs button{min-height:44px;border:1.5px solid var(--line,#d5dfd0);background:var(--surface,#f8faf5);color:var(--ink,#2c3328);border-radius:22px;padding:6px 14px;font-size:15px;cursor:pointer;font-family:inherit}' +
      '.wb-tabs button.on{background:var(--accent-deep,#3d5a40);border-color:var(--accent-deep,#3d5a40);color:#fff}' +
      '.wb-board{background:#f8faf5;border:1px solid var(--line,#d5dfd0);border-radius:14px;overflow:hidden}' +
      '.wb-board svg{display:block;width:100%;height:auto;cursor:pointer}' +
      '.wb-cap{min-height:56px;padding:10px 16px 12px;font-size:20px;line-height:1.5;text-align:center;color:#2c3328;border-top:1px dashed var(--line,#d5dfd0)}' +
      '.wb-ctl{display:flex;align-items:center;gap:12px;margin-top:8px}' +
      '.wb-ctl .wb-play{min-height:44px;min-width:104px;border:2px solid var(--accent-deep,#3d5a40);background:var(--accent,#4a7a59);color:#fff;border-radius:12px;padding:8px 16px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.wb-ctl .wb-bar{flex:1;min-height:44px;accent-color:var(--accent,#4a7a59)}' +
      '.wb-ctl .wb-tts{font-size:15px;color:var(--muted,#6b7566);display:flex;align-items:center;gap:4px;min-height:44px}' +
      '@media (prefers-color-scheme:dark){.wb-board{border-color:#3a4237}}';
    document.head.appendChild(st);
  }

  window.NHZWB = {
    add: function (name, spec) { REG[name] = spec; },
    has: function (name) { return !!REG[name]; },
    mount: function (el, name) { css(); return mount(el, name); },
    names: function () { return Object.keys(REG); },
    SYM: SYM, W: W, H: H
  };
})();
