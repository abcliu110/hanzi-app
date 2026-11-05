#!/usr/bin/env python3
"""F2 古文修复线公用读写（往返字节一致）。
  banks：newhanzi/guwen/quiz_bank_guwen_<mid>.js，每行 window.NHZ_GUWEN_BANK["key"] = {json};
  quiz ：newhanzi/quiz/data_guwen.js = 15 个题库按文件名/行顺序拼接（options→opts, answer→a, 解析→exp）
  kn   ：newhanzi/data/guwen_knowledge.js（单行 JSON）
用法：from fix_guwen_io import *；B=load_banks(); ...; save_banks(B)（自动重建 data_guwen.js 并重算 total/types）"""
import json, os, re, glob
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NH = os.path.join(ROOT, 'newhanzi')
HEAD = 'window.NHZ_GUWEN_BANK = window.NHZ_GUWEN_BANK || {};'
LINE = re.compile(r'^window\.NHZ_GUWEN_BANK\["(.+?)"\] = (.*);$')

def bank_files():
    return sorted(glob.glob(os.path.join(NH, 'guwen', 'quiz_bank_guwen_*.js')))

def mid_of(f):
    return os.path.basename(f)[len('quiz_bank_guwen_'):-3]

def load_banks():
    """返回 {mid: [(key, obj), ...]}（保持顺序）"""
    B = {}
    for f in bank_files():
        lines = open(f, encoding='utf8').read().split('\n')
        assert lines[0] == HEAD, f
        pts = []
        for ln in lines[1:]:
            if not ln: continue
            m = LINE.match(ln); assert m, (f, ln[:80])
            pts.append((m.group(1), json.loads(m.group(2))))
        B[mid_of(f)] = pts
    return B

def dump_bank_line(k, o):
    return 'window.NHZ_GUWEN_BANK["%s"] = %s;' % (k, json.dumps(o, ensure_ascii=False, separators=(',', ':')))

def _recount(o):
    qs = o['questions']
    o['total'] = len(qs)
    if 'types' in o:
        t = {}
        for q in qs:
            t[q.get('类', '')] = t.get(q.get('类', ''), 0) + 1
        # 保持原 key 顺序，删掉清零项，追加新类
        nt = {k: t[k] for k in o['types'] if k in t}
        for k in t:
            if k not in nt: nt[k] = t[k]
        o['types'] = nt

def save_banks(B, recount=True):
    for mid, pts in B.items():
        f = os.path.join(NH, 'guwen', 'quiz_bank_guwen_%s.js' % mid)
        out = [HEAD]
        for k, o in pts:
            if recount: _recount(o)
            if not o['questions']: continue   # 题全删光的点不再出题
            out.append(dump_bank_line(k, o))
        open(f, 'w', encoding='utf8').write('\n'.join(out) + '\n')
    save_quiz(B)

QP = os.path.join(NH, 'quiz', 'data_guwen.js')
def load_quiz():
    s = open(QP, encoding='utf8').read()
    assert s.startswith('window.NHZ_QUIZ=')
    body = s[len('window.NHZ_QUIZ='):]
    end = ';\n' if body.endswith(';\n') else (';' if body.endswith(';') else ('\n' if body.endswith('\n') else ''))
    return json.loads(body[:len(body)-len(end)]), end

def quiz_from_banks(B):
    ch = []
    for mid in sorted(B):
        for k, o in B[mid]:
            for q in o['questions']:
                it = {'q': q['q'], 'opts': q['options'], 'a': q['answer'], 'exp': q.get('解析', '')}
                for extra in ('mis', 'misconception', '误解'):
                    if extra in q: it[extra] = q[extra]
                ch.append(it)
    return ch

def save_quiz(B):
    Q, end = load_quiz()
    Q['modes']['choice'] = quiz_from_banks(B)
    open(QP, 'w', encoding='utf8').write('window.NHZ_QUIZ=' + json.dumps(Q, ensure_ascii=False) + end)

KP = os.path.join(NH, 'data', 'guwen_knowledge.js')
def load_kn():
    s = open(KP, encoding='utf8').read()
    head, body = s.split('=', 1)
    tail = body[len(body.rstrip().rstrip(';')):]
    return head, json.loads(body.strip().rstrip(';')), tail

def save_kn(head, K, tail, compact=True):
    sep = (',', ':') if compact else None
    open(KP, 'w', encoding='utf8').write(head + '=' + json.dumps(K, ensure_ascii=False, separators=sep) + tail)

def iter_q(B):
    for mid, pts in B.items():
        for k, o in pts:
            for i, q in enumerate(o['questions']):
                yield mid, k, i, q

def kn_items(K):
    for cat in K['categories']:
        for it in cat['items']:
            yield it

def kn_item(K, key):
    for it in kn_items(K):
        if it['key'] == key: return it

def kn_questions(K):
    """知识库「练习」里的题（是题库前几题的副本）：yield (item, list, idx, q)"""
    for it in kn_items(K):
        for i, q in enumerate(it.get('练习', []) or []):
            yield it, it['练习'], i, q

def all_q(B, K):
    """题库 + 知识库练习里的每道题（dict，可原地改）"""
    for mid, k, i, q in iter_q(B): yield k, q
    for it, lst, i, q in kn_questions(K): yield it['key'], q

def drop_q(B, K, pred):
    """删除满足 pred(key, q) 的题（题库与知识库练习同步）；返回删除数（题库）"""
    n = 0
    for mid, pts in B.items():
        for k, o in pts:
            keep = [q for q in o['questions'] if not pred(k, q)]
            n += len(o['questions']) - len(keep); o['questions'] = keep
    for it in kn_items(K):
        if it.get('练习'):
            it['练习'] = [q for q in it['练习'] if not pred(it['key'], q)]
    return n

def find_point(B, key):
    for mid, pts in B.items():
        for k, o in pts:
            if k == key: return o
