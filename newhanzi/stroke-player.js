/* 笔顺动画组件（独立文件，不接入任何现有页面；接入等词条型模板批复后再做）。
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

  function mount(container, data, opts) {
    opts = opts || {};
    var speed = opts.speed || 1;
    var strokes = (data && data.strokes) || [];
    var medians = (data && data.medians) || [];
    var n = Math.min(strokes.length, medians.length);
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
      if (state === 'playing') strokeDur = strokeDuration(idx);
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
