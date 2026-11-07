"""A23C 批3 共用：按题干对上题目，只给列出的（真正有迷惑性的）错项写误解标注。
幂等：已有「误解标注」的题不动。正反例按题目本身机械生成：
  spot → [fix + '√', 原句 s + '✗']；blank → [题干填正确项 + '√', 题干填该错项 + '✗']。
不改题干、选项、答案、fix 与解析。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import json
from fix_a23c_lib import load, path, dumps

STYLES = [(',', ':'), (', ', ': ')]


def save(name, s, m, obj, changed):
    """按原文件的 JSON 分隔符风格整体重写（data_lab.js 是 ', ' / ': '，其余多为紧凑式）；都复现不了就报错。"""
    if not changed:
        return False
    for sep in STYLES:
        d = lambda o: json.dumps(o, ensure_ascii=False, separators=sep)
        if m.group(1) + d(json.loads(m.group(2))) + m.group(3) == s:
            open(path(name), 'w', encoding='utf8').write(m.group(1) + d(obj) + m.group(3))
            return True
    raise SystemExit('无法原样复现 %s，未写入' % name)


def pair(mode, q, opt):
    if mode == 'spot':
        return [q['fix'] + '√', q['s'] + '✗']
    ans = q['opts'][q['a']]
    return [q['s'].replace('___', ans) + '√', q['s'].replace('___', opt) + '✗']


def apply(name, mode, MAP):
    s, m, obj = load(name)
    arr = obj['modes'][mode]
    changed, seen = [], set()
    for q in arr:
        key = q.get('s')
        if key not in MAP:
            continue
        assert key not in seen, 'duplicate stem: ' + key
        seen.add(key)
        if q.get('误解标注'):
            continue
        old = dumps(q); mz = []
        for k, o in enumerate(q['opts']):
            if o in MAP[key]:
                assert k != q['a'], 'annotated correct option: ' + key
                mz.append({'选项': chr(65 + k), '选项文本': o, '误解': MAP[key][o], '正反例': pair(mode, q, o)})
        assert len(mz) == len(MAP[key]), 'option text mismatch: ' + key
        q['误解标注'] = mz
        changed.append((old, q))
    missing = set(MAP) - seen
    assert not missing, 'stems not found: %s' % missing
    save(name, s, m, obj, changed)
    print('%s %s: %d 题新标注（清单 %d 题）' % (name, mode, len(changed), len(MAP)))
    return len(changed)
