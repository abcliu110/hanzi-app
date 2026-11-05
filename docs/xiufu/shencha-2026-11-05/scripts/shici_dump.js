// 将各数据文件加载为 JSON：node scripts/shici_dump.js  -> tmp/*.json
const fs=require('fs'),vm=require('vm'),path=require('path');
const S=path.join(__dirname,'../snap/newhanzi');
function load(f){const ctx={window:{},console};vm.createContext(ctx);let code=fs.readFileSync(path.join(S,f),'utf8');
 code=code.replace(/^\s*(var|let|const)\s+/gm,'globalThis.__v_=1;var ');vm.runInContext(code,ctx);return ctx;}
const out=path.join(__dirname,'../tmp');
let c=load('data/shici.js');fs.writeFileSync(out+'/shici.json',JSON.stringify(c.window.NHZ_SHICI));
c=load('data/shiju.js');fs.writeFileSync(out+'/shiju.json',JSON.stringify(c.window.NHZ_SHIJU));
c=load('data/shangxi.js');fs.writeFileSync(out+'/shangxi.json',JSON.stringify(c.window.NHZ_SHANGXI));
c=load('quiz/data_shici.js');fs.writeFileSync(out+'/quiz.json',JSON.stringify(c.window.NHZ_QUIZ));
c=load('games/shici/data_feihua.js');fs.writeFileSync(out+'/feihua.json',JSON.stringify({POEMS:c.POEMS,keys:Object.keys(c).filter(k=>!['window','console','__v_'].includes(k))}));
console.log('ok');
