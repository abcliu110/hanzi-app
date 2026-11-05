#!/usr/bin/env python3
"""Z 线：易错提示空（审查第 20 节，931 卡）。只在仓库里已有「真实易混」出处时补：取识字题库 newhanzi/quiz/data_zika.js
里以本字为正确答案的题目解析（同音/音近/形近字选字、多音字读音、错别字改正、选字填空、读音判断），每卡最多 2 条，原文照录；
其余卡没有出处 → 留空（页面整段不显示）。不从形近字段复制（同一区块已显示）。可重复运行。"""
import sys, os, re, json
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_b_lib as L

def quiz():
    s = open(os.path.join(L.ROOT, 'newhanzi/quiz/data_zika.js'), encoding='utf-8').read()
    return json.loads(s[s.index('{'):s.rstrip().rstrip(';').rindex('}') + 1])['modes']

def diffpos(ws):
    if len(set(map(len, ws))) != 1: return None
    p = [i for i in range(len(ws[0])) if len({w[i] for w in ws}) > 1]
    return p[0] if len(p) == 1 else None

def tips():
    M = quiz(); T = {}
    def add(z, e):
        if z and e and z in e: T.setdefault(z, [])
        if z and e and z in e and e not in T[z]: T[z].append(e)
    for q in M.get('choice', []):
        qs, o, a, e = q.get('q', ''), q.get('opts', []), q.get('a'), q.get('exp', '')
        qt = re.findall(r'“([^”]*)”', qs)
        if '正确字形' in qs or qs.startswith('读作'): add(o[a], e)
        elif '正确拼音' in qs and len(qt) >= 2: add(qt[1], e)
        elif '字形正确' in qs:
            p = diffpos(o)
            if p is not None: add(o[a][p], e)
    for q in M.get('blank', []): add(q['opts'][q['a']], q.get('exp', ''))
    for q in M.get('spot', []):
        s, f = q.get('s', ''), q.get('fix', '')
        if len(s) == len(f):
            p = [i for i in range(len(s)) if s[i] != f[i]]
            if len(p) == 1: add(f[p[0]], q.get('exp', ''))
    for q in M.get('judge', []):
        qt = re.findall(r'“([^”]*)”', q.get('q', ''))
        if '读' in q.get('q', '') and len(qt) >= 2 and q.get('a') is True: add(qt[1], q.get('exp', ''))
    return T

# 题目解析不是“易混”而只是说明用法的（开：关门是反义词；老、爸：只说用这个字）→ 不补；镜像/重复的第二条不要
SKIP = set('开老爸')
ONE = set('乐像即坐')

if __name__ == '__main__':
    T = tips(); n = 0; idx = {x['z'] for x in L.index()}
    for z, es in sorted(T.items()):
        if z not in idx: continue
        d = L.load(z); dm = d['dim']
        if dm.get('易错提示') or z in SKIP: continue
        dm['易错提示'] = es[:1] if z in ONE else es[:2]
        d.setdefault('src', {})['易错提示'] = '识字题库 quiz/data_zika.js 解析（tools/content/fix_zika_z_yicuo.py）'
        n += L.save(z, d); print(z, es[:2])
    print('补', n, '卡')
