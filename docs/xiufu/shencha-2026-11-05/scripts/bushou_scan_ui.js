// 界面文案扫描：占位词、写死数字 vs 实际数据量、玩法数、鼓励语。node bushou_scan_ui.js
const fs=require('fs');const {load,ROOT}=require('./bushou_load.js');
const F=['index.html','index.js','fuxi.html','fuxi.js','weekly.html','weekly.js','share.html','share.js','today-task.js','checkin.js','bushou.html','bushou.js','quiz/engine.js','quiz/index.html'];
const real={};
real['字库']=load(['data/index.js']).NHZ_INDEX.length;
const sc=load(['data/shici.js']).NHZ_SHICI;real['诗']=sc.poems.length;
real['古文']=load(['data/guwen.js']).NHZ_GUWEN.texts.length;
const B=load(['bushou/data.js']).NHZ_BUSHOU;real['部首条目']=B.length;real['部首(去掉组合键/?)']=B.filter(r=>[...r.bushou].length===1&&r.bushou!=='?').length;
for(const t of ['bushou','zika','logic','lab','yuwen']){const Q=load(['quiz/data_'+t+'.js']).NHZ_QUIZ;real['题库.'+t]=Object.values(Q.modes).reduce((a,b)=>a+b.length,0);real['玩法.'+t]=Object.keys(Q.modes).filter(m=>Q.modes[m].length).length;}
console.log('实际数据量',JSON.stringify(real));
const pats=[[/待录入|待补|待核对|TODO|FIXME|占位|lorem|敬请期待|coming soon/i,'placeholder'],[/(\d+)\s*(首|篇|部首|题|项|种玩法|字)/g,'number'],[/答对了|再想想|别灰心|加油|太棒|真棒|好好休息|没关系|继续保持/g,'praise'],[/笨|蠢|差劲|太差|丢人|不及格|失败了/,'harsh']];
fs.readFileSync; for(const f of F){const p=ROOT+'/'+f;if(!fs.existsSync(p))continue;fs.readFileSync(p,'utf8').split('\n').forEach((l,i)=>{
  const code=l.replace(/\/\*.*?\*\/|\/\/.*$/,''); // 粗略去注释
  for(const [re,k] of pats){ if(k==='number'||k==='praise'){let m;re.lastIndex=0;while((m=re.exec(code))){ if(k==='number'&&!/[\u4e00-\u9fff]/.test(m[0]))continue; console.log(k.padEnd(11),`${f}:${i+1}`,m[0],'|',code.trim().replace(/<[^>]+>/g,'').slice(0,90));}}
   else if(re.test(code)) console.log(k.padEnd(11),`${f}:${i+1}`,'|',code.trim().replace(/<[^>]+>/g,' ').slice(0,120));}
});}
