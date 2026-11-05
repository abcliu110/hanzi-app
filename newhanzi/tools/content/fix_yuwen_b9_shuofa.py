#!/usr/bin/env python3
"""Y 语法 第 9 批：「下面说法正确的是？」说法题——每个错项写出具体错因（报告 yuwen.md §8、§10）。幂等。

原解析只有「X。 其他三个说法不对。」或「其他三项都不对：A；B；C」（只罗列不讲理由），
选项还有大量拼接句（「我吃了饭了₁完成式」「他凯旋归来了意思不重复」）。做法：
  1. 选项清理：例句/例词加「」，拼接的标签前补「是」（「「桌子上放着一本书」是存在式」），判断语直接接在引号后。
  2. 每个错项按类型找理由，理由只取自：
     a. 讲解库 data.js 同名子类的「说明」「代表」（「程度副词表示时间」→ 程度副词：表示程度深浅，如很、非常、最、更）；
     b. 本库里关于同一个例句/例词的正确说法（「我没去是不意愿式」→「我没去」是没客观式，没表没去成）；
     c. 拼接判断（「他凯旋归来了意思不重复」）→ 本库对同一句的正确判断（意思重复，旋就是归来）。
  3. 解析改为：「「正确项」这个说法对。其他三个：「错项1」不对，理由1；「错项2」不对，理由2；…」（按选项顺序）。
  找不到可靠理由的题不改，列入 --report（人工处理）。
用法：python3 fix_yuwen_b9_shuofa.py [--report] [--dry]
"""
import os, re, sys, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, items

HERE = os.path.dirname(os.path.abspath(__file__))
OVR = os.path.join(HERE, 'fix_yuwen_b9_overrides.json')

# 拼接判断语：肯定（句子有这个毛病/特点）与否定（说它没毛病，错）
NEG_J = ['前后一致', '指代清楚', '没有歧义', '主语完整', '宾语完整', '谓语完整', '搭配正确', '动宾搭配正确', '主谓搭配正确',
         '并列正确', '合乎逻辑', '关联词正确', '关联词使用正确', '意思没反', '意思不重复', '程度词不叠用', '没有多余成分',
         '定语顺序正确', '顺序正确', '语序正确', '结构正确', '没有毛病', '句子正确', '用词正确', '否定正确', '数量正确',
         '约数正确', '语气一致', '时间一致', '没有语病', '是正确的句子', '通顺']
POS_J = ['前后矛盾', '指代不明', '有歧义', '缺少主语', '缺少宾语', '缺少谓语', '主谓不搭配', '动宾不搭配', '修饰不搭配',
         '并列不当', '不合逻辑', '关联词误用', '意思反了', '意思重复', '程度叠用', '成分赘余', '定语错位', '顺序错误',
         '语序不当', '结构混乱', '包含并列', '类别交叉', '缺宾语中心语', '关联词残缺', '缺了', '搭配不当', '否定失当',
         '约数矛盾', '语气矛盾', '时间矛盾', '端正配态度', '提高配水平', '定语顺序错误', '状语错位', '虽然残缺']
SUFFIX = r'(?:动宾短语|并列短语|短语|的被字句|的把字句|的存现句|的双重否定句|的“是…的”句|句)?'
Q = '「」“”"\''


def strip_end(s):
    return str(s).strip().rstrip('。．.')


def unq(s):
    s = s.strip()
    if len(s) >= 2 and s[0] in '「“"' and s[-1] in '」”"':
        return s[1:-1]
    return s


def quote(s):
    s = s.strip()
    if s and s[0] in '「“' and s[-1] in '」”':
        s = s[1:-1]
    return '「%s」' % s


def first_clause(s):
    s = (s or '').strip()
    m = re.match(r'^(.+?[。！？])', s)
    s = m.group(1) if m else s
    return s.rstrip('。！？')


