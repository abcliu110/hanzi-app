"""A23C 批2：选项级误解标注——从题目自带解析机械抽取。幂等（已有「误解标注」的题不动）。
1) 识字 blank（同音/形近字填空）：解析里单独讲到某个错项的分句（含该错项的引号形式、且不含正确项）→
   误解「把“错”和“对”混了：<原分句>」；正反例＝题干填正确字√ / 填该错字✗（题干去掉拼音括注）。
   解析分句同时讲到对错两字、抽不出的 3 题（blank 1/2/34），按同一解析逐字改写，见 MANUAL。
2) 逻辑 rewrite：解析里点名某个错项的分句 → 误解即该分句（去掉开头「注意」）。
不改题干、选项、答案与解析。"""
import re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_a23c_lib import load, save, dumps

def quoted(o):
    return ['“%s”' % o, "'%s'" % o, '「%s」' % o, '‘%s’' % o]

def clauses(exp):
    return [c for c in re.split(r'(?<=[；。！？])', exp) if c.strip()]

def extract(q):
    ans = q['opts'][q['a']]; out = []
    for k, o in enumerate(q['opts']):
        if k == q['a']: continue
        cs = [c for c in clauses(q.get('exp', '')) if any(x in c for x in quoted(o)) and not any(x in c for x in quoted(ans))]
        if cs: out.append((k, o, re.sub(r'；$', '。', ''.join(cs).strip())))
    return out

def zika_pair(q, o):
    s = re.sub(r'（[^）]*）', '', q['s'])
    ans = q['opts'][q['a']]
    return [s.replace('___', ans) + '√', s.replace('___', o) + '✗']

# 识字 blank：解析同句讲对错两字、机械规则抽不出的，按本题解析逐字改写（不加解析以外的内容）
MANUAL = {
    '他跑___（de）满头大汗。|的,地,得,之': {'的': '把“的”和“得”混了：“的”后面跟的是东西；“跑得满头大汗”里“得”后面跟的是样子。'},
    '___（tā）是我的好朋友（女）。|他,她,它,你': {
        '他': '把“他”和“她”混了：“他”一般说男孩子，说女孩子用“她”。',
        '它': '把“它”和“她”混了：“它”说小动物，说女孩子用“她”。'},
    '___（jùn）马在草原上奔跑。|峻,骏,俊,竣': {'峻': '把“峻”和“骏”混了：“峻岭”是高山，有“山”旁；“骏马”是好马，有“马”旁。'},
}

total = 0
# 1) 识字 blank
s, m, obj = load('zika'); changed = []
for q in obj['modes']['blank']:
    if q.get('误解标注') or not q.get('opts'): continue
    ans = q['opts'][q['a']]; old = dumps(q); mz = []
    key = q['s'] + '|' + ','.join(q['opts'])
    if key in MANUAL:
        for k, o in enumerate(q['opts']):
            if o in MANUAL[key]:
                mz.append({'选项': chr(65 + k), '选项文本': o, '误解': MANUAL[key][o], '正反例': zika_pair(q, o)})
    else:
        for k, o, c in extract(q):
            mz.append({'选项': chr(65 + k), '选项文本': o, '误解': '把“%s”和“%s”混了：%s' % (o, ans, c), '正反例': zika_pair(q, o)})
    if mz:
        q['误解标注'] = mz; changed.append((old, q))
print('zika blank', len(changed)); total += len(changed)
save('zika', s, m, obj, changed)

# 2) 逻辑 rewrite
s, m, obj = load('logic'); changed = []
for q in obj['modes']['rewrite']:
    if q.get('误解标注') or not q.get('opts'): continue
    old = dumps(q)
    mz = [{'选项': chr(65 + k), '选项文本': o, '误解': re.sub(r'^注意', '', c)} for k, o, c in extract(q)]
    if mz:
        q['误解标注'] = mz; changed.append((old, q))
print('logic rewrite', len(changed)); total += len(changed)
save('logic', s, m, obj, changed)
print('total', total)
