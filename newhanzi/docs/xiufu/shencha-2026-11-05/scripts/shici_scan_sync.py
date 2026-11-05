#!/usr/bin/env python3
"""跨文件版本一致性：题库/飞花令里的诗句与 shici.js 只差 1–2 字的（同一句两个版本）。
python3 scripts/shici_scan_sync.py -> tmp/scan_sync.json"""
import json,re,os,collections
T=os.path.join(os.path.dirname(__file__),'../tmp')
P=json.load(open(T+'/shici.json'))['poems'];Q=json.load(open(T+'/quiz.json'))['modes'];F=json.load(open(T+'/feihua.json'))['POEMS']
SX=json.load(open(T+'/shangxi.json'))
hz=lambda s:re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]','',s)
base={}
for p in P:
    for x in re.split(r'[，。！？；、：]',''.join(p['lines'])):
        if hz(x): base.setdefault(hz(x),(p['title'],p['ke']))
bylen=collections.defaultdict(list)
for k in base: bylen[len(k)].append(k)
def near(s):
    if s in base or len(s)<5: return None
    for k in bylen[len(s)]:
        dif=[i for i in range(len(s)) if s[i]!=k[i]]
        if 1<=len(dif)<=2 and len(s)-len(dif)>=4: return k
res=collections.defaultdict(list); seen=set()
def chk(where,text,ctx):
    for x in re.split(r'[，。！？；、：「」“”]',text):
        h=hz(x); k=near(h)
        if k and (where,h) not in seen:
            seen.add((where,h)); res[where].append({'text':h,'shici':k,'poem':base[k][0],'ke':base[k][1],'ctx':ctx[:50]})
for mode,L in Q.items():
    if mode=='spot': L=[{k:v for k,v in x.items() if k!='s'} for x in L]  # 找错题的错句是故意的
    for i,x in enumerate(L): chk('quiz',json.dumps(x,ensure_ascii=False),f'{mode}#{i}')
for p in F:
    for l in p['lines']: chk('feihua',l,p['t'])
for s in SX:
    for z in s['zj']: chk('shangxi_zj',z.split('——')[0],s['t'])
json.dump(res,open(T+'/scan_sync.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,len(v),'课内',sum(x['ke']=='课内' for x in v))
