# 篇目数据扫描：python3 guwen_texts_scan.py  （先 node guwen_load.js > /tmp/guwen_all.json）
import json,re,collections
d=json.load(open('/tmp/guwen_all.json'))
T=d['texts']
def sents(s): return [x for x in re.split(r'[。？！；]+[”’]?',s) if x.strip('”’“‘ ')]
out=collections.defaultdict(list)
for i,t in enumerate(T):
    ti=t['title']
    for k in ['title','author','source','cat','原文','导读','译意','重点']:
        if not t.get(k): out['空字段'].append((ti,k))
    o,y=t['原文'],t['译意']
    no,ny=len(sents(o)),len(sents(y))
    r=len(y)/max(1,len(o))
    if abs(no-ny)>=2 or r<1.0 or r>3.2: out['句数/长度不对应'].append((ti,f'原文{no}句{len(o)}字 译意{ny}句{len(y)}字 比{r:.2f}'))
    for w,m in t['重点']:
        if w not in o: out['注释词不在原文'].append((ti,w,m))
        if not m.strip(): out['注释空'].append((ti,w))
    for k in ['原文','导读','译意']:
        s=t[k]
        if re.search(r'[A-Za-z]',s): out['混入英文'].append((ti,k,re.findall(r'[A-Za-z]+',s)))
        if not re.search(r'[。？！”…）)]$',s.strip()): out['疑似截断'].append((ti,k,s[-15:]))
        if re.search(r'TODO|待补|XXX|占位|\?\?',s): out['占位'].append((ti,k))
    # 引号配对
    for k in ['原文','译意']:
        s=t[k]
        if s.count('“')!=s.count('”'): out['引号不配对'].append((ti,k,s.count('“'),s.count('”')))
    if '（节选）' in ti and '节选' not in t['source']: pass
for k,v in out.items():
    print(f'## {k}: {len(v)}')
    for x in v: print('  ',x)
