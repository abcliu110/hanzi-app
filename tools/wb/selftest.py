#!/usr/bin/env python3
"""语法白板引擎自测（第 1 期新原语 E1–E14 + review 模板）。

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
  { k: 'mark', lv: 2, s: ['小猫', '捉', '老鼠'], gap: 30, m: [{ i: 0, role: 'zhu', note: '{t:zhu|term}', tag: '动手的' }, { i: 1, role: 'wei', hub: 1 }] }
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
  for (let i = 0; i < 4; i++) {
    const d = P.durations()[i];
    P.seek(i, 0); P.seek(i, d * .6); const a = P.svg.innerHTML; P.seek(i, 0); P.seek(i, d * .6);
    if (a !== P.svg.innerHTML) out.push('第' + (i + 1) + '幕不确定');
  }
  P.seek(0, 9); if (P.svg.innerHTML.indexOf('主语（谁）') < 0) out.push('E14：lv2 幕 tag 应显示「主语（谁）」');
  P.seek(3, 99); if (P.svg.innerHTML.indexOf('>主语<') < 0) out.push('E14：|term 应显示「主语」');
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
