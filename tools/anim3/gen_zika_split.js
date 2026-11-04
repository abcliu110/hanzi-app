#!/usr/bin/env node
/* 字卡“拆合”动画（anim-engine split）生成脚本 —— 可重跑
 *
 * 数据流：
 *   zika_split_spec.json   每个字的部件、位移、颜色、标注（人工可改；最初由 bootstrap 从
 *                          ecbd4d5f / e9c7036f 生成的 SVG 反解出来）
 *   mmah_subset.json       makemeahanzi dictionary.txt 的子集（decomposition + matches），
 *                          用来找出“不能用文字显示的部件”对应本字的哪几笔
 *   newhanzi/data/zika/<字>.js 的 笔顺.strokes   本字笔画轮廓（hanzi-writer-data）
 *   -> newhanzi/anim-engine.js split({whole: 字, parts}) -> 写回 <字>.js 的 "图示" 字段
 *
 * 规则：
 *   - 开头和结尾的整字 = 字卡字本身（不是部件拼接）。
 *   - 部件含 CJK 扩展区/私用区/部首补充等字体常缺的字符（龸 𠃌 𫥞 𧾷 …），或是数据占位符
 *     （◇ ④ ②），不输出文字，改用本字对应笔画的轮廓画出来。
 *
 * 用法（仓库根目录）：
 *   node tools/anim3/gen_zika_split.js build   重新生成全部拆合动画并写回
 *   node tools/anim3/gen_zika_split.js check   只校验（整字==字卡字、无扩展区字符、无占位符、XML 良构、
 *                                              与按 spec 重新生成的结果一致）；有问题退出码 1
 *   node tools/anim3/gen_zika_split.js bootstrap  （一次性）从现有 SVG 反解 spec，已执行过，一般不用再跑
 */
"use strict";
const fs = require("fs"), path = require("path");
const C = require("./common.js");
const AnimEngine = require(path.join(C.ROOT, "newhanzi/anim-engine.js"));
const SPEC = path.join(__dirname, "zika_split_spec.json");
const MMAH = path.join(__dirname, "mmah_subset.json");

const IDS_OPS = { "⿰": 2, "⿱": 2, "⿲": 3, "⿳": 3, "⿴": 2, "⿵": 2, "⿶": 2, "⿷": 2, "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2 };
function topComponents(dec) {
  const chars = [...dec];
  function parse(i) {
    const n = IDS_OPS[chars[i]];
    if (!n) return i + 1;
    let j = i + 1; for (let k = 0; k < n; k++) j = parse(j); return j;
  }
  const n = IDS_OPS[chars[0]];
  if (!n) return [dec];
  const out = []; let j = 1;
  for (let k = 0; k < n; k++) { const e = parse(j); out.push(chars.slice(j, e).join("")); j = e; }
  return out;
}

// 笔画中线 -> 范围（加 40 作笔画半宽）
function bboxOf(medians, idx) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const k of idx) for (const [x, y] of medians[k]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0 - 40, y0 - 40, x1 + 40, y1 + 40];
}

// 给需要画图的部件找笔画编号
function strokeIndexFor(zi, parts, i, mm, nStrokes) {
  if (parts[i].strokes_idx) return parts[i].strokes_idx;          // spec 人工指定
  const m = mm[zi];
  if (!m) throw new Error(`${zi}：makemeahanzi 无此字，请在 spec 里给 strokes_idx`);
  if (m.matches.length !== nStrokes) throw new Error(`${zi}：笔画数不一致 mmah ${m.matches.length} vs 字卡 ${nStrokes}`);
  const top = topComponents(m.decomposition);
  if (top.length !== parts.length) throw new Error(`${zi}：部件数不一致 ${m.decomposition} vs ${parts.map(p => p.text).join("")}，请在 spec 里给 strokes_idx`);
  const idx = [];
  m.matches.forEach((mt, k) => { if (mt && mt[0] === i) idx.push(k); });
  const gNeed = parts.filter(p => C.needsGraphic(p.text)).length;
  if (gNeed === 1) m.matches.forEach((mt, k) => { if (!mt) idx.push(k); }); // 未匹配的笔画归给唯一的“缺字”部件
  if (!idx.length) throw new Error(`${zi}：部件 ${parts[i].text} 找不到笔画，请在 spec 里给 strokes_idx`);
  return idx.sort((a, b) => a - b);
}

