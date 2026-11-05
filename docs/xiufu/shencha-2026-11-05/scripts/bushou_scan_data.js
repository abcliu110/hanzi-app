// 部首数据全量扫描：node bushou_scan_data.js [--json out.json]
const {load}=require('./bushou_load.js');
const w=load(['bushou/data.js','bushou/pianpang.js','bushou/zi_map.js']);
const D=w.NHZ_BUSHOU, ZM=w.NHZ_ZI_BUSHOU, PP=w.NHZ_PIANPANG;
const H={}; const add=(k,x)=>(H[k]=H[k]||[]).push(x);
const keys=D.map(r=>r.bushou);
const isCJK1=s=>[...s].length===1;
// 1 异常部首键
D.forEach((r,i)=>{ if(!isCJK1(r.bushou)) add('key_abnormal',`#${i} 「${r.bushou}」 count=${r.count}`);
  if(/\?|？/.test(r.bushou)) add('key_question',`#${i} 「${r.bushou}」`);});
// 重复
const seen={}; keys.forEach((k,i)=>{ if(seen[k]!=null) add('key_dup',`${k} #${seen[k]} #${i}`); seen[k]=i;});
// 字出现在多个部首 chars
const owner={}; D.forEach(r=>r.chars.forEach(z=>{(owner[z]=owner[z]||[]).push(r.bushou)}));
Object.entries(owner).forEach(([z,a])=>{ if(a.length>1) add('char_multi_owner',`${z}: ${a.join(' / ')}`)});
// 2 空字段
D.forEach((r,i)=>{
  if(!r.meaning) add('meaning_empty',`#${i} ${r.bushou} (count=${r.count})`);
  if(!r.semantic) add('semantic_empty',`#${i} ${r.bushou}`);
  if(!r.shuowen) add('shuowen_empty',`#${i} ${r.bushou}`);
  if(r.has_meaning && !r.meaning) add('has_meaning_but_empty',`#${i} ${r.bushou}`);
  if(r.count!==r.chars.length) add('count_mismatch',`#${i} ${r.bushou} count=${r.count} chars=${r.chars.length}`);
  if(r.count<=2) add('tiny_entry',`#${i} ${r.bushou} chars=${r.chars.join('')}`);
  if(r.benzi && r.benzi!==r.bushou && !r.bianti) add('bianti_missing',`#${i} ${r.bushou} benzi=${r.benzi}`);
});
// 3 套话
const tm=/^表示["“].+["”]及.*的意义范畴。?$/;
D.forEach((r,i)=>{ if(r.meaning&&tm.test(r.meaning)) add('meaning_template',`#${i} ${r.bushou}: ${r.meaning}`);
  if(/意义范畴|相关事物|等等|有关的字|多与相关|（）|\(\)|部首含义|待补|TODO|占位/.test(r.semantic||'')) add('semantic_placeholder',`#${i} ${r.bushou}: ${r.semantic}`);
  if(r.semantic && r.semantic.length<20) add('semantic_short',`#${i} ${r.bushou}: ${r.semantic}`);
});
// 4 例字
D.forEach((r,i)=>{ const zs=r.examples.map(e=>e.z); const dupz=zs.filter((z,j)=>zs.indexOf(z)!==j);
  if(dupz.length) add('example_dup_char',`#${i} ${r.bushou}: 重复 ${[...new Set(dupz)].join('')} | ${r.examples.map(e=>e.z+'('+e.w+')').join(' ')}`);
  r.examples.forEach(e=>{
    if(e.w && e.w.indexOf(e.z)<0) add('example_word_lacks_char',`#${i} ${r.bushou}: ${e.z} / ${e.w}`);
    const m=ZM[e.z];
    if(!r.chars.includes(e.z)) add('example_not_in_chars',`#${i} ${r.bushou}: ${e.z}(${e.w}) zi_map→${m||'无'}`);
    if(m && m!==r.bushou) add('example_zimap_conflict',`#${i} ${r.bushou}: ${e.z}(${e.w}) zi_map→${m}`);
  });
});
// 5 chars 与 zi_map 冲突
D.forEach((r,i)=>r.chars.forEach(z=>{ const m=ZM[z]; if(m && m!==r.bushou) add('chars_zimap_conflict',`${r.bushou}: ${z} zi_map→${m}`); }));
// zi_map 指向不存在部首
const kset=new Set(keys); const miss={}; Object.entries(ZM).forEach(([z,b])=>{ if(!kset.has(b)) (miss[b]=miss[b]||[]).push(z)});
Object.entries(miss).forEach(([b,a])=>add('zimap_unknown_bushou',`${b}: ${a.join('')}`));
// 6 变体说明
D.forEach((r,i)=>{ const b=r.bianti||''; if(!b) return;
  const m=b.match(/^(.+?)是["“](.+?)["”]在字(.)(?:作偏旁)?/);
  if(m){ if(m[1]!==r.bushou && !r.bushou.includes(m[1])) add('bianti_subject_mismatch',`#${i} ${r.bushou}: ${b}`);
         if(r.benzi && m[2]!==r.benzi) add('bianti_benzi_mismatch',`#${i} ${r.bushou} benzi=${r.benzi}: ${b}`);}
  if(/索引字头|原文作/.test(b)) add('bianti_jargon',`#${i} ${r.bushou}: ${b}`);
});
// 7 说文：与部首不匹配（凡X之屬 中 X 不是部首/本字）
D.forEach((r,i)=>{ const m=(r.shuowen||'').match(/凡(.)之屬/); if(m && m[1]!==r.bushou && m[1]!==r.benzi && !r.bushou.includes(m[1])) add('shuowen_mismatch',`#${i} ${r.bushou}(本字${r.benzi||'-'}): 凡${m[1]}之屬 | ${r.shuowen.slice(0,30)}`);
  if(/[a-zA-Z]{3,}/.test(r.shuowen||'')) add('shuowen_latin',`#${i} ${r.bushou}`);});
