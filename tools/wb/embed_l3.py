#!/usr/bin/env python3
"""把 docs/yufa-neirong/l3-huilian.json 里某项的 L3 + 回练草稿嵌入白板场景（缺 L3 回炉，lint R4）。

用法：
  python3 tools/wb/embed_l3.py 比喻 拟人 …            # 写入 newhanzi/wb/s/<id>.js（插在「口诀」end 幕前）
  python3 tools/wb/embed_l3.py --dry 比喻             # 只打印将插入的两幕
  python3 tools/wb/embed_l3.py --src-file F.json 比喻  # F.json：{"比喻": "替换后的 src", …}（按 cankao 核实后的出处）

规则（docs/anim/jiaojie/yufa-l3-buqi.md「做法」）：
- 回练 → review lv2：task / answer（去句末“。”）/ ok / good（过长且含“：”时拆成 good + why；去掉“（或……）”备选）/ rule（超 36 字取第一分句）。
- L3 → test lv3：tab 沿用草稿；h = 草稿 ask；行 = 草稿 ex（最多 3 行；错句 ✗ 后紧跟改正行 ✓）；
  第 1 行 say = 草稿 say[0] 去掉“想一想：”；expl = say[1:]；长句按 460/字数 缩小字号 size。
- 已有 lv:3 幕的项跳过（幂等）。
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WB = os.path.join(ROOT, 'newhanzi', 'wb')
DRAFT = os.path.join(ROOT, 'docs', 'yufa-neirong', 'l3-huilian.json')


def js(v):
    """JS 字面量：键不加引号、字符串单引号（与现有场景文件风格一致）。"""
    if isinstance(v, bool): return 'true' if v else 'false'
    if v is None: return 'null'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, str): return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if isinstance(v, list): return '[' + ', '.join(js(x) for x in v) + ']'
    return '{ ' + ', '.join((k if re.match(r'^[A-Za-z_]\w*$', k) else js(k)) + ': ' + js(x) for k, x in v.items()) + ' }'


def strip_end(s): return re.sub(r'[。]$', '', s.strip())


def review(h):
    good = re.sub(r'（或[^）]*）', '', h['good']).strip()
    why = None
    if '：' in good and len(good) > 14:
        good, why = good.split('：', 1)
    sc = {'k': 'review', 'lv': 2, 'tab': h.get('tab', '判对了吗'), 'task': h['task'], 'answer': strip_end(h['answer']), 'ok': h['ok']}
    if not h['ok']: sc['good'] = strip_end(good)
    if why: sc['why'] = strip_end(why)
    rule = h['rule']
    if len(rule) > 36: rule = re.split(r'[；;]', rule)[0] + '。'
    sc['rule'] = rule
    return sc


def test(l3, src=None):
    say = l3['say']
    rows = []
    for e in l3['ex']:
        if len(rows) >= 3: break
        first = not rows
        s0 = re.sub(r'^想一想：', '', say[0]) if first else e['s']
        if e.get('note'):
            rows.append({'w': e['s'], 'ok': e['ok'], 'say': s0, 'r': e['note'], 'note': e['note']})
        elif e['ok']:
            rows.append({'w': e['s'], 'ok': True, 'say': s0, 'r': '能说。', 'note': '能说'})
        else:
            rows.append({'w': e['s'], 'ok': False, 'say': s0, 'r': e.get('why') or '不对。', 'note': '不对'})
        if not e['ok'] and e.get('fix'):
            rows.append({'w': e['fix'], 'ok': True, 'say': '改成：' + e['fix'], 'r': '改过来就通顺了。', 'note': '改正'})
    rows = rows[:3]
    sc = {'k': 'test', 'lv': 3, 'tab': l3['tab'], 'h': l3['ask'], 'src': src or l3['src'], 'rows': rows}
    n = max(len(r['w']) for r in rows)
    size = round(460 / n)
    if size < 38: sc['size'] = size
    if len(say) > 1: sc['expl'] = say[1:]
    return sc


def main():
    a = sys.argv[1:]
    dry = '--dry' in a
    srcmap = {}
    if '--src-file' in a:
        i = a.index('--src-file'); srcmap = json.load(open(a[i + 1], encoding='utf-8')); del a[i:i + 2]
    names = [x for x in a if not x.startswith('--')]
    draft = json.load(open(DRAFT, encoding='utf-8'))['items']
    idx = dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', open(os.path.join(WB, 'index.js'), encoding='utf-8').read()))
    for n in names:
        if n not in draft: print('✗ 草稿里没有', n); continue
        f = os.path.join(WB, 's', idx[n] + '.js')
        s = open(f, encoding='utf-8').read()
        if re.search(r'\blv:\s*3\b', s): print('· 已有 L3，跳过', n); continue
        it = draft[n]
        add = '  ' + js(review(it['huilian'])) + ',\n  ' + js(test(it['l3'], srcmap.get(n))) + ',\n'
        if dry: print('==', n, '\n' + add); continue
        m = list(re.finditer(r"^\s*\{\s*k:\s*'end'", s, re.M))
        if not m: print('✗ 找不到 end 幕', n); continue
        p = m[-1].start()
        s = s[:p] + add + s[p:]
        open(f, 'w', encoding='utf-8').write(s)
        print('✓', n, '→', os.path.relpath(f, ROOT))


if __name__ == '__main__':
    main()