class Bank:
    def __init__(self, name, d, M, DAI):
        self.name = name; self.d = d
        self.classes = sorted({q.get('类') for q in d['questions'] if q.get('类')}, key=len, reverse=True)
        # 讲解库说明：优先 data.js 同名条目
        self.why = {}; self.dai = {}
        for c in self.classes:
            v = M.get((name, c)) or (list(M.get(('*', c), {}).values())[0] if len(set(M.get(('*', c), {}).values())) == 1 else None)
            if v: self.why[c] = first_clause(v)
            dv = DAI.get((name, c)) or (list(DAI.get(('*', c), {}).values())[0] if len(DAI.get(('*', c), {})) >= 1 else None)
            if dv: self.dai[c] = dv
        labs = set(ALIAS.get(name, {}).keys())
        for c in self.classes:
            labs.add(c)
            if c.endswith('式') and len(c) > 2: labs.add(c[:-1])
        self.labels = sorted(labs | EXTRA_LABELS, key=len, reverse=True)
        self.lab_re = '|'.join(re.escape(x) for x in self.labels)
        self.j_re = '|'.join(re.escape(x) for x in sorted(NEG_J + POS_J, key=len, reverse=True))

    def canon(self, lab):
        """标签 → 子类名（补回「式」）"""
        if lab in self.classes: return lab
        if lab in ALIAS.get(self.name, {}): return ALIAS[self.name][lab]
        if lab + '式' in self.classes: return lab + '式'
        return lab


EXTRA_LABELS = set()


def parse(b, t):
    """返回 dict(kind, subj, lab, tail, raw)。kind: prop(说子类本身) / is(例子是某类) / judge(例子+判断) / other"""
    t = strip_end(t)
    # 1) 子类本身的说法：以标签开头
    m = re.match(r'^(%s)%s(.*)$' % (b.lab_re, SUFFIX), t)
    if m and not re.match(r'^(%s)' % b.lab_re, t[len(m.group(1)):] or '#') and m.group(2)[:1] not in ('、',):
        rest = m.group(2)
        # 「X式是是和的…」「X式先看…」等
        if rest and rest[0] not in '，、':
            return dict(kind='prop', subj=None, lab=b.canon(m.group(1)), tail=rest, raw=t)
    # 2) 例子 + 用了/是 + 标签（可带后缀与「，说明」）
    m = re.match(r'^(.+?)(用了|是)(%s)%s(，.*)?$' % (b.lab_re, SUFFIX), t)
    if m and len(unq(m.group(1))) >= 1:
        subj = m.group(1)
        sm = re.match(r'^(.*?)(都|也)$', subj)
        return dict(kind='is', subj=subj, lab=b.canon(m.group(3)), tail=(m.group(4) or ''), verb=m.group(2), raw=t)
    # 3) 例子 + 标签直接拼接
    m = re.match(r'^(.{3,}?)(%s)%s(，.*)?$' % (b.lab_re, SUFFIX), t)
    if m and not m.group(1).endswith(('是', '用了', '中的', '的', '里')):
        return dict(kind='is', subj=m.group(1), lab=b.canon(m.group(2)), tail=(m.group(3) or ''), verb='', raw=t)
    # 4) 例子 + 判断语
    m = re.match(r'^(.{3,}?)(%s)(，.*)?$' % b.j_re, t)
    if m:
        subj, lab = m.group(1), m.group(2)
        if subj.endswith('是') and len(subj) > 4: subj, lab = subj[:-1], '是' + lab
        return dict(kind='judge', subj=subj, lab=lab, tail=(m.group(3) or ''), neg=m.group(2) in NEG_J, raw=t)
    return dict(kind='other', raw=t)


def enum_words(subj):
    s = unq(subj)
    m = re.match(r'^(.*?)(都|也)?$', s)
    s = m.group(1)
    m2 = re.match(r'^(.+?)中的(.+)$', s)
    if m2: s = m2.group(2)
    ws = [unq(x) for x in re.split(r'[、]', s) if x]
    return ws


def clean(b, p):
    """把选项改写成干净的完整句（例子加引号，标签前补「是」）"""
    t = p['raw']
    if '「' in t and not t.startswith('「「'):
        return t + '。'   # 已是规范写法（前几批重写过的），不动
    if p['kind'] == 'is':
        subj = p['subj']; s = unq(subj)
        dou = ''
        m = re.match(r'^(.*?)(都|也)$', s)
        if m and ('、' in m.group(1) or '中的' in m.group(1)): s, dou = m.group(1), m.group(2)
        m2 = re.match(r'^(.+?)中的(.+)$', s)
        if m2:
            qs = '%s中的%s' % ('、'.join(quote(x) for x in m2.group(1).split('、')), '、'.join(quote(x) for x in m2.group(2).split('、')))
        elif dou and '、' in s:
            qs = '、'.join(quote(x) for x in s.split('、'))
        else:
            qs = quote(s)
        verb = p.get('verb') or '是'
        lab = p['lab']
        return '%s%s%s%s%s。' % (qs, dou, verb, lab_text(b, p, t), p['tail'])
    if p['kind'] == 'judge':
        return '%s%s%s。' % (quote(p['subj']), p['lab'], p['tail'])
    return t + '。'


