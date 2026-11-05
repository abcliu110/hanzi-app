#!/usr/bin/env python3
"""Y 语法 第 13 批：易混字词「下面哪个句子用字/用词正确？」「下面哪个句子是X式？」（报告 yuwen.md §8）。幂等。

原解析「S。用字正确；其他三个都是用字错误。」「S是X式；其他三个不是X式。」只复述答案。
四个选项只差一个字词：用 difflib 找出每个错项换进去的字词，按选项顺序写
  「「S」用「A」对：<A 这一用法的讲解说明>。其他三个：「S1」用了「w1」——<w1 的用法说明>；…」
用法说明与批 12 相同（讲解库各易混条目子类「说明」，fix_yuwen_b12_yihun.build_use）。找不出唯一替换字词的题不改，--report 列出。
用法：python3 fix_yuwen_b13_yongzi.py [--report]
"""
import os, re, sys, difflib, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files
from fix_yuwen_b12_yihun import build_use

T1 = re.compile(r'^(.+?)用(字|词)正确；其他三个都是.+?。$')
T2 = re.compile(r'^(.+?)是(.+?)；其他三个不是(.+?)。$')

def swap(a, b, words):
    """a=正确句, b=错句 → (a 里的字词, b 里的字词)，对齐到易混字词表"""
    sm = difflib.SequenceMatcher(None, a, b)
    ops = [o for o in sm.get_opcodes() if o[0] != 'equal']
    if not ops: return None
    pairs = {(a[o[1]:o[2]], b[o[3]:o[4]]) for o in ops}
    if len(ops) > 1:
        return next(iter(pairs)) if len(pairs) == 1 else None
    _, i1, i2, j1, j2 = ops[0]
    x, y = a[i1:i2], b[j1:j2]
    # 扩到词表里的整词（必须/必需、还是/或者）
    for w in sorted(words, key=len, reverse=True):
        for k in range(len(w)):
            if a[max(0, i1 - k):max(0, i1 - k) + len(w)] == w and len(w) > len(x) and a[max(0, i1 - k):].startswith(w):
                s = max(0, i1 - k); xx = w; yy = b[s:s + len(w) - len(x) + len(y)]
                if yy in words: return xx, yy
    return x, y

# 还是/或者库里不是单纯换字的错项（正反问再加「吗」、换成「不/没」后不成选择问），逐句写理由
MANUAL = {}
for _s in ('你去不去吗', '他来不来吗', '你去没去吗', '他来没来吗'):
    MANUAL[_s] = '「%s」本身已经是正反问句，句末再加「吗」就重复了' % _s[1:4]
for _s in ('你喜欢苹果没喜欢香蕉', '你要红笔没要蓝笔'):
    MANUAL[_s] = '用了「没」，成了说「没……」，不再是两样里选一样的问句'
for _s in ('你喜欢苹果不喜欢香蕉', '你要红笔不要蓝笔'):
    MANUAL[_s] = '用了「不」，成了说「不……」，不再是两样里选一样的问句'


def main(report=False):
    USE, WHY, use = build_use()
    words = set(USE) | {'还', '需', '必'}
    st = collections.Counter(); rep = []
    for fn in bank_files():
        name, b, _ = load_bank(fn); ch = False
        if '/' not in name: continue
        for i, q in enumerate(b['questions']):
            e = q.get('解析', '')
            if not (T1.match(e) or (T2.match(e) and q['q'].startswith('下面哪个句子是'))): continue
            A = str(q['options'][q['answer']]).rstrip('。！？')
            parts = []; aw = None; bad = False
            for j, o in enumerate(q['options']):
                if j == q['answer']: continue
                oo = str(o).rstrip('。！？')
                if oo in MANUAL:
                    parts.append('「%s」——%s' % (str(o).rstrip('。'), MANUAL[oo])); continue
                r = swap(A, oo, words)
                if not r or r[1] not in words or r[0] not in words: bad = True; break
                aw = aw or r[0]
                if r[0] != aw: bad = True; break
                parts.append('「%s」用了「%s」——%s' % (str(o).rstrip('。'), r[1], use(r[1])))
            if bad:
                st['skip'] += 1; rep.append('%s#%d %s' % (name, i, '/'.join(q['options']))); continue
            w = WHY.get((name, q.get('类'))) or use(aw)
            new = '「%s」用「%s」对：%s。其他三个：%s。' % (str(q['options'][q['answer']]).rstrip('。'), aw, w, '；'.join(parts))
            if new != e: q['解析'] = new; ch = True; st['fixed'] += 1
        if ch: save_bank(fn, name, b, recount_total=False)
    print(dict(st))
    if report: print('\n'.join(rep))

if __name__ == '__main__':
    main('--report' in sys.argv)
