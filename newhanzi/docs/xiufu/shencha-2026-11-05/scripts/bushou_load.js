// 加载部首/题库数据的公共函数
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=process.env.SNAP||'/workspace/work/hanzi-audit/snap/newhanzi';
function load(files){const ctx={window:{}};ctx.self=ctx.window;vm.createContext(ctx);
 for(const f of files){vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});}
 return ctx.window;}
module.exports={load,ROOT};
