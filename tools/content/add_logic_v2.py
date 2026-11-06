#!/usr/bin/env python3
"""逻辑区扩充 v2（2026-11-06）：把 /workspace/work/logic_add 下的 w1–w5（新专题）和 w6–w7（已有专题增厚）
合进 newhanzi/yuwen/data.js 的 logic 与 newhanzi/quiz/data_logic.js。幂等：同名专题/同题干不重复加入。
用法：python3 tools/content/add_logic_v2.py [素材目录]
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools/content/logic_v2')
YW = os.path.join(ROOT, 'newhanzi/yuwen/data.js')
QZ = os.path.join(ROOT, 'newhanzi/quiz/data_logic.js')


def load_js(path, prefix):
    s = open(path, encoding='utf-8').read()
    assert s.startswith(prefix), path
    return json.loads(s[len(prefix):].strip().rstrip(';'))


def dump_js(path, prefix, obj):
    open(path, 'w', encoding='utf-8').write(prefix + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';\n')


def norm_judge(q):
    """判断题误解标注口径：engine 里 ⭕对=下标1(B)、❌错=下标0(A)。标注写孩子会误选的那个。"""
    if 'misc' in q:
        q.pop('misc')
    ms = q.get('误解标注') or []
    for m in ms:
        if q['a'] is True:
            m['选项'], m['选项文本'] = 'A', '错误'
        else:
            m['选项'], m['选项文本'] = 'B', '正确'
    return q


def main():
    yp = 'window.NHZ_YUWEN ='
    qp = 'window.NHZ_QUIZ ='
    yw = load_js(YW, yp)
    qz = load_js(QZ, qp)
    cats = yw['logic']['categories']
    names = {it['name'] for c in cats for it in c['items']}
    seen_q = {(m, q.get('q') or q.get('s')) for m, arr in qz['modes'].items() for q in arr}
    added_items = added_q = enriched = 0

    for w in ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7']:
        p = os.path.join(SRC, w + '.json')
        if not os.path.exists(p):
            continue
        d = json.load(open(p, encoding='utf-8'))
        # 新专题
        if d.get('items'):
            cid = d['category']['id']
            cat = next((c for c in cats if c['id'] == cid), None)
            if cat is None:
                cat = {'id': cid, 'name': d['category']['name'], 'items': []}
                cats.append(cat)
            for it in d['items']:
                if it['name'] in names:
                    continue
                cat['items'].append(it)
                names.add(it['name'])
                added_items += 1
        # 增厚
        for name, e in (d.get('enrich') or {}).items():
            it = next((i for c in cats for i in c['items'] if i['name'] == name), None)
            if it is None:
                print('WARN 找不到专题', name)
                continue
            changed = False
            if e.get('深讲') and it.get('深讲') != e['深讲']:
                it['深讲'] = e['深讲']; changed = True
            if e.get('例子_replace') and it.get('例子') != e['例子_replace']:
                it['例子'] = list(e['例子_replace']); changed = True
            if e.get('地图') and it.get('地图') != e['地图']:
                it['地图'] = e['地图']; changed = True
            for f in ['例子', '例句解析', '练习']:
                for x in e.get(f + '_add') or []:
                    arr = it.setdefault(f, [])
                    if x not in arr:
                        arr.append(x); changed = True
            if e.get('来源') and it.get('来源') != e['来源']:
                it['来源'] = e['来源']; changed = True
            for k in ['目标', '讲解', '口诀', '类比', '辨析', '易错', '前置知识', '决策树', '怎么认', '讨论卡', 'name_new']:
                if k in e and k != 'name_new' and it.get(k) != e[k]:
                    it[k] = e[k]; changed = True
            enriched += changed
        # 题库
        for mode, arr in (d.get('quiz') or {}).items():
            tgt = qz['modes'].setdefault(mode, [])
            for q in arr:
                if mode == 'judge':
                    norm_judge(q)
                key = (mode, q.get('q') or q.get('s'))
                if key in seen_q:
                    continue
                if q.get('point') not in names:
                    print('WARN point 不在专题里', mode, q.get('point'))
                tgt.append(q)
                seen_q.add(key)
                added_q += 1

    dump_js(YW, yp, yw)
    dump_js(QZ, qp, qz)
    total = sum(len(c['items']) for c in cats)
    print(f'新增专题 {added_items}，增厚 {enriched}，新增题 {added_q}；逻辑专题共 {total}，题库',
          {m: len(a) for m, a in qz['modes'].items()})


if __name__ == '__main__':
    main()
