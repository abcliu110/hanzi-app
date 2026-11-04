/* 每日一字 / 一诗分享卡：本地按日期确定内容，无后端。
 * 取数规则（每天固定，换天即换）：seed = 年 × 366 + 年内第几天；
 *   字序号 = seed % 3500（data/index.js 的 NHZ_INDEX 顺序），
 *   诗序号 = seed % 诗库首数（POEMS.length，data/shici.js 的 NHZ_SHICI.poems 顺序）；
 *   seed 为偶数默认显示字，奇数默认显示诗；“换一个看看”只切当天另一型。
 * 字释义取该字单字文件（data/zika/<字>.js，与 zika.html 同款 <script> 加载，
 *   file:// 可用）；加载失败则只显示字音形信息并链到字卡，不编造释义。
 * 分享：优先 navigator.share，其次剪贴板，皆不可用则展示文字供手动复制。
 * file:// 与 http:// 通用（无 fetch）。 */
(function () {
  'use strict';
  var app = document.getElementById('app');
  if (!app) return;
  var IDX = window.NHZ_INDEX || [];
  var POEMS = (window.NHZ_SHICI && window.NHZ_SHICI.poems) || [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 1);
  var doy = Math.floor((now - start) / 86400000);
  var seed = now.getFullYear() * 366 + doy;
  var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  var dateLabel = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + WEEK[now.getDay()];
  var charIdx = IDX.length ? seed % IDX.length : -1;
  var poemIdx = POEMS.length ? seed % POEMS.length : -1;
  var type = (seed % 2 === 0) ? 'zi' : 'shi';
  if (type === 'zi' && charIdx < 0) type = 'shi';
  if (type === 'shi' && poemIdx < 0) type = 'zi';

  function shareText() {
    if (type === 'zi') {
      var e = IDX[charIdx];
      return '今日一字：' + e.z + '（' + (e.py || '') + '，' + e.bu + '部 · ' + e.st + '画）——识字星球';
    }
    var p = POEMS[poemIdx];
    return '今日一诗：' + p.title + ' · ' + p.author + '（' + p.dynasty + '）——识字星球';
  }

  function footer() {
    return '<div style="display:flex;gap:10px;margin-top:14px">' +
      '<button type="button" id="shToggle" class="sh-btn">换一个看看</button>' +
      '<button type="button" id="shCopy" class="sh-btn primary">复制卡片文字</button></div>' +
      '<p class="sh-note" id="shMsg"></p>' +
      '<textarea id="shText" readonly style="display:none;width:100%;min-height:90px;margin-top:8px;font-size:14px"></textarea>';
  }
  function bindFooter() {
    document.getElementById('shToggle').addEventListener('click', function () {
      type = (type === 'zi') ? 'shi' : 'zi';
      render();
    });
    document.getElementById('shCopy').addEventListener('click', function () {
      var text = shareText();
      var msg = document.getElementById('shMsg');
      var ta = document.getElementById('shText');
      function fallback() {
        ta.value = text;
        ta.style.display = 'block';
        msg.textContent = '复制失败，请手动长按上方文字复制。';
      }
      if (navigator.share) {
        navigator.share({ title: '识字星球 · 每日一卡', text: text }).then(function () {
          msg.textContent = '已分享！';
        }, fallback);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          msg.textContent = '已复制，去粘贴分享吧！';
        }, fallback);
      } else {
        fallback();
      }
    });
  }

  function renderZi() {
    var e = IDX[charIdx];
    app.innerHTML =
      '<p class="sh-date">' + esc(dateLabel) + '</p>' +
      '<section class="sh-card"><div class="sh-type">今日一字</div>' +
      '<div class="sh-char">' + esc(e.z) + '</div>' +
      '<p class="sh-py">' + esc(e.py || '') + ' · ' + esc(e.bu) + '部 · ' + e.st + '画</p>' +
      '<div id="shSense"><p class="sh-note">释义加载中…</p></div>' +
      '<p><a href="zika.html?zi=' + encodeURIComponent(e.z) + '">查看「' + esc(e.z) + '」字卡 →</a></p></section>' +
      footer();
    bindFooter();
    var s = document.createElement('script');
    s.src = 'data/zika/' + e.z + '.js';
    s.onload = function () {
      var box = document.getElementById('shSense');
      if (!box) return;
      var z = window.NHZ_ZIKA;
      var chain = z && z.dim && z.dim['运用链'];
      if (chain && chain.length) {
        var c = chain[0];
        box.innerHTML = '<p class="sh-mean">💡 ' + esc(c['义项'] || '') + '</p>' +
          '<p class="sh-ex">例词：' + esc((c['词'] || []).slice(0, 3).join('、')) + '</p>' +
          (c['句'] ? '<p class="sh-ex">例句：' + esc(c['句']) + '</p>' : '');
      } else {
        box.innerHTML = '<p class="sh-note">该字释义请见字卡。</p>';
      }
    };
    s.onerror = function () {
      var box = document.getElementById('shSense');
      if (box) box.innerHTML = '<p class="sh-note">该字释义请见字卡。</p>';
    };
    document.head.appendChild(s);
  }

  function renderShi() {
    var p = POEMS[poemIdx];
    app.innerHTML =
      '<p class="sh-date">' + esc(dateLabel) + '</p>' +
      '<section class="sh-card"><div class="sh-type">今日一诗</div>' +
      '<h2 class="sh-title">' + esc(p.title) + '</h2>' +
      '<p class="sh-meta">' + esc(p.dynasty) + ' · ' + esc(p.author) + (p.ticai ? ' · ' + esc(p.ticai) : '') + '</p>' +
      p.lines.map(function (l) { return '<p class="sh-line">' + esc(l) + '</p>'; }).join('') +
      '<p><a href="shici.html">去古诗词页 →</a></p></section>' +
      footer();
    bindFooter();
  }

  function render() {
    if (!IDX.length && !POEMS.length) {
      app.innerHTML = '<p class="sh-note">今日卡片数据未加载，请确认 data/index.js 与 data/shici.js 存在。</p>';
      return;
    }
    if (type === 'zi') renderZi();
    else renderShi();
  }

  render();
})();