def lab_text(b, p, t):
    """保留原句里的标签写法（含后缀）"""
    m = re.search(r'(用了|是)?(%s)(%s)(，.*)?$' % (b.lab_re, SUFFIX), t)
    if m: return m.group(2) + (m.group(3) or '')
    return p['lab']


def main(report=False, dry=False):
    d, _ = load_data()
    M = collections.defaultdict(dict); DAI = collections.defaultdict(dict)
    for s, c, it in items(d):
        for f in it.get('分类', []):
            if f.get('说明') and f['类'] != f['说明']:
                M[(it['name'], f['类'])] = f['说明']; M[('*', f['类'])][it['name']] = f['说明']
            if f.get('代表'):
                DAI[(it['name'], f['类'])] = f['代表']; DAI[('*', f['类'])][it['name']] = f['代表']
    ovr = json.load(open(OVR, encoding='utf-8')) if os.path.exists(OVR) else {}
    ALIAS.update(ovr.get('_alias', {})); FACT.update(ovr.get('_fact', {})); REP = ovr.get('_replace', {})
    def rep(o):
        for a, z in REP.items():
            if a in o: o = o.replace(a, z)
        return o
    stat = collections.Counter(); manual = []; review = []
    loaded = []
    for fn in bank_files():
        name, bd, _ = load_bank(fn)
        b = Bank(name, bd, M, DAI)
        o_b = ovr.get(name, {})
        good = {}; word_cls = {}
        for q in bd['questions']:
            if not q['q'].startswith('下面说法正确'): continue
            a = str(q['options'][q['answer']])
            p = parse(b, rep(a))
            if p['kind'] in ('is', 'judge') and not p.get('neg'):
                k = unq(p['subj'])
                if '、' in k or '中的' in k: k = k.rstrip('都也')
                good.setdefault(k, strip_end(o_b.get(a, {}).get('text') or clean(b, p)))
                if p['kind'] == 'is':
                    for w in enum_words(p['subj']): word_cls.setdefault(w, p['lab'])
        for c, dv in b.dai.items():
            for w in re.split(r'[、，,／/]', dv):
                w = w.strip()
                if w and '…' not in w and '＋' not in w and len(w) <= 4: word_cls.setdefault(w, c)
        for k, v in good.items(): GOOD.setdefault(k, v)
        o_b = dict(o_b)
        for raw, v in list(o_b.items()):
            if raw.startswith('_'): continue
            ck = v.get('text') or clean(b, parse(b, rep(raw)))
            o_b.setdefault(ck, v)
        loaded.append((fn, name, bd, b, o_b, good, word_cls))
    for fn, name, bd, b, o_b, good, word_cls in loaded:
        ch = False
        for qi, q in enumerate(bd['questions']):
            if not q['q'].startswith('下面说法正确'): continue
            e = q.get('解析', '')
            if not ('其他三个说法不对' in e or '其他三项都不对' in e or e.startswith('对的是：')):
                continue
            new_opts = []; reasons = []; ok = True
            for j, o in enumerate(q['options']):
                ov = o_b.get(str(o), {})
                o = rep(str(o))
                p = parse(b, o)
                text = ov.get('text') or clean(b, p)
                new_opts.append(text)
                if j == q['answer']:
                    continue
                r = ov.get('why') or reason(b, p, q.get('类'), good, word_cls)
                if not r:
                    ok = False; manual.append('%s#%d [%s] %s' % (name, qi, q.get('类'), o)); continue
                reasons.append('%s——%s' % (strip_end(text), r))
            if not ok:
                stat['manual_q'] += 1; continue
            ans = strip_end(new_opts[q['answer']])
            new_e = '对的是：%s。其他三个不对：%s。' % (ans, '；'.join(reasons))
            if new_opts != q['options'] or new_e != e:
                if dry: review.append((name, q.get('类'), new_opts, q['answer'], new_e))
                q['options'] = new_opts; q['解析'] = new_e; ch = True; stat['fixed'] += 1
        if ch and not dry:
            save_bank(fn, name, bd, recount_total=False)
    print(dict(stat), 'manual options', len(manual))
    if report:
        print('\n'.join(sorted(set(re.sub(r'#\d+', '', x) for x in manual))))
    if dry:
        with open('/workspace/work/yscan/b9_review.txt', 'w') as f:
            seen = set()
            for name, c, opts, a, e in review:
                k = (name, e)
                if k in seen: continue
                seen.add(k); f.write('%s [%s] %s\n' % (name, c, e))
    return stat


