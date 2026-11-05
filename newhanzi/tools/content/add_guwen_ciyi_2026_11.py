#!/usr/bin/env python3
"""古文补充（2026-11-06）：通假 / 古今异义 / 一词多义。
来源：调研整理稿 guwen-research/ciyi.md（统编初中及小学课文，多源交叉核对；标「待核」的条目一律跳过）。
规则：已有的字/词只补新例句（不重复）；新字/词按现有格式新建，并生成 2–3 道练习。
用法：python3 tools/content/add_guwen_ciyi_2026_11.py <ciyi.md> <tongjia|guyin|duoyi>"""
import json, os, re, sys, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(ROOT, 'data', 'guwen_knowledge.js')
md_path, which = sys.argv[1], sys.argv[2]
md = open(md_path, encoding='utf8').read()
src = open(P, encoding='utf8').read()
head, body = src.split('=', 1)
K = json.loads(body.strip().rstrip(';'))
cat = next(c for c in K['categories'] if c['id'] == which)
rnd = random.Random(20261106)


def section(title_prefix):
    m = re.search(r'^## ' + re.escape(title_prefix) + r'.*?$(.*?)(?=^## )', md, re.S | re.M)
    return m.group(1) if m else ''


def rows(text):
    out = []
    for ln in text.splitlines():
        if not ln.startswith('|') or set(ln) <= set('|-: '):
            continue
        cells = [c.strip() for c in ln.strip().strip('|').split('|')]
        out.append(cells)
    return out


def clean(s):
    s = re.sub(r'\*\*', '', s)
    return s.strip()


def pian(s):
    s = clean(s)
    s = re.sub(r'（.*?）', '', s).strip()
    s = s.strip('《》')
    return s if s.startswith('《') else ('《' + s + '》' if s else '')


def opts(right, pool, n=4):
    pool = [p for p in dict.fromkeys(pool) if p and p != right]
    rnd.shuffle(pool)
    o = pool[:n - 1] + [right]
    rnd.shuffle(o)
    return o, o.index(right)


added, merged = [], []
byname = {}
for it in cat['items']:
    byname.setdefault(it['name'], []).append(it)
keys = {it['key'] for it in cat['items']}

if which == 'tongjia':
    data = {}
    for r in rows(section('1 通假字')):
        if r[0] == '字' or '→' not in r[0]:
            continue
        if any('待核' in c for c in r) or '；' in r[0]:
            continue
        a, b = [x.strip() for x in clean(r[0]).split('→', 1)]
        sent = clean(r[1]).rstrip('。')
        if len(r) == 6:   # 小学表多一列册次
            title, gloss = r[2], r[4]
        else:
            title, gloss = r[2], r[3]
        d = data.setdefault((a, b), {'ex': [], 'gloss': clean(gloss)})
        if sent not in [e[0] for e in d['ex']]:
            d['ex'].append((sent, pian(title)))
    allben = [b for (_, b) in data] + [it['subtitle'].replace('通 ', '') for it in cat['items']]
    allzi = [a for (a, _) in data] + [it['name'] for it in cat['items']]
    for (a, b), d in data.items():
        ex = byname.get(a, [])
        tgt = next((it for it in ex if it.get('subtitle') == '通 ' + b), None)
        if tgt:
            n0 = len(tgt['例子'])
            for s, t in d['ex']:
                if not any(s in e or e in s for e in tgt['例子']):
                    tgt['例子'].append(s)
                    tgt.setdefault('例句解析', []).append({'句': s, '析': f"'{a}'通'{b}'，{d['gloss']}。（{t}）"})
            if len(tgt['例子']) > n0:
                merged.append(f'{a}→{b}')
            continue
        key = f'tongjia:{a}' if f'tongjia:{a}' not in keys else f'tongjia:{a}（通{b}）'
        keys.add(key)
        s0 = d['ex'][0][0]
        o1, a1 = opts(b, allben)
        o2, a2 = opts(a, allzi)
        it = {
            'name': a, 'key': key, 'subtitle': '通 ' + b, '图示': '',
            '例子': [s for s, _ in d['ex']],
            '讲解': '通' + b, '口诀': f'{a}通{b}，读本字',
            '深讲': f"'{a}'通'{b}'。本字意思：{d['gloss']}。",
            '辨析': f"'{a}'是通假字，读作本字'{b}'，不要按原字的意思读。",
            '怎么认': ['先读原字，讲不通时想想它是不是通假字。', '通假字读本字的音和意思。', '记住“通假字＋通＋本字”的格式。'],
            '例句解析': [{'句': s, '析': f"'{a}'通'{b}'，{d['gloss']}。（{t}）"} for s, t in d['ex']],
            '练习': [
                {'q': f'“{s0}”中“{a}”通哪个字？', 'options': o1, 'answer': a1, '解析': f'“{a}”通“{b}”，意思是{d["gloss"]}。', '类': '选本字'},
                {'q': f'下面哪个字是通假字，通“{b}”？', 'options': o2, 'answer': a2, '解析': f'“{a}”通“{b}”，按本字理解。', '类': '选通假字'},
            ],
            '前置知识': [], 'level': '初高中拓展', 'difficulty': '提高', '来源': '统编教材课文；多份教辅交叉核对',
        }
        cat['items'].append(it)
        added.append(f'{a}→{b}')