// 8 fm 家族含义
let fmN=0; D.forEach(r=>{ Object.entries(r.fm||{}).forEach(([z,v])=>{fmN++; if(!r.chars.includes(z)) add('fm_char_not_in_chars',`${r.bushou}: ${z}`); if(!v||v.length<2) add('fm_empty',`${r.bushou}: ${z}=${v}`); if(/[a-zA-Z]{3,}/.test(v)) add('fm_latin',`${r.bushou}: ${z}=${v}`);})});
// 9 偏旁表
PP.forEach(p=>{ p.ex.forEach(([z,wd])=>{ const m=ZM[z]; if(m!==p.to) add('pianpang_ex_conflict',`${p.p}(${p.name}): ${z}(${wd}) zi_map→${m}`); if(wd.indexOf(z)<0) add('pianpang_word_lacks',`${p.p}: ${z}/${wd}`);});
  if(!kset.has(p.to)) add('pianpang_to_missing',`${p.p} to=${p.to}`);});
// 输出
const out={total:D.length,fm_total:fmN,hits:{}};
for(const [k,v] of Object.entries(H)) out.hits[k]={n:v.length,ex:v};
if(process.argv[2]==='--json') require('fs').writeFileSync(process.argv[3],JSON.stringify(out,null,1));
console.log('部首条目',D.length,'fm',fmN);
for(const [k,v] of Object.entries(H)) console.log(k.padEnd(28),v.length,'|',v.slice(0,6).join(' ‖ '));
// 10 例字用了非《通用规范汉字表》8105 字（繁体/异体/生僻），以及例字 in3500 标记与字库不符
{const fs=require('fs');const {ROOT}=require('./bushou_load.js');const S=new Set();const T={};
 fs.readFileSync(ROOT+'/ziku/pinyin.csv','utf8').split('\n').slice(1).forEach(l=>{const m=l.match(/^\d+,(.),/);if(m)S.add(m[1]);});
 const I=new Set(load(['data/index.js']).NHZ_INDEX.map(r=>r.z));const H2={};const a2=(k,x)=>(H2[k]=H2[k]||[]).push(x);
 D.forEach((r,i)=>r.examples.forEach(e=>{ if(!S.has(e.z)) a2('example_not_in_8105',`#${i} ${r.bushou}: ${e.z}(${e.w})`);
   if(!!e.in3500!==I.has(e.z)) a2('example_in3500_flag_wrong',`#${i} ${r.bushou}: ${e.z} in3500=${e.in3500}`);
   if(!e.in3500) a2('example_not_in_3500',`#${i} ${r.bushou}: ${e.z}(${e.w})`);
   if(/斩首|枪毙|毙命|歌妓|伥鬼|毒药|尸体|死亡|凶恶|匈奴/.test(e.w)) a2('example_unfriendly_word',`#${i} ${r.bushou}: ${e.z}(${e.w})`);}));
 for(const [k,v] of Object.entries(H2)) console.log(k.padEnd(28),v.length,'|',v.slice(0,12).join(' ‖ '));
 if(process.argv[2]==='--json'){const p=process.argv[3];const o=JSON.parse(fs.readFileSync(p));for(const [k,v] of Object.entries(H2)) o.hits[k]={n:v.length,ex:v};fs.writeFileSync(p,JSON.stringify(o,null,1));}}
