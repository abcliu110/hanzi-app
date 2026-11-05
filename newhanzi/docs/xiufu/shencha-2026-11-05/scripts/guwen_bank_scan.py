# 题库扫描：python3 guwen_bank_scan.py [--show N]   （先 node guwen_load.js > /tmp/guwen_all.json）
import json,re,collections,sys
d=json.load(open('/tmp/guwen_all.json'))
B=d['banks'];T=d['texts'];titles={t['title'] for t in T}
SHOW=int(sys.argv[sys.argv.index('--show')+1]) if '--show' in sys.argv else 6
hits=collections.defaultdict(list)
def add(cat,bank,i,q,note=''): hits[cat].append((bank,i,q['q'][:60].replace('\n',' '),q['options'][q['answer']] if 0<=q['answer']<len(q['options']) else None,note))
# 义项表：从选义项/选词题的解析回收每个字的全部义项
senses=collections.defaultdict(set)
for k,b in B.items():
    for q in b['questions']:
        m=re.match(r'“(.+?)”可以表示(.+?)。$',q.get('解析',''))
        if m: senses[m.group(1)].add(m.group(2))
        m=re.match(r'“(.+?)”的义项有：(.+)$',q.get('解析',''))
        if m:
            for s in m.group(2).split('；'): senses[m.group(1)].add(s.strip())
stems=collections.defaultdict(list)
for k,b in B.items():
    if b.get('total')!=len(b['questions']): hits['total 与题数不符'].append((k,'-',f"total={b.get('total')} 实际={len(b['questions'])}",None,''))
    for i,q in enumerate(b['questions']):
        o=q['options'];a=q['answer'];ex=q.get('解析','')
        if not (isinstance(a,int) and 0<=a<len(o)): add('答案越界',k,i,q);continue
        if len(set(o))<len(o): add('选项重复',k,i,q,str(o))
        ans=o[a]
        if any(not x.strip() for x in o) or not ex.strip(): add('空选项/空解析',k,i,q)
        if re.search(r'[A-Za-z]{2,}',q['q']+''.join(o)+ex): add('混入英文',k,i,q,re.findall(r'[A-Za-z]+',q['q']+''.join(o))[:4])
        if re.search(r'(古义|今义)是(古义|今义)：',ex+''.join(o)): add('模板拼接：古义是古义：',k,i,q)
        if re.search(r'可以表示“所以”|可以表示(介词|连词|代词|动词|助词|兼词|副词|疑问代词|判断)',''.join(o)+ex): add('模板拼接：可以表示+词性',k,i,q)
        if re.search(r'外链|嵌入|翻录|CC BY|MIT|UP主|照搬|改编|不与.*混排|单元|底本|字表',q['q']+''.join(o)): add('开发/版权备注进入题目',k,i,q)
        # 无语境义项题
        m=re.match(r'“(.+?)”可以表示什么意思？$',q['q'])
        if m:
            w=m.group(1); other=[x for j,x in enumerate(o) if j!=a and x in senses[w]]
            if other: add('多个正确答案：干扰项也是该字义项',k,i,q,f'另真义项={other}')
        m=re.match(r'下面关于“(.+?)”的说法，正确的是？$',q['q'])
        if m and q.get('类')=='正误判断':
            w=m.group(1);mm=[x for j,x in enumerate(o) if j!=a and re.match(rf'“{re.escape(w)}”可以表示(.+?)。$',x) and re.match(rf'“{re.escape(w)}”可以表示(.+?)。$',x).group(1) in senses[w]]
            if mm: add('多个正确答案：干扰项也是该字义项',k,i,q,f'另真={mm}')
        m=re.match(r'哪个字可以表示“(.+?)”的意思？$',q['q'])
        if m:
            s=m.group(1); other=[x for j,x in enumerate(o) if j!=a and s in senses[x]]
            if other: add('多个正确答案：选词题其他字也有此义',k,i,q,f'{other}')
        # 解析与答案
        core=re.sub(r'^(古义|今义)：','',ans).strip('“”。')
        if q.get('类') in ('选义项','选古义','选今义','选内容','选本字','选词','选例词') and core[:6] not in ex: add('解析不含答案',k,i,q,ex[:50])
        # 出处
        m=re.match(r'“(.+?)”出自哪篇？',q['q'])
        if m:
            src=re.sub(r'^.*[·《]','',ans).strip('》')
            if not any(t in ans for t in titles): add('出处篇目不在 guwen.js（学生点不到原文）',k,i,q,ans)
        stems[(q['q'],ans)].append((k,i))
        stems[('Q',q['q'])].append((k,i,ans))
# 同题干重复
for key,v in stems.items():
    if key[0]=='Q' and len(v)>1:
        ans=set(x[2] for x in v)
        cat='同题干不同答案（无语境，题干相同答案不同）' if len(ans)>1 else '完全重复题'
        hits[cat].append((v[0][0],v[0][1],key[1][:60].replace('\n',' '),'/'.join(list(ans)[:4]),f'{len(v)}次 {[x[0] for x in v][:3]}'))
for c,v in sorted(hits.items(),key=lambda x:-len(x[1])):
    print(f'## {c}: {len(v)}')
    for x in v[:SHOW]: print('   ',x)
