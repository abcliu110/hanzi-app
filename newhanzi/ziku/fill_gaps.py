#!/usr/bin/env python3
"""补数据缺口（二期之一）：形近字初筛 / 六书补全 / 264缺字组词.

方法（来源均如实标注）：
  形近字：cjkvi-ids 部件分解 → 同部件字聚类 → 差异部件生成辨析（算法初筛）
  六书：① 说文段注"六書為XX" ② 老app struct ③ 声旁谐音启发（IDS部件拼音≈本字拼音→形声字，算法推断）
        ④ 教科书级象形/指事字表（人工 curated）
  264缺字：CC-CEDICT 提取含该字的双语词典词组（组词）
"""
import json, re, os, unicodedata, collections

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'sources')

# ---------- 工具 ----------
def toneless(py):
    py = py.lower().strip()
    py = py.replace('ǖ', 'ü').replace('ǘ', 'ü').replace('ǚ', 'ü').replace('ǜ', 'ü')
    py = re.sub(r'\d', '', py)
    py = ''.join(c for c in unicodedata.normalize('NFD', py)
                 if unicodedata.category(c) != 'Mn')
    return py

# ---------- 0. 基础数据 ----------
level1 = []
with open(os.path.join(BASE, 'level1.txt'), encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line:
            ch = line.split()[-1]
            if len(ch) == 1:
                level1.append(ch)
L1 = set(level1)

# 拼音表：gsc + unihan kMandarin
pymap = collections.defaultdict(set)
import csv
with open(os.path.join(BASE, 'pinyin.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        w = row['word'].strip()
        if row['pinyin'].strip():
            pymap[w].add(toneless(row['pinyin']))
with open(os.path.join(SRC, 'unihan', 'Unihan_Readings.txt'), encoding='utf-8') as f:
    for line in f:
        if not line.strip() or line.startswith('#'):
            continue
        p = line.rstrip('\n').split('\t')
        if len(p) >= 3 and p[1] == 'kMandarin':
            try:
                ch = chr(int(p[0][2:], 16))
            except ValueError:
                continue
            for syl in p[2].split(' '):
                pymap[ch].add(toneless(syl))

# ---------- 1. IDS 解析 ----------
OPS = {'⿰': 2, '⿱': 2, '⿴': 2, '⿵': 2, '⿶': 2, '⿷': 2, '⿸': 2,
       '⿹': 2, '⿺': 2, '⿻': 2, '⿲': 3, '⿳': 3}
STRUCT_MAP = {'⿰': '左右结构', '⿱': '上下结构', '⿴': '全包围结构',
              '⿵': '上三包围结构', '⿶': '下三包围结构', '⿷': '左三包围结构',
              '⿸': '左上包围结构', '⿹': '右上包围结构', '⿺': '左下包围结构',
              '⿲': '左中右结构', '⿳': '上中下结构', '⿻': '嵌套结构'}

def parse_ids(s):
    """返回 (operator|None, [children])，children 为单字或嵌套元组."""
    toks = list(s)
    def rec(i):
        t = toks[i]
        if t in OPS:
            kids = []
            j = i + 1
            for _ in range(OPS[t]):
                node, j = rec(j)
                kids.append(node)
            return (t, kids), j
        return t, i + 1
    try:
        node, _ = rec(0)
        return node
    except (IndexError, RecursionError):
        return s

def leaves(node):
    if isinstance(node, tuple):
        out = []
        for k in node[1]:
            out.extend(leaves(k))
        return out
    return [node]

def top_children(node):
    if isinstance(node, tuple):
        return node[0], node[1]
    return None, [node]

ids_map, ids_struct = {}, {}
with open(os.path.join(SRC, 'ids.txt'), encoding='utf-8') as f:
    for line in f:
        if line.startswith('#'):
            continue
        p = line.rstrip('\n').split('\t')
        if len(p) < 3:
            continue
        ch, ids = p[1], p[2]
        if ch in L1 and ch not in ids_map:
            ids_map[ch] = ids
            node = parse_ids(ids)
            op, kids = top_children(node)
            ids_struct[ch] = {
                '独体': op is None,
                '间架结构': STRUCT_MAP.get(op),
                '顶层部件': [k if isinstance(k, str) else '◇' for k in kids],
                'leaf部件': leaves(node),
            }
print('IDS 覆盖:', len(ids_map), '/ 3500')

def is_cjk(c):
    return len(c) == 1 and '\u4e00' <= c <= '\u9fff'

# 经典形近字组（教科书级高频易错，人工 curated，优先级最高）
CLASSIC_XINGJIN = [
    (['日', '目'], '日中一横 vs 目中两横'),
    (['己', '已', '巳'], '开口大小区分：己开口、已半开、巳闭合'),
    (['戊', '戌', '戍'], '戊无点、戌一横加点、戍人持戈（守边）'),
    (['采', '彩'], '采（手在木上）vs 彩（多"彡"）'),
    (['在', '再'], '在（含"土"）vs 再（含"一"，两次）'),
    (['的', '得', '地'], '用法：的+名词（定语）、地+动词（状语）、动词+得（补语）'),
    (['做', '作'], '做（具体动手，如做饭）vs 作（抽象创作，如作文）'),
    (['像', '象'], '像（人旁，相像）vs 象（大象/形状/气象）'),
    (['坐', '座'], '坐（动作）vs 座（座位，广字头）'),
    (['向', '像'], '向（方向）vs 像（相像）'),
    (['带', '戴'], '带（衣带/带领）vs 戴（戴帽子/爱戴）'),
    (['辩', '辨', '辫', '瓣'], '言辩（辩论）、刀辨（分辨）、丝辫（辫子）、瓜瓣（花瓣）'),
    (['既', '即'], '既（已经，完成）vs 即（即将，马上）'),
    (['梁', '粱'], '梁（桥梁，木旁）vs 粱（高粱，米旁）'),
    (['候', '侯'], '候（等候，单人旁）vs 侯（侯爵/诸侯）'),
    (['度', '渡'], '度（程度/度过）vs 渡（渡河，三点水）'),
    (['幅', '辐'], '幅（布幅，巾旁）vs 辐（车辐，车旁）'),
    (['账', '帐'], '账（账目，贝旁）vs 帐（帐篷，巾旁）'),
    (['拆', '折'], '拆（拆除）vs 折（折断/折扣）'),
    (['盲', '肓'], '盲（目旁）vs 肓（月旁，病入膏肓）'),
    (['陷', '馅'], '陷（陷阱，阝旁）vs 馅（馅料，食旁）'),
    (['需', '须'], '需（需要）vs 须（必须/胡须）'),
    (['具', '俱'], '具（工具/具体）vs 俱（全，都，如与俱）'),
    (['漂', '飘'], '漂（三点水，漂浮）vs 飘（风旁，飘扬）'),
    (['练', '炼'], '练（练习，纟旁）vs 炼（冶炼，火旁）'),
    (['洒', '酒'], '洒（洒水）vs 酒（饮酒）'),
    (['峰', '锋'], '峰（山峰，山旁）vs 锋（锋利，钅旁）'),
    (['详', '祥'], '详（详细，言旁）vs 祥（吉祥，示旁）'),
    (['竟', '竞'], '竟（竟然）vs 竞（竞争，立字头）'),
    (['哀', '衰'], '哀（哀伤）vs 衰（衰老，中间"冖"）'),
]

def apply_classic_xingjin(recmap):
    n = 0
    for group, note in CLASSIC_XINGJIN:
        members = [c for c in group if c in recmap]
        for ch in members:
            others = [c for c in members if c != ch]
            entry = {'字': '/'.join(others), '辨析': f"经典形近：{' vs '.join([ch] + others)}——{note}",
                     '来源': '人工curated'}
            r = recmap[ch]
            cur = r['dim'].get('形近字') or []
            # 去重后放最前
            if not any(entry['字'] in str(m) for m in cur):
                r['dim']['形近字'] = [entry] + cur
                r['src']['形近字'] = '人工curated+' + r['src'].get('形近字', '')
                n += 1
    return n

# ---------- 2. 载入现有模型 ----------
records = json.load(open(os.path.join(BASE, 'model-3500.json'), encoding='utf-8'))
recmap = {r['zi']: r for r in records}

# ---------- 3. 六书补全 ----------
# 3a. 教科书级象形/指事字（人工 curated）
XIANGXING = set('日月山水火木禾米人子女子手足心目耳口舌齿牛羊马鱼鸟虫蛇兔鼠龟象鹿犬田井门户舟车弓刀戈瓜果雨云气石玉贝丝衣')
ZHISHI = set('一二三上下本末刃寸甘亦')
cur_liushu = {}
for ch in XIANGXING:
    if ch in L1:
        cur_liushu[ch] = '象形字'
for ch in ZHISHI:
    if ch in L1:
        cur_liushu[ch] = '指事字'

def has_authoritative_liushu(r):
    return bool((r.get('dim', {}).get('六书') or {}).get('value'))

n_phon = n_cur = 0
for ch in level1:
    r = recmap[ch]
    if has_authoritative_liushu(r):
        continue
    if ch in cur_liushu:  # 象形/指事优先于谐音推断
        r['dim']['六书'] = {'value': cur_liushu[ch]}
        r['src']['六书'] = '人工curated（教科书级）'
        n_cur += 1
        continue
    # 声旁谐音启发：顶层部件拼音 ≈ 本字拼音 → 形声字
    st = ids_struct.get(ch)
    if not st or st['独体']:
        continue
    op_kids = st['顶层部件']
    if len(op_kids) != 2 or '◇' in op_kids:
        continue
    ch_py = pymap.get(ch, set())
    if not ch_py:
        continue
    shengpang = None
    for comp in op_kids:
        if comp == ch:
            continue
        if ch_py & pymap.get(comp, set()):
            shengpang = comp
            break
    if shengpang:
        other = op_kids[0] if op_kids[1] == shengpang else op_kids[1]
        r['dim']['六书'] = {'value': '形声字',
                           '声旁': shengpang, '形旁': other,
                           '依据': f'声旁{shengpang}读音≈本字读音'}
        r['src']['六书'] = 'IDS+拼音算法推断'
        n_phon += 1
print(f'六书补全: curated象形指事={n_cur}, 谐音推断形声={n_phon}')

# ---------- 4. 结构补全（IDS） ----------
n_struct = 0
for ch in level1:
    r = recmap[ch]
    st = ids_struct.get(ch)
    if not st:
        continue
    dim = r['dim'].setdefault('结构', {})
    if dim.get('独体') is None and dim.get('间架结构') is None:
        dim['独体'] = st['独体']
        dim['间架结构'] = st['间架结构']
        dim['顶层部件'] = st['顶层部件']
        r['src']['结构'] = 'IDS推断(cjkvi-ids)'
        n_struct += 1
print('结构补全:', n_struct)

# ---------- 5. 形近字挖掘 ----------
# 按部件建倒排：部件 -> 字列表
comp_index = collections.defaultdict(set)
char_leaves = {}
for ch in level1:
    st = ids_struct.get(ch)
    if not st:
        continue
    lv = [c for c in st['leaf部件'] if is_cjk(c)]
    char_leaves[ch] = set(lv)
    for c in set(lv):
        comp_index[c].add(ch)

def xingjin_note(a, b):
    la, lb = char_leaves[a], char_leaves[b]
    shared = sorted(la & lb)
    da, db = sorted(la - lb), sorted(lb - la)
    return {'字': b,
            '辨析': f"同含「{'、'.join(shared)}」；{a}为「{'、'.join(da) or '—'}」vs {b}为「{'、'.join(db) or '—'}」"}

n_xj = 0
for ch in level1:
    r = recmap[ch]
    la = char_leaves.get(ch)
    if not la:
        continue
    cands = set()
    for c in la:
        cands |= comp_index[c]
    cands.discard(ch)
    scored = []
    for o in cands:
        lb = char_leaves[o]
        shared = la & lb
        da, db = la - lb, lb - la
        if not shared or not da or not db:
            continue  # 必须双方都有差异部件（排除字与其自身部件配对）
        union = la | lb
        score = len(shared) / len(union)
        # 差异部件数越少越"形近"
        diff = len(da) + len(db)
        scored.append((score, -diff, o))
    scored.sort(reverse=True)
    picks = []
    for _, _, o in scored[:4]:
        # 跳过已被老app收录的
        picks.append(xingjin_note(ch, o))
    if picks:
        old = r['dim'].get('形近字') or []
        # 老app的在前，算法初筛在后，去重
        seen = set()
        merged = []
        for x in old:
            merged.append(x if isinstance(x, dict) else {'辨析': x})
        for p in picks:
            if p['字'] not in seen and all(p['字'] not in str(m) for m in merged):
                p['来源'] = 'IDS算法初筛'
                merged.append(p)
                seen.add(p['字'])
        r['dim']['形近字'] = merged
        r['src']['形近字'] = '老app.codes+IDS算法初筛'
        n_xj += 1
print('形近字覆盖(算法):', n_xj)
print('形近字覆盖(经典组):', apply_classic_xingjin(recmap))

# ---------- 6. 264缺字：CC-CEDICT 组词 ----------
import zipfile
cedict_path = os.path.join(SRC, 'cedict', 'cedict_ts.u8')
words_by_char = collections.defaultdict(list)
with open(cedict_path, encoding='utf-8') as f:
    for line in f:
        if line.startswith('#') or not line.strip():
            continue
        m = re.match(r'(\S+) (\S+) \[([^\]]+)\] /(.*)/', line)
        if not m:
            continue
        trad, simp, py, defs = m.groups()
        if not (2 <= len(simp) <= 4):
            continue
        if re.search(r'[A-Za-z]', simp):
            continue
        for ch in set(simp):
            if ch in L1:
                words_by_char[ch].append((simp, py.split()))
print('CC-CEDICT 词条覆盖字数:', len(words_by_char))

old_app_chars = set()
for r in records:
    if r['src'].get('运用链') == '老app.senses':
        old_app_chars.add(r['zi'])
missing = [c for c in level1 if c not in old_app_chars]
print('缺运用链字数:', len(missing))

n_w = 0
for ch in missing:
    r = recmap[ch]
    ws = sorted(set(w for w, _ in words_by_char.get(ch, []) if len(w) == 2))[:4]
    if not ws:
        ws = sorted(set(w for w, _ in words_by_char.get(ch, [])))[:4]
    if ws:
        r['dim']['运用链'] = [{'义项': None, '类型': '组词',
                               '词': ws, '句': None, '文': None,
                               '来源': 'CC-CEDICT'}]
        r['src']['运用链'] = 'CC-CEDICT（组词，句/文待补）'
        n_w += 1
print('缺字补组词:', n_w, '/', len(missing))

# ---------- 7. 落盘 ----------
json.dump(records, open(os.path.join(BASE, 'model-3500.json'), 'w', encoding='utf-8'),
          ensure_ascii=False)
slim = []
for r in records:
    r2 = json.loads(json.dumps(r, ensure_ascii=False))
    bs = r2.get('dim', {}).get('笔顺', {})
    if isinstance(bs.get('strokes'), list):
        bs['strokes'] = f"<{len(bs['strokes'])}笔SVG>"
    if isinstance(bs.get('medians'), list):
        bs['medians'] = f"<{len(bs['medians'])}笔中线>"
    slim.append(r2)
json.dump(slim, open(os.path.join(BASE, 'model-3500-slim.json'), 'w', encoding='utf-8'),
          ensure_ascii=False)

cov = collections.Counter()
for r in records:
    for k in ['六书', '结构', '运用链', '笔顺', '字源', '形近字']:
        if r.get('dim', {}).get(k):
            cov[k] += 1
print('=== 补数据后覆盖率 ===')
for k in ['六书', '结构', '运用链', '笔顺', '字源', '形近字']:
    print(f'  {k}: {cov[k]}/3500 = {cov[k]/3500:.1%}')
