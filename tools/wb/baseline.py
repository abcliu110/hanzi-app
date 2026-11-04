#!/usr/bin/env python3
"""语法白板：渲染哈希基线（设计文档 docs/anim/baiban-yufa-gaijin-sheji.md §7.3）。

对 wb/index.js 里全部语法点的每一幕，在 0.35 / 0.7 / 1.0 倍时长处取 svg.innerHTML 的 SHA-1。

用法：
  python3 tools/wb/baseline.py                 # 与 tools/wb/baseline.json 对比（不一致退出码 1）
  python3 tools/wb/baseline.py --write         # 重拍并写入 baseline.json
  python3 tools/wb/baseline.py --dump DIR      # 另把每帧 SVG 写到 DIR/<id>_<幕>_<k>.svg（不入库）
  python3 tools/wb/baseline.py --only 主语,谓语  # 只拍 / 只比这几项
  python3 tools/wb/baseline.py --lv 1          # 以指定档位（1/2/3）挂载播放器后再拍（验证档位切换不改画面）
  python3 tools/wb/baseline.py --skip 主语,谓语  # 对比时跳过这几项（已有意回炉的项）
  python3 tools/wb/baseline.py --cmp-nocolor A B   # 比较两个 dump 目录：去掉颜色属性后是否一致（换色板验收）

基线以「语法点名 → 每幕 [h0.35, h0.7, h1.0] + 时长」存储；对比只看哈希。
不依赖字体：innerHTML 由数据与引擎决定，与字体是否加载无关。
依赖：pip install playwright && python3 -m playwright install chromium
"""
import asyncio, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', 'newhanzi'))
BASE = os.path.join(HERE, 'baseline.json')
FRACS = [0.35, 0.7, 1.0]


def index():
    s = open(os.path.join(ROOT, 'wb', 'index.js'), encoding='utf-8').read()
    return dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', s))


def harness(ids):
    extra = ''
    if os.path.exists(os.path.join(ROOT, 'wb', 'terms.js')):
        extra = '<script src="file://%s/wb/terms.js"></script>' % ROOT
    ss = ''.join('<script src="file://%s/wb/s/%s.js"></script>' % (ROOT, f) for f in ids)
    return ('<!doctype html><html><head><meta charset="utf-8"></head><body><div id="box"></div>'
            '<script src="file://%s/wb/rough.js"></script><script src="file://%s/wb/wb-engine.js"></script>%s%s'
            '</body></html>') % (ROOT, ROOT, extra, ss)


JS_SHOOT = r"""async ([name, fracs, lv, dump]) => {
  const box = document.getElementById('box');
  if (lv) { try { localStorage.setItem('nhz_wb_lv', String(lv)); } catch (e) {} }
  const P = NHZWB.mount(box, name);
  const durs = P.durations(), out = [], svgs = [];
  const all = P.allScenes ? P.allScenes() : null;   /* 档位过滤后仍按原始序号拍 */
  for (let i = 0; i < durs.length; i++) {
    const hs = [];
    for (const f of fracs) {
      P.seekRaw ? P.seekRaw(i, durs[i] * f) : P.seek(i, durs[i] * f);
      const s = P.svg.innerHTML;
      const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
      hs.push([...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''));
      if (dump) svgs.push(s);
    }
    out.push({ d: Math.round(durs[i] * 1000) / 1000, h: hs });
  }
  P.destroy();
  try { localStorage.removeItem('nhz_wb_lv'); } catch (e) {}
  return { scenes: out, svgs: svgs };
}"""


async def shoot(names, idx, lv=None, dump=None):
    from playwright.async_api import async_playwright
    res = {}
    tmp = '/tmp/wb_baseline.html'
    ids = sorted(set(idx[n] for n in names))
    open(tmp, 'w', encoding='utf-8').write(harness(ids))
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1000, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + tmp)
        if errs:
            print('页面报错：', errs); sys.exit(2)
        for n in names:
            r = await pg.evaluate(JS_SHOOT, [n, FRACS, lv, bool(dump)])
            res[n] = r['scenes']
            if dump:
                os.makedirs(dump, exist_ok=True)
                for k, s in enumerate(r['svgs']):
                    i, j = divmod(k, len(FRACS))
                    open(os.path.join(dump, '%s_%02d_%d.svg' % (idx[n], i, j)), 'w', encoding='utf-8').write(s)
        await br.close()
        if errs:
            print('页面报错：', errs); sys.exit(2)
    return res


COLOR_ATTR = re.compile(r'\s(?:fill|stroke)="[^"]*"|(?<=[;"\s])(?:fill|stroke|color):\s*[^;"]*;?')


def nocolor(s):
    return COLOR_ATTR.sub('', s)


def cmp_nocolor(a, b):
    fa = sorted(os.listdir(a)); fb = sorted(os.listdir(b))
    if fa != fb:
        print('两个目录的帧不同：%d / %d' % (len(fa), len(fb))); return 1
    bad = 0
    for f in fa:
        x = open(os.path.join(a, f), encoding='utf-8').read(); y = open(os.path.join(b, f), encoding='utf-8').read()
        if nocolor(x) != nocolor(y):
            bad += 1
            if bad <= 10: print('✗ 去色后仍不同：' + f)
    print('%d 帧，去色后不同 %d 帧' % (len(fa), bad))
    return 1 if bad else 0


def main():
    a = sys.argv[1:]
    if '--cmp-nocolor' in a:
        k = a.index('--cmp-nocolor'); sys.exit(cmp_nocolor(a[k + 1], a[k + 2]))
    def opt(key):
        if key in a:
            k = a.index(key); v = a[k + 1]; del a[k:k + 2]; return v
        return None
    dump = opt('--dump'); only = opt('--only'); skip = opt('--skip'); lv = opt('--lv')
    write = '--write' in a
    idx = index()
    names = list(idx)
    if only: names = [n for n in only.split(',') if n in idx]
    skips = set(skip.split(',')) if skip else set()
    res = asyncio.run(shoot(names, idx, int(lv) if lv else None, dump))
    nsc = sum(len(v) for v in res.values())
    if write:
        old = json.load(open(BASE, encoding='utf-8')) if (only and os.path.exists(BASE)) else {}
        old.update(res)
        out = {k: old[k] for k in idx if k in old}
        with open(BASE, 'w', encoding='utf-8') as f:
            f.write('{\n' + ',\n'.join('  %s: %s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, separators=(',', ':'))) for k, v in out.items()) + '\n}\n')
        print('已写基线：%d 项，%d 幕，%d 帧 → %s' % (len(res), nsc, nsc * len(FRACS), os.path.relpath(BASE)))
        return
    base = json.load(open(BASE, encoding='utf-8'))
    bad = same = 0
    for n, sc in res.items():
        if n in skips: continue
        b = base.get(n)
        if b is None:
            print('✗ %s：基线里没有' % n); bad += 1; continue
        if len(b) != len(sc):
            print('✗ %s：幕数 %d → %d' % (n, len(b), len(sc))); bad += len(sc); continue
        for i, (x, y) in enumerate(zip(b, sc)):
            if x['h'] != y['h']:
                bad += 1; print('✗ %s 第%d幕：时长 %.3f→%.3f，帧 %s' % (n, i + 1, x['d'], y['d'], ''.join('=' if p == q else 'x' for p, q in zip(x['h'], y['h']))))
            else:
                same += 1
    print('%s 对比基线：%d 幕一致，%d 幕不同%s' % ('✓' if not bad else '✗', same, bad, '（跳过 %s）' % '、'.join(sorted(skips)) if skips else ''))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
