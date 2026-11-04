#!/usr/bin/env python3
"""语法白板引擎自测（第 1 期新原语 E1–E14 + review / trunk；第 2 期 morph；第 3 期 nest）。

用法：python3 tools/wb/selftest.py [--shot /tmp/selftest.png]
检查：
  1. E1 属性时间线：同一词块两次 recolor 不再互相覆盖（修 §2.4）；fade 入 / 出接力
  2. E2 move：t0 前不隐藏、终点位置正确、弧线中点抬高
  3. E12 shake 结束后归位；E11 sink 后透明
  4. E14 术语占位按幕 lv 替换
  5. 所有新原语能画出、同一 t 两次渲染 SVG 一致
依赖：playwright + chromium。
"""
import asyncio, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', 'newhanzi'))

PAGE = """<!doctype html><html><head><meta charset="utf-8"></head><body style="width:1000px"><div id="box"></div>
<script src="file://%(r)s/wb/rough.js"></script><script src="file://%(r)s/wb/wb-engine.js"></script>
<script>if (!window.NHZWB_TERMS) window.NHZWB_TERMS = { zhu: { t: '主语', kid: '谁', s: '主', k: '谁' } };</script>
<script src="file://%(r)s/wb/terms.js" onerror="0"></script>
<script>
NHZWB.TPL._probe = function (c, q, d) {
  q.beat('探针', function (t) {
    var toks = c.sentence(200, ['小猫', '捉', '老鼠'], t, { size: 44, gap: 30 });
    window._g = toks[0].g;
    c.recolor(toks[0].g, 1, '#111111'); c.recolor(toks[0].g, 3, '#222222');
    var mv = c.G(function () { c.T(100, 400, '搬', { size: 40 }, t, .2); });
    window._mv = mv; c.move(mv, [{ t: 2, x: 300, y: 0, d: 1, arc: 40 }]);
    var sk = c.G(function () { c.T(800, 400, '摇', { size: 40 }, t, .2); }); window._sk = sk; c.shake(sk, 2, 1, 12, 4);
    var sn = c.G(function () { c.T(1000, 400, '沉', { size: 40 }, t, .2); }); window._sn = sn; c.sink(sn, 2, .8);
    var fd = c.G(function () { c.T(600, 500, '淡', { size: 30 }, t, .2); }); window._fd = fd; c.fade(fd, 1, .5); c.fade(fd, 3, .5, true);
    ['zhu', 'wei', 'bin'].forEach(function (k, i) { c.role(k, toks[i].x0, toks[i].x1, 200, t + i * .2, { size: 44 }); });
    c.role('ding', 100, 180, 300, t); c.role('zhuang', 300, 380, 300, t); c.role('bu', 500, 580, 300, t); c.role('bar', 700, 700, 300, t);
    c.gap(900, 300, 90, t, { phi: 1, sub: 'i', until: 3 }); c.hub(150, 120, 100, 60, t); c.guard(300, 380, 120, t);
    c.tag(600, 90, '{t:zhu}', t); c.strike(800, 900, 120, t); c.stair(100, 500, 470, [300], '主谓', t);
    c.state2(900, 500, '好好的', '碎了', t);
    return 1;
  });
};
NHZWB.add('_自测', { scenes: [
  { k: '_probe', lv: 2 },
  { k: 'review', lv: 2, task: '把“茂密的树林把太阳遮住了”改成被字句', answer: '太阳被树林遮住了', ok: false, diff: { miss: '茂密的' }, good: '太阳被茂密的树林遮住了', rule: '修饰的词要跟着名词一起搬。' },
  { k: 'review', lv: 1, task: '给“小猫捉老鼠”加一个“的”', answer: '胖胖的小猫捉老鼠', ok: true, rule: '“的”后面跟名词。' },
  { k: 'mark', lv: 2, s: ['小猫', '捉', '老鼠'], gap: 30, m: [{ i: 0, role: 'zhu', note: '{t:zhu|term}', tag: '动手的' }, { i: 1, role: 'wei', hub: 1 }] },
  { k: 'trunk', lv: 2, core: ['小猫', '捉', '老鼠'], role: ['zhu', 'wei', 'bin'], grow: [{ q: '哪只？', ins: ['胖胖', '的'], before: 0, role: 'ding' }, { q: '几只？', ins: ['三只'], before: 0, role: 'ding', at: 'far', keep: 1, why: 'num' }, { q: '怎样？', ins: ['得', '很快'], after: 1, role: 'bu' }] },
  { k: 'trunk', lv: 1, mode: 'prune', s: ['弟弟', '不', '喜欢', '吃', '香菜'], role: ['zhu', 'zhuang', 'wei', 'wei', 'bin'], keep: [{ i: 1, why: 'neg' }], tryCut: { i: 1, show: '弟弟喜欢吃香菜', say: '剪掉“不”，意思反了。' }, prune: { strike: 1 } },
  { k: 'morph', lv: 2, from: [{ id: 'A', w: ['茂密的', '树林'], tag: '动手的' }, { id: 'h1', w: ['把'], hub: 1 }, { id: 'B', w: ['太阳'], tag: '被动手的' }, { id: 'V', w: ['遮住了'] }], to: ['B', { id: 'h2', w: ['被'], hub: 1 }, 'A', 'V'], ask: '谁搬到前面？', wrongTry: { drop: ['茂密的'], say: '“茂密的”丢了。' }, roleTo: { B: 'zhu' }, state: { a: '太阳亮亮的', b: '太阳被挡住了', ok: true } },
  { k: 'morph', lv: 3, src: '自测', from: [{ id: 'P', w: ['在', '操场', '上'] }, { id: 'V', w: ['跑'] }, { id: 'O', w: ['步'] }], to: [{ w: ['把'], hub: 1 }, 'O', 'V', 'P'], ok: false, say: '不能说。' },
  { k: 'nest', lv: 2, style: 'box', s: ['妈妈', '买', '的', '新', '书包'], tree: ['pz', ['de', ['zw', 0, 1], 2], ['pz', 3, 4]], ask: '先装哪两个？' },
  { k: 'nest', lv: 3, style: 'stair', src: '自测', s: ['妈妈', '买', '的', '新', '书包'], tree: ['pz', ['de', ['zw', 0, 1], 2], ['pz', 3, 4]] },
  { k: 'nest', lv: 3, style: 'stair', src: '自测', s: ['表扬', '班长', '的', '老师'], reads: [{ tree: ['pz', ['de', ['db', 0, 1], 2], 3], pic: { t: '说的是一位老师' } }, { tree: ['db', 0, ['pz', ['de', 1, 2], 3]], pic: { t: '说的是表扬谁' } }] }
] });
window.P = NHZWB.mount(document.getElementById('box'), '_自测');
</script></body></html>"""

