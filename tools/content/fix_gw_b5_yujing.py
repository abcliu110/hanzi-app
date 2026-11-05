#!/usr/bin/env python3
"""GW 线 B5：无语境字义题改成带课内例句的题（报告 B5）。幂等（已改过的题不再匹配）。

对象：shici / duoyi / xuci 三库里不给句子的字义题
  ① 「下面关于“X”的说法，正确的是？」（答案形如「“X”可以表示……。」「“X”可以作……。」）
  ② 「下面哪一项是“X”的一个意思？」（答案是义项）
做法：取答案里的义项 s，在本应用自己的数据里找「X 在某句里就是 s」的出处：
  a. newhanzi/data/guwen.js 某篇「重点」给 X 作了注 [X, g]，且 g 与 s 有共同的词（按 、；，切分比较）：
     篇目有逐句「句」→ 用「对」里该注所在的那一句；没有「句」→ 只有 X 在全篇原文里只出现一次才取（否则不知道注的是哪一处）；
     句子太长时取含 X 的逗号分句。
  b. data/guwen_knowledge.js 里同名条目（shici/duoyi/xuci/tongjia）的「分类」：「类」与 s 有共同的词 → 该分类「例子」里的句子；
     「例句解析」：析里写明的义项（“X”是…，义；‘X’在这里是‘义’的用法）与 s 有共同的词 → 该句。
     来源写着 Wikibooks 的（课外例句）不用。
  生成：实词 「“X”在“句”中的意思是？」；虚词 「“句”中“X”的用法属于哪一类？」（与库里已有带例句题同一格式）。
  正确项 = 原答案义项 s；干扰项 = 原题干扰项去掉「“X”可以表示/可以作」前缀后的短语，
  其中与 X 自己任何义项（同名条目全部分类/讲解、guwen.js 全部注释）有共同词的换掉（换成同库其他字的义项）。
  解析：「“X”在这里是“s”的意思（《篇名》）。」+ 出处原注（有则附）。
  跳过：找不到出处的；出处句已被本点（或同名点）同答案的题用过、换不出别的句子的（避免重复题）——都原样保留并计数。
知识库「练习」里的同题副本同步改。改后跑 build_guwen_links.py。"""
import os, sys, re, json, subprocess, random, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *

DRY = '--dry' in sys.argv
B = load_banks(); H, K, T = load_kn()
TX = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require("./newhanzi/data/guwen.js");console.log(JSON.stringify(window.NHZ_GUWEN.texts))'], cwd=ROOT).decode())
SC = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require("./newhanzi/data/shici.js");console.log(JSON.stringify(window.NHZ_SHICI.poems.filter(p=>p.ke==="课内").map(p=>[p.title,p.lines.join("")])))'], cwd=ROOT).decode())

def parts(x):
    x = re.sub(r'[“”‘’"\'。]', '', x or '')
    x = re.sub(r'（[^）]*）|\([^)]*\)', '', x)
    return set(p.strip() for p in re.split(r'[、；，,：:/或]', x) if len(p.strip()) >= 1) - {'的', '是', '一说'}

def clause(s, w, pos):
    """含 pos 处 w 的短句：按标点（含引号）切分取所在分句，不足 4 字并上前一分句；整句 ≤16 字取整句"""
    segs = re.split(r'([，：；。！？“”‘’、])', s)
    acc = 0; idx = None; pieces = []
    for sg in segs:
        pieces.append((acc, sg))
        if idx is None and not re.fullmatch(r'[，：；。！？“”‘’、]', sg or '，') and acc <= pos < acc + len(sg): idx = len(pieces) - 1
        acc += len(sg)
    if idx is None: return None
    # 所在整句（。！？；之间）
    st = idx; en = idx
    while st > 0 and pieces[st - 1][1] not in '。！？；“”': st -= 1
    while en < len(pieces) - 1 and pieces[en + 1][1] not in '。！？；“”': en += 1
    whole = ''.join(p for _, p in pieces[st:en + 1]).strip('，：、 ')
    if len(whole) <= 16: return whole
    c = pieces[idx][1]
    if len(c) < 4 and idx >= 2 and pieces[idx - 1][1] == '，': c = pieces[idx - 2][1] + '，' + c
    elif len(c) < 4 and idx + 2 < len(pieces) and pieces[idx + 1][1] == '，': c = c + '，' + pieces[idx + 2][1]
    return c.strip()

# ---------- 出处索引：ctx[X] = [(义, 句, 篇名, 原注)] ----------
ctx = collections.defaultdict(list)
own = collections.defaultdict(set)     # X 自己的全部义项词（用来筛干扰项）
title_of = {}
def find_title(s):
    for t in TX:
        if s in re.sub(r'\s', '', t['原文']): return t['title']
    for ti, body in SC:
        if s in body: return ti
