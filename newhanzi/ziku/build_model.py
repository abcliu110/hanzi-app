#!/usr/bin/env python3
"""构建 newhanzi 字库数据模型：通用规范汉字表一级字表 3500 字 × 6 维度.

权威数据源:
  1. 通用规范汉字表一级字表 (ben-hua/general_standard_chinese) — 字集范围
     教育部文件: 一级字表 3500 字"也可以作为义务教育阶段的识字标准";
     义务教育+普通高中课标识字量均为"3500个左右常用汉字" → 高三及以下 = 一级字表
  2. Unihan (unicode.org) — kMandarin(拼音) / kTotalStrokes(笔画数) / kRSUnicode(部首)
  3. hanzi-writer-data (chanind) — 笔顺 SVG strokes + medians（笔顺动画/描红）
  4. shuowenjiezi/shuowen — 《说文解字》+段注（六书/字源/字义）
  5. 老 app data/zi-N.json — struct(六书+结构) / senses(词句文) / codes(形近字) / miswrite(笔顺文字)
"""
import json, re, csv, glob, os, collections

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'sources')
APP = os.path.join(BASE, '..', '..')  # hanzi-app 根目录

# ---------- 1. 一级字表 3500 ----------
level1 = []
with open(os.path.join(SRC, '..', 'level1.txt'), encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line:
            ch = line.split()[-1]
            if len(ch) == 1:
                level1.append(ch)
assert len(level1) == 3500, len(level1)
L1SET = set(level1)

# ---------- 2. gsc pinyin.csv（拼音/部首/笔画/繁体） ----------
gsc = {}
with open(os.path.join(SRC, '..', 'pinyin.csv'), encoding='utf-8') as f:
    for row in csv.DictReader(f):
        w = row['word'].strip()
        if w in L1SET:
            gsc[w] = row

# ---------- 3. Unihan ----------
def parse_unihan(path, fields):
    out = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            if not line.strip() or line.startswith('#'):
                continue
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3:
                continue
            code, field, value = parts[0], parts[1], parts[2]
            if field not in fields:
                continue
            try:
                ch = chr(int(code[2:], 16))
            except ValueError:
                continue
            if ch in L1SET:
                out.setdefault(ch, {})[field] = value
    return out

uni = parse_unihan(os.path.join(SRC, 'unihan', 'Unihan_Readings.txt'),
                   {'kMandarin', 'kDefinition', 'kHanyuPinyin'})
uni_rs = parse_unihan(os.path.join(SRC, 'unihan', 'Unihan_RadicalStrokeCounts.txt'),
                      {'kRSUnicode', 'kTotalStrokes'})
for ch, d in uni_rs.items():
    uni.setdefault(ch, {}).update(d)

# ---------- 4. hanzi-writer-data（笔顺） ----------
with open(os.path.join(SRC, 'hanzi-writer-all.json'), encoding='utf-8') as f:
    hw = json.load(f)
print('hanzi-writer keys sample:', list(hw.keys())[:3])
hw_one = hw.get('一') or hw.get(list(hw.keys())[0])
print('hanzi-writer entry keys:', list(hw_one.keys()) if isinstance(hw_one, dict) else type(hw_one))

# ---------- 5. 说文解字索引（字头→条目，含段注） ----------
sw_index = {}
for fp in glob.glob(os.path.join(SRC, 'shuowen', 'data', '*.json')):
    try:
        with open(fp, encoding='utf-8') as f:
            e = json.load(f)
    except Exception:
        continue
    wh = e.get('wordhead')
    if wh and wh not in sw_index:
        sw_index[wh] = e
print('shuowen entries:', len(sw_index))

LIUSHU_RE = re.compile(r'六書為(.{2})')

def liushu_from_shuowen(entry):
    """从段注中提取'於六書為XX'."""
    for n in entry.get('duan_notes', []) or []:
        m = LIUSHU_RE.search(n.get('note', '') + n.get('explanation', ''))
        if m:
            return m.group(1)
    return None

# ---------- 6. 老 app 数据 ----------
with open(os.path.join(APP, 'char-index.json'), encoding='utf-8') as f:
    char_index = json.load(f)
old_chars = {}
for ch, grp in char_index.items():
    old_chars.setdefault(str(grp), []).append(ch)

old_data = {}  # zi -> char record
for grp, chs in old_chars.items():
    fp = os.path.join(APP, 'data', f'zi-{grp}.json')
    if not os.path.exists(fp):
        continue
    with open(fp, encoding='utf-8') as f:
        d = json.load(f)
    for c in d.get('chars', []):
        if c.get('zi') in L1SET:
            old_data[c['zi']] = c
print('老app覆盖一级字表:', len(old_data), '/', len(L1SET))

def parse_struct(struct):
    """解析老app struct 字段 → (六书, 独体?, 结构)."""
    liushu = duti = jiegou = None
    if not struct:
        return liushu, duti, jiegou
    for part in [p.strip() for p in struct.split('·')]:
        if '独体' in part:
            duti = True
        elif '结构' in part:
            jiegou = part
            duti = False
        elif any(k in part for k in ('形声', '会意', '象形', '指事')):
            m = re.search(r'(形声|会意|象形|指事)', part)
            liushu = {'形声': '形声字', '会意': '会意字',
                      '象形': '象形字', '指事': '指事字'}[m.group(1)]
    return liushu, duti, jiegou

# ---------- 7. 合并建模 ----------
records = []
cov = collections.Counter()
for ch in level1:
    rec = {'zi': ch, 'level': 1, 'dim': {}, 'src': {}}
    g = gsc.get(ch, {})
    u = uni.get(ch, {})
    o = old_data.get(ch)

    # 基础：拼音/笔画/部首/繁体
    rec['pinyin'] = g.get('pinyin') or None
    rec['pinyin_unihan'] = u.get('kMandarin')
    rec['bihua'] = int(g['stroke_count']) if g.get('stroke_count', '').isdigit() else None
    if rec['bihua'] is None and u.get('kTotalStrokes', '').isdigit():
        rec['bihua'] = int(u['kTotalStrokes'])
    rec['bushou'] = g.get('radical') or None
    rec['fan'] = g.get('traditional') or None
    rec['src']['基础'] = '通用规范汉字表(gsc_pinyin.csv)+Unihan'

    # 维度1：六书
    liushu, duti, jiegou = parse_struct(o.get('struct') if o else None)
    sw = sw_index.get(ch) or (sw_index.get(rec['fan']) if rec['fan'] else None)
    sw_liushu = liushu_from_shuowen(sw) if sw else None
    if liushu or sw_liushu:
        rec['dim']['六书'] = {'value': liushu or sw_liushu,
                             '老app_struct': o.get('struct') if o else None,
                             '说文段注': sw_liushu}
        rec['src']['六书'] = '老app.struct' + ('+说文段注' if sw_liushu else '')
        cov['六书'] += 1

    # 维度2：独体/合体+结构
    if duti is not None or jiegou:
        rec['dim']['结构'] = {'独体': duti, '间架结构': jiegou,
                             'raw': o.get('struct') if o else None}
        rec['src']['结构'] = '老app.struct'
        cov['结构'] += 1

    # 维度3：字→词→句→文
    if o and o.get('senses'):
        yong = []
        for s in o['senses']:
            classic = s.get('classic') or {}
            yong.append({
                '义项': s.get('name'), '类型': s.get('type'),
                '词': s.get('words') or [],
                '句': (s.get('example') or {}).get('text'),
                '文': {'text': classic.get('text'), '出处': classic.get('src')}
                if classic.get('text') else None,
            })
        rec['dim']['运用链'] = yong
        rec['src']['运用链'] = '老app.senses'
        cov['运用链'] += 1

    # 维度4：笔顺动画+描红
    h = hw.get(ch)
    bishun = {}
    if h:
        bishun['strokes'] = h.get('strokes')
        bishun['medians'] = h.get('medians')
    if o and o.get('miswrite'):
        bishun['笔顺文字'] = o['miswrite']
    if bishun:
        rec['dim']['笔顺'] = bishun
        rec['src']['笔顺'] = '+'.join(
            (['hanzi-writer-data'] if h else []) +
            (['老app.miswrite'] if o and o.get('miswrite') else []))
        cov['笔顺'] += 1

    # 维度5：字源
    if sw:
        rec['dim']['字源'] = {
            '说文解字': sw.get('explanation'),
            '段注六书': sw_liushu,
            '小篆': sw.get('seal_character'),
            '反切': sw.get('pronunciation'),
            '部首(许慎)': sw.get('radical'),
        }
        rec['src']['字源'] = 'shuowenjiezi/shuowen（说文+段注）'
        cov['字源'] += 1
    if o and o.get('evo'):
        rec['dim'].setdefault('字源', {})['演变阶段'] = o['evo']
        rec['src']['字源'] = rec['src'].get('字源', '') + '+老app.evo'

    # 维度6：形近字
    if o and o.get('codes'):
        xj = [c for c in o['codes'] if '形近' in c]
        if xj:
            rec['dim']['形近字'] = xj
            rec['src']['形近字'] = '老app.codes'
            cov['形近字'] += 1
    if o and o.get('parts'):
        rec['dim']['形声拆解'] = o['parts']  # 辅助维度

    records.append(rec)

# ---------- 8. 落盘 ----------
with open(os.path.join(BASE, 'ziku-level1-3500.json'), 'w', encoding='utf-8') as f:
    json.dump({'name': '通用规范汉字表·一级字表', '标准': '国发〔2013〕23号',
               'count': len(level1), 'chars': level1}, f, ensure_ascii=False)
with open(os.path.join(BASE, 'model-3500.json'), 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False)

# slim 版（不含笔顺 strokes，供快速浏览）
slim = []
for r in records:
    r2 = json.loads(json.dumps(r, ensure_ascii=False))
    if 'strokes' in r2.get('dim', {}).get('笔顺', {}):
        r2['dim']['笔顺']['strokes'] = f"<{len(r2['dim']['笔顺']['strokes'])}笔SVG>"
        r2['dim']['笔顺']['medians'] = f"<{len(r2['dim']['笔顺']['medians'])}笔中线>"
    slim.append(r2)
with open(os.path.join(BASE, 'model-3500-slim.json'), 'w', encoding='utf-8') as f:
    json.dump(slim, f, ensure_ascii=False)

print('覆盖率:')
for k in ['六书', '结构', '运用链', '笔顺', '字源', '形近字']:
    print(f'  {k}: {cov[k]}/3500 = {cov[k]/3500:.1%}')
print('老app字集 vs 一级字表:')
print('  老app总字数:', len(char_index))
print('  一级字表有、老app没有:', len(L1SET - set(char_index)))
print('  老app有、一级字表没有(示例):', sorted(set(char_index) - L1SET)[:10])
