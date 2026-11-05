#!/usr/bin/env python3
"""F2 批次5：编辑括注/编写备注漏进题面、选项、解析和知识库正文（报告 B6，连带 C3 同类）。幂等。
- 「（语境义）」删；「（jī，语境义）」→「（读jī）」；「（通“懈”，语境义）」→「（通“懈”）」
- 「（“保佑”义初中可略，已删。）」「（“善”义初中可略，已删。）」等「…初中可略，已删」删
- 「（版本有分歧）」「（教材多注，版本有分歧）」删（坐通座是通行教材注，保留条目，只去编辑记录）
- wenxue「本应用“X”…」→「《X》…」；「本应用“论语选读”6篇」→「古文区“论语选读”6篇」
- 清理删括注后留下的「。。」「。”的意思」和裸义项尾「。」"""
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); h, K, t = load_kn()
def fix(s):
    o = s
    s = re.sub(r'（([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+)，语境义）', r'（读\1）', s)
    s = re.sub(r'（(通“[^”]+”)，语境义）', r'（\1）', s)
    s = s.replace('（语境义）', '')
    s = re.sub(r'（“[^”]{1,8}”义初中可略，已删。?）', '', s)
    s = re.sub(r'（(?:教材多注，)?版本有分歧）', '', s)
    s = s.replace('本应用“论语选读”', '古文区“论语选读”')
    s = re.sub(r'本应用“([^”]+)”“([^”]+)”', r'《\1》《\2》', s)
    s = re.sub(r'本应用“([^”]+)”', r'《\1》', s)
    if s != o:
        s = s.replace('。。', '。').replace('。”的意思', '”的意思').replace('。”，', '”，')
    return s
n = [0]
def fx(x):
    y = fix(x)
    if y != x: n[0] += 1
    return y
for mid in B:
    for k, o in B[mid]:
        for q in o['questions']:
            before = list(q['options'])
            map_strings(q, fx)
            # 裸义项选项（不以引号开头）去掉删括注后残留的句末「。」
            q['options'] = [y.rstrip('。') if (y != x and not y.startswith('“')) else y for x, y in zip(before, q['options'])]
map_strings(K, fx)
# tongjia:内 / 坐 讲解里的编写说明
def fix_tj(x):
    x = x.replace('初中可略，作拓展。', '').replace('本字意思：接纳、交纳。', '本字意思：接纳、交纳。') 
    x = x.replace('部分教材把“满坐寂然”讲为通假，另有版本直接作“座”解，产品中标注分歧。', '有的教材把“满坐寂然”的“坐”注为通“座”，有的直接解释为座位，意思都是座位。')
    x = x.replace('版本有分歧：部分教材把“满坐寂然”讲为通假，另有版本直接作“座”解。', '有的教材把“满坐寂然”的“坐”注为通“座”，有的直接解释为座位，意思都是座位。')
    return x
for key in ('tongjia:内', 'tongjia:坐'):
    map_strings(kn_item(K, key), fix_tj)
for it, lst, i, q in kn_questions(K):
    pass
# 知识库练习副本与题库保持同一写法（按题干同步选项）
idx = {}
for mid in B:
    for k, o in B[mid]:
        for q in o['questions']: idx[(k, q['q'], q['answer'])] = q
for it, lst, i, q in kn_questions(K):
    b = idx.get((it['key'], q['q'], q['answer']))
    if b: lst[i] = b
# 子模块简介（页面直接显示）里的编写说明改成给孩子看的话
INTRO = {
 'xuci': ('18虚词名单来自教育部考试中心《2019年普通高等学校招生全国统一考试大纲（语文）》所列“常见文言虚词”，是教学中通用的传统名单，不是2022年版义务教育语文课标的规定，产品内不得标注为课标规定。',
          '18个虚词是教学中通用的传统名单（出自教育部考试中心《2019年普通高等学校招生全国统一考试大纲（语文）》所列“常见文言虚词”），不是课标规定的名单。'),
 'shici': ('“乃、何、若”兼类，主归虚词，这里保留其名以保证120数完整。本子模块29字有直接例句（只引报告与本应用12篇中可核实的句子），其余91字暂无直接例句、不编造，结合课文记忆。',
           '“乃、何、若”也常作虚词，主要放在虚词里讲，这里保留是为了凑齐120个。现在有29个字配了课文例句，其余的字请结合课文记忆。'),
 'yufa': ('例句只引公有领域古代文献原文并注明出处；个别句式暂无课内短句例句，只讲识别方法，不编造例句。',
          '例句都选自古代文献原文并注明出处；个别句式暂时没有课内短句例句，只讲识别方法。'),
}
for c in K['categories']:
    if c['id'] in INTRO:
        a, b = INTRO[c['id']]
        c['intro'] = c['intro'].replace(a, b)
save_banks(B); save_kn(h, K, t)
print('改动字符串', n[0])