for t in TX:
    yw = t['原文']
    for z, g in t.get('重点', []):
        if len(z) != 1: continue
        own[z] |= parts(g)
        sent = None
        if t.get('句'):
            for j in t['句']:
                for d in j.get('对', []):
                    if d[0] == z and d[1] == g:
                        sent = clause(j['原'], z, d[2]['i']); break
                if sent: break
        elif yw.count(z) == 1:
            sent = clause(yw, z, yw.index(z))
        if sent and sent.count(z) == 1:
            ctx[z].append((g, sent, t['title'], '%s：%s' % (z, g)))

SENSE_PAT = [re.compile(r"[‘'“]%s[’'”]在这里是[‘'“](.+?)[’'”]的"), re.compile(r'“%s”是[^，,（(]*?[，,](.+?)[（(]')]
for it in kn_items(K):
    md = it['key'].split(':')[0]
    if md not in ('shici', 'duoyi', 'xuci', 'tongjia'): continue
    X = it['name']
    if len(X) != 1: continue
    for cl in it.get('分类', []) or []:
        own[X] |= parts(cl.get('类', '')) | parts(cl.get('说明', ''))
    own[X] |= parts(it.get('讲解', ''))
    xi = {e['句']: e['析'] for e in it.get('例句解析', []) or []}
    for cl in it.get('分类', []) or []:
        for s in cl.get('例子', []) or []:
            if s.count(X) != 1 or 'Wikibooks' in xi.get(s, '') or not find_title(s): continue
            ctx[X].append((cl['类'], s, find_title(s), xi.get(s, '')))
    for s, a in xi.items():
        if s.count(X) != 1 or 'Wikibooks' in a or '暂缺' in s or not find_title(s): continue
        for p in SENSE_PAT:
            m = re.compile(p.pattern % re.escape(X)).search(a)
            if m:
                ctx[X].append((m.group(1), s, find_title(s), a)); break

def near(a, b):
    """义项相合：有相同的词，或一边的双字以上词包含另一边的双字以上词"""
    if a & b: return True
    return any(len(x) >= 2 and len(y) >= 2 and (x in y or y in x) for x in a for y in b)

# 人工排除（出处注释与句意不合，记为内容疑点，不用来出题）
BAD = {('信', '子以我为不信'): 'guwen.js《狐假虎威》注「信：相信」，句中“不信”是不诚实、说假话',
       ('乃', '乃不知有汉，无论魏晋'): '知识库 xuci:乃 把此句归「承接：于是、就」，课文此处“乃”是竟然'}
# 知识库例句若在某篇原文里、该篇「重点」又给 X 作了别的注 → 以篇目注为准，不用知识库这条
gloss_in = {}
for t in TX:
    for z, g in t.get('重点', []):
        if len(z) == 1: gloss_in.setdefault((z, t['title']), []).append(g)
def conflict(X, sent, title, g):
    gs = gloss_in.get((X, title))
    return bool(gs) and not any(near(parts(x), parts(g)) for x in gs)

# ---------- 现有题（避免造出重复题） ----------
SENT_IN_Q = [re.compile(r'^“(.)”在“(.+)”中的意思是？$'), re.compile(r'^“(.+)”中“(.)”的用法属于哪一类？$')]
used = collections.defaultdict(list)   # (X, 答案) -> 已出过题的句子
def reg(q):
    m = SENT_IN_Q[0].match(q['q'])
    if m: used[(m.group(1), q['options'][q['answer']])].append(m.group(2)); return
    m = SENT_IN_Q[1].match(q['q'])
    if m: used[(m.group(2), q['options'][q['answer']])].append(m.group(1))
for _, _, _, q in iter_q(B): reg(q)
def taken(X, s, sent):
    return any(sent in u or u in sent for u in used[(X, s)])

PF = re.compile(r'^“(.)”(?:可以表示|可以作|可以是|可以用作|可以用在|可以)?')
def nocomment(o):
    """去掉义项后面带逗号的编辑说明括注（如「（古义主指跑，今义主指步行，最易错）」），保留（读sì）这类读音注"""
    return re.sub(r'（[^）]*[，,][^）]*）', '', o)
def strip_opt(o, X):
    o = nocomment(o.strip().rstrip('。'))
    m = PF.match(o)
    if m: o = o[m.end():]
    return o.strip('，, ') or None

# 同库义项池（换干扰项用）
pool = collections.defaultdict(list)
for it in kn_items(K):
    md = it['key'].split(':')[0]
    for cl in it.get('分类', []) or []:
        if cl.get('类') and len(cl['类']) <= 12: pool[md].append((it['name'], cl['类']))

