// 把 3500 张字卡 + index/grade_map/pinyin_lookup 汇总成快照 zika_all.json（默认写到系统临时目录，NHZ_SCAN_OUT 可改；只读）
const fs=require('fs'),path=require('path');
const SNAP=process.env.NHZ_DATA||path.join(__dirname,'..','..','..','..','data');  // 默认读本仓库 newhanzi/data（LEFTOVER 2026-11-07 去掉写死的旧副本路径）
function win(file){const window={};eval(fs.readFileSync(path.join(SNAP,file),'utf8'));return window;}
const cards={};
for(const f of fs.readdirSync(path.join(SNAP,'zika'))){ if(!f.endsWith('.js'))continue;
  const s=fs.readFileSync(path.join(SNAP,'zika',f),'utf8');
  const k=JSON.parse(s.slice(s.indexOf('{')).trim().replace(/;\s*$/,''));
  cards[k.zi]=k; if(k.zi+'.js'!==f) console.error('文件名与zi不符',f,k.zi);}
const W=Object.assign({},win('index.js'),win('grade_map.js'),win('pinyin_lookup.js'));
fs.writeFileSync(process.env.NHZ_SCAN_OUT||path.join(require('os').tmpdir(),'zika_all.json'),JSON.stringify({cards,index:W.NHZ_INDEX,grade:W.NHZ_GRADE_MAP,gmeta:W.NHZ_GRADE_META,py:W.NHZ_PINYIN,chars:JSON.parse(fs.readFileSync(path.join(SNAP,'chars.json')))}));
console.log(Object.keys(cards).length, Object.keys(W));
