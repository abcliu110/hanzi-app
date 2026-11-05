#!/usr/bin/env python3
"""F3 古诗线 · 批次1：原文确错修正 + 题库/飞花令/逐句讲同步诗库（课内版本）。幂等。
依据见 docs/xiufu/shencha-2026-11-05/fix-shici.md。
运行：python3 tools/content/fix_shici_b1_sync.py
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_shici_io as io

S = io.load('shici'); SX = io.load('shangxi'); Q = io.load('quiz'); F = io.load('feihua'); SJ = io.load('shiju')
P = S['poems']
VAR = json.load(open(os.path.join(os.path.dirname(__file__), 'variants.json'), encoding='utf8'))
hz = lambda s: re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]', '', s)

def fix_variants(s):
    for a, b in VAR['phrase']: s = s.replace(a, b)
    for a, b in VAR['char']: s = s.replace(a, b)
    sh = VAR['shen']
    if sh['from'] in s:
        keep = {}
        for i, w in enumerate(sh['allow']):
            tok = '\u0000%d\u0000' % i
            if w in s: s = s.replace(w, tok); keep[tok] = w
        s = s.replace(sh['from'], sh['to'])
        for tok, w in keep.items(): s = s.replace(tok, w)
    return s

def poem(t, a=None):
    r = [p for p in P if p['title'] == t and (a is None or p['author'] == a)]
    assert len(r) == 1, (t, len(r)); return r[0]
def sx(t):
    r = [x for x in SX if x['t'] == t]; assert len(r) == 1, t; return r[0]

# ---------- A. 诗库原文确错/异文统一（有出处） ----------
def set_line(p, old, new):
    for i, l in enumerate(p['lines']):
        if old in l: p['lines'][i] = l.replace(old, new); return
    assert new in ''.join(p['lines']), (p['title'], old)
# 醉花阴：把洒→把酒（古诗文网 https://www.gushiwen.cn/shiwenv_324219410b89.aspx）
set_line(poem('醉花阴·薄雾浓云愁永昼'), '把洒', '把酒')
# 登高：衮衮→滚滚（古诗文网 https://www.gushiwen.cn/shiwenv_eeb217f8cb2d.aspx）
set_line(poem('登高', '杜甫'), '衮衮', '滚滚')
# 相思：秋来发故枝→春来发几枝（古诗文网正文作「春来发几枝」，注「一作秋来发故枝」 https://www.gushiwen.cn/shiwenv_f324eea45183.aspx）
set_line(poem('相思', '王维'), '秋来发故枝', '春来发几枝')
# 闻王昌龄左迁龙标遥有此寄：随风→随君（统编七上课本、古诗文网 https://m.gushiwen.cn/shiwenv_62280919c9c5.aspx 均作「随君」）
set_line(poem('闻王昌龄左迁龙标遥有此寄'), '随风直到', '随君直到')
# 茅屋为秋风所破歌：整首按古诗文网通行本（原文断句错、倚仗/骄儿/床床等错字） https://www.gushiwen.cn/shiwenv_8e9ecc95d6a4.aspx
poem('茅屋为秋风所破歌')['lines'] = [
 '八月秋高风怒号，','卷我屋上三重茅。','茅飞渡江洒江郊，','高者挂罥长林梢，','下者飘转沉塘坳。',
 '南村群童欺我老无力，','忍能对面为盗贼。','公然抱茅入竹去，','唇焦口燥呼不得，','归来倚杖自叹息。',
 '俄顷风定云墨色，','秋天漠漠向昏黑。','布衾多年冷似铁，','娇儿恶卧踏里裂。','床头屋漏无干处，','雨脚如麻未断绝。','自经丧乱少睡眠，','长夜沾湿何由彻！',
 '安得广厦千万间，','大庇天下寒士俱欢颜！','风雨不动安如山。','呜呼！','何时眼前突兀见此屋，','吾庐独破受冻死亦足！']
for t in ['醉花阴·薄雾浓云愁永昼', '登高', '相思', '闻王昌龄左迁龙标遥有此寄', '茅屋为秋风所破歌']:
    p = [q for q in P if q['title'] == t][0]
    p['textFix'] = '2026-11-05 按古诗文网通行本校正（F3 修复线）'

# ---------- B. 题库/飞花令同步诗库 ----------
base = {}
for p in P:
    for x in re.split(r'[，。！？；、：]', ''.join(p['lines'])):
        if hz(x): base.setdefault(hz(x), p)
bylen = {}
for k in base: bylen.setdefault(len(k), []).append(k)
VCH = {a: b for a, b in VAR['char']}; VCH['沈'] = '沉'
def near(s, author=None):
    if s in base or len(s) < 5: return None
    for k in bylen.get(len(s), []):
        dif = [i for i in range(len(s)) if s[i] != k[i]]
        if 1 <= len(dif) <= 2 and len(s) - len(dif) >= 4:
            p = base[k]
            if author and p['author'] != author: continue
            only_var = all(VCH.get(s[i]) == k[i] or VCH.get(k[i]) == s[i] for i in dif)
            if p['ke'] == '课内' or only_var or p.get('textFix'): return k
    return None
log = []
def sync_text(t, author=None):
    out = t
    for x in re.findall(r'[\u3400-\u9fff\U00020000-\U0002ffff]+', t):
        k = near(x, author)
        if k: out = out.replace(x, k); log.append((x, k))
    return out
def walk(o, fn, skip=()):
    if isinstance(o, str): return fn(o)
    if isinstance(o, list): return [walk(v, fn, skip) for v in o]
    if isinstance(o, dict): return {k: (v if k in skip else walk(v, fn, skip)) for k, v in o.items()}
    return o
M = Q['modes']
for mode in M:
    skip = ('s',) if mode == 'spot' else ()
    M[mode] = walk(M[mode], lambda s: sync_text(fix_variants(s)), skip)
# spot 题干：只做异体清洗（错句是故意的）；枫桥夜泊题的「应为」改成课本字
for x in M['spot']:
    x['s'] = fix_variants(x['s'])
    if x['fix'] == '江枫渔火对愁眠。':
        x['exp'] = x['exp'].replace('应为「父」', '应为「火」')
for p in F:
    p['t'] = fix_variants(p['t']).replace('”', '').replace('“', '')
    p['lines'] = [sync_text(fix_variants(l), p['a']) for l in p['lines']]

# ---------- C. 逐句讲（zj）原句与原文对齐 + 译文随版本改 ----------
def zj_set(t, i, new):
    sx(t)['zj'][i] = new
zj_set('早发白帝城', 2, '两岸猿声啼不住，——两岸猿猴的叫声还在耳边不停地响。')
zj_set('早发白帝城', 3, '轻舟已过万重山。——轻快的小船已经穿过了万重青山。')
s = sx('早发白帝城'); s['ys'] = s['ys'].replace('啼不尽的猿声', '啼不住的猿声')
zj_set('望天门山', 1, '碧水东流至此回。——碧绿的江水向东奔流，到这里转了个弯。')
zj_set('过故人庄', 4, '开轩面场圃，——打开窗户，面对着打谷场和菜园。')
zj_set('子夜吴歌·春歌', 1, '采桑绿水边。——在绿水边采桑叶。')
zj_set('子夜吴歌·春歌', 5, '五马莫留连。——太守大人，您的车马就别在这里流连了。')
s = sx('子夜吴歌·春歌')
s['bg'] = '《子夜吴歌》是乐府旧题，李白按春夏秋冬各写一首。这首春歌借汉乐府《陌上桑》里罗敷的故事，写秦地采桑女的美丽、勤劳和不为权贵所动。'
s['ys'] = '前四句写采桑女在绿水边、白日下又美又勤快；后两句用「蚕饥」作理由婉转推辞，「五马莫留连」是劝太守别在这里纠缠——柔和的话里有不为富贵动心的骨气。'
zj_set('望岳', 4, '荡胸生曾云，——（曾同层）层层云气升起，看得人心胸激荡。')
zj_set('望岳', 1, '齐鲁青未了。——泰山横跨齐鲁大地，青青的山色望不到头。')
zj_set('相思', 1, '春来发几枝。——春天来了，它又长出了多少新枝？')
zj_set('醉花阴·薄雾浓云愁永昼', 4, '莫道不消魂，帘卷西风，人似黄花瘦。——别说这不叫人伤心：西风卷起帘子，帘里的人比菊花还要瘦。')

# ---------- D. shiju 字→诗索引重建（同 build_shici.py 第 8 步） ----------
idx, meta = {}, {}
for p in P:
    meta[str(p['order'])] = {'t': p['title'], 'a': p['author']}
    seen = set()
    for ch in hz(''.join(p['lines'])):
        if ch in seen: continue
        seen.add(ch); lst = idx.setdefault(ch, [])
        if len(lst) < 8: lst.append(p['order'])
SJ['idx'] = idx; SJ['meta'] = meta

for n, o in [('shici', S), ('shangxi', SX), ('quiz', Q), ('feihua', F), ('shiju', SJ)]: io.dump(n, o)
from collections import Counter
for (a, b), c in sorted(Counter(log).items()): print(f'{a} → {b} ×{c}')
print('同步替换', len(log), '处')
