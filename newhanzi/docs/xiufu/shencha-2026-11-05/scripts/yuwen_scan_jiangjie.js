// 讲解扫描：data.js 的 grammar/logic/reading/writing 各条目字段：空节、占位、套话（跨条目重复）、口诀重复、例子缺失
const L=require('./yuwen_load.js');const Y=L.yuwen();const fs=require('fs');
const R={empty:[],placeholder:[],dupText:{},short:[]};const seen={};
const ph=/待补|待定|TODO|todo|占位|xxx|XXX|？？|\?\?|（\s*）|\(\s*\)|……$|示例句子|例句\d|此处|略。?$/;
function walk(v,path,ctx){if(v==null)return;if(typeof v==='string'){const s=v.trim();if(!s)R.empty.push(path);else{if(ph.test(s)&&!/练习/.test(path))R.placeholder.push(path+' = '+s.slice(0,80));if(s.length>=12){(seen[s]=seen[s]||[]).push(path);}}return;}
 if(Array.isArray(v)){if(!v.length)R.empty.push(path+'[]');v.forEach((x,i)=>walk(x,path+'['+i+']'));return;}
 if(typeof v==='object'){const ks=Object.keys(v);if(!ks.length)R.empty.push(path+'{}');for(const k of ks)walk(v[k],path+'.'+k);}}
for(const s in Y)for(const c of Y[s].categories)for(const it of c.items){const base=`${s}/${c.id}/${it.name}`;for(const k in it){if(k==='练习')continue;walk(it[k],base+'.'+k);}
 for(const f of ['讲解','深讲','口诀','易错','例子','怎么认','例句解析']) if(!(f in it)) R.empty.push(base+'.'+f+'(缺字段)');}
for(const s in seen){const ps=seen[s];const items=new Set(ps.map(p=>p.split('.')[0]));if(items.size>=3)R.dupText[s.slice(0,90)]=items.size;}
// 口诀重复
const kj={};for(const s in Y)for(const c of Y[s].categories)for(const it of c.items){if(it['口诀'])(kj[it['口诀']]=kj[it['口诀']]||[]).push(it.name);}
R.kjDup=Object.entries(kj).filter(([k,v])=>v.length>1);
fs.writeFileSync('/workspace/work/hanzi-audit/scripts/yuwen_scan_jiangjie.out.json',JSON.stringify(R,null,1));
console.log('empty',R.empty.length,R.empty.slice(0,15));console.log('placeholder',R.placeholder.length,R.placeholder.slice(0,15));
console.log('套话(≥3条目同句)',Object.keys(R.dupText).length);Object.entries(R.dupText).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(x=>console.log(' ',x[1],x[0]));
console.log('口诀重复',JSON.stringify(R.kjDup));
