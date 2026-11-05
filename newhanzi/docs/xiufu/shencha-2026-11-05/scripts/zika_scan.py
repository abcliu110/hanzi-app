#!/usr/bin/env python3
"""识字字卡全量机械扫描（只读）。
用法：
  node /workspace/work/hanzi-audit/scripts/zika_load.js      # 先汇总快照 → scripts/zika_all.json
  python3 /workspace/work/hanzi-audit/scripts/zika_scan.py   # 输出 scripts/zika_hits.json + 终端计数
  python3 zika_scan.py --show 类别 [N]                       # 随机看某类 N 条
"""
import json, re, sys, random, unicodedata
from collections import Counter, defaultdict

BASE = '/workspace/work/hanzi-audit/scripts/'
A = json.load(open(BASE + 'zika_all.json'))
C = A['cards']; PY = A['py']; GRADE = A['grade']
IDX = {i['z']: i for i in A['index']}
hits = defaultdict(list)

def add(cat, zi, field, text, why=''):
    hits[cat].append({'zi': zi, 'field': field, 'text': text if isinstance(text, str) else json.dumps(text, ensure_ascii=False), 'why': why})

def d(c, *ks):
    o = c.get('dim', {})
    for k in ks:
        if not isinstance(o, dict): return None
        o = o.get(k)
    return o

TONE = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ'
def strip_tone(s):
    return ''.join(ch for ch in unicodedata.normalize('NFD', s) if unicodedata.category(ch) != 'Mn').replace('ü', 'v')
PLACE = re.compile(r'是一个常用汉字|待补|待查|待核|TODO|todo|TBD|XXX|（示例）|\(示例\)|示例：|暂无|无数据|未知|占位|……$|^…|\?\?|？？')
LATIN = re.compile(r'[A-Za-z]{2,}')
PINYIN_WORD = re.compile(r'[a-zü]*[' + TONE + r'][a-zü]*')
UNSAFE = re.compile(r'杀|砍|捅|枪毙|自杀|尸体|血淋淋|打死|弄死|毒死|上吊|喝酒|醉酒|酗酒|啤酒|白酒|抽烟|吸烟|香烟|赌|毒品|吸毒|嫖|妓|色情|裸|性交|强奸|情人|离婚|小三|鬼|棺材|坟|炸弹|爆炸|谋杀|屠|虐|揍|掐死|殴|刀子|匕首|凶手|死了|死去|淹死')

all_sent = Counter(); sent_where = defaultdict(list)
def reg_sent(zi, field, s):
    if not s: return
    for part in re.split(r'(?<=[。！？])', s):
        p = re.sub(r'（(来源|据)[^）]*）$', '', part.strip())
        if len(p) < 6: continue
        norm = p.replace(zi, '〇')
        norm = re.sub(r'「[^」]{1,3}」', '「□」', norm)
        all_sent[norm] += 1; sent_where[norm].append((zi, field, p))

