#!/usr/bin/env python3
"""MAIN2 线 A22-5：古文 P1-A 一词多义星图（过渡版，复用 title/mark/cards/end，零引擎改动）。幂等，二次运行 0 改动。

素材只取 newhanzi/data/guwen_knowledge.js「一词多义」本条目（分类 类/例子、例句解析、怎么认）与分类 intro，
出处只取 newhanzi/data/guwen_links.js 反查（mid=duoyi、同名条目、例句逐字命中的篇目）。不补今译、不写「为什么」引申链（知识库深讲为空）。

每个义项挑一句例句：
  1. 分类.例子 里的第一句（该条目自己把它归在这个义项下）；
  2. 分类.例子 为空时，用例句解析里「析」给出的意思与义项名对上的句子（析的意思与义项名某一段互为前缀，
     或 ALIAS 里人工对齐、意思相同只是措辞不同的两处），对不上的义项不画。
  例句里不含该字的、内容存疑的（DOUBT）不用。能用的义项少于 2 个的知识点整点跳过（星图至少两个意思）。
键名「古文:一词多义:<字>」（与古今异义「古文:去」等同名不冲突；guwen.html 先查「古文:<分类名>:<名>」再查「古文:<名>」）。
4 + n 幕：是什么（title）→ 每个义项一幕猜一猜（mark：读句 → 想一想 → 圈字写义项）→ 全图（cards）→ 口诀（end）。
用法：python3 tools/content/fix_main2_duoyi.py [--check]
"""
import json, os, re, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
NH = ROOT
FILES = {'安': 'an', '故': 'gu', '道': 'dao', '举': 'ju', '绝': 'jue', '见': 'jian', '间': 'jiange',
         '胜': 'sheng', '信': 'xin', '食': 'shi', '行': 'xing', '去': 'qu'}
# 析的意思与义项名措辞不同、意思相同（人工对齐，记入执行日志）
ALIAS = {('见', '通“现”'): '显露', ('信', '相信'): '信任'}
# 内容存疑，不进动画（记入执行日志）
DOUBT = {('行', '其身正，不令而行'): '分类归「品行、行为」，析写“品行语境”；此句“行”一般解作推行、施行，存疑',
         ('信', '为人谋而不忠乎'): '例句里没有“信”字'}
# 一句里该字出现两次、析分别讲了两处的：[(下标位置, 义项)]
MULTI = {('食', '食马者不知其能千里而食也'): [(0, '吃'), (10, '供养、喂养（读sì）')]}


def load():
    js = ("global.window=global;require(%s);require(%s);const c=NHZ_GUWEN_KNOWLEDGE.categories.find(c=>c.id=='duoyi');"
          "console.log(JSON.stringify({name:c.name,intro:c.intro,items:c.items,links:NHZ_GUWEN_LINKS.byText}))") % (
        json.dumps(os.path.join(NH, 'data', 'guwen_knowledge.js')), json.dumps(os.path.join(NH, 'data', 'guwen_links.js')))
    return json.loads(subprocess.check_output(['node', '-e', js]))


def js(s):
    assert "'" not in s and '\\' not in s, s
    return "'" + s + "'"


def xi_meaning(s):
    m = re.search(r"在这里是'(.+?)'的用法", s)
    return m.group(1) if m else None


def match(w, cls, mean):
    if ALIAS.get((w, cls)) == mean:
        return True
    return any(p.startswith(mean) or mean.startswith(p) for p in cls.split('、'))


def senses(p, src):
    w = p['name']
    xi = {d['句']: d['析'] for d in p['例句解析']}
    out, skipped = [], []
    for f in p['分类']:
        cls = f['类']
        cands = [(s, 'fl') for s in f['例子']]
        if not cands:
            cands = [(s, 'xi') for s, x in xi.items() if xi_meaning(x) and match(w, cls, xi_meaning(x))]
        ok = [s for s, _ in cands if w in s and (w, s) not in DOUBT]
        if not ok:
            why = [DOUBT[(w, s)] for s, _ in cands if (w, s) in DOUBT]
            skipped.append('%s「%s」：%s' % (w, cls, why[0] if why else '知识库没有可用例句'))
            continue
        s = ok[0]
        out.append({'cls': cls, 's': s, 'xi': xi.get(s), 'src': src.get(s)})
    return out, skipped


def say_xi(x):
    return x.replace("'", '“', 1).replace("'", '”', 1).replace("'", '“', 1).replace("'", '”', 1).replace('的用法。', '的意思。')


