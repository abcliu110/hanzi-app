#!/usr/bin/env python3
"""F3 古诗线 Q17：《画》作者改宋·佚名（2026-11-05，用户授权按你的来）。
依据：古诗文网《画》创作背景——“关于这首诗的作者，有多种说法。一说是唐代王维所作，
但在王维的作品，或在《全唐诗》都没有此诗；一说是原为南宋僧人川禅师为注释佛教经典
《金刚经》所作的偈颂诗的一部分；一说为宋代佚名诗人所作，如上海市一年级小学语文等
教材中编入此诗时，作者一栏里即是'宋·佚名'”（gushiwen.cn/shiwenv_b6bd9a33dfd7.aspx）。
本库从上海教材写法，作者作“宋·佚名”。

同步面核查（脚本内断言）：诗库 dynasty 唐→宋；赏析 bg 同步改写；
题库 quiz/data_shici.js、知识卡 knowledge、名句 famous、意象 imagery、故事 stories、
诗人小传 poets.王维、飞花令、基础游戏——均无《画》/“远看山有色”的作者说法，无处可改。
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io

S = io.load('shici')
SX = io.load('shangxi')
Q = io.load('quiz')

p = [v for v in S['poems'] if v['title'] == '画']
assert len(p) == 1 and p[0]['author'] == '佚名' and p[0]['dynasty'] == '唐'
p[0]['dynasty'] = '宋'

x = [v for v in SX if v['t'] == '画']
assert len(x) == 1 and x[0]['a'] == '佚名'
assert '王维' in x[0]['bg']
x[0]['bg'] = ('这首诗赞美的是一幅山水花鸟画。它的作者说法不一：有人说是唐代王维，'
              '但王维的诗集里找不到它；也有人说是宋代道川禅师的诗偈改编。'
              '本库从上海小学语文教材的写法，作者作“宋·佚名”。')

# 同步面：断言其余位置无《画》作者说法
rest = json.dumps(S['knowledge'], ensure_ascii=False) + \
    json.dumps(S['famous'], ensure_ascii=False) + \
    json.dumps(S['imagery'], ensure_ascii=False) + \
    json.dumps(S['stories'], ensure_ascii=False) + \
    json.dumps(S['poets'], ensure_ascii=False) + \
    json.dumps(Q, ensure_ascii=False)
assert '远看山有色' not in rest and '《画》' not in rest, '题库/知识卡里有《画》，需同步改'
assert S['poets']['王维'].count('《画》') == 0

io.dump('shici', S)
io.dump('shangxi', SX)
print('Q17 完成：画 dynasty 唐→宋；赏析 bg 同步；题库/知识卡/名句/意象/小传无《画》作者说法，无改')