for zi, c in C.items():
    dim = c.get('dim', {})
    # ---------- 读音 ----------
    py = (d(c, '读音', '拼音') or '').strip()
    rd = [x.strip() for x in py.split(',') if x.strip()]
    lk = [x.strip() for x in (PY.get(zi) or '').split(',') if x.strip()]
    ix = IDX.get(zi, {})
    if not py: add('读音_空', zi, '读音.拼音', '')
    for r in rd:
        if not re.search('[' + TONE + ']', r) and r not in ('de','le','zhe','ma','ne','ba','me','men','ge','zi','tou','shang','mo','a','ya','wa','na','la','bo','lou','ha','luo','li','ou','o','ei','hng','m','n','ng','yo','zhao','jiang','pu','he','yao','xia','po','ye'):
            add('读音_无声调', zi, '读音.拼音', py, f'「{r}」无声调符号且不是常见轻声')
        if LATIN.search(r) and re.search('[^a-zü' + TONE + ']', r):
            add('读音_乱码', zi, '读音.拼音', py)
    if lk and rd and rd != lk:
        add('读音_与lookup不一致', zi, '读音.拼音', f'字卡={py} | pinyin_lookup={",".join(lk)}')
    if ix and rd and ix.get('py') != rd[0]:
        add('读音_与index主音不一致', zi, '读音.拼音', f'字卡首音={rd[0]} | index.py={ix.get("py")}')
    # 运用链里写到的读音不在字卡读音里
    yyl = dim.get('运用链') or []
    alltxt = json.dumps(yyl, ensure_ascii=False) + ' '.join(dim.get('易错提示') or [])
    mentioned = set(PINYIN_WORD.findall(alltxt))
    rare = [x.strip() for x in (d(c, '读音', '罕用读音') or '').split(',') if x.strip()]
    for m in mentioned:
        base = m
        if base not in rd and base not in rare and len(base) <= 6 and strip_tone(base) in {strip_tone(x) for x in rd + rare} | {strip_tone(x) for x in rd}:
            pass
    # 多音字只给一个读音：易错提示/运用链提到「读 X」而 X 不在拼音里
    for m in re.findall(r'读\s*([a-zü' + TONE + r']+)', alltxt):
        if m in rd or m in rare: continue
        # 只有在提示里说「不读/别读成」的才是反例，跳过
        ctx = alltxt[max(0, alltxt.find(m) - 6): alltxt.find(m)]
        if re.search(r'不|别|误|错|成', ctx): continue
        if any(ch in TONE for ch in m) and len(m) <= 6:
            add('读音_义项写到的读音未列入拼音', zi, '运用链/易错提示', f'拼音={py}；文中出现「读 {m}」', '多音字只给了部分读音或义项读音写错')
    # ---------- 笔画 ----------
    st = d(c, '笔画', '笔画数')
    strokes = d(c, '笔顺', 'strokes') or []
    if ix.get('st') is not None and st != ix.get('st'):
        add('笔画_与index不一致', zi, '笔画.笔画数', f'字卡={st} index.st={ix.get("st")}')
    if strokes and st and len(strokes) != st:
        add('笔画_与笔顺动画笔数不一致', zi, '笔画.笔画数', f'笔画数={st} 笔顺动画={len(strokes)}笔')
    if not strokes:
        add('笔顺_缺动画数据', zi, '笔顺.strokes', '')
    # ---------- 六书 vs 说文 ----------
    ls = (d(c, '六书', 'value') or '').strip()
    sw = (d(c, '字源', '说文解字') or '')
    jj = (d(c, '字源', '讲解') or '')
    if not ls: add('六书_空', zi, '六书.value', '')
    if sw and ls:
        has_sheng = re.search(r'[聲声]', sw) and not re.search(r'亦[聲声]', sw)
        yisheng = re.search(r'亦[聲声]', sw)
        xiang = re.search(r'象形|象[^。]{0,8}形', sw)
        if has_sheng and ls in ('会意字', '象形字', '指事字') and not xiang:
            add('六书_与说文矛盾', zi, '六书.value', f'六书={ls}｜说文：{sw[:40]}', '《说文》作「X声」应为形声')
        elif (not has_sheng) and (not yisheng) and ls == '形声字' and re.search(r'从.从|从.、.|象形', sw) and not re.search(r'省', sw):
            add('六书_与说文矛盾', zi, '六书.value', f'六书={ls}｜说文：{sw[:40]}', '《说文》无「声」，作「从X从Y」/象形')
    m = re.match(r'^(?:' + re.escape(zi) + r'[是为]?(?:一?个)?)?(象形|指事|会意|形声)', jj)
    if m and ls and not ls.startswith(m.group(1)):
        add('六书_讲解与六书字段矛盾', zi, '字源.讲解 vs 六书.value', f'讲解开头「{m.group(1)}」｜六书={ls}｜{jj[:50]}')
    # ---------- 字源讲解 ----------
    if not jj:
        add('讲解_空', zi, '字源.讲解', '')
    else:
        reg_sent(zi, '字源.讲解', jj)
        if PLACE.search(jj): add('占位语', zi, '字源.讲解', jj[:80])
        for a, b in (('“', '”'), ('（', '）'), ('(', ')'), ('「', '」'), ('‘', '’')):
            if jj.count(a) != jj.count(b): add('截断_括号引号不配对', zi, '字源.讲解', jj[:120], f'{a}{b} 数量不等')
        body = re.sub(r'（(来源|据)[^）]*）$', '', jj).strip()
        if body and body[-1] not in '。！？”）」…': add('截断_讲解半句', zi, '字源.讲解', jj[-60:])
        if len(body) < 18: add('讲解_过短', zi, '字源.讲解', jj)
        if LATIN.search(re.sub(r'[a-zü' + TONE + r']+', '', body.lower()) if False else body):
            w = [x for x in LATIN.findall(body) if not PINYIN_WORD.fullmatch(x) and not re.fullmatch(r'[a-zü]+', x) or re.fullmatch(r'[A-Za-z]{4,}', x)]
            if any(re.search(r'[A-Z]|[bcdfghjklmnpqrstvwxyz]{4}|(ing|tion|ed)\b', x) and not re.fullmatch(r'[a-zü]+', x) for x in w) or re.search(r'\b(the|of|and|to|a|is|ancient|meaning|variant)\b', body):
                add('混入英文', zi, '字源.讲解', body[:100])
        if not re.search(r'（(来源|据)', jj) and re.search(r'本义|像|象|古人|甲骨文|金文', jj):
            add('讲解_字源无出处却肯定', zi, '字源.讲解', jj[:90], '无「（来源：…）」标注却断言本义/造字')
        if re.search(r'《说文(解字)?》[说：]?[“「]', jj) and not sw:
            add('讲解_引说文但本卡无说文条', zi, '字源.讲解', jj[:90], '可能编造《说文》引文（字卡 说文解字 字段为空，《说文》可能无此字）')
        if len(body) > 160: add('讲解_过长过学术', zi, '字源.讲解', f'{len(body)}字：{body[:80]}…')
        if re.search(r'段注|徐锴|偁|俗强别|之屬|凡.之|也。从', body): add('讲解_过长过学术', zi, '字源.讲解', body[:90], '夹文言/段注原文')
    # 本义/造字矛盾：讲解说「本义为A」与运用链本义项
    # ---------- 可信度 / 演变 ----------
    kx = d(c, '字源', '可信度')
    if dim.get('字源') and not kx: add('字源_可信度未标注', zi, '字源.可信度', '')
    if kx == '待查': add('占位语', zi, '字源.可信度', '待查（页面显示「说法尚待核对」）')
    # ---------- 运用链 ----------
    if not yyl: add('运用链_空', zi, '运用链', '')
    words_all = []
    for i, s in enumerate(yyl):
        yx = (s.get('义项') or '').strip(); ws = s.get('词') or []; jz = (s.get('句') or '').strip()
        f = f'运用链[{i}]'
        if not yx: add('空字段_义项', zi, f + '.义项', json.dumps(s, ensure_ascii=False)[:80])
        if PLACE.search(yx): add('占位语', zi, f + '.义项', yx)
        if not ws and not jz: add('空字段_义项无词无句', zi, f, f'义项「{yx}」（{s.get("类型")}）词=[] 句=""')
        elif not jz: add('空字段_无例句', zi, f + '.句', f'义项「{yx}」词={ws}')
        elif not ws: add('空字段_无例词', zi, f + '.词', f'义项「{yx}」句={jz}')
        # 循环释义
        if yx in (zi, zi + zi) or re.fullmatch(re.escape(zi) + r'(的意思|之义|义|字)', yx) or re.fullmatch(r'.{0,2}' + re.escape(zi) + r'.{0,2}', yx) and len(yx) <= 3 and yx not in ('姓',):
            add('释义_循环或以词代义', zi, f + '.义项', yx, '义项只是本字/含本字的词，没解释意思')
        if re.search(r'貌$|之称$|谓之|曰|者也|^通[“「]|^同[“「]|古同|古通|假借为|引申为|旧时|文言', yx):
            add('释义_过学术', zi, f + '.义项', yx)
        if LATIN.search(re.sub(r'[a-zü' + TONE + r']+', '', yx)): add('混入英文', zi, f + '.义项', yx)
        for w in ws:
            words_all.append(w)
            if zi not in w and not re.search(r'[（(]', w): add('例词_不含本字', zi, f + '.词', f'义项「{yx}」词「{w}」')
            if re.search(r'[A-Za-z]', w): add('混入英文', zi, f + '.词', w)
            if PLACE.search(w): add('占位语', zi, f + '.词', w)
        if jz:
            reg_sent(zi, f + '.句', jz)
            if zi not in jz: add('例句_不含本字', zi, f + '.句', f'义项「{yx}」句「{jz}」')
            core = re.sub(r'[，。！？、“”：；（）\s]', '', jz)
            if 0 < len(core) < 6: add('例句_过短', zi, f + '.句', jz)
            if PLACE.search(jz): add('占位语', zi, f + '.句', jz)
            if re.search(r'[A-Za-z]{3,}', re.sub(r'[a-zü' + TONE + r']+', '', jz)) or re.search(r'[A-Za-z]{4,}', jz) and not PINYIN_WORD.search(jz):
                add('混入英文', zi, f + '.句', jz)
            for a, b in (('“', '”'), ('（', '）'), ('「', '」')):
                if jz.count(a) != jz.count(b): add('截断_括号引号不配对', zi, f + '.句', jz)
            if jz[-1] not in '。！？”」）…': add('截断_例句半句', zi, f + '.句', jz)
            u = UNSAFE.search(jz)
            if u: add('例句_不宜内容(关键词)', zi, f + '.句', jz, f'命中「{u.group(0)}」')
        tx = (s.get('文') or {}) if isinstance(s.get('文'), dict) else {}
        if tx.get('text') and zi not in tx['text']: add('引文_不含本字', zi, f + '.文', f'{tx.get("text")}（{tx.get("出处")}）')
        if tx.get('text') and not tx.get('出处'): add('引文_无出处', zi, f + '.文', tx['text'])
        if s.get('类型') == '本义' and not ws and not jz: pass
    dup = [w for w, n in Counter(words_all).items() if n > 1]
    if dup: add('组词_重复', zi, '运用链[].词', '、'.join(dup))
    # ---------- 易错 / 形近 / 形声拆解 ----------
    for t in dim.get('易错提示') or []:
        reg_sent(zi, '易错提示', t)
        if PLACE.search(t): add('占位语', zi, '易错提示', t)
        if re.search(r'[A-Za-z]{4,}', t) and not PINYIN_WORD.search(t) and not re.search(r'\b[a-z]{1,6}\b', t): add('混入英文', zi, '易错提示', t)
    if not dim.get('易错提示'): add('空字段_易错提示', zi, '易错提示', '')
    xj = dim.get('形近字') or []
    if not xj: add('空字段_形近字', zi, '形近字', '')
    for x in xj:
        bx = (x.get('辨析') if isinstance(x, dict) else x) or ''
        if isinstance(x, dict) and x.get('字') == zi: add('形近字_是本字', zi, '形近字', bx)
        if PLACE.search(bx): add('占位语', zi, '形近字.辨析', bx)
    xs = dim.get('形声拆解') or {}
    for k in ('meaning', 'sound', 'note'):
        v = xs.get(k) or ''
        if v and PLACE.search(v): add('占位语', zi, f'形声拆解.{k}', v)
        if v and re.search(r'[A-Za-z]{4,}', v) and not PINYIN_WORD.search(v): add('混入英文', zi, f'形声拆解.{k}', v)
        if v: reg_sent(zi, f'形声拆解.{k}', v)
    if xs and not any(xs.get(k) for k in ('meaning', 'sound', 'note')): add('空字段_形声拆解全空', zi, '形声拆解', '')
    if ls == '形声字' and xs and not xs.get('sound') and not d(c, '六书', '声旁'): add('空字段_形声字无声旁说明', zi, '形声拆解.sound', json.dumps(xs, ensure_ascii=False)[:60])
    # ---------- 年级 ----------
    g = GRADE.get(zi)
    if c.get('level') != 1: add('年级_level异常', zi, 'level', str(c.get('level')))
    if g and str(c.get('level')) != g[0]:
        add('年级_level与grade_map冲突', zi, 'level', f'level={c.get("level")} grade_map={g}')
    # ---------- 部首/繁体 ----------
    if not d(c, '部首', '部首'): add('空字段_部首', zi, '部首', '')
    if not d(c, '繁体', '繁体'): add('空字段_繁体', zi, '繁体', '')

