#!/usr/bin/env node
/* 语法白板内容稿校验：docs/yufa-neirong/*.json（规范见 docs/yufa-neirong/README.md）
   检查：
   1. 字段齐全（条目：id/group/title.term/title.kid/core/tpl/scenes/pitfalls/status；幕：lv/k/tab/say/act）
   2. 新增条目的幕构成：L1 1 幕、L2 2–4 幕、L3 1 幕、回练 1 幕（k:'review'，huilian:true）
   3. L3 幕必须有 src（允许写“待核……”，但会列入待核清单）
   4. 错句必须在同一幕内给出改正：ex 里 ok:false 必须带 fix；review 幕 ok:false 必须带 good
   5. id 不与现有 99 项（newhanzi/wb/index.js 的场景 id，除本次新增 50 项外——它们已上线进
      index.js，只防与其它场景 id 撞车）重复，标题不与现有 99 项名称重复，id 全局唯一
   6. l3-huilian.json：名称必须是现有 99 项之一、不重复；每项 1 幕 L3（带 src）+ 1 幕回练
   运行：node tools/content/check_yufa_neirong.js [--list-daihe]（tools/check_scripts.js 会调用） */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "docs", "yufa-neirong");
const args = process.argv.slice(2);
const errs = [], warns = [], daihe = [];
const err = (m) => errs.push(m), warn = (m) => warns.push(m);

/* 现有 99 项：名称 -> 场景 id */
function loadWindow(file, key) {
  const sandbox = { window: {} };
  new Function("window", fs.readFileSync(path.join(ROOT, file), "utf8"))(sandbox.window);
  return sandbox.window[key];
}
const WB = loadWindow("wb/index.js", "NHZ_WB_INDEX") || {};
const YW = loadWindow("yuwen/data.js", "NHZ_YUWEN") || {};
const OLD_NAMES = new Set();
for (const c of (YW.grammar && YW.grammar.categories) || []) for (const it of c.items) OLD_NAMES.add(it.name);
/* 本次新增 50 项的 id：场景已上线进 index.js，校验“现有”时先排除，只防与其它场景 id 撞车 */
const NEW_IDS = new Set();
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json") && !x.startsWith("l3-huilian")).sort()) {
  try {
    const J = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    if (Array.isArray(J.items)) for (const it of J.items) if (it && it.id) NEW_IDS.add(it.id);
  } catch (e) { /* 解析失败由主循环报错，这里跳过 */ }
}
const OLD_IDS = new Set(Object.values(WB).filter((id) => !NEW_IDS.has(id)));
if (OLD_NAMES.size !== 99) warn(`现有语法项不是 99 个，而是 ${OLD_NAMES.size} 个（data.js）`);

const TPL = new Set(["title", "cards", "test", "mark", "vs", "slots", "fix", "link", "rel", "steps", "line", "end",
  "trunk", "morph", "nest", "valence", "review"]);
const nonEmptyStr = (v) => typeof v === "string" && v.trim().length > 0;
const nonEmptyArr = (v) => Array.isArray(v) && v.length > 0 && v.every(nonEmptyStr);

function checkScene(sc, tag) {
  if (!sc || typeof sc !== "object") return err(`${tag}：幕不是对象`);
  if (![1, 2, 3].includes(sc.lv)) err(`${tag}：lv 只能是 1/2/3`);
  if (!TPL.has(sc.k)) err(`${tag}：模板 k="${sc.k}" 不在允许列表`);
  if (!nonEmptyStr(sc.tab)) err(`${tag}：缺 tab（幕标签）`);
  if (!nonEmptyArr(sc.say)) err(`${tag}：缺 say（旁白，字符串数组）`);
  if (!nonEmptyArr(sc.act)) err(`${tag}：缺 act（画面动作要点，字符串数组）`);
  if (sc.lv === 3) {
    if (!nonEmptyStr(sc.src)) err(`${tag}：L3 幕必须有 src`);
    else if (/待核/.test(sc.src)) daihe.push(`${tag}：${sc.src}`);
  }
  if (sc.ex !== undefined) {
    if (!Array.isArray(sc.ex) || !sc.ex.length) err(`${tag}：ex 必须是非空数组`);
    else sc.ex.forEach((e, i) => {
      const t = `${tag} ex[${i}]`;
      if (!e || !nonEmptyStr(e.s)) return err(`${t}：缺 s（例句）`);
      if (e.ok === false) {
        if (!nonEmptyStr(e.fix)) err(`${t}：错句「${e.s}」没有在同一幕给出改正（fix）`);
        else if (e.fix.trim() === e.s.trim()) err(`${t}：fix 与原句相同`);
      }
      if (e.ok !== undefined && typeof e.ok !== "boolean") err(`${t}：ok 必须是布尔值`);
      if (e.is !== undefined && typeof e.is !== "boolean") err(`${t}：is 必须是布尔值`);
    });
  }
  if (sc.k === "review") {
    if (sc.huilian !== true) err(`${tag}：review 幕要写 huilian:true`);
    for (const f of ["task", "answer", "rule"]) if (!nonEmptyStr(sc[f])) err(`${tag}：回练幕缺 ${f}`);
    if (typeof sc.ok !== "boolean") err(`${tag}：回练幕缺 ok（同学答案对不对）`);
    if (sc.ok === false && !nonEmptyStr(sc.good)) err(`${tag}：回练答案判错，但同一幕没给出正确答案（good）`);
  } else if (sc.huilian) err(`${tag}：huilian:true 只能用于 k:'review'`);
}

