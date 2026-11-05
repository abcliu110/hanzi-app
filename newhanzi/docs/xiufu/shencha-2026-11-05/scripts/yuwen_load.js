// 公共加载器：把快照里的语法/逻辑/阅读写作数据载入为对象
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT='/workspace/work/hanzi-audit/snap/newhanzi';
function run(file,ctx){ctx=ctx||{};ctx.window=ctx.window||ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});return ctx;}
function banks(){const out=[];for(const f of fs.readdirSync(ROOT+'/yuwen').filter(f=>/^quiz_bank_.*\.js$/.test(f)&&f!=='quiz_bank_index.js').sort()){const c=run('yuwen/'+f);const B=c.NHZ_GRAMMAR_BANK||{};for(const k in B){out.push({file:'yuwen/'+f,point:k,bank:B[k]});}
 for(const g of Object.keys(c)) if(g!=='window'&&g!=='NHZ_GRAMMAR_BANK') out.push({file:'yuwen/'+f,point:'?'+g,bank:c[g]});}return out;}
function quiz(name){return run('quiz/'+name).NHZ_QUIZ;}
function yuwen(){return run('yuwen/data.js').NHZ_YUWEN;}
module.exports={ROOT,run,banks,quiz,yuwen};
