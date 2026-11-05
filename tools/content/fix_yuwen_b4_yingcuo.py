#!/usr/bin/env python3
"""F1 语法 第 4 批：答案/讲解硬错（报告 yuwen.md §6）。幂等，可重复运行；每个子问题一个函数，按需单独跑：
  python3 fix_yuwen_b4_yingcuo.py zuo pingguo ...
依据：《现代汉语词典》（第7版）注音；黄伯荣、廖序东《现代汉语》（增订六版）语法、修辞章。
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, save_data, item, items, ROOT


def zuo():
    """做/作：《现代汉语词典》作息 zuòxī；zuō 只用于作坊、作揖、作死等少数口语词。"""
    d, tail = load_data()
    it = item(d, '做/作', 'grammar')
    it['怎么认'] = [x if 'zuō' not in x else '「作」有两个读音：大多数词读 zuò（作息、作文、工作），只有「作坊」「作揖」等少数词读 zuō。' for x in it['怎么认']]
    it['易错'] = '“作息”读 zuò xī，不读 zuō；读 zuō 的是“作坊”“作揖”等少数词'
    n = 0
    for p in it['练习']:
        if p['q'] == '“作息”读？':
            p.update({'answer': 0, '解析': '作息的「作」读 zuò（《现代汉语词典》：作息 zuòxī）。读 zuō 的是「作坊」等少数词。'}); n += 1
    save_data(d, tail)
    return n


def pingguo():
    """「苹果红着脸笑了」是拟人（苹果像人一样「红着脸」「笑」），不是借喻 → 比喻库换成借喻句「一群花朵走进了教室」（以花朵代孩子，本体不出现）。"""
    name, d, fn = load_bank('biyu')
    n = 0
    for q in d['questions']:
        s = json.dumps(q, ensure_ascii=False)
        if '苹果红着脸笑了' in s:
            q2 = json.loads(s.replace('苹果红着脸笑了', '一群花朵走进了教室'))
            assert len(set(q2['options'])) == len(q2['options'])
            q.clear(); q.update(q2); n += 1
    save_bank(fn, name, d)
    return n


if __name__ == '__main__':
    for a in sys.argv[1:]:
        print(a, globals()[a]())
