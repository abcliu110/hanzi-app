/* newhanzi 字卡渲染：12 维度 → 5 个阅读分区 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function speak(text) {
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = 0.85;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* 不支持则静默 */ }
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function asArray(x) {
    // 脏数据防弹：字符串 -> [字符串]，null/undefined -> []
    return Array.isArray(x) ? x : (x == null ? [] : [x]);
  }
  function sec(title, tag, inner) {
    if (!inner) return '';
    return '<section class="card"><h2>' + esc(title) +
      (tag ? '<span class="tag">' + esc(tag) + '</span>' : '') +
      '</h2>' + inner + '</section>';
  }
  function kv(k, v) {
    if (!v) return '';
    return '<div class="kv"><div class="k">' + esc(k) + '</div><div class="v">' + v + '</div></div>';
  }

  /* ---- 笔顺静态展示：笔画按顺序直接画出，带笔顺序号（数据为 y-up 坐标，翻转后显示） ---- */
  function renderStrokes(svg, strokes) {
    svg.innerHTML = '';
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', 'translate(0,900) scale(1,-1)');
    strokes.forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#e8762d');
      p.setAttribute('stroke-width', '14');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      g.appendChild(p);
    });
    svg.appendChild(g);
    // 笔顺序号：标在每笔起笔处（坐标同样翻转）
    strokes.forEach(function (d, i) {
      var m = d.match(/M\s*([\d.]+)[,\s]+([\d.]+)/);
      if (!m) return;
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', parseFloat(m[1]) + 20);
      t.setAttribute('y', 900 - parseFloat(m[2]) - 16);
      t.setAttribute('font-size', '30');
      t.setAttribute('fill', '#b3541e');
      t.textContent = (i + 1);
      svg.appendChild(t);
    });
  }

  /* ---- 描红 ---- */
  function initTrace(canvas, strokes) {
    var ctx = canvas.getContext('2d');
    var S = 900;
    canvas.width = S; canvas.height = S;
    function drawTemplate() {
      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.translate(0, S); ctx.scale(1, -1); // 笔画数据为 y-up 坐标，翻转后显示
      ctx.strokeStyle = '#d8d2c8'; ctx.lineWidth = 16;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokes.forEach(function (d) {
        ctx.stroke(new Path2D(d));
      });
      ctx.restore();
    }
    drawTemplate();
    var drawing = false, last = null;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return [(p.clientX - r.left) * S / r.width, (p.clientY - r.top) * S / r.height];
    }
    canvas.addEventListener('pointerdown', function (e) {
      drawing = true; last = pos(e); e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.strokeStyle = '#e8762d'; ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      last = p; e.preventDefault();
    });
    window.addEventListener('pointerup', function () {
      drawing = false;
    });
    return {
      clear: function () { drawTemplate(); }
    };
  }

  /* ---- 主渲染 ---- */
  function render(r) {
    var dim = r.dim || {};
    var app = document.getElementById('app');
    document.getElementById('navtitle').textContent = r.zi + ' · 字卡';
    document.title = r.zi + ' · 字卡';

    var h = '';

    /* 1. 字头区 */
    var chips = '';
    // 部首双向关联：字 -> 部首含义（bushou/data.js + zi_map.js）
    var bsKey = (window.NHZ_ZI_BUSHOU || {})[r.zi] || '';
    var bsEntry = null;
    if (bsKey && window.NHZ_BUSHOU) {
      for (var bi = 0; bi < window.NHZ_BUSHOU.length; bi++) {
        if (window.NHZ_BUSHOU[bi].bushou === bsKey) { bsEntry = window.NHZ_BUSHOU[bi]; break; }
      }
    }
    if (dim['部首']) {
      var buLabel = dim['部首']['部首'];
      // 偏旁部首只显示归属、不断言语义（假借字如"柒"语义与部首无关），含义见部首详情页
      chips += bsEntry
        ? '<a class="chip" href="bushou.html?b=' + encodeURIComponent(bsEntry.bushou) + '">偏旁部首 ' + esc(buLabel) + '</a>'
        : '<span class="chip">偏旁部首 ' + esc(buLabel) + '</span>';
    }
    if (dim['笔画']) chips += '<span class="chip">' + esc(dim['笔画']['笔画数']) + ' 画</span>';
    if (dim['繁体']) chips += '<span class="chip">繁体 ' + esc(dim['繁体']['繁体']) + '</span>';
    if (dim['结构']) {
      if (dim['结构']['间架结构']) chips += '<span class="chip">' + esc(dim['结构']['间架结构']) + '</span>';
      else if (dim['结构']['独体']) chips += '<span class="chip">独体字</span>';
    }
    if (dim['六书'] && dim['六书'].value) chips += '<span class="chip">' + esc(dim['六书'].value) + '</span>';
    h += '<div class="hero"><div class="bigzi">' + esc(r.zi) + '</div>' +
      (dim['读音'] ? '<div class="pinyin">' + esc(String(dim['读音']['拼音'] || '').replace(/,/g, '、')) + '</div>' : '') +
      '<div class="chips">' + chips + '</div>' +
      // 偏旁部首直达部首库（只显示归属；语义解读在部首详情页，避免对假借字误断）
      (bsEntry
        ? '<a class="bs-mean" href="bushou.html?b=' + encodeURIComponent(bsEntry.bushou) + '">🧩 偏旁部首「' +
          esc(bsEntry.bushou) + '」的含义与例字 ›</a>'
        : '') +
      '<button class="speak" id="speakBtn">🔊 读一读</button></div>';

    /* 2. 字从哪来（字源 + 六书） */
    var zy = '';
    if (dim['字源']) {
      var z = dim['字源'];
      if (z['讲解']) zy += '<div class="ex" style="margin-bottom:6px">' + esc(z['讲解']) + '</div>';
      if (z['说文解字']) zy += kv('说文解字', esc(z['说文解字']));
      if (z['说文原字头'] && z['说文原字头'] !== r.zi) zy += kv('说文原字', esc(z['说文原字头']) + '（简化字对应原字头）');
      /* 字源可信度：迁移自老 app origin.conf；空值显示“未标注”，不编造 */
      zy += kv('字源可信度', z['可信度'] ? esc(z['可信度']) + (z['可信度'] === '待查' ? '（说法尚待核对）' : '') : '未标注');
      if (z['反切']) zy += kv('反切', esc(z['反切']));
      if (z['小篆']) zy += kv('小篆', '<span style="font-size:28px">' + esc(z['小篆']) + '</span>');
      if (z['演变阶段']) {
        zy += '<div class="kv"><div class="k">演变</div><div class="v"><div class="evo">' +
          asArray(z['演变阶段']).map(function (s, i) {
            return (i ? '<span class="arrow">→</span>' : '') +
              '<span class="stage">' + esc(s.stage || '') + '</span>';
          }).join('') + '</div></div></div>';
      }
      if (z['段注六书']) zy += kv('段注', '段玉裁注：此字於六書為「' + esc(z['段注六书']) + '」');
    }
    if (dim['六书'] && dim['六书'].value) {
      var ls = '<span class="badge2 orange">' + esc(dim['六书'].value) + '</span>';
      if (dim['六书']['声旁']) ls += '<span class="badge2 blue">声旁：' + esc(dim['六书']['声旁']) + '</span>';
      if (dim['六书']['形旁']) ls += '<span class="badge2 green">形旁：' + esc(dim['六书']['形旁']) + '</span>';
      if (dim['六书']['依据']) ls += '<div class="ex">' + esc(dim['六书']['依据']) + '</div>';
      zy = kv('六书归类', ls) + zy;
    }
    h += sec('字从哪来', '字源 · 六书', zy);

    /* 3. 字长什么样（结构 + 形声拆解 + 笔顺 + 描红） */
    var zx = '';
    if (dim['结构'] && dim['结构']['顶层部件']) {
      zx += kv('部件', dim['结构']['顶层部件'].map(function (c) {
        return '<span class="badge2 blue">' + esc(c) + '</span>';
      }).join(''));
    }
    if (dim['形声拆解']) {
      var pd = dim['形声拆解'];
      zx += kv('形声拆解', esc(pd.meaning || '') +
        (pd.sound ? '<br>' + esc(pd.sound) : '') +
        (pd.note ? '<div class="ex">' + esc(pd.note) + '</div>' : ''));
    }
    var bs = dim['笔顺'] || {};
    if ((bs.strokes && bs.strokes.length) || bs['笔顺文字']) {
      zx += '<div class="kv"><div class="k">笔顺</div><div class="v"><div class="strokebox">' +
        '<div id="svgwrap"><svg viewBox="0 0 900 900"></svg></div>' +
        '<div id="tracewrap"><canvas id="trace"></canvas></div>' +
        '<div class="stroke-ctl">' +
        '<button class="btn" id="clearBtn">🧽 描红清除</button>' +
        '</div></div>';
      if (bs['笔顺文字']) {
        zx += '<div class="ex" style="margin-top:8px">' +
          asArray(bs['笔顺文字']).map(esc).join('<br>') + '</div>';
      }
      zx += '</div></div>';
    }
    h += sec('字长什么样', '结构 · 笔顺 · 描红', zx);

    /* 4. 别认错（形近字 + 易错提示） */
    var bx = '';
    asArray(dim['形近字']).slice(0, 6).forEach(function (x) {
      var note = typeof x === 'string' ? x : (x['辨析'] || '');
      var from = typeof x === 'object' && x['来源'] ? x['来源'] : '';
      bx += '<div class="xj">' + esc(note) +
        (from ? '<div class="from">来源：' + esc(from) + '</div>' : '') + '</div>';
    });
    asArray(dim['易错提示']).forEach(function (t) {
      bx += '<div class="warn">⚠️ ' + esc(t) + '</div>';
    });
    h += sec('别认错', '形近字 · 易错点', bx);

    /* 5. 字的魔法（字→词→句→文） */
    var mf = '';
    asArray(dim['运用链']).forEach(function (s) {
      mf += '<div class="yiyi">';
      mf += '<span class="st">' + esc(s['义项'] || '组词') + '</span>';
      if (s['类型']) mf += '<span class="lx">' + esc(s['类型']) + '</span>';
      if (s['词'] && s['词'].length) {
        mf += '<div class="words">' + s['词'].map(function (w) {
          return '<span>' + esc(w) + '</span>';
        }).join('') + '</div>';
      }
      if (s['句']) mf += '<div class="ex">例：' + esc(s['句']) + '</div>';
      if (s['文'] && s['文'].text) {
        mf += '<div class="classic">' + esc(s['文'].text) +
          (s['文']['出处'] ? '<div class="src">—— ' + esc(s['文']['出处']) + '</div>' : '') + '</div>';
      }
      mf += '</div>';
    });
    h += sec('字的魔法', '字 → 词 → 句 → 文', mf);

    /* 6. 诗句里的这个字（字→诗句链） */
    var sjInner = '';
    try {
      var sjIdx = (window.NHZ_SHIJU && window.NHZ_SHIJU.idx) || {};
      var sjMeta = (window.NHZ_SHIJU && window.NHZ_SHIJU.meta) || {};
      var sjOrders = sjIdx[r.zi] || [];
      if (sjOrders.length) {
        sjInner = '<div class="yiyi">' + sjOrders.slice(0, 3).map(function (o) {
          var m = sjMeta[String(o)] || {};
          return '<a class="sc-worklink" href="shici.html#poem-' + o + '">《' + esc(m.t || ('第' + o + '首')) + '》</a>';
        }).join(' · ') +
        '<div style="margin-top:8px"><a class="sc-worklink" href="shici.html#zilian-' + encodeURIComponent(r.zi) + '">更多含「' + esc(r.zi) + '」的诗句 →</a></div></div>';
      }
    } catch (e) { sjInner = ''; }
    h += sec('诗句里的「' + r.zi + '」', '字 → 诗句', sjInner);

    h += '<div class="src-note">数据来源：通用规范汉字表 · Unihan · 《说文解字》· hanzi-writer-data · CC-CEDICT</div>';

    app.innerHTML = h;

    /* 交互 wiring */
    document.getElementById('speakBtn').onclick = function () {
      var t = r.zi;
      if (dim['读音'] && dim['读音']['拼音']) t += '，' + dim['读音']['拼音'];
      speak(t);
    };
    var strokes = (dim['笔顺'] && dim['笔顺'].strokes) || [];
    if (strokes.length) {
      var svg = document.querySelector('#svgwrap svg');
      var trace = initTrace(document.getElementById('trace'), strokes);
      document.getElementById('clearBtn').onclick = function () {
        trace.clear();
      };
      renderStrokes(svg, strokes); // 静态展示：笔画按笔顺直接画出
    }
  }

  /* ---- 入口：单字数据走 data/zika/<字>.js，经 <script> 动态加载（file:// 可用） ---- */
  function main() {
    var m = /[?&]zi=([^&]+)/.exec(location.search);
    var zi = m ? decodeURIComponent(m[1]) : '';
    if (!zi) {
      document.getElementById('app').innerHTML =
        '<div class="err">没有指定汉字，<a href="index.html">回首页选字</a></div>';
      return;
    }
    // 记为已学（首页识字表进度用），带首次学习日期
    try {
      var k = 'nhz_learned';
      var raw = localStorage.getItem(k);
      var map = raw ? JSON.parse(raw) : {};
      if (Array.isArray(map)) {
        // 老格式迁移：都是今天学的
        var m2 = {};
        map.forEach(function (x) { m2[x] = todayStr(); });
        map = m2;
      }
      if (!map[zi]) {
        map[zi] = todayStr();
        localStorage.setItem(k, JSON.stringify(map));
      }
    } catch (e) {}
    var s = document.createElement('script');
    s.src = 'data/zika/' + encodeURIComponent(zi) + '.js';
    s.onload = function () {
      var rec = window.NHZ_ZIKA;
      if (rec && rec.zi === zi) render(rec);
      else showErr(zi);
    };
    s.onerror = function () { showErr(zi); };
    document.head.appendChild(s);
  }
  function showErr(zi) {
    document.getElementById('app').innerHTML =
      '<div class="err">字库里没有"' + esc(zi) + '"，<a href="index.html">回首页</a>换一个字试试</div>';
  }
  main();
})();
