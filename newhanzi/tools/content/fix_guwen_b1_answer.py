#!/usr/bin/env python3
"""F2 批次1：题库答案与解析相反（报告 B1，6 题 + 伤仲永例句漏字）。幂等。
- xuci:所：「所闻」「所从来」是「所＋动词」结构，正确项改为该用法；「所以传道受业解惑」答案保留「所以」表凭借，解析改为与答案一致
- huoyong:名词使动用法：「既来之，则安之」的「安」是形容词使动 → 答案改、题移到形容词使动用法；「哪个词属于名词使动[苦,安,难,日]」删；知识库同步
- xuci:于：「取之于蓝」的「于」是「从」，「青于蓝」表比较
- huoyong:名词作状语：「日扳仲永谒于邑人」补「环」字（《伤仲永》原文）"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); h, K, t = load_kn()
SUO = '与动词组成“所＋动词”结构'
SUOYI_EXP = '“所以”是固定结构，表凭借，意思是“用来……的”；“师者，所以传道受业解惑也”指老师是用来传授道理、教授学业、解答疑难的人。'
YU_EXP = '“于”是介词，从；“取之于蓝”是状语后置，正常语序是“于蓝取之”（从蓝草中提取）；后面“青于蓝”的“于”表示比较，比。'
for k, q in all_q(B, K):
    if k == 'xuci:所' and q.get('类') in ('选用法', '选词填空'):
        if '所闻' in q['q'] or '所从来' in q['q']:
            if q.get('类') == '选用法':
                q['options'][q['answer']] = SUO
        if '所以传道受业解惑' in q['q']:
            if q.get('类') == '选用法': q['解析'] = SUOYI_EXP
            else: q['解析'] = '原句是“所以传道受业解惑也”。' + SUOYI_EXP
    if k == 'xuci:于' and '取之于蓝' in q['q'] and q.get('类') in ('选用法', '选词填空'):
        q['解析'] = YU_EXP if q['类'] == '选用法' else '原句是“青，取之于蓝，而青于蓝”。' + YU_EXP
    if '日扳仲永谒于邑人' in q['q']:
        q['q'] = q['q'].replace('日扳仲永谒于邑人', '日扳仲永环谒于邑人')
    if k == 'huoyong:名词使动用法' and '则安之' in q['q']:
        q['answer'] = q['options'].index('形容词使动用法')
# 移题：安 → 形容词使动用法
src = find_point(B, 'huoyong:名词使动用法'); dst = find_point(B, 'huoyong:形容词使动用法')
mv = [q for q in src['questions'] if '则安之' in q['q']]
for q in mv:
    if not any(x['q'] == q['q'] for x in dst['questions']):
        # 插在选类型题末尾
        pos = max([i for i, x in enumerate(dst['questions']) if x.get('类') == '选类型'] + [-1]) + 1
        dst['questions'].insert(pos, q)
drop_q(B, K, lambda k, q: k == 'huoyong:名词使动用法' and ('则安之' in q['q'] or (q.get('类') == '选例词' and q['options'][q['answer']] == '安')))
# 知识库条目
a = kn_item(K, 'huoyong:名词使动用法'); b = kn_item(K, 'huoyong:形容词使动用法')
if '既来之，则安之' in a['例子']:
    a['例子'].remove('既来之，则安之'); b['例子'].append('既来之，则安之')
    a['深讲'] = a['深讲'].replace('、安（使……安定）', '')
    b['深讲'] = b['深讲'] + '、安（使……安定）'
    ex = [e for e in a['例句解析'] if e['句'] == '既来之，则安之']
    a['例句解析'] = [e for e in a['例句解析'] if e['句'] != '既来之，则安之']
    for e in ex:
        e['析'] = "'安'是形容词（安定），这里带宾语“之”，使动用法，意思是'使……安定'。"
        b['例句解析'].append(e)
    if not any('则安之' in q['q'] for q in b['练习']):
        b['练习'].insert(2, mv[0])
s = kn_item(K, 'xuci:所')
for e in s['例句解析']:
    if e['句'] == '所以传道受业解惑也': e['析'] = SUOYI_EXP
y = kn_item(K, 'xuci:于')
for e in y.get('例句解析', []) or []:
    if '取之于蓝' in e['句']: e['析'] = YU_EXP
for e in kn_item(K, 'huoyong:名词作状语').get('例句解析', []) or []:
    e['句'] = e['句'].replace('日扳仲永谒于邑人', '日扳仲永环谒于邑人')
it = kn_item(K, 'huoyong:名词作状语'); it['例子'] = [x.replace('日扳仲永谒于邑人', '日扳仲永环谒于邑人') for x in it.get('例子', [])]
save_banks(B); save_kn(h, K, t)
print('ok')