elif which == 'guyin':
    data = []
    for r in rows(section('2 古今异义')):
        if r[0] == '#' or len(r) < 7:
            continue
        if any('待核' in c for c in r):
            continue
        w, gu, jin, sent, title = clean(r[1]), clean(r[2]), clean(r[3]), clean(r[4]), r[5]
        data.append((w, gu, jin, sent.split(' / ')[0].rstrip('。'), pian(title)))
    allgu = [d[1] for d in data] + [it['分类'][0]['说明'] for it in cat['items'] if it.get('分类')]
    alljin = [d[2] for d in data]
    for w, gu, jin, sent, title in data:
        if w in byname:
            tgt = byname[w][0]
            if not any(sent in e or e in sent for e in tgt['例子']):
                tgt['例子'].append(sent)
                tgt.setdefault('例句解析', []).append({'句': sent, '析': f"这里'{w}'是古义：{gu}。（{title}）"})
                merged.append(w)
            continue
        if f'guyin:{w}' in keys:
            continue
        keys.add(f'guyin:{w}')
        o1, a1 = opts(gu, allgu)
        o2, a2 = opts(jin, alljin)
        it = {
            'name': w, 'key': f'guyin:{w}', 'subtitle': f'古义：{gu} / 今义：{jin}', '图示': '',
            '例子': [sent], '讲解': f'古义：{gu} / 今义：{jin}', '口诀': '先按今义读，不通换古义',
            '分类': [{'类': '古义', '说明': gu, '代表': '', '例子': [sent]}, {'类': '今义', '说明': jin, '代表': '', '例子': []}],
            '辨析': f'古义是{gu}，今义是{jin}，不要按今义读古文。', '深讲': '',
            '怎么认': ['先按今义试读。', '讲不通时换古义。', '古今意思正相反的词最易错，要特别留意。'],
            '例句解析': [{'句': sent, '析': f"这里'{w}'是古义：{gu}，不要按今义'{jin}'理解。（{title}）"}],
            '练习': [
                {'q': f'“{sent}”中“{w}”的古义是？', 'options': o1, 'answer': a1, '解析': f'“{w}”古义是{gu}，今义是{jin}。', '类': '选古义'},
                {'q': f'“{w}”的今义是？', 'options': o2, 'answer': a2, '解析': f'“{w}”古义是{gu}，今义是{jin}。', '类': '选今义'},
            ],
            '前置知识': [], 'level': '初高中拓展', 'difficulty': '提高', '来源': '统编教材课文；多份教辅交叉核对',
        }
        cat['items'].append(it)
        added.append(w)