STEM1 = re.compile(r'^下面关于“(.)”的说法，正确的是？$')
STEM2 = re.compile(r'^下面哪一项是“(.)”的一个意思？$')
rng = random.Random(20261105)
stat = collections.Counter(); left = collections.defaultdict(list); newmap = {}
used_sent = collections.defaultdict(set)   # (X, s_parts) -> sentences used
ORDER = [x for x in iter_q(B) if STEM1.match(x[3]['q'])] + [x for x in iter_q(B) if STEM2.match(x[3]['q'])]   # 先改「说法」题
for mid, k, i, q in ORDER:
    if mid not in ('shici', 'duoyi', 'xuci'): continue
    m = STEM1.match(q['q']) or STEM2.match(q['q'])
    if not m: continue
    X = m.group(1); ST = '说法' if STEM1.match(q['q']) else '义项'
    stat['对象：%s/%s' % (mid, ST)] += 1
    if k.split(':')[1] != X: stat['题干字≠条目'] += 1; continue
    ans = q['options'][q['answer']]
    s = strip_opt(ans, X) if STEM1.match(q['q']) else nocomment(ans.strip().rstrip('。'))
    if not s or ans.startswith('“') and not PF.match(ans):
        stat['答案不是义项'] += 1; left['答案不是义项'].append((k, q['q'], ans)); continue
    sp = parts(s)
    cands = [c for c in ctx.get(X, []) if near(parts(c[0]), sp) and (X, c[1]) not in BAD and not conflict(X, c[1], c[2], c[0])]
    if not cands:
        stat['无出处'] += 1; stat['无出处：%s/%s' % (mid, ST)] += 1; left['无出处'].append((k, s)); continue
    xuci = mid == 'xuci'
    pick = None
    for g, sent, title, orig in cands:
        nq = ('“%s”中“%s”的用法属于哪一类？' % (sent, X)) if xuci else ('“%s”在“%s”中的意思是？' % (X, sent))
        if taken(X, s, sent): continue
        # 句中义项与其他干扰项义项冲突检查放到下面
        pick = (g, sent, title, orig, nq); break
    if not pick:
        stat['出处句已有同题'] += 1; stat['已有同题：%s/%s' % (mid, ST)] += 1; left['出处句已有同题'].append((k, s)); continue
    g, sent, title, orig, nq = pick
    # 干扰项
    opts = []
    for j, o in enumerate(q['options']):
        if j == q['answer']: opts.append(s); continue
        d = strip_opt(o, X) if STEM1.match(q['q']) else nocomment(o.strip().rstrip('。'))
        if not d or parts(d) & own[X] or parts(d) & sp or d in opts or len(d) > 16 or any(o2 and near(parts(d), parts(o2)) for o2 in opts):
            d = None
            for _ in range(200):
                nm, c = rng.choice(pool[mid] or pool['shici'])
                if nm != X and not (parts(c) & own[X]) and not (parts(c) & sp) and not any(o2 and near(parts(c), parts(o2)) for o2 in opts) and c not in opts and c not in [strip_opt(x, X) for x in q['options']]:
                    d = c; break
            stat['换干扰项'] += 1
        opts.append(d)
    s2 = s.replace('“', '‘').replace('”', '’')
    exp = ('“%s”在这里属于“%s”（《%s》）。' if xuci else '“%s”在这里是“%s”的意思（《%s》）。') % (X, s2, title)
    if orig and '在这里是' not in orig and not orig.startswith('%s：' % X):
        exp += orig if orig.endswith('。') or orig.endswith('）') else orig + '。'
    elif title and orig.startswith('%s：' % X):
        exp += '课文注释：%s。' % orig
    nqd = {'q': nq, 'options': opts, 'answer': q['answer'], '解析': exp, '类': '选用法' if xuci else '选义项'}
    newmap[(k, q['q'], tuple(q['options']), q['answer'])] = nqd
    used[(X, s)].append(sent)
    stat['改：%s/%s' % (mid, ST)] += 1

for kk in sorted(stat): print(kk, stat[kk])
if '--show' in sys.argv:
    for kk, v in list(newmap.items())[:int(sys.argv[sys.argv.index('--show') + 1])]:
        print(kk[0], '|', kk[1], kk[2][kk[3]], '\n   →', v['q'], v['options'], v['answer'], v['解析'])
json.dump({k2: v for k2, v in left.items()}, open('/tmp/gw_b5_left.json', 'w'), ensure_ascii=False, indent=0)
if DRY: sys.exit()
n = 0
for k, q in all_q(B, K):
    key = (k, q['q'], tuple(q['options']), q['answer'])
    if key in newmap:
        q.clear(); q.update(json.loads(json.dumps(newmap[key], ensure_ascii=False))); n += 1
save_banks(B); save_kn(H, K, T)
print('写入题（含知识库练习副本）', n)
