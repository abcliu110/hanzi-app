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
console.log(bad?('FAIL '+bad):'OK');process.exit(bad?1:0);
