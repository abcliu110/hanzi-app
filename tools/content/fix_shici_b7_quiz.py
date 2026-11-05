#!/usr/bin/env python3
"""F3 批次7（G 组）：题库标题乱码/原始组诗题名、版本残留、找错题干扰项（报告 §7、§9、§11）。幂等。
1) 题目里的诗题用了 chinese-poetry 原始题名（《凉州词二首” 一》《辋川集 鹿柴》《杂诗三首 二》…）：
   按题目里的诗句在诗库里找到那首诗，题名统一换成诗库 title；
2) order 两题仍是旧版本：《渭城曲》「客舍青青杨柳春」→ 诗库/课本《送元二使安西》「客舍青青柳色新」（统编六上）；
   《相思》「秋来发故枝」→ 诗库已校正的「春来发几枝」（批次1）；
3) 删含生僻字「𥮾」、写闺情的《离思五首·其一》对句题（报告 §11 点名，小学生难认难懂）；
4) 找错题（spot）30 题：原来 3 个干扰项都不在题句里，不读诗也能选对；改成 1 个错字 + 题句里另外 3 个字（确定性选取），
   只能读句辨字才能答对。exp/fix 不变。
"""
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io
q = io.load('quiz'); s = io.load('shici'); M = q['modes']
P = s['poems']; titles = {p['title'] for p in P}
def norm(t): return re.sub(r'[，。！？；、,.!?\s“”「」]', '', t)
full = [(p, norm(''.join(p['lines']))) for p in P]
def find_poem(x):
    txt = json.dumps(x, ensure_ascii=False)
    cands = re.findall(r'[\u4e00-\u9fff\U00020000-\U0002ffff]{5,}', txt)
    for c in sorted(cands, key=len, reverse=True):
        hit = [p for p, f in full if c in f]
        if len(hit) == 1: return hit[0]
    return None
GARB = re.compile(r'首[”"]?\s|集\s|五题\s|杂题|首[”"]')
def walk(o, fn):
    if isinstance(o, str): return fn(o)
    if isinstance(o, list): return [walk(v, fn) for v in o]
    if isinstance(o, dict): return {k: walk(v, fn) for k, v in o.items()}
    return o
c = dict(title=0, sync=0, drop=0, spot=0)
for mode, L in M.items():
    for i, x in enumerate(L):
        bad = [t for t in re.findall(r'《([^》]+)》', json.dumps(x, ensure_ascii=False)) if t not in titles and GARB.search(t)]
        if not bad: continue
        p = find_poem(x)
        if not p: print('未找到', mode, i, bad); continue
        for t in set(bad):
            L[i] = x = walk(x, lambda v: v.replace('《%s》' % t, '《%s》' % p['title']))
            c['title'] += 1
# 诗句不在题里的两道体裁题：按作者/篇名手工对应诗库 title
MAN = {'凉州词二首” 一': '凉州词', '皇甫岳云溪杂题五首 鸟鸣涧': '鸟鸣涧'}
for i, x in enumerate(M['choice']):
    t = json.dumps(x, ensure_ascii=False); t2 = t
    for a, b in MAN.items(): t2 = t2.replace('《%s》' % a, '《%s》' % b)
    if t2 != t: M['choice'][i] = json.loads(t2); c['title'] += 1
# 2) 版本同步
SYNC = [('客舍青青杨柳春', '客舍青青柳色新'), ('《渭城曲》', '《送元二使安西》'), ('秋来发故枝', '春来发几枝')]
for mode in ('order',):
    for i, x in enumerate(M[mode]):
        t = json.dumps(x, ensure_ascii=False); t2 = t
        for a, b in SYNC: t2 = t2.replace(a, b)
        if t2 != t: M[mode][i] = json.loads(t2); c['sync'] += 1
# 3) 删离思
for mode in M:
    n0 = len(M[mode]); M[mode] = [x for x in M[mode] if '离思' not in json.dumps(x, ensure_ascii=False)]; c['drop'] += n0 - len(M[mode])
# 4) spot 干扰项取自题句
HZ = re.compile(r'[\u4e00-\u9fff]')
for i, x in enumerate(M['spot']):
    wrong = x['opts'][x['a']]
    if all(o in x['s'] for o in x['opts']): continue
    pool = []
    for ch in x['s']:
        if HZ.match(ch) and ch != wrong and ch not in pool: pool.append(ch)
    assert len(pool) >= 3, x
    k = len(pool); pick = [pool[(i + j) % k] for j in range(k)]
    others = []
    for ch in pick:
        if ch not in others: others.append(ch)
        if len(others) == 3: break
    pos = i % 4
    opts = others[:pos] + [wrong] + others[pos:]
    x['opts'] = opts; x['a'] = pos; c['spot'] += 1
io.dump('quiz', q)
print(c)
