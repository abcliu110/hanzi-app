#!/usr/bin/env python3
"""zika-a：六书 chip 与讲解矛盾、算法推断的错声旁/形旁、编造《说文》引文（人工逐字，依据见日志）。可重复运行。"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_a_lib as L

def ls_set(dm, value, keep_parts=False):
    l6 = dm.setdefault('六书', {})
    if value is None: l6.pop('value', None)
    else: l6['value'] = value
    if not keep_parts:
        for k in ('声旁', '形旁', '依据'): l6.pop(k, None)

def jj(dm, t): dm['字源']['讲解'] = t

def run():
    E = {}
    # —— 算法推断形声、《说文》为会意/象形（声旁形旁明显错）——
    for z in '冒卖厚友士奴左荧':
        E[z] = lambda dm: ls_set(dm, '会意字')
    for z in '包舍':
        E[z] = lambda dm: ls_set(dm, '象形字')
    for z in '华艺审':   # 简化字与《说文》字头构形不同，口径分不清 → 不贴标签
        E[z] = lambda dm: ls_set(dm, None)
    def f_ren(dm):
        ls_set(dm, '会意字')
        jj(dm, '会意字。《说文》说“仁，亲也。从人从二”，“亻”加“二”，表示人与人之间相亲相爱。（来源：汉典；《说文解字》）')
    E['仁'] = f_ren
    # —— 讲解与 chip 矛盾 ——
    def f_liang(dm):
        dm['字源']['讲解'] = dm['字源']['讲解'].replace('两是会意兼形声字', '两是形声字（也兼会意）', 1)
    E['两'] = f_liang
    def f_zheng(dm):
        dm['字源']['讲解'] = dm['字源']['讲解'].replace('政是会意兼形声字', '政是形声字（也兼会意）', 1)
    E['政'] = f_zheng
    def f_zan(dm):
        ls_set(dm, '形声字')
        xs = dm.setdefault('形声拆解', {}); xs['meaning'] = '口：和说话有关'; xs['sound'] = '自：表示读音（今天读音差别已较大）'
    E['咱'] = f_zan
    def f_lu(dm):
        ls_set(dm, None)
        jj(dm, '“录”是“彔”和“錄”合并成的简化字。“錄”是形声字，《说文》说“金色也。从金，彔声”。今天常用的是记载、抄写的意思，如“记录”“录音”，也指记载事物的册子，如“目录”。（来源：汉典；《说文解字》）')
    E['录'] = f_lu
    E['亮'] = lambda dm: ls_set(dm, None, keep_parts=True)
    def f_san(dm):
        jj(dm, '汉典字形分析把“伞”标为象形字，整个字像一把撑开的伞。“伞”是挡雨、遮阳的用具，如“雨伞”“降落伞”。（来源：汉典）')
    E['伞'] = f_san
    def f_yu(dm):
        t = dm['字源']['讲解']
        if '形声' not in t:
            jj(dm, t.replace('（来源：汉典；《说文解字》）', '《说文》把它分析为形声字（从𠫓，肉声）。（来源：汉典；《说文解字》）'))
    E['育'] = f_yu
    # —— 编造《说文》引文 ——
    def f_pin(dm):
        jj(dm, '拼是形声字，左边“扌”表示和手的动作有关，右边“并”提示读音，也有“合在一起”的意思。常用义是凑合到一起，如“拼音”“拼图”；也指豁出去用全力，如“拼命”“拼搏”。（来源：汉典）')
    E['拼'] = f_pin
    A = set(L.chars_a()); n = 0
    for z, f in E.items():
        assert z in A, z
        d = L.load(z); f(d['dim']); n += L.save(z, d)
    print('改动', n, '字')

if __name__ == '__main__': run()
