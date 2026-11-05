#!/usr/bin/env python3
"""F6（G 组）：部首题库同一部首两种写法同时出现在选项里（bushou_ui.md 第 16 节，7 题）+ order 模板单调（第 18 节）。幂等。
1) 字典部首目录写作「水(氵)部」「手(扌)部」，选整字不能算全错 → 去掉同部的另一种写法，换成字形相近但确实不对的部件，
   误解标注同步改写：河 水→冫（两点水）；打 手→才；你 人→彳（双人旁）；铁 金→饣；灯 灬→大；珠 玉→主；郊 邑→卩。
2) order 前 20 题题干只换一个字、答案全是「甲骨文→金文→小篆→楷书」，做一题等于做完：保留 马 水 日 车 4 题
   （部首页有这 4 个字的演变动画），其余 16 题删除。
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_bushou_ui_lib import load, save
P = os.path.join(os.path.dirname(__file__), '..', '..', 'quiz', 'data_bushou.js')
Q, fmt = load(P); M = Q['modes']
FIX = {  # 题干: (旧选项, 新选项, 误解, 反例)
 "'河'的部首是？": ('水', '冫', "把两点水'冫'和三点水'氵'看混了，冫和冰冻、寒冷有关", '冷=冫✓'),
 "'打'的部首是？": ('手', '才', "提手旁'扌'和'才'字长得像，看混了", '才是独立的字✗'),
 "'你'的部首是？": ('人', '彳', "把单人旁'亻'看成了双人旁'彳'", '行=彳✓'),
 "'铁'的部首是？": ('金', '饣', "金字旁'钅'和食字旁'饣'长得像，看混了", '饭=饣✓'),
 "'灯'的部首是？": ('灬', '大', "把'火'看成了'大'，没注意火字两边的点", '灯=火√'),
 "'珠'的部首是？": ('玉', '主', "王字旁和'主'字长得像，看混了", '住=亻+主'),
 "'郊'的部首是？": ('邑', '卩', "右耳刀'阝'和'卩'长得像，看混了", '印=卩✓'),
}
c = dict(var=0, order=0)
for x in M['choice']:
    if x['q'] in FIX:
        old, new, mis, ex = FIX[x['q']]
        if old not in x['opts']: continue
        j = x['opts'].index(old); assert j != x['a']
        x['opts'][j] = new
        L = 'ABCD'[j]; z = x['q'][1]
        right = x['opts'][x['a']]
        for m in x.get('误解标注', []):
            if m.get('选项') == L:
                m['选项文本'] = new; m['误解'] = mis; m['正反例'] = ['%s=%s√' % (z, right), '%s=%s✗' % (z, new)]
        c['var'] += 1
KEEP = {'马', '水', '日', '车'}
new = []
for x in M['order']:
    p = x.get('prompt', '')
    if p.startswith("把'") and '字形演变' in p and p[2] not in KEEP: c['order'] += 1; continue
    new.append(x)
M['order'] = new
save(P, Q, fmt)
print(c)
