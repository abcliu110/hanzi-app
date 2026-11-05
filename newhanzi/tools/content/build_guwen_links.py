#!/usr/bin/env python3
"""古文「本篇知识点」双向链接（docs/gaijin/guwen-gaijin-sheji.md P0-C）。

离线扫描 newhanzi/data/guwen.js 的 50 篇原文，与 guwen_knowledge.js 各知识点的例句
（例子、例句解析.句、xiaoxue[].ex）做**逐字匹配**（去标点后，例句 ≥ 4 字且是原文的连续子串），
生成 newhanzi/data/guwen_links.js：
  window.NHZ_GUWEN_LINKS = {
    byText:  { "<篇名>": [ {mid, name, i, ex} ... ] },   // i = 知识点在子模块 items 中的下标
    byPoint: { "<mid>:<i>": [ {t, ex} ... ] }
  }
只做字面命中，不做语义推断；不改知识库原数据。幂等，可重复运行：
  python3 tools/content/build_guwen_links.py           # 写文件
  python3 tools/content/build_guwen_links.py --check   # 文件与重算结果一致才退出 0（CI 可用）
"""
import json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D = os.path.join(ROOT, 'data')
OUT = os.path.join(D, 'guwen_links.js')
SKIP_MODS = {'meiti', 'zongbiao'}   # 外链、总表不是知识点
MINLEN = 4


def load(fn, var):
    # guwen.js 是 JS 对象字面量（键不加引号），不是严格 JSON：用 node 执行后再输出 JSON
    js = ('const fs=require("fs"),vm=require("vm");const window={};'
          'vm.runInNewContext(fs.readFileSync(process.argv[1],"utf8"),{window});'
          'process.stdout.write(JSON.stringify(window[process.argv[2]]));')
    out = subprocess.run(['node', '-e', js, os.path.join(D, fn), var],
                         check=True, capture_output=True).stdout
    return json.loads(out.decode('utf-8'))


def norm(s):
    return re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]', '', s or '')


def build():
    G = load('guwen.js', 'NHZ_GUWEN')
    K = load('guwen_knowledge.js', 'NHZ_GUWEN_KNOWLEDGE')
    texts = [(t['title'], norm(t.get('原文', ''))) for t in G['texts']]
    by_text, by_point = {}, {}
    for c in K['categories']:
        mid = c.get('id')
        if not mid or mid in SKIP_MODS: continue
        for i, it in enumerate(c.get('items', [])):
            exs = list(it.get('例子') or [])
            exs += [e.get('句', '') for e in (it.get('例句解析') or []) if isinstance(e, dict)]
            exs += [x.get('ex', '') for x in (it.get('xiaoxue') or []) if isinstance(x, dict)]
            seen = set()
            for ex in exs:
                if not isinstance(ex, str): continue
                n = norm(ex)
                if len(n) < MINLEN: continue
                for title, body in texts:
                    if n in body and (title, n) not in seen:
                        seen.add((title, n))
                        if any(r['mid'] == mid and r['i'] == i for r in by_text.get(title, [])):
                            continue   # 同一篇同一知识点只列一次（保留第一个例句）
                        by_text.setdefault(title, []).append({'mid': mid, 'name': it.get('name', ''), 'i': i, 'ex': ex.strip()})
                        by_point.setdefault(mid + ':' + str(i), []).append({'t': title, 'ex': ex.strip()})
    return {'byText': by_text, 'byPoint': by_point}


def render(d):
    return ('/* 由 tools/content/build_guwen_links.py 生成，勿手改：古文篇目 ↔ 知识点（例句逐字命中原文） */\n'
            'window.NHZ_GUWEN_LINKS = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n')


def main():
    d = build()
    s = render(d)
    if '--check' in sys.argv:
        ok = os.path.exists(OUT) and open(OUT, encoding='utf-8').read() == s
        print('guwen_links.js ' + ('一致' if ok else '过期：请运行 python3 tools/content/build_guwen_links.py'))
        sys.exit(0 if ok else 1)
    open(OUT, 'w', encoding='utf-8').write(s)
    nt = len(d['byText']); nl = sum(len(v) for v in d['byText'].values())
    print(f'guwen_links.js：{nt} 篇命中，共 {nl} 条篇目↔知识点链接，涉及 {len(d["byPoint"])} 个知识点')


if __name__ == '__main__':
    main()
