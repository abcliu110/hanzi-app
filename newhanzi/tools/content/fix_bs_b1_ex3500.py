#!/usr/bin/env python3
"""BS 批 1：部首例字在 3500 字外（bushou_ui.md 第 12 节，接手断点）。幂等。
3500 外的例字没有字卡，bushou.js 已按 in3500=false 渲染成不可点的虚线框（本批另加 title 提示）。
处理：
  1) 能换的换：本条目 chars（字典归部，来自 zi_map）里还有没当例字的 3500 字时，换成该字，
     例词取该字字卡「运用链」里的词（仓库已有数据）。共 4 处：
     大 奕→夸(夸奖)；舟 舷→艘(一艘船)；羽 翌→翰(翰墨)；卩 卬→卫(保卫)。
  2) 不宜儿童的删（零删减例外：不适宜内容）：弋 弑(弑君)、网 罹(罹难)、歹 殡(殡仪馆)。
  3) 例词不规范：黍 黏(黏贴) → 黏(黏土)（规范词形「粘贴」，黏读 nián，《现代汉语词典》收「黏土」）。
  其余 3500 外例字：本条目 chars 已全部用作例字、没有可换的 3500 字，保留为不可点的说明例字。
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_bs_lib import load, save, BUSHOU, card

REPLACE = {('大', '奕'): ('夸', '夸奖'), ('舟', '舷'): ('艘', '一艘船'),
           ('羽', '翌'): ('翰', '翰墨'), ('卩', '卬'): ('卫', '保卫')}
DROP = {('弋', '弑'), ('网', '罹'), ('歹', '殡')}
WORD = {('黍', '黏'): ('黏贴', '黏土')}

D, fmt = load(BUSHOU)
n = 0
for r in D:
    b = r['bushou']
    new = []
    for e in r.get('examples') or []:
        k = (b, e['z'])
        if k in DROP:
            n += 1; continue
        if k in REPLACE:
            z, w = REPLACE[k]
            assert z in r['chars'] and card(z), (b, z)
            e = {'z': z, 'w': w, 'in3500': True}; n += 1
        if k in WORD and e['w'] == WORD[k][0]:
            e = dict(e, w=WORD[k][1]); n += 1
        new.append(e)
    r['examples'] = new
# 自检：in3500 标记与字卡存在一致
for r in D:
    for e in r['examples']:
        assert bool(e['in3500']) == bool(card(e['z'])), (r['bushou'], e['z'])
save(BUSHOU, D, fmt)
print('改', n, '处')
