#!/usr/bin/env python3
"""赏析(shangxi)与原文对应扫描：python3 scripts/shici_scan_shangxi.py  (先跑 node scripts/shici_dump.js)
输出 tmp/scan_shangxi.json"""
import json,re,os,collections
T=os.path.join(os.path.dirname(__file__),'../tmp')
d=json.load(open(T+'/shici.json'));P=d['poems'];SX=json.load(open(T+'/shangxi.json'))
hz=lambda s:re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]','',s)
res=collections.defaultdict(list)
bykey=collections.defaultdict(list)
for i,s in enumerate(SX): bykey[(s['t'],s['a'])].append(i)
for k,v in bykey.items():
    if len(v)>1: res['sx_dup'].append({'t':k[0],'a':k[1],'idx':v})
pk={(p['title'],p['author']) for p in P}
for s in SX:
    if (s['t'],s['a']) not in pk: res['sx_orphan'].append({'t':s['t'],'a':s['a']})
for p in P:
    m=[SX[i] for i in bykey.get((p['title'],p['author']),[])]
    if not m: res['poem_no_sx'].append({'o':p['order'],'t':p['title'],'ke':p['ke']}); continue
    s=m[0]
    if p.get('sx')=='待补': res['sx_flag_stale'].append({'o':p['order'],'t':p['title']})
    for f in ('bg','ys'):
        if len(hz(s[f]))<15: res['short_'+f].append({'t':p['title'],f:s[f]})
    L=p['lines']; Z=s['zj']
    if len(L)!=len(Z): res['zj_count_mismatch'].append({'o':p['order'],'t':p['title'],'ke':p['ke'],'lines':len(L),'zj':len(Z)})
    full=hz(''.join(L))
    # 每条 zj 的原句前缀（——之前）
    pre=[z.split('——')[0] if '——' in z else None for z in Z]
    joined=hz(''.join(x for x in pre if x))
    if any(x is None for x in pre): res['zj_no_prefix'].append({'t':p['title'],'n':sum(x is None for x in pre)})
    if joined!=full:
        # 找出第一个差异
        import difflib
        sm=difflib.SequenceMatcher(None,full,joined)
        diffs=[(op,full[a:b],joined[c:d2]) for op,a,b,c,d2 in sm.get_opcodes() if op!='equal']
        res['zj_text_mismatch'].append({'o':p['order'],'t':p['title'],'ke':p['ke'],'diffs':diffs[:6]})
    for j,z in enumerate(Z):
        tr=z.split('——',1)[1] if '——' in z else z
        if len(hz(tr))<3: res['zj_empty_tr'].append({'t':p['title'],'zj':z})
        if re.search(r'待补|TODO|xxx|占位|……$|\.\.\.$',z): res['zj_placeholder'].append({'t':p['title'],'zj':z})
    for f in ('bg','ys'):
        if re.search(r'待补|TODO|占位|xxx',s[f]): res['placeholder'].append({'t':p['title'],f:s[f]})
        if not re.search(r'[。！？”」）]$',s[f].strip()): res['trunc_'+f].append({'t':p['title'],f:s[f][-30:]})
json.dump(res,open(T+'/scan_shangxi.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,len(v))