# 模板化重复句
for norm, n in all_sent.most_common():
    if n < 15: break
    w = sent_where[norm]
    add('模板化重复句', w[0][0], w[0][1], f'×{n}「{norm}」', '例：' + '、'.join(sorted({x[0] for x in w})[:12]))
# 形近字辨析模板（IDS 算法初筛）
ids_tpl = re.compile(r'^同含「.」；.为「[^」]+」vs .为「[^」]+」$')
for zi, c in C.items():
    for x in c['dim'].get('形近字') or []:
        if isinstance(x, dict) and ids_tpl.match(x.get('辨析') or ''):
            add('形近字_IDS机械模板', zi, '形近字.辨析', x['辨析'])

# ---------- 追加检查 ----------
STROKE = set('丿一丶乚丨亅乛乙𠃌乀')
for zi, c in C.items():
    dim = c['dim']; jj = (dim.get('字源') or {}).get('讲解') or ''; ls = (dim.get('六书') or {}).get('value')
    if len(re.findall(r'[”"]\s*[“"]', jj)) >= 6: add('讲解_汉典原文倾倒', zi, '字源.讲解', f'{len(jj)}字：{jj[:70]}…')
    if not ls and re.match(r'^(.是)?(象形|指事|会意|形声)', jj): add('六书_字段空但讲解给了六书', zi, '六书.value', jj[:40])
    if ls and re.search(r'暂未查到可靠资料', jj): add('六书_讲解说来历不明却贴六书标签', zi, '六书.value', f'六书={ls}｜{jj[:40]}')
    for i, s_ in enumerate(dim.get('运用链') or []):
        tx = s_.get('文')
        if isinstance(tx, dict) and re.search(r'待查|待补', (tx.get('text') or '') + (tx.get('出处') or '')):
            add('占位语_引文待查', zi, f'运用链[{i}].文', json.dumps(tx, ensure_ascii=False))
    for x in dim.get('形近字') or []:
        b = x.get('辨析') if isinstance(x, dict) else x
        m = re.match(r'^同含「([^」]+)」；', b or '')
        if m and all(p in STROKE for p in m.group(1).split('、')): add('形近字_仅共享单笔画', zi, '形近字.辨析', b)
    l6 = dim.get('六书') or {}
    if c['src'].get('六书') == 'IDS+拼音算法推断' and l6.get('声旁'):
        sw = (dim.get('字源') or {}).get('说文解字') or ''
        if sw and not re.search('[聲声]', sw): add('六书_算法推断形声但说文为会意/象形', zi, '六书.声旁', f'声旁={l6.get("声旁")} 形旁={l6.get("形旁")}｜说文：{sw[:30]}')

out = {k: v for k, v in sorted(hits.items())}
json.dump(out, open(BASE + 'zika_hits.json', 'w'), ensure_ascii=False, indent=0)
if len(sys.argv) > 2 and sys.argv[1] == '--show':
    L = out.get(sys.argv[2], []); random.seed(int(sys.argv[4]) if len(sys.argv) > 4 else 1)
    for h in random.sample(L, min(int(sys.argv[3]) if len(sys.argv) > 3 else 15, len(L))): print(h)
else:
    for k, v in out.items(): print(f'{k}\t{len(v)}\t字数={len({h["zi"] for h in v})}')
