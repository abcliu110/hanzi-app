#!/usr/bin/env node
/* 拼音区内容文件校验（CI）：node newhanzi/tools/check_pinyin_content.js [pinyin/content/xxx.js ...]
 *
 * 格式见 pinyin/content/SCHEMA.md。不带参数时检查 pinyin/content/ 下全部 *.js。
 * 1. 格式：文件把对象挂到 window.NHZ_PY_CONTENT[id]，id = 文件名 = 菜单 id；必填字段；块 type 在 SCHEMA 表内；各块必填字段。
 * 2. 音频：chips/groups/pairs 的 play、quiz-listen 的 pool 必须在 pinyin/audio/index.js 里存在（syl + 声调）；
 *    hudu 必须是 21 个声母之一（文件可以还没录，页面显示「待录音」，这里只提示）。
 * 3. 拼音：words/verse/scene 的 py、{py:…} 内联标记、quiz-mark 的 items、verse.real 的值都要能被 NHZPinyinSyllable 解析
 *    且是合法音节（real 可为按出现顺序的数组，'' 表示该处不标）；词语/儿歌的音节数要和汉字数对得上（儿化 r 算一个字「儿」）。quiz-build 的声母/韵母要能组成至少一个合法音节。
 * 4. 数量下限（SCHEMA「规则」）：看 ≥3 块、听读 ≥3 块、练 ≥3 种题型（quiz-*）、用 ≥2 块且词语 ≥8 个 + 至少 1 首儿歌（verse）；
 *    L1/L2/L3 都有块；outline ≤1 块。
 * 5. 易错读音卡（duoyin/yicuo/shenyin…）：zidu 里的每个 [字, 拼音] 都要在 ziku/model-3500.json 该字读音中。
 * 退出码：有错误 = 1；只有提示 = 0。 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const NH = path.resolve(__dirname, '..');
const S = require(path.join(NH, 'pinyin', 'syllable.js'));

function loadWin(file) {
  const win = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window: win, self: win }, { filename: file });
  return win;
}
const AUDIO = loadWin(path.join(NH, 'pinyin', 'audio', 'index.js')).NHZ_PINYIN_AUDIO || { syl: {}, hudu: [] };
const MENU = loadWin(path.join(NH, 'pinyin', 'data.js')).NHZ_PINYIN_MENU || [];
const MENU_IDS = new Set(MENU.map((m) => m.id));
const INITIALS = new Set(S.INITIALS);
const HUDU = new Set(AUDIO.hudu || []);

const TYPES = {
  text: ['p'], chips: ['items'], groups: ['groups'], table: ['head', 'rows'], pairs: ['pairs'], scene: ['items'],
  mirror: ['base'], anim: ['kind'], 'quiz-listen': ['pool', 'ask'], 'quiz-choose': ['items'], 'quiz-build': ['initials', 'finals'],
  'quiz-mark': ['items'], 'quiz-find': ['target', 'distract'], words: ['items'], verse: ['lines'], outline: ['p']
};
const ANIM_KINDS = new Set(['tone-road', 'bump', 'glide', 'nasal']);
const ANIM_DONE = new Set(['tone-road', 'bump', 'glide', 'nasal']); /* 框架已实现的 kind；其余必须带 fallback（glide/nasal 画不出来时也退回 fallback，建议保留） */
const ASK = new Set(['initial', 'final', 'tone', 'syllable']);
const STAGES = ['kan', 'ting', 'lian', 'yong'];
const STAGE_N = { kan: '看', ting: '听读', lian: '练', yong: '用' };
const PUNCT = /[，。！？、；：,.!?;:“”‘’"（）()《》…—\-\s]+/g;

let errors = 0, warns = 0;
const HUDU_MISSING = new Set(); /* 呼读音还没录：只汇总提示一次 */
function E(where, msg) { errors++; console.error('  ✗ ' + where + '：' + msg); }
function W(where, msg) { warns++; console.log('  ! ' + where + '：' + msg); }

/* 听音选韵母的标准答案（韵母表里的写法）：j q x 后的 u 还原成 ü（jué → üe、jūn → ün）；
   y w 开头的零声母音节取韵母本身（yǔ → ü、yún → ün、yuè → üe、wǔ → u、yī → i；iou/uei/uen 用表里的 iu/ui/un） */
function finalAnswer(r) {
  if (!r.initial && r.final && /^[yw]/.test(r.written || '')) return ({ iou: 'iu', uei: 'ui', uen: 'un' })[r.final] || r.final;
  var fw = r.finalWritten || r.written;
  return /^[jqx]$/.test(r.initial) && /^u/.test(fw) ? 'ü' + fw.slice(1) : fw;
}

/* 音频键：'ba1' / 'lv4'（ü 写 v） */
function audioOk(key) {
  const m = /^([a-zü]+)([1-4])$/.exec(String(key || ''));
  if (!m) return false;
  const syl = m[1].replace(/ü/g, 'v');
  return !!(AUDIO.syl[syl] && AUDIO.syl[syl].indexOf(m[2]) >= 0);
}
/* 单个音节（带调号或不带调都行） */
function sylOk(tok) {
  const r = S.parse(tok);
  return r.ok || (r.errors.length === 1 && r.errors[0].code === 'not_legal' && r.interjection);
}
/* 一串拼音（可能连写，如 māma、Xī'ān）→ 切成合法音节；失败返回 null */
function segment(str) {
  const s = String(str).toLowerCase().normalize('NFC');
  const parts = s.split(/['’\s]+/).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (sylOk(p)) { out.push(p); continue; }
    const n = p.length, best = new Array(n + 1).fill(null); best[0] = [];
    for (let i = 0; i < n; i++) {
      if (!best[i]) continue;
      for (let j = Math.min(n, i + 7); j > i; j--) {
        const sub = p.slice(i, j);
        if (!best[j] && sylOk(sub)) best[j] = best[i].concat([sub]);
      }
    }
    if (!best[n]) return null;
    out.push.apply(out, best[n]);
  }
  return out;
}
function hanCount(w) { return (String(w).match(/[\u3400-\u9fff]/g) || []).length; }
function pyTokens(py) { return String(py).replace(PUNCT, ' ').trim().split(/\s+/).filter(Boolean); }
function checkInline(where, str) {
  const s = String(str == null ? '' : str);
  let m; const re = /\{(py|zi):([^}]*)\}/g;
  while ((m = re.exec(s))) {
    if (m[1] === 'py') { if (!m[2].trim() || !segment(m[2].replace(PUNCT, ' '))) E(where, '{py:' + m[2] + '} 不能解析成合法音节'); }
    else if (!/^[\u3400-\u9fff]+$/.test(m[2])) E(where, '{zi:' + m[2] + '} 应为汉字');
  }
  if (/\{(?!py:|zi:)[a-z]+:/.test(s)) E(where, '未知的内联标记（只支持 {py:} {zi:}）');
}
/* 词语、儿歌行：拼音按字标调，音节数 = 汉字数 */
function checkPyLine(where, w, py) {
  if (!py) { E(where, '缺 py'); return; }
  const toks = pyTokens(py); let n = 0;
  for (const t of toks) {
    const seg = segment(t);
    if (!seg) { E(where, '拼音「' + t + '」不能解析'); return; }
    seg.forEach((x) => { n += S.parse(x).erhua ? 2 : 1; });
  }
  const h = hanCount(w);
  if (h && n !== h) E(where, '「' + w + '」有 ' + h + ' 个字，拼音「' + py + '」是 ' + n + ' 个音节');
}
function checkChipItem(where, it) {
  if (!it || typeof it !== 'object') { E(where, '芯片应为对象'); return; }
  if (!it.t) E(where, '芯片缺 t');
  if (it.play != null && !audioOk(it.play)) E(where, 'play「' + it.play + '」不在 pinyin/audio/index.js 里');
  if (it.hudu != null) {
    if (!INITIALS.has(it.hudu)) E(where, 'hudu「' + it.hudu + '」不是 21 个声母之一');
    else if (!HUDU.has(it.hudu)) HUDU_MISSING.add(it.hudu);
  }
  if (it.tones != null && !segment(it.tones) && !/^[a-zü]+$/.test(it.tones)) E(where, 'tones「' + it.tones + '」不能解析');
}

function checkBlock(where, b, ctx) {
  if (!b || typeof b !== 'object') { E(where, '块应为对象'); return; }
  const need = TYPES[b.type];
  if (!need) { E(where, '未知块类型「' + b.type + '」'); return; }
  need.forEach((k) => { if (b[k] == null) E(where, b.type + ' 缺字段 ' + k); });
  if (b.lv != null && [1, 2, 3].indexOf(b.lv) < 0) E(where, 'lv 只能是 1/2/3');
  ctx.lv[b.lv || 1] = true;
  checkInline(where + '.h', b.h); checkInline(where + '.note', b.note);
  const arr = (k) => Array.isArray(b[k]) ? b[k] : (b[k] != null && E(where, k + ' 应为数组'), []);
  switch (b.type) {
    case 'text': case 'outline': arr('p').forEach((p, i) => checkInline(where + '.p[' + i + ']', p)); break;
    case 'chips': arr('items').forEach((it, i) => checkChipItem(where + '.items[' + i + ']', it)); break;
    case 'groups': arr('groups').forEach((g, gi) => {
      if (!g || !Array.isArray(g.items)) { E(where + '.groups[' + gi + ']', '缺 items'); return; }
      g.items.forEach((it, i) => checkChipItem(where + '.groups[' + gi + '].items[' + i + ']', it));
    }); break;
    case 'table': {
      const n = arr('head').length;
      arr('rows').forEach((r, i) => {
        if (!Array.isArray(r)) { E(where + '.rows[' + i + ']', '行应为数组'); return; }
        if (r.length !== n) E(where + '.rows[' + i + ']', '有 ' + r.length + ' 格，表头 ' + n + ' 格');
        r.forEach((c, j) => checkInline(where + '.rows[' + i + '][' + j + ']', c));
      });
      arr('head').forEach((c, j) => checkInline(where + '.head[' + j + ']', c));
      break;
    }
    case 'pairs': arr('pairs').forEach((p, i) => {
      if (!Array.isArray(p) || p.length !== 2) { E(where + '.pairs[' + i + ']', '每对应为 2 个芯片'); return; }
      p.forEach((it, j) => checkChipItem(where + '.pairs[' + i + '][' + j + ']', it));
    }); break;
    case 'scene': arr('items').forEach((it, i) => {
      const w = where + '.items[' + i + ']';
      if (!it.letter) E(w, '缺 letter');
      if (it.py && !segment(it.py)) E(w, 'py「' + it.py + '」不能解析');
      if (it.word && it.py) checkPyLine(w, it.word, it.py);
      if (it.svg && /<script|on\w+=/i.test(it.svg)) E(w, 'svg 里不许有脚本');
      if (it.svg && !/^<svg[\s>]/.test(String(it.svg).trim())) E(w, 'svg 应以 <svg 开头');
    }); break;
    case 'mirror': if (!/^[bdpq]$/.test(b.base)) W(where, 'mirror.base 一般是 b/d/p/q'); break;
    case 'anim':
      if (!ANIM_KINDS.has(b.kind)) E(where, 'anim.kind 只能是 tone-road/bump/glide/nasal');
      else if (!ANIM_DONE.has(b.kind) && !b.fallback) E(where, 'anim「' + b.kind + '」框架还没实现，必须写 fallback（静态说明）');
      if (b.fallback) checkInline(where + '.fallback', b.fallback);
      break;
    case 'quiz-listen':
      if (!ASK.has(b.ask)) E(where, 'ask 只能是 initial/final/tone/syllable');
      if (arr('pool').length < 4) E(where, 'pool 至少 4 个');
      arr('pool').forEach((k) => { if (!audioOk(k)) E(where, 'pool「' + k + '」没有音频'); });
      if (b.options != null && !Array.isArray(b.options)) E(where, 'options 应为数组');
      /* 判分口径与 kp.js 一致：ask final 时 j q x 后的 u 还原成 ü（jué → üe、jūn → ün）；答案必须在 options 里 */
      if (Array.isArray(b.options) && (b.ask === 'final' || b.ask === 'initial')) arr('pool').forEach((k) => {
        const r = S.parse(String(k).replace(/v/g, 'ü'));
        let a;
        if (b.ask === 'initial') a = r.initial || '零声母';
        else a = finalAnswer(r);
        if (b.options.indexOf(a) < 0) E(where, 'pool「' + k + '」的答案「' + a + '」不在 options 里');
      });
      break;
    case 'quiz-choose': arr('items').forEach((q, i) => {
      const w = where + '.items[' + i + ']';
      if (!q.q) E(w, '缺 q');
      if (!Array.isArray(q.options) || q.options.length < 2) E(w, 'options 至少 2 个');
      else if (!(q.answer >= 0 && q.answer < q.options.length)) E(w, 'answer 越界');
      checkInline(w + '.q', q.q); checkInline(w + '.why', q.why);
      if (q.play != null && !audioOk(q.play)) ctx.noAudio.push(q.play); /* 听音题没录音：页面不出这道题，这里只汇总提示 */
      (q.options || []).forEach((o, j) => checkInline(w + '.options[' + j + ']', o));
    }); break;
    case 'quiz-build': {
      const ini = arr('initials'), fin = arr('finals'); let any = 0;
      ini.forEach((x) => { if (x !== '' && !INITIALS.has(x)) E(where, '声母「' + x + '」不在 21 个声母里'); });
      ini.forEach((i) => fin.forEach((f) => { if (S.isLegal(i + f) || S.parse(i + f).ok) any++; }));
      if (!any) E(where, '声母 × 韵母拼不出任何合法音节');
      if (b.tones != null && !(Array.isArray(b.tones) && b.tones.every((t) => [1, 2, 3, 4].indexOf(t) >= 0))) E(where, 'tones 只能是 1–4');
      break;
    }
    case 'quiz-mark': arr('items').forEach((x) => {
      const r = S.parse(x);
      if (!(r.legal && r.tone === 5 && r.ok)) E(where, '标调题「' + x + '」应是不带调的合法音节');
    }); break;
    case 'quiz-find':
      if (!Array.isArray(b.distract) || !b.distract.length) E(where, 'distract 应为非空数组');
      if (b.n != null && !(b.n >= 4 && b.n <= 24)) E(where, 'n 应在 4–24');
      break;
    case 'words': arr('items').forEach((it, i) => { checkPyLine(where + '.items[' + i + ']', it.w, it.py); ctx.words++; }); break;
    case 'verse': {
      arr('lines').forEach((l, i) => checkPyLine(where + '.lines[' + i + ']', l.w, l.py));
      const all = arr('lines').map((l) => l.w).join('');
      /* real：'一':'yì'（这首里每个「一」都这样读），或 '一':['yí','']（按出现顺序，'' = 读原调不标） */
      Object.keys(b.real || {}).forEach((z) => {
        if (all.indexOf(z) < 0) E(where, 'real 的「' + z + '」不在句子里');
        const v = b.real[z], list = Array.isArray(v) ? v : [v];
        if (Array.isArray(v) && v.length > all.split(z).length - 1) E(where, 'real「' + z + '」给了 ' + v.length + ' 个读音，句子里只出现 ' + (all.split(z).length - 1) + ' 次');
        list.forEach((x) => { if (x !== '' && !segment(x)) E(where, 'real「' + z + '」→「' + x + '」不能解析'); });
        if (!list.some((x) => x)) E(where, 'real「' + z + '」至少要有一个读音');
      });
      ctx.verse++; ctx.verseLines += arr('lines').length;
      break;
    }
  }
}

function checkFile(file) {
  const id = path.basename(file, '.js');
  console.log('· ' + path.relative(NH, file));
  let win;
  try { win = loadWin(file); } catch (e) { E(id, '脚本执行出错：' + e.message); return; }
  const all = win.NHZ_PY_CONTENT || {};
  const c = all[id];
  if (!c) { E(id, '没有挂到 window.NHZ_PY_CONTENT[\'' + id + '\']'); return; }
  if (Object.keys(all).length !== 1) E(id, '一个文件只放一个知识点');
  if (c.id !== id) E(id, 'id「' + c.id + '」应与文件名一致');
  if (!MENU_IDS.has(id)) E(id, '菜单（pinyin/data.js）里没有这个 id');
  if (!c.name) E(id, '缺 name');
  if (!c.lead) E(id, '缺 lead');
  else checkInline(id + '.lead', c.lead);
  if (!Array.isArray(c.src) || !c.src.length) E(id, 'src 应为非空数组（依据）');
  const ctx = { lv: {}, words: 0, verse: 0, verseLines: 0, noAudio: [] };
  let outline = 0;
  STAGES.forEach((st) => {
    if (!Array.isArray(c[st])) { E(id, '缺 ' + st + '（' + STAGE_N[st] + '）数组'); c[st] = []; }
    c[st].forEach((b, i) => { checkBlock(id + '.' + st + '[' + i + ']' + (b && b.type ? '(' + b.type + ')' : ''), b, ctx); if (b && b.type === 'outline') outline++; });
  });
  const cnt = (st) => c[st].filter((b) => b && b.type !== 'outline').length;
  if (cnt('kan') < 3) E(id, '看 只有 ' + cnt('kan') + ' 块（≥3）');
  if (cnt('ting') < 3) E(id, '听读 只有 ' + cnt('ting') + ' 块（≥3）');
  /* 易错读音卡的题都是 quiz-choose，按 kind（pick/sent/hear/wrong/judge）算不同题型 */
  const qt = new Set(c.lian.filter((b) => b && /^quiz-/.test(b.type)).map((b) => b.type + (b.kind ? ':' + b.kind : '')));
  if (qt.size < 3) E(id, '练 只有 ' + qt.size + ' 种题型（≥3）：' + Array.from(qt).join(' '));
  if (cnt('yong') < 2) E(id, '用 只有 ' + cnt('yong') + ' 块（≥2）');
  if (ctx.words < 8) E(id, '词语只有 ' + ctx.words + ' 个（≥8）');
  if (!ctx.verse) E(id, '没有儿歌/短句（verse ≥1，或 2 句短句写成一个 verse）');
  else if (ctx.verseLines < 2) E(id, '儿歌/短句只有 ' + ctx.verseLines + ' 行（≥2）');
  [1, 2, 3].forEach((l) => { if (!ctx.lv[l]) E(id, '没有 L' + l + ' 的块'); });
  if (outline > 1) E(id, 'outline 只许 1 块（现在 ' + outline + '）');
  if (ctx.noAudio.length) W(id, '听音题没有录音，页面跳过这 ' + ctx.noAudio.length + ' 道：' + Array.from(new Set(ctx.noAudio)).join(' '));
  checkZidu(id, c);
}

/* 5. 字的读音（易错读音卡）：内容对象的 zidu = [[字, 拼音], …]（页面当作「这个字的读音」展示的每一处），
 *    字必须在 ziku/model-3500.json 里，拼音必须是该字「读音.拼音」之一（逗号分隔，NFC 比较）。不改字库主读音（TODO_STATUS Q6）。 */
let ZIKU = null;
function zikuReadings() {
  if (ZIKU) return ZIKU;
  ZIKU = new Map();
  const f = path.join(NH, 'ziku', 'model-3500.json');
  if (!fs.existsSync(f)) return ZIKU;
  JSON.parse(fs.readFileSync(f, 'utf8')).forEach((x) => {
    const r = ((x.dim || {})['读音'] || {})['拼音'] || '';
    ZIKU.set(x.zi, String(r).split(/[,，\s]+/).filter(Boolean).map((t) => t.normalize('NFC')));
  });
  return ZIKU;
}
function checkZidu(id, c) {
  if (c.zidu == null) return;
  if (!Array.isArray(c.zidu)) { E(id, 'zidu 应为 [[字, 拼音], …]'); return; }
  const R = zikuReadings();
  if (!R.size) { W(id, '找不到 ziku/model-3500.json，跳过读音核对'); return; }
  /* 「用」里的词语也逐字核对（轻声 / 无调音节跳过） */
  const all = c.zidu.slice();
  STAGES.forEach((st) => (c[st] || []).forEach((b) => { if (b && b.type === 'words') (b.items || []).forEach((it) => {
    const zs = String(it.w).match(/[\u3400-\u9fff]/g) || [], ps = pyTokens(it.py);
    if (zs.length === ps.length) zs.forEach((z, i) => { if (S.parse(ps[i]).tone !== 5 && R.has(z)) all.push([z, ps[i]]); /* 词里不在字库的字不核 */ });
  }); }));
  let n = 0;
  all.forEach((p) => {
    const z = p && p[0], py = String((p && p[1]) || '').normalize('NFC');
    if (!R.has(z)) { E(id + '.zidu', '「' + z + '」不在 3500 字库里'); return; }
    if (R.get(z).indexOf(py) < 0) { E(id + '.zidu', '「' + z + '」读 ' + py + '，字库只有 ' + R.get(z).join('/')); return; }
    n++;
  });
  console.log('  · 读音核对：' + n + ' / ' + all.length + ' 处在 3500 字库里（含「用」里的词语）');
}

function flushHudu(id) {
  if (HUDU_MISSING.size) W(id, '呼读音还没录（页面显示「待录音」）：' + Array.from(HUDU_MISSING).join(' '));
  HUDU_MISSING.clear();
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DIR = path.join(NH, 'pinyin', 'content');
const files = args.length ? args.map((a) => path.resolve(a))
  : (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /\.js$/.test(f)).sort().map((f) => path.join(DIR, f)) : []);
files.forEach((f) => { checkFile(f); flushHudu(path.basename(f, '.js')); });
console.log('拼音内容：检查了 ' + files.length + ' 个知识点文件，' + (errors ? errors + ' 处错误' : '全部通过') + (warns ? '，' + warns + ' 条提示' : ''));
process.exit(errors ? 1 : 0);
