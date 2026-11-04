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
 *   （link 加 back:1 时关系箭头从右指向左，用于“先果后因”）
 *   新模板：review 回练、trunk 抽骨架、morph 变魔术（第 2 期）、nest 套盒子（第 3 期）
 * 词类符号 sym：noun adj pron verb adv prep conj interj（蒙氏），num quant aux part（灰底标签）。
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1200, H = 560;
  /* E0 色板 PAL：全部颜色只在这里定义，场景只写语义键（设计 §3.3）。
   * 分层（check_wb.py --lint R5 按此注释里的层名做跨层 ΔE≥20 检查，名词▲与正文墨写死豁免）：
   *   层 cls（词类）：noun adj pron verb adv prep conj interj tagc
   *   层 role（成分）：role
   *   层 judge（对错）：ok bad
   *   层 story（叙事）：ink gray acc cmp */
  var PAL = {
    ink: '#2c3328', gray: '#a3aa9c', acc: '#a8642f', cmp: '#8c6d3a', line: '#d5dfd0',
    ok: '#0f8c8c', bad: '#8f1d3f',
    role: '#4f5d7a',
    noun: '#26221c', adj: '#274b8f', pron: '#7b4ba8', verb: '#c22f2f', adv: '#e07b24', prep: '#3d8a4f',
    conj: '#d96a9b', interj: '#c9a227', tagc: '#6b7566'
  };
  var INK = PAL.ink, GRAY = PAL.gray, ACC = PAL.acc, OK = PAL.ok, BAD = PAL.bad, BLUE = PAL.cmp, LINE = PAL.line, ROLE = PAL.role;
  var FONT = '"LXGW WenKai","Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC","Songti SC",serif';
  var SYM = {
    noun: ['名词', PAL.noun, 'tri'], adj: ['形容词', PAL.adj, 'tri'], pron: ['代词', PAL.pron, 'tri'],
    verb: ['动词', PAL.verb, 'circle'], adv: ['副词', PAL.adv, 'circle-sm'], prep: ['介词', PAL.prep, 'crescent'],
    conj: ['连词', PAL.conj, 'bar'], interj: ['叹词', PAL.interj, 'excl'],
    num: ['数词', PAL.tagc, 'tag'], quant: ['量词', PAL.tagc, 'tag'], aux: ['助词', PAL.tagc, 'tag'], part: ['语气词', PAL.tagc, 'tag']
  };
  /* E10 语义色键 → 色值。兼容期：旧场景的 '#rrggbb' 原样通过（--lint 报 R1 警告）。 */
  function C(v, dflt) { if (!v) return dflt; if (String(v).charAt(0) === '#') return v; return PAL[v] || dflt; }
  var REG = {};
  var LVN = ['浅', '中', '深'];
  var CPS = 3.5;          /* 旁白每秒字数（三四年级慢速档） */
  var THINK = 4;          /* 先猜停顿秒数 */

  /* ---------- 基础工具 ---------- */
  function cl(x, a, b) { a = a || 0; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, x)); }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function P(t, t0, d) { return cl((t - t0) / (d || 1e-6)); }
  function len(s) { return String(s || '').replace(/[，。、；：！？“”‘’（）《》…—\s,.!?;:()]/g, '').length; }
  function sayDur(s) { return s ? len(s) / CPS + 0.6 : 0; }
  /* E14 术语占位：{t:键} 按幕的 lv 替换（L1「谁（主语）」，L2「主语（谁）」，L3「主语」）；
   * {t:键|term} 只要术语，{t:键|kid} 只要儿童名，{t:键|short} 术语简称（主），{t:键|ks} 儿童简称（谁）。
   * 术语表在 wb/terms.js（window.NHZWB_TERMS）；没有占位符的旧文本原样返回。 */
  function term(s, lv) {
    if (typeof s !== 'string' || s.indexOf('{t:') < 0) return s;
    var TT = window.NHZWB_TERMS || {};
    return s.replace(/\{t:([a-z]+)(?:\|(term|kid|short|ks))?\}/g, function (m0, k, f) {
      var e = TT[k]; if (!e) return m0;
      if (f === 'term') return e.t; if (f === 'kid') return e.kid; if (f === 'short') return e.s || e.t; if (f === 'ks') return e.k || e.kid;
      return lv >= 3 ? e.t : lv === 2 ? e.t + '（' + e.kid + '）' : e.kid + '（' + e.t + '）';
    });
  }
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
    o = o || {}; t0 = t0 || 0; s = term(s, this.lv);
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
  /* E1 属性时间线：每个元素每个属性只有一个求值器（在第一次写关键帧时注册），
   * 取 t 之前最后一个关键帧并插值；多次 recolor / fade / move 不再互相覆盖（修设计 §2.4）。
   * 关键帧 {t, v, d, from, arc}：从 from（缺省为上一帧终值或初值）到 v，用时 d（0 为瞬变）；arc 为弧线抬高像素（只对 transform）。
   * prop：fill（属性）、opacity（样式）、display（样式，v 为真显示）、transform（v=[dx,dy]，可叠加 shake）。 */
  function tlEval(tr, t) {
    var k = tr.k, n = 0, i;
    while (n < k.length && k[n].t <= t) n++;
    if (n === 0) return k.length && k[0].from !== undefined ? k[0].from : tr.init;
    var f = k[n - 1], prev = tr.init;
    for (i = 0; i < n - 1; i++) prev = k[i].v;
    var a = f.from !== undefined ? f.from : prev;
    if (!f.d || typeof f.v === 'string' || typeof f.v === 'boolean') return f.v;
    var q = P(t, f.t, f.d);
    if (f.ease) q = ease(q);
    if (typeof f.v === 'number') return a + (f.v - a) * q;
    var v = [a[0] + (f.v[0] - a[0]) * q, a[1] + (f.v[1] - a[1]) * q];
    if (f.arc) v[1] -= f.arc * Math.sin(Math.PI * q);
    return v;
  }
  function tlApply(el, prop, v, tr, t) {
    if (prop === 'fill') el.setAttribute('fill', v);
    else if (prop === 'opacity') el.style.opacity = v;
    else if (prop === 'display') el.style.display = v ? '' : 'none';
    else if (prop === 'transform') {
      var dx = v[0], dy = v[1];
      (tr.sh || []).forEach(function (h) { if (t >= h.t && t < h.t + h.d) { var q = (t - h.t) / h.d; dx += h.A * Math.sin(2 * Math.PI * h.f * (t - h.t)) * (1 - q); } });
      el.setAttribute('transform', 'translate(' + Math.round(dx * 100) / 100 + ',' + Math.round(dy * 100) / 100 + ')');
    }
  }
  Ctx.prototype.track = function (el, prop, init) {
    el._tl = el._tl || {};
    var tr = el._tl[prop];
    if (!tr) {
      tr = el._tl[prop] = { k: [], init: init !== undefined ? init : (prop === 'transform' ? [0, 0] : prop === 'opacity' ? 1 : prop === 'display' ? true : el.getAttribute('fill')) };
      this.add(function (t) { tlApply(el, prop, tlEval(tr, t), tr, t); });
    }
    return tr;
  };
  Ctx.prototype.key = function (el, prop, t0, v, o) {
    o = o || {}; var tr = this.track(el, prop, o.init);
    var kf = { t: t0, v: v, d: o.d || 0, from: o.from, arc: o.arc, ease: o.ease }, j = tr.k.length;
    while (j > 0 && tr.k[j - 1].t > t0) j--;
    tr.k.splice(j, 0, kf);
    return el;
  };
  /* 构建时读某元素某属性在 t 的值（排版接力用） */
  Ctx.prototype.at = function (el, prop, t) { var tr = el._tl && el._tl[prop]; return tr ? tlEval(tr, t) : (prop === 'transform' ? [0, 0] : prop === 'opacity' ? 1 : null); };
  Ctx.prototype.fade = function (g, t0, d, out) { return this.key(g, 'opacity', t0, out ? 0 : 1, { d: d || .5, from: out ? 1 : 0 }); };
  Ctx.prototype.show = function (g, a, b) { this.add(function (t) { g.style.display = (t >= a && (b === undefined || t < b)) ? '' : 'none'; }); };
  Ctx.prototype.recolor = function (g, t0, col) { return this.key(g.tx, 'fill', t0, C(col, col), { init: g.base }); };
  Ctx.prototype.slide = function (g, x0, y0, x1, y1, t0, d) {
    this.add(function (t) { var q = ease(P(t, t0, d || .9)); g.setAttribute('transform', 'translate(' + (x0 + (x1 - x0) * q) + ',' + (y0 + (y1 - y0) * q) + ')'); g.style.display = t < t0 ? 'none' : ''; });
  };
  Ctx.prototype.check = function (x, y, t0) { return this.R('linearPath', [[[x - 20, y], [x - 5, y + 18], [x + 24, y - 22]]], { stroke: OK, strokeWidth: 6 }, t0, .5); };
  Ctx.prototype.cross = function (x, y, t0) {
    var s = this; return this.G(function () { s.R('line', [x - 18, y - 18, x + 18, y + 18], { stroke: BAD, strokeWidth: 6 }, t0, .25); s.R('line', [x + 18, y - 18, x - 18, y + 18], { stroke: BAD, strokeWidth: 6 }, t0 + .25, .25); });
  };
  Ctx.prototype.under = function (x1, x2, y, t0, col) { return this.R('line', [x1, y, x2, y], { stroke: col || ACC, strokeWidth: 4 }, t0, .4); };
  /* 圈：缺省叙事强调色（错误圈必须显式传 BAD 并同时打 ✗，设计 §3.1 规则 4） */
  Ctx.prototype.ring = function (x, y, w, h, t0, col) { return this.R('ellipse', [x, y, w, h], { stroke: col || ACC, strokeWidth: 3.5 }, t0, .6); };
  Ctx.prototype.box = function (x, y, w, h, t0, o) { return this.R('rectangle', [x, y, w, h], o || {}, t0, .6); };
  /* ---------- 第 1 期新增原语（设计 §7.1 E2–E13）：只被新模板 / 新的可选参数调用，旧路径不变 ---------- */
  /* E2 move：关键帧位移，不在 t0 前隐藏（区别于 slide）。kf：[{t, x, y, d, arc}]，x/y 为相对初始位置的偏移 */
  Ctx.prototype.move = function (g, kfs) { var s = this; [].concat(kfs).forEach(function (k) { s.key(g, 'transform', k.t, [k.x || 0, k.y || 0], { d: k.d === undefined ? .8 : k.d, arc: k.arc, ease: 1 }); }); return g; };
  /* E12 shake：确定性摇晃 dx = A·sin(2π·f·(t−t0))·(1−q) */
  Ctx.prototype.shake = function (g, t0, d, A, f) { var tr = this.track(g, 'transform'); tr.sh = (tr.sh || []).concat([{ t: t0, d: d || .8, A: A || 10, f: f || 4 }]); return g; };
  /* E11 sink：下沉并淡出；strike：删除线（保留可读） */
  Ctx.prototype.sink = function (g, t0, d) { var p = this.at(g, 'transform', t0); this.key(g, 'transform', t0, [p[0], p[1] + 46], { d: d || .8, ease: 1 }); this.key(g, 'opacity', t0, 0, { d: d || .8, from: 1 }); return g; };
  Ctx.prototype.strike = function (x0, x1, y, t0) { return this.R('line', [x0 - 4, y, x1 + 4, y], { stroke: GRAY, strokeWidth: 3.5, roughness: .6 }, t0, .4); };
  /* 在指定组里画（括号类成分线挂在词块上随块移动） */
  Ctx.prototype.into = function (g, fn) { var o = this.cur; this.cur = g; try { return fn(); } finally { this.cur = o; } };
  /* E2 chunk：把若干已画的组绑成一个可移动单元 */
  Ctx.prototype.chunk = function (gs) { var g = this.E('g', {}); gs.forEach(function (x) { g.appendChild(x); }); return g; };
  /* E2 lay：构建时排版（不调用 getBBox）。ws：每块宽，返回每块 x0 */
  function lay(ws, gap, cx) { var tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * Math.max(0, ws.length - 1), x = cx - tot / 2, out = []; ws.forEach(function (w) { out.push(x); x += w + gap; }); return out; }
  /* E7 成分线 role(kind)：主 ═ 谓 ＿ 宾 ～ 定（）状〔〕补〈〉 主谓界 ‖；颜色固定成分墨。size 为字号，y 为基线 */
  Ctx.prototype.role = function (kind, x0, x1, y, t0, o) {
    o = o || {}; var s = this, size = o.size || 44, yl = y + 16, op = { stroke: ROLE, strokeWidth: 3, roughness: .6, bowing: .5 };
    var top = y - size * .92, bot = y + size * .22, mid = (top + bot) / 2;
    return this.G(function () {
      if (kind === 'zhu') { s.R('line', [x0, yl, x1, yl], op, t0, .35); s.R('line', [x0, yl + 7, x1, yl + 7], op, t0 + .2, .35); }
      else if (kind === 'wei') s.R('line', [x0, yl + 3, x1, yl + 3], op, t0, .4);
      else if (kind === 'bin') {
        var wl = size * .5, n = Math.max(2, Math.round((x1 - x0) / wl)), st = (x1 - x0) / n, d = 'M' + x0 + ' ' + (yl + 4);
        for (var i = 0; i < n; i++) d += ' q' + (st / 4) + ' -6 ' + (st / 2) + ' 0 t' + (st / 2) + ' 0';
        s.R('path', [d], op, t0, .5);
      } else if (kind === 'ding') {
        s.R('path', ['M' + (x0 - 3) + ' ' + top + ' Q' + (x0 - 15) + ' ' + mid + ' ' + (x0 - 3) + ' ' + bot], op, t0, .25);
        s.R('path', ['M' + (x1 + 3) + ' ' + top + ' Q' + (x1 + 15) + ' ' + mid + ' ' + (x1 + 3) + ' ' + bot], op, t0 + .25, .25);
      } else if (kind === 'zhuang') {
        s.R('linearPath', [[[x0 - 3, top], [x0 - 12, top + 9], [x0 - 12, bot - 9], [x0 - 3, bot]]], op, t0, .25);
        s.R('linearPath', [[[x1 + 3, top], [x1 + 12, top + 9], [x1 + 12, bot - 9], [x1 + 3, bot]]], op, t0 + .25, .25);
      } else if (kind === 'bu') {
        s.R('linearPath', [[[x0 - 3, top], [x0 - 14, mid], [x0 - 3, bot]]], op, t0, .25);
        s.R('linearPath', [[[x1 + 3, top], [x1 + 14, mid], [x1 + 3, bot]]], op, t0 + .25, .25);
      } else if (kind === 'bar') {
        s.R('line', [x0 - 3, top - 4, x0 - 3, bot + 6], op, t0, .2); s.R('line', [x0 + 3, top - 4, x0 + 3, bot + 6], op, t0 + .15, .2);
      }
    });
  };
  /* 虚线框（不走 rough 画出动画，用淡入）：gap / guard / tag 共用 */
  Ctx.prototype.dash = function (x, y, w, h, t0, col, o) {
    o = o || {}; var g = this.E('g', {});
    this.E('rect', { x: x, y: y, width: w, height: h, rx: o.rx === undefined ? 10 : o.rx, fill: 'none', stroke: col, 'stroke-width': o.sw || 2.5, 'stroke-dasharray': o.dash || '8 6' }, g);
    this.key(g, 'opacity', t0, 1, { d: .4, from: 0 });
    if (o.until !== undefined) this.key(g, 'opacity', o.until, 0, { d: .4 });
    return g;
  };
  /* E3 gap：虚线空位框，可带 ∅ 与下标字母；until 时收起 */
  Ctx.prototype.gap = function (cx, y, w, t0, o) {
    o = o || {}; var size = o.size || 44, g = this.dash(cx - w / 2, y - size * 1.02, w, size * 1.3, t0, GRAY, { until: o.until }), s = this;
    if (o.phi || o.sub) this.into(g, function () { var tx = s.E('text', { x: cx, y: y - 4, 'text-anchor': 'middle', 'font-size': size * .7, fill: GRAY, 'font-family': FONT }); tx.textContent = (o.phi ? '∅' : '') + (o.sub || ''); });
    return g;
  };
  /* E4 hub：枢纽圈（强调色实线椭圆，不带 ✗）；guard：保护标签（强调色虚线框 +「不能剪」） */
  Ctx.prototype.hub = function (cx, cy, w, h, t0) { return this.R('ellipse', [cx, cy, w, h], { stroke: ACC, strokeWidth: 3 }, t0, .6); };
  Ctx.prototype.guard = function (x0, x1, y, t0, o) {
    o = o || {}; var size = o.size || 44, g = this.dash(x0 - 10, y - size * 1.05, x1 - x0 + 20, size * 1.4, t0, ACC, { sw: 2.5 }), s = this;
    this.into(g, function () { var tx = s.E('text', { x: (x0 + x1) / 2, y: y - size * 1.05 - 10, 'text-anchor': 'middle', 'font-size': 22, fill: ACC, 'font-family': FONT }); tx.textContent = o.label || '不能剪'; });
    return g;
  };
  /* E8 tag：语义角色文字标签（叙事墨小字 + 虚线小框），画在词块上方第 2 行 */
  Ctx.prototype.tag = function (cx, y, s0, t0) {
    var s = term(s0, this.lv), w = textW(s, 22) + 18, g = this.dash(cx - w / 2, y - 24, w, 34, t0, INK, { sw: 1.6, dash: '5 4', rx: 6 }), self = this;
    this.into(g, function () { var tx = self.E('text', { x: cx, y: y, 'text-anchor': 'middle', 'font-size': 22, fill: INK, 'font-family': FONT }); tx.textContent = s; });
    return g;
  };
  /* E6 stair：台阶线一行。cuts 为切分处 x，label 居中写结构名 */
  Ctx.prototype.stair = function (x0, x1, y, cuts, label, t0) {
    var s = this; return this.G(function () {
      s.R('line', [x0, y, x1, y], { stroke: ROLE, strokeWidth: 2.6, roughness: .5 }, t0, .4);
      (cuts || []).forEach(function (x, i) { s.R('line', [x, y - 12, x, y + 12], { stroke: ROLE, strokeWidth: 2.6, roughness: .4 }, t0 + .4 + i * .1, .15); });
      if (label) s.T((x0 + x1) / 2, y + 34, label, { size: 26, color: ROLE }, t0 + .5, .4);
    });
  };
  /* E13 pic：情境卡（文字；线条图标待 Q22）；state2：前后两格状态图 */
  Ctx.prototype.pic = function (cx, cy, w, h, s, t0, o) {
    o = o || {}; var self = this; return this.G(function () { self.R('rectangle', [cx - w / 2, cy - h / 2, w, h], { stroke: o.color || INK, strokeWidth: 2 }, t0, .5); wrap(self, s, cx, cy + 8, w - 24, o.size || 26, o.color || INK, t0 + .3); });
  };
  Ctx.prototype.state2 = function (cx, cy, a, b, t0) {
    var self = this, w = 260, h = 90; return this.G(function () { self.pic(cx - 190, cy, w, h, a, t0); self.arrow(cx - 50, cy, cx + 50, cy, 0, t0 + .8, INK); self.pic(cx + 190, cy, w, h, b, t0 + 1.4); });
  };
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
    opt = opt || {}; say = term(say, this.c.lv);
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
    var lines = [], cur = ''; s = term(s, c.lv);
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
    q.beat(d.say || d.s.join(''), function (t) { toks = c.sentence(y, d.s, t, d.gap === undefined ? { size: d.size || 46 } : { size: d.size || 46, gap: d.gap }); return d.s.length * .3 + .4; });
    (d.m || []).forEach(function (m, k) {
      q.beat(m.say, function (t) {
        var idx = [].concat(m.i), a = toks[idx[0]], b = toks[idx[idx.length - 1]], cx = (a.x0 + b.x1) / 2;
        if (m.sym) c.sym(m.sym, cx, y - 58, m.small ? 9 : 13, t);
        var mc = C(m.col);
        if (m.u) c.under(a.x0 - 4, b.x1 + 4, y + 16, t, mc);
        if (m.role) c.role(m.role, a.x0, b.x1, y, t, { size: d.size || 46 });
        if (m.hub) c.hub(cx, y - 14, b.x1 - a.x0 + 40, 76, t);
        if (m.ring) c.ring(cx, y - 14, b.x1 - a.x0 + 40, 76, t, mc || ACC);
        if (m.col) idx.forEach(function (j) { c.recolor(toks[j].g, t, mc); });
        if (m.tag) c.tag(cx, y - (m.sym ? 120 : 76), m.tag, t + .2);
        if (m.note) c.T(cx, y + (m.u || m.role ? 62 : 58) + (m.row || 0) * 34, m.note, { size: 24, color: m.role && !m.col ? ROLE : mc || ACC }, t + .4, .6);
        if (m.up) c.T(cx, y - (m.sym ? 100 : 70), m.up, { size: 24, color: mc || ACC }, t + .3, .6);
        return .9;
      }, { ask: k === 0 && d.ask ? d.ask : false });
    });
    if (d.gray && d.gray.length) q.beat(d.graySay || '其余的词变灰。', function (t) { d.gray.forEach(function (j) { c.recolor(toks[j].g, t, GRAY); }); return .5; });
    (d.arrows || []).forEach(function (a) {
      q.beat(a.say, function (t) {
        var A = toks[a.f], B = toks[a.t];
        c.arrow(A.cx, y - 50, B.cx, y - 50, a.bend || 70, t, C(a.col));
        if (a.note) c.T((A.cx + B.cx) / 2, y - 50 - (a.bend || 70) / 2 - 18, a.note, { size: 24, color: C(a.col, ACC) }, t + .6, .6);
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
    var bw = Math.max(textW(d.a, 38), textW(d.b, 38)) + 80; bw = Math.min(bw, 440);
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
      if (d.back) c.arrow(xb, y + 50, xa, y + 50, 80, t, BLUE); else c.arrow(xa, y + 50, xb, y + 50, -80, t, BLUE);
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
    var top = d.h ? 170 : 110, n = d.pairs.length, wide = n >= 3;
    var gap = n > 1 ? Math.min(170, (500 - (top + 40)) / (n - 1)) : 0;
    d.pairs.forEach(function (p, i) {
      var y = top + 40 + i * gap, xa = wide ? 300 : W / 2 - 170, xb = wide ? 640 : W / 2 + 170, mid = (xa + xb) / 2;
      q.beat(p.say || (p.a + (p.r || '') + p.b), function (t) {
        var A = c.card(xa, y, p.a, t, { size: 38 }), B = c.card(xb, y, p.b, t + .5, { size: 38 });
        var k = p.kind, la = xa + A.w / 2 + 10, lb = xb - B.w / 2 - 10;
        if (k === '并列') { c.arrow(la, y, lb, y, 0, t + 1.1, BLUE); c.arrow(lb, y + 8, la, y + 8, 0, t + 1.5, BLUE); }
        else if (k === '修饰' || k === '支配') c.arrow(la, y, lb, y, k === '修饰' ? 0 : 40, t + 1.1, k === '修饰' ? BLUE : INK);
        else if (k === '补充') c.arrow(lb, y - 10, la, y - 10, 50, t + 1.1, ACC);
        else if (k === '陈述') c.R('line', [mid, y - 40, mid, y + 40], { stroke: INK, strokeWidth: 4 }, t + 1.1, .3);
        if (p.r) c.T(mid, y - 48, p.r, { size: 28, color: ACC }, t + 1.3, .4);
        if (p.n) { if (wide) c.T(xb + B.w / 2 + 40, y + 10, p.n, { size: 26, color: GRAY, anchor: 'start' }, t + 1.7, .6); else c.T(mid, y + 68, p.n, { size: 24, color: GRAY }, t + 1.7, .6); }
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

  /* review（E15，回练幕纯观看版，设计 §5.5）：
   * {task:'题目', answer:'同学的答案', ok:false, diff:{miss:'丢的片段'} | {extra:'多的片段'} | {bad:'错的片段'},
   *  good:'正确答案', rule:'一句话规则', why:'可选：错在哪的旁白', ask:'可选'}
   * 出题 → 同学的答案卡 → 想一想「改对了吗？」→ ✓/✗ → 错色圈出问题处 → 写出正确答案 → 规则 */
  TPL.review = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var y0 = d.h ? 170 : 120, ya = y0 + 120, yg = ya + 140, size = 40, ga, gg;
    q.beat(d.taskSay || ('题目：' + d.task + '。'), function (t) { c.T(70, y0, '题目', { size: 26, color: GRAY, anchor: 'start' }, t, .3); wrap(c, d.task, W / 2 + 30, y0, W - 260, 32, INK, t + .3); return 1.6; });
    q.beat(d.ansSay || ('一位同学这样写：' + d.answer + '。'), function (t) {
      var w = Math.min(W - 160, textW(d.answer, size) + 80);
      c.box(W / 2 - w / 2, ya - 52, w, 76, t, { stroke: GRAY, strokeWidth: 2 });
      c.T(W / 2 - w / 2 + 6, ya - 62, '同学的答案', { size: 22, color: GRAY, anchor: 'start' }, t + .2, .4);
      ga = c.T(W / 2, ya, d.answer, { size: size }, t + .5, 1.2); return 1.8;
    });
    q.beat(d.ok ? (d.verdict || '改对了。') : (d.verdict || '没改对。'), function (t) {
      if (d.ok) c.check(ga.x1 + 70, ya - 14, t); else c.cross(ga.x1 + 70, ya - 14, t); return .8;
    }, { ask: d.ask || '这位同学改对了吗？' });
    if (!d.ok) {
      var df = d.diff || {};
      q.beat(d.why || (df.miss ? '丢了“' + df.miss + '”。' : df.extra ? '多了“' + df.extra + '”。' : df.bad ? '“' + df.bad + '”用错了。' : '这里不对。'), function (t) {
        if (df.extra || df.bad) {
          var seg = df.extra || df.bad, i = d.answer.indexOf(seg);
          if (i >= 0) c.ring(ga.x0 + textW(d.answer.slice(0, i), size) + textW(seg, size) / 2, ya - 14, textW(seg, size) + 36, 70, t, BAD);
        } else if (df.miss) {
          var j = d.good.indexOf(df.miss), x = ga.x0 + textW(d.good.slice(0, Math.max(0, j)), size);
          c.R('linearPath', [[[x - 12, ya + 22], [x, ya + 6], [x + 12, ya + 22]]], { stroke: BAD, strokeWidth: 4 }, t, .3);
          c.T(x, ya + 56, df.miss + '？', { size: 26, color: BAD }, t + .3, .5);
        }
        return 1.2;
      });
    }
    if (d.good && !d.ok) q.beat(d.goodSay || ('应该是：' + d.good + '。'), function (t) {
      gg = c.T(W / 2, yg, d.good, { size: size }, t, 1.3);
      var seg = (d.diff || {}).miss || d.fixed;
      if (seg) { var i = d.good.indexOf(seg); if (i >= 0) c.under(gg.x0 + textW(d.good.slice(0, i), size) - 2, gg.x0 + textW(d.good.slice(0, i + seg.length), size) + 2, yg + 14, t + 1.3); }
      c.check(gg.x1 + 70, yg - 14, t + 1.5); return 2.1;
    });
    if (d.rule) q.beat(d.rule, function (t) { c.T(W / 2, 520, d.rule, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* ---------- 公共：词块行 Row（trunk / morph / nest 共用；第 2 期从 trunk 抽出，行为与原 trunk 内联代码逐行等价） ----------
   * 词块组：每个词块是独立 <g>（字 + 可选成分线，括号类挂在组里随块移动）。
   * 构建时排版：xs 由调用方用 lay / layG 算好（textW 估宽，不调用 getBBox）。
   * 平移：place 对已画的块按新排版 move，对新块 create（可从上方落入）。
   * Row(c, {size, y})：mk(w, role, ex) 建块记录；create(b, x0, t0, drop) 画块；place(L, X, t0, d0, drop) 排到 X。 */
  function Row(c, o) { this.c = c; this.size = o.size || 44; this.y = o.y; this.B = []; }
  Row.prototype.mk = function (w, role, ex) { var b = { w: w, role: role || null, id: this.B.length }; for (var k in (ex || {})) b[k] = ex[k]; b.wd = textW(w, this.size); this.B.push(b); return b; };
  Row.prototype.create = function (b, x0, t0, drop) {
    var c = this.c, size = this.size, y = this.y;
    b.g = c.G(function () { b.tx = c.T(x0 + b.wd / 2, y, b.w, { size: size }, t0, .4); if (b.role) c.role(b.role, x0, x0 + b.wd, y, t0 + .4, { size: size }); });
    b.x0c = x0; b.x = x0;
    if (drop) { c.key(b.g, 'transform', t0, [0, 0], { d: .6, from: [0, -70], ease: 1 }); c.key(b.g, 'opacity', t0, 1, { d: .4, from: 0 }); }
    return b;
  };
  Row.prototype.place = function (L, X, t0, d0, drop) {
    var self = this, c = this.c;
    L.forEach(function (b, i) { if (!b.g) self.create(b, X[i], drop ? t0 + .6 : t0 + i * .25, drop); else if (b.x !== X[i]) { c.move(b.g, { t: t0, x: X[i] - b.x0c, d: d0 }); b.x = X[i]; } });
    return X;
  };
  /* layG：每两块之间的间距可不同（gaps[i] 为第 i 块与第 i+1 块之间），返回每块 x0 */
  function layG(ws, gaps, cx) { var tot = 0, i; for (i = 0; i < ws.length; i++) tot += ws[i] + (i < ws.length - 1 ? gaps[i] : 0); var x = cx - tot / 2, out = []; for (i = 0; i < ws.length; i++) { out.push(x); x += ws[i] + (gaps[i] || 0); } return out; }

  /* trunk 抽骨架（E15，设计 §5.1）：先生长（扩句），再修剪（缩句）。
   * 生长：{k:'trunk', mode:'grow+prune'|'grow', core:['小猫','捉','老鼠'], role:['zhu','wei','bin'],
   *        grow:[{q:'哪只小猫？', ins:['胖胖','的'], before:0, role:'ding', say, at:'far', keep, why, cutOk}], formula:true, ask}
   * 修剪：{k:'trunk', mode:'prune', s:[…], role:[…], keep:[{i, why:'neg'|'num'|'key', say, label}],
   *        tryCut:{i, q, show:'剪掉后的句子', say}, prune:{cue:['的','地','得'], strike:0}, ask, coreSay, end}
   * 词块不写坐标：每一步的排版在构建时算好（lay），步与步之间平移（move）；括号类成分线画在词块组里随块移动。
   * 「的 / 地 / 得」是路标（枢纽圈），不画成分线；否定、数量、关键定语用 keep 保护（--lint R8）。 */
  TPL.trunk = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var size = d.size || 44, GX = d.gap || 34, y = d.y || (d.h ? 286 : 266), fy = y + 92, lv = c.lv, TT = window.NHZWB_TERMS || {};
    var CUE = { '的': 1, '地': 1, '得': 1 }, pr = d.prune || {}, row = new Row(c, { size: size, y: y });
    function mk(w, role, ex) { var b = row.mk(w, role, ex); b.cue = !b.role && !!CUE[w]; return b; }
    var seq, mode = d.mode || (d.grow ? 'grow+prune' : 'prune');
    if (d.core) seq = d.core.map(function (w, i) { return mk(w, (d.role || [])[i], { core: 1, ci: i }); });
    else seq = d.s.map(function (w, i) { var r = (d.role || [])[i]; return mk(w, CUE[w] && !r ? null : r, { core: r === 'zhu' || r === 'wei' || r === 'bin', ci: i }); });
    /* 路标归属：的 / 地 跟前一块，得 跟后一块 */
    function owners(L) { L.forEach(function (b, i) { if (b.cue && !b.own) b.own = b.w === '得' ? L[i + 1] : L[i - 1]; }); }
    (d.keep || []).forEach(function (k) { var b = seq[k.i]; if (b) { b.keep = 1; b.why = k.why; b.ksay = k.say; b.klabel = k.label; } });
    var curF = null, bar = null;
    /* 排版：主谓分界处多留 26px 给 ‖ */
    function xs(L) {
      var se = lv >= 2 && d.bar !== false ? subjEnd(L) : -1, ws = L.map(function (b, i) { return b.wd + (i === se ? 26 : 0); }), X = lay(ws, GX, W / 2);
      return X;
    }
    function subjEnd(L) { for (var i = 0; i < L.length; i++) if (L[i].role === 'zhu' && L[i].core) { var j = i; while (L[j + 1] && L[j + 1].cue && L[j + 1].own === L[i]) j++; return L[j + 1] ? j : -1; } return -1; }
    function formula(L, X, t0) {
      if (d.formula === false) return;
      var g = c.G(function () {
        var cells = [], se = subjEnd(L);
        L.forEach(function (b, i) {
          if (!b.role || !TT[b.role]) return;
          var pv = cells[cells.length - 1];
          if (pv && pv.role === b.role && pv.last === i - 1 && b.core && L[pv.last].core) { pv.last = i; pv.cx = (X[pv.i] + X[i] + b.wd) / 2; return; }   /* 同一成分的相邻骨架词并成一格（喜欢 吃 → 谓） */
          cells.push({ i: i, last: i, role: b.role, s: lv <= 1 ? TT[b.role].k : TT[b.role].s, cx: X[i] + b.wd / 2 });
        });
        cells.forEach(function (cl0, k) {
          cl0.w = textW(cl0.s, 26); c.T(cl0.cx, fy, cl0.s, { size: 26, color: ROLE }, t0 + k * .12, .3);
          var nx = cells[k + 1]; if (!nx) return;
          var sep = cl0.last <= se && nx.i > se ? '‖' : '+', mx = (cl0.cx + cl0.w / 2 + nx.cx - textW(nx.s, 26) / 2) / 2;
          c.T(mx, fy, sep, { size: 26, color: GRAY }, t0 + k * .12 + .1, .2);
        });
      });
      if (curF) c.key(curF, 'display', t0, false);
      c.key(g, 'opacity', t0, 1, { d: .3, from: 0 });
      curF = g;
    }
    function barAt(L, X, t0, d0) {
      if (lv < 2 || d.bar === false) return;
      var se = subjEnd(L); if (se < 0) return;
      var bx = (X[se] + L[se].wd + X[se + 1]) / 2;
      if (!bar) { bar = c.G(function () { c.role('bar', bx, bx, y, t0, { size: size }); }); bar.x0c = bx; }
      else c.move(bar, { t: t0, x: bx - bar.x0c, d: d0 });
    }
    function place(L, t0, d0, drop) {
      owners(L); var X = row.place(L, xs(L), t0, d0, drop);
      barAt(L, X, t0, d0); formula(L, X, t0 + (drop ? 1 : .2) + (d0 || 0));
      return X;
    }
    function txt(L) { return L.map(function (b) { return b.w; }).join(''); }
    function sayOf(L) { return d.read || txt(L) + '。'; }
    /* 1 骨架 / 原句出场 */
    q.beat(d.say || (mode === 'prune' ? sayOf(seq) : (d.coreIntro || '骨架：' + txt(seq) + '。')), function (t) { place(seq, t, 0); return seq.length * .25 + 1.4; });
    /* 2 生长 */
    var att = {};
    (d.grow || []).forEach(function (g) {
      var ch = [], buf = [];
      g.ins.forEach(function (w) { if (CUE[w]) { if (buf.length) { ch.push(buf.join('')); buf = []; } ch.push(w); } else buf.push(w); });
      if (buf.length) ch.push(buf.join(''));
      var leaf = null, blocks = ch.map(function (w) { var b = CUE[w] ? mk(w) : (leaf = mk(w, g.role, { leaf: 1, keep: g.keep ? 1 : 0, why: g.why })); return b; });
      blocks.forEach(function (b) { if (b.cue) b.own = leaf; });
      var ti = g.before !== undefined ? g.before : g.after, tgt = seq.filter(function (b) { return b.core && b.ci === ti; })[0], a = att[ti] = att[ti] || { b: [], a: [] };
      if (!tgt) throw new Error('trunk：grow 找不到骨架词 ' + ti);
      q.beat(g.q, function (t) { g._qg = c.T(W / 2, d.h ? 168 : 140, g.q, { size: 30 }, t, .6); return 1; }, { gap: .2 });
      q.beat(g.say || ('“' + g.ins.join('') + '”。'), function (t) {
        var at, it = seq.indexOf(tgt);
        if (g.before !== undefined) { at = it; if (g.at === 'far') a.b.forEach(function (chk) { at = Math.min(at, seq.indexOf(chk[0])); }); a.b.push(blocks); }
        else { at = it + 1; if (g.at === 'far') a.a.forEach(function (chk) { at = Math.max(at, seq.indexOf(chk[chk.length - 1]) + 1); }); a.a.push(blocks); }
        seq = seq.slice(0, at).concat(blocks, seq.slice(at));
        place(seq, t, .8, true); return 2;
      }, { ask: true });
      q.beat(null, function (t) { c.key(g._qg, 'display', t, false); return 0; }, { gap: 0 });
    });
    if (d.grow && d.grow.length) q.beat(d.fullSay || '连起来读：' + txt(seq) + '。', function () { return 1.2; });
    if (mode === 'grow') { if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 528, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; }); return; }
    /* 3 修剪：找路标 */
    owners(seq);
    var cueWant = pr.cue || ['的', '地', '得'], cues = seq.filter(function (b) { return b.cue && cueWant.indexOf(b.w) >= 0; });
    if (cues.length) q.beat(d.cueSay || ('先找路标：' + cues.map(function (b) { return '“' + b.w + '”'; }).join('、') + '。'), function (t) {
      cues.forEach(function (b, k) { c.into(b.g, function () { c.hub(b.x0c + b.wd / 2, y - 14, b.wd + 22, 66, t + k * .5); }); }); return cues.length * .5 + .6;
    });
    /* 4 试剪（演示后果） */
    var tc = d.tryCut;
    if (tc) {
      var tb = seq.filter(function (b) { return b.ci === tc.i && !b.leaf; })[0] || seq[tc.i];
      q.beat(tc.q || ('要是把“' + tb.w + '”也剪掉呢？'), function (t) {
        var p0 = c.at(tb.g, 'transform', t); c.key(tb.g, 'transform', t, [p0[0], p0[1] + 40], { d: .6, ease: 1 }); c.key(tb.g, 'opacity', t, .3, { d: .6, from: 1 }); return 1;
      });
      q.beat(tc.say, function (t) {
        var sg = c.T(W / 2, fy + 92, tc.show, { size: 34, color: INK }, t, 1); c.cross(sg.x1 + 46, fy + 80, t + 1);
        var p0 = c.at(tb.g, 'transform', t + 1.4); c.key(tb.g, 'transform', t + 1.4, [p0[0], p0[1] - 40], { d: .5, ease: 1 }); c.key(tb.g, 'opacity', t + 1.4, 1, { d: .5 });
        c.into(tb.g, function () { c.guard(tb.x0c, tb.x0c + tb.wd, y, t + 1.9, { size: size, label: tb.klabel }); }); tb.guarded = 1;
        return 2.6;
      }, { ask: true });
    }
    /* 5 保护标签 */
    var WHY = { neg: '是否定，剪掉意思就反了，不能剪。', num: '是数量，剪掉范围就变了，不能剪。', key: '是关键的修饰，剪掉意思就错了，不能剪。' };
    seq.filter(function (b) { return b.keep && !b.guarded; }).forEach(function (b) {
      q.beat(b.ksay || ('“' + b.w + '”' + (WHY[b.why] || '不能剪。')), function (t) { c.into(b.g, function () { c.guard(b.x0c, b.x0c + b.wd, y, t, { size: size, label: b.klabel }); }); return 1; });
    });
    /* 6 剪：枝叶与路标下沉淡出（或删除线） */
    function kept(b) { return b.core || b.keep || (b.cue && b.own && (b.own.keep)); }
    var cut = seq.filter(function (b) { return !kept(b); }), rest = seq.filter(kept);
    if (cut.length) q.beat(d.cutSay || '修饰的枝叶，剪掉。', function (t) {
      cut.forEach(function (b, k) {
        if (pr.strike) { c.into(b.g, function () { c.strike(b.x0c, b.x0c + b.wd, y - size * .35, t + k * .3); }); c.key(b.g, 'opacity', t + k * .3 + .4, .35, { d: .4, from: 1 }); }
        else c.sink(b.g, t + k * .3, .8);
      });
      return cut.length * .3 + 1;
    }, { ask: d.ask || '哪几个字是骨头？' });
    /* 7 合拢，读骨架 */
    q.beat(d.coreSay || ('骨架：' + txt(rest) + '。'), function (t) {
      if (pr.strike) { var X = rest.map(function (b) { return b.x; }); formula(rest, X, t); }
      else place(rest, t, .8);
      return 2;
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 528, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* morph 变魔术（E15，设计 §5.2）：句式变换。名词短语整块移动（定语跟着走），弧线换位，原位留虚线空位；
   * 先圈枢纽词（把 / 被）；变换失败就抖动打 ✗ 再退回；可选同学错改（只搬一半，丢下的词掉下去）与前后两格状态图。
   * {k:'morph', lv, h, from:[{id:'A', w:['茂密的','树林'], tag:'动手的', np:1}, {id:'h1', w:['把'], hub:1}, …],
   *  to:['B', {id:'h2', w:['被'], hub:1}, 'A', 'V'],        // 字符串 = 搬 from 里的块；新对象 = 新块从上方落入；from 里没出现在 to 的块淡出
   *  read, hubSay, ask, moveSay, toSay, ok:true|false, okSay, say（失败时的原因，必填）, note（失败时写在句下的一句）, backSay,
   *  wrongTry:{drop:['茂密的'], q, ask, say},                // 同学错改：同样变换但只搬中心语，drop 里的词掉在原处下方 → 错误圈 + ✗ → 退回
   *  roleTo:{B:'zhu'}, roleSay,                               // 可选：变换后画成分线（位置），与上方 tag（角色）对照
   *  state:{a:'杯子好好的', b:'杯子碎了', ok, say}, gap:true, end}
   * 排版：块内间距 0.14 字号、块间 36（layG），每一步构建时算好；块的 tag / 外框挂在块上随块移动。 */
  TPL.morph = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var size = d.size || 44, y = d.y || (d.h ? 296 : 270), GI = Math.round(size * .14), GX = d.gap || 36, lv = c.lv;
    var row = new Row(c, { size: size, y: y }), CH = {}, nn = 0, all = [];
    function chunkOf(sp) {
      if (typeof sp === 'string') { if (!CH[sp]) throw new Error('morph：to 里找不到块 ' + sp); return CH[sp]; }
      if (sp.id && CH[sp.id]) return CH[sp.id];
      var ch = { id: sp.id || ('_n' + (nn++)), hub: !!sp.hub, tag: sp.tag, np: sp.np !== undefined ? !!sp.np : sp.w.length > 1, dx: 0, deco: [] };
      ch.words = sp.w.map(function (w) { var b = row.mk(w, null, { ch: ch, vis: 0, dy: 0 }); all.push(b); return b; });
      ch.head = ch.words[ch.words.length - 1]; CH[ch.id] = ch; return ch;
    }
    var from = d.from.map(chunkOf), to = d.to.map(chunkOf);
    function layout(chs, omit) {
      var ws = [], gaps = [], list = [];
      chs.forEach(function (ch) { var w2 = ch.words.filter(function (b) { return !omit || omit.indexOf(b.w) < 0; }); w2.forEach(function (b, j) { list.push(b); ws.push(b.wd); gaps.push(j < w2.length - 1 ? GI : GX); }); });
      return { list: list, X: layG(ws, gaps, W / 2) };
    }
    function txt(chs) { return chs.map(function (ch) { return ch.words.map(function (b) { return b.w; }).join(''); }).join(''); }
    function span(ch) { var a = ch.words[0], b = ch.head; return [a.x, b.x + b.wd]; }
    /* 把整行排成 chs 的样子：在场的块平移（左移走上弧、右移走下弧），新块落入，不在场的淡出；omit 里的词掉到原处下方 */
    function arrange(chs, t0, o) {
      o = o || {}; var d0 = o.d0 || 1.1, L = layout(chs, o.omit), on = {}, moved = [];
      L.list.forEach(function (b, i) {
        var x = L.X[i]; on[b.id] = 1;
        if (!b.g) { row.create(b, x, t0 + d0 - .3, true); b.vis = 1; if (b.ch.hub) c.into(b.g, function () { c.hub(x + b.wd / 2, y - 14, b.wd + 26, 70, t0 + d0 + .3); }); return; }
        if (!b.vis) { c.key(b.g, 'opacity', t0 + d0 - .3, 1, { d: .4 }); b.vis = 1; }
        if (b.x !== x || b.dy) {
          var arc = b.dy ? 0 : (x < b.x ? 64 : -44);
          if (moved.indexOf(b.ch) < 0) moved.push(b.ch);
          c.move(b.g, { t: t0, x: x - b.x0c, y: 0, d: d0, arc: arc }); b.x = x; b.dy = 0;
        }
      });
      all.forEach(function (b) {
        if (on[b.id] || !b.g || !b.vis) return;
        if (o.omit && o.omit.indexOf(b.w) >= 0) { c.move(b.g, { t: t0 + .2, x: b.x - b.x0c, y: 72, d: .7 }); b.dy = 72; }
        else { c.key(b.g, 'opacity', t0, 0, { d: .5 }); b.vis = 0; }
      });
      /* 整块淡出（不在新排版里）时，挂在块上的 tag / 外框一起淡出；块回来时再显出（第 2 期 03j 补） */
      from.concat(to).forEach(function (ch) {
        if (!ch.deco.length) return;
        var gone = ch.words.every(function (b) { return !b.vis; });
        if (gone && !ch.decoOff) { ch.deco.forEach(function (g) { c.key(g, 'opacity', t0, 0, { d: .5 }); }); ch.decoOff = 1; }
        else if (!gone && ch.decoOff) { ch.deco.forEach(function (g) { c.key(g, 'opacity', t0 + d0 - .3, 1, { d: .4 }); }); ch.decoOff = 0; }
      });
      /* 块上挂的 tag / 外框跟着中心语走 */
      from.concat(to).forEach(function (ch) {
        if (!ch.deco.length) return; var ndx = ch.head.x - ch.head.x0c;
        if (ndx === ch.dx) return;
        ch.deco.forEach(function (g) { c.move(g, { t: t0, x: ndx, d: d0, arc: ndx < ch.dx ? 64 : -44 }); }); ch.dx = ndx;
      });
      return { d: d0 + .8, moved: moved };
    }
    var ok = d.ok !== false, wt = d.wrongTry, failMk;
    /* 1 读原句：整块描框（叙事灰）、上方角色标签 */
    q.beat(d.read || txt(from) + '。', function (t) {
      var L = layout(from);
      L.list.forEach(function (b, i) { row.create(b, L.X[i], t + i * .25); b.vis = 1; });
      var t1 = t + L.list.length * .25 + .3;
      from.forEach(function (ch) {
        var sp = span(ch);
        if (ch.np) { ch.frame = c.dash(sp[0] - 10, y - size * 1.05, sp[1] - sp[0] + 20, size * 1.42, t1, GRAY, { sw: 2, dash: '6 5', rx: 12 }); ch.deco.push(ch.frame); }
        if (ch.tag) ch.deco.push(c.tag((sp[0] + sp[1]) / 2, y - 76, ch.tag, t1 + .3));
      });
      return L.list.length * .25 + 1.2;
    });
    /* 2 圈出枢纽词 */
    var hubs = from.filter(function (ch) { return ch.hub; });
    if (hubs.length) q.beat(d.hubSay || ('先圈出“' + hubs.map(function (ch) { return txt([ch]); }).join('、') + '”。'), function (t) {
      hubs.forEach(function (ch, k) { var b = ch.words[0]; c.into(b.g, function () { c.hub(b.x0c + b.wd / 2, y - 14, b.wd + 26, 70, t + k * .4); }); }); return hubs.length * .4 + .6;
    });
    /* 3 同学错改：只搬中心语，丢下的词掉在原处 */
    if (wt) {
      var lost = [], lostMk = [];
      q.beat(wt.q || '一位同学这样搬：', function (t) {
        from.forEach(function (ch) { if (ch.frame) c.key(ch.frame, 'opacity', t, 0, { d: .3 }); });
        return arrange(to, t, { omit: wt.drop }).d;
      });
      q.beat(wt.say, function (t) {
        all.forEach(function (b) { if (b.dy && b.vis) lost.push(b); });
        lost.forEach(function (b) { c.into(b.g, function () { lostMk.push(c.ring(b.x0c + b.wd / 2, y - 14, b.wd + 30, 66, t, BAD), c.cross(b.x0c + b.wd + 34, y - 30, t + .5)); }); });
        return 1.4;
      }, { ask: wt.ask || '这样搬对吗？' });
      q.beat(wt.backSay || '退回去，整块一起搬。', function (t) {
        lostMk.forEach(function (g) { c.key(g, 'opacity', t, 0, { d: .3 }); });
        var r = arrange(from, t, { d0: .9 });
        from.forEach(function (ch) { if (ch.frame) c.key(ch.frame, 'opacity', t + .9, 1, { d: .3 }); });
        return r.d;
      });
    }
    /* 4 变换：整块弧线换位，原位留虚线空位 */
    var res;
    q.beat(d.moveSay || '整块搬过去。', function (t) {
      var before = {}; from.forEach(function (ch) { before[ch.id] = span(ch); });
      res = arrange(to, t);
      if (d.gap !== false) res.moved.forEach(function (ch) {
        var sp = before[ch.id]; if (!sp) return;
        c.gap((sp[0] + sp[1]) / 2, y, sp[1] - sp[0] + 16, t + .15, { size: size, phi: lv >= 2, sub: lv >= 2 ? '' : '？', until: t + res.d + .6 });
      });
      return res.d + .6;
    }, { ask: d.ask || false });
    /* 5 读新句 → ✓，或抖动 ✗ 再退回 */
    var last = function () { var L = layout(to); return L.X[L.X.length - 1] + L.list[L.list.length - 1].wd; };
    q.beat(d.toSay || txt(to) + '。', function () { return 1; });
    if (ok) q.beat(d.okSay || '意思没变，能说。', function (t) { c.check(Math.min(W - 40, last() + 50), y - 14, t); return .8; });
    else {
      q.beat(d.say, function (t) {
        all.forEach(function (b) { if (b.vis && b.g) c.shake(b.g, t, .9, 9, 4); });
        failMk = c.cross(Math.min(W - 40, last() + 50), y - 14, t + .7);
        if (d.note) wrap(c, d.note, W / 2, y + 96, W - 200, 28, INK, t + 1);
        return 1.8;
      }, { ask: d.judgeAsk || '能这么说吗？' });
      q.beat(d.backSay || '退回原来的样子。', function (t) { c.key(failMk, 'opacity', t, 0, { d: .3 }); return arrange(from, t, { d0: .9 }).d; });
    }
    /* 6 可选：变换后的成分线（位置）对照上方角色标签 */
    if (d.roleTo) q.beat(d.roleSay || null, function (t) {
      var k = 0; for (var id in d.roleTo) { var ch = CH[id], sp = span(ch); (function (ch, sp, kind) { var g = c.role(kind, sp[0], sp[1], y, t + k * .4, { size: size }); })(ch, sp, d.roleTo[id]); k++; }
      return k * .4 + .6;
    });
    /* 7 可选：前后两格状态图 */
    if (d.state) q.beat(d.state.say || null, function (t) {
      c.state2(W / 2, y + 170, d.state.a, d.state.b, t);
      if (d.state.ok === false) c.cross(W / 2 + 370, y + 170, t + 2); else if (d.state.ok) c.check(W / 2 + 370, y + 170, t + 2);
      return 2.4;
    });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 528, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* ---------- nest 套盒子（E15，设计 §5.3；第 3 期） ----------
   * 树：[结构键, 子, 子, …]，子为子树或词下标（从 0 起，从左到右连续）；结构键查 terms.js（pz/db/zw/bl/bc/de/jb…）。
   * {k:'nest', lv:1, style:'box', s:['妈妈','买','的','新','书包'], tree:['pz',['de',['zw',0,1],2],['pz',3,4]], ask, say:[每个盒子的旁白，可省]}
   *   box：自底向上画圆角框（矮的先装），框下写结构名（L1 儿童简称、L2/L3 术语）。
   * {k:'nest', lv:3, style:'stair', s, tree, ask}
   *   stair：句子在上，句下一层一行台阶线：横线覆盖片段、切分处竖短线、结构名写在切分处下方；从上往下逐层切。
   * {k:'nest', lv:3, style:'stair'|'box', s, reads:[{tree, pic:{t:'情境卡文字'}, say}, {…}], ask}
   *   一句两图：左右两栏各一份句子，栏上方情境卡；画到哪种装法就点亮哪张卡，另一张变灰。
   * 排版在构建时算好（textW 估宽，不调用 getBBox）；树深 ≤ 4（--lint R14）。 */
  function nestLabel(key, lv) {
    var e = (window.NHZWB_TERMS || {})[key]; if (!e) return key;
    return lv >= 2 ? (e.s || e.t) : (e.k || e.kid);
  }
  function nestPrep(tree) {
    /* 返回节点表：{key, kids:[node|leaf], lo, hi, h(高度，叶=0), dep(深度，根=0)} */
    var nodes = [];
    function walk(t, dep) {
      if (typeof t === 'number') return { leaf: 1, lo: t, hi: t, h: 0, dep: dep };
      var n = { key: t[0], kids: [], dep: dep };
      for (var i = 1; i < t.length; i++) n.kids.push(walk(t[i], dep + 1));
      n.lo = n.kids[0].lo; n.hi = n.kids[n.kids.length - 1].hi;
      n.h = 1 + Math.max.apply(null, n.kids.map(function (k) { return k.h; }));
      nodes.push(n); return n;
    }
    var root = walk(tree, 0);
    return { root: root, nodes: nodes };
  }
  /* 词间距：相邻两词之间，按两侧最高的盒子留出内边距 */
  function nestLayout(s, P, size, cx, style) {
    var ws = s.map(function (w) { return textW(w, size); }), gaps = [];
    for (var i = 0; i < s.length - 1; i++) {
      var hl = 0, hr = 0;
      P.nodes.forEach(function (n) { if (n.hi === i) hl = Math.max(hl, n.h); if (n.lo === i + 1) hr = Math.max(hr, n.h); });
      gaps.push(style === 'box' ? (hl ? 8 + 12 * hl : 0) + (hr ? 8 + 12 * hr : 0) + 16 : size * .5);
    }
    return { ws: ws, xs: layG(ws, gaps, cx), gaps: gaps };
  }
  TPL.nest = function (c, q, d) {
    if (d.h) heading(c, q, d.h, d.sub);
    var lv = c.lv, style = d.style || (lv >= 3 ? 'stair' : 'box');
    var reads = d.reads || [{ tree: d.tree, say: d.say }];
    var two = reads.length > 1, size = d.size || (two ? 36 : 44);
    var y = d.y || (two ? (style === 'box' ? 300 : 250) : (style === 'box' ? 290 : 200));
    function txt(n) { return d.s.slice(n.lo, n.hi + 1).join(''); }
    var cols = reads.map(function (r, k) {
      var P = nestPrep(r.tree), cx = two ? (k ? W * .75 : W * .25) : W / 2, L = nestLayout(d.s, P, size, cx, style);
      return { r: r, P: P, cx: cx, L: L };
    });
    var pics = [];
    /* 1 读句子（两栏：先出两张情境卡） */
    q.beat(d.read || d.s.join('') + '。', function (t) {
      cols.forEach(function (col, k) {
        if (two && col.r.pic) { pics[k] = c.pic(col.cx, 150, 500, 76, col.r.pic.t, t + k * .3, { size: 24 }); pics[k].setAttribute('data-pic', k); }
        d.s.forEach(function (w, i) { c.T(col.L.xs[i] + col.L.ws[i] / 2, y, w, { size: size }, t + .4 + i * .2, .3); });
      });
      return .8 + d.s.length * .2;
    });
    /* 2 逐栏装 / 切 */
    cols.forEach(function (col, k) {
      var X0 = function (i) { return col.L.xs[i]; }, X1 = function (i) { return col.L.xs[i] + col.L.ws[i]; };
      if (two) q.beat(col.r.say || ('第' + (k ? '二' : '一') + '种装法。'), function (t) {
        if (pics[k]) c.key(pics[k], 'opacity', t, 1, { d: .3 });
        pics.forEach(function (g, j) { if (j !== k && g) c.key(g, 'opacity', t, .35, { d: .4 }); });
        return .6;
      }, { ask: k === 0 ? (d.ask || true) : false });
      if (style === 'box') {
        var ord = col.P.nodes.slice().sort(function (a, b) { return a.h - b.h || a.lo - b.lo; });
        ord.forEach(function (n, j) {
          var lab = nestLabel(n.key, lv), say = (!two && d.say && d.say[j]) || ('“' + n.kids.map(function (kk) { return txt(kk); }).join('”和“') + '”装进一个盒子：' + lab + '。');
          q.beat(say, function (t) {
            var ph = 8 + 12 * n.h, pv = 6 + 32 * n.h, x0 = X0(n.lo) - ph, x1 = X1(n.hi) + ph, top = y - size * .95 - pv, bot = y + size * .28 + pv;
            c.R('rectangle', [x0, top, x1 - x0, bot - top], { stroke: ROLE, strokeWidth: 2.4, roughness: .7 }, t, .6);
            c.T((x0 + x1) / 2, bot - 5, lab, { size: 20, color: ROLE }, t + .5, .4);
            return 1.1;
          }, { ask: !two && j === 0 ? (d.ask || true) : false });
        });
      } else {
        var deps = col.P.nodes.map(function (n) { return n.dep; }), maxd = Math.max.apply(null, deps);
        for (var r = 0; r <= maxd; r++) (function (r) {
          var row = col.P.nodes.filter(function (n) { return n.dep === r; }).sort(function (a, b) { return a.lo - b.lo; });
          var sayR = (!two && d.say && d.say[r]) || (r === 0 ? '先一刀切成两块：' : '再往下切：') + row.map(function (n) { return n.kids.map(function (kk) { return txt(kk); }).join('｜') + '，' + nestLabel(n.key, lv); }).join('；') + '。';
          q.beat(sayR, function (t) {
            var yy = y + 50 + 46 * r;
            row.forEach(function (n, j) {
              var x0 = X0(n.lo) + 3, x1 = X1(n.hi) - 3, cuts = [];
              for (var m = 0; m < n.kids.length - 1; m++) { var a = n.kids[m].hi; cuts.push((X1(a) + X0(a + 1)) / 2); }
              c.stair(x0, x1, yy, cuts, null, t + j * .3);
              c.T(cuts[0] + (cuts.length > 1 ? (cuts[cuts.length - 1] - cuts[0]) / 2 : 0), yy + 32, nestLabel(n.key, lv), { size: size > 40 ? 26 : 24, color: ROLE }, t + j * .3 + .5, .4);
            });
            return .9 + row.length * .3;
          }, { ask: !two && r === 0 ? (d.ask || true) : false });
        })(r);
      }
    });
    if (two) q.beat(d.both || '一句话，两种装法，两种意思。', function (t) { pics.forEach(function (g) { if (g) c.key(g, 'opacity', t, 1, { d: .4 }); }); return .8; });
    if (d.end) q.beat(d.end, function (t) { c.T(W / 2, 528, d.end, { size: 30, color: ACC }, t, 1.4); return 1.4; });
  };

  /* ---------- 编排：每幕的 build 与时长（不建 DOM 也能算时长） ---------- */
  /* E9：种子 = 20261104 + 原始序号 × 1000（原始序号 = 该幕在 scenes 数组里的位置，与档位过滤无关） */
  function buildScene(svg, sc, idx) {
    var c = new Ctx(svg, 20261104 + idx * 1000), q = new Seq(c, .3);
    c.lv = sc.lv || 1;
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
    ctl.innerHTML = '<button type="button" class="wb-play">▶ 播放</button><input type="range" class="wb-bar" min="0" max="1000" value="0" aria-label="进度">' +
      '<span class="wb-lv" role="group" aria-label="难度">' + LVN.map(function (n, k) { return '<button type="button" data-lv="' + (k + 1) + '" aria-pressed="false">' + n + '</button>'; }).join('') + '</span>' +
      '<label class="wb-tts"><input type="checkbox" checked> 朗读</label>';
    var more = document.createElement('div'); more.className = 'wb-more';
    board.appendChild(svg); board.appendChild(cap); el.appendChild(tabs); el.appendChild(board); el.appendChild(ctl); el.appendChild(more);
    var pb = ctl.querySelector('.wb-play'), bar = ctl.querySelector('.wb-bar'), tts = ctl.querySelector('.wb-tts input');
    try { if (localStorage.getItem('nhz_wb_mute') === '1') tts.checked = false; } catch (e) {}
    tts.onchange = function () { try { localStorage.setItem('nhz_wb_mute', tts.checked ? '0' : '1'); } catch (e) {} if (!tts.checked) hush(); };

    var S = -1, t = 0, playing = false, last = 0, scene = null, spoken = -1, raf = 0;
    var scenes = spec.scenes;
    /* E9 档位：1 浅（lv≤1）2 中（lv≤2，默认）3 深（全部）；title / end 任何档位都显示。S 始终是原始序号 */
    var LVL = 2; try { var sv = parseInt(localStorage.getItem('nhz_wb_lv'), 10); if (sv >= 1 && sv <= 3) LVL = sv; } catch (e) {}
    var vis = [];
    function visOf(lv) { var o = []; scenes.forEach(function (sc, i) { if (sc.k === 'title' || sc.k === 'end' || (sc.lv || 1) <= lv) o.push(i); }); return o; }
    function hush() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} }
    function speak(s) {
      if (!tts.checked) return;
      try { var u = new SpeechSynthesisUtterance(s.replace(/……/g, '')); u.lang = 'zh-CN'; u.rate = .85; hush(); window.speechSynthesis.speak(u); } catch (e) {}
    }
    function load(i) {
      S = i; while (svg.firstChild) svg.removeChild(svg.firstChild);
      scene = buildScene(svg, scenes[i], i); spoken = -1;
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('on', +b.getAttribute('data-i') === i); });
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
        var nx = vis[vis.indexOf(S) + 1];
        if (nx !== undefined) { load(nx); t = 0; render(); }
        else { stop('↻ 重播'); return; }
      }
      raf = requestAnimationFrame(loop);
    }
    function play() {
      if (S === vis[vis.length - 1] && t >= scene.dur) { load(vis[0]); t = 0; }
      playing = true; spoken = -1; pb.textContent = '❚❚ 暂停'; last = performance.now(); raf = requestAnimationFrame(loop);
    }
    pb.onclick = function () { if (playing) stop(); else play(); };
    bar.oninput = function () { t = bar.value / 1000 * scene.dur; spoken = -1; hush(); render(); };
    svg.addEventListener('click', function () { if (playing) stop(); else play(); });
    function setLv(lv, keep) {
      LVL = lv; vis = visOf(lv);
      if (!keep) { try { localStorage.setItem('nhz_wb_lv', String(lv)); } catch (e) {} }
      Array.prototype.forEach.call(ctl.querySelectorAll('.wb-lv button'), function (b) { var on = +b.getAttribute('data-lv') === lv; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      tabs.innerHTML = '';
      vis.forEach(function (i, n) {
        var sc = scenes[i], b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-i', i);
        b.textContent = (n + 1) + ' ' + (sc.tab || sc.h || sc.t || '');
        b.onclick = function () { stop(); load(i); t = 0; render(); };
        tabs.appendChild(b);
      });
      var hid = scenes.length - vis.length;
      more.textContent = hid ? '深一点还有 ' + hid + ' 幕' + (lv < 3 ? '（选「' + LVN[lv] + '」' + (lv === 1 ? '或「深」' : '') + '可看）' : '') : '';
      more.style.display = hid ? '' : 'none';
    }
    ctl.querySelector('.wb-lv').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var lv = +b.getAttribute('data-lv'); if (lv === LVL) return;
      stop(); setLv(lv);
      if (vis.indexOf(S) < 0) { load(vis[0]); t = 0; } else Array.prototype.forEach.call(tabs.children, function (x) { x.classList.toggle('on', +x.getAttribute('data-i') === S); });
      render();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && playing) stop(); });
    setLv(LVL, true);
    load(vis[0]); render();
    var api = {
      play: play, pause: function () { stop(); },
      /* seek / seekRaw / durations 都按原始序号（与档位无关），供验收脚本用 */
      seek: function (i, sec) { if (S !== i) load(i); t = sec; render(); return scene.dur; },
      seekRaw: function (i, sec) { return api.seek(i, sec); },
      visible: function () { return vis.slice(); }, level: function () { return LVL; }, name: name,
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
      '.wb-ctl .wb-lv{display:inline-flex;border:1.5px solid var(--line,#d5dfd0);border-radius:12px;overflow:hidden}' +
      '.wb-ctl .wb-lv button{min-height:44px;min-width:48px;border:0;border-right:1px solid var(--line,#d5dfd0);background:var(--surface,#f8faf5);color:var(--ink,#2c3328);font-size:16px;cursor:pointer;font-family:inherit}' +
      '.wb-ctl .wb-lv button:last-child{border-right:0}.wb-ctl .wb-lv button.on{background:var(--accent-deep,#3d5a40);color:#fff}' +
      '.wb-more{margin-top:6px;font-size:14px;color:var(--muted,#6b7566);text-align:right}' +
      '.wb-ctl .wb-tts{font-size:15px;color:var(--muted,#6b7566);display:flex;align-items:center;gap:4px;min-height:44px}' +
      '@media (prefers-color-scheme:dark){.wb-board{border-color:#3a4237}}';
    document.head.appendChild(st);
  }

  window.NHZWB = {
    add: function (name, spec) { REG[name] = spec; },
    has: function (name) { return !!REG[name]; },
    mount: function (el, name) { css(); return mount(el, name); },
    names: function () { return Object.keys(REG); },
    SYM: SYM, W: W, H: H, PAL: PAL, term: term, TPL: TPL, LV: LVN
  };
})();
