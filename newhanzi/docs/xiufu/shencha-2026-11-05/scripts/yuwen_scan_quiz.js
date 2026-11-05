// 全量扫描：语法题库 quiz_bank_*.js + data.js 讲解内练习 + quiz/data_{yuwen,logic,lab}.js + games/yufa
// 用法：node yuwen_scan_quiz.js [--json out.json]   输出各检查项命中数与样例
const L=require('./yuwen_load.js');const fs=require('fs');
const H={};function hit(cat,rec){(H[cat]=H[cat]||[]).push(rec);}
const items=[];// {src,id,point,cls,q,opts,a,exp,kind}
for(const b of L.banks()){(b.bank.questions||[]).forEach((q,i)=>items.push({src:b.file,id:`${b.point}#${i}`,point:b.point,cls:q['类']||'',q:q.q,opts:q.options,a:q.answer,exp:q['解析']||'',kind:'bank'}));}
const Y=L.yuwen();
for(const s in Y)for(const c of Y[s].categories)for(const it of c.items)(it['练习']||[]).forEach((q,i)=>{if(q.options)items.push({src:'yuwen/data.js',id:`${s}/${it.name}/练习#${i}`,point:it.name,cls:'',q:q.q,opts:q.options,a:q.answer,exp:q['解析']||q.exp||'',kind:'lianxi'});});
for(const f of ['data_yuwen.js','data_logic.js','data_lab.js']){const Q=L.quiz(f);for(const m of ['choice','blank','spot','rewrite'])(Q.modes[m]||[]).forEach((q,i)=>items.push({src:'quiz/'+f,id:`${m}#${i}`,point:m,cls:'',q:(q.q||q.s||q.from||'')+(q.target?' ['+q.target+']':'')+(q.prompt?' '+q.prompt:''),opts:q.opts,a:q.a,exp:q.exp||'',fix:q.fix,kind:'quiz_'+m}));
 (Q.modes.judge||[]).forEach((q,i)=>items.push({src:'quiz/'+f,id:`judge#${i}`,point:'judge',q:q.q,opts:['对','错'],a:q.a?0:1,exp:q.exp||'',kind:'quiz_judge'}));}
{const c=L.run('games/yufa/data_bazi.js');(c.QS||[]).forEach((q,i)=>items.push({src:'games/yufa/data_bazi.js',id:`QS#${i}`,point:q.dir,q:q.stem,opts:q.opts,a:q.a,exp:q.why||'',kind:'game_bazi'}));}
// ---------- 通用检查 ----------
const norm=s=>String(s).replace(/[\s。，！？、；：“”"'‘’（）()]/g,'');
const tplRe=[[/其他三个(字|词)不合.*的用法/,'不合X的用法'],[/其他三个分别是/,'其他三个分别是…'],[/^这句(用了|属于)/,'这句用了/属于X'],[/填在这里最合适/,'填在这里最合适'],[/其他三个说法不对/,'其他三个说法不对'],[/^改正后是：/,'改正后是…；原句X'],[/这是正确答案|正确答案是/,'这是正确答案'],[/^正确的是：/,'正确的是：X']];
const tplCount={};
for(const it of items){
 const {opts,a,exp}=it;
 if(!Array.isArray(opts)||!opts.length){hit('S1结构-无选项',it);continue;}
 if(typeof a!=='number'||a<0||a>=opts.length) hit('S1结构-答案越界',it);
 if(opts.some(o=>!String(o).trim())) hit('S1结构-空选项',it);
 const n=opts.map(norm);if(new Set(n).size!==n.length) hit('S1选项重复',it);
 if(!String(exp).trim()) hit('S3空解析',it);
 for(const [re,name] of tplRe) if(re.test(exp)){tplCount[name]=(tplCount[name]||0)+1;hit('S3模板解析',Object.assign({tpl:name},it));break;}
 const all=[it.q,...opts,exp].join(' ');
 if(/[A-Za-z]{2,}/.test(all.replace(/https?:\S+/g,''))) hit('S9混入英文',it);
 // 括号/引号配对（空格括号 "( )" 是填空位，除外）
 const t=all.replace(/\(\s*\)|（\s*）/g,'');
 const cnt=(s,ch)=>s.split(ch).length-1;
 if(cnt(t,'“')!==cnt(t,'”')||cnt(t,'（')!==cnt(t,'）')||cnt(t,'(')!==cnt(t,')')) hit('S10截断/括号引号不配对',it);
 // 叠字乱码：选项中"XX XX"连续重复 2–4 字（如 也好也好、苹果苹果、举行举行）
 for(const o of opts){const m=String(o).match(/([\u4e00-\u9fa5]{2,4})\1(?=[。！？]?$|[。，])/);if(m&&!/^(盼望着|走啊走|加油|一闪一闪|看看|想想|天天|慢慢|轻轻|高高|清清|蓝蓝|红红)/.test(m[1])&&!/(谢谢|妈妈|爸爸|哥哥|姐姐|弟弟|妹妹|爷爷|奶奶|星星|宝宝|叔叔|常常|渐渐|刚刚|悄悄|统统|偏偏|仅仅|往往|恰恰|万万|默默|纷纷|处处)/.test(m[0])){hit('S7选项含叠词乱码',Object.assign({bad:o},it));break;}}
 if(/的的|地地(?!道)|了了(?!解)/.test(opts.join('|')+it.q)) hit('S12错字-的的/了了',it);
 // 解析与答案矛盾：解析写"括号里填X"/"X是…"而X≠答案
 if(typeof a==='number'&&opts[a]!=null){const ans=String(opts[a]);
   let m=exp.match(/括号里填([^；;，。]+)/);if(m&&norm(m[1])!==norm(ans)) hit('S4解析与答案矛盾',Object.assign({claim:m[1]},it));
   m=exp.match(/^改正后是：(.+?)；/);if(m&&norm(m[1])!==norm(ans)) hit('S4解析与答案矛盾',Object.assign({claim:m[1]},it));
   if(/其他三个分别是/.test(exp)){const head=exp.split(/[是有]/)[0];if(norm(head)&&!norm(ans).startsWith(norm(head).slice(0,4))&&!norm(head).startsWith(norm(ans).slice(0,4))) hit('S4解析与答案矛盾',Object.assign({claim:head},it));}
 }
 // 说法正确题：答案选项本身是拼接病句（句子+标签直接相连）
 if(/说法正确/.test(it.q)&&typeof a==='number'){const o=String(opts[a]);if(/[^，。；：]{5,}(主语完整|关联词齐全|约数不叠用|缺少主语，|虽然残缺，|是暗喻。$|是明喻。$)/.test(o)||/[\u4e00-\u9fa5]{6,}(式是|残缺|叠用)[，,]/.test(o)) hit('S7说法题选项为拼接句',Object.assign({bad:o},it));
   for(const o2 of opts){if(/^[^，]{3,}用是|表示拟人。$/.test(o2)) {hit('S7说法题选项为拼接句',Object.assign({bad:o2},it));break;}}}
 // 题干泄题：去掉题目说明后，题干已含答案(≥2字)而不含其他选项
 if(typeof a==='number'&&opts[a]&&String(opts[a]).length>=2&&/\(\s*\)|___/.test(it.q)){const stem=it.q.split('\n').pop();const ans=String(opts[a]);if(stem.includes(ans)&&!opts.some((o,j)=>j!==a&&String(o).length>=2&&stem.includes(o))) hit('S8题干泄题',it);}
}
// ---------- 同题重复 / 同干异答 ----------
const byKey={},byStem={};
for(const it of items){if(!Array.isArray(it.opts))continue;const k=it.src+'|'+norm(it.q)+'|'+it.opts.map(norm).sort().join(',');(byKey[k]=byKey[k]||[]).push(it);
 if(/\(\s*\)|___/.test(it.q)){const ks=it.src+'|'+norm(it.q.split('\n').pop());(byStem[ks]=byStem[ks]||[]).push(it);}}
for(const k in byKey) if(byKey[k].length>1) hit('S2同题重复',{src:byKey[k][0].src,id:byKey[k].map(x=>x.id).join(','),q:byKey[k][0].q,opts:byKey[k][0].opts,a:byKey[k][0].a,exp:'×'+byKey[k].length});
for(const k in byStem){const g=byStem[k];const ans=new Set(g.map(x=>norm(x.opts[x.a])));if(ans.size>1) hit('S5同一题干不同答案',{src:g[0].src,id:g.map(x=>x.id+'→'+x.opts[x.a]).join('；'),q:g[0].q.split('\n').pop(),opts:g[0].opts,a:g[0].a,exp:''});}
// ---------- 选择题里另一个选项也是同类答案（题库内交叉） ----------
// 规则：某句在本库作为"有X毛病/是X"的答案，又在另一题里作干扰项出现 → 该题至少两个选项属同大类
const ansSet={};// src|point -> Map(sentence -> cls)
for(const it of items) if(it.kind==='bank'&&/^下面哪个/.test(it.q)&&String(it.opts[it.a]).length>=4){const k=it.src;ansSet[k]=ansSet[k]||new Map();const s=norm(it.opts[it.a]);if(!ansSet[k].has(s))ansSet[k].set(s,new Set());ansSet[k].get(s).add(it.cls);}
for(const it of items) if(it.kind==='bank'&&/^下面哪个/.test(it.q)){const M=ansSet[it.src];if(!M)continue;
 it.opts.forEach((o,j)=>{if(j===it.a)return;const s=norm(o);if(M.has(s)){const cl=[...M.get(s)];const same=cl.includes(it.cls);hit(same?'S5多个正确答案-同子类':'S5多个正确答案-异子类(子类难分)',Object.assign({other:o,otherCls:cl.join('/')},it));}});}
// ---------- 解析里干扰项标签 vs 本库词典 ----------
const lab={};// src -> word -> Set(label)
for(const it of items) if(it.kind==='bank'&&/其他三个分别是/.test(it.exp)){const w=norm(it.opts[it.a]);const lb=it.cls;(lab[it.src]=lab[it.src]||{});(lab[it.src][w]=lab[it.src][w]||new Set()).add(lb);}
const wordLab={};// 跨库：单词->标签
for(const it of items) if(it.kind==='bank'&&/其他三个分别是/.test(it.exp)){const m=it.exp.match(/其他三个分别是(.+?)，不是/);if(!m)continue;const labs=m[1].split('、').filter(Boolean);const ds=it.opts.filter((_,j)=>j!==it.a);
 // 解析顺序是否与选项顺序一致：用本库词典判断
 if(labs.length===ds.length){let mism=[];ds.forEach((d,j)=>{const known=lab[it.src][norm(d)];if(known&&!known.has(labs[j])) mism.push(`${d}→解析说「${labs[j]}」，本库别处作「${[...known].join('/')}」`);});
  if(mism.length) hit('S4解析干扰项标签错位',Object.assign({mism:mism.join('；')},it));
  ds.forEach((d,j)=>{if(String(d).length<=2){(wordLab[d]=wordLab[d]||{});wordLab[d][labs[j]+'@'+it.point]=(wordLab[d][labs[j]+'@'+it.point]||0)+1;}});}
 const a=it.opts[it.a];if(String(a).length<=2){(wordLab[a]=wordLab[a]||{});wordLab[a][it.cls+'@'+it.point]=(wordLab[a][it.cls+'@'+it.point]||0)+1;}}
// 单字词跨库被标成不同词类（大类不同才算）
const big=l=>(l.match(/(名词|动词|形容词|副词|连词|介词|助词|叹词|代词|数词|量词|语气词)$/)||[,''])[1];
const W=[];for(const w in wordLab){const bigs=new Set(Object.keys(wordLab[w]).map(x=>big(x.split('@')[0])).filter(Boolean));if(bigs.size>1&&!/^(了|和|在|给|到|对|用|向|比|跟|同|就|才|还|也|都|过|着|来|去|要|会|能|好|的|地|得|吧|啊|呢|一|二|两)$/.test(w))W.push(w+'：'+JSON.stringify(wordLab[w]));}
H['S11同词跨库词类冲突(仅非兼类词)']=W.map(x=>({src:'多库',id:'',q:x,opts:[],a:0,exp:''}));
const Wall=[];for(const w of ['也','了','和','在','给','到','就','才','还','都','连','约','几个','一些','同']){if(wordLab[w])Wall.push(w+'：'+JSON.stringify(wordLab[w]));}
H['S11兼类词标签一览(人工判)']=Wall.map(x=>({src:'多库',id:'',q:x,opts:[],a:0,exp:''}));
// ---------- 输出 ----------
const out={total:items.length,bySrcKind:{},tplCount,counts:{},samples:{}};
for(const it of items){out.bySrcKind[it.kind]=(out.bySrcKind[it.kind]||0)+1;}
for(const c in H){out.counts[c]=H[c].length;out.samples[c]=H[c].slice(0,40).map(x=>({src:x.src,id:x.id,q:x.q,opts:x.opts&&x.opts.map((o,j)=>(j===x.a?'*':'')+o).join(' | '),exp:x.exp,extra:x.tpl||x.claim||x.other&&(x.other+' ['+x.otherCls+']')||x.mism||x.bad||''}));}
const perPoint={};for(const c of ['S5多个正确答案-同子类','S5多个正确答案-异子类(子类难分)','S3模板解析']){perPoint[c]={};for(const x of H[c]||[]){perPoint[c][x.point]=(perPoint[c][x.point]||0)+1;}}
out.perPoint=perPoint;
const of=process.argv.includes('--json')?process.argv[process.argv.indexOf('--json')+1]:'/workspace/work/hanzi-audit/scripts/yuwen_scan_quiz.out.json';
fs.writeFileSync(of,JSON.stringify(out,null,1));
console.log('items',items.length,JSON.stringify(out.bySrcKind));console.log(JSON.stringify(out.counts,null,1));console.log('模板解析分布',JSON.stringify(tplCount));
