#!/usr/bin/env python3
"""F2 批次10：知识库模板套话与空洞字段（报告 C1/C2）。只删不编，幂等。
页面（guwen.html）对空的 口诀/讲解/深讲/怎么认 不显示，所以无内容的模板宁可留空。
- 口诀：整模块复用的空话（实词多义看语境，本义引申要分清 ×120、篇目字词结合课文记 ×28、先认作者再认体 ×20、一字多义看语境 ×12）清空；
- 怎么认：shici 120 条同一组三句、gaopinci 28 条同一组两句清空（其余模块的方法步骤是该模块通用方法，保留）；
- 深讲：删「记法：结合课文语境，不要只背义项串。」「记法：由本义想引申义，更重要的是看上下文。」两句套话；删后只剩义项罗列且与讲解相同的清空；
- 讲解：只有「小学」「初中」「文体」「制度」两个字的清空；duoyi 12 条「一词多义，看语境定意思。」改成本条深讲里已有的义项罗列；
- 分类：「说明」与「类」逐字相同的，说明清空（避免同一句显示两遍）。
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
H, K, T = load_kn()
KJ = {'实词多义看语境，本义引申要分清', '篇目字词结合课文记', '先认作者再认体', '一字多义看语境'}
JX = {'小学', '初中', '文体', '制度'}
TAIL = ['记法：结合课文语境，不要只背义项串。', '记法：由本义想引申义，更重要的是看上下文。']
def senses(s):
    return re.sub(r'[①-⑳]', '', s).strip().rstrip('。')
c = dict(kj=0, zmr=0, sj=0, jx=0, fl=0)
for it in kn_items(K):
    mod = it['key'].split(':')[0]
    if it.get('口诀') in KJ: it['口诀'] = ''; c['kj'] += 1
    if mod in ('shici', 'gaopinci') and it.get('怎么认'):
        it['怎么认'] = []; c['zmr'] += 1
    sj = it.get('深讲', '')
    if sj:
        new = sj
        for t in TAIL: new = new.replace(' ' + t, '').replace(t, '')
        new = new.strip()
        if it.get('讲解') == '一词多义，看语境定意思。' and new:
            it['讲解'] = senses(new) + '。'; c['jx'] += 1
        if new and senses(new) == senses(it.get('讲解', '')): new = ''
        if new != sj: it['深讲'] = new; c['sj'] += 1
    if it.get('讲解') in JX: it['讲解'] = ''; c['jx'] += 1
    for cl in it.get('分类', []) or []:
        if cl.get('说明') and cl.get('说明') == cl.get('类'): cl['说明'] = ''; c['fl'] += 1
save_kn(H, K, T)
print(c)
