// tools/anim3 公共函数：读写 newhanzi/data/zika/<字>.js、字符合规判断
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const ZIKA_DIR = path.join(ROOT, "data/zika");

// 读 window.NHZ_ZIKA = {...}; 返回 {text, obj}
function readZika(zi) {
  const file = path.join(ZIKA_DIR, zi + ".js");
  const text = fs.readFileSync(file, "utf8");
  const i = text.indexOf("=");
  const obj = JSON.parse(text.slice(i + 1).trim().replace(/;\s*$/, ""));
  return { file, text, obj };
}
function listZika() {
  return fs.readdirSync(ZIKA_DIR).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)).sort();
}
// 只替换 "图示" 字段的值，文件其余字节保持不变（有的文件是 ", " 分隔，有的是 ","）
function replaceTushi(rec, newSvg) {
  const oldEnc = JSON.stringify(rec.obj["图示"]);
  const first = rec.text.indexOf(oldEnc);
  if (first < 0 || rec.text.indexOf(oldEnc, first + 1) >= 0) throw new Error(rec.obj.zi + "：图示字段定位失败");
  const out = rec.text.slice(0, first) + JSON.stringify(newSvg) + rec.text.slice(first + oldEnc.length);
  fs.writeFileSync(rec.file, out);
}

// 手机/老平板字体大多不含的字符：CJK 扩展 A/B+、URO 尾部新增字(U+9FA6–9FFF，如 龸)、
// 私用区、部首补充/康熙部首、CJK 笔画、兼容汉字。表情符号(U+1F000+)不算。
function isBannedChar(ch) {
  const o = ch.codePointAt(0);
  return (o >= 0x20000 && o <= 0x3ffff) || (o >= 0x3400 && o <= 0x4dbf) ||
    (o >= 0x9fa6 && o <= 0x9fff) || (o >= 0xe000 && o <= 0xf8ff) || (o >= 0xf0000) ||
    (o >= 0x2e80 && o <= 0x2fdf) || (o >= 0x31c0 && o <= 0x31ef) || (o >= 0xf900 && o <= 0xfaff);
}
// 数据里的“部件待补”占位符
const PLACEHOLDER = /[◇④②③①□？?]/;
function needsGraphic(text) {
  return [...text].some(isBannedChar) || PLACEHOLDER.test(text);
}
// 取 SVG 里所有 <text> 的文字
function svgTexts(svg) {
  const out = []; const re = /<text\b[^>]*>([^<]*)/g; let m;
  while ((m = re.exec(svg))) out.push(m[1]);
  return out;
}
// 极简 XML 良构检查（标签配对）
function xmlBalanced(svg) {
  const stack = []; const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g; let m;
  while ((m = re.exec(svg))) {
    if (m[4] === "/") continue;
    if (m[1]) { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]);
  }
  return stack.length === 0;
}
module.exports = { ROOT, ZIKA_DIR, readZika, listZika, replaceTushi, isBannedChar, PLACEHOLDER, needsGraphic, svgTexts, xmlBalanced };
