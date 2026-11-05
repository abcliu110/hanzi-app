#!/usr/bin/env python3
"""古诗库重建（幂等，可重复运行）：
  1. 统编小学课内古诗词（tools/content/shici_xiaoxue.json）补齐、校正为课本通行文本，加年级/册次/来源字段；
  2. 版本错误改正（望庐山瀑布/独坐敬亭山/马诗），原错版本保留为“拓展”；
  3. 其余诗词标“拓展/非课内”，排在课内之后；清洗旧字形异体、括号校勘注释、恢复逗号；
  4. 删除重复的《杜少府之任蜀州》（保留《送杜少府之任蜀州》），修正名句引用；
  5. 同步 shangxi.js（标题、逐句讲前缀、异体）与 shiju.js（字→诗索引重建）。
运行：python3 tools/content/build_shici.py
"""
import json, os, re, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'data')
TC = os.path.join(ROOT, 'tools/content')


def load_js(name, prefix):
    s = open(os.path.join(D, name), encoding='utf8').read()
    i = s.index(prefix) + len(prefix)
    body = s[i:].strip()
    body = body[body.index('=') + 1:].strip().rstrip(';')
    return json.loads(body)


def dump_js(name, var, obj):
    open(os.path.join(D, name), 'w', encoding='utf8').write(
        'window.%s = %s;\n' % (var, json.dumps(obj, ensure_ascii=False, separators=(',', ':'))))


VAR = json.load(open(os.path.join(TC, 'variants.json'), encoding='utf8'))


def fix_variants(s):
    for a, b in VAR['phrase']:
        s = s.replace(a, b)
    for a, b in VAR['char']:
        s = s.replace(a, b)
    sh = VAR['shen']
    if sh['from'] in s:
        keep = {}
        for i, w in enumerate(sh['allow']):
            tok = '\u0000%d\u0000' % i
            if w in s:
                s = s.replace(w, tok); keep[tok] = w
        s = s.replace(sh['from'], sh['to'])
        for tok, w in keep.items():
            s = s.replace(tok, w)
    return s


hz = lambda s: re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]', '', s)
CI_PAI = ('忆江南', '渔歌子', '清平乐', '西江月', '卜算子', '浣溪沙')


def is_ci(title, ticai=''):
    return ticai in ('宋词', '词') or title.startswith(CI_PAI)


def split_lines(text, ci):
    pat = r'[^。？！]+[。？！]+[”’]?' if ci else r'[^，。？！；]+[，。？！；]+[”’]?'
    out = [p.strip() for p in re.findall(pat, text) if p.strip()]
    return out


def restore_punct(lines):
    """chinese-poetry 转出的“每句都是。”：按上下句恢复“，”。已有？！的句子保持，并重新起算。"""
    if not lines or not all(l.endswith('。') for l in lines if not l.endswith(('？', '！'))):
        return lines
    out, pos = [], 0
    for l in lines:
        if l.endswith(('？', '！')):
            out.append(l); pos = 0; continue
        if pos == 0:
            out.append(l[:-1] + '，'); pos = 1
        else:
            out.append(l); pos = 0
    if out and out[-1].endswith('，'):
        out[-1] = out[-1][:-1] + '。'
    return out


def clean_title(t):
    t = t.replace('”', '').replace('“', '')
    t = re.sub(r'(\S)\s+([一二三四五六七八九十]+)$', r'\1·其\2', t)   # 出塞二首 一 → 出塞二首·其一
    t = re.sub(r'^(辋川集|皇甫岳云溪杂题五首|金陵五题)\s+', '', t)
    t = re.sub(r'\s+', '·', t.strip())
    return fix_variants(t)


def ticai_of(t, lines, ci):
    if ci:
        return '词'
    over = {'古朗月行': '古体诗', '江南': '乐府诗', '敕勒歌': '乐府诗', '长歌行': '乐府诗',
            '迢迢牵牛星': '古体诗', '采薇': '诗经', '游子吟': '古体诗'}
    for k, v in over.items():
        if t.startswith(k):
            return v
    n = [len(hz(l)) for l in lines]
    if len(set(n)) == 1 and n[0] in (5, 7) and len(n) in (4, 8):
        return ('五' if n[0] == 5 else '七') + ('绝' if len(n) == 4 else '律')
    return '古体诗'


def grade_of(ce):
    g = int(ce[0])
    return '1-2' if g <= 2 else ('3-4' if g <= 4 else '5-6')


CE_ORDER = ['1上', '1下', '2上', '2下', '3上', '3下', '4上', '4下', '5上', '5下', '6上', '6下']
EXT_SRC = 'chinese-poetry（github.com/chinese-poetry/chinese-poetry，MIT）'

S = load_js('shici.js', 'NHZ_SHICI')
SX = load_js('shangxi.js', 'NHZ_SHANGXI')
X = json.load(open(os.path.join(TC, 'shici_xiaoxue.json'), encoding='utf8'))['poems']
CP = json.load(open(os.path.join(TC, 'cp_punct.json'), encoding='utf8'))['by_id']
P = S['poems']
byo = {p['order']: p for p in P}
next_order = [max(byo) + 1]
rename = {}   # (旧标题, 作者) -> 新标题（shangxi 跟随）


