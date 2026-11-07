/* newhanzi 内容分型四型渲染模板（Q15，CONTENT_PATTERNS.md v3.0 / CONTENT_AUDIT.md）
   图式 / 对照表 / 决策树 / 时间轴 —— 一个共享渲染器，供 yuwen.js、guwen.html、shici.html 复用。
   原则：只渲染条目已有的数据（分类 / 对照表 / 决策树 / d 文本里的 [图式][决策树][时间轴] 块），
   不编造新内容。派生一律来自同一条目自身的字段，并在函数名里标明来源。
   file:// 可用，无依赖；ES5 写法。 */
(function () {
  'use strict';
  var NS = {};
  var STYLE_DONE = false;
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  NS.esc = esc;
  /* 模板共用样式：只注入一次；颜色沿用站内绿/米色系 */
  function ensureStyle() {
    if (STYLE_DONE || typeof document === 'undefined') return;
    STYLE_DONE = true;
    var st = document.createElement('style');
    st.textContent = [
      '.pt-box{margin:10px 0 14px;border:1px solid #d5dfd0;border-radius:10px;background:#fbfdf8;padding:12px 14px}',
      '.pt-head{font-size:15px;font-weight:700;color:#3d5a40;margin-bottom:8px}',
      '.pt-schema-c{display:inline-block;background:#3d5a40;color:#fff;border-radius:8px;padding:6px 14px;font-weight:700;font-size:15px;margin-bottom:8px}',
      '.pt-schema-br{display:flex;flex-wrap:wrap;gap:8px}',
      '.pt-schema-b{flex:1 1 30%;min-width:120px;border:1px solid #c9d6c2;border-left:4px solid #4a7a59;border-radius:8px;background:#fff;padding:8px 10px}',
      '.pt-schema-b b{display:block;color:#2c3328;font-size:14px}',
      '.pt-schema-b span{color:#6b7566;font-size:13px}',
      '.pt-table{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0}',
      '.pt-table th,.pt-table td{border:1px solid #d5dfd0;padding:7px 9px;text-align:left;vertical-align:top}',
      '.pt-table th{background:#f0f4ec;color:#3d5a40}',
      '.pt-table td:first-child{font-weight:700;white-space:nowrap}',
      '.pt-flow{margin:4px 0}',
      '.pt-node{border:1px solid #c9d6c2;border-radius:8px;background:#fff;padding:8px 10px;font-size:14px}',
      '.pt-node.q{border-left:4px solid #4a7a59;font-weight:700}',
      '.pt-node.a{margin-left:22px;border-left:4px solid #c9a227}',
      '.pt-node.end{margin-left:22px;border-left:4px solid #7a5a3a;background:#fdf8ec}',
      '.pt-arrow{text-align:left;margin:2px 0 2px 14px;color:#8a9a80;font-size:13px}',
      '.pt-tl{list-style:none;margin:4px 0;padding-left:6px}',
      '.pt-tl li{position:relative;padding:0 0 12px 26px;border-left:2px solid #4a7a59;margin-left:8px;font-size:14px}',
      '.pt-tl li:before{content:"";position:absolute;left:-7px;top:4px;width:12px;height:12px;border-radius:50%;background:#4a7a59}',
      '.pt-tl li:last-child{border-left-color:transparent}',
      '.pt-tl b{display:block;color:#2c3328}',
      '.pt-tl span{color:#5a6555}',
      '.pt-kv{width:100%;border-collapse:collapse;font-size:14px}',
      '.pt-kv th,.pt-kv td{border:1px solid #d5dfd0;padding:7px 9px;text-align:left;vertical-align:top}',
      '.pt-kv th{background:#f0f4ec;color:#3d5a40;white-space:nowrap;width:5em}'
    ].join('\n');
    document.head.appendChild(st);
  }
  NS.ensureStyle = ensureStyle;

  /* ---------- 一、图式 ---------- */
  /* 来源 A：条目的「分类」数组（语法 99 条、古文 170 条已有）→ 中心 + 成员阵列 */
  function schemaFromItem(it) {
    if (!it || !it['分类'] || !it['分类'].length) return null;
    return {
      center: it.name || '',
      branches: it['分类'].map(function (c) {
        return { label: c['类'] || '', note: c['代表'] || (c['说明'] || '').slice(0, 24) };
      })
    };
  }
  NS.schemaFromItem = schemaFromItem;
  /* 来源 B：古诗卡 d 文本里的 [图式] 块（54 卡）→ 键值行；文本原样呈现，不改写 */
  function schemaFromShiciText(d) {
    if (!d) return null;
    var m = String(d).match(/\[图式\]<\/b>([\s\S]*?)(?:<br><br>|<b>\[|$)/);
    if (!m) return null;
    var rows = [];
    m[1].replace(/<br\s*\/?>/g, '\n').split('\n').forEach(function (line) {
      line = line.replace(/<[^>]+>/g, '').trim();
      if (!line) return;
      var kv = line.match(/^(.+?)\s*[=：:]\s*(.+)$/);
      rows.push(kv ? { k: kv[1].trim(), v: kv[2].trim() } : { k: '', v: line });
    });
    return rows.length ? rows : null;
  }
  NS.schemaFromShiciText = schemaFromShiciText;
  function renderSchema(data, title) {
    ensureStyle();
    if (!data) return '';
    var h = '<div class="pt-box"><div class="pt-head">🗺️ ' + esc(title || '图式') + '</div>';
    if (data.center) {
      h += '<div class="pt-schema-c">' + esc(data.center) + '</div><div class="pt-schema-br">' +
        data.branches.map(function (b) {
          return '<div class="pt-schema-b"><b>' + esc(b.label) + '</b>' +
            (b.note ? '<span>' + esc(b.note) + '</span>' : '') + '</div>';
        }).join('') + '</div>';
    } else {
      h += '<table class="pt-kv">' + data.map(function (r) {
        return '<tr>' + (r.k ? '<th>' + esc(r.k) + '</th>' : '') +
          '<td' + (r.k ? '' : ' colspan="2"') + '>' + esc(r.v) + '</td></tr>';
      }).join('') + '</table>';
    }
    return h + '</div>';
  }
  NS.renderSchema = renderSchema;

  /* ---------- 二、对照表 ---------- */
  /* 来源 A：条目的「对照表」结构化字段（语法 25、古文虚词 21） */
  function splitLabeled(cell, dims) {
    /* "含义：…；用法：…；例句：…" 按维度名前缀切成各格；切不出的放第一格 */
    var out = {}, rest = String(cell || '');
    dims.forEach(function (dim) {
      var re = new RegExp(dim + '[:：]');
      var i = rest.search(re);
      if (i >= 0) {
        var seg = rest.slice(i);
        var next = Infinity;
        dims.forEach(function (d2) {
          if (d2 === dim) return;
          var j = seg.slice(dim.length + 1).search(new RegExp('[；;]' + d2 + '[:：]'));
          if (j >= 0) next = Math.min(next, j + 1);
        });
        out[dim] = (next === Infinity ? seg.slice(dim.length + 1) : seg.slice(dim.length + 1, next + 1)).replace(/[；;]$/, '').trim();
        rest = (next === Infinity ? '' : seg.slice(next + 1));
      }
    });
    if (!out[dims[0]]) out[dims[0]] = rest.trim();
    return out;
  }
  function renderCompare(tbl, title) {
    ensureStyle();
    if (!tbl || !tbl['对比'] || !tbl['对比'].length) return '';
    var dims = tbl['维度'] || [];
    var rows = tbl['对比'];
    var h = '<div class="pt-box"><div class="pt-head">📊 ' + esc(title || '对照表') + '</div><table class="pt-table"><tr>';
    if (rows[0].length === dims.length) {
      h += dims.map(function (d) { return '<th>' + esc(d) + '</th>'; }).join('');
      h += '</tr>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('');
    } else {
      /* 语法型：每行 [名称, "维度1：…；维度2：…"] → 按维度名前缀切格 */
      h += '<th></th>' + dims.map(function (d) { return '<th>' + esc(d) + '</th>'; }).join('');
      h += '</tr>' + rows.map(function (r) {
        var cells = splitLabeled(r[1] || '', dims);
        return '<tr><td>' + esc(r[0] || '') + '</td>' +
          dims.map(function (d) { return '<td>' + esc(cells[d] || '') + '</td>'; }).join('') + '</tr>';
      }).join('');
    }
    return h + '</table></div>';
  }
  NS.renderCompare = renderCompare;
  /* 来源 B：辨析文本里的成对辨析（"X vs Y："或"X和“Y”的区别"）→ 不改写原文，只分行呈现 */
  function compareFromBianxi(text) {
    if (!text) return null;
    var src = String(text), rows = [], re = /([^\s，。；：]{1,12})\s+vs\s+([^\s，。：；]{1,12})[:：]?|([^\s，。；：]{1,12})和“([^”]{1,12})”的区别[:：]?/g, m, last = 0, spans = [];
    while ((m = re.exec(src))) spans.push({ a: m[1] || m[3], b: m[2] || m[4], i: m.index, end: re.lastIndex });
    if (spans.length < 1) return null;
    spans.forEach(function (sp, i) {
      var note = src.slice(sp.end, i + 1 < spans.length ? spans[i + 1].i : src.length).trim();
      if (note) rows.push([sp.a + ' vs ' + sp.b, note]);
    });
    return rows.length ? rows : null;
  }
  NS.compareFromBianxi = compareFromBianxi;
  function renderCompareRows(rows, title) {
    ensureStyle();
    if (!rows || !rows.length) return '';
    return '<div class="pt-box"><div class="pt-head">📊 ' + esc(title || '对照表') + '</div><table class="pt-table">' +
      rows.map(function (r) {
        return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>';
      }).join('') + '</table></div>';
  }
  NS.renderCompareRows = renderCompareRows;

  /* 来源 C：古诗卡 d 文本里的 [对照表] 块（6 卡）→ 行以 <br> 分、格以 ｜ 分，原样呈现 */
  function compareFromShiciText(d) {
    if (!d) return null;
    var m = String(d).match(/\[对照表\]<\/b>([\s\S]*?)(?:<br><br>|<b>\[|$)/);
    if (!m) return null;
    var rows = [];
    m[1].split(/<br\s*\/?>/).forEach(function (line) {
      var cells = line.replace(/<[^>]+>/g, '').split('｜').map(function (c) { return c.trim(); });
      if (cells.some(Boolean)) rows.push(cells);
    });
    return rows.length >= 2 ? rows : null;
  }
  NS.compareFromShiciText = compareFromShiciText;
  function renderGrid(rows, title) {
    ensureStyle();
    if (!rows || !rows.length) return '';
    return '<div class="pt-box"><div class="pt-head">📊 ' + esc(title || '对照表') + '</div><table class="pt-table">' +
      rows.map(function (r, i) {
        return '<tr>' + r.map(function (c) { return i === 0 ? '<th>' + esc(c) + '</th>' : '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table></div>';
  }
  NS.renderGrid = renderGrid;

  /* ---------- 三、决策树 ---------- */
  /* 来源 A：条目的「决策树」文本链（语法病句 20、逻辑 6、古文 9），形如 ①…？→不齐：…→②… */
  function parseDecision(text) {
    if (!text) return [];
    var nodes = [];
    String(text).split('→').forEach(function (seg) {
      seg = seg.trim();
      if (!seg) return;
      var m = seg.match(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*(.*)$/);
      if (m) { nodes.push({ k: 'q', t: m[1] }); return; }
      var c = seg.match(/^([^：:]{1,12})[:：]\s*(.+)$/);
      if (c && nodes.length) {
        /* "条件：结论" —— 含结论词的标为终点 */
        var end = /完成|不当|残缺|错误|矛盾|改掉|删掉|转查/.test(c[2]);
        nodes.push({ k: end ? 'end' : 'a', t: c[1] + '：' + c[2] });
        return;
      }
      nodes.push({ k: nodes.length ? 'a' : 'q', t: seg });
    });
    return nodes;
  }
  NS.parseDecision = parseDecision;
  /* 来源 B：古诗卡 d 文本里的 [决策树] 块（60 卡）→ 同一文本链 */
  function decisionFromShiciText(d) {
    if (!d) return null;
    var m = String(d).match(/\[决策树\]<\/b>([\s\S]*?)(?:<br><br>|<b>📜|$)/);
    if (!m) return null;
    return m[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').trim() || null;
  }
  NS.decisionFromShiciText = decisionFromShiciText;
  /* 来源 C：程序型条目无「决策树」字段时，用「怎么认」步骤排成判断流程（内容一字不改，只换呈现） */
  function decisionFromSteps(steps) {
    if (!steps || !steps.length) return null;
    return steps.map(function (s, i) { return { k: i === 0 ? 'q' : 'a', t: String(s) }; });
  }
  NS.decisionFromSteps = decisionFromSteps;
  function renderDecisionNodes(nodes, title) {
    ensureStyle();
    if (!nodes || !nodes.length) return '';
    var h = '<div class="pt-box"><div class="pt-head">🌳 ' + esc(title || '决策树') + '</div><div class="pt-flow">';
    nodes.forEach(function (n, i) {
      if (i) h += '<div class="pt-arrow">↓</div>';
      h += '<div class="pt-node ' + n.k + '">' + esc(n.t) + '</div>';
    });
    return h + '</div></div>';
  }
  NS.renderDecisionNodes = renderDecisionNodes;
  function renderDecision(text, title) {
    return renderDecisionNodes(parseDecision(text), title);
  }
  NS.renderDecision = renderDecision;

  /* ---------- 四、时间轴 ---------- */
  /* 来源 A：古诗卡 d —— shishi 的 <b>时间轴</b>：A→B→C 链；diangu 的 起因/经过/结果 + 关键节点 */
  function timelineFromShici(k) {
    if (!k || !k.d) return null;
    var d = String(k.d), events = [], m;
    m = d.match(/<b>时间轴<\/b>[：:]([\s\S]*?)(?:<br><br>|<b>关键节点|$)/);
    if (m) {
      m[1].replace(/<[^>]+>/g, '').split('→').forEach(function (s) {
        s = s.trim().replace(/[。；;]$/, '');
        if (s) events.push({ t: '', text: s });
      });
    } else if (/<b>起因<\/b>/.test(d)) {
      ['起因', '经过', '结果'].forEach(function (key) {
        var mm = d.match(new RegExp('<b>' + key + '<\\/b>[：:]([\\s\\S]*?)(?:<br>|<b>|$)'));
        if (mm) events.push({ t: key, text: mm[1].replace(/<[^>]+>/g, '').trim() });
      });
    }
    m = d.match(/<b>关键节点<\/b>([\s\S]*?)(?:<br><br>|<b>📜|$)/);
    if (m) {
      /* 关键节点以 <br> 分隔，先按 <br> 切行再认 "1. …" 编号 */
      m[1].split(/<br\s*\/?>/).forEach(function (line) {
        var mm = line.replace(/<[^>]+>/g, '').trim().match(/^\d+[.、]\s*(.+)$/);
        if (mm) events.push({ t: '节点', text: mm[1].replace(/[；;]$/, '').trim() });
      });
    }
    return events.length ? events : null;
  }
  NS.timelineFromShici = timelineFromShici;
  /* 来源 B：条目 subtitle/讲解里的 "A → B → C" 链（如古文「朝代脉络」） */
  function timelineFromItem(it) {
    if (!it) return null;
    var src = it.subtitle || it['讲解'] || '';
    if (src.indexOf('→') < 0) return null;
    var parts = String(src).split('→').map(function (s) { return s.trim(); }).filter(Boolean);
    if (parts.length < 2) return null;
    return parts.map(function (p) { return { t: '', text: p }; });
  }
  NS.timelineFromItem = timelineFromItem;
  function renderTimeline(events, title) {
    ensureStyle();
    if (!events || !events.length) return '';
    return '<div class="pt-box"><div class="pt-head">🕰️ ' + esc(title || '时间轴') + '</div><ul class="pt-tl">' +
      events.map(function (e) {
        return '<li>' + (e.t ? '<b>' + esc(e.t) + '</b>' : '') +
          '<span>' + esc(e.text) + '</span></li>';
      }).join('') + '</ul></div>';
  }
  NS.renderTimeline = renderTimeline;

  /* ---------- 覆盖判定（供校验脚本与渲染器共用） ---------- */
  NS.hasSchema = function (it) { return !!schemaFromItem(it); };
  NS.hasCompare = function (it) { return !!(it && (it['对照表'] || compareFromBianxi(it['辨析']))); };
  NS.hasDecision = function (it) { return !!(it && (it['决策树'] || (it['怎么认'] && it['怎么认'].length))); };
  NS.hasTimeline = function (it) { return !!timelineFromItem(it); };

  if (typeof window !== 'undefined') window.NHZPatterns = NS;
  if (typeof module !== 'undefined' && module.exports) module.exports = NS;
})();
