#!/usr/bin/env python3
"""F2 批次2：一题多解（报告 B3）。幂等。
- gaopinci 学段题（选项同时有「小学」「小学（初中复现）」等，可两解）：删
- gaopinci「下面哪一项属于《X》」：干扰项也出现在该篇原文的，换成其他篇目重点词里不在该篇原文的词
  （原文取 guwen.js + tools/content/xiaoxue_wenyan.json；原文不在库里的篇目无法核，跳过并记日志）
- zongbiao 汇总归属：干扰项那一类也收了这个字（亡∈通假、乃∈实词）→ 换成不含该字的类
- xuci:其 正误判断：干扰项「其可以表示连词」不成立（其有表假设/选择的连词用法）→ 换干扰项"""
import sys, os, re, json, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); h, K, t = load_kn()
# 原文
src = open(os.path.join(NH, 'data', 'guwen.js'), encoding='utf8').read()
T = {}
for m in re.finditer(r"title:'([^']+)'.*?原文:'([^']*)'", src, re.S): T[m.group(1)] = m.group(2)
for x in json.load(open(os.path.join(ROOT, 'tools/content/xiaoxue_wenyan.json'), encoding='utf8'))['texts']:
    T.setdefault(x['t'], x['text'])
ALIAS = {'王戎不取道旁李': '道边李苦', '孟子·生于忧患': '生于忧患死于安乐', '少年中国说、古人谈读书': '古人谈读书'}
def text_of(ti):
    return T.get(ti) or T.get(ALIAS.get(ti, '')) or T.get(ti.split('·')[-1], '')
# 1 学段题
def is_xueduan(k, q):
    if not k.startswith('gaopinci:') or not re.match(r'下面关于“.+?”的说法，正确的是？$', q['q']): return False
    labs = [re.sub(r'^“.+?”：', '', x) for x in q['options']]
    return sum(1 for x in labs if x.startswith('小学')) >= 2 or sum(1 for x in labs if x.startswith('初中') and len(x) <= 8) >= 2
n_del = drop_q(B, K, is_xueduan)
# 2 篇目字词干扰项
pool = []
for k, o in B['gaopinci']:
    for q in o['questions']:
        if q.get('类') == '选项目': pool.append(q['options'][q['answer']])
pool = list(dict.fromkeys(pool))
n_rep = 0; skipped = set()
for k, q in all_q(B, K):
    m = re.match(r'下面哪一项属于“(.+?)”？', q['q'])
    if not (m and k.startswith('gaopinci:')): continue
    ti = m.group(1); s = text_of(ti)
    if not s: skipped.add(ti); continue
    for j, x in enumerate(q['options']):
        if j == q['answer'] or x not in s: continue
        cands = [c for c in pool if c not in s and c not in q['options'] and not any(ch in s for ch in c if len(c) == 1)]
        cands.sort(key=lambda c: (len(c) < 2, hashlib.md5((q['q'] + q['options'][q['answer']] + c).encode()).hexdigest()))
        q['options'][j] = cands[0]; n_rep += 1
# 3 汇总归属
members = {}
for c in K['categories']:
    for it in c['items']: members.setdefault(it['name'], set()).add(c['id'])
zmap = {'虚词（18）': 'xuci', '实词（120）': 'shici', '通假（16）': 'tongjia', '古今异义（16）': 'guyin', '一词多义（12）': 'duoyi', '词类活用（按类型）': 'huoyong', '篇目高频字（核心池）': 'gaopinci'}
n_z = 0
for k, q in all_q(B, K):
    m = re.match(r'“(.+?)”属于哪一类汇总？', q['q'])
    if not m: continue
    cats = members.get(m.group(1), set())
    for j, x in enumerate(q['options']):
        if j != q['answer'] and zmap.get(x) in cats:
            q['options'][j] = [c for c in zmap if zmap[c] not in cats and c not in q['options']][0]; n_z += 1
# 4 其
n_q = 0
for k, q in all_q(B, K):
    if k == 'xuci:其' and '“其”可以表示连词。' in q['options'] and q['options'][q['answer']] != '“其”可以表示连词。':
        q['options'][q['options'].index('“其”可以表示连词。')] = '“其”可以表示兼词，相当于“于此、在那里”。'; n_q += 1
save_banks(B); save_kn(h, K, t)
print('学段题删', n_del, '篇目干扰项换', n_rep, '汇总干扰项换', n_z, '其', n_q, '无原文跳过', sorted(skipped))
