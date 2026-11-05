/* 古文 · 诵读跟读（docs/gaijin/guwen-gaijin-sheji.md P1-D，TODO A22-10）。不打分、不测评。
   分节：原文按 ，。！？；：（连同其后的 ”’」）切成「节」，不足 2 个汉字的节并入下一节（如 曰：）。
   有 句[].停 的句子（data/guwen.js，出处见 停源；格式见 tools/content/fix_gw_ju_tingdui.py 头注）：
     节内按 / 再分成小段，逐段朗读、段间留短停顿，读到的小段加深高亮，停顿处显示淡色「/」；
   没有 停 的句子（及没有 句[] 的篇目）：过渡版，只按标点分节，节内不加停顿。
   「诵读」：逐节读完全文，当前节高亮；「跟我读」：每读完一节停约 3 秒留给孩子跟读。
   朗读时原文框临时换成分节视图，停下后还原（点读照常）。离开篇目（guwen.html hideAll）、换页、切后台都会停。 */
(function(){
  var RATE = 0.8, GAP_TING = 350, GAP_JIE = 700, FOLLOW = 3000;
  var PU = /[，。！？；：]/;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hz(s){ return (String(s).match(/[\u3400-\u9fff]/g) || []).length; }
  /* 一句（可带 /）→ 节列表，每节是若干小段字符串 */
  function splitSen(s, out){
    var cur = [''], i = 0;
    function endJie(){ if(cur.join('')) out.push(cur); cur = ['']; }
    while(i < s.length){
      var ch = s.charAt(i++);
      if(ch === '/'){ if(cur[cur.length - 1]) cur.push(''); continue; }
      cur[cur.length - 1] += ch;
      if(PU.test(ch)){ while(i < s.length && /[”’」]/.test(s.charAt(i))) cur[cur.length - 1] += s.charAt(i++); endJie(); }
    }
    endJie();
  }
  function segments(t){
    var jie = [], ting = false, src = String(t.原文 || '');
    var ju = t.句 && t.句.length && t.句.map(function(s){ return s.原; }).join('') === src ? t.句 : null;
    if(ju) ju.forEach(function(s){ if(s.停 && s.停.replace(/\//g, '') === s.原){ ting = true; splitSen(s.停, jie); } else splitSen(s.原, jie); });
    else splitSen(src, jie);
    /* 不足 2 个汉字的节并入下一节 */
    var out = [];
    for(var k = 0; k < jie.length; k++){
      var j = jie[k];
      if(hz(j.join('')) < 2 && k + 1 < jie.length){ jie[k + 1] = j.slice(0, -1).concat([j[j.length - 1] + jie[k + 1][0]], jie[k + 1].slice(1)); continue; }
      out.push(j);
    }
    return { jie: out, ting: ting };
  }
  function barHtml(t){
    var sg = segments(t);
    return '<div class="gw-sd" data-gwsd-box><button type="button" class="gw-sdbtn" data-gwsd="read">🔊 诵读</button>' +
      '<button type="button" class="gw-sdbtn" data-gwsd="follow">🗣️ 跟我读</button>' +
      '<span class="gw-sdtip" id="gwSdTip">' + (sg.ting ? '按课本朗读停顿分节' : '按标点分节（过渡版）') + '</span></div>';
  }
  function viewHtml(sg){
    return sg.jie.map(function(j, a){
      return '<span class="sdj" data-sdj="' + a + '">' + j.map(function(p, b){
        return (b ? '<span class="sdt">/</span>' : '') + '<span class="sdp" data-sdp="' + b + '">' + esc(p) + '</span>';
      }).join('') + '</span>';
    }).join('');
  }
  var st = null; /* {tok, box, saved, timers, mode} */
  var tokSeq = 0;
  function clearTimers(){ if(st) st.timers.forEach(clearTimeout); }
  function stop(){
    if(!st) return;
    clearTimers();
    var s = st; st = null;
    try{ speechSynthesis.cancel(); }catch(e){}
    if(s.box && document.body.contains(s.box)) s.box.innerHTML = s.saved;
    document.querySelectorAll('.gw-sdbtn.on').forEach(function(b){ b.classList.remove('on'); });
    var tip = document.getElementById('gwSdTip'); if(tip) tip.textContent = s.tipText;
  }
  function later(fn, ms){ var tok = st.tok; st.timers.push(setTimeout(function(){ if(st && st.tok === tok) fn(); }, ms)); }
  /* 读一段：onend / onerror 都往下走；设备不出声时按字数兜底计时，不卡住 */
  function say(text, done){
    var tok = st.tok, fired = false;
    function next(){ if(fired || !st || st.tok !== tok) return; fired = true; done(); }
    var u = new SpeechSynthesisUtterance(text.replace(/[，。！？、；：“”‘’「」]/g, ' '));
    u.lang = 'zh-CN'; u.rate = RATE; u.onend = next; u.onerror = next;
    later(function(){ try{ speechSynthesis.cancel(); }catch(e){} next(); }, Math.max(2000, hz(text) * 600 + 1500));
    try{ speechSynthesis.speak(u); }catch(e){ next(); }
  }
  function mark(a, b){
    st.box.querySelectorAll('.sdj.on, .sdp.on').forEach(function(x){ x.classList.remove('on'); });
    var j = st.box.querySelector('[data-sdj="' + a + '"]'); if(!j) return;
    j.classList.add('on');
    if(b != null){ var p = j.querySelector('[data-sdp="' + b + '"]'); if(p && j.querySelectorAll('.sdp').length > 1) p.classList.add('on'); }
  }
  function tip(s){ var el = document.getElementById('gwSdTip'); if(el) el.textContent = s; }
  function play(a, b){
    var jie = st.sg.jie;
    if(a >= jie.length){ stop(); tip('读完了'); return; }
    if(b >= jie[a].length){
      if(st.mode === 'follow'){
        st.box.querySelector('[data-sdj="' + a + '"]').classList.add('you');
        var left = Math.round(FOLLOW / 1000);
        (function tick(){ tip('该你读了… ' + left); if(left-- > 1) later(tick, 1000); })();
        later(function(){ var j = st.box.querySelector('.sdj.you'); if(j) j.classList.remove('you'); tip('听…'); play(a + 1, 0); }, FOLLOW);
      } else later(function(){ play(a + 1, 0); }, GAP_JIE);
      return;
    }
    mark(a, b);
    say(jie[a][b], function(){ if(b + 1 < jie[a].length) later(function(){ play(a, b + 1); }, GAP_TING); else play(a, b + 1); });
  }
  function start(t, mode, btn){
    var box = document.querySelector('.gw-yw');
    stop();
    if(!box || !t) return;
    var tipEl = document.getElementById('gwSdTip');
    if(!('speechSynthesis' in window)){ if(tipEl) tipEl.textContent = '这台设备不能朗读。'; return; }
    try{ speechSynthesis.cancel(); }catch(e){}
    var sg = segments(t);
    st = { tok: ++tokSeq, box: box, saved: box.innerHTML, timers: [], mode: mode, sg: sg, tipText: tipEl ? tipEl.textContent : '' };
    box.innerHTML = viewHtml(sg);
    if(btn) btn.classList.add('on');
    tip(mode === 'follow' ? '听一节，跟着读一节' : '听…');
    play(0, 0);
  }
  var css = document.createElement('style');
  css.textContent = '.gw-sd{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0}' +
    '.gw-sdbtn{padding:9px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-size:16px;cursor:pointer}' +
    '.gw-sdbtn.on{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}' +
    '.gw-sdtip{font-size:14px;color:var(--muted)}' +
    '.gw-yw .sdj{border-radius:6px;padding:1px 0;transition:background .2s}' +
    '.gw-yw .sdj.on{background:#fff3c4}.gw-yw .sdj.you{background:#dff3e4;outline:2px dashed #3c9a5f}' +
    '.gw-yw .sdp.on{background:#ffd966;border-radius:4px}.gw-yw .sdt{color:#c46a2b;opacity:.55;margin:0 2px}' +
    '@media (prefers-color-scheme: dark){.gw-yw .sdj.on,.gw-yw .sdp.on,.gw-yw .sdj.you{color:#222}}';
  document.head.appendChild(css);
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-gwsd]'); if(!b) return;
    var on = b.classList.contains('on');
    stop();
    if(!on && window.NHZGwSd.cur) start(window.NHZGwSd.cur(), b.getAttribute('data-gwsd'), b);
  });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); });
  window.NHZGwSd = { segments: segments, barHtml: barHtml, stop: stop, cur: null, playing: function(){ return !!st; } };
})();
