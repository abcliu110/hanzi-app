# 每个题库随机抽 N 题供人工核对：python3 guwen_sample.py [N] [seed]
import json,random,sys,collections
d=json.load(open('/tmp/guwen_all.json'));N=int(sys.argv[1]) if len(sys.argv)>1 else 10;random.seed(int(sys.argv[2]) if len(sys.argv)>2 else 20261105)
by=collections.defaultdict(list)
for k,b in d['banks'].items():
    for i,q in enumerate(b['questions']): by[k.split(':')[0]].append((k,i,q))
for lib,qs in sorted(by.items()):
    print('=====',lib,len(qs))
    for k,i,q in random.sample(qs,min(N,len(qs))):
        print(f"[{k}#{i}] {q['q']!r} {q['options']} => {q['options'][q['answer']]} | {q['解析'][:80]}")
