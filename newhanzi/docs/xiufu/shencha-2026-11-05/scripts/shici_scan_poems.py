#!/usr/bin/env python3
"""诗库原文/元数据扫描：python3 scripts/shici_scan_poems.py -> tmp/scan_poems.json"""
import json,re,os,collections,unicodedata
T=os.path.join(os.path.dirname(__file__),'../tmp')
d=json.load(open(T+'/shici.json'));P=d['poems']
hz=lambda s:re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]','',s)
res=collections.defaultdict(list)
# 作者朝代一致
ad=collections.defaultdict(set)
for p in P: ad[p['author']].add(p['dynasty'])
res['author_multi_dynasty']=[[a,sorted(v)] for a,v in ad.items() if len(v)>1]
# poets 小传与库作者
res['author_no_bio']=sorted({p['author'] for p in P}-set(d['poets'])-set(d['stories']))
# 标题重复 / 同诗两版
tc=collections.Counter(re.sub(r'[（(·].*','',p['title']) for p in P)
res['title_base_dup']=[[t,[ (p['order'],p['title'],p['author'],p['ke']) for p in P if re.sub(r'[（(·].*','',p['title'])==t]] for t,c in tc.items() if c>1]
full={p['order']:hz(''.join(p['lines'])) for p in P}
for i,a in enumerate(P):
    for b in P[i+1:]:
        A,B=set(re.split(r'[，。！？；、]',''.join(a['lines'])))-{''},set(re.split(r'[，。！？；、]',''.join(b['lines'])))-{''}
        sh=A&B
        if len(sh)>=2: res['shared_lines'].append([a['title'],b['title'],sorted(sh)[:3]])
# 体裁与句长
for p in P:
    segs=[hz(x) for x in re.split(r'[，。！？；]',''.join(p['lines'])) if hz(x)]
    ls=collections.Counter(len(x) for x in segs)
    t=p['ticai']
    exp={'五绝':(5,4),'七绝':(7,4),'五律':(5,8),'七律':(7,8)}.get(t)
    if exp and (set(ls)!={exp[0]} or len(segs)!=exp[1]): res['ticai_mismatch'].append([p['order'],p['title'],t,dict(ls),len(segs)])
    txt=''.join(p['lines'])
    if not re.search(r'[。！？”」]$',txt): res['no_end_punct'].append([p['order'],p['title'],txt[-12:]])
    for l in p['lines']:
        if not hz(l): res['empty_line'].append([p['title'],l])
        if re.search(r'[A-Za-z0-9\[\]【】{}<>□�]',l): res['odd_char'].append([p['title'],l])
    for ch in txt:
        if ord(ch)>=0x20000 or 0x3400<=ord(ch)<0x4e00: res['rare_char'].append([p['order'],p['title'],ch,hex(ord(ch))])
    if re.search(r'[，。]{2}|，。|。，',txt): res['double_punct'].append([p['title'],txt])
    if p['ke']=='课内' and not p.get('srcUrl'): res['ke_no_srcurl'].append(p['title'])
# famous / imagery 引用
byo={p['order']:p for p in P}
for f in d['famous']:
    p=byo.get(f['order'])
    if not p or p['title']!=f['title'] or p['author']!=f['author']: res['famous_ref_bad'].append([f['title'],f['order'],p and p['title']])
    elif hz(f['line']) not in full[f['order']]: res['famous_line_not_in_poem'].append([f['title'],f['line']])
for im in d['imagery']:
    for o in im['poems']:
        if o not in byo: res['imagery_ref_bad'].append([im['zi'],o]); continue
        if im['zi'] not in full[o]: res['imagery_char_absent'].append([im['zi'],o,byo[o]['title']])
    if hz(im['line']) and not any(hz(im['line']) in v for v in full.values()): res['imagery_line_absent'].append([im['zi'],im['line']])
# shiju
S=json.load(open(T+'/shiju.json'))
for o,m in S['meta'].items():
    p=byo.get(int(o))
    if not p or p['title']!=m['t'] or p['author']!=m['a']: res['shiju_meta_bad'].append([o,m,p and p['title']])
for ch,os_ in S['idx'].items():
    for o in os_:
        if o not in full or ch not in full[o]: res['shiju_idx_bad'].append([ch,o])
json.dump(res,open(T+'/scan_poems.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,len(v))
