#!/usr/bin/env python3
"""偏旁部首知识库构建：研究报告(106部首含义) + 本库3500字映射。

生成 newhanzi/bushou/data.js  (window.NHZ_BUSHOU)，file:// 与 http:// 通用。
数据结构：
  { bushou, benzi, bianti, shuowen, shuowen_url, meaning, semantic,
    examples: [{z, w}], chars: [...], count, has_meaning }
按 count 降序；有含义的 106 条在前，其余纯字表附后。
"""
import json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
RESEARCH = '/tmp/bushou_raw.json'

# 我们的 bushou label -> 研究部首（变体归并）
VARIANT_MAP = {
    '刂': '刀', '牜': '牛', '⻊': '足', '⺮': '竹', '罒': '网',
    '灬': '火', '氺': '水', '⺈': '刀', '㔾': '卩', '⺊': '卜',
    '⺌': '小', '⺗': '心', '⺶': '羊', '⺷': '羊', '饣': '食',
    '⺀': '卜',
}

def load_js_var(path, var):
    with open(path, encoding='utf-8') as f:
        txt = f.read()
    prefix = 'window.%s = ' % var
    assert txt.startswith(prefix), path
    body = txt[len(prefix):]
    if body.endswith(';'):
        body = body[:-1]
    return json.loads(body)

# 本地说解索引（ziku/sources/shuowen 提取，539 部首）
SHUOWEN_RAD = {}
try:
    SHUOWEN_RAD = json.load(open('/tmp/shuowen_rad.json', encoding='utf-8'))
except Exception:
    pass

def main():
    raw = json.load(open(RESEARCH, encoding='utf-8'))
    idx = load_js_var(os.path.join(ROOT, 'data', 'index.js'), 'NHZ_INDEX')

    # 研究部首索引：bushou -> entry
    by_bushou = {r['bushou']: r for r in raw}
    # 本字也建索引
    by_benzi = {}
    for r in raw:
        if r['benzi'] and '/' not in r['benzi']:
            by_benzi.setdefault(r['benzi'], r['bushou'])

    # 我们的字按 bushou 分组
    our = {}
    char_info = {}  # z -> (tl, st) for sorting
    char_set = set()
    for e in idx:
        our.setdefault(e['bu'], []).append(e['z'])
        char_info[e['z']] = (e['tl'], e['st'])
        char_set.add(e['z'])

    def sort_chars(chars):
        return sorted(set(chars), key=lambda z: (char_info.get(z, ('', 99))[1], char_info.get(z, ('', 99))[0]))

    # 归并：research entry key -> chars
    merged = {r['bushou']: [] for r in raw}
    plain = {}  # 未匹配 label -> chars
    for label, chars in our.items():
        target = None
        if label in by_bushou:
            target = label
        elif label in VARIANT_MAP and VARIANT_MAP[label] in by_bushou:
            target = VARIANT_MAP[label]
        elif label in by_benzi and by_benzi[label] in by_bushou:
            target = by_benzi[label]
        else:
            # 复合 label 取首段再试
            first = label.split('、')[0]
            if first in by_bushou:
                target = first
            elif first in VARIANT_MAP and VARIANT_MAP[first] in by_bushou:
                target = VARIANT_MAP[first]
        if target:
            merged[target].extend(chars)
        else:
            plain[label] = chars

    out = []
    for r in raw:
        chars = sort_chars(merged[r['bushou']])
        examples = [{'z': e['z'], 'w': e['w'], 'in3500': e['z'] in char_set}
                    for e in r['examples']]
        out.append({
            'bushou': r['bushou'], 'benzi': r['benzi'],
            'bianti': r['bianti'], 'shuowen': r['shuowen'],
            'shuowen_url': r['shuowen_url'], 'meaning': r['meaning'],
            'semantic': r['semantic'], 'examples': examples,
            'chars': chars, 'count': len(chars), 'has_meaning': True,
        })
    # 纯字表条目按字数降序附后；能从《说文解字》找到说解的补上
    for label in sorted(plain, key=lambda l: -len(our[l])):
        chars = sort_chars(plain[label])
        sw = SHUOWEN_RAD.get(label, '') or SHUOWEN_RAD.get(label.split('、')[0], '')
        out.append({
            'bushou': label, 'benzi': '', 'bianti': '', 'shuowen': sw,
            'shuowen_url': '', 'meaning': '', 'semantic': '',
            'examples': [], 'chars': chars, 'count': len(chars),
            'has_meaning': bool(sw),
        })

    out.sort(key=lambda r: (-r['count'], r['bushou']))
    # 有含义的优先，其次按字数
    out.sort(key=lambda r: (0 if r['has_meaning'] else 1, -r['count']))

    os.makedirs(os.path.join(ROOT, 'bushou'), exist_ok=True)
    with open(os.path.join(ROOT, 'bushou', 'data.js'), 'w', encoding='utf-8') as f:
        f.write('window.NHZ_BUSHOU = ')
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';')

    # 字 -> 部首 关联表（供字卡反向查询部首含义；变体已在归并时解决）
    zi_map = {}
    for r in out:
        for z in r['chars']:
            zi_map[z] = r['bushou']
    with open(os.path.join(ROOT, 'bushou', 'zi_map.js'), 'w', encoding='utf-8') as f:
        f.write('window.NHZ_ZI_BUSHOU = ')
        json.dump(zi_map, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';')
    print('zi_map: %d 字' % len(zi_map))

    n_rich = sum(1 for r in out if r['has_meaning'])
    n_plain = len(out) - n_rich
    covered = sum(r['count'] for r in out if r['has_meaning'])
    print('rich: %d, plain: %d, total entries: %d' % (n_rich, n_plain, len(out)))
    print('有含义部首覆盖字数: %d / 3500' % covered)
    print('Top5:', [(r['bushou'], r['count']) for r in out[:5]])

if __name__ == '__main__':
    main()
