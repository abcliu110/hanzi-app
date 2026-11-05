import re,json,sys
CJK=re.compile(r'^[\u3400-\u9fff]$')
CJKS=re.compile(r'^[\u3400-\u9fff]+$')
LABEL=re.compile(r'^(语文园地[一二三四五六七八]?|识字|阅读|课文|汉语拼音|习作|单元|我上学了|识字表|写字表|认字表)$')
def sections(txt):
    lines=txt.split('\n')
    # locate headings
    idx={}
    for i,l in enumerate(lines):
        s=re.sub(r'\s+','',l)
        if s in('识字表','认字表') : idx.setdefault('shi',[]).append(i)
        if s=='写字表': idx.setdefault('xie',[]).append(i)
    return lines,idx
def grab(lines,start):
    chars=[];order=[]
    for l in lines[start+1:]:
        s=l.strip()
        if re.search(r'（共\s*\d+\s*个',s):
            total=int(re.search(r'(\d+)',s).group(1)); return order,total
        if '①' in s or '②' in s: continue
        if s in ('统','编','版','统编','编版'): continue
        if re.sub(r'\s+','',s) in ('写字表','识字表','词语表','笔画名称表'): return order,None
        for tok in s.split():
            if LABEL.match(tok): continue
            if CJKS.match(tok): order.extend(list(tok))
    return order,None
out={}
for k in sys.argv[1:]:
    txt=open(k+'.txt',encoding='utf8').read()
    lines,idx=sections(txt)
    res={}
    for kind in ('shi','xie'):
        if kind not in idx: continue
        st=idx[kind][-1]  # last occurrence = appendix (first is TOC)
        order,total=grab(lines,st)
        uniq=list(dict.fromkeys(order))
        res[kind]=dict(chars=''.join(uniq),n=len(uniq),raw=len(order),stated=total)
        print(k,kind,'uniq',len(uniq),'raw',len(order),'stated',total)
    out[k]=res
json.dump(out,open('/workspace/work/content-src/zibiao_parsed.json','w'),ensure_ascii=False,indent=1)
