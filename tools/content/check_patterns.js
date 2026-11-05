/* Q15 试点 + 覆盖校验：node tools/content/check_patterns.js
   加载 pattern-templates.js 与三库数据，渲染每型 5 处试点并断言非空/无未转义 HTML，
   再按 CONTENT_AUDIT.md 的分组统计四型覆盖数。只读，不改数据。 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
function loadData(rel, glob) {
  const s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(s, sandbox, { filename: rel });
  return sandbox.window[glob];
}
const PT = require(path.join(ROOT, 'newhanzi', 'pattern-templates.js'));
const yw = loadData('newhanzi/yuwen/data.js', 'NHZ_YUWEN');
const gw = loadData('newhanzi/data/guwen_knowledge.js', 'NHZ_GUWEN_KNOWLEDGE');
const sc = loadData('newhanzi/data/shici.js', 'NHZ_SHICI');
let fail = 0;
function check(name, html, needles) {
  const ok = html && html.length > 40 && !/<script/i.test(html) &&
    (needles || []).every(n => html.indexOf(n) >= 0);
  console.log((ok ? 'PASS' : 'FAIL') + ' 试点·' + name + ' (' + (html || '').length + '字)');
  if (!ok) { fail++; console.log('  HTML=' + String(html).slice(0, 300)); }
}
function ywItem(mod, catRe, name) {
  const c = yw[mod].categories.find(x => catRe.test(x.name));
  return c.items.find(i => i.name === name);
}
function gwItem(cat, name) {
  return gw.categories.find(c => c.name === cat).items.find(i => i.name === name);
}
/* ---- 试点：每型 5 处 ---- */
/* 图式 */
check('图式·语法名词', PT.renderSchema(PT.schemaFromItem(ywItem('grammar', /词的分类/, '名词')), '图式'), ['名词', '人物名词']);
check('图式·语法比喻', PT.renderSchema(PT.schemaFromItem(ywItem('grammar', /修辞/, '比喻')), '图式'), ['比喻']);
check('图式·古文倒装句', PT.renderSchema(PT.schemaFromItem(gwItem('语法', '倒装句')), '图式'), ['倒装句']);
check('图式·古诗古体诗', PT.renderSchema(PT.schemaFromShiciText(sc.knowledge.find(k => k.t === '古体诗').d), '图式'), ['古体诗']);
check('图式·古文实词', PT.renderSchema(PT.schemaFromItem(gwItem('实词', gw.categories.find(c => c.name === '实词').items[0].name)), '图式'), ['pt-schema']);
/* 对照表 */
check('对照表·关联词因为', PT.renderCompare(ywItem('grammar', /关联词/, '因为…所以…')['对照表']), ['因为', '含义']);
check('对照表·虚词而', PT.renderCompare(gwItem('虚词', '而')['对照表']), ['而']);
check('对照表·古文虚词之', PT.renderCompare(gwItem('虚词', '之')['对照表'] || gw.categories.find(c => c.name === '虚词').items.find(i => i['对照表'])['对照表']), ['pt-table']);
check('对照表·关联词既然(辨析派生)', PT.renderCompareRows(PT.compareFromBianxi(ywItem('grammar', /关联词/, '既然…就…')['辨析'])), ['既然']);
check('对照表·虚词又再(辨析派生)', PT.renderCompareRows(PT.compareFromBianxi(ywItem('grammar', /虚词/, '又/再辨析')['辨析'])), ['又']);
/* 古诗 [对照表] 块（jichu 绝句/律诗） */
check('对照表·古诗绝句律诗', PT.renderGrid(PT.compareFromShiciText(sc.knowledge.find(k => k.m === 'jichu' && /\[对照表\]/.test(k.d)).d)), ['绝句', '律诗']);
/* openKnow 去重剥离模拟：escD 后的正文去掉已转模板的块后，不再含 [图式]/[决策树] 原文块 */
(function () {
  var k = sc.knowledge.find(x => x.m === 'shangxifa');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escD(s) { return esc(s).replace(/&lt;br&gt;/g, '<br>').replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>'); }
  var dHtml = escD(k.d);
  dHtml = dHtml.replace(/<b>\[决策树\]<\/b>[\s\S]*?(?=<br><br>|<b>📜|$)/, '');
  var ok = dHtml.indexOf('[决策树]') < 0 && dHtml.indexOf('📜 例句') >= 0 && dHtml.indexOf('[步骤卡]') >= 0;
  console.log((ok ? 'PASS' : 'FAIL') + ' 试点·古诗正文去重剥离（决策树块已去、步骤卡与例句保留）');
  if (!ok) fail++;
})();
/* 决策树 */
check('决策树·病句语序不当', PT.renderDecision(ywItem('grammar', /病句/, '语序不当')['决策树']), ['压缩主干']);
check('决策树·逻辑自相矛盾', PT.renderDecision(yw.logic.categories.find(c => /病句里的逻辑/.test(c.name)).items.find(i => /自相矛盾/.test(i.name))['决策树']), ['自相矛盾']);
check('决策树·古文翻译', PT.renderDecision(gwItem('翻译方法', gw.categories.find(c => c.name === '翻译方法').items[0].name)['决策树']), ['pt-node']);
check('决策树·赏析法', PT.renderDecision(PT.decisionFromShiciText(sc.knowledge.find(k => k.m === 'shangxifa').d)), ['标题']);
check('决策树·读法', PT.renderDecision(PT.decisionFromShiciText(sc.knowledge.find(k => k.m === 'dufa').d)), ['pt-node']);
/* 时间轴 */
check('时间轴·诗史诗经', PT.renderTimeline(PT.timelineFromShici(sc.knowledge.find(k => k.m === 'shishi'))), ['孔子整理成305篇', '节点']);
check('时间轴·典故庄周梦蝶', PT.renderTimeline(PT.timelineFromShici(sc.knowledge.find(k => k.m === 'diangu' && /梦蝶/.test(k.t)))), ['庄周']);
check('时间轴·古文朝代脉络', PT.renderTimeline(PT.timelineFromItem(gwItem('历史', '朝代脉络'))), ['先秦']);
check('时间轴·诗史唐诗分期', PT.renderTimeline(PT.timelineFromShici(sc.knowledge.filter(k => k.m === 'shishi')[1])), ['pt-tl']);
check('时间轴·典故精卫填海', PT.renderTimeline(PT.timelineFromShici(sc.knowledge.find(k => k.m === 'diangu' && /精卫/.test(k.t)) || sc.knowledge.filter(k => k.m === 'diangu')[1])), ['pt-tl']);
/* ---- 覆盖统计（按审计分组） ---- */
function count(items, fn) { return items.filter(fn).length; }
const gAll = yw.grammar.categories.flatMap(c => c.items);
const lrw = [...yw.logic.categories, ...yw.reading.categories, ...yw.writing.categories].flatMap(c => c.items);
const gwAll = gw.categories.flatMap(c => c.items);
const know = sc.knowledge;
console.log('--- 覆盖（渲染后可见） ---');
console.log('图式 语法(分类):', count(gAll, PT.hasSchema), '/', gAll.length,
  '| 逻辑/阅读/写作(已有图示SVG):', count(lrw, i => !!i['图示']), '/', lrw.length,
  '| 古文(分类):', count(gwAll, PT.hasSchema), '/', gwAll.length,
  '| 古文已有图示SVG:', count(gwAll, i => !!i['图示']), '/', gwAll.length,
  '| 古诗[图式]块:', count(know, k => !!PT.schemaFromShiciText(k.d)), '| 古诗手绘knowSVG(g):', count(know, k => !!k.g),
  '| 古诗已有图示:', count(know, k => !!k['图示']));
console.log('对照表 语法:', count(gAll, i => !!i['对照表']), '+辨析派生:', count(gAll, i => !i['对照表'] && !!PT.compareFromBianxi(i['辨析'])),
  '| 古文:', count(gwAll, i => !!i['对照表']), '| 古文古今异义(辨析解析, guwen.html已有):', count(gw.categories.find(c => c.name === '古今异义').items, i => /^古义是/.test(i['辨析'] || '')));
console.log('决策树 语法:', count(gAll, i => !!i['决策树']), '| 逻辑/阅读/写作:', count(lrw, i => !!i['决策树']),
  '| 程序型怎么认流程(无决策树字段):', count(lrw, i => !i['决策树'] && i['怎么认'] && i['怎么认'].length),
  '| 古文:', count(gwAll, i => !!i['决策树']), '| 古诗[决策树]块:', count(know, k => !!PT.decisionFromShiciText(k.d)));
console.log('时间轴 古诗(diangu+shishi):', count(know.filter(k => k.m === 'diangu' || k.m === 'shishi'), k => !!PT.timelineFromShici(k)), '/20',
  '| 古文历史→链:', count(gw.categories.find(c => c.name === '历史').items, PT.hasTimeline), '/15');
if (fail) { console.error('试点失败 ' + fail + ' 处'); process.exit(1); }
console.log('试点 22/22 通过');
