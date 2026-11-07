#!/usr/bin/env node
/* 逻辑一分钟（A22-8，docs/gaijin/luoji-gaijin-sheji.md P1-5）题池生成器。
 *
 * 句子与解析一律从 yuwen/data.js 逻辑区按「专题名 + 例句解析序号」逐字取出，不手写：
 *   s  = 例句解析[i].句 去掉开头标签（错：/错例：/滑坡：…）和会泄露答案的括号提示后的原文子串；
 *   ex = 例句解析[i].析 原文；
 *   a  = 该专题名（短名），言外之意题的 a 取自 析 原文子串；
 *   d  = 两个干扰项：其他专题短名（人工挑选，避开与答案相近、可能同样成立的谬误名，见 PICKS 注释）；
 *        言外之意题的干扰项是字面意思 / 反面意思（玩法所需，不是事实性内容）。
 * 「对 / 合理 / 不算 / 不是倒置」这类正例不进题池（每日一句只做“找毛病”）。
 *
 * 用法：
 *   node tools/content/build_logic_daily.js           # 生成 games/luoji/daily_data.js
 *   node tools/content/build_logic_daily.js --check   # 只校验：原文仍在、生成结果与仓库文件一致（不一致退出码 1）
 */
'use strict';
var fs = require('fs'), path = require('path');
var ROOT = path.resolve(__dirname, '..', '..');
var OUT = path.join(ROOT, 'games', 'luoji', 'daily_data.js');

global.window = {};
require(path.join(ROOT, 'yuwen', 'data.js'));
var LOGIC = global.window.NHZ_YUWEN.logic;
var TOPICS = {};
LOGIC.categories.forEach(function (c) { c.items.forEach(function (it) { TOPICS[it.name] = it; }); });

/* 专题全名 → 选项里显示的短名 */
var SHORT = { '诉诸众人：大家都这样': '诉诸众人', '诉诸权威：名人说的就对？': '诉诸权威' };
function short(n) { return SHORT[n] || n; }

/* t 专题，i 例句解析序号，cut 要从句子里去掉的提示（前缀标签 / 括号说明），
 * as 答案专题（默认 = t；常见谬误总专题里的例句按其小标题归到对应专题），d 干扰项专题。
 * 言外之意题：q 问句、a 取自 析 的原文、d 字面 / 反面。 */
var PICKS = [
  { t: '自相矛盾', i: 0, cut: ['错：'], d: ['主客倒置', '强加因果'] },
  { t: '自相矛盾', i: 1, cut: ['错：', '（“将近”是不到三十，“多”是超过三十，自相矛盾）'], d: ['以偏概全', '主客倒置'] },
  { t: '自相矛盾', i: 3, cut: ['错：'], d: ['强加因果', '偷换概念'] },
  { t: '自相矛盾', i: 4, cut: ['错：'], d: ['主客倒置', '循环论证'] },
  { t: '主客倒置', i: 0, cut: ['错：'], d: ['自相矛盾', '偷换概念'] },
  { t: '主客倒置', i: 1, cut: ['错：'], d: ['强加因果', '自相矛盾'] },
  { t: '主客倒置', i: 2, cut: ['错：'], d: ['以偏概全', '循环论证'] },
  /* 北方人：不放「以偏概全」（地域偏见也可说成以偏概全） */
  { t: '强加因果', i: 0, cut: ['错：', '（地域推不出思想）'], d: ['主客倒置', '循环论证'] },
  { t: '强加因果', i: 3, cut: ['错：'], d: ['主客倒置', '以偏概全'] },
  /* 公鸡：不放「相关不等于因果」（同样成立） */
  { t: '强加因果', i: 4, cut: ['错：'], d: ['以偏概全', '循环论证'] },
  { t: '以偏概全', i: 0, cut: ['错：'], d: ['强加因果', '滑坡谬误'] },
  /* 天鹅：不放「幸存者偏差」 */
  { t: '以偏概全', i: 2, cut: ['错：'], d: ['循环论证', '主客倒置'] },
  { t: '偷换概念', i: 0, cut: [], d: ['循环论证', '稻草人谬误'] },
  { t: '偷换概念', i: 1, cut: [], d: ['循环论证', '诉诸人身'] },
  { t: '偷换概念', i: 2, cut: [], d: ['滑坡谬误', '诉诸权威：名人说的就对？'] },
  { t: '稻草人谬误', i: 0, cut: [], d: ['诉诸人身', '循环论证'] },
  /* 值日轮流：不放「诉诸人身」（“就是想让别人替他干活”也带猜动机） */
  { t: '稻草人谬误', i: 1, cut: [], d: ['循环论证', '赌徒谬误'] },
  { t: '诉诸人身', i: 0, cut: [], d: ['循环论证', '非黑即白'] },
  { t: '非黑即白', i: 0, cut: [], d: ['循环论证', '诉诸权威：名人说的就对？'] },
  { t: '循环论证', i: 0, cut: [], d: ['偷换概念', '诉诸众人：大家都这样'] },
  { t: '循环论证', i: 1, cut: [], d: ['诉诸权威：名人说的就对？', '非黑即白'] },
  { t: '转移话题', i: 0, cut: [], d: ['稻草人谬误', '循环论证'] },
  /* 汤不烫：不放「偷换概念」 */
  { t: '转移话题', i: 1, cut: [], d: ['循环论证', '诉诸众人：大家都这样'] },
  /* 全班选C：不放「诉诸权威」 */
  { t: '诉诸众人：大家都这样', i: 0, cut: ['错例：'], d: ['循环论证', '赌徒谬误'] },
  { t: '诉诸权威：名人说的就对？', i: 0, cut: ['错例：', '（跑步冠军不是研究恐龙的行家）'], d: ['滑坡谬误', '偷换概念'] },
  { t: '滑坡谬误', i: 0, cut: ['错例：'], d: ['赌徒谬误', '诉诸人身'] },
  { t: '常见谬误', i: 0, as: '滑坡谬误', cut: ['滑坡：', '（可能变必然）'], d: ['以偏概全', '循环论证'] },
  { t: '常见谬误', i: 1, as: '稻草人谬误', cut: ['稻草人：', '（曲解后再打）'], d: ['循环论证', '赌徒谬误'] },
  { t: '常见谬误', i: 3, as: '转移话题', cut: ['跑题区·转移话题：'], d: ['循环论证', '幸存者偏差'] },
  /* 冰淇淋：不放「强加因果」 */
  { t: '相关不等于因果', i: 0, cut: ['错例：', '（真正的原因是天热：天热买冰淇淋的人多，下水游泳的人也多）'], d: ['以偏概全', '赌徒谬误'] },
  /* 幸存者偏差两句：不放「以偏概全」 */
  { t: '幸存者偏差', i: 0, cut: ['错例：', '（不结实的早就坏了、扔了，留下来的当然是结实的）'], d: ['赌徒谬误', '诉诸权威：名人说的就对？'] },
  { t: '幸存者偏差', i: 1, cut: ['错例：', '（没飞回来的鸽子，我们根本看不到）'], d: ['赌徒谬误', '循环论证'] },
  { t: '赌徒谬误', i: 0, cut: ['错例：'], d: ['幸存者偏差', '诉诸众人：大家都这样'] },
  { t: '言外之意', i: 0, cut: ['（=不好吃）'], q: '这句话的言外之意是？', a: '蛋糕不好吃，不好意思直说', d: ['盘子很漂亮', '蛋糕很好吃'] },
  { t: '言外之意', i: 1, cut: ['（=乱得不行，反话）'], q: '这句话的言外之意是？', a: '乱得不行，快收拾', d: ['房间很整洁', '妈妈在问房间整不整洁'] },
  { t: '言外之意', i: 3, cut: [], q: '这句话的言外之意是？', a: '数学大概不怎么样', d: ['他字写得很工整', '小明数学很好'] }
];

