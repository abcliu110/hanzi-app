#!/usr/bin/env python3
"""F2 批次7：模板拼接病句（报告 B7）。幂等。
- 「古义是古义：…今义是今义：…」→「古义是…，今义是…」（含互换的干扰项「古义是今义：」）；「的古义是？」类选项去掉「古义：」「今义：」前缀
- 「‘X’可以表示＋词性/用法标签」改成通顺说法：可以作副词/介词/连词/代词…；可以用在句中表示停顿；可以组成“所以”，表示凭借、原因；读wèi时可以引出对象…
- 引号嵌套「““…””」的题干改写（哪个字可以是“之乎”的合音？意思是“因此”的是哪个固定句式？…）"""
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); h, K, t = load_kn()
ZUO = ['疑问代词', '介词、连词', '结构助词', '音节助词', '句首发语词', '句首语气词', '副词', '介词', '连词', '兼词', '代词', '动词', '词尾', '被动标志']
YONG = {'句中停顿、时间词后': '可以用在句中或时间词后表示停顿', '句中停顿': '可以用在句中表示停顿', '判断句句末': '可以用在判断句句末',
        '句末语气': '可以用在句末表示语气', '判断句主语后停顿': '可以用在判断句主语后表示停顿', '主谓之间取消独立性': '可以用在主谓之间，取消句子独立性',
        '“所以”表示凭借、原因': '可以组成“所以”，表示凭借、原因', '代词性结构': '可以组成代词性结构',
        '与动词组成“所＋动词”结构': '可以与动词组成“所＋动词”结构', '读wèi时表对象': '读wèi时可以引出对象',
        '判断词“是”': '可以作判断词', '疑问词“怎么、哪里”': '可以作疑问词，意思是怎么、哪里',
        '“之乎”的合音': '可以是“之乎”的合音', '“之于”的合音': '可以是“之于”的合音', '作名词指恩惠': '可以作名词，指恩惠'}
def fix_kybs(s):
    def rep(m):
        rest = m.group(1)
        for k, v in YONG.items():
            if rest.startswith(k): return v + rest[len(k):]
        for z in ZUO:
            if rest.startswith(z) and (len(rest) == len(z) or rest[len(z)] in '，。、'):
                if z == '介词、连词' or not rest[len(z):].startswith('、'):
                    return '可以作' + rest
        return m.group(0)
    return re.sub(r'可以表示((?:[^。？”]|”(?!的意思))+)', rep, s)
def fix(s):
    o = s
    # 古今异义
    s = re.sub(r'(古义是|今义是)(?:古义|今义)：', r'\1', s)
    # 嵌套引号题干
    s = re.sub(r'^哪个字可以表示““(之乎|之于)”的合音”的意思？$', r'哪个字可以是“\1”的合音？', s)
    s = re.sub(r'^哪个字可以表示“通“(.)””的意思？$', r'哪个字通“\1”？', s)
    s = re.sub(r'^哪个字可以表示“自谦词“鄙人””的意思？$', '哪个字可以用作自谦词，如“鄙人”？', s)
    s = re.sub(r'^哪个字可以表示“作名词指恩惠”的意思？$', '哪个字可以作名词，指恩惠？', s)
    s = re.sub(r'^““(.+?)”的意思”说的是哪个固定句式？$', r'意思是“\1”的是哪个固定句式？', s)
    s = re.sub(r'^“(表示“.+?”)”说的是哪个固定句式？$', r'\1的是哪个固定句式？', s)
    s = fix_kybs(s)
    if s == '判断词“是”': s = '作判断词'
    s = re.sub(r'可以作(副词|连词|介词|代词|动词)，(?!相当于|意思是|表示)', r'可以作\1，表示', s)
    return s
n = [0]
def fx(x):
    y = fix(x)
    if y != x: n[0] += 1
    return y
for mid in B:
    for k, o in B[mid]:
        for q in o['questions']:
            map_strings(q, fx)
            if re.search(r'的(古|今)义是？$', q['q']):
                q['options'] = [re.sub(r'^(古义|今义)：', '', x) for x in q['options']]
map_strings(K, fx)
idx = {(k, q['q'], q['answer']): q for mid in B for k, o in B[mid] for q in o['questions']}
for it, lst, i, q in kn_questions(K):
    if re.search(r'的(古|今)义是？$', q['q']):
        q['options'] = [re.sub(r'^(古义|今义)：', '', x) for x in q['options']]
    b = idx.get((it['key'], q['q'], q['answer']))
    if b: lst[i] = b
save_banks(B); save_kn(h, K, t)
print('改动字符串', n[0])
