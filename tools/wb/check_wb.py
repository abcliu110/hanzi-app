#!/usr/bin/env python3
"""语法白板动画检查（规范 docs/anim/baiban-yufa-guifan.md）。

用法：
  python3 tools/wb/check_wb.py 名词            # 检查一个语法点
  python3 tools/wb/check_wb.py --all           # 检查 wb/index.js 里全部
  python3 tools/wb/check_wb.py 名词 --sheet out.jpg   # 另出总览截图（每幕 3 帧，不入库）

检查项（任一不过退出码 1）：
  1. 页面无报错（pageerror / console.error）
  2. 每幕在 0.1 秒到结束每 0.5 秒渲染一帧，无异常
  3. 每幕结束帧：所有文字在画布内（1200×560），文字之间不重叠（交叠面积 > 较小者 25% 记为重叠）
  4. 确定性：同一 t 渲染两次，SVG 内容一致
依赖：pip install playwright pillow && python3 -m playwright install chromium
字体：若设置环境变量 WB_FONT=某 .ttf（如霞鹜文楷），截图用它；否则用系统字体。
"""
import asyncio, json, os, re, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'newhanzi'))


def index():
    s = open(os.path.join(ROOT, 'wb', 'index.js'), encoding='utf-8').read()
    return dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', s))


def harness(name, fid):
    font = os.environ.get('WB_FONT')
    ff = ("@font-face{font-family:'LXGW WenKai';src:url('file://%s')}" % font) if font else ''
    return """<!doctype html><html><head><meta charset="utf-8"><style>%s body{margin:0;width:1000px;font-family:sans-serif}</style></head>
<body><div id="box"></div>
<script src="file://%s/wb/rough.js"></script><script src="file://%s/wb/wb-engine.js"></script><script src="file://%s/wb/s/%s.js"></script>
<script>window.P = NHZWB.mount(document.getElementById('box'), %s);</script></body></html>""" % (ff, ROOT, ROOT, ROOT, fid, json.dumps(name, ensure_ascii=False))


JS_CHECK = r"""(i) => {
  const svg = window.P.svg, W = 1200, H = 560, out = [];
  const texts = [...svg.querySelectorAll('text')].filter(t => {
    let e = t; while (e && e !== svg) { if (e.style && (e.style.display === 'none' || e.style.opacity === '0')) return false; e = e.parentNode; }
    return t.textContent.trim();
  });
  const R = svg.getBoundingClientRect(), k = W / R.width;
  const bb = texts.map(t => { const b = t.getBoundingClientRect(); return { s: t.textContent, x: (b.left - R.left) * k, y: (b.top - R.top) * k, w: b.width * k, h: b.height * k }; });
  bb.forEach(b => { if (b.x < -2 || b.y < -2 || b.x + b.w > W + 2 || b.y + b.h > H + 2) out.push('出框：' + b.s); });
  for (let a = 0; a < bb.length; a++) for (let b = a + 1; b < bb.length; b++) {
    const A = bb[a], B = bb[b];
    const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)), iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
    if (ix * iy > 0.25 * Math.min(A.w * A.h, B.w * B.h)) out.push('重叠：' + A.s + ' / ' + B.s);
  }
  return out;
}"""


async def check(pg, name, fid, sheet):
    from playwright.async_api import Error
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    tmp = '/tmp/wb_%s.html' % fid
    open(tmp, 'w', encoding='utf-8').write(harness(name, fid))
    await pg.goto('file://' + tmp)
    probs, shots = [], []
    if errs:
        return ['页面报错：' + e for e in errs], shots, []
    durs = await pg.evaluate('P.durations()')
    for i, d in enumerate(durs):
        t = 0.1
        while t < d:
            await pg.evaluate('([i,t]) => P.seek(i,t)', [i, t])
            t += 0.5
        await pg.evaluate('([i,t]) => P.seek(i,t)', [i, d])
        for p in await pg.evaluate(JS_CHECK, i):
            probs.append('第%d幕 %s' % (i + 1, p))
        a = await pg.evaluate('([i,t]) => (P.seek(i,t), P.svg.innerHTML)', [i, d * .6])
        b = await pg.evaluate('([i,t]) => (P.seek(i,0), P.seek(i,t), P.svg.innerHTML)', [i, d * .6])
        if a != b:
            probs.append('第%d幕 不确定：同一 t 两次渲染不同' % (i + 1))
        if sheet:
            for k, tt in enumerate([d * .35, d * .7, d]):
                await pg.evaluate('([i,t]) => P.seek(i,t)', [i, tt])
                f = '/tmp/wb_%s_%d_%d.png' % (fid, i, k)
                await pg.locator('#box').screenshot(path=f)
                shots.append(f)
    probs += ['页面报错：' + e for e in errs]
    return probs, shots, durs


def make_sheet(shots, out, cols=3):
    from PIL import Image
    ims = [Image.open(f) for f in shots]
    w = 600
    ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
    h = max(im.height for im in ims)
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (w * cols, h * rows), 'white')
    for k, im in enumerate(ims):
        sh.paste(im, ((k % cols) * w, (k // cols) * h))
    sh.save(out, quality=82)


async def main():
    from playwright.async_api import async_playwright
    args = sys.argv[1:]
    sheet = None
    if '--sheet' in args:
        k = args.index('--sheet'); sheet = args[k + 1]; del args[k:k + 2]
    idx = index()
    names = list(idx) if '--all' in args else args
    bad = 0
    async with async_playwright() as p:
        br = await p.chromium.launch()
        allshots = []
        for n in names:
            if n not in idx:
                print('✗ %s：不在 wb/index.js' % n); bad += 1; continue
            pg = await br.new_page(viewport={'width': 1000, 'height': 800})
            probs, shots, durs = await check(pg, n, idx[n], sheet)
            allshots += shots
            tot = sum(durs) if durs else 0
            print('%s %s：%d 幕，%.0f 秒%s' % ('✗' if probs else '✓', n, len(durs), tot, ''.join('\n    ' + x for x in probs)))
            bad += bool(probs)
            await pg.close()
        await br.close()
    if sheet and allshots:
        make_sheet(allshots, sheet)
        print('总览：' + sheet)
    sys.exit(1 if bad else 0)


asyncio.run(main())