elif which == 'duoyi':
    sec = section('3 一词多义')
    entries = []
    for ln in sec.splitlines():
        m = re.match(r'\d+\.\s*\*\*(.+?)\*\*（.*?）\s*(.*)$', ln)
        if not m:
            continue
        zi, rest = m.group(1), m.group(2)
        senses = []
        for part in re.split(r'[①②③④⑤⑥⑦⑧]', rest)[1:]:
            if '待核' in part or '｜' not in part:
                continue
            mean, exs = part.split('｜', 1)
            exl = []
            for e in re.split(r'；', exs):
                e = clean(e)
                mm = re.match(r'(.+?)（(.+?)）\s*$', e)
                s, t = (mm.group(1), mm.group(2)) if mm else (e, '')
                s = re.sub(r'（.*$', '', s).strip().rstrip('。')
                if s and not s.startswith('同句') and not s.startswith('同'):
                    exl.append((s, t))
                elif s.startswith('同句'):
                    pass
            senses.append((clean(mean), exl))
        senses = [x for x in senses if x[1]]
        if len(senses) >= 2:
            entries.append((zi, senses))
    allmean = [m for _, ss in entries for m, _ in ss]
    for zi, senses in entries:
        if zi in byname:
            tgt = byname[zi][0]
            have = tgt['讲解']
            alls = tgt['例子']
            ch = False
            for mean, exl in senses:
                newex = [s for s, _ in exl if not any(s in e or e in s for e in alls)]
                if not newex:
                    continue
                toks = set(re.split(r'[、，；]', mean))
                fl = next((f for f in tgt.get('分类', []) if f['类'] == mean or toks & set(re.split(r'[、，；]', f['类']))), None)
                if fl is None:
                    fl = {'类': mean, '说明': '', '代表': '', '例子': []}
                    tgt.setdefault('分类', []).append(fl)
                    tgt['讲解'] = tgt['讲解'].rstrip('。') + '；' + mean + '。'
                fl['例子'] += newex
                tgt['例子'] += newex
                for s in newex:
                    tgt.setdefault('例句解析', []).append({'句': s, '析': f"'{zi}'在这里是'{fl['类']}'的意思。"})
                ch = True
            if ch:
                merged.append(zi)
            continue
        if f'duoyi:{zi}' in keys:
            continue
        keys.add(f'duoyi:{zi}')
        exs = [s for _, exl in senses for s, _ in exl]
        qs = []
        for mean, exl in senses[:3]:
            o, a = opts(mean, allmean)
            qs.append({'q': f'“{exl[0][0]}”中“{zi}”是什么意思？', 'options': o, 'answer': a,
                       '解析': f'这里的“{zi}”是“{mean}”的意思。', '类': '选义项'})
        it = {
            'name': zi, '图示': '', 'key': f'duoyi:{zi}', 'subtitle': f'{len(senses)}个义项',
            '例子': exs, '讲解': '；'.join(m for m, _ in senses) + '。', '口诀': '',
            '分类': [{'类': m, '说明': '', '代表': '', '例子': [s for s, _ in exl]} for m, exl in senses],
            '深讲': '',
            '怎么认': ['先看语境：这个字在句中讲什么。', '由本义想引申义。', '对照“分类”里的义项，一个一个排除。'],
            '例句解析': [{'句': s, '析': f"'{zi}'在这里是'{m}'的意思。" + (f'（{pian(t)}）' if t else '')} for m, exl in senses for s, t in exl],
            '练习': qs, '前置知识': [], 'level': '初高中拓展', 'difficulty': '提高', '来源': '统编教材课文；多份教辅交叉核对',
        }
        cat['items'].append(it)
        added.append(zi)

tail = src[len(src.rstrip()):]
semi = ';' if src.rstrip().endswith(';') else ''
open(P, 'w', encoding='utf8').write(head + '=' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + semi + tail)
print(which, '新增', len(added), '：', '、'.join(added))
print(which, '补例句', len(merged), '：', '、'.join(merged))
print(which, '现共', len(cat['items']))
