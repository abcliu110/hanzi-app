/* 复习页：今日复习（到期项，显示答案后点 记得/忘了）+ 错题本（已掌握清除）。
 * 数据键 nhz_wrong / nhz_srs，与语法 bank、古文 bank、quiz 的错题钩子共用。
 * 不用旧 app 的键（xzq_learned / hz_wrong / hz_srs）。无外部依赖，file:// 可用。
 */
(function () {
  'use strict';

  /* ---- 与各页错题钩子同款 helper（保持一致，勿单改一处） ---- */
  window.NHZReview = window.NHZReview || (function () {
    var WK = 'nhz_wrong', SK = 'nhz_srs';
    var IV = [1, 2, 4, 7, 15, 30];
    function load(k, fb) {
      try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fb : v; }
      catch (e) { return fb; }
    }
    function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    function hash(s) {
      var h = 0;
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return 'q' + (h < 0 ? -h : h);
    }
    function idOf(it) { return hash(it.q + '\n' + (it.options || []).join('\n') + '\n' + it.answer); }
    // correct=true：复习项答对 -> 推进间隔；correct=false：答错 -> 进错题本并安排明天复习
    function record(it, correct) {
      if (!it || !it.q) return;
      var id = idOf(it);
      var wrong = load(WK, []), srs = load(SK, {}), now = Date.now();
      if (correct) {
        if (srs[id]) {
          var iv = Math.min(srs[id].iv + 1, IV.length - 1);
          srs[id] = { iv: iv, next: now + IV[iv] * 86400000 };
          save(SK, srs);
        }
      } else {
        var found = false;
        for (var i = 0; i < wrong.length; i++) {
          if (wrong[i].id === id) {
            wrong[i] = { id: id, q: it.q, options: it.options || [], answer: it.answer,
              解析: it['解析'] || '', src: it.src, point: it.point, addedAt: wrong[i].addedAt || now };
            found = true; break;
          }
        }
        if (!found) wrong.push({ id: id, q: it.q, options: it.options || [], answer: it.answer,
          解析: it['解析'] || '', src: it.src, point: it.point, addedAt: now });
        save(WK, wrong);
        srs[id] = { iv: 0, next: now + IV[0] * 86400000 };
        save(SK, srs);
      }
    }
    // 复习页自评：记得 -> 推进间隔，忘了 -> 回到 1 天
    function review(id, remembered) {
      var srs = load(SK, {}), now = Date.now();
      if (!srs[id]) return false;
      if (remembered) {
        var iv = Math.min(srs[id].iv + 1, IV.length - 1);
        srs[id] = { iv: iv, next: now + IV[iv] * 86400000 };
      } else {
        srs[id] = { iv: 0, next: now + IV[0] * 86400000 };
      }
      save(SK, srs);
      return true;
    }
    // 已掌握清除：错题本与复习安排一起清
    function clearWrong(id) {
      var wrong = load(WK, []), srs = load(SK, {}), nw = [];
      for (var i = 0; i < wrong.length; i++) if (wrong[i].id !== id) nw.push(wrong[i]);
      save(WK, nw);
      if (srs[id]) { delete srs[id]; save(SK, srs); }
    }
    return { record: record, review: review, clearWrong: clearWrong,
      loadWrong: function () { return load(WK, []); },
      loadSrs: function () { return load(SK, {}); } };
  })();

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function optsHtml(w) {
    if (!w.options || !w.options.length) return '';
    return '<div class="fx-opts">' + w.options.map(function (o) {
      return '<span class="fx-opt' + (o === w.answer ? ' fx-right' : '') + '">' + esc(o) + '</span>';
    }).join('') + '</div>';
  }

  var app = document.getElementById('app');
  var lastNote = '';

  function render() {
    var wrong = window.NHZReview.loadWrong();
    var srs = window.NHZReview.loadSrs();
    var now = Date.now();
    var due = [];
    for (var id in srs) {
      if (srs[id].next <= now) {
        for (var i = 0; i < wrong.length; i++) {
          if (wrong[i].id === id) { due.push(wrong[i]); break; }
        }
      }
    }
    var h = '';
    h += '<section class="fx-section"><h2>今日复习' + (due.length ? '（' + due.length + ' 道）' : '') + '</h2>';
    if (!due.length) {
      h += '<p class="fx-empty">今天没有到期的复习，好好休息。</p>';
    } else {
      due.forEach(function (w) {
        h += '<div class="fx-card" data-due="' + esc(w.id) + '">' +
          '<div class="fx-src">' + esc(w.src) + ' · ' + esc(w.point) + '</div>' +
          '<p class="fx-q">' + esc(w.q) + '</p>' + optsHtml(w) +
          '<div class="fx-ans" hidden><p>答案：' + esc(w.answer) + '</p>' +
          (w['解析'] ? '<p>' + esc(w['解析']) + '</p>' : '') + '</div>' +
          '<button class="fx-btn" data-act="show">显示答案</button>' +
          '<span class="fx-grade" hidden><button class="fx-btn" data-act="remember">记得</button>' +
          '<button class="fx-btn" data-act="forget">忘了</button></span></div>';
      });
    }
    h += '</section>';
    h += '<section class="fx-section"><h2>错题本' + (wrong.length ? '（' + wrong.length + ' 道）' : '') + '</h2>';
    if (!wrong.length) {
      h += '<p class="fx-empty">错题本是空的，做错的题目会自动记到这里。</p>';
    } else {
      wrong.forEach(function (w) {
        var s = srs[w.id];
        h += '<div class="fx-card" data-wrong="' + esc(w.id) + '">' +
          '<div class="fx-src">' + esc(w.src) + ' · ' + esc(w.point) +
          (s ? ' · 下次复习：' + fmtDate(s.next) : '') + '</div>' +
          '<p class="fx-q">' + esc(w.q) + '</p>' + optsHtml(w) +
          '<p>答案：' + esc(w.answer) + '</p>' +
          (w['解析'] ? '<p>' + esc(w['解析']) + '</p>' : '') +
          '<button class="fx-btn" data-act="clear">已掌握，清除</button></div>';
      });
    }
    h += '</section>';
    h += '<p class="fx-note" id="fxNote">' + esc(lastNote) + '</p>';
    app.innerHTML = h;
  }

  app.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    var card = btn.closest('.fx-card');
    if (act === 'show') {
      card.querySelector('.fx-ans').hidden = false;
      btn.hidden = true;
      card.querySelector('.fx-grade').hidden = false;
    } else if (act === 'remember' || act === 'forget') {
      var id = card.getAttribute('data-due');
      window.NHZReview.review(id, act === 'remember');
      var s = window.NHZReview.loadSrs()[id];
      lastNote = s ? (act === 'remember' ? '记得！下次复习：' + fmtDate(s.next) + '。'
        : '忘了也没关系，下次复习：' + fmtDate(s.next) + '。') : '已记录。';
      render();
    } else if (act === 'clear') {
      window.NHZReview.clearWrong(card.getAttribute('data-wrong'));
      lastNote = '已从错题本清除。';
      render();
    }
  });

  render();
})();
