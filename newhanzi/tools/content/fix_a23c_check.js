// A23C 误解标注自检：node tools/content/fix_a23c_check.js
// 查：选项字母↔选项文本一致、不标在正确项上、判断题口径（a=true→A/错误，a=false→B/正确）、误解非空；
// 并统计各题库各题型「带选项的题」标注覆盖（choice 为 MASTER_PLAN 577 口径）。
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'quiz');
let bad = 0;
const files = fs.readdirSync(dir).filter(f => /^data_.*\.js$/.test(f));
for (const f of files) {
  const w = {}; new Function('window', fs.readFileSync(path.join(dir, f), 'utf8'))(w);
  const Q = w.NHZ_QUIZ; if (!Q || !Q.modes) continue;
  const cov = [];
  for (const [m, arr] of Object.entries(Q.modes)) {
    if (!Array.isArray(arr)) continue;
    let withOpts = 0, ann = 0, full = 0;
    arr.forEach((q, i) => {
      const mz = q['误解标注'];
      const isJ = m === 'judge';
      const hasOpts = isJ || (Array.isArray(q.opts) && q.opts.length > 1 && typeof q.a === 'number');
      if (!hasOpts) { if (mz) { console.log(`${f} ${m}[${i}] 无选项却有误解标注`); bad++; } return; }
      withOpts++;
      if (!Array.isArray(mz) || !mz.length) return;
      ann++;
      const seen = new Set();
      for (const z of mz) {
        const err = (msg) => { console.log(`${f} ${m}[${i}] ${msg}`); bad++; };
        if (!z['误解'] || !String(z['误解']).trim()) err('误解为空');
        if (isJ) {
          const want = q.a === true ? ['A', '错误'] : ['B', '正确'];
          if (z['选项'] !== want[0] || z['选项文本'] !== want[1]) err(`判断题口径不符 a=${q.a} 标了 ${z['选项']}/${z['选项文本']}`);
        } else {
          const k = String(z['选项']).charCodeAt(0) - 65;
          if (k === q.a) err(`标在正确项 ${z['选项']}`);
          if (q.opts[k] !== z['选项文本']) err(`字母↔文本不符 ${z['选项']}:${z['选项文本']} 实为 ${q.opts[k]}`);
          if (seen.has(k)) err(`重复标注 ${z['选项']}`);
          seen.add(k);
        }
      }
      if (isJ || seen.size >= q.opts.length - 1) full++;
    });
    if (withOpts) cov.push(`${m} ${ann}/${withOpts}` + (ann !== full ? `（全错项 ${full}）` : ''));
  }
  console.log(f, cov.join(' · '));
}
console.log(bad ? `问题 ${bad} 处` : 'OK');
process.exit(bad ? 1 : 0);
