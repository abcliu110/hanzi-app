#!/usr/bin/env python3
"""适龄性粗筛：原文/赏析含饮酒、杀戮、男女情爱、死亡等关键词的篇目，及非课内篇目里的生僻字。
python3 scripts/shici_scan_age.py -> tmp/scan_age.json"""
import json,re,os,collections
T=os.path.join(os.path.dirname(__file__),'../tmp')
P=json.load(open(T+'/shici.json'))['poems'];SX={(s['t'],s['a']):s for s in json.load(open(T+'/shangxi.json'))}
KW={'酒':r'酒|醉|饮|樽|杯','杀戮':r'杀人|吮血|白骨|尸|斩|血','情爱':r'相思|爱情|前妻|情人|意中人|闺|妾|郎|欢|罗衾|红酥手','死':r'死|坟|亡'}
res=collections.defaultdict(list)
for p in P:
    txt=''.join(p['lines']); s=SX.get((p['title'],p['author']),{})
    hit={k:len(re.findall(v,txt+s.get('bg','')+s.get('ys',''))) for k,v in KW.items()}
    hit={k:v for k,v in hit.items() if v}
    if hit: res['kw'].append([p['order'],p['title'],p['ke'],hit])
json.dump(res,open(T+'/scan_age.json','w'),ensure_ascii=False,indent=1)
c=collections.Counter((x[2],k) for x in res['kw'] for k in x[3]); print(c)
