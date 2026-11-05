#!/usr/bin/env python3
"""F2 批次6：非学习内容进题（报告 B2）。幂等。
- meiti（资源授权/外链规则）整库删除：删 guwen/quiz_bank_guwen_meiti.js、测验页 data_guwen.js 里的 23 题、知识库 meiti 各点的「练习」；
  知识库 meiti 分类的资料数据暂留（以后若做给家长/老师看的「资源」页可用），guwen.html 首页不再列出该子模块（公共文件最小改动）
- gaopinci 只保留「选项目」（字词归属篇目）题，删考学段/编写说明的「正误判断/选内容/选对应」题（B3 已删 23 道学段多解题，这里删剩下的）"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); h, K, t = load_kn()
n_meiti = sum(len(o['questions']) for k, o in B.get('meiti', []))
B.pop('meiti', None)
f = os.path.join(NH, 'guwen', 'quiz_bank_guwen_meiti.js')
if os.path.exists(f): os.remove(f)
for c in K['categories']:
    if c['id'] == 'meiti':
        for it in c['items']: it.pop('练习', None)
n_gp = drop_q(B, K, lambda k, q: k.startswith('gaopinci:') and q.get('类') != '选项目')
save_banks(B); save_kn(h, K, t)
# guwen.html：首页子模块列表去掉 meiti
G = os.path.join(NH, 'guwen.html'); g = open(G, encoding='utf8').read()
line = "    {id:'meiti', icon:'🎬', t:'视频动画图示', d:'只外链嵌入 · 不照搬'},\n"
if line in g:
    open(G, 'w', encoding='utf8').write(g.replace(line, ''))
print('meiti 删题', n_meiti, 'gaopinci 删题', n_gp)
