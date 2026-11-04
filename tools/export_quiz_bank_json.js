#!/usr/bin/env node
/* 题库 .js 是唯一数据源（运行时用 <script> 加载，file:// 可用）。
   2026-11-04 起仓库不再保存重复的 quiz_bank_*.json（逐个核对过与 .js 内容完全一致后删除）。
   需要 JSON（批量审题、外部工具）时用本脚本从 .js 导出，输出到 newhanzi 外的目录，避免被发布：
     node tools/export_quiz_bank_json.js [输出目录，默认 build/quiz_bank_json]
   导出格式与原 json 相同：
     yuwen/quiz_bank_X.json  = 单个知识点对象 {point,total,types,questions}
     guwen/quiz_bank_X.json  = {module, points:{点名:{...}}}                      */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', 'newhanzi');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'build', 'quiz_bank_json'));
let n = 0;
for (const dir of ['yuwen', 'guwen']) {
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (!/^quiz_bank_.*\.js$/.test(f) || f === 'quiz_bank_index.js') continue;
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, dir, f), 'utf8'), ctx);
    const banks = Object.values(ctx.window)[0];
    let obj;
    if (dir === 'yuwen') obj = Object.values(banks)[0];
    else obj = { module: f.replace(/^quiz_bank_guwen_|\.js$/g, ''), points: banks };
    fs.writeFileSync(path.join(OUT, dir, f.replace(/\.js$/, '.json')), JSON.stringify(obj, null, 1));
    n++;
  }
}
console.log(`导出 ${n} 个题库 json 到 ${OUT}`);
