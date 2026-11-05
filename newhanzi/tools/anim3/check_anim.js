#!/usr/bin/env node
/* 全站 anim-engine 图示扫描（字卡以外）：SVG <text> 不得含字体常缺字符（扩展区/私用区/部首补充…），
   标签必须配对。内容占位问题（“（）”空括号、“部首含义”、“多与相关”）只告警。
   用法：node tools/anim3/check_anim.js   有错误退出码 1 */
"use strict";
const fs = require("fs"), path = require("path");
const C = require("./common.js");
const FILES = ["newhanzi/data/shici.js", "newhanzi/data/guwen_knowledge.js", "newhanzi/yuwen/data.js",
  "newhanzi/bushou/data.js"];
const WARN = [/（）/, /^部首含义$/, /多与相关/];
let err = 0, warn = 0, n = 0;
for (const rel of FILES) {
  const f = path.join(C.ROOT, rel);
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, "utf8").replace(/\\"/g, '"').replace(/\\\//g, "/");
  const svgs = s.match(/<svg[\s\S]*?<\/svg>/g) || [];
  const w = {};
  for (const svg of svgs) {
    n++;
    if (!C.xmlBalanced(svg)) { err++; console.error(`✗ ${rel}：SVG 标签不配对：${svg.slice(0, 80)}`); }
    for (const t of C.svgTexts(svg)) {
      const bad = [...t].filter(C.isBannedChar);
      if (bad.length) { err++; console.error(`✗ ${rel}：含字体常缺字符 ${bad.join("")}（“${t}”）`); }
      for (const re of WARN) if (re.test(t)) w[re.source] = (w[re.source] || 0) + 1;
    }
  }
  for (const [k, v] of Object.entries(w)) { warn += v; console.warn(`⚠ ${rel}：${v} 处内容占位 /${k}/`); }
}
console.log(`check_anim: ${n} 个图示，错误 ${err}，告警 ${warn}`);
if (err) process.exitCode = 1;
