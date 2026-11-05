#!/usr/bin/env python3
"""Y 语法 第 12 批：易混字词选填题「S。括号里填A；其他三个字/词不合X的用法。」（报告 yuwen.md §8）。幂等。

14 个易混字词库（把/被、不/没、的/地/得、和/与、吗/呢/吧、像/象、必须/必需、才/就、都/也、还是/或者、哪/那、以/已、在/再、做/作）。
原解析只复述答案、还带内部标签「X式」。改为：
  「填「A」：<A 这一用法的讲解说明>。其他三个不合适：「o1」——<o1 的用法说明>；…」（按选项顺序）
每个字词的用法说明只取讲解库 data.js 里该易混库同名子类的「说明」（如「被遭遇式」→ 被字句，主语受到动作）；
一个字有两种用法的（没、和、象、了）两条都写；讲解库里没有的：才/就库的「还」写「不表示比想的晚少难/早多易」（取本库两条说明），哪/那库的「需」「必」写「不是表疑问或指示的字，放进括号不成话」。
用法：python3 fix_yuwen_b12_yihun.py
"""
import os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, items

TPL = re.compile(r'^(.+?)括号里填(.+?)；其他三个(字|词)不合(.+?)的用法。$', re.S)

def main():
    d, _ = load_data()
    USE = collections.defaultdict(list)   # 字词 → [说明]
    WHY = {}
    for s, c, it in items(d):
        nm = it['name']
        if '/' not in nm: continue
        words = nm.split('/')
        for f in it.get('分类', []):
            sm = (f.get('说明') or '').strip().rstrip('。')
            if not sm: continue
            WHY[(nm, f['类'])] = sm
            for w in sorted(words, key=len, reverse=True):
                if f['类'].startswith(w) and f['类'][len(w):len(w) + 1] not in ('₁', '₂') or (w == '了' and f['类'].startswith('了')):
                    if sm not in USE[w]: USE[w].append(sm)
                    break
    EXTRA = {'还': '不表示比想的晚、少、难，也不表示比想的早、多、易', '需': '不是表疑问或指示的字，放进括号不成话', '必': '不是表疑问或指示的字，放进括号不成话'}
    def use(w):
        v = USE.get(w)
        return '；'.join(v) if v else EXTRA[w]
    st = collections.Counter()
    for fn in bank_files():
        name, b, _ = load_bank(fn); ch = False
        if '/' not in name: continue
        for q in b['questions']:
            m = TPL.match(q.get('解析', ''))
            if not m: continue
            A = q['options'][q['answer']]; x = q.get('类') or m.group(4)
            w = WHY.get((name, x)) or use(A)
            parts = ['「%s」——%s' % (o, use(o)) for j, o in enumerate(q['options']) if j != q['answer']]
            st['nouse'] += sum(1 for j, o in enumerate(q['options']) if j != q['answer'] and o not in USE)
            new = '填「%s」：%s。其他三个不合适：%s。' % (A, w, '；'.join(parts))
            if new != q['解析']: q['解析'] = new; ch = True; st['fixed'] += 1
        if ch: save_bank(fn, name, b, recount_total=False)
    print(dict(st), {k: v for k, v in USE.items()})

if __name__ == '__main__':
    main()
