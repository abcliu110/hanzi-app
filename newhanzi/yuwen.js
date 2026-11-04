/* newhanzi 语文知识库：语法 / 阅读理解 / 写作 */
(function () {
  'use strict';

  var MODULES = [
    { key: 'grammar', file: 'yuwen/grammar.json', label: '语法' },
    { key: 'logic', file: 'yuwen/logic.json', label: '逻辑学' },
    { key: 'reading', file: 'yuwen/reading.json', label: '阅读理解' },
    { key: 'writing', file: 'yuwen/writing.json', label: '写作' }
  ];
  var DATA = {};
  var active = 'grammar';
  var currentItems = {};
  var animData = {};
  var quizData = {};
  var quizRecorded = {}; /* 动手练/小测只记首次作答（反馈仍可重答，不改反馈） */
  var gameData = {};
  /* 按点分文件的语法题库（如名词 200 道），yuwen.html 以 <script> 引入，file:// 下也能用 */
  var bankData = window.NHZ_GRAMMAR_BANK || {};
  var bankState = {};
  var bankQuizData = {};
  /* 复习/错题统一记录（与 fuxi.js 同款 helper，保持一致，勿单改一处）：
     答错 -> 进错题本并安排明天复习；答对复习项 -> 推进间隔。静默失败，不影响答题反馈。 */
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
  /* 导航已移除，固定显示语法 */

  var listEl = document.getElementById('ywlist');
  var detailEl = document.getElementById('ywdetail');
  var tabsEl = document.getElementById('ywtabs');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 题库按类过滤：未选类时返回全部题；选类后只返回该类的题 */
  function bankFiltered(bid) {
    var st = bankState[bid];
    var qs = bankData[st.name].questions;
    if (!st.filter || st.filter === '全部') return qs;
    return qs.filter(function (q) { return q['类'] === st.filter; });
  }

  function bankHeadHtml(bid) {
    var st = bankState[bid];
    var qs = bankFiltered(bid);
    var end = Math.min(st.offset + 10, qs.length);
    var label = (st.filter && st.filter !== '全部') ? '（' + st.filter + '）' : '';
    return '第 ' + (st.offset + 1) + '–' + end + ' 道 / 共 ' + qs.length +
      ' 道' + label + ' · 本轮答对 ' + st.score + ' / 已答 ' + st.answered;
  }

  function bankBatchHtml(bid, name) {
    var st = bankState[bid];
    var qs = bankFiltered(bid);
    var batch = qs.slice(st.offset, st.offset + 10);
    return batch.map(function (q, qi) {
      var qid = 'bk' + bid + '_' + qi + '_' + Math.floor(Math.random() * 100000);
      bankQuizData[qid] = q;
      return '<div class="quiz-q" id="' + qid + '"><div class="quiz-t">' + (st.offset + qi + 1) + '. ' + esc(q.q) + '</div>' +
        '<div class="quiz-opts">' + q.options.map(function (op, oi) {
          return '<button data-bqid="' + qid + '" data-boi="' + oi + '">' + esc(op) + '</button>';
        }).join('') + '</div><div class="quiz-fb"></div></div>';
    }).join('');
  }

  function renderBank(bid) {
    var box = document.getElementById(bid);
    if (!box) return;
    var st = bankState[bid];
    box.querySelector('.bank-head').textContent = bankHeadHtml(bid);
    box.querySelector('.bank-qs').innerHTML = bankBatchHtml(bid, st.name);
    var btns = box.querySelectorAll('[data-bank-filter]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('on', btns[i].getAttribute('data-bank-filter').split('|')[1] === st.filter);
    }
  }

  /* 内容分型：规律型/辨析型/程序型（CONTENT_PATTERNS.md v3.0）
     注意：用精确匹配避免"短语的结构"误判为程序型 */
  function itemType(it, catName) {
    var cn = catName || '';
    /* 程序型：病句类、方法步骤类（精确匹配） */
    if (/病句|逻辑错误|阅读方法|题型|答题公式|^审题$|^立意$|^选材$|^结构$|^语言$|翻译方法|诵读|赏析法|创作|读法|应用/.test(cn)) return '程序';
    /* 辨析型：对比类 */
    if (/关联词|虚词精讲|辨析|文体辨识|古今异义|手法/.test(cn)) return '辨析';
    return '规律';
  }
  var TYPE_LABEL = { '规律': '规律型', '辨析': '辨析型', '程序': '程序型' };
  var TYPE_COLOR = { '规律': '#3d5a40', '辨析': '#5a4a7a', '程序': '#7a5a3a' };

  function itemHtml(it, idx, catName) {
    var body = '';
    var hasVisual = it['类比'] || it['图示'] || it['动画'] || it['小测'];
    var step = 0;
    var tp = itemType(it, catName);
    /* 学前先看：仅当有真实前置时显示 */
    if (it['前置知识'] && it['前置知识'].length) {
      body += '<div class="yw-qianzhi"><div class="yw-step"><span class="yw-stepnum">📖</span><span class="yw-steptitle">学前先看</span></div>' +
        '<p class="yw-exp">先复习：' + it['前置知识'].map(function (q) { return esc(q); }).join('、') + '</p></div>';
    }
    /* 型标签 */
    function stepHead(title, right){
      step++;
      return '<div class="yw-step"><span class="yw-stepnum">'+step+'</span><span class="yw-steptitle">'+title+'</span>'+
        (right ? '<span class="yw-stepright">'+right+'</span>' : '')+'</div>';
    }
    /* 按型定的节标题 */
    var T = {
      '规律': { analogy: '💡 啊哈现象', rule: '一句话', ex: '例组', bad: '病例' },
      '辨析': { analogy: '💡 啊哈现象', rule: '辨析对照', ex: '分水岭例句', bad: '天坑病例' },
      '程序': { analogy: '💡 啊哈现象', rule: '一句话', ex: '全程演示', bad: '易错诊所' }
    }[tp];
    /* 4. 规则/对照/步骤 */
    if (it['讲解'] || it['口诀'] || (it['例子'] && it['例子'].length)) {
      body += stepHead(T.rule);
      if (it['讲解']) body += '<p class="yw-exp">' + esc(it['讲解']) + '</p>';
    if (it['口诀']) body += '<div class="yw-koujue2">🗣️ 口诀：' + esc(it['口诀']) + '</div>';
    if (it['例子'] && it['例子'].length) {
      body += '<div class="words">' + it['例子'].map(function (w) {
        return '<span>' + esc(w) + '</span>';
      }).join('') + '</div>';
    }
    } /* 4. 规则一句话结束：此前缺了这个右括号，导致文件尾多出一个 }) */
    /* 4a. 分类：每个子类单独一块（类名 + 代表词 + 例句），不再只藏在一段话里 */
    if (it['分类'] && it['分类'].length) {
      var flColors = ['#4a7a59', '#7a6a3d', '#8a5a44', '#5a6a7a', '#6a7a4a', '#7a5a5a'];
      body += stepHead('分类 · ' + it['分类'].length + '类');
      body += it['分类'].map(function (c, ci) {
        return '<div class="yw-fenlei" style="--fl:' + flColors[ci % flColors.length] + '">' +
          '<div class="yw-fl-head"><span class="yw-fl-name">' + esc(c['类']) + '</span>' +
          '<span class="yw-fl-rep">' + esc(c['代表'] || '') + '</span></div>' +
          '<p class="yw-exp">' + esc(c['说明'] || '') + '</p>' +
          (c['例子'] ? c['例子'].map(function (e) {
            return '<p class="yw-exp">📝 ' + esc(e) + '</p>';
          }).join('') : '') + '</div>';
      }).join('');
    }
    /* 4c. 怎么认：程序型重排为步骤卡形态 */
    if (it['怎么认'] && it['怎么认'].length) {
      if (tp === '程序') {
        body += stepHead('🃏 步骤卡') + '<div class="yw-stepcards">' +
          it['怎么认'].map(function (s, si) {
            return '<div class="yw-stepcard"><span class="yw-stepcard-n">' + (si + 1) + '</span><span>' + esc(s) + '</span></div>';
          }).join('') + '</div>';
      } else {
        body += stepHead('怎么认') +
          it['怎么认'].map(function (s, si) {
            return '<p class="yw-exp">' + (si + 1) + '. ' + esc(s) + '</p>';
          }).join('');
      }
    }
    /* 1. 啊哈现象（类比） */
    if (it['类比']) body += stepHead(T.analogy,'蒙特梭利语法符号') +
      '<div class="yw-analogy">' + it['类比'] + '</div>';
    /* 2. 看图说话 */
    if (it['图示']) body += stepHead('看图说话','符号标注') +
      '<div class="yw-diagram">' + it['图示'] +
      '<div style="text-align:center;margin-top:8px;"><button class="back" style="padding:8px 16px;font-size:14px;" onclick="var s=this.parentNode.previousElementSibling;if(s)s.setCurrentTime(0)">↻ 重播动画</button></div></div>';
    /* 3. 动手试试（动画） */
    if (it['动画'] && it['动画'].steps && it['动画'].steps.length) {
      var aid = 'anim' + idx + '_' + Math.floor(Math.random() * 100000);
      body += '<div class="yw-anim" id="' + aid + '">' +
        '<div class="yw-anim-tokens">' + it['动画'].steps[0].tokens.map(function (t) {
          return '<span class="tok">' + esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="yw-anim-note">' + esc(it['动画'].steps[0].note || '') + '</div>' +
        '<div class="yw-anim-ctrl"><button data-aid="' + aid + '" data-act="play">▶ 播放</button>' +
        '<button data-aid="' + aid + '" data-act="step">单步</button></div></div>';
      /* 存步骤数据供播放器用 */
      animData[aid] = it['动画'].steps;
    }
    /* 3b. 互动游戏 */
    if (it['游戏']) {
      var gid = 'game' + idx + '_' + Math.floor(Math.random() * 100000);
      gameData[gid] = it['游戏'];
      body += '<div class="yw-game" id="' + gid + '">' +
        '<div class="game-title">🎮 ' + esc(it['游戏'].title || '互动练习') + '</div>' +
        '<div class="game-area"></div>' +
        '<div class="game-fb"></div></div>';
    }
    /* 4b. 深讲一点（语法深讲样板：词类） */
    if (it['深讲']) body += stepHead('深讲一点') + '<p class="yw-exp">' + esc(it['深讲']) + '</p>';
    /* 4d. 辨析 */
    if (it['辨析']) body += '<div class="warn">🔍 辨析：' + esc(it['辨析']) + '</div>';
    /* 4e. 例句解析：程序型标题为全程演示 */
    if (it['例句解析'] && it['例句解析'].length) body += stepHead(tp === '程序' ? '🎬 全程演示' : '例句解析') +
      it['例句解析'].map(function (e) {
        return '<p class="yw-exp">📝 ' + esc(e['句'] || '') + '<br>↳ ' + esc(e['析'] || '') + '</p>';
      }).join('');
    /* 4f. 变式表（阶段2）：不变/可变/边界 */
    if (it['变式表']) {
      var vt = it['变式表'];
      var vth = '<div class="yw-vtable"><table><tr><th>不变</th><td>' + esc(vt['不变'] || '') + '</td></tr>';
      if (vt['可变']) {
        var dims = Object.keys(vt['可变']).map(function (k) {
          return '<b>' + esc(k) + '</b>：' + esc((vt['可变'][k] || []).join(' / '));
        }).join('<br>');
        vth += '<tr><th>可变</th><td>' + dims + '</td></tr>';
      }
      if (vt['边界']) vth += '<tr><th>边界</th><td>' + esc(vt['边界']) + '</td></tr>';
      vth += '</table>';
      vth += '</div>';
      body += stepHead('📐 变式表') + vth;
    }
    /* 5. 易错诊所 */
    if (it['易错']) body += '<div class="warn">⚠️ ' + esc(it['易错']) + '</div>';
    /* 5b1. 题库动手练：有 200 道题库的点用题库（每轮 10 道），不再重复显示样板 3 道 */
    if (bankData[it.name] && bankData[it.name].questions && bankData[it.name].questions.length) {
      var bid = 'bank' + idx + '_' + Math.floor(Math.random() * 100000);
      bankState[bid] = { name: it.name, offset: 0, score: 0, answered: 0, filter: '全部' };
      var bclasses = ['全部'];
      bankData[it.name].questions.forEach(function (q) {
        if (q['类'] && bclasses.indexOf(q['类']) < 0) bclasses.push(q['类']);
      });
      body += '<div class="yw-quiz yw-bank" id="' + bid + '">' +
        '<div class="yw-step"><span class="yw-stepnum">✏️</span><span class="yw-steptitle">动手练 · 题库</span></div>' +
        '<div class="bank-filters">' + bclasses.map(function (c) {
          return '<button class="' + (c === '全部' ? 'on' : '') + '" data-bank-filter="' + bid + '|' + c + '">按类练：' + esc(c) + '</button>';
        }).join('') + '</div>' +
        '<p class="yw-exp bank-head">' + esc(bankHeadHtml(bid)) + '</p>' +
        '<div class="bank-qs">' + bankBatchHtml(bid, it.name) + '</div>' +
        '<button class="bank-next" data-bank-next="' + bid + '">再来 10 道 →</button></div>';
    }
    /* 5b. 动手练（每点 3 道带解析的选择题，复用小测的答题逻辑） */
    if (it['练习'] && it['练习'].length && !bankData[it.name]) {
      /* 练习按类分组：同类题放一块，组头就是类名 */
      var groups = [];
      it['练习'].forEach(function (q) {
        var gname = q['类'] || '综合';
        var g = null;
        for (var gi = 0; gi < groups.length; gi++) if (groups[gi].name === gname) g = groups[gi];
        if (!g) { g = { name: gname, qs: [] }; groups.push(g); }
        g.qs.push(q);
      });
      var qi = 0;
      body += '<div class="yw-quiz"><div class="yw-step"><span class="yw-stepnum">✏️</span><span class="yw-steptitle">动手练</span></div>' + groups.map(function (g) {
        return '<div class="yw-lx-group"><div class="yw-lx-grouphead">按类练：' + esc(g.name) + '</div>' + g.qs.map(function (q) {
          var qid = 'lx' + idx + '_' + (qi++) + '_' + Math.floor(Math.random() * 100000);
          quizData[qid] = q;
          return '<div class="quiz-q" id="' + qid + '"><div class="quiz-t">' + esc(q.q) + '</div>' +
            '<div class="quiz-opts">' + q.options.map(function (op, oi) {
              return '<button data-qid="' + qid + '" data-oi="' + oi + '">' + esc(op) + '</button>';
            }).join('') + '</div><div class="quiz-fb"></div></div>';
        }).join('') + '</div>';
      }).join('') + '</div>';
    }
    /* 6. 小测 */
    if (it['小测'] && it['小测'].length) {
      body += '<div class="yw-quiz">' + it['小测'].map(function (q, qi) {
        var qid = 'q' + idx + '_' + qi + '_' + Math.floor(Math.random() * 100000);
        quizData[qid] = q;
        return '<div class="quiz-q" id="' + qid + '"><div class="quiz-t">' + (qi + 1) + '. ' + esc(q.q) + '</div>' +
          '<div class="quiz-opts">' + q.options.map(function (op, oi) {
            return '<button data-qid="' + qid + '" data-oi="' + oi + '">' + esc(op) + '</button>';
          }).join('') + '</div><div class="quiz-fb"></div></div>';
      }).join('') + '</div>';
    }
    var iconMap = {'名词':'<span style="color:#1a1a1a">▲</span>','动词':'🔴','形容词':'<span style="color:#3b82f6">▲</span>','数词':'🔢','量词':'📏','代词':'➕','副词':'⚡','介词':'🔗','连词':'⛓️','助词':'📌','语气词':'💬','叹词':'❗','主语':'👤','谓语':'🏃','宾语':'🎯','定语':'🏷️','状语':'📍','补语':'➕','比喻':'🪞','拟人':'🧍','夸张':'🎈','排比':'📚','对偶':'⚖️','反复':'🔁','设问':'❓','反问':'‼️'};
    var icon = iconMap[it.name] || '📖';
    currentItems[idx] = {it: it, body: body, icon: icon};
    return '<div class="yw-item">' +
      '<button class="yw-head" data-idx="' + idx + '"><span class="yw-ico">' + icon + '</span><span class="yw-name">' + esc(it.name || '') + '</span>' +
      (it['口诀'] ? '<span class="yw-kj">' + esc(it['口诀']) + '</span>' : '') +
      (it['subtitle'] ? '<span class="yw-sub">' + esc(it['subtitle']) + '</span>' : '') +
      '<span class="yw-badges">' +
      (hasVisual ? '<span class="yw-badge">✨图解</span>' : '') +
      (bankData[it.name] ? '<span class="yw-badge">📝' + bankData[it.name].total + '道</span>' :
        (it['练习'] ? '<span class="yw-badge">📝动手练</span>' : '')) +
      '</span>' +
      '<span class="yw-arrow">▾</span></button>' +
      '<div class="yw-body" data-idx="' + idx + '">' + body + '</div></div>';
  }

  function showDetail(rec, headEl) {
    var it = rec.it;
    // 把 body 节点直接搬到详情区（避免 innerHTML 复制导致 ID 重复）
    var itemEl = headEl.closest('.yw-item');
    var bodyEl = itemEl ? itemEl.querySelector('.yw-body') : null;
    listEl.style.display = 'none';
    detailEl.style.display = 'block';
    detailEl.innerHTML =
      '<div style="display:flex;gap:10px;margin-bottom:16px">' +
      '<button class="yw-back" id="ywBack">← 返回列表</button></div>' +
      '<div class="yw-detail-head"><span class="yw-ico-lg">' + rec.icon + '</span>' +
      '<div><h2>' + esc(it.name || '') + '</h2>' +
      (it['口诀'] ? '<p class="yw-kj-lg">' + esc(it['口诀']) + '</p>' : '') + '</div></div>' +
      '<div class="yw-detail-body" id="ywDetailBody"></div>';
    if (bodyEl) document.getElementById('ywDetailBody').appendChild(bodyEl);
    document.getElementById('ywBack').addEventListener('click', hideDetail);
    window.scrollTo(0, 0);
  }

  function hideDetail() {
    // 把 body 节点搬回列表
    var bodyEl = document.querySelector('#ywDetailBody .yw-body');
    if (bodyEl) {
      var idx = bodyEl.getAttribute('data-idx');
      var itemEl = listEl.querySelector('.yw-head[data-idx="' + idx + '"]');
      if (itemEl) itemEl.closest('.yw-item').appendChild(bodyEl);
    }
    detailEl.style.display = 'none';
    detailEl.innerHTML = '';
    listEl.style.display = '';
    window.scrollTo(0, 0);
  }

  function render() {
    var d = DATA[active];
    if (!d) return;
    var q = '';

    var html = '';
    var visCats = []; /* 顶部模块索引 chips：只收录过滤后仍可见的分类 */
    d.categories.forEach(function (c, ci) {
      var items = c.items;
      if (q) {
        items = items.filter(function (it) {
          return (it.name || '').indexOf(q) >= 0 ||
            (it['讲解'] || '').indexOf(q) >= 0 ||
            (it['深讲'] || '').indexOf(q) >= 0 ||
            (it['辨析'] || '').indexOf(q) >= 0 ||
            (it['口诀'] || '').indexOf(q) >= 0;
        });
        if (!items.length) return;
      }
      visCats.push({ ci: ci, name: c.name, n: items.length });
      html += '<div class="ghead" id="ywc-' + ci + '">' + esc(c.name) +
        '<span class="gcount">' + items.length + '条</span></div>' +
        '<div class="yw-grid">' +
        items.map(function (it, ii) { return itemHtml(it, ci + '_' + ii, c.name); }).join('') +
        '</div>';
    });
    listEl.innerHTML = html ||
      '<div class="noresult">没找到相关知识点，换个词试试</div>';

    var tb = document.querySelector('.topbar');
    var top = tb ? tb.offsetHeight : 0;
    Array.prototype.forEach.call(listEl.querySelectorAll('.ghead'), function (h) {
      h.style.top = top + 'px';
    });
  }

  function syncTabs() {
    if (!tabsEl) return;
    tabsEl.innerHTML = MODULES.map(function (m) {
      var n = DATA[m.key] ? DATA[m.key].categories.reduce(function (a, c) { return a + c.items.length; }, 0) : 0;
      return '<button class="tab' + (m.key === active ? ' active' : '') + '" data-m="' + m.key + '">' +
        esc(m.label) + (n ? ' ' + n : '') + '</button>';
    }).join('');
  }

  if (tabsEl) tabsEl.addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    active = t.getAttribute('data-m');
    syncTabs(); render();
    window.scrollTo(0, 0);
  });

  document.addEventListener('click', function (e) {
    var h = e.target.closest('.yw-head');
    if (h && listEl.style.display !== 'none') {
      var idx = h.getAttribute('data-idx');
      var rec = currentItems[idx];
      if (rec) showDetail(rec, h);
      return;
    }

    /* 动画播放器 */
    var ab = e.target.closest('[data-aid]');
    if (ab) {
      var aid = ab.getAttribute('data-aid');
      var act = ab.getAttribute('data-act');
      var steps = animData[aid];
      var box = document.getElementById(aid);
      if (!steps || !box) return;
      var toks = box.querySelectorAll('.tok');
      var note = box.querySelector('.yw-anim-note');
      var cur = parseInt(box.getAttribute('data-cur') || '0', 10);
      var playBtn = box.querySelector('[data-act="play"]');
      e.stopPropagation();
      /* 停掉本盒子正在跑的播放定时器：重复点播放、播放中点单步都不再打架；
         单步同时解禁播放钮 */
      if (box._animTimer) { clearInterval(box._animTimer); box._animTimer = null; }
      if (playBtn) playBtn.disabled = false;
      function showStep(i) {
        box.setAttribute('data-cur', i);
        /* 步数多于词数时（如多米诺 3 步 2 词），末词保持高亮 */
        var hi = toks.length ? Math.min(i, toks.length - 1) : 0;
        for (var k = 0; k < toks.length; k++) {
          toks[k].classList.toggle('on', k === hi);
        }
        note.textContent = steps[i].note || '';
      }
      if (act === 'step') {
        cur = (cur + 1) % steps.length;
        showStep(cur);
      } else { /* play: 从头播 */
        cur = 0;
        showStep(0);
        if (playBtn) playBtn.disabled = true;
        box._animTimer = setInterval(function () {
          /* 盒子已被移出文档（如列表重渲染）时停掉，避免在 detached 节点上空跑 */
          if (!document.body.contains(box)) { clearInterval(box._animTimer); box._animTimer = null; return; }
          cur++;
          if (cur >= steps.length) {
            clearInterval(box._animTimer); box._animTimer = null;
            if (playBtn) playBtn.disabled = false;
            return;
          }
          showStep(cur);
        }, 1200);
      }
      return;
    }

    /* 题库按类过滤：选类后从该类第 1 道开始，本轮计分清零 */
    var fb = e.target.closest('[data-bank-filter]');
    if (fb) {
      var parts = fb.getAttribute('data-bank-filter').split('|');
      var fbid = parts[0];
      var fst = bankState[fbid];
      if (!fst) return;
      e.stopPropagation();
      fst.filter = parts[1];
      fst.offset = 0;
      fst.score = 0;
      fst.answered = 0;
      renderBank(fbid);
      return;
    }

    /* 题库换批：每轮 10 道，在当前类内循环，本轮计分清零 */
    var nb = e.target.closest('[data-bank-next]');
    if (nb) {
      var bid = nb.getAttribute('data-bank-next');
      var st = bankState[bid];
      if (!st) return;
      e.stopPropagation();
      var flen = bankFiltered(bid).length;
      if (flen) st.offset = (st.offset + 10) % flen;
      st.score = 0;
      st.answered = 0;
      renderBank(bid);
      return;
    }

    /* 题库答题：与小测同逻辑，另计本轮得分并防重复点击 */
    var bb = e.target.closest('[data-bqid]');
    if (bb) {
      var bqid = bb.getAttribute('data-bqid');
      var boi = parseInt(bb.getAttribute('data-boi'), 10);
      var bq = bankQuizData[bqid];
      var bqbox = document.getElementById(bqid);
      if (!bq || !bqbox) return;
      e.stopPropagation();
      if (bqbox.getAttribute('data-done')) return;
      bqbox.setAttribute('data-done', '1');
      var bankBox = bqbox.closest('.yw-bank');
      var bid2 = bankBox ? bankBox.id : null;
      var st2 = bid2 ? bankState[bid2] : null;
      if (st2) st2.answered++;
      var bfb = bqbox.querySelector('.quiz-fb');
      var bbtns = bqbox.querySelectorAll('[data-boi]');
      for (var b2 = 0; b2 < bbtns.length; b2++) bbtns[b2].classList.remove('right', 'wrong');
      if (boi === bq.answer) {
        bb.classList.add('right');
        if (st2) st2.score++;
        bfb.innerHTML = '✅ 答对了！' + (bq['解析'] ? esc(bq['解析']) : '');
      } else {
        bb.classList.add('wrong');
        bbtns[bq.answer].classList.add('right');
        bfb.innerHTML = '❌ 再想想。' + (bq['解析'] ? esc(bq['解析']) : '');
      }
      /* 错题打通：答错进统一错题本（答对复习项推进间隔），不改反馈与计分 */
      NHZReview.record({ q: bq.q, options: bq.options, answer: bq.options[bq.answer] || '',
        解析: bq['解析'] || '', src: '语法', point: st2 ? st2.name : '' }, boi === bq.answer);
      if (bankBox && st2) bankBox.querySelector('.bank-head').textContent = bankHeadHtml(bid2);
      return;
    }

    /* 小测 */
    var qb = e.target.closest('[data-qid]');
    if (qb) {
      var qid = qb.getAttribute('data-qid');
      var oi = parseInt(qb.getAttribute('data-oi'), 10);
      var q = quizData[qid];
      var qbox = document.getElementById(qid);
      if (!q || !qbox) return;
      e.stopPropagation();
      var fb = qbox.querySelector('.quiz-fb');
      var btns = qbox.querySelectorAll('[data-oi]');
      for (var b = 0; b < btns.length; b++) btns[b].classList.remove('right', 'wrong');
      if (oi === q.answer) {
        qb.classList.add('right');
        fb.innerHTML = '✅ 答对了！' + (q['解析'] ? esc(q['解析']) : '');
      } else {
        qb.classList.add('wrong');
        btns[q.answer].classList.add('right');
        fb.innerHTML = '❌ 再想想。' + (q['解析'] ? esc(q['解析']) : '');
      }
      /* 错题打通（动手练/小测）：只记首次作答，不改反馈与计分 */
      if (!quizRecorded[qid]) {
        quizRecorded[qid] = true;
        var qbody = qbox.closest('.yw-body');
        var qrec = qbody ? currentItems[qbody.getAttribute('data-idx')] : null;
        NHZReview.record({ q: q.q, options: q.options, answer: q.options[q.answer] || '',
          解析: q['解析'] || '', src: '语法', point: qrec ? qrec.it.name : '' }, oi === q.answer);
      }
      return;
    }
  });


  window.addEventListener('resize', function () {
    var tb = document.querySelector('.topbar');
    var top = tb ? tb.offsetHeight : 0;
    Array.prototype.forEach.call(listEl.querySelectorAll('.ghead'), function (h) {
      h.style.top = top + 'px';
    });
  });

  /* 数据来自 yuwen/data.js 的 window.NHZ_YUWEN（file:// 与 http:// 通用） */
  var src = window.NHZ_YUWEN || {};
  MODULES.forEach(function (m) { if (src[m.key]) DATA[m.key] = src[m.key]; });
  if (Object.keys(DATA).length) {
    syncTabs(); render();
  } else {
    listEl.innerHTML = '<div class="noresult">知识库加载失败，请确认 yuwen/data.js 存在</div>';
  }
})();