function build() {
  var errs = [], items = [];
  PICKS.forEach(function (p, k) {
    var tp = TOPICS[p.t];
    if (!tp) { errs.push('#' + k + ' 专题不存在：' + p.t); return; }
    var ex = (tp['例句解析'] || [])[p.i];
    if (!ex) { errs.push('#' + k + ' ' + p.t + ' 例句解析[' + p.i + '] 不存在'); return; }
    var s = String(ex['句']);
    (p.cut || []).forEach(function (c) {
      if (s.indexOf(c) < 0) errs.push('#' + k + ' ' + p.t + '[' + p.i + '] 句中找不到要去掉的提示：' + c);
      s = s.split(c).join('');
    });
    s = s.trim();
    if (!/[。！？”"']$/.test(s)) s += '。';
    var srcPlain = String(ex['句']);
    var core = s.replace(/。$/, '');
    if (srcPlain.indexOf(core) < 0 && srcPlain.replace(/\s+$/, '').indexOf(core) < 0) {
      /* 去掉的提示在句中间时，逐段核对 */
      var parts = core.split(/[，、]/).filter(Boolean);
      parts.forEach(function (pt) { if (srcPlain.indexOf(pt) < 0) errs.push('#' + k + ' 句子片段不在原文：' + pt); });
    }
    var ans, opts, q;
    if (p.q) {
      q = p.q; ans = p.a;
      if (String(ex['析']).indexOf(ans) < 0 && srcPlain.indexOf(ans) < 0) errs.push('#' + k + ' 言外之意答案不在原文：' + ans);
      opts = [ans].concat(p.d);
    } else {
      q = '这句话犯了什么毛病？';
      var aName = p.as || p.t;
      if (!TOPICS[aName]) errs.push('#' + k + ' 答案专题不存在：' + aName);
      p.d.forEach(function (x) {
        if (!TOPICS[x]) errs.push('#' + k + ' 干扰项专题不存在：' + x);
        if (x === aName) errs.push('#' + k + ' 干扰项与答案相同：' + x);
      });
      ans = short(aName);
      opts = [ans].concat(p.d.map(short));
    }
    items.push({ s: s, q: q, a: ans, opts: opts, ex: String(ex['析']), point: p.as || p.t, src: p.t, ref: p.t + ' · 例句解析 ' + (p.i + 1) });
  });
  return { errs: errs, items: items };
}

function render(items) {
  return '/* 由 tools/content/build_logic_daily.js 生成，勿手改。逻辑一分钟（A22-8）题池：\n' +
    ' * 句子与解析逐字取自 yuwen/data.js 逻辑区各专题「例句解析」（ref 注明专题与序号）；opts[0] 为正确答案，页面按日期打乱。 */\n' +
    'window.NHZ_LOGIC_DAILY = ' + JSON.stringify({ items: items }, null, 1) + ';\n';
}

var r = build();
if (r.errs.length) { console.error(r.errs.join('\n')); process.exit(1); }
var text = render(r.items);
if (process.argv.indexOf('--check') >= 0) {
  var cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== text) { console.error('games/luoji/daily_data.js 与 yuwen/data.js 不一致，请重跑 node tools/content/build_logic_daily.js'); process.exit(1); }
  console.log('逻辑一分钟题池校验通过：' + r.items.length + ' 句');
} else {
  fs.writeFileSync(OUT, text);
  console.log('已生成 games/luoji/daily_data.js：' + r.items.length + ' 句');
}
