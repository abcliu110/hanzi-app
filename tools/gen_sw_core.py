#!/usr/bin/env python3
"""从页面清单生成 newhanzi/sw.js 的预缓存清单（CORE）与 VERSION。

- 页面：newhanzi/ 下全部 .html（排除 ziku/ 构建源）
- 依赖：这些页面里 <script src> / <link href> 引用的本地 js/css/webmanifest
  （按需加载的单字数据 data/zika/*、语法题库 quiz_bank_* 不预缓存，用到时再缓存）
- VERSION = nhz- + CORE 清单的哈希：清单变化时自动换缓存名

用法：
  python3 tools/gen_sw_core.py          # 改写 sw.js
  python3 tools/gen_sw_core.py --check  # 严格检查（页面+依赖），过期时退出码 1
  python3 tools/gen_sw_core.py --check-pages  # 只查页面是否齐（smoke 测试用）
新增/删除页面或改了页面引用的脚本后重跑一次。
"""
import hashlib, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'newhanzi')
SW = os.path.join(ROOT, 'sw.js')
REF = re.compile(r'<(?:script[^>]*\ssrc|link[^>]*\shref)="([^"#?]+)', re.I)
SKIP = re.compile(r'(^|/)(ziku/|data/zika/)|quiz_bank_(?!index)')

def pages():
    out = []
    for d, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(d, ROOT)
        if rel.split(os.sep)[0] in ('ziku', 'node_modules'):
            dirs[:] = []
            continue
        for f in files:
            if f.endswith('.html'):
                out.append(os.path.normpath(os.path.join(rel, f)).replace(os.sep, '/'))
    return sorted(out)

def core():
    items = set(['./', 'manifest.webmanifest'])
    for p in pages():
        items.add(p)
        html = open(os.path.join(ROOT, p), encoding='utf-8').read()
        base = os.path.dirname(p)
        for ref in REF.findall(html):
            if re.match(r'^(https?:)?//|^data:', ref):
                continue
            path = os.path.normpath(os.path.join(base, ref)).replace(os.sep, '/')
            if path.startswith('..') or SKIP.search(path):
                continue
            if not re.search(r'\.(js|css|webmanifest)$', path):
                continue
            if os.path.exists(os.path.join(ROOT, path)):
                items.add(path)
    return sorted(items, key=lambda x: (x != './', x))

def render(src):
    lst = core()
    ver = 'nhz-' + hashlib.sha1('\n'.join(lst).encode()).hexdigest()[:10]
    body = 'const VERSION = "%s";\nconst CORE = %s;\n' % (ver, json.dumps(lst, ensure_ascii=False, indent=2))
    new = re.sub(r'/\* @generated-core-start \*/.*?/\* @generated-core-end \*/',
                 lambda m: '/* @generated-core-start */\n' + body + '/* @generated-core-end */', src, flags=re.S)
    assert new != src or '@generated-core-start' in src
    return new, len(lst), ver

def main():
    src = open(SW, encoding='utf-8').read()
    new, n, ver = render(src)
    if '--check-pages' in sys.argv:
        # 宽松检查（测试用）：只要求每个页面都在 CORE 里；依赖脚本漂移不报错，避免别处改脚本就让 CI 变红
        m = re.search(r'const CORE = (\[.*?\]);', src, re.S)
        have = set(json.loads(m.group(1)))
        miss = [p for p in pages() if p not in have]
        if miss:
            print('sw.js 预缓存缺页面：%s；请运行 python3 tools/gen_sw_core.py' % ', '.join(miss)); sys.exit(1)
        print('sw.js 页面清单最新（%d 页）' % len(pages())); return
    if '--check' in sys.argv:
        if new != src:
            print('sw.js 预缓存清单已过期，请运行 python3 tools/gen_sw_core.py'); sys.exit(1)
        print('sw.js 清单最新（%d 项，%s）' % (n, ver)); return
    open(SW, 'w', encoding='utf-8').write(new)
    print('sw.js: CORE %d 项，VERSION %s' % (n, ver))

if __name__ == '__main__':
    main()