const ids = new Map(), titles = new Map();
let nItems = 0, nScenes = 0, nL3 = 0;
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort() : [];
if (!files.length) warn("docs/yufa-neirong/ 下没有 JSON 内容稿");

for (const f of files) {
  let J;
  try { J = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); }
  catch (e) { err(`${f}：JSON 解析失败：${e.message}`); continue; }
  if (f.startsWith("l3-huilian")) { checkL3(J, f); continue; }
  if (!nonEmptyStr(J.group) || !Array.isArray(J.items)) { err(`${f}：顶层要有 group 和 items[]`); continue; }
  for (const it of J.items) {
    const tag = `${f} ${it && it.id}`;
    nItems++;
    if (!it || !/^[a-z][a-z0-9_]*$/.test(it.id || "")) { err(`${tag}：id 缺失或格式不对（小写字母数字下划线）`); continue; }
    if (ids.has(it.id)) err(`${tag}：id 与 ${ids.get(it.id)} 重复`); ids.set(it.id, f);
    if (OLD_IDS.has(it.id)) err(`${tag}：id 与现有 99 项的场景 id 重复`);
    if (it.group !== J.group) err(`${tag}：group「${it.group}」与文件组别「${J.group}」不一致`);
    const T = it.title || {};
    if (!nonEmptyStr(T.term) || !nonEmptyStr(T.kid)) err(`${tag}：title 要有 term（术语）和 kid（儿童名）`);
    else {
      if (OLD_NAMES.has(T.term)) err(`${tag}：标题「${T.term}」与现有 99 项重复`);
      if (titles.has(T.term)) err(`${tag}：标题「${T.term}」与 ${titles.get(T.term)} 重复`); titles.set(T.term, it.id);
    }
    if (!nonEmptyStr(it.core)) err(`${tag}：缺 core（一句话核心）`);
    if (!nonEmptyArr(it.tpl) || it.tpl.some((t) => !TPL.has(t))) err(`${tag}：tpl 缺失或含未知模板`);
    if (!nonEmptyArr(it.pitfalls)) err(`${tag}：缺 pitfalls（易错点）`);
    if (it.status !== "草稿") err(`${tag}：status 应为「草稿」`);
    if (it.rel !== undefined && (!Array.isArray(it.rel) || it.rel.some((n) => !OLD_NAMES.has(n))))
      err(`${tag}：rel 里有不是现有 99 项的名称`);
    if (!Array.isArray(it.scenes)) { err(`${tag}：缺 scenes`); continue; }
    let l1 = 0, l2 = 0, l3 = 0, hl = 0;
    it.scenes.forEach((sc, i) => {
      nScenes++;
      checkScene(sc, `${tag} 幕${i + 1}`);
      if (sc && sc.huilian) hl++; else if (sc && sc.lv === 1) l1++; else if (sc && sc.lv === 2) l2++; else if (sc && sc.lv === 3) l3++;
    });
    if (l1 !== 1) err(`${tag}：L1 应为 1 幕，现为 ${l1}`);
    if (l2 < 2 || l2 > 4) err(`${tag}：L2 应为 2–4 幕，现为 ${l2}`);
    if (l3 !== 1) err(`${tag}：L3 应为 1 幕，现为 ${l3}`);
    if (hl !== 1) err(`${tag}：回练应为 1 幕，现为 ${hl}`);
  }
}

function checkL3(J, f) {
  if (!J || typeof J.items !== "object") return err(`${f}：顶层要有 items（名称 -> {l3, huilian}）`);
  for (const [name, v] of Object.entries(J.items)) {
    const tag = `${f}「${name}」`;
    if (!OLD_NAMES.has(name)) { err(`${tag}：不是现有 99 项之一`); continue; }
    nL3++;
    if (!v || !v.l3 || !v.huilian) { err(`${tag}：要有 l3 和 huilian 两幕`); continue; }
    if (v.l3.lv !== 3) err(`${tag} L3：lv 应为 3`);
    checkScene(v.l3, `${tag} L3`);
    if (v.huilian.k !== "review") err(`${tag} 回练：k 应为 review`);
    checkScene(v.huilian, `${tag} 回练`);
  }
  if (J.complete === true && nL3 !== OLD_NAMES.size) err(`${f}：标为 complete，但只覆盖 ${nL3}/${OLD_NAMES.size} 项`);
  const miss = [...OLD_NAMES].filter((n) => !(n in J.items));
  if (miss.length) warn(`${f}：还有 ${miss.length} 项未补写 L3/回练`);
}

for (const w of warns) console.log(`警告：${w}`);
if (args.includes("--list-daihe")) for (const d of daihe) console.log(`待核：${d}`);
for (const e of errs) console.error(`错误：${e}`);
console.log(`语法内容稿：${files.length} 个文件，新增条目 ${nItems} 项 / ${nScenes} 幕，补写 L3+回练 ${nL3} 项，src 待核 ${daihe.length} 处；${errs.length ? errs.length + " 处错误" : "全部通过"}`);
process.exit(errs.length ? 1 : 0);
