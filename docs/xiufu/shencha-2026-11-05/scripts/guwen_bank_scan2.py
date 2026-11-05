# 题库补充扫描：编辑备注泄漏、引号错、汇总归属多解、篇目题干扰项出现在原文、“关于X哪项正确”全真陈述、测验页与题库一致性
# python3 guwen_bank_scan2.py   （先 node guwen_load.js > /tmp/guwen_all.json）
import json,re,collections
d=json.load(open('/tmp/guwen_all.json'));B=d['banks']
X=json.load(open('/workspace/work/hanzi-audit/snap/tools/content/xiaoxue_wenyan.json'))['texts']
texts={t['title']:t['原文'] for t in d['texts']}
for t in X: texts.setdefault(t.get('title') or t.get('题目',''),t.get('原文') or t.get('text',''))
texts['王戎不取道旁李']=texts.get('道边李苦','')
H=collections.defaultdict(list)
def add(c,k,i,q,n=''): H[c].append((k,i,q['q'][:50].replace('\n',' '),q['options'][q['answer']][:40],n))
# 汇总名单
members={}
for c in d['kn']['categories']:
    for it in c['items']: members.setdefault(it['name'],set()).add(c['id'])
zmap={'虚词（18）':'xuci','实词（120）':'shici','通假（16）':'tongjia','古今异义（16）':'guyin','一词多义（12）':'duoyi','词类活用（按类型）':'huoyong','篇目高频字（核心池）':'gaopinci'}
for k,b in B.items():
    for i,q in enumerate(b['questions']):
        o=q['options'];a=q['answer'];allt=q['q']+'|'.join(o)+q['解析']
        if re.search(r'已删|初中可略|版本有分歧|语境义|待核|待定|本应用',allt): add('编辑备注进入题面/选项',k,i,q,re.findall(r'（[^）]*(?:已删|可略|分歧|语境义|待)[^）]*）|本应用[^，。]*',allt)[:2])
        if '““' in allt or '””' in allt: add('引号嵌套错误 ““…””',k,i,q)
        m=re.match(r'“(.+?)”属于哪一类汇总？',q['q'])
        if m:
            w=m.group(1);cats=members.get(w,set())
            alt=[x for j,x in enumerate(o) if j!=a and zmap.get(x) in cats]
            if alt: add('多个正确答案：汇总归属',k,i,q,f'“{w}”也在 {alt}')
        m=re.match(r'下面哪一项属于“(.+?)”？',q['q'])
        if m and k.startswith('gaopinci:'):
            ti=m.group(1);src=texts.get(ti) or texts.get(ti.split('·')[-1],'')
            if src:
                alt=[x for j,x in enumerate(o) if j!=a and x in src]
                if alt: add('多个正确答案：篇目题干扰项也在该篇原文',k,i,q,f'{alt} 也在《{ti}》原文')
        if re.match(r'(关于“.+?”，下面哪一项正确？|下面关于“.+?”的说法，正确的是？)$',q['q']) and k.split(':')[0] in ('fanyi','lishi','meiti','songdu','wenhua','wenxue','yufa','gaopinci'):
            # 选项均为孤立真陈述（不含“X：”前缀）→ 实为“哪条属于X”，题干问“正确”不可答
            if sum(1 for x in o if not x.startswith('“'))>=3: add('题干问“正确”但各选项都是真陈述（实为归属题）',k,i,q)
        m=re.match(r'下面关于“(.+?)”的说法，正确的是？',q['q'])
        if m and k.startswith('gaopinci:'):
            labs=[re.sub(r'^“.+?”：','',x) for x in o]
            if sum(1 for x in labs if x.startswith('小学'))>=2: add('多个正确答案：学段标签',k,i,q,str(labs))
# 测验页 vs 题库
qq=d['quiz']['modes']['choice'];bq=[(q['q'],tuple(q['options']),q['answer']) for b in B.values() for q in b['questions']]
qs=[(q['q'],tuple(q['opts']),q['a']) for q in qq]
H['测验页与题库不一致(条)']=[('quiz/data_guwen.js',len(qs),len(bq),len(set(qs)-set(bq)),'')] if set(qs)!=set(bq) else []
print('quiz==bank:',set(qs)==set(bq),len(qs),len(bq))
for c,v in sorted(H.items(),key=lambda x:-len(x[1])):
    print(f'## {c}: {len(v)}')
    for x in v[:8]: print('   ',x)
