#!/usr/bin/env python3
"""题库 quiz/data_shici.js 与诗文一致性扫描：python3 scripts/shici_scan_quiz.py -> tmp/scan_quiz.json"""
import json,re,os,collections
T=os.path.join(os.path.dirname(__file__),'../tmp')
d=json.load(open(T+'/shici.json'));P=d['poems'];Q=json.load(open(T+'/quiz.json'))['modes']
F=json.load(open(T+'/feihua.json'))['POEMS']
hz=lambda s:re.sub(r'[^\u3400-\u9fff\U00020000-\U0002ffff]','',s)
corp={}  # 句 -> (title,author,src)
seq={}
for p in P:
    segs=[hz(x) for x in re.split(r'[，。！？；、：]',''.join(p['lines'])) if hz(x)]
    seq[('S',p['title'],p['author'])]=segs
    for x in segs: corp.setdefault(x,[]).append(('shici',p['title'],p['author']))
for p in F:
    segs=[hz(x) for x in p['lines'] for x in re.split(r'[，。！？；、：]',x) if hz(x)]
    seq[('F',p['t'],p['a'])]=segs
    for x in segs: corp.setdefault(x,[]).append(('feihua',p['t'],p['a']))
allS=''.join('|'.join(v) for v in seq.values())
inS=lambda s: hz(s) in allS.replace('|','') if s else True
inS_strict=lambda s: all(hz(x) in corp for x in re.split(r'[，。！？；、：]',s) if hz(x))
res=collections.defaultdict(list)
for i,x in enumerate(Q['choice']):
    o=x['opts']
    if len(set(o))!=len(o): res['choice_dup_opt'].append([i,x['q'],o])
    if not (0<=x['a']<len(o)): res['choice_bad_a'].append([i,x['q']])
    for m in re.findall(r'「(.*?)」',x['q']):
        if not inS_strict(m): res['choice_quote_absent'].append([i,m,x['q']])
    # 作者核对
    mm=re.match(r'「(.*?)」是谁写的',x['q'])
    if mm:
        src=corp.get(hz(re.split(r'[，。！？；]',mm.group(1))[0]),[])
        auth={a for _,_,a in src}
        if auth and o[x['a']] not in auth: res['choice_author_conflict'].append([i,x['q'],o[x['a']],sorted(auth)])
    mm=re.match(r'「(.*?)」出自哪一首',x['q'])
    if mm:
        src=corp.get(hz(re.split(r'[，。！？；]',mm.group(1))[0]),[])
        ts={re.sub(r'[（(·\s].*','',t) for _,t,_ in src}
        ans=re.sub(r'[《》（(·\s].*','',o[x['a']].strip('《》'))
        if ts and not any(ans and (ans in t or t in ans) for t in ts): res['choice_title_conflict'].append([i,x['q'],o[x['a']],sorted(ts)])
        # 其他选项也可能正确
        for j,op in enumerate(o):
            if j!=x['a'] and any(re.sub(r'[《》]','',op).startswith(t) for t in ts if t): res['choice_multi_correct'].append([i,x['q'],op])
    if '误解标注' in x:
        for m in x['误解标注']:
            L='ABCD'.index(m['选项']) if m['选项'] in 'ABCD' else -1
            if L==x['a']: res['wujie_on_correct'].append([i,x['q'],m])
            if L>=0 and L<len(o) and o[L]!=m['选项文本']: res['wujie_text_mismatch'].append([i,x['q'],m['选项'],m['选项文本'],o[L]])
for i,x in enumerate(Q['blank']):
    o=x['opts']
    if len(set(o))!=len(o): res['blank_dup_opt'].append([i,x['s'],o])
    filled=x['s'].replace('___',o[x['a']])
    if not inS_strict(filled): res['blank_not_in_corpus'].append([i,filled,x['exp'][:60]])
    for j,op in enumerate(o):
        if j!=x['a'] and inS_strict(x['s'].replace('___',op)): res['blank_multi_correct'].append([i,x['s'],op])
for i,x in enumerate(Q['spot']):
    if not inS_strict(x['fix']): res['spot_fix_absent'].append([i,x['fix']])
    if inS_strict(x['s']): res['spot_wrong_is_real'].append([i,x['s']])
    o=x['opts']; w=o[x['a']]
    if w not in x['s']: res['spot_opt_not_in_s'].append([i,x['s'],w])
    for j,op in enumerate(o):
        if j!=x['a'] and op not in x['s']: res['spot_distractor_absent'].append([i,x['s'],op])
    if len(set(o))!=len(o): res['spot_dup_opt'].append([i,o])
for i,x in enumerate(Q['rewrite']):
    a=hz(x['from']); b=hz(x['opts'][x['a']])
    ok=any(a in v and v.index(a)+1<len(v) and v[v.index(a)+1]==b for v in seq.values())
    if not ok: res['rewrite_pair_absent'].append([i,x['from'],x['opts'][x['a']]])
    for j,op in enumerate(x['opts']):
        if j!=x['a'] and any(a in v and v.index(a)+1<len(v) and v[v.index(a)+1]==hz(op) for v in seq.values()): res['rewrite_multi'].append([i,x['from'],op])
    if len(set(x['opts']))!=4: res['rewrite_dup'].append([i,x['opts']])
for i,x in enumerate(Q['order']):
    segs=[hz(s) for s in re.split(r'[，。！？；]',x['answer']) if hz(s)]
    if sorted(segs)!=sorted(hz(s) for s in x['items']): res['order_items_mismatch'].append([i,x['prompt']])
    if not any(''.join(segs) in ''.join(v) for v in seq.values()): res['order_not_in_corpus'].append([i,x['prompt'],x['answer']])
    if len(set(x['items']))!=len(x['items']): res['order_dup_items'].append([i,x['items']])
# 所有 exp/q 中的书名号篇名在库内？
titles={re.sub(r'[（(·\s].*','',p['title']) for p in P}|{re.sub(r'[（(·\s].*','',p['t']) for p in F}
for k,L in Q.items():
    for i,x in enumerate(L):
        s=json.dumps(x,ensure_ascii=False)
        for t in re.findall(r'《(.*?)》',s):
            if '”' in t or '"' in t or ' ' in t: res['title_garbled'].append([k,i,t])
json.dump(res,open(T+'/scan_quiz.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,len(v))