def new_order():
    o = next_order[0]; next_order[0] += 1; return o


def add_poem(d):
    d.setdefault('order', new_order())
    d.setdefault('id', str(uuid.uuid5(uuid.NAMESPACE_URL, 'nhz-shici:%s:%s' % (d['author'], d['title']))))
    P.append(d); byo[d['order']] = d
    return d


def find_title(t, a):
    for p in P:
        if p['title'] == t and p['author'] == a:
            return p


# ---- 1. 重复：杜少府之任蜀州 → 送杜少府之任蜀州 ----
dup = find_title('杜少府之任蜀州', '王勃')
keep = find_title('送杜少府之任蜀州', '王勃')
if dup and keep:
    P.remove(dup); byo.pop(dup['order'])
    for f in S['famous']:
        if f.get('order') == dup['order']:
            f['order'] = keep['order']
    for g in S['imagery']:
        g['poems'] = [keep['order'] if o == dup['order'] else o for o in g['poems']]
    SX[:] = [x for x in SX if not (x['t'] == '杜少府之任蜀州' and x['a'] == '王勃')]

# ---- 2. 错版本：原文保留为拓展，原 order 改成课本选篇 ----
MOVE = [  # (原order, 原文首句前缀, 拓展标题, 课本标题)
    (2, '西登香炉峰', '望庐山瀑布水二首·其一', '望庐山瀑布'),
    (6, '合沓牵数峰', '独坐敬亭山·其二（存疑）', '独坐敬亭山'),
    (73, '龙脊贴连钱', '马诗二十三首·其一', '马诗'),
]
for o, first, ext_title, kt in MOVE:
    p = byo.get(o)
    if p and p['lines'] and p['lines'][0].startswith(first) and not find_title(ext_title, p['author']):
        lines = [l for l in p['lines'] if not l.startswith('（') and not l.startswith('又见')]
        ext = dict(author=p['author'], title=ext_title, lines=lines, ticai=p['ticai'], dynasty=p['dynasty'])
        if o == 6:
            ext['note'] = '原数据混入志书出处注释，已删；此首见于地方志，非《李太白集》通行篇目，真伪存疑'
        add_poem(ext)
        rename[(p['title'], p['author'])] = ext_title

# ---- 3. 课内篇目：匹配已有条目或新增 ----
EXPLICIT = {'望庐山瀑布': 2, '独坐敬亭山': 6, '马诗': 73, '芙蓉楼送辛渐': 45, '凉州词（黄河远上白云间）': 39,
            '别董大': 71, '送元二使安西': 28, '悯农（其二）': 118, '鹿柴': 31, '鸟鸣涧': 30, '嫦娥': 54,
            '出塞': 44, '早春呈水部张十八员外': 64, '浪淘沙（其一）': 61, '赋得古原草送别（节选）': 120}
TITLE = {'凉州词（黄河远上白云间）': '凉州词', '凉州词（葡萄美酒夜光杯）': '凉州词', '赋得古原草送别（节选）': '赋得古原草送别'}
ke_orders = []
for x in X:
    want_title = TITLE.get(x['t'], x['t'])
    ci = is_ci(want_title)
    text = ''.join(x['lines'])
    lines = split_lines(text, ci)
    p = None
    if x['t'] in EXPLICIT:
        p = byo.get(EXPLICIT[x['t']])
        if p and p.get('ke') == '课内' and p['title'] != want_title:
            p = None
    if p is None:
        p = find_title(want_title, x['a'])
    if p is None:  # 按首句+作者匹配
        h0 = hz(lines[0])
        for q in P:
            if q['author'] == x['a'] and q['lines'] and hz(q['lines'][0]) == h0 and q.get('ke') != '课内':
                p = q; break
    if p is None:
        p = add_poem(dict(author=x['a'], title=want_title, lines=lines, dynasty=x['dyn'],
                          ticai=ticai_of(want_title, lines, ci)))
        p['sx'] = '待补'
    else:
        if (p['title'], p['author']) != (want_title, x['a']) and (p['title'], p['author']) not in rename:
            rename[(p['title'], p['author'])] = want_title
        calc = ticai_of(want_title, lines, ci)
        p['ticai'] = calc if (not p.get('ticai') or (p['ticai'] == '古体诗' and calc[-1] in '绝律')) else p['ticai']
    p.update(title=want_title, author=x['a'], lines=lines, dynasty=p.get('dynasty') or x['dyn'])
    p.update(ke='课内', grade=grade_of(x['ce']), ce=x['ce'], ceBasis=x['basis'], src=x['src'], srcUrl=x['srcUrl'],
             check=x['check'])
    for k in ('notes', 'alsoIn', 'excerpt'):
        if k in x:
            p[k] = x[k]
    ke_orders.append(p['order'])

