#!/usr/bin/env python3
"""F2 批次9：题库剩余 B 类（报告 B3 人工补充 / B5 同题干 / B9 跨库重复）。幂等。
1) 多解补漏（G 组复扫 /workspace/work/gsb_scan/gw_multi.py）：
   - 出处题干扰项与答案是同一篇（「《出师表》」vs「诸葛亮《出师表》」、「《列子》」vs「《列子·两小儿辩日》」、
     「《孟子》」vs「《孟子·生于忧患，死于安乐》」）→ 干扰项换成与该句无关的篇目；
   - duoyi:道 干扰项「行走、行动」「品行、行为」（道有「取道、经过」「道德」等引申，易争议）→ 换成无关义项。
2) B5：「“X”可以表示什么意思？」同一知识点里反复出现、答案各不同，孩子会以为上一题错了。
   题干改成「下面哪一项是“X”的一个意思？」（只问一个义项，多题并存不矛盾；干扰项已复扫不含 X 的其他义项）。
3) B9：题干与正确答案文字都相同的重复题（跨库/同库），只保留第一次出现（题库按文件名顺序），其余删除；知识库「练习」副本同步。
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); H, K, T = load_kn()
REPL = {  # (题干, 旧干扰项) -> 新干扰项
 ('“是以众议举宠为督”出自哪篇？', '《出师表》'): '《小石潭记》',
 ('“孰为汝多知乎”出自哪篇？', '《列子》'): '《论语》',
 ('“生于忧患，死于安乐”出自哪篇？', '《孟子·生于忧患，死于安乐》'): '《韩非子·郑人买履》',
 ('“道”可以表示什么意思？', '行走、行动'): '胜利',
 ('下面哪一项是“道”的一个意思？', '行走、行动'): '胜利',
 ('下面关于“道”的说法，正确的是？', '“道”可以表示行走、行动。'): '“道”可以表示胜利。',
 ('下面关于“道”的说法，正确的是？', '“道”可以表示品行、行为。'): '“道”可以表示偶尔。',
}
n1 = n2 = 0
R1 = re.compile(r'^“(.+?)”可以表示什么意思？$')
for k, q in all_q(B, K):
    for j, x in enumerate(q['options']):
        if j != q['answer'] and (q['q'], x) in REPL:
            q['options'][j] = REPL[(q['q'], x)]; n1 += 1
    m = R1.match(q['q'])
    if m:
        q['q'] = '下面哪一项是“%s”的一个意思？' % m.group(1); n2 += 1
seen = set(); dup = set()
for mid in sorted(B):
    for k, o in B[mid]:
        for q in o['questions']:
            sig = (q['q'], q['options'][q['answer']])
            if sig in seen: dup.add(id(q))
            seen.add(sig)
n3 = drop_q(B, K, lambda k, q: id(q) in dup)
# 知识库练习里如有与题库已删副本重复的，也按签名去重（保留每点第一道）
for it in kn_items(K):
    if it.get('练习'):
        s2 = set(); keep = []
        for q in it['练习']:
            sig = (q['q'], q['options'][q['answer']])
            if sig not in s2: keep.append(q); s2.add(sig)
        it['练习'] = keep
save_banks(B); save_kn(H, K, T)
print('多解换干扰项', n1, '；题干改写', n2, '；删重复题', n3)