function compileOne(zi, spec, mm, rec) {
  const bs = rec.obj.dim["笔顺"];
  const parts = spec.parts.map((p, i) => {
    const q = { text: p.text, color: p.color, dx: p.dx, dy: p.dy };
    if (p.label) q.label = p.label;
    if (C.needsGraphic(p.text)) {
      if (!bs || !bs.strokes) throw new Error(`${zi}：无笔顺数据，无法画部件 ${p.text}`);
      const idx = strokeIndexFor(zi, spec.parts, i, mm, bs.strokes.length);
      q.strokes = idx.map(k => bs.strokes[k]);
      q.bbox = bboxOf(bs.medians, idx);
    }
    return q;
  });
  return AnimEngine.split({ whole: zi, parts, centerX: spec.centerX || 320, centerY: spec.centerY });
}

function validate(zi, svg) {
  const errs = [];
  const full = (svg.match(/id="fullChar">([^<]*)</) || [])[1];
  if (full !== zi) errs.push(`开头整字为“${full}”`);
  const texts = C.svgTexts(svg);
  const last = texts[texts.length - 1];
  if (last !== zi) errs.push(`结尾整字为“${last}”`);
  for (const t of texts) {
    const bad = [...t].filter(C.isBannedChar);
    if (bad.length) errs.push(`含字体常缺字符 ${bad.join("")}（“${t}”）`);
    if (C.PLACEHOLDER.test(t)) errs.push(`含占位符（“${t}”）`);
  }
  if (!C.xmlBalanced(svg)) errs.push("XML 标签不配对");
  return errs;
}

function bootstrap() {
  const spec = {};
  for (const zi of C.listZika()) {
    const svg = C.readZika(zi).obj["图示"];
    if (!svg || !svg.includes('id="fullChar"')) continue;
    const cy = +svg.match(/<text x="(\d+)" y="(\d+)"[^>]*id="fullChar"/)[2];
    const parts = [];
    const re = /<g opacity="0">(.*?)<\/g>(?=<g opacity="0">|<text x="\d+" y="\d+" text-anchor="middle" font-size="48")/g; let m;
    while ((m = re.exec(svg))) {
      const g = m[1];
      const pm = g.match(/font-size="36" fill="([^"]+)">([^<]*)<animateTransform[^>]*values="0,0;([-\d.]+),([-\d.]+)"/);
      const lm = g.match(/font-size="13" fill="[^"]+">([^<]*)</);
      const p = { text: pm[2], color: pm[1], dx: +pm[3], dy: +pm[4] };
      // 标注若只是占位符/扩展区部件本身，没有信息量，丢掉
      if (lm && !C.needsGraphic(lm[1])) p.label = lm[1];
      parts.push(p);
    }
    spec[zi] = { centerY: cy, parts };
  }
  fs.writeFileSync(SPEC, JSON.stringify(spec, null, 1) + "\n");
  console.log("spec 写入", Object.keys(spec).length, "字");
}

function main() {
  const cmd = process.argv[2] || "check";
  if (cmd === "bootstrap") return bootstrap();
  const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"));
  const mm = JSON.parse(fs.readFileSync(MMAH, "utf8"));
  let n = 0, changed = 0, bad = 0, graphic = 0;
  for (const zi of Object.keys(spec)) {
    const rec = C.readZika(zi);
    let svg;
    try { svg = compileOne(zi, spec[zi], mm, rec); }
    catch (e) { bad++; console.error("✗", e.message); continue; }
    n++; if (svg.includes("<path")) graphic++;
    const errs = validate(zi, svg);
    if (errs.length) { bad++; console.error(`✗ ${zi}：${errs.join("；")}`); continue; }
    if (rec.obj["图示"] !== svg) {
      if (cmd === "build") { C.replaceTushi(rec, svg); changed++; }
      else { bad++; console.error(`✗ ${zi}：图示与 spec 生成结果不一致（请跑 build）`); }
    }
  }
  // spec 之外不应再有 split 动画
  for (const zi of C.listZika()) {
    const svg = C.readZika(zi).obj["图示"];
    if (svg && svg.includes('id="fullChar"') && !spec[zi]) { bad++; console.error(`✗ ${zi}：拆合动画不在 spec 里`); }
  }
  console.log(`${cmd}: ${n} 个拆合动画，其中 ${graphic} 个含笔画图形部件；写回 ${changed}；问题 ${bad}`);
  if (bad) process.exitCode = 1;
}
main();
