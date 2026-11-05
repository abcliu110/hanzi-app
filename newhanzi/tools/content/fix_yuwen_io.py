#!/usr/bin/env python3
"""F1 语法修复线：语法题库 quiz_bank_*.js 读写（往返字节一致）。
用法：
  from fix_yuwen_io import load_bank, save_bank, bank_files
  name, d, fn = load_bank('ruguo_jiu')   # d = {"point","total","types","questions"}
  save_bank(fn, name, d)                  # 自动重算 total/types
"""
import json, os, re, glob
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
YW = os.path.join(ROOT, 'yuwen')
PAT = re.compile(r'window\.NHZ_GRAMMAR_BANK\[(".*?")\]\s*=\s*(.*);\s*$', re.S)
HEAD = 'window.NHZ_GRAMMAR_BANK = window.NHZ_GRAMMAR_BANK || {};\n'

def bank_files():
    return [p for p in sorted(glob.glob(os.path.join(YW, 'quiz_bank_*.js'))) if not p.endswith('quiz_bank_index.js')]

def path_of(key):
    return key if os.path.isabs(key) else os.path.join(YW, 'quiz_bank_%s.js' % key)

def load_bank(key):
    fn = path_of(key)
    txt = open(fn, encoding='utf-8').read()
    m = PAT.search(txt)
    if not m:
        m2 = re.match(r'window\.NHZ_GRAMMAR_BANK\s*=\s*(\{.*\});(\s*)$', txt, re.S)
        if not m2: raise ValueError('unsupported format ' + fn)
        whole = json.loads(m2.group(1)); assert len(whole) == 1
        name, d = next(iter(whole.items()))
        _OLD[fn] = m2.group(2)
        return name, d, fn
    d = json.loads(m.group(2))
    _SEP[fn] = txt[len(HEAD.rstrip('\n')):m.start()]
    _TAIL[fn] = txt[m.end(2):]
    return json.loads(m.group(1)), d, fn

_SEP, _TAIL, _OLD = {}, {}, {}

def dump(name, d, fn=None):
    if fn in _OLD:
        return 'window.NHZ_GRAMMAR_BANK = ' + json.dumps({name: d}, ensure_ascii=False, separators=(',', ':')) + ';' + _OLD[fn]
    sep = _SEP.get(fn, '\n'); tail = _TAIL.get(fn, ';\n')
    return HEAD.rstrip('\n') + sep + 'window.NHZ_GRAMMAR_BANK[%s] = %s' % (json.dumps(name, ensure_ascii=False), json.dumps(d, ensure_ascii=False, separators=(',', ':'))) + tail

def type_of(d, i):
    """题目按 types 顺序分块排列；返回第 i 题所属题型名（无 types 返回 None）。"""
    acc = 0
    for k, v in (d.get('types') or {}).items():
        acc += v
        if i < acc: return k
    return None

def delete_questions(d, idxs):
    """删除题目并同步 types 分块计数。"""
    idxs = sorted(set(idxs))
    for i in idxs:
        t = type_of(d, i)
        if t: d['_dec'] = d.get('_dec', {}); d['_dec'][t] = d['_dec'].get(t, 0) + 1
    keep = set(range(len(d['questions']))) - set(idxs)
    d['questions'] = [q for j, q in enumerate(d['questions']) if j in keep]
    for t, n in d.pop('_dec', {}).items():
        d['types'][t] -= n
        if d['types'][t] <= 0: del d['types'][t]
    return d

def recount(d):
    d['total'] = len(d['questions'])
    return d

def save_bank(fn, name, d, recount_total=True):
    if recount_total: recount(d)
    open(fn, 'w', encoding='utf-8').write(dump(name, d, fn))


# ---------- yuwen/data.js（讲解库，单行 JSON） ----------
DATA = os.path.join(YW, 'data.js')
_DPRE = 'window.NHZ_YUWEN ='

def load_data():
    s = open(DATA, encoding='utf-8').read()
    assert s.startswith(_DPRE)
    body = s[len(_DPRE):]
    tail = body[len(body.rstrip().rstrip(';')):]
    return json.loads(body.rstrip().rstrip(';')), tail

def save_data(d, tail=';'):
    open(DATA, 'w', encoding='utf-8').write(_DPRE + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + tail)

def items(d, sec=None):
    """遍历讲解条目：yield (sec, category, item)"""
    for s in ([sec] if sec else d):
        for c in d[s].get('categories', []):
            for it in c.get('items', []):
                yield s, c, it

def item(d, name, sec=None):
    r = [it for s, c, it in items(d, sec) if it.get('name') == name]
    assert len(r) == 1, (name, len(r))
    return r[0]
