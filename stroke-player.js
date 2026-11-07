/* 笔顺动画组件（已接入 zika.html 字卡页形块区“看笔顺”块）。
 * 用法：var p = NHZStrokePlayer.mount(el, {strokes:[...], medians:[[[x,y],...],...]}, opts);
 * 数据格式与字卡 dim.笔顺一致：strokes 为 SVG 填充路径（1024 坐标），medians 为每笔中线点列。
 * 播放：毛笔沿中线移动画出该笔（中线描画），落笔后显示真实笔形；支持播放 / 暂停 / 重看 / 调速。
 * 无外部依赖，file:// 可用。颜色只用 zika.css 护眼色板值。
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#2c3328';

  function el(tag, attrs, parent) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function segLen(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  function polyLen(pts) {
    var L = 0;
    for (var i = 1; i < pts.length; i++) L += segLen(pts[i - 1], pts[i]);
    return L;
  }
  // 沿中线按距离取点，同时返回该段方向 dx（用于笔倾斜）
  function pointAt(pts, dist) {
    var acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var L = segLen(pts[i - 1], pts[i]);
      if (acc + L >= dist || i === pts.length - 1) {
        var t = L === 0 ? 0 : Math.min(1, Math.max(0, (dist - acc) / L));
        return {
          x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
          y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
          dx: pts[i][0] - pts[i - 1][0]
        };
      }
      acc += L;
    }
    var last = pts[pts.length - 1];
    return { x: last[0], y: last[1], dx: 0 };
  }

  // 数据纠偏：部分字数据的中线点列是倒着存的（从收笔点走向起笔点），
  // 长斜笔（撇/捺）还有左右镜像的斜度。播放器在绘制前按笔形纠正，
  // 只改播放用的点列与轮廓路径，不改原始数据文件。
  // 规则（以 3500 字 33959 笔实测校准）：折笔以相邻段最大转角 >50° 判定；
  // 长对角笔（长>500、横竖跨度均>100、非折笔、位置明显偏左/右）斜度与所在
  // 侧不符时，沿该笔包围盒中心 x 镜像点列与轮廓；方向：折笔按整体走向与
  // 首段判定，横笔按左右，直笔上行按左右与长度判定（提类短笔保留），
  // 下行一律保留。镜像时轮廓与中线用同一中心变换，对齐关系不变。
  function maxTurn(pts) {
    var mx = 0;
    for (var i = 1; i < pts.length - 1; i++) {
      var ax = pts[i][0] - pts[i - 1][0], ay = pts[i][1] - pts[i - 1][1];
      var bx = pts[i + 1][0] - pts[i][0], by = pts[i + 1][1] - pts[i][1];
      var d = (ax * bx + ay * by) / ((Math.sqrt(ax * ax + ay * ay) || 1) * (Math.sqrt(bx * bx + by * by) || 1));
      var ang = Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI;
      if (ang > mx) mx = ang;
    }
    return mx;
  }
  function mirrorPathX(d, cx) {
    var toks = d.match(/[MLQCZ]|-?\d*\.?\d+/g) || [];
    var out = [], cmd = '', pair = 0, coord = 0;
    function pairsFor(c) { return c === 'M' || c === 'L' ? 1 : c === 'Q' ? 2 : c === 'C' ? 3 : 0; }
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (/[MLQCZ]/.test(t)) { cmd = t; pair = 0; coord = 0; out.push(t); }
      else if (coord === 0) { out.push(String(2 * cx - parseFloat(t))); coord = 1; }
      else {
        out.push(t); coord = 0; pair++;
        if (pair >= pairsFor(cmd)) { pair = 0; if (cmd === 'M') cmd = 'L'; }
      }
    }
    return out.join(' ');
  }
  function correctStroke(med, path, charCX, charW) {
    var L0 = polyLen(med);
    var xs = med.map(function (p) { return p[0]; });
    var cx0 = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var dx0 = med[med.length - 1][0] - med[0][0], dy0 = med[med.length - 1][1] - med[0][1];
    var bent0 = maxTurn(med) > 50;
    var m = med, p = path;
    if (!bent0 && L0 > 500 && Math.abs(dx0) > 100 && Math.abs(dy0) > 100) {
      var slantUp = dx0 * dy0 < 0;
      var isLeft = cx0 < charCX - 0.15 * charW;
      var isRight = cx0 > charCX + 0.15 * charW;
      if ((isLeft && !slantUp) || (isRight && slantUp)) {
        m = med.map(function (pt) { return [2 * cx0 - pt[0], pt[1]]; });
        p = mirrorPathX(path, cx0);
      }
    }
    var L = polyLen(m);
    var dx = m[m.length - 1][0] - m[0][0], dy = m[m.length - 1][1] - m[0][1];
    var f = pointAt(m, 0.12 * L);
    var Fdx = f.x - m[0][0], Fdy = f.y - m[0][1];
    var bent = maxTurn(m) > 50;
    var flip = false;
    if (bent) {
      if (Math.abs(dy) < 0.35 * Math.abs(dx)) flip = dx < 0;
      else if (dy <= 0) flip = (Fdy > 0.3 * Math.abs(Fdx)) || (Fdy < -0.7 * Math.abs(Fdx));
    } else if (Math.abs(dy) < 0.35 * Math.abs(dx)) flip = dx < 0;
    else if (dy < 0) {
      if (dx < 0) flip = true;
      else flip = (L < 300) || (L > 500) || (Math.abs(dx) < 0.5 * Math.abs(dy));
    }
    if (flip) m = m.slice().reverse();
    return { med: m, path: p };
  }

  function mount(container, data, opts) {
    opts = opts || {};
    var speed = opts.speed || 1;
    var strokes = (data && data.strokes) || [];
    var medians = (data && data.medians) || [];
    var n = Math.min(strokes.length, medians.length);
    if (n > 0) {
      var xMin = 1e9, xMax = -1e9;
      for (var ci = 0; ci < n; ci++) {
        for (var cj = 0; cj < medians[ci].length; cj++) {
          if (medians[ci][cj][0] < xMin) xMin = medians[ci][cj][0];
          if (medians[ci][cj][0] > xMax) xMax = medians[ci][cj][0];
        }
      }
      var charCX = (xMin + xMax) / 2, charW = xMax - xMin;
      var fixedMeds = [], fixedPaths = [];
      for (var fi = 0; fi < n; fi++) {
        var fx = correctStroke(medians[fi], strokes[fi], charCX, charW);
        fixedMeds.push(fx.med); fixedPaths.push(fx.path);
      }
      medians = fixedMeds; strokes = fixedPaths;
    }
    var wrap = el('div', { 'class': 'nhz-sp' }, container);
    var svg = svgEl('svg', { 'class': 'nhz-sp-svg', viewBox: '0 0 1024 1024', role: 'img', 'aria-label': '笔顺动画' }, wrap);
    if (opts.grid !== false) {
      svgEl('rect', { x: 20, y: 20, width: 984, height: 984, fill: 'none', stroke: '#d5dfd0', 'stroke-width': 3 }, svg);
      svgEl('line', { x1: 512, y1: 20, x2: 512, y2: 1004, stroke: '#d5dfd0', 'stroke-width': 2, 'stroke-dasharray': '14 14' }, svg);
      svgEl('line', { x1: 20, y1: 512, x2: 1004, y2: 512, stroke: '#d5dfd0', 'stroke-width': 2, 'stroke-dasharray': '14 14' }, svg);
    }
    var outlines = [], traces = [], lens = [];
    for (var i = 0; i < n; i++) {
      outlines.push(svgEl('path', { 'class': 'nhz-sp-outline', d: strokes[i], fill: INK, opacity: 0 }, svg));
      var d = 'M ' + medians[i].map(function (p) { return p[0] + ' ' + p[1]; }).join(' L ');
      var L = polyLen(medians[i]);
      lens.push(L);
      var tr = svgEl('path', { 'class': 'nhz-sp-trace', d: d, fill: 'none', stroke: INK, 'stroke-width': 30,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0,
        'stroke-dasharray': L, 'stroke-dashoffset': L }, svg);
      traces.push(tr);
    }
    // 毛笔：笔尖在局部原点 (0,0)，笔身向上；用 transform 平移+倾斜定位
    var brush = svgEl('g', { 'class': 'nhz-sp-brush', opacity: 0 }, svg);
    svgEl('rect', { x: -8, y: -168, width: 16, height: 118, rx: 8, fill: '#8a5a44' }, brush);
    svgEl('rect', { x: -10, y: -50, width: 20, height: 16, fill: '#d9c9a8' }, brush);
    svgEl('path', { d: 'M -10 -34 Q 0 -14 10 -34 L 5 0 Q 0 10 -5 0 Z', fill: INK }, brush);

    var ctrls = el('div', { 'class': 'nhz-sp-ctrls' }, wrap);
    var btnPlay = el('button', { 'class': 'nhz-sp-btn', type: 'button' }, ctrls);
    btnPlay.textContent = '播放';
    var btnPause = el('button', { 'class': 'nhz-sp-btn', type: 'button' }, ctrls);
    btnPause.textContent = '暂停';
    var btnReplay = el('button', { 'class': 'nhz-sp-btn', type: 'button' }, ctrls);
    btnReplay.textContent = '重看';
    var sel = el('select', { 'class': 'nhz-sp-speed', 'aria-label': '播放速度' }, ctrls);
    [['0.5', '慢速'], ['1', '正常'], ['2', '快速']].forEach(function (o) {
      var op = el('option', { value: o[0] }, sel);
      op.textContent = o[1];
      if (o[0] === '1') op.selected = true;
    });

    var state = 'idle'; // idle | playing | paused | done
    var idx = 0, raf = 0, strokeStart = 0, strokeElapsed = 0, strokeDur = 0;

    function setBrush(x, y, dx) {
      var tilt = dx >= 0 ? 14 : -14;
      brush.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + tilt + ')');
      brush.setAttribute('opacity', 1);
    }
    function hideBrush() { brush.setAttribute('opacity', 0); }
    function reset() {
      for (var i = 0; i < n; i++) {
        outlines[i].setAttribute('opacity', 0);
        traces[i].setAttribute('opacity', 0);
        traces[i].setAttribute('stroke-dashoffset', lens[i]);
      }
      hideBrush();
      idx = 0; strokeElapsed = 0;
    }
    function strokeDuration(i) {
      return Math.min(1100, Math.max(250, lens[i] * 1.1)) / speed;
    }
    function finishStroke(i) {
      traces[i].setAttribute('opacity', 0);
      outlines[i].setAttribute('opacity', 1);
      if (opts.onStroke) opts.onStroke(i);
    }
    function tick(now) {
      if (state !== 'playing') return;
      if (!strokeStart) strokeStart = now - strokeElapsed;
      var el = now - strokeStart;
      var med = medians[idx], L = lens[idx];
      var p = pointAt(med, (el / strokeDur) * L);
      traces[idx].setAttribute('opacity', 1);
      traces[idx].setAttribute('stroke-dashoffset', Math.max(0, L - (el / strokeDur) * L));
      setBrush(p.x, p.y, p.dx);
      if (el >= strokeDur) {
        finishStroke(idx);
        idx++;
        strokeStart = 0; strokeElapsed = 0;
        if (idx >= n) {
          state = 'done'; hideBrush();
          if (opts.onDone) opts.onDone();
          return;
        }
        strokeDur = strokeDuration(idx);
      }
      raf = requestAnimationFrame(tick);
    }
    function play() {
      if (n === 0) return;
      if (state === 'done') reset();
      if (state === 'playing') return;
      state = 'playing';
      strokeDur = strokeDuration(idx);
      strokeStart = 0;
      raf = requestAnimationFrame(tick);
    }
    function pause() {
      if (state !== 'playing') return;
      state = 'paused';
      cancelAnimationFrame(raf);
      // 记下当前笔内已走时间，恢复时续上
      strokeElapsed = strokeDur > 0 ? Math.min(strokeDur, performance.now() - (strokeStart || performance.now())) : 0;
      strokeStart = 0;
    }
    function replay() {
      cancelAnimationFrame(raf);
      reset();
      state = 'idle';
      play();
    }
    btnPlay.addEventListener('click', play);
    btnPause.addEventListener('click', pause);
    btnReplay.addEventListener('click', replay);
    sel.addEventListener('change', function () {
      speed = parseFloat(sel.value) || 1;
      /* 播放中改速度：按已走比例折算剩余时长，否则进度会跳变 */
      if (state === 'playing' && strokeStart > 0 && strokeDur > 0) {
        var frac = Math.min(1, (performance.now() - strokeStart) / strokeDur);
        strokeDur = strokeDuration(idx);
        strokeStart = performance.now() - frac * strokeDur;
      } else if (state === 'playing') {
        strokeDur = strokeDuration(idx);
      }
    });

    return {
      play: play, pause: pause, replay: replay,
      get state() { return state; },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }
    };
  }

  window.NHZStrokePlayer = { mount: mount };
})();
