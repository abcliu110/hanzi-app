#!/usr/bin/env python3
"""Z 线：拼音轻声写法统一——去掉「·」（审查第 21 节）。朗读按钮会把「·」读进去；其他卡轻声直接写 de/le。
改 字卡 读音.拼音 与 data/pinyin_lookup.js 里的同一串。可重复运行。"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_b_lib as L
ZS = '呐子慌末著阿'
n = 0
for z in ZS:
    d = L.load(z); r = d['dim']['读音']
    if '·' in r.get('拼音', ''):
        r['拼音'] = r['拼音'].replace('·', ''); n += L.save(z, d)
p = os.path.join(L.ROOT, 'newhanzi/data/pinyin_lookup.js')
s = open(p, encoding='utf-8').read()
s2 = re.sub(r'"([^"]*)·([a-z]+)"', r'"\1\2"', s)
if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
print('字卡', n, '| pinyin_lookup 改', s.count('·') - s2.count('·'))
