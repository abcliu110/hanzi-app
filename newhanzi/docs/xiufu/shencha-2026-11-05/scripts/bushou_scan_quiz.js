// 部首题库 + 识字题库全量扫描：node bushou_scan_quiz.js [--json out]
const fs=require('fs');const {load,ROOT}=require('./bushou_load.js');
const ZM=load(['bushou/zi_map.js']).NHZ_ZI_BUSHOU;
const IDX={};(load(['data/index.js']).NHZ_INDEX||[]).forEach(r=>IDX[r.z]=r.bu);
const PY=Object.assign({},load(['data/pinyin_lookup.js']).NHZ_PINYIN);
// pinyin.csv 补全所有读音
fs.readFileSync(ROOT+'/ziku/pinyin.csv','utf8').split('\n').slice(1).forEach(l=>{const m=l.match(/^\d+,(.),("?)([^"]*?)\2,(.*?),/);if(!m)return;const s=new Set((PY[m[1]]||'').split(',').filter(Boolean));m[3].split(/[,|]/).forEach(x=>x&&s.add(x.trim()));PY[m[1]]=[...s].join(',');});
const VAR={'水':'氵','手':'扌','人':'亻','心':'忄','言':'讠','金':'钅','食':'饣','衣':'衤','示':'礻','刀':'刂','犬':'犭','丝':'纟','火':'灬','玉':'王','邑':'阝','阜':'阝','肉':'月'};
const same=(a,b)=>a===b||VAR[a]===b||VAR[b]===a;
const H={};const add=(k,x)=>(H[k]=H[k]||[]).push(x);
const L='ABCDEFGH';
function common(tag,arr,mode,getOpts){arr.forEach((q,i)=>{const id=`${tag}.${mode}[${i}]`;const o=q.opts;if(!o)return;
  if(typeof q.a!=='number'||q.a<0||q.a>=o.length) add('answer_out_of_range',`${id} a=${q.a} opts=${o.join('/')}`);
  const d=o.filter((x,j)=>o.indexOf(x)!==j); if(d.length) add('opts_duplicate',`${id} ${o.join('/')}`);
  (q['误解标注']||[]).forEach(m=>{const j=L.indexOf(m['选项']); if(j===q.a) add('misc_marks_correct',`${id} ${m['选项']} 是正确答案却标了误解`); if(o[j]!==m['选项文本']) add('misc_text_mismatch',`${id} ${m['选项']}=${o[j]} 标注写「${m['选项文本']}」`);});
  const txt=JSON.stringify([q.q||q.s||q.prompt,q.exp]);
  if(/待补|TODO|占位|lorem|xxx|\?\?/i.test(txt)) add('placeholder',`${id} ${txt.slice(0,80)}`);
});}
// 读音核对：“X”读pinyin / X(pinyin) / X（pinyin）
const TONE='a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü';
const reRead=new RegExp(`[“"'‘]([\\u4e00-\\u9fff])[”"'’]\\s*(?:读作|读|念)\\s*[“"']?([${TONE}]+)`,'g');
const reParen=new RegExp(`(?:^|[^\\u4e00-\\u9fff])([\\u4e00-\\u9fff])\\s*[（(]([${TONE}]+)[）)]`,'g');
function chkPy(id,text){if(!text)return;for(const re of [reRead,reParen]){re.lastIndex=0;let m;while((m=re.exec(text))){const z=m[1],p=m[2].toLowerCase();if((p.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g)||[]).length>1||p.length>6||!/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p)&&!/^(le|de|ma|ba|ne|zi|men|ge|me|ya|a|bo|shang|li|tou|sha|lou|yi|zhe|wa|la|zhi)$/.test(p))continue; const all=(PY[z]||'').split(',');
 if(PY[z]&&!all.includes(p)) {// 对“不读”否定句排除
   const pre=text.slice(Math.max(0,m.index-2),m.index+ m[0].length+2); if(/不读|不念/.test(text.slice(m.index,m.index+m[0].length))) continue;
   add('pinyin_wrong',`${id} 「${m[0]}」 词典读音=${PY[z]}`);}}}}