# 关联词 → 关系（关系名与说明取自讲解库 data.js 复句、关联词各条）
REL = [
    (r'虽然.+(但是|可是|却)', '虽然……但是……', '转折，前后意思相反'),
    (r'尽管.+还是', '尽管……还是……', '转折'),
    (r'不但.+而且', '不但……而且……', '递进，后一分句更进一层'),
    (r'不但.+甚至', '不但……，甚至……', '递进，「甚至」引出出乎意料的一层'),
    (r'不仅.+还', '不仅……还……', '递进，后一分句更进一层'),
    (r'因为.+所以', '因为……所以……', '因果，先说原因，后说结果'),
    (r'由于.+因此', '由于……因此……', '因果'),
    (r'(如果|假如|要是).+就', '如果……就……', '假设，前一分句是假设的情况'),
    (r'只有.+才', '只有……才……', '必要条件，缺了这个条件就不行'),
    (r'只要.+就', '只要……就……', '充分条件，有了这个条件就够了'),
    (r'(无论|不管).+都', '无论……都……', '无条件，不管什么条件，结果都一样'),
    (r'既.+又', '既……又……', '并列，两个方面同时存在'),
    (r'一边.+一边', '一边……一边……', '并列，两个动作同时进行'),
    (r'先.+(然后|再|接着)', '先……然后……', '承接，动作有先后顺序'),
    (r'^[^，]*一.+就', '一……就……', '前一个动作一发生，后一个动作马上跟着发生'),
    (r'刚.+就', '刚……就……', '前一个动作刚发生，后一个动作马上跟着发生'),
    (r'或者.+或者', '或者……或者……', '选择，在两种情况中选一种'),
    (r'不是.+而是', '不是……而是……', '否定前一个，肯定后一个'),
    (r'，(也|还)', '「也」「还」', '并列，表示两个方面都具备'),
]


def relation(s):
    for pat, w, r in REL:
        if re.search(pat, s):
            return '%s用的是%s，表示%s' % (quote(s), w if w.startswith('「') else '「%s」' % w, r)
    return None


def reason(b, p, cls, good, word_cls):
    k = p['kind']
    if k == 'prop':
        lab = ALIAS.get(b.name, {}).get(p['lab'], p['lab']); w = b.why.get(lab)
        if not w: return None
        dv = b.dai.get(lab)
        s = '%s：%s' % (lab, w)
        if dv and dv not in w and not re.search(r'[…＋（(]', dv) and len(dv) <= 20: s += '（如%s）' % dv
        return s
    subj = unq(p.get('subj') or '')
    if k == 'judge':
        if p.get('neg'):
            g = good.get(subj) or GOOD.get(subj)
            if g: return '应该说：%s' % g
            w = b.why.get(cls)
            return ('这句有毛病，属于%s：%s' % (cls, w)) if w else None
        return None
    if k == 'is':
        subj = subj.rstrip('都也') if ('、' in subj or '中的' in subj) else subj
        if subj in FACT: return FACT[subj]
        g = good.get(subj) or GOOD.get(subj)
        if g: return '应该说：%s' % g
        ws = enum_words(p['subj'])
        if len(ws) == 1 and ws[0] in word_cls:
            c = word_cls[ws[0]]
            if c == p['lab']: return None
            w = b.why.get(c)
            return '%s是%s%s' % (quote(ws[0]), c, ('：' + w) if w else '')
        if len(subj) >= 6:
            return relation(subj)
        return None
    return None


ALIAS = {}; FACT = {}; GOOD = {}


if __name__ == '__main__':
    main('--report' in sys.argv, '--dry' in sys.argv)