JS = r"""() => {
  const out = [], P = window.P;
  const fill = t => (P.seek(0, t), window._g.querySelector('text').getAttribute('fill'));
  if (fill(0.5) !== '#2c3328') out.push('recolor 前应为墨色，得 ' + fill(0.5));
  if (fill(2) !== '#111111') out.push('E1 失败：t=2 应保持第一次 recolor 色，得 ' + fill(2));
  if (fill(4) !== '#222222') out.push('t=4 应为第二次 recolor 色，得 ' + fill(4));
  const tr = t => (P.seek(0, t), window._mv.getAttribute('transform'));
  if (tr(1) !== 'translate(0,0)') out.push('move t0 前应在原位：' + tr(1));
  if (window._mv.style.display === 'none') out.push('move 不应隐藏');
  if (tr(3.5) !== 'translate(300,0)') out.push('move 终点：' + tr(3.5));
  if (!/translate\(150,-40\)/.test(tr(2.5))) out.push('move 弧线中点：' + tr(2.5));
  P.seek(0, 3.5); if (window._sk.getAttribute('transform') !== 'translate(0,0)') out.push('shake 未归位：' + window._sk.getAttribute('transform'));
  P.seek(0, 2.4); if (window._sk.getAttribute('transform') === 'translate(0,0)') out.push('shake 期间应有位移');
  P.seek(0, 3.5); if (window._sn.style.opacity !== '0') out.push('sink 后应透明：' + window._sn.style.opacity);
  const op = t => (P.seek(0, t), window._fd.style.opacity);
  if (op(0.5) !== '0' || op(2) !== '1' || op(4) !== '0') out.push('fade 接力：' + [op(0.5), op(2), op(4)]);
  for (let i = 0; i < P.durations().length; i++) {
    const d = P.durations()[i];
    P.seek(i, 0); P.seek(i, d * .6); const a = P.svg.innerHTML; P.seek(i, 0); P.seek(i, d * .6);
    if (a !== P.svg.innerHTML) out.push('第' + (i + 1) + '幕不确定');
  }
  /* E9 三档 */
  try { localStorage.removeItem('nhz_wb_lv'); } catch (e) {}
  NHZWB.add('_档位', { scenes: [ { k: 'title', t: '档' }, { k: 'steps', items: ['一'], tab: 'a' }, { k: 'steps', lv: 2, items: ['二'], tab: 'b' }, { k: 'steps', lv: 3, src: '待核', items: ['三'], tab: 'c' }, { k: 'end', kj: '完' } ] });
  const bx = document.createElement('div'); document.body.appendChild(bx);
  let Q = NHZWB.mount(bx, '_档位');
  const ntab = () => bx.querySelectorAll('.wb-tabs button').length;
  if (Q.level() !== 2 || ntab() !== 4) out.push('默认应为「中」且 4 幕：' + Q.level() + '/' + ntab());
  if (!/还有 1 幕/.test(bx.querySelector('.wb-more').textContent)) out.push('提示「深一点还有 1 幕」缺失');
  bx.querySelector('.wb-lv [data-lv="1"]').click();
  if (ntab() !== 3 || localStorage.getItem('nhz_wb_lv') !== '1') out.push('浅档应 3 幕并存档：' + ntab());
  bx.querySelector('.wb-lv [data-lv="3"]').click();
  if (ntab() !== 5) out.push('深档应 5 幕：' + ntab());
  if (bx.querySelector('.wb-tabs button:nth-child(4)').textContent.indexOf('4 c') !== 0) out.push('标签序号应按可见幕计');
  Q.destroy(); Q = NHZWB.mount(bx, '_档位');
  if (Q.level() !== 3) out.push('重新挂载应记住档位');
  const hb = [...bx.querySelectorAll('.wb-lv button')].map(b => b.getBoundingClientRect().height);
  if (hb.some(h => h < 44)) out.push('档位按钮高度 < 44：' + hb);
  Q.destroy(); bx.remove(); try { localStorage.removeItem('nhz_wb_lv'); } catch (e) {}
  /* trunk：「三只」排在最外（far），「得很快」在动词后；收尾只剩骨架 + 受保护的数量词 */
  P.seek(4, P.durations()[4]);
  const vis = [...P.svg.querySelectorAll('text')].filter(t => { let e = t; while (e && e !== P.svg) { if (e.style && (e.style.display === 'none' || e.style.opacity === '0')) return false; e = e.parentNode; } return true; });
  const order = vis.filter(t => t.getAttribute('font-size') === '44').map(t => [t.getBoundingClientRect().left, t.textContent]).sort((a, b) => a[0] - b[0]).map(x => x[1]).join(' ');
  if (order !== '三只 小猫 捉 老鼠') out.push('trunk 收尾骨架应为「三只 小猫 捉 老鼠」，得「' + order + '」');
  P.seek(4, P.durations()[4] * .72);
  /* morph：收尾语序、定语跟着名词走、失败后退回原样且 ✗ 收起 */
  const order44 = i => { P.seek(i, P.durations()[i]); return [...P.svg.querySelectorAll('text')].filter(t => { let e = t; while (e && e !== P.svg) { if (e.style && (e.style.display === 'none' || e.style.opacity === '0')) return false; e = e.parentNode; } return t.getAttribute('font-size') === '44'; }).map(t => [t.getBoundingClientRect().left, t.textContent]).sort((a, b) => a[0] - b[0]).map(x => x[1]).join(' '); };
  if (order44(6) !== '太阳 被 茂密的 树林 遮住了') out.push('morph 收尾应为「太阳 被 茂密的 树林 遮住了」，得「' + order44(6) + '」');
  if (order44(7) !== '在 操场 上 跑 步') out.push('morph 失败后应退回原句，得「' + order44(7) + '」');
  P.seek(0, 9); if (P.svg.innerHTML.indexOf('主语（谁 / 什么）') < 0) out.push('E14：lv2 幕 tag 应显示「主语（谁 / 什么）」');
  P.seek(3, 99); if (P.svg.innerHTML.indexOf('>主语<') < 0) out.push('E14：|term 应显示「主语」');
  /* nest（第 3 期）：box 由内向外——结构名越外层越靠下；stair 一层一行往下；一句两图点亮当前卡 */
  const labY = (i, lab, fs) => { P.seek(i, P.durations()[i]); return [...P.svg.querySelectorAll('text')].filter(t => t.textContent === lab && t.getAttribute('font-size') === fs).map(t => +t.getAttribute('y')).sort((a, b) => a - b); };
  const zw = labY(8, '主谓', '20'), de = labY(8, '的字', '20'), pz = labY(8, '偏正', '20');
  if (zw.length !== 1 || de.length !== 1 || pz.length !== 2) out.push('nest box 结构名个数不对：' + [zw, de, pz]);
  else if (!(zw[0] < de[0] && de[0] < pz[1] && pz[0] < de[0])) out.push('nest box 结构名应由内向外下移：' + [zw, de, pz]);
  const szw = labY(9, '主谓', '26'), sde = labY(9, '的字', '26'), spz = labY(9, '偏正', '26');
  if (!(szw.length === 1 && sde.length === 1 && spz.length === 2 && spz[0] < sde[0] && sde[0] < szw[0] && spz[1] === sde[0])) out.push('nest stair 应一层一行往下：' + [spz, sde, szw]);
  const pics = () => [...P.svg.querySelectorAll('[data-pic]')];
  P.seek(10, P.durations()[10]); const pe = pics().map(g => g.style.opacity || '1');
  if (pe.length !== 2 || pe.some(o => o !== '1')) out.push('一句两图收尾两卡应全亮：' + pe);
  const mid = P.durations()[10] * .75; P.seek(10, 0); P.seek(10, mid); const pm = pics().map(g => g.style.opacity || '1');
  if (!(pm[0] === '0.35' && pm[1] === '1')) out.push('一句两图第二种装法时应点亮第二张、第一张变灰：' + pm);
  return out;
}"""


async def main():
    from playwright.async_api import async_playwright
    shot = None
    if '--shot' in sys.argv: shot = sys.argv[sys.argv.index('--shot') + 1]
    tmp = '/tmp/wb_selftest.html'
    open(tmp, 'w', encoding='utf-8').write(PAGE % {'r': ROOT})
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1000, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'terms.js' not in m.text and 'ERR_FILE_NOT_FOUND' not in m.text and errs.append(m.text))
        await pg.goto('file://' + tmp)
        out = errs + (await pg.evaluate(JS) if not errs else [])
        if shot:
            for i, f in enumerate([9, 99, 99, 99]):
                await pg.evaluate('([i,t]) => P.seek(i,t)', [i, f])
                await pg.locator('#box').screenshot(path=shot.replace('.png', '_%d.png' % i))
        await br.close()
    print(('✗ 自测失败：\n  ' + '\n  '.join(out)) if out else '✓ 引擎自测全部通过')
    sys.exit(1 if out else 0)


asyncio.run(main())
