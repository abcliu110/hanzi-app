#!/usr/bin/env node
/* 拼音音节校验（CI）：node newhanzi/tools/check_pinyin_syllables.js [--list]
 *
 * 1. 解析器自测：一组固定样例（省写还原、y/w、ü 省点、整体认读、标调位置、错拼）。
 * 2. 字库 3500 字（tools/fix_pinyin.py 用的同一批数据）：data/index.js 的 py、data/pinyin_lookup.js、
 *    data/zika/<字>.js 的 读音.拼音 + 读音.罕用读音，逐条用 pinyin/syllable.js 解析：
 *    必须能解析、音节在合法音节表里、调号位置符合 GB/T 16159-2012 6.5.1。
 *    已知问题记在 tools/pinyin_syllable_known.json（只登记，不改字库；人工复核后再改数据并从表里删掉）。
 *    新出现的问题 → 退出码 1；表里登记了但已经不存在的问题 → 也报错，提醒删表。
 * 3. 合法音节表 pinyin/syllables.js 与音频清单 pinyin/audio/index.js 一致（main 每个音节都有 1–4 声音频）。
 * --list 打印全部问题明细（含已知）。 */
const fs = require('fs'), path = require('path');
const NH = path.resolve(__dirname, '..');
const S = require(path.join(NH, 'pinyin', 'syllable.js'));
const TABLE = require(path.join(NH, 'pinyin', 'syllables.js'));
const KNOWN = JSON.parse(fs.readFileSync(path.join(__dirname, 'pinyin_syllable_known.json'), 'utf8')).issues || {};
const LIST = process.argv.includes('--list');
const fails = [];

/* 1. 自测 */
const CASES = [
  ['guì', { initial: 'g', final: 'uei', medial: 'u', nucleus: 'e', coda: 'i', tone: 4, ok: true }],
  ['qu4', { initial: 'q', final: 'ü', tone: 4, ok: true, audio: 'qu4' }],
  ['yǔ', { initial: '', final: 'ü', wholeRead: true, yw: 'y', ok: true }],
  ['yuán', { final: 'üan', medial: 'ü', wholeRead: true, ok: true }],
  ['liú', { final: 'iou', ok: true }], ['lùn', { final: 'uen', ok: true }], ['jūn', { final: 'ün', ok: true }],
  ['nǚ', { initial: 'n', final: 'ü', ok: true, audio: 'nv3' }], ['lüè', { final: 'üe', ok: true, audio: 'lve4' }],
  ['zhī', { initial: 'zh', final: '-i', wholeRead: true, ok: true }], ['wǒ', { final: 'uo', yw: 'w', wholeRead: false, ok: true }],
  ['yīng', { final: 'ing', wholeRead: true, ok: true }], ['xióng', { final: 'iong', hu: '撮口呼', ok: true }],
  ['ma', { tone: 5, ok: true }], ['huār', { erhua: true, final: 'ua', ok: true }], ['ér', { final: 'er', ok: true }],
  ['gúi', { ok: false, err: 'tone_position' }], ['lìu', { ok: false, err: 'tone_position' }], ['haǒ', { ok: false, err: 'tone_position' }],
  ['qǘ', { ok: false, err: 'spelling' }], ['lue', { ok: false, err: 'spelling' }], ['bia', { ok: false, err: 'not_legal' }],
  ['ma2a', { ok: false, err: 'chars' }]
];
for (const [inp, want] of CASES) {
  const r = S.parse(inp);
  for (const k of Object.keys(want)) {
    if (k === 'err') { if (!r.errors.some((e) => e.code === want.err)) fails.push(`自测 ${inp}: 应报 ${want.err}，实际 ${JSON.stringify(r.errors)}`); continue; }
    if (r[k] !== want[k]) fails.push(`自测 ${inp}: ${k} 应为 ${JSON.stringify(want[k])}，实际 ${JSON.stringify(r[k])}`);
  }
}
for (const t of [1, 2, 3, 4]) for (const w of ['gui', 'liu', 'xue', 'nü', 'yuan', 'er']) {
  const r = S.parse(S.mark(w, t));
  if (!r.ok || r.tone !== t) fails.push(`自测 mark(${w},${t}) → ${S.mark(w, t)} 解析不通过`);
}

