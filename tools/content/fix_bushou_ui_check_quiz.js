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
// 界面写死的数量要和数据一致（首页面板、部首页/古诗页「N种玩法」）
{const L=f=>{const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('newhanzi/'+f,'utf8'),c);return c.window;};
 const html=fs.readFileSync('newhanzi/index.html','utf8');
 const real={'首':L('data/shici.js').NHZ_SHICI.poems.length,'部首':L('bushou/data.js').NHZ_BUSHOU.length,'篇':L('data/guwen.js').NHZ_GUWEN.texts.length};
 for(const [u,n] of Object.entries(real)){const re=new RegExp('(\\d+) '+u+'(?=<| /)','g');let m;while((m=re.exec(html))){if(+m[1]!==n){bad++;console.log('index.html 写死数量不符',m[0],'实际',n);}}}
 for(const [f,t] of [['bushou.html','bushou'],['shici.html','shici']]){const M=L('quiz/data_'+t+'.js').NHZ_QUIZ.modes;const n=Object.keys(M).filter(k=>M[k].length).length;
  const m=fs.readFileSync('newhanzi/'+f,'utf8').match(/(\d+)种玩法/);if(m&&+m[1]!==n){bad++;console.log(f,'玩法数不符',m[0],'实际',n);}}
 console.log('界面数量：',JSON.stringify(real));}
console.log(bad?('FAIL '+bad):'OK');process.exit(bad?1:0);
