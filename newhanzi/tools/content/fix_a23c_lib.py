"""A23C 误解标注脚本共用：读写 quiz/data_*.js（window.NHZ_QUIZ = {...}; 单行 JSON）。
写回时若原文件能被 json.dumps 原样复现，则整体重写；否则只替换被改动题目的原 JSON 片段。"""
import json, re, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')

def path(name):
    return os.path.join(ROOT, 'quiz', 'data_%s.js' % name)

def load(name):
    s = open(path(name), encoding='utf8').read()
    m = re.match(r'(window\.NHZ_QUIZ\s*=\s*)(.*?)(;?\s*)$', s, re.S)
    return s, m, json.loads(m.group(2))

def dumps(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':'))

def save(name, s, m, obj, changed_pairs):
    """changed_pairs: [(old_q_json, new_q_obj)]，用于不能整体复现的文件。"""
    if not changed_pairs:
        return False
    if m.group(1) + dumps(json.loads(m.group(2))) + m.group(3) == s:
        out = m.group(1) + dumps(obj) + m.group(3)
    else:
        out = s
        for old, new in changed_pairs:
            assert out.count(old) == 1, 'fragment not unique'
            out = out.replace(old, dumps(new))
    open(path(name), 'w', encoding='utf8').write(out)
    return True