def build(p, ss, intro_name):
    w = p['name']
    rows = []
    rows.append("  { k: 'title', tab: '是什么', t: %s, one: '同一个字，在不同篇目中意思不同', say: %s }," % (
        js(w), js('“%s”是一词多义的字：同一个字，在不同篇目中意思不同。它有几个意思？' % w)))
    for n, e in enumerate(ss):
        s = e['s']
        multi = MULTI.get((w, s))
        if multi:
            cuts = sorted(i for i, _ in multi)
            assert all(s[i] == w for i in cuts), (w, s)
        else:
            cuts = [s.index(w)]
        toks, last, ki = [], 0, []
        for i in cuts:
            if s[last:i]:
                toks.append(s[last:i])
            ki.append(len(toks)); toks.append(w); last = i + len(w)
        if s[last:]:
            toks.append(s[last:])
        if multi:
            ms = []
            for (pos, cls), k in zip(sorted(multi), ki):
                ms.append("{ i: %d, ring: 1, note: %s, say: %s }" % (k, js(cls), js(('前一个' if k == ki[0] else '后一个') + '“%s”：%s。' % (w, cls))))
            mline = '[%s]' % ', '.join(ms)
            extra = ''
        else:
            say = say_xi(e['xi']) if e['xi'] else '“%s”在这里是“%s”的意思。' % (w, e['cls'])
            mline = "[{ i: %d, ring: 1, note: %s, say: %s }]" % (ki[0], js(e['cls']), js(say))
            extra = ''
        sub = ', sub: %s' % js('出自《%s》' % e['src']) if e['src'] else ''
        rows.append("  { k: 'mark', tab: %s, h: %s%s, s: [%s], say: %s, ask: %s,\n    m: %s%s }," % (
            js('意思%d' % (n + 1)), js('这句里的“%s”' % w), sub, ', '.join(js(t) for t in toks), js(s + '。'),
            js('这里的“%s”是什么意思？' % w), mline, extra))
    items = []
    for e in ss:
        items.append("    { n: %s, w: %s%s, say: %s }" % (
            js(e['cls']), js(e['s']), (', ex: %s' % js('出自《%s》' % e['src'])) if e['src'] else '',
            js('%s：%s。' % (e['cls'], e['s']))))
    rows.append("  { k: 'cards', tab: '全图', h: %s,%s items: [\n%s\n  ], end: '看上下文，再定意思' }," % (
        js('“%s”的%d个意思' % (w, len(ss))), ' row: 1,' if len(ss) == 4 else '', ',\n'.join(items)))
    rows.append("  { k: 'end', tab: '口诀', kj: '由本义想引申义，更要看上下文', tip: '对照义项，一个一个排除。' }")
    head = ("/* 古文白板：一词多义星图·过渡版（A22-5，设计 docs/gaijin/guwen-gaijin-sheji.md P1-A）。由 tools/content/fix_main2_duoyi.py 生成，勿手改。\n"
            "   素材只取自 data/guwen_knowledge.js「一词多义」本条目「%s」（分类 / 例句解析 / 怎么认）与分类 intro；出处取自 data/guwen_links.js 反查。\n"
            "   幕：是什么（title）→ 每个义项猜一猜（mark）→ 全图（cards）→ 口诀（end）。不写引申「为什么」（知识库无）。 */\n") % w
    return head + "NHZWB.add('古文:%s:%s', { scenes: [\n%s\n] });\n" % (intro_name, w, '\n'.join(rows))


def main():
    check = '--check' in sys.argv
    d = load()
    src = {}
    for title, arr in d['links'].items():
        for e in arr:
            if e['mid'] == 'duoyi':
                src[(e['name'], e['ex'])] = title
    changed, made, skipped_all = 0, [], []
    for p in d['items']:
        w = p['name']
        ss, sk = senses(p, {s: t for (n, s), t in src.items() if n == w})
        skipped_all += sk
        if len(ss) < 2:
            skipped_all.append('%s：可用义项不足 2 个，整点跳过' % w)
            continue
        out = build(p, ss, d['name'])
        path = os.path.join(NH, 'wb', 's', 'gw_dy_%s.js' % FILES[w])
        old = open(path, encoding='utf-8').read() if os.path.exists(path) else None
        if old != out:
            changed += 1
            if not check:
                open(path, 'w', encoding='utf-8').write(out)
        made.append((w, 'gw_dy_%s' % FILES[w], len(ss)))
    for w, f, n in made:
        print('OK  %s  %s  %d 义项' % (w, f, n))
    for s in skipped_all:
        print('SKIP', s)
    print('changed', changed)
    if check and changed:
        sys.exit(1)


if __name__ == '__main__':
    main()
