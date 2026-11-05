#!/usr/bin/env python3
"""Y 语法 第 11 批：填空题模板「A是X，填在这里最合适。」（报告 yuwen.md §8）。幂等。

原解析只复述答案。改为：「填「A」：A 是X（讲解库同名子类说明）。其他三个：「o1」是L1；「o2」是L2；…」（按选项顺序）。
干扰项类别只取自题库自身：
  1. 本库「下面哪个…是X」「S 句子中的X是？」「选X填入」题的答案 → X（本库唯一时用）；
  2. 他库同样题型的答案 → 那一题的子类（全库唯一时用；子类名不带库名时补库名，如「动作动词」本身已含）；
  3. 定不了的只写「「o」不是X」。
干扰项判下来正好也是X（多解）的题不改，--report 列出。
用法：python3 fix_yuwen_b11_tiankong.py [--report]
"""
import os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, items

def n(s): return re.sub(r'[\s。，！？、；：“”"\'‘’「」]', '', str(s))
def bare(s): return str(s).strip().rstrip('。').strip('“”')
CL = {'名词', '动词', '形容词', '副词', '介词', '连词', '量词', '数词', '代词', '叹词', '语气词', '助词'}
BASIC = {}  # 题库里反复出现却没在词类库当过答案的常见词（词类无争议）
for w in '老师 书包 苹果 桌子 学校'.split(): BASIC[w] = '名词'
for w in '跑 吃 看 写'.split(): BASIC[w] = '动词'
for w in '干净 勇敢 美丽 开心'.split(): BASIC[w] = '形容词'
TPL = re.compile(r'^(.+?)是(.+?)，填在这里最合适。$')

def labelled(q):
    """这题的答案 = 本题子类（题干点名了类别）"""
    Q = q['q']
    return bool(re.match(r'下面哪个(词|短语)?是', Q) or re.match(r'.+?句子中(的)?.+?是？', Q) or re.match(r'选.+?填入', Q))

def main(report=False):
    d, _ = load_data()
    WHY = {}; G = collections.defaultdict(set)
    for s, c, it in items(d):
        for f in it.get('分类', []):
            if f.get('说明'):
                WHY[(it['name'], f['类'])] = f['说明'].strip().rstrip('。'); G[f['类']].add(f['说明'].strip().rstrip('。'))
    def why(b, x): return WHY.get((b, x)) or (next(iter(G[x])) if len(G.get(x, ())) == 1 else None)
    banks = [(fn,) + load_bank(fn)[:2] for fn in bank_files()]
    LOC = collections.defaultdict(lambda: collections.defaultdict(set)); GL = collections.defaultdict(set)
    for fn, name, b in banks:
        for q in b['questions']:
            if q.get('类') and labelled(q) and q['options']:
                w = n(q['options'][q['answer']]); LOC[name][w].add(q['类']); GL[w].add((name, q['类']))
            m = re.match(r'[「“](.+?)[」”]属于(.+?)的哪一小类', q['q'])
            if m: LOC[name][n(m.group(1))].add(str(q['options'][q['answer']])); GL[n(m.group(1))].add((name, str(q['options'][q['answer']])))
    st = collections.Counter(); rep = []
    for fn, name, b in banks:
        ch = False
        for i, q in enumerate(b['questions']):
            m = TPL.match(q.get('解析', ''))
            if not m: continue
            x = q.get('类') or m.group(2); A = bare(q['options'][q['answer']])
            parts = []; bad = None
            for j, o in enumerate(q['options']):
                if j == q['answer']: continue
                k = n(o); L = LOC[name].get(k)
                lab = None
                if L and len(L) == 1: lab = next(iter(L))
                elif not L:
                    gl = {t for t in GL.get(k, ()) if t[0] in CL}
                    if len(gl) == 1:
                        bk, c = next(iter(gl)); lab = c if c.endswith(bk) else bk
                    elif len({t[0] for t in gl}) == 1:
                        lab = next(iter(gl))[0]
                    elif not gl and bare(o) in BASIC:
                        lab = BASIC[bare(o)]
                if lab == x: bad = 'multi'; break
                if lab: parts.append('「%s」是%s' % (bare(o), lab))
                else: parts.append('「%s」不是%s' % (bare(o), x)); st['unknown'] += 1
            if bad:
                st['skip'] += 1; rep.append('%s#%d %s | %s' % (name, i, q['q'][:30], '/'.join(map(str, q['options'])))); continue
            w = why(name, x)
            if w: w = re.split(r'[。；]', w)[0]
            new = '填「%s」，它是%s%s。其他三个：%s。' % (A, x, '：' + w if w else '', '；'.join(parts))
            if new != q['解析']: q['解析'] = new; ch = True; st['fixed'] += 1
        if ch: save_bank(fn, name, b, recount_total=False)
    print(dict(st))
    if report: print('\n'.join(rep))

if __name__ == '__main__':
    main('--report' in sys.argv)
