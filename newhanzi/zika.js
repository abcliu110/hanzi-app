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
      (function(){
        var py = (dim['读音'] && dim['读音']['拼音']) || ((window.NHZ_PINYIN||{})[r.zi]) || '';
        /* 罕用读音（古音、专名等）保留但标注，不和常用读音并列 */
        var rare = dim['读音'] && dim['读音']['罕用读音'];
        return py ? '<div class="pinyin">' + esc(String(py).replace(/,/g, '、')) +
          (rare ? ' <span class="py-rare" style="font-size:14px;color:var(--muted);font-weight:400;">（古音/罕用：' +
            esc(String(rare).replace(/,/g, '、')) + '）</span>' : '') + '</div>' : '';
      })() +
      '<div class="chips">' + chips + '</div>' +
      // 偏旁部首直达部首库（只显示归属；语义解读在部首详情页，避免对假借字误断）
      (bsEntry
        ? '<a class="bs-mean" href="bushou.html?b=' + encodeURIComponent(bsEntry.bushou) + '">🧩 偏旁部首「' +
          esc(bsEntry.bushou) + '」的含义与例字 ›</a>'
        : '') +
      '<button class="speak" id="speakBtn">读一读</button></div>';

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
      /* 小篆字段系统性错位（如天→七），DATA_MODEL.md 已标注不可靠，暂不展示 */
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

    /* 3. 字长什么样（结构 + 形声拆解） */
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
    /* 看笔顺（词条型形块区）：笔顺维与组件数据格式一致，直接接线，不改数据格式 */
    var bs = dim['笔顺'];
    var hasBS = bs && bs.strokes && bs.medians &&
      bs.strokes.length > 0 && bs.strokes.length === bs.medians.length;
    if (hasBS) {
      zx += '<div class="kv"><div class="k">看笔顺</div><div class="v"><div id="bishunBox"></div>' +
        '<div class="ex">共 ' + bs.strokes.length + ' 笔，毛笔一笔一笔写给你看。</div></div></div>';
    }
    h += sec('字长什么样', '结构', zx);

    /* 图示（机制图） */
    if (r['图示']) {
      /* 重播：克隆替换 svg，SMIL 时间线从 0 重新开始（与 yuwen.js 同法） */
      h += sec('看图说话', '机制图', '<div class="yw-diagram">' + r['图示'] +
        '<div style="text-align:center;margin-top:8px;"><button type="button" class="back replay-btn" style="padding:8px 16px;font-size:14px;" data-replay ' +
        'onclick="var d=this.closest(\'.yw-diagram\');var s=d&&d.querySelector(\'svg\');if(s){var c=s.cloneNode(true);s.parentNode.replaceChild(c,s);}">↻ 重播</button></div></div>');
    }

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

    /* 7. 文学常识（古诗名句 / 成语 / 汉字趣闻 / 课本链接，见 data/wenxue.js） */
    var wxInner = '';
    try {
      var wxList = (window.NHZ_WENXUE && window.NHZ_WENXUE[r.zi]) || [];
      if (wxList.length) {
        var wxOrder = {'古诗名句': 0, '成语': 1, '汉字趣闻': 2, '课本链接': 3};
        var wxCls = {'古诗名句': 'blue', '成语': 'orange', '汉字趣闻': 'green', '课本链接': 'blue'};
        wxList.slice().sort(function (a, b) {
          return (wxOrder[a.type] == null ? 9 : wxOrder[a.type]) - (wxOrder[b.type] == null ? 9 : wxOrder[b.type]);
        }).forEach(function (e) {
          wxInner += '<div class="yiyi">';
          wxInner += '<span class="badge2 ' + (wxCls[e.type] || 'blue') + '">' + esc(e.type) + '</span>';
          if (e.type === '古诗名句') {
            wxInner += '<div class="classic">' + esc(e.text) + '</div>';
          } else {
            wxInner += '<div class="wx-text">' + esc(e.text) + '</div>';
          }
          if (e.pinyin) wxInner += '<div class="wx-py">' + esc(e.pinyin) + '</div>';
          if (e.explain) wxInner += '<div class="ex">' + esc(e.explain) + '</div>';
          if (e.story) wxInner += '<div class="ex">📖 ' + esc(e.story) + '</div>';
          var meta = '';
          if (e.source) meta += esc(e.source);
          if (e.textbook) meta += (meta ? ' · ' : '') + '📖 ' + esc(e.textbook);
          if (meta) wxInner += '<div class="wx-meta">—— ' + meta + '</div>';
          wxInner += '</div>';
        });
      }
    } catch (e) { wxInner = ''; }
    h += sec('文学常识', '诗句 · 成语 · 趣闻 · 课本', wxInner);

    h += '<div class="src-note">数据来源：通用规范汉字表 · Unihan · 《说文解字》· hanzi-writer-data · CC-CEDICT</div>';

    /* 切字前销毁旧笔顺播放器，避免孤儿 rAF 在已拆节点上继续跑（当前每字整页加载、尚未触发，属防御） */
    try { if (app._sp) { app._sp.destroy(); app._sp = null; } } catch (e) {}
    app.innerHTML = h;

    /* 看笔顺挂载：形块区容器已随 innerHTML 生成，有数据且组件已加载时挂载并播一次 */
    try {
      var bsBox = document.getElementById('bishunBox');
      if (bsBox && window.NHZStrokePlayer && dim['笔顺'] &&
          dim['笔顺'].strokes && dim['笔顺'].medians) {
        var sp = window.NHZStrokePlayer.mount(bsBox, {
          strokes: dim['笔顺'].strokes,
          medians: dim['笔顺'].medians
        });
        app._sp = sp;
        var rmReduce = false;
        try { rmReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
        if (!rmReduce) sp.play();
      }
    } catch (e) {}

    /* 交互 wiring */
    document.getElementById('speakBtn').onclick = function () {
      var t = r.zi;
      if (dim['读音'] && dim['读音']['拼音']) t += '，' + dim['读音']['拼音'];
      speak(t);
    };
  }

  /* ---- 入口：单字数据走 data/zika/<字>.js，经 <script> 动态加载（file:// 可用） ---- */
  function main() {
    var m = /[?&]zi=([^&]+)/.exec(location.search);
    var zi = '';
    if (m) {
      try { zi = decodeURIComponent(m[1]); }
      catch (e) {
        // 畸形编码（如 ?zi=%E0%A4）会抛 URIError，不能让页面卡在“加载中”
        document.getElementById('app').innerHTML =
          '<div class="err">链接里的汉字编码不对，打不开这张字卡。<a href="index.html?m=shizi">回识字选字</a></div>';
        return;
      }
    }
    if (!zi) {
      document.getElementById('app').innerHTML =
        '<div class="err">没有指定汉字，<a href="index.html?m=shizi">回识字选字</a></div>';
      return;
    }
    var s = document.createElement('script');
    s.src = 'data/zika/' + encodeURIComponent(zi) + '.js';
    s.onload = function () {
      var rec = window.NHZ_ZIKA;
      if (rec && rec.zi === zi) {
                // 停留满 15 秒、页面仍可见时才记为已学：只是打开一下，不算学会
        var learnTimer = setTimeout(function () {
          if (document.visibilityState !== 'visible') return;
          try {
            var k = 'nhz_learned';
            var raw = localStorage.getItem(k);
            var map = raw ? JSON.parse(raw) : {};
            if (Array.isArray(map)) {
              // 老数组格式没有学习日期，记作 'legacy'，不能盖上今天的日期
              var m2 = {};
              map.forEach(function (x) { m2[x] = 'legacy'; });
              map = m2;
            }
            if (!map[zi]) {
              map[zi] = todayStr();
              localStorage.setItem(k, JSON.stringify(map));
            }
          } catch (e) {}
        }, 15000);
        window.addEventListener('pagehide', function () { clearTimeout(learnTimer); });
        render(rec);
      } else showErr(zi);
    };
    s.onerror = function () { showErr(zi); };
    document.head.appendChild(s);
  }
  function showErr(zi) {
    document.getElementById('app').innerHTML =
      '<div class="err">字库里没有"' + esc(zi) + '"，<a href="index.html?m=shizi">回识字</a>换一个字试试</div>';
  }
  main();
})();
