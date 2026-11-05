// 载入古文全部数据为 JSON：node guwen_load.js > /tmp/guwen_all.json
const fs=require('fs'),vm=require('vm'),path=require('path');
const S=process.env.SNAP||'/workspace/work/hanzi-audit/snap/newhanzi';
const ctx={window:{}};vm.createContext(ctx);
const files=['data/guwen.js','data/guwen_knowledge.js','quiz/data_guwen.js',...fs.readdirSync(S+'/guwen').filter(f=>f.startsWith('quiz_bank_guwen_')).map(f=>'guwen/'+f)];
for(const f of files){vm.runInContext(fs.readFileSync(path.join(S,f),'utf8'),ctx,{filename:f});}
const banks={};for(const [k,v] of Object.entries(ctx.window.NHZ_GUWEN_BANK)) banks[k]=v;
process.stdout.write(JSON.stringify({texts:ctx.window.NHZ_GUWEN.texts,guwen_extra:Object.keys(ctx.window.NHZ_GUWEN),kn:ctx.window.NHZ_GUWEN_KNOWLEDGE,quiz:ctx.window.NHZ_QUIZ,banks}));
