/* 古文 · 逐句对译点读（docs/gaijin/guwen-gaijin-sheji.md P0-A 的 M1「逐字对译点读」；TODO A21 遗留）。
   数据只读 data/guwen.js 篇目的 句[]（字段与出处规则见 tools/content/fix_gw_ju_tingdui.py、fix_gw_a21_duiyi.py 头注）：
     原 = 原文分句；今 = 本篇「译意」逐句；对 = 本篇「重点」注释落到字上（只标有注释的字，不编今译）；
     停 = 朗读停顿（有出处才有，出处在 停源）；式 = 句式标签（只取古文知识库例句命中的句子）。
   默认收起（不改篇目页默认显示）；点「逐句对译」展开：每句一行，注过的字下方挂浅灰今义，
   点字：这个字和今译里对应的词同时高亮；句式标签点开跳到知识点；🔊 朗读这一句（按停顿读）。 */
(function(){
  'use strict';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var KMAP = null;
  function pointRef(key){
    if(!KMAP){
      KMAP = {};
      var K = window.NHZ_GUWEN_KNOWLEDGE || {categories: []};
      (K.categories || []).forEach(function(c){ (c.items || []).forEach(function(it, i){ if(it.key) KMAP[it.key] = c.id + ':' + i; }); });
    }
    return KMAP[key] || '';
  }
  function has(t){ return !!(t && t.句 && t.句.length && t.句.some(function(s){ return (s.对 && s.对.length) || s.今 || s.式; })); }
  /* 今译里给对上的今义包 <mark>（该今义在本句今译中恰好出现一次才包，重叠的跳过） */
  function jinHtml(jin, dui){
    if(!jin) return '';
    var spans = [];
    (dui || []).forEach(function(d, k){
      var g = d && d[1]; if(!g) return;
      var a = jin.indexOf(g); if(a < 0 || jin.indexOf(g, a + 1) >= 0) return;
      for(var q = 0; q < spans.length; q++){ if(a < spans[q].b && spans[q].a < a + g.length) return; }
      spans.push({a: a, b: a + g.length, k: k});
    });
    spans.sort(function(x, y){ return x.a - y.a; });
    var out = '', p = 0;
    spans.forEach(function(s){ out += esc(jin.slice(p, s.a)) + '<mark class="dy-m" data-dym="' + s.k + '">' + esc(jin.slice(s.a, s.b)) + '</mark>'; p = s.b; });
    return out + esc(jin.slice(p));
  }
  /* 原句：对 的词包成上字下义的块；停 有出处时在停顿处画淡色 / */
  function yuanHtml(s){
    var yuan = String(s.原 || ''), marks = {}, slots = {};
    (s.对 || []).forEach(function(d, k){
      var i = d[2] && typeof d[2].i === 'number' ? d[2].i : -1;
      if(i < 0 || yuan.substr(i, d[0].length) !== d[0]) i = yuan.indexOf(d[0]);
      if(i >= 0) marks[i] = {k: k, w: d[0], g: d[1]};
    });
    if(s.停 && s.停.replace(/\//g, '') === yuan){
      var n = 0; for(var c = 0; c < s.停.length; c++){ if(s.停.charAt(c) === '/') slots[n] = 1; else n++; }
    }
    var out = '', i2 = 0;
    while(i2 < yuan.length){
      if(slots[i2]) out += '<span class="dy-t">/</span>';
      var m = marks[i2];
      if(m){
        out += '<span class="dy-w" data-dyw="' + m.k + '" tabindex="0"><span class="dy-z">' + esc(m.w) + '</span><span class="dy-g">' + esc(m.g) + '</span></span>';
        i2 += m.w.length; continue;
      }
      out += '<span class="dy-c">' + esc(yuan.charAt(i2)) + '</span>'; i2++;
    }
    return out;
  }
  function html(t){
    if(!has(t)) return '';
    var srcs = [];
    t.句.forEach(function(s){ if(s.停 && s.停源 && srcs.indexOf(s.停源) < 0) srcs.push(s.停源); });
    var nDui = 0, nShi = 0; t.句.forEach(function(s){ nDui += (s.对 || []).length; nShi += (s.式 || []).length; });
    var h = '<div class="gw-dy" data-gwdy-box>';
    h += '<button type="button" class="gw-filterbtn" data-gwdy="toggle" aria-expanded="false">🈶 逐句对译（' + t.句.length + ' 句 · 注字 ' + nDui + (nShi ? ' · 句式 ' + nShi : '') + '）</button>';
    h += '<div class="gw-dy-body" hidden>';
    h += '<p class="gw-dy-tip">浅灰小字是本篇注释里的意思；点一个字，今译里对应的词会一起亮。没有注释的字不标。</p>';
    t.句.forEach(function(s, si){
      h += '<div class="gw-dy-row" data-dyrow="' + si + '">';
      h += '<div class="gw-dy-yuan">' + yuanHtml(s) + '<button type="button" class="gw-dy-say" data-gwdy="say" data-dys="' + si + '" aria-label="朗读这一句">🔊</button></div>';
      if(s.今) h += '<div class="gw-dy-jin">今：' + jinHtml(s.今, s.对) + '</div>';
      if(s.式 && s.式.length){
        h += '<div class="gw-dy-shi">' + s.式.map(function(x){
          var ref = pointRef(x.点);
          return (ref ? '<button class="gw-from" data-gwpoint="' + esc(ref) + '">🧩 句式·' + esc(x.名) + ' →</button>' : '<span class="gw-tag">句式·' + esc(x.名) + '</span>') +
            (x.析 ? '<span class="gw-dy-xi">' + esc(x.析) + '</span>' : '');
        }).join('') + '</div>';
      }
      h += '</div>';
    });
    h += '<p class="gw-src">对译依据：今译取本篇「译意」逐句；字下小字取本篇「重点字词」注释；句式取古文知识库例句' +
      (srcs.length ? '；停顿（/）出处：' + srcs.map(esc).join('；') : '；本篇暂无有出处的朗读停顿') + '。</p>';
    h += '</div></div>';
    return h;
  }
  function speak(t, si, row){
    if(!('speechSynthesis' in window)) return;
    var s = t && t.句 && t.句[si]; if(!s) return;
    try{ speechSynthesis.cancel(); }catch(e){}
    var txt = (s.停 && s.停.replace(/\//g, '') === s.原 ? s.停.replace(/\//g, '，') : s.原).replace(/[“”‘’《》]/g, '');
    var u = new SpeechSynthesisUtterance(txt);
    u.lang = 'zh-CN'; u.rate = 0.8;
    if(row){ row.classList.add('reading'); u.onend = function(){ row.classList.remove('reading'); }; }
    speechSynthesis.speak(u);
  }
  var API = { has: has, html: html, cur: function(){ return null; } };
  document.addEventListener('click', function(e){
    var box = e.target.closest && e.target.closest('[data-gwdy-box]');
    if(!box) return;
    var btn = e.target.closest('[data-gwdy]');
    if(btn && btn.getAttribute('data-gwdy') === 'toggle'){
      var body = box.querySelector('.gw-dy-body'), open = body.hidden;
      body.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    if(btn && btn.getAttribute('data-gwdy') === 'say'){
      speak(API.cur(), parseInt(btn.getAttribute('data-dys'), 10), btn.closest('.gw-dy-row'));
      return;
    }
    var w = e.target.closest('[data-dyw]');
    if(w){
      var row = w.closest('.gw-dy-row'), k = w.getAttribute('data-dyw');
      box.querySelectorAll('.dy-w.on, .dy-m.on').forEach(function(x){ x.classList.remove('on'); });
      w.classList.add('on');
      var m = row && row.querySelector('.dy-m[data-dym="' + k + '"]'); if(m) m.classList.add('on');
    }
  });
  window.NHZGwDy = API;
})();
