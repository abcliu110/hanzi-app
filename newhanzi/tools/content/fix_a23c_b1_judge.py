"""A23C 批1：语法判断题「“我没有他高”等于“我比他矮”。」(a=true) 误解标注误标为 B/正确，
按判断题口径（engine.js：点「错」=A）改为 A/错误；误解句按本题解析改写为「误以为两句不等」，正反例沿用。幂等。"""
import sys; sys.path.insert(0, __import__('os').path.dirname(__file__))
from fix_a23c_lib import load, save, dumps
import json
s, m, obj = load('yuwen')
J = obj['modes']['judge']
changed = []
for q in J:
    if q['q'] == '“我没有他高”等于“我比他矮”。' and q['a'] is True:
        old = dumps(q)
        new = [{"选项": "A", "选项文本": "错误",
                "误解": "以为“我没有他高”和“我比他矮”意思不一样，忘了“没有”就是否定比较：我没有他高＝他高一些，我矮一些",
                "正反例": ["没有他高＝他高一些，我矮一些√", "没有他高＝和他一样高✗"]}]
        if q['误解标注'] != new:
            q['误解标注'] = new
            changed.append((old, q))
print('changed', len(changed))
save('yuwen', s, m, obj, changed)
