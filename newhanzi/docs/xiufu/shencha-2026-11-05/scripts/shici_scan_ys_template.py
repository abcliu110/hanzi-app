#!/usr/bin/env python3
"""「艺术特色」逐句复述型套话：ys 中出现 ≥3 处「原句+写/是/——」复述。python3 scripts/shici_scan_ys_template.py"""
import json,re,os
T=os.path.join(os.path.dirname(__file__),'../tmp')
P={(p['title'],p['author']):p for p in json.load(open(T+'/shici.json'))['poems']}
hz=lambda s:re.sub(r'[^\u3400-\u9fff]','',s)
out=[]
for s in json.load(open(T+'/shangxi.json')):
    p=P.get((s['t'],s['a']));
    if not p: continue
    segs=[hz(x) for x in re.split(r'[，。！？；、]',''.join(p['lines'])) if len(hz(x))>=3]
    n=sum(1 for x in segs if re.search(re.escape(x)+r'(写|是|——)',hz(s['ys'])+'——' if False else s['ys'].replace('、','')) )
    ratio=n/len(segs) if segs else 0
    if n>=3 and ratio>=0.5: out.append((s['t'],p['ke'],n,len(segs),s['ys'][:60]))
for x in out: print(x)
print('命中',len(out),'课内',sum(x[1]=='课内' for x in out))
