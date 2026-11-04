#!/usr/bin/env python3
"""古文分级（幂等）：
  guwen_knowledge.js 每个知识点加 level（小学 / 初高中拓展）、difficulty（入门 / 基础 / 提高）、
  以及 xiaoxue（命中的小学课内篇目与例句）。判定：知识点的例句/例句解析/讲解里出现小学课内文言原句
  （tools/content/xiaoxue_wenyan.json，连续≥4字或整句），或提到小学课内篇目名 → 小学；否则初高中拓展。
  difficulty：小学→入门；高考高频8虚词（之其而以于为者也）及诵读/翻译方法→基础；其余→提高。
  guwen.js：小学课内篇目加 ke/ce 字段；修正《两小儿辩日》原文脱漏。
运行：python3 tools/content/build_guwen_level.py"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'newhanzi/data')
TC = os.path.join(ROOT, 'tools/content')
W = json.load(open(os.path.join(TC, 'xiaoxue_wenyan.json'), encoding='utf8'))['texts']
hz = lambda s: re.sub(r'[^\u3400-\u9fff]', '', s)
CORPUS = [(w['t'], w['ce'], w['edition'], hz(w['text']), {hz(c) for c in re.split(r'[，。？！；：“”、]', w['text']) if hz(c)}) for w in W]
GAOPIN = set('之其而以于为者也')

p = os.path.join(D, 'guwen_knowledge.js')
src = open(p, encoding='utf8').read()
head, body = src.split('=', 1)
K = json.loads(body.strip().rstrip(';'))


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)
    elif isinstance(o, dict):
        for v in o.values():
            yield from strings(v)


def examples(it):
    ex = []
    for k in ('例子',):
        ex += [e for e in it.get(k, []) if isinstance(e, str)]
    for c in it.get('分类', []) or []:
        if isinstance(c, dict):
            ex += [e for e in c.get('例子', []) if isinstance(e, str)]
    for e in it.get('例句解析', []) or []:
        if isinstance(e, dict) and isinstance(e.get('句'), str):
            ex.append(e['句'])
    return ex


stat = {}
for cat in K['categories']:
    for it in cat['items']:
        hits = []
        for e in examples(it):
            for seg in re.split(r'[，。？！；：、]', e):
                h = hz(seg)
                for t, ce, ed, full, clauses in CORPUS:
                    if (len(h) >= 4 and h in full) or (len(h) >= 3 and h in clauses):
                        hits.append({'t': t, 'ce': ce, 'ex': e})
                        break
        blob = ''.join(s for k, v in it.items() if k not in ('图示',) for s in strings(v))
        for t, ce, ed, full, clauses in CORPUS:
            if ('《%s》' % t) in blob and not any(h['t'] == t for h in hits):
                hits.append({'t': t, 'ce': ce, 'ex': ''})
        seen, uniq = set(), []
        for h in hits:
            k = (h['t'], h['ex'])
            if k not in seen:
                seen.add(k); uniq.append(h)
        if uniq:
            it['level'] = '小学'
            it['difficulty'] = '入门'
            it['xiaoxue'] = uniq
        else:
            it['level'] = '初高中拓展'
            it.pop('xiaoxue', None)
            it['difficulty'] = '基础' if ((cat['id'] == 'xuci' and it['name'] in GAOPIN) or cat['id'] in ('songdu', 'fanyi')) else '提高'
        stat.setdefault(cat['name'], [0, 0])[0 if uniq else 1] += 1
K['levelNote'] = ('level：小学=例句或讲解涉及小学课内文言（司马光、守株待兔、精卫填海、王戎不取道旁李、囊萤夜读、铁杵成针、'
                  '古人谈读书、自相矛盾、杨氏之子、两小儿辩日、曹冲称象、学弈、伯牙鼓琴、书戴嵩画牛）；其余=初高中拓展。'
                  'xiaoxue 列出命中的课内篇目与例句，小学视图可只展示这些例句。由 tools/content/build_guwen_level.py 生成。')
open(p, 'w', encoding='utf8').write(head + '=' + json.dumps(K, ensure_ascii=False, separators=(',', ':')) + ';\n')

# ---- guwen.js ----
g = os.path.join(D, 'guwen.js')
s = open(g, encoding='utf8').read()
s = s.replace('一儿以日初出远，而日中时近也。', '一儿曰：“我以日初出远，而日中时近也。”')
KE = {'学弈': ("6下", "统编旧版六年级下册《文言文二则》"),
      '两小儿辩日': ("6上", "统编2024修订版六年级上册《文言文二则》（旧版在六年级下册）"),
      '伯牙鼓琴': ("6上", "统编旧版六年级上册；注意：课本选《吕氏春秋·本味》版本，本条为《列子·汤问》版本，原文不同"),
      '守株待兔': ("3下", "统编2024修订版三年级下册"),
      '道边李苦': ("4上", "统编2024修订版四年级上册，课题《王戎不取道旁李》")}
for t, (ce, basis) in KE.items():
    tag = "{title:'%s'," % t
    if tag in s and ("{title:'%s', ke:" % t) not in s:
        s = s.replace(tag, "{title:'%s', ke:'小学课内', ce:'%s', ceBasis:'%s'," % (t, ce, basis), 1)
open(g, 'w', encoding='utf8').write(s)
print({k: '小学%d/拓展%d' % tuple(v) for k, v in stat.items()})
