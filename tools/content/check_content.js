#!/usr/bin/env node
/* 内容校验：古诗词库 / 赏析 / 诗句索引 / 年级表 / 古文知识。
   规则：全角标点、正文无括号注释、无异体旧字形（tools/content/variants.json）、无重复标题、引用完整、课内篇目带年级与来源。
   运行：node tools/content/check_content.js（tools/check_scripts.js 末尾会调用） */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const D = path.join(ROOT, "newhanzi", "data");
global.window = {};
for (const f of ["shici.js", "shangxi.js", "shiju.js", "grade_map.js", "guwen_knowledge.js"]) {
  const p = path.join(D, f);
  if (fs.existsSync(p)) eval(fs.readFileSync(p, "utf8"));
}
const VAR = JSON.parse(fs.readFileSync(path.join(__dirname, "variants.json"), "utf8"));
const errs = [];
const err = (m) => errs.push(m);
const CE = ["1上", "1下", "2上", "2下", "3上", "3下", "4上", "4下", "5上", "5下", "6上", "6下"];
const hz = (s) => s.replace(/[^\u3400-\u9fff\u{20000}-\u{2ffff}]/gu, "");

function variantHits(s) {
  const hits = [];
  for (const [a, b] of VAR.phrase) if (s.includes(a)) hits.push(a + "→" + b);
  for (const [a, b] of VAR.char) if (s.includes(a)) hits.push(a + "→" + b);
  let t = s; for (const w of VAR.shen.allow) t = t.split(w).join("");
  if (t.includes(VAR.shen.from)) hits.push(VAR.shen.from + "→" + VAR.shen.to);
  return hits;
}
const ASCII_P = /[,.;:?!()\[\]"']/;
const BRACKET = /[（）()\[\]【】《》〔〕]|一作|校勘|刊本/;
const END = /[，。？！；：、][”’」]?$/;
const isCi = (p) => p.ticai === "宋词" || p.ticai === "词" || /^(忆江南|渔歌子|清平乐|西江月|卜算子|浣溪沙)/.test(p.title);

const S = window.NHZ_SHICI;
if (!S || !Array.isArray(S.poems)) err("shici.js：没有 NHZ_SHICI.poems");
else {
  const seenTA = new Map(), seenFirst = new Map(), seenOrder = new Set(), seenId = new Set();
  for (const p of S.poems) {
    const tag = `shici #${p.order}《${p.title}》`;
    if (seenOrder.has(p.order)) err(`${tag}：order 重复`); seenOrder.add(p.order);
    if (seenId.has(p.id)) err(`${tag}：id 重复`); seenId.add(p.id);
    const ta = p.title + "|" + p.author;
    if (seenTA.has(ta)) err(`${tag}：标题重复（与 #${seenTA.get(ta)}）`); else seenTA.set(ta, p.order);
    const fa = hz(p.lines[0] || "") + "|" + p.author;
    if (seenFirst.has(fa)) err(`${tag}：与 #${seenFirst.get(fa)} 首句相同，疑似重复收录`); else seenFirst.set(fa, p.order);
    if (ASCII_P.test(p.title)) err(`${tag}：标题含半角标点`);
    if (/[”“]|\s[一二三四五六七八九十]+$/.test(p.title)) err(`${tag}：标题残留引号或“二首 一”式编号`);
    for (const h of variantHits(p.title)) err(`${tag}：标题含异体/旧字形 ${h}`);
    if (!p.lines.length) err(`${tag}：正文为空`);
    p.lines.forEach((l, i) => {
      if (ASCII_P.test(l)) err(`${tag} 第${i + 1}句：含半角标点「${l}」`);
      if (BRACKET.test(l)) err(`${tag} 第${i + 1}句：含括号/书名号注释「${l}」`);
      if (!END.test(l)) err(`${tag} 第${i + 1}句：句末缺全角标点「${l}」`);
      for (const h of variantHits(l)) err(`${tag} 第${i + 1}句：含异体/旧字形 ${h}「${l}」`);
    });
    if (!isCi(p) && p.lines.length >= 4 && p.lines.every((l) => /。$/.test(l))) err(`${tag}：每句都是“。”，逗号未恢复`);
    if (p.ke !== "课内" && p.ke !== "拓展") err(`${tag}：缺 ke（课内/拓展）`);
    if (p.ke === "课内") {
      if (!CE.includes(p.ce)) err(`${tag}：课内篇目缺有效册次 ce`);
      if (!/^(1-2|3-4|5-6)$/.test(p.grade || "")) err(`${tag}：课内篇目缺 grade`);
      if (!p.src || !p.check || !p.ceBasis) err(`${tag}：课内篇目缺来源/核对/册次依据字段`);
    }
  }
  const orders = new Set(S.poems.map((p) => p.order));
  (S.famous || []).forEach((f, i) => {
    if (f.order && !orders.has(f.order)) err(`famous[${i}]：引用不存在的诗 #${f.order}`);
    const p = S.poems.find((q) => q.order === f.order);
    if (p && f.title !== p.title) err(`famous[${i}]：标题「${f.title}」与诗库「${p.title}」不一致`);
    for (const h of variantHits(f.line || "")) err(`famous[${i}]：名句含异体 ${h}`);
  });
  (S.imagery || []).forEach((g) => g.poems.forEach((o) => { if (!orders.has(o)) err(`imagery「${g.zi}」：引用不存在的诗 #${o}`); }));
  const SJ = window.NHZ_SHIJU;
  if (SJ) {
    for (const k of Object.keys(SJ.meta || {})) if (!orders.has(+k)) err(`shiju.meta：不存在的诗 #${k}`);
    for (const o of orders) if (!(SJ.meta || {})[String(o)]) err(`shiju.meta：缺诗 #${o}`);
    for (const [z, os] of Object.entries(SJ.idx || {})) for (const o of os) if (!orders.has(o)) { err(`shiju.idx「${z}」：引用不存在的诗 #${o}`); break; }
  }
  const SX = window.NHZ_SHANGXI || [];
  const sxSeen = new Set();
  SX.forEach((x, i) => {
    const key = x.t + "|" + x.a;
    if (sxSeen.has(key)) err(`shangxi[${i}]《${x.t}》：重复`); sxSeen.add(key);
    if (!S.poems.some((p) => p.title === x.t && p.author === x.a)) err(`shangxi[${i}]《${x.t}》：诗库里没有这首（标题/作者对不上）`);
    for (const h of variantHits(x.t + (x.zj || []).join(""))) { err(`shangxi[${i}]《${x.t}》：含异体 ${h}`); break; }
  });
}

const GM = window.NHZ_GRADE_MAP;
if (GM) for (const [z, v] of Object.entries(GM)) if (!CE.includes(v)) { err(`grade_map「${z}」：册次值「${v}」不在 12 册内`); break; }

const GK = window.NHZ_GUWEN_KNOWLEDGE;
if (GK && GK.categories) {
  for (const c of GK.categories) for (const it of c.items || []) {
    if (!["小学", "初中", "高中", "初高中拓展"].includes(it.level)) { err(`guwen_knowledge「${c.name}/${it.name}」：缺 level（小学/初高中拓展）`); }
  }
}

/* 字卡讲解（dim.字源.讲解）：不许占位套话、抓取截断、混入英文义项（见 docs/xiufu/zika-jiangjie.md） */
let zjN = 0;
const ZD = path.join(D, "zika");
if (fs.existsSync(ZD)) for (const f of fs.readdirSync(ZD)) {
  if (!f.endsWith(".js")) continue;
  const s = fs.readFileSync(path.join(ZD, f), "utf8");
  const k = JSON.parse(s.slice(s.indexOf("{")).trim().replace(/;$/, ""));
  const t = ((k.dim || {})["字源"] || {})["讲解"];
  if (!t) continue;
  zjN++;
  const tag = `字卡讲解「${k.zi}」：`;
  if (/是一个常用汉字|很快就记牢了|多组词、多造句/.test(t)) err(tag + "占位/模板套话");
  if (/由'[^']*\(/.test(t) || /\(\s*[a-zāáǎàēéěèīíǐìōóǒòūúǔù]+$/.test(t.replace(/（来源[^）]*）$/, ""))) err(tag + "疑似抓取截断");
  for (const [a, b] of [["“", "”"], ["（", "）"], ["(", ")"]]) if (t.split(a).length !== t.split(b).length) err(tag + `${a}${b} 不配对`);
  const en = (t.match(/[a-z]{4,}/g) || []).filter((w) => !["beer"].includes(w));
  if (en.length) err(tag + "混入英文：" + en.join(","));
}

if (errs.length) {
  console.error(errs.slice(0, 80).join("\n"));
  if (errs.length > 80) console.error(`……共 ${errs.length} 处`);
  console.error(`内容校验：${errs.length} 处问题`);
  process.exit(1);
}
console.log(`内容校验通过：古诗 ${S.poems.length} 首（课内 ${S.poems.filter((p) => p.ke === "课内").length}）、赏析 ${(window.NHZ_SHANGXI || []).length} 条、年级表 ${Object.keys(GM || {}).length} 字、字卡讲解 ${zjN} 条`);
