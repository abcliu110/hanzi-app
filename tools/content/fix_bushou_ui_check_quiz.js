// F6 题库自检：答案在选项里、选项不重复、误解标注字母与选项文本一致且不指向正确项、答案位置分布
const fs=require('fs'),vm=require('vm');
let bad=0;
for(const f of ['data_zika.js','data_bushou.js']){
 const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('newhanzi/quiz/'+f,'utf8'),ctx);
 const D=ctx.window.NHZ_QUIZ;
 for(const m in D.modes){const dist={};D.modes[m].forEach((q,i)=>{
  if(Array.isArray(q.opts)){
   if(!(q.a>=0&&q.a<q.opts.length)){bad++;console.log('越界',f,m,i)}
   if(new Set(q.opts).size!==q.opts.length){bad++;console.log('选项重复',f,m,i,q.opts.join('/'))}
   dist[q.a]=(dist[q.a]||0)+1;
   (q['误解标注']||[]).forEach(mz=>{const k=mz['选项'].charCodeAt(0)-65;
     if(q.opts[k]!==mz['选项文本']||k===q.a){bad++;console.log('误解标注不符',f,m,i,mz['选项'],mz['选项文本'],q.opts.join('/'),q.a)}});
  }});
  if(Object.keys(dist).length)console.log(f,m,JSON.stringify(dist));}
}
// 引擎选项洗牌：抽出 engine.js 的 shuffle/shuffleOpts，每题洗 20 次，确认判分按内容（洗后 opts[a] 仍是原正确选项，误解标注字母仍指向同一文本）
{const src=fs.readFileSync('newhanzi/quiz/engine.js','utf8');
 const grab=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]==='{')d++;else if(src[j]==='}'&&--d===0)break;}return src.slice(i,j+1);};
 const sm=src.match(/var SHUF_MODES = [^;]+;/)[0];
 const ctx={};vm.createContext(ctx);vm.runInContext(grab('shuffle')+'\n'+sm+'\n'+grab('shuffleOpts'),ctx);
 let n=0,moved=0,kept=0;
 for(const f of ['data_zika.js','data_bushou.js']){const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('newhanzi/quiz/'+f,'utf8'),c);
  const M=c.window.NHZ_QUIZ.modes;for(const m in M)M[m].forEach((q,i)=>{for(let t=0;t<20;t++){const v=ctx.shuffleOpts(m,q);if(v===q){kept++;break;}n++;
   if(v.opts[v.a]!==q.opts[q.a]||v.opts.slice().sort().join()!==q.opts.slice().sort().join()){bad++;console.log('洗牌后答案内容变了',f,m,i);break;}
   if(v.a!==q.a)moved++;
   (v['误解标注']||[]).forEach(mz=>{if(v.opts[mz['选项'].charCodeAt(0)-65]!==mz['选项文本']){bad++;console.log('洗牌后误解标注错位',f,m,i);}});}});}
 console.log('洗牌校验：',n,'次洗牌，答案下标变化',moved,'次；不洗的题（非单选或含指位置选项）',kept);}
console.log(bad?('FAIL '+bad):'OK');process.exit(bad?1:0);
