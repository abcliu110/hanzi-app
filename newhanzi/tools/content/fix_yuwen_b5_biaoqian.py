#!/usr/bin/env python3
"""F1 语法 第 5 批：解析干扰项标签错位（报告 yuwen.md §5）。幂等，可重复运行。

原模板「A 是X；其他三个分别是L1、L2、L3，不是X。」里 L1–L3 按子类固定顺序排，和选项顺序对不上。
做法：按选项顺序逐个确定干扰项的类别，改写成「「A」是X。其他三个：「o1」是L1，「o2」是L2，「o3」是L3。」
  1. 本库词典：本库「下面哪个…是X」题的答案 → X（同一词在本库只有一个类别时才用）；
  2. 原解析里的标签是正确的「集合」，只是顺序乱：词典查不到的干扰项，用剩下的标签补——剩下的标签只有一种时直接用；
  3. 跨库词典：剩下标签是某个库的名字（如「名词」「动词」），而这个词在那个库里当过答案，就用它；
  4. 还确定不了的，只说「「o」不是X」，不再乱贴标签。
如果某个干扰项在本库词典里正好也是 X（= 多解），不改这题，列入 --report 输出留人工处理。
用法：python3 fix_yuwen_b5_biaoqian.py [--report]
"""
import os, re, sys, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files

PAT = re.compile(r'^(?P<v>是|有)(?P<x>[^；]+?)(?P<mb>的毛病)?；其他三个分别是(?P<labs>.+?)，不是(?P=x)。?$', re.S)


def parse(q):
    e = q.get('解析', ''); a = str(q['options'][q['answer']])
    for h in (a, a.rstrip('。')):
        if e.startswith(h):
            m = PAT.match(e[len(h):])
            if m: return m
    return None


def norm(s):
    return re.sub(r'[\s。，！？、；：“”"\'‘’（）()「」]', '', str(s))


def is_a(q):
    return q['q'].startswith('下面哪个')


def main(report=False):
    banks = []
    for fn in bank_files():
        name, d, _ = load_bank(fn)
        banks.append((fn, name, d))
    # 词典
    local = {}
    glob = collections.defaultdict(set)  # 词 → {库名}
    for fn, name, d in banks:
        L = collections.defaultdict(set)
        for q in d['questions']:
            if is_a(q) and q.get('类'):
                w = norm(q['options'][q['answer']])
                L[w].add(q['类'])
                glob[w].add(name)
        local[fn] = L
    stat = collections.Counter(); multi = []
    for fn, name, d in banks:
        L = local[fn]; ch = False
        for i, q in enumerate(d['questions']):
            m = parse(q)
            if not m or not is_a(q):
                continue
            x = m.group('x'); ls = m.group('labs')
            labs = re.split(r'(?<=式)、', ls) if ls.endswith('式') else ls.split('、')
            ans = q['options'][q['answer']]
            ds = [o for j, o in enumerate(q['options']) if j != q['answer']]
            if len(labs) != len(ds):
                stat['skip_len'] += 1; continue
            out = [None] * len(ds); left = collections.Counter(labs); bad = False
            for j, o in enumerate(ds):
                k = L.get(norm(o))
                if k and len(k) == 1:
                    l = next(iter(k))
                    if l == q.get('类') or l == x:
                        bad = True; break
                    out[j] = l
                    if left[l] > 0: left[l] -= 1
            if bad:
                multi.append('%s#%d %s | %s' % (name, i, q['q'], '/'.join(q['options']))); stat['multi'] += 1; continue
            rest = [l for l, c in left.items() for _ in range(c)]
            unk = [j for j in range(len(ds)) if out[j] is None]
            if unk and len(set(rest)) == 1:
                for j in unk: out[j] = rest[0]
            else:
                for j in unk:
                    cands = [l for l in set(rest) if l in glob.get(norm(ds[j]), ())]
                    if len(cands) == 1:
                        out[j] = cands[0]; rest.remove(cands[0])
                unk = [j for j in range(len(ds)) if out[j] is None]
                if unk and len(set(rest)) == 1:
                    for j in unk: out[j] = rest[0]
            parts = []
            for o, l in zip(ds, out):
                if l: parts.append('「%s」是%s' % (str(o).rstrip('。'), l))
                else: parts.append('「%s」不是%s' % (str(o).rstrip('。'), x)); stat['unknown_label'] += 1
            verb = m.group('v'); tail = m.group('mb') or ''
            new = '「%s」%s%s%s。其他三个：%s。' % (str(ans).rstrip('。'), verb, x, tail, '，'.join(parts))
            if new != q['解析']:
                q['解析'] = new; ch = True; stat['fixed'] += 1
        if ch:
            save_bank(fn, name, d, recount_total=False)
    print(dict(stat))
    if report:
        print('\n'.join(multi))
    return stat


if __name__ == '__main__':
    main('--report' in sys.argv)
