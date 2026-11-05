#!/usr/bin/env python3
"""赏析质量：模板套话、译文照抄原文、过短。python3 scripts/shici_scan_quality.py -> tmp/scan_quality.json"""
import json,re,os,collections
T=os.path.join(os.path.dirname(__file__),'../tmp')
d=json.load(open(T+'/shici.json'));P=d['poems'];SX=json.load(open(T+'/shangxi.json'))
pk={(p['title'],p['author']):p for p in P}
hz=lambda s:re.sub(r'[^\u3400-\u9fff]','',s)
res=collections.defaultdict(list)
# 1 句子级套话：bg/ys 按句切分，统计出现在多首中的相同句/相同8字片段
sent=collections.defaultdict(set); gram=collections.defaultdict(set)
for s in SX:
    for f in ('bg','ys'):
        for x in re.split(r'[。！？；]',s[f]):
            h=hz(x)
            if len(h)>=6: sent[h].add(s['t'])
            for i in range(len(h)-7): gram[h[i:i+8]].add(s['t'])
res['dup_sentence']=sorted([[k,sorted(v)] for k,v in sent.items() if len(v)>=2],key=lambda x:-len(x[1]))
res['dup_8gram']=sorted([[k,len(v),sorted(v)[:8]] for k,v in gram.items() if len(v)>=4],key=lambda x:-x[1])[:80]
# 2 句式模板：「X写…的诗/词。写…」
for s in SX:
    if re.match(r'^\S{1,4}写(的)?\S{0,8}(诗|词)。',s['bg']) : res['bg_template'].append([s['t'],s['bg']])
    if len(hz(s['ys']))<30: res['ys_short'].append([s['t'],s['ys']])
# 3 译文照抄：译文中保留原句字符(按序LCS)比例
def lcs(a,b):
    m=[[0]*(len(b)+1) for _ in range(len(a)+1)]
    for i in range(len(a)):
        for j in range(len(b)): m[i+1][j+1]=m[i][j]+1 if a[i]==b[j] else max(m[i][j+1],m[i+1][j])
    return m[-1][-1]
cnt=collections.Counter()
for s in SX:
    p=pk.get((s['t'],s['a']))
    for z in s['zj']:
        if '——' not in z: continue
        o,t=z.split('——',1); o,t2=hz(o),hz(t)
        if len(o)<4: continue
        r=lcs(o,t2)/len(o); extra=len(t2)-lcs(o,t2)
        if r>=0.85 and extra<=4:
            res['zj_copy'].append([s['t'],p['ke'] if p else '?',z]); cnt[s['t']]+=1
res['zj_copy_by_poem']=cnt.most_common()
json.dump(res,open(T+'/scan_quality.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,len(v))
