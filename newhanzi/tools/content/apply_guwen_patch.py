#!/usr/bin/env python3
"""把整理好的补充稿（JSON patch）合并进 data/guwen_knowledge.js，只补不重复。
patch 格式：
{"category": "yufa",
 "update": [{"key": "yufa:判断句", "add_分类": [{"类","说明","例子":[]}], "add_例子": [], "add_例句解析": [{"句","析"}],
             "add_怎么认": [], "append_深讲": "", "add_练习": [{"q","options","answer","解析","类"}]}],
 "new": [ 完整知识点对象（name/key/subtitle/例子/讲解/口诀/分类/深讲/辨析/怎么认/例句解析/练习/前置知识） ]}
去重：分类按「类」名、例子/例句按句子包含关系、怎么认/练习按文字。
用法：python3 tools/content/apply_guwen_patch.py patch.json"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(ROOT, 'data', 'guwen_knowledge.js')
patch = json.load(open(sys.argv[1], encoding='utf8'))
src = open(P, encoding='utf8').read()
head, body = src.split('=', 1)
K = json.loads(body.strip().rstrip(';'))
cats = {c['id']: c for c in K['categories']}


def norm(s):
    return re.sub(r'[^\u3400-\u9fff]', '', s or '')


def has_sent(lst, s):
    n = norm(s.split('（')[0])
    return any(n and (n in norm(e) or norm(e.split('（')[0]) in n) for e in lst if norm(e))


def ok_q(q):
    return isinstance(q.get('options'), list) and len(set(q['options'])) == len(q['options']) >= 2 \
        and isinstance(q.get('answer'), int) and 0 <= q['answer'] < len(q['options']) and q.get('q')


log = []
cat = cats[patch['category']]
byk = {it['key']: it for it in cat['items']}
for u in patch.get('update', []):
    it = byk.get(u['key'])
    if not it:
        log.append('跳过（无此点）' + u['key']); continue
    n = 0
    fl = it.setdefault('分类', [])
    for f in u.get('add_分类', []):
        ex = next((x for x in fl if norm(x['类']) == norm(f['类'])), None)
        if ex is None:
            fl.append({'类': f['类'], '说明': f.get('说明', ''), '代表': '', '例子': list(f.get('例子', []))}); n += 1
        else:
            for e in f.get('例子', []):
                if not has_sent(ex['例子'], e):
                    ex['例子'].append(e); n += 1
            if not ex.get('说明') and f.get('说明'):
                ex['说明'] = f['说明']
    exl = it.setdefault('例子', [])
    for e in u.get('add_例子', []):
        if not has_sent(exl, e):
            exl.append(e); n += 1
    jl = it.setdefault('例句解析', [])
    for j in u.get('add_例句解析', []):
        if not has_sent([x['句'] for x in jl], j['句']):
            jl.append(j); n += 1
    zr = it.setdefault('怎么认', [])
    for z in u.get('add_怎么认', []):
        if norm(z) not in [norm(x) for x in zr]:
            zr.append(z); n += 1
    if u.get('append_深讲') and norm(u['append_深讲'])[:20] not in norm(it.get('深讲', '')):
        it['深讲'] = (it.get('深讲', '') + ('\n' if it.get('深讲') else '') + u['append_深讲']).strip(); n += 1
    ql = it.setdefault('练习', [])
    for q in u.get('add_练习', []):
        if ok_q(q) and norm(q['q']) not in [norm(x['q']) for x in ql]:
            ql.append(q); n += 1
    log.append(f'补 {u["key"]} +{n}')
for it in patch.get('new', []):
    if it['key'] in byk or any(x['name'] == it['name'] and x.get('subtitle') == it.get('subtitle') for x in cat['items']):
        log.append('跳过（已有）' + it['key']); continue
    it.setdefault('图示', ''); it.setdefault('前置知识', []); it.setdefault('level', '初高中拓展'); it.setdefault('difficulty', '提高')
    it['练习'] = [q for q in it.get('练习', []) if ok_q(q)]
    cat['items'].append(it); byk[it['key']] = it
    log.append('新增 ' + it['key'])

tail = src[len(src.rstrip()):]
semi = ';' if src.rstrip().endswith(';') else ''
open(P, 'w', encoding='utf8').write(head + '=' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + semi + tail)
print('\n'.join(log))
print(patch['category'], '现共', len(cat['items']))
