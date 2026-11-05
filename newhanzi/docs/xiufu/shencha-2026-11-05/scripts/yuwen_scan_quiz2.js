// 第二轮精确检查：同干异答→确定多解、库内唯一题比例、拼接病句、"正确句被当病句"规则、术语统计
const L=require('./yuwen_load.js');const fs=require('fs');const norm=s=>String(s).replace(/[\s。，！？、；：“”"'‘’（）()]/g,'');
const B=L.banks();const R={};
// 1 唯一题比例
R.uniq={};let tot=0,uq=0;for(const b of B){const qs=b.bank.questions;const s=new Set(qs.map(q=>norm(q.q)+'|'+q.options.map(norm).sort().join(',')));R.uniq[b.point]=`${s.size}/${qs.length}`;tot+=qs.length;uq+=s.size;}R.uniqTotal=`${uq}/${tot}`;
// 2 同干异答：题干相同，另一题的答案也出现在本题选项里 → 本题至少两个可接受答案
const g={};for(const b of B)b.bank.questions.forEach((q,i)=>{if(!/\(\s*\)|___/.test(q.q))return;const k=b.point+'|'+norm(q.q.split('\n').pop());(g[k]=g[k]||[]).push({b,q,i});});
R.multi=[];for(const k in g){const arr=g[k];const answers=new Set(arr.map(x=>norm(x.q.options[x.q.answer])));if(answers.size<2)continue;
 for(const x of arr){const others=x.q.options.filter((o,j)=>j!==x.q.answer&&answers.has(norm(o)));if(others.length)R.multi.push({file:x.b.file,id:x.b.point+'#'+x.i,stem:x.q.q.split('\n').pop(),ans:x.q.options[x.q.answer],alsoOK:others.join('/')});}}
R.multiByPoint={};for(const m of R.multi){const p=m.id.split('#')[0];R.multiByPoint[p]=(R.multiByPoint[p]||0)+1;}
// 3 拼接病句（"说法正确"题选项把例句和结论硬拼）
const glue=/[\u4e00-\u9fa5]{4,}(主语完整|关联词齐全|约数不叠用|缺少主语|虽然残缺|关联词不全|搭配得当|语序正确|没有歧义|意思明确|不重复)|用是连接|表示拟人。$/;
R.glue=[];for(const b of B)b.bank.questions.forEach((q,i)=>{if(!/说法正确/.test(q.q))return;q.options.forEach((o,j)=>{if(glue.test(o))R.glue.push({file:b.file,id:b.point+'#'+i,opt:o,isAnswer:j===q.answer});});});
// 4 规则：正确句被当作病句答案（选病句/属于哪种病句/把病句改正）
const rules=[
 ['的字短语作宾语被判宾语残缺',/(了|买|做|穿|吃|要)[\u4e00-\u9fa5]{0,4}(红色|新|好吃|香喷喷|大大|好看|有趣|美丽|干净)的。$/],
 ['单用"因为"被判关联词残缺',/^因为[^，]+，(?!所以)[^。]+。$/],
 ['"最少也有N多"被判约数矛盾',/^最少也有\d+多/],
 ['"身材很高大/瘦小"被判修饰搭配不当',/身材很(高大|瘦小)/],
 ['"认真地在…"被判状语语序不当',/认真地在/],
 ['祈使句无主语被判主语残缺',/^在上课的时候，认真听讲/],
 ['"8岁上五年级"被判不合逻辑',/八岁，却已经上五年级/],
 ['"我的妈妈的书"类被判领属错位',/我的妈妈的|他的爸爸的|她的姐姐的/],
];
R.rule={};for(const [name,re] of rules)R.rule[name]=[];
for(const b of B)b.bank.questions.forEach((q,i)=>{const sick=/毛病|属于哪种病句|病句改正/.test(q.q);if(!sick)return;
 const target=/属于哪种病句/.test(q.q)?q.q.split(/ 属于/)[0]:/病句改正/.test(q.q)?q.q.split('\n').pop():q.options[q.answer];
 for(const [name,re] of rules) if(re.test(target)) R.rule[name].push({file:b.file,id:b.point+'#'+i,s:target});});
// 5 关联词"虽然…，…"：语法库判对、病句库判错
R.suiran={correct:[],sick:[]};for(const b of B)b.bank.questions.forEach((q,i)=>{const a=q.options[q.answer];if(/^虽然[^，]+，(?!但|可|却|还)[^。]+。$/.test(a)){(/毛病/.test(q.q)?R.suiran.sick:R.suiran.correct).push(b.point+'#'+i+' '+a);}});
// 6 了/着/过 填空：选项同含了/着/过且空位紧跟动词后、后接宾语
R.lzg=[];const lz=B.find(b=>b.point==='了/着/过');lz.bank.questions.forEach((q,i)=>{const st=q.q.split('\n').pop();if(/\(\s*\)[\u4e00-\u9fa5]+。$/.test(st)&&['了','着','过'].every(x=>q.options.includes(x)))R.lzg.push(i+' '+st+' 答:'+q.options[q.answer]);});
// 7 术语
const files=['yuwen/data.js','yuwen/grammar.json','quiz/data_yuwen.js','quiz/data_lab.js','games/yufa/data_juzi.js',...fs.readdirSync(L.ROOT+'/wb/s').map(f=>'wb/s/'+f),...fs.readdirSync(L.ROOT+'/yuwen').filter(f=>f.startsWith('quiz_bank')).map(f=>'yuwen/'+f)];
const terms=['程度补语','状态补语','情态补语','可能补语','偏正短语','偏正式','定中短语','状中短语','定中式','状中式','动宾短语','动宾式','述宾','补充短语','补充式','中补','述补','主谓短语','主谓式','形状形容词','借喻'];
R.terms={};for(const t of terms){R.terms[t]={};for(const f of files){const s=fs.readFileSync(L.ROOT+'/'+f,'utf8');const c=s.split(t).length-1;if(c)R.terms[t][f]=c;}}
// "得"字补语在各处被叫什么
R.deBuyu=[];for(const f of files){const s=fs.readFileSync(L.ROOT+'/'+f,'utf8');const m=s.match(/[^"“。]{0,12}(跑|写|说|唱|做|长)得(很)?(快|好|漂亮|认真|开心)[^"”。]{0,20}(程度|状态|情态|结果)补语/g);if(m)R.deBuyu.push(f+': '+[...new Set(m)].slice(0,3).join(' ‖ '));}
fs.writeFileSync('/workspace/work/hanzi-audit/scripts/yuwen_scan_quiz2.out.json',JSON.stringify(R,null,1));
console.log('uniq',R.uniqTotal);console.log('multi',R.multi.length,JSON.stringify(R.multiByPoint));R.multi.filter((x,i,a)=>a.findIndex(y=>y.stem===x.stem)===i).slice(0,25).forEach(x=>console.log(' ',x.id,x.stem,'答',x.ans,'也对',x.alsoOK));
console.log('glue',R.glue.length,R.glue.filter(x=>x.isAnswer).length);R.glue.filter((x,i,a)=>a.findIndex(y=>y.opt===x.opt)===i).slice(0,10).forEach(x=>console.log(' ',x.id,x.isAnswer?'[答案]':'',x.opt));
for(const k in R.rule)console.log('rule',k,R.rule[k].length,R.rule[k].slice(0,2).map(x=>x.id+' '+x.s).join(' ; '));
console.log('suiran correct',R.suiran.correct.length,R.suiran.correct.slice(0,2),'sick',R.suiran.sick.length,R.suiran.sick.slice(0,2));
console.log('lzg',R.lzg.length,R.lzg.slice(0,6));
console.log(JSON.stringify(R.terms));console.log(R.deBuyu.join('\n'));