for(const [f,tag] of [['quiz/data_bushou.js','bushou'],['quiz/data_zika.js','zika']]){
  const Q=load([f]).NHZ_QUIZ.modes;
  for(const [mode,arr] of Object.entries(Q)) {common(tag,arr,mode);
    arr.forEach((q,i)=>{const id=`${tag}.${mode}[${i}]`;chkPy(id,JSON.stringify(q));});}
  // spot：fix 与 s 的差异字应 == opts[a]
  (Q.spot||[]).forEach((q,i)=>{const id=`${tag}.spot[${i}]`;
    if(tag==='zika'){ const s=[...q.s],fx=[...q.fix]; if(s.length===fx.length){const diff=s.map((c,j)=>c!==fx[j]?c:null).filter(Boolean); if(diff.length&&!diff.includes(q.opts[q.a])) add('spot_answer_wrong',`${id} 「${q.s}」→「${q.fix}」改的是「${diff.join('')}」，答案却是 ${L[q.a]}「${q.opts[q.a]}」`); if(!diff.length) add('spot_fix_same',`${id} ${q.s}`);} else add('spot_len_diff',`${id} 「${q.s}」/「${q.fix}」`);
      if(!q.opts.every(o=>q.s.includes(o))) add('spot_opt_not_in_sentence',`${id} ${q.opts.join('/')} | ${q.s}`);}
    else { const m=q.prompt.match(/[‘'“](.+?)[’'”]部/); if(!m) return; const b=m[1];
      const bad=q.opts.filter(z=>{const zb=ZM[z];return !(zb&&same(zb,b));});
      if(!(bad.length===1&&bad[0]===q.opts[q.a])) add('bushou_spot_conflict',`${id} 问「不属于${b}部」答=${q.opts[q.a]}；zi_map: ${q.opts.map(z=>z+'→'+ZM[z]).join(' ')}`);}
  });
  if(tag==='bushou'){
    (Q.choice||[]).forEach((q,i)=>{const id=`bushou.choice[${i}]`;const m=q.q.match(/^[‘'“](.)[’'”]的部首是/); if(!m) {add('bushou_choice_other',`${id} ${q.q}`);return;} const z=m[1],ans=q.opts[q.a],zb=ZM[z],ib=IDX[z];
      if(!(zb&&same(zb,ans))) add('bushou_choice_vs_zimap',`${id} ${z} 答=${ans} zi_map=${zb} index=${ib}`);
      if(ib&&zb&&ib!==zb) add('index_vs_zimap',`${z}: index.bu=${ib} zi_map=${zb}`);
      const alt=q.opts.filter((o,j)=>j!==q.a&&same(o,ans)); if(alt.length) add('bushou_choice_variant_both',`${id} ${z}: 答 ${ans}，干扰项 ${alt.join('')} 是同一部首的另一写法`);});
    (Q.match||[]).forEach((g,i)=>g.pairs.forEach(([b,z])=>{const zb=ZM[z]; if(!(zb&&same(zb,b))) add('bushou_match_conflict',`bushou.match[${i}] ${b}—${z} zi_map=${zb}`);}));
    (Q.order||[]).forEach((q,i)=>{const a=q.answer.split('→'); const s1=[...q.items].sort().join(),s2=[...a].sort().join(); if(s1!==s2) add('order_items_mismatch',`bushou.order[${i}] items=${q.items.join('/')} answer=${q.answer}`);});
    (Q.blank||[]).forEach((q,i)=>{const id=`bushou.blank[${i}]`;const m=q.s.match(/偏旁[‘'“](.+?)[’'”]能变成[‘'“](.)[’'”]/); if(!m) return; const ok=q.opts.filter(o=>[...q.s].length&&false); });
    (Q.rewrite||[]).forEach((q,i)=>{const d=q.opts.filter((x,j)=>q.opts.indexOf(x)!==j); if(d.length) add('opts_duplicate',`bushou.rewrite[${i}]`);});
  }
  if(tag==='zika'){
    (Q.match||[]).forEach((g,i)=>g.pairs.forEach(([z,p])=>{ if([...z].length===1&&/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p)){const all=(PY[z]||'').split(','); if(PY[z]&&!all.includes(p)) add('pinyin_wrong',`zika.match[${i}] ${z}—${p} 词典=${PY[z]}`);}}));
    (Q.judge||[]).forEach((q,i)=>{const id=`zika.judge[${i}]`; if(/^(错|不对|×|✗)/.test(q.exp)&&q.a===true) add('judge_exp_contradict',`${id} a=true exp=${q.exp}`); if(/^(对|正确|√)/.test(q.exp)&&q.a===false) add('judge_exp_contradict',`${id} a=false exp=${q.exp}`);});
  }
  (Q.judge||[]).forEach((q,i)=>{if(typeof q.a!=='boolean') add('judge_a_not_bool',`${tag}.judge[${i}] a=${q.a}`)});
  const tc=Object.values(Q).flat().length; add('_count',`${tag} 题量 ${tc}: `+Object.entries(Q).map(([k,v])=>k+v.length).join(' '));
}
// 追加：spot 改了多个字；“加一笔”笔画数核对；选择题答案位置偏置
{const ST={};fs.readFileSync(ROOT+'/ziku/pinyin.csv','utf8').split('\n').slice(1).forEach(l=>{const c=l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);if(c[1])ST[c[1]]=+c[4];});
for(const [f,tag] of [['quiz/data_bushou.js','bushou'],['quiz/data_zika.js','zika']]){const Q=load([f]).NHZ_QUIZ.modes;
 (Q.spot||[]).forEach((q,i)=>{if(tag!=='zika')return;const s=[...q.s],fx=[...q.fix];if(s.length!==fx.length)return;const d=s.filter((c,j)=>c!==fx[j]);if(d.length>1)add('spot_multi_wrong_chars',`${tag}.spot[${i}] 「${q.s}」→「${q.fix}」共改 ${d.length} 字(${d.join('')})，选项只能选一个`);});
 (Q.choice||[]).forEach((q,i)=>{const m=q.q.match(/[“"'](.)[”"']字加一(笔|点|横)(可以|不能)变成/);if(!m)return;const base=ST[m[1]];const ok=q.opts.map(o=>[...o].length===1&&ST[o]?ST[o]-base===1:null);
   const ans=q.opts[q.a];const want=m[3]==='可以';const good=q.opts.filter((o,j)=>ok[j]===want);
   if(/都对/.test(ans)){ if(ok.some((v,j)=>j!==q.a&&v===false)) add('stroke_add_wrong',`${tag}.choice[${i}] ${q.q} 答「${ans}」，但 ${q.opts.filter((o,j)=>ok[j]===false).map(o=>o+'('+ST[o]+'画)').join('')} 不是加一笔（${m[1]}${base}画）`);}
   else if(ok[q.a]!==want||good.length!==1) add('stroke_add_wrong',`${tag}.choice[${i}] ${q.q} 答「${ans}」；${m[1]}${base}画，选项笔画 ${q.opts.map(o=>o+(ST[o]||'?')).join(' ')}`);});
 for(const m of ['choice','blank','spot']){if(!Q[m])continue;const c={};Q[m].forEach(q=>c[q.a]=(c[q.a]||0)+1);const mx=Math.max(...Object.values(c));if(mx/Q[m].length>0.6)add('answer_position_bias',`${tag}.${m} 答案位置分布 ${JSON.stringify(c)}（共${Q[m].length}题；engine.js 不打乱选项）`);}
}}
const out={};for(const [k,v] of Object.entries(H)) out[k]={n:v.length,ex:v};
if(process.argv[2]==='--json') fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));
for(const [k,v] of Object.entries(H)) {console.log('##',k,v.length);console.log(v.slice(0,40).join('\n'));}
