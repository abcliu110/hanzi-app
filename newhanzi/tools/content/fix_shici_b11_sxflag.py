#!/usr/bin/env python3
"""F3 批次11（G 组）：诗库 `sx:"待补"` 陈旧标记（报告 §9）。幂等。
按 build_shici.py 第 7 步同一规则：shangxi 里有这首诗的赏析就去掉 sx 字段，没有才标「待补」。
（页面不读这个字段，只影响统计。）"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io
s = io.load('shici'); sx = io.load('shangxi')
have = {(x['t'], x['a']) for x in sx}; n = 0
for p in s['poems']:
    if (p['title'], p['author']) in have:
        if 'sx' in p: p.pop('sx'); n += 1
    elif p.get('sx') != '待补': p['sx'] = '待补'; n += 1
io.dump('shici', s)
print('改', n, '首；仍待补', sum(1 for p in s['poems'] if p.get('sx') == '待补'))
