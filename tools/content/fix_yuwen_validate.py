#!/usr/bin/env python3
"""F1 语法线自检（playwright 跑不了时的替代）：题库 answer 在范围内、选项不重复、types 合计 = total = 题数。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import bank_files, load_bank
bad = 0
for fn in bank_files():
    name, d, _ = load_bank(fn)
    qs = d['questions']
    if d.get('total') != len(qs): bad += 1; print('total', name, d.get('total'), len(qs))
    if d.get('types') and sum(d['types'].values()) != len(qs): bad += 1; print('types', name)
    for i, q in enumerate(qs):
        if not (0 <= q['answer'] < len(q['options'])): bad += 1; print('answer', name, i)
        if len(set(q['options'])) != len(q['options']): bad += 1; print('dup', name, i, q['options'])
print('bad', bad); sys.exit(1 if bad else 0)
