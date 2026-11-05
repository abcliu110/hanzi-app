#!/usr/bin/env python3
"""F1 语法 第 6 批：讲解例子与规律不符、套用对外汉语材料（报告 §7）。幂等。
- 补语等条目：删去「（来源：AllSet Grammar Wiki）」等对外汉语出处标注（不是统编/黄廖），删掉不合小学语境的例句（iPad、小偷偷钱包、推倒老人、酒吧、智能手机…）。
- 偏正式：「双音节形容词的『的』一般不能省，不能说『漂亮书』」说得过死（聪明孩子、干净衣服都能说）→ 改为「多数要加」；「易错：是短语中数量最多的一种」不是易错点 → 改为定中/状中、的/地之分。
- 比喻：口诀「生动形象」不是口诀 → 改为可操作的口诀。
"""
import os, re, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_data, save_data, items, item

SRC = re.compile(r'（来源：[^）]*）')
BAD = ['iPad', '小偷', '推倒了一个老人', '酒吧', '智能手机', '旧手机', '撞倒了我的自行车', '扔掉了我的袜子', '打了我三下', '臭死了']


def clean(x):
    if isinstance(x, str): return SRC.sub('', x)
    if isinstance(x, list): return [clean(v) for v in x if not (isinstance(v, str) and any(b in v for b in BAD))]
    if isinstance(x, dict): return {k: clean(v) for k, v in x.items()}
    return x


def main():
    d, tail = load_data()
    before = json.dumps(d, ensure_ascii=False)
    for sec in d:
        for c in d[sec].get('categories', []):
            c['items'] = [clean(it) for it in c.get('items', [])]
    it = item(d, '偏正式', 'grammar')
    it['深讲'] = it['深讲'].replace('双音节形容词的“的”一般不能省：“漂亮的书”“高兴的人”（不能说“漂亮书”）；只有单音节形容词才可省（新书）。',
                                '单音节形容词作定语常常不加“的”（新书、红花）；双音节形容词作定语多数要加“的”（漂亮的书、高兴的人），但也有能直接组合的（聪明孩子、干净衣服）。')
    it['易错'] = '定中式的中心是名词，修饰语后用“的”；状中式的中心是动词或形容词，修饰语后用“地”，不要混'
    it = item(d, '比喻', 'grammar')
    it['口诀'] = '甲像乙，不同类；找本体、喻体、喻词'
    save_data(d, tail)
    return int(json.dumps(d, ensure_ascii=False) != before), len(SRC.findall(before))


if __name__ == '__main__':
    print(main())