# ---- 4. 其余：拓展/非课内，文本清洗 ----
for p in P:
    if p.get('ke') == '课内':
        continue
    p['ke'] = '拓展'
    p['grade'] = ''
    p['ce'] = ''
    old_t = p['title']
    nt = clean_title(old_t)
    if nt != old_t:
        rename[(old_t, p['author'])] = nt; p['title'] = nt
    lines = []
    for l in p['lines']:
        if re.match(r'^[（(]', l) or re.search(r'《[^》]*》[^，。]*[刊本卷]', l) or l in ('）。', '前八句仅数字不同。', '末四句。', '《上之回》为七言二句。'):
            continue
        lines.append(fix_variants(l))
    if p['title'] == '白门前':
        p['note'] = '原数据混入《李贺歌诗编》校勘注释，已删；此诗为《上之回》别本'
    cp = CP.get(p['id'])
    if cp and len(cp['punct']) == len(lines):
        lines = [re.sub(r'[，。？！；：、]+$', '', l) + cp['punct'][i] for i, l in enumerate(lines)]
        p['check'] = '待核对（文字未与通行本逐字比对；标点据 chinese-poetry 原始数据恢复）'
    elif not is_ci(p['title'], p.get('ticai', '')):
        lines = restore_punct(lines)
        p.setdefault('check', '待核对（文字未与通行本逐字比对；标点按上下句恢复）')
    p['lines'] = lines
    p.setdefault('src', EXT_SRC)
    p.setdefault('check', '待核对（未与通行本逐字比对）')
    if p['title'] in ('夏夜李尚书筵送宇文石首赴县联句', '同赵二十二访张明府郊居联句'):
        p['note'] = '联句，非小学课内'

# ---- 5. 排序：课内按册次，拓展按原序 ----
ce_rank = {c: i for i, c in enumerate(CE_ORDER)}
ke_pos = {o: i for i, o in enumerate(ke_orders)}
P.sort(key=lambda p: (0, ce_rank[p['ce']], ke_pos[p['order']]) if p['ke'] == '课内' else (1, 0, p['order']))
S['poems'] = P
S['src'] = ('小学课内篇目：原文取古诗文网（gushiwen.cn），与统编语文课本 PDF（2024修订版1上–4上、5上、6上；'
            '旧版4下、5下、6下）逐句核对；拓展篇目：chinese-poetry MIT；常识卡/小传/故事/典故为原创编写')

# ---- 6. famous ----
for f in S['famous']:
    p = byo.get(f.get('order'))
    if p:
        f['title'] = p['title']
    f['line'] = fix_variants(f['line'])

# ---- 7. shangxi ----
SXFIX = {('凉州词', '王之涣'): [('春光不度', '春风不度'), ('春光也不会', '春风也不会'), ('说春光不度', '说春风不度'), ('春光根本', '春风根本')],
         ('别董大', '高适'): [('十里黄云', '千里黄云')]}
poem_by_ta = {(p['title'], p['author']): p for p in P}


def fix_obj(o):
    if isinstance(o, str):
        return fix_variants(o)
    if isinstance(o, list):
        return [fix_obj(v) for v in o]
    if isinstance(o, dict):
        return {k: fix_obj(v) for k, v in o.items()}
    return o


out = []
for x in SX:
    key = (x['t'], x['a'])
    if key in rename:
        x['t'] = rename[key]
    x = fix_obj(x)
    p = poem_by_ta.get((x['t'], x['a']))
    if not p:
        continue
    for a, b in SXFIX.get((x['t'], x['a']), []):
        x = json.loads(json.dumps(x, ensure_ascii=False).replace(a, b))
    byhz = {hz(l): l for l in p['lines']}
    zj = []
    for z in x.get('zj', []):
        if '——' in z:
            pre, rest = z.split('——', 1)
            if hz(pre) in byhz:
                z = byhz[hz(pre)] + '——' + rest
        zj.append(z)
    x['zj'] = zj
    out.append(x)
SX[:] = out
for p in P:
    if (p['title'], p['author']) in {(x['t'], x['a']) for x in SX}:
        p.pop('sx', None)
    else:
        p['sx'] = '待补'

# ---- 8. shiju：字→诗索引（课内优先，最多 8 首） ----
idx, meta = {}, {}
for p in P:
    meta[str(p['order'])] = {'t': p['title'], 'a': p['author']}
    seen = set()
    for ch in hz(''.join(p['lines'])):
        if ch in seen:
            continue
        seen.add(ch)
        lst = idx.setdefault(ch, [])
        if len(lst) < 8:
            lst.append(p['order'])

dump_js('shici.js', 'NHZ_SHICI', S)
dump_js('shangxi.js', 'NHZ_SHANGXI', SX)
dump_js('shiju.js', 'NHZ_SHIJU', {'idx': idx, 'meta': meta})
n_ke = sum(1 for p in P if p['ke'] == '课内')
print('poems', len(P), '课内', n_ke, '拓展', len(P) - n_ke, 'shangxi', len(SX),
      '待补赏析', sum(1 for p in P if p.get('sx') == '待补'))
