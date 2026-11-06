#!/usr/bin/env node
/* 语法检查：所有 HTML 里的内联 <script>（相当于逐段 node --check）和根目录 .js 文件。
   运行：node tools/check_scripts.js */
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set(["node_modules", ".git", "test-results", "playwright-report"]);
function walk(d, out = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (f.name !== "data") walk(p, out); } else out.push(p);
  }
  return out;
}
let n = 0, bad = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (file.endsWith(".html")) {
    const html = fs.readFileSync(file, "utf8");
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m;
    while ((m = re.exec(html))) {
      const attrs = m[1], code = m[2];
      if (/\bsrc=/.test(attrs) || !code.trim()) continue;
      const type = (attrs.match(/type=["']?([^"'\s>]+)/) || [])[1];
      const line = html.slice(0, m.index).split("\n").length;
      n++;
      if (type === "application/json") {
        try { JSON.parse(code); } catch (e) { bad++; console.error(`${rel}:${line} JSON 错误：${e.message}`); }
        continue;
      }
      if (type && !/javascript|module/.test(type)) continue;
      try { new vm.Script(code, { filename: `${rel}:${line}` }); }
      catch (e) { bad++; console.error(`${rel}:${line} 语法错误：${e.message}`); }
    }
  } else if (/\.js$/.test(file) && !rel.startsWith("data")) {
    n++;
    try { execFileSync(process.execPath, ["--check", file], { stdio: "pipe" }); }
    catch (e) { bad++; console.error(`${rel}: ${String(e.stderr || e.message).trim()}`); }
  }
}
console.log(`检查了 ${n} 段脚本，${bad ? bad + " 处错误" : "全部通过"}`);
/* 内容校验（古诗/赏析/年级表/古文分级）：tools/content/check_content.js */
try { process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, "content", "check_content.js")], { encoding: "utf8" })); }
catch (e) { bad++; console.error(String(e.stdout || "") + String(e.stderr || e.message)); }
/* 语法白板内容稿校验：tools/content/check_yufa_neirong.js */
try { process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, "content", "check_yufa_neirong.js")], { encoding: "utf8" })); }
catch (e) { bad++; console.error(String(e.stdout || "") + String(e.stderr || e.message)); }
/* 拼音音节：解析器自测 + 3500 字读音可解析/标调位置 + 合法音节表与音频一致：tools/check_pinyin_syllables.js */
try { process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, "check_pinyin_syllables.js")], { encoding: "utf8" })); }
catch (e) { bad++; console.error(String(e.stdout || "") + String(e.stderr || e.message)); }
/* 拼音音频清单与 pinyin/audio/ 目录一致：tools/gen_pinyin_audio.py --check */
try { process.stdout.write(execFileSync("python3", [path.join(__dirname, "gen_pinyin_audio.py"), "--check"], { encoding: "utf8" })); }
catch (e) { bad++; console.error(String(e.stdout || "") + String(e.stderr || e.message)); }
process.exit(bad ? 1 : 0);