/* 2. 字库 */
function loadVar(p) { const s = fs.readFileSync(p, 'utf8'); return JSON.parse(s.slice(s.indexOf('=') + 1).trim().replace(/;\s*$/, '')); }
const idx = loadVar(path.join(NH, 'data', 'index.js'));
const lk = loadVar(path.join(NH, 'data', 'pinyin_lookup.js'));
const found = {}; /* key = 字|读音 → {code,msg,where[]} */
let nRead = 0; const seen = new Set();
function check(z, py, where) {
  py = String(py || '').trim(); if (!py) return;
  nRead++; seen.add(py);
  const r = S.parse(py);
  if (r.ok) return;
  const key = z + '|' + py;
  if (!found[key]) found[key] = { z, py, errors: r.errors.map((e) => e.code + '：' + e.msg), where: [] };
  if (!found[key].where.includes(where)) found[key].where.push(where);
}
for (const e of idx) {
  const z = e.z;
  check(z, e.py, '索引');
  for (const x of String(lk[z] || '').split(',')) check(z, x, '查表');
  const rec = loadVar(path.join(NH, 'data', 'zika', z + '.js'));
  const du = (rec.dim || {})['读音'] || {};
  for (const x of String(du['拼音'] || '').split(',')) check(z, x, '字卡拼音');
  for (const x of String(du['罕用读音'] || '').split(',')) check(z, x, '字卡罕用');
}
const keys = Object.keys(found).sort();
const fresh = keys.filter((k) => !KNOWN[k]);
const gone = Object.keys(KNOWN).filter((k) => !found[k]);
for (const k of fresh) fails.push(`字库新问题 ${k}（${found[k].where.join('/')}）：${found[k].errors.join('；')}；人工复核后修数据，或登记进 tools/pinyin_syllable_known.json`);
for (const k of gone) fails.push(`字库已知问题 ${k} 已不存在，请从 tools/pinyin_syllable_known.json 删除`);
if (LIST) for (const k of keys) console.log(`${KNOWN[k] ? '[已知]' : '[新]'} ${k}（${found[k].where.join('/')}）${found[k].errors.join('；')}`);

/* 3. 合法音节表 ↔ 音频清单 */
const audSrc = fs.readFileSync(path.join(NH, 'pinyin', 'audio', 'index.js'), 'utf8');
const AUD = JSON.parse(audSrc.slice(audSrc.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
const audSyl = new Set(Object.keys(AUD.syl).map((s) => s.replace(/v/g, 'ü')));
for (const s of TABLE.main) {
  if (!audSyl.has(s)) fails.push(`合法音节 ${s} 没有音频`);
  else if (AUD.syl[s.replace(/ü/g, 'v')] !== '1234') fails.push(`合法音节 ${s} 音频声调不全：${AUD.syl[s.replace(/ü/g, 'v')]}`);
}
for (const s of audSyl) if (!TABLE.main.includes(s)) fails.push(`音频 ${s} 不在合法音节表 main 里`);
for (const s of TABLE.interj) if (TABLE.main.includes(s)) fails.push(`叹词音节 ${s} 同时在 main 里`);

for (const f of fails) console.error('✗ ' + f);
console.log(`拼音音节校验：解析器自测 ${CASES.length} 例；字库 3500 字读音 ${nRead} 条（去重 ${seen.size}），问题 ${keys.length} 条（已登记 ${keys.length - fresh.length}）；合法音节 ${TABLE.main.length}+叹词 ${TABLE.interj.length}` + (fails.length ? `；失败 ${fails.length}` : '；全部通过'));
process.exit(fails.length ? 1 : 0);
