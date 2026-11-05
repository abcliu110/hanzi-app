#!/usr/bin/env python3
"""F2 批次11（G 组）：知识库实词/虚词点一个例句都没有（报告 C2「91 个条目一个例句都没有」）。幂等。
只用本应用自己的篇目数据：guwen.js 某篇「重点」里给这个字作了注（[字, 释义]），就从该篇原文里取含这个字的句子
（按 。！？； 断句，超过 20 字取逗号分句）作例句：
- 加进条目「例子」；「例句解析」加「‘X’在这里是‘释义’的意思（《篇名》）」；
- 释义和某个「分类」的「类」有共同的词（按 、；， 切分比较）就把例句也挂到那个分类下。
篇目里没给这个字作注的不硬配（不按字面出现去猜义项）。改后需重跑 build_guwen_links.py。"""
import os, sys, re, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
H, K, T = load_kn()
TX = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require("./data/guwen.js");console.log(JSON.stringify(window.NHZ_GUWEN.texts))'], cwd=ROOT).decode())
def sent(yw, w):
    for s in re.split(r'[。！？；]', yw):
        s = s.strip('“”‘’ ')
        if w in s:
            if len(s) <= 20: return s
            for c in re.split(r'[，：]', s):
                c = c.strip('“”‘’ ')
                if w in c and len(c) >= 3: return c
            return s[:20]
def parts(x): return set(p for p in re.split(r'[、；，,（）()]', x) if p)
n_it = n_ex = 0
for it in kn_items(K):
    if it.get('例子') or it['key'].split(':')[0] not in ('shici', 'xuci', 'tongjia', 'duoyi'): continue
    w = it['name']; added = []
    for t in TX:
        for z, g in t['重点']:
            if z != w: continue
            s = sent(t['原文'], w)
            if not s or s in [a for a, _, _ in added]: continue
            added.append((s, g, t['title']))
    if not added: continue
    it['例子'] = [a for a, _, _ in added]
    it.setdefault('例句解析', [])
    for s, g, title in added:
        it['例句解析'].append({'句': s, '析': '“%s”在这里是“%s”的意思（《%s》）。' % (w, g, title)})
        for cl in it.get('分类', []) or []:
            if parts(cl.get('类', '')) & parts(g):
                cl.setdefault('例子', [])
                if s not in cl['例子']: cl['例子'].append(s)
        n_ex += 1
    n_it += 1
save_kn(H, K, T)
print('补例句的知识点', n_it, '个，例句', n_ex, '条')
