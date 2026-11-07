/* 拼音音频播放（window.NHZPinyinAudio）。只播真人录音文件，不用 Web Speech 读单字/声调（实测会读错调）。
 * 依赖：pinyin/audio/index.js（window.NHZ_PINYIN_AUDIO，清单里没有的文件一律不请求）。
 *
 *   NHZPinyinAudio.hasSyl('nv', 3)   → 清单里有没有 cmn-nv3.mp3（音节用 audio-cmn 拼写：ü 写 v）
 *   NHZPinyinAudio.hasHudu('zh')     → 有没有声母呼读音 hudu/zh.mp3
 *   NHZPinyinAudio.playSyl('nv', 3) / playHudu('zh') → Promise（true=开始播放；false=没有文件或播放失败，不抛错）
 *   NHZPinyinAudio.last              → 最近一次请求的地址（测试用）
 *
 * 播放方式：http(s) 下用 fetch 取整个文件（service worker 按需缓存）+ Web Audio 解码播放；
 * AudioContext 在点击的同一拍里 resume，平板 Safari 也能出声。file:// 或 Web Audio 不可用时退回 <audio>。 */
(function () {
  var M = window.NHZ_PINYIN_AUDIO || { base: 'pinyin/audio/', syl: {}, hudu: [] };
  var HUDU = {}; (M.hudu || []).forEach(function (h) { HUDU[h] = 1; });
  var ctx = null, cur = null, buffers = {};
  var canFetch = /^https?:$/.test(location.protocol) && typeof fetch === 'function';
  var AC = window.AudioContext || window.webkitAudioContext;

  function hasSyl(s, t) { return !!(M.syl[s] && M.syl[s].indexOf(String(t)) >= 0); }
  function hasHudu(i) { return !!HUDU[i]; }

  function stop() {
    if (!cur) return;
    try { if (cur.stop) cur.stop(); else { cur.pause(); cur.currentTime = 0; } } catch (e) { /* 已停 */ }
    cur = null;
  }

  function viaElement(url) {
    return new Promise(function (resolve) {
      var a = new Audio(url); cur = a;
      var p = a.play();
      if (p && p.then) p.then(function () { resolve(true); }, function () { resolve(false); }); else resolve(true);
    });
  }

  function play(url) {
    api.last = url;
    stop();
    if (!canFetch || !AC) return viaElement(url);
    if (!ctx) { try { ctx = new AC(); } catch (e) { return viaElement(url); } }
    if (ctx.state === 'suspended') ctx.resume(); /* 必须在点击的同步调用栈里 */
    var token = {}; cur = token;
    var got = buffers[url] ? Promise.resolve(buffers[url]) : fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(function (ab) {
      return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
    }).then(function (buf) { buffers[url] = buf; return buf; });
    return got.then(function (buf) {
      if (cur !== token) return false; /* 期间又点了别的 */
      var src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(0);
      cur = src; return true;
    }).catch(function () { return cur === token ? viaElement(url) : false; });
  }

  var api = {
    hasSyl: hasSyl, hasHudu: hasHudu, stop: stop, last: '',
    urlSyl: function (s, t) { return M.base + 'cmn-' + s + t + '.mp3'; },
    urlHudu: function (i) { return M.base + 'hudu/' + i + '.mp3'; },
    playSyl: function (s, t) { return hasSyl(s, t) ? play(api.urlSyl(s, t)) : Promise.resolve(false); },
    playHudu: function (i) { return hasHudu(i) ? play(api.urlHudu(i)) : Promise.resolve(false); }
  };
  window.NHZPinyinAudio = api;
})();
