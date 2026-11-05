# 知识库扫描：python3 guwen_kn_scan.py （先 node guwen_load.js > /tmp/guwen_all.json）
import json,re,collections
d=json.load(open('/tmp/guwen_all.json'));K=d['kn']['categories']
alltext=''.join(t['原文'] for t in d['texts'])
H=collections.defaultdict(list);vals=collections.defaultdict(list)
for c in K:
    for it in c['items']:
        k=it['key']
        for f in ['讲解','口诀','深讲','辨析']:
            v=it.get(f)
            if isinstance(v,str) and v: vals[(f,v)].append(k)
        if it.get('怎么认'): vals[('怎么认','|'.join(it['怎么认']))].append(k)
        cls=it.get('分类') or []
        if cls and all(x.get('说明')==x.get('类') for x in cls): H['分类“说明”与“类”逐字相同（空洞）'].append((k,cls[0].get('类')))
        if cls and all(not x.get('例子') for x in cls): H['分类全部没有例句'].append((k,len(cls)))
        if c['id'] in ('shici','xuci','duoyi','tongjia','guyin','huoyong') and not it.get('例子'): H['实词/虚词/通假等条目无任何例句'].append((k,it.get('讲解','')[:30]))
        s=json.dumps([it.get(x) for x in it if x not in ('图示','key','level','difficulty')],ensure_ascii=False)
        if re.search(r'已删|初中可略|版本有分歧|待核|本应用|照搬|外链|可改编|不得下载',s): H['编辑/版权备注写进讲解内容'].append((k,re.findall(r'[^，。“”"]{0,12}(?:已删|初中可略|版本有分歧|待核|本应用|照搬|外链|可改编|不得下载)[^，。“”"]{0,12}',s)[:2]))
        if re.search(r'[A-Za-z]{3,}',s): H['混入英文'].append((k,re.findall(r'[A-Za-z]{3,}',s)[:3]))
for (f,v),ks in vals.items():
    if len(ks)>=5: H[f'模板套话（{f}，同一句≥5条复用）'].append((len(ks),v[:50],ks[:3]))
for c,v in sorted(H.items(),key=lambda x:-len(x[1])):
    tot=sum(x[0] for x in v) if c.startswith('模板') else len(v)
    print(f'## {c}: {len(v)} 组/条' + (f'（涉及 {tot} 条）' if c.startswith('模板') else ''))
    for x in sorted(v,key=lambda x:-x[0] if isinstance(x[0],int) else 0)[:8]: print('   ',x)
