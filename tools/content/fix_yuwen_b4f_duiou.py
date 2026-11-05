#!/usr/bin/env python3
"""F1 语法 4f：对偶库正对/反对/流水对归类（报告 §6「流水对题干扰项海内存知己」）。幂等。
原库同一句在不同子类里互为答案/干扰项（「海内存知己，天涯若比邻」是流水对经典例，却被当正对答案和流水对题的干扰项；
「吃一堑，长一智」「前事不忘，后事之师」当反对；「路漫漫其修远兮…」「天对地，雨对风…」不是对偶）。
→ 三个子类各用一组无争议的例句重写整库（300 题），A/B/C/D 四题型，解析按选项顺序。
口径：上下句字数相等、结构相同；正对意思相近相补，反对意思相反相对，流水对上下句意思连贯（承接、因果、条件），拆开不能独立。
"""
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, load_data, save_data, item

P = {
    '正对': ['春风吹绿柳，秋雨润红花。', '两个黄鹂鸣翠柳，一行白鹭上青天。', '明月松间照，清泉石上流。', '白日依山尽，黄河入海流。',
           '迟日江山丽，春风花草香。', '山清水秀，鸟语花香。', '红花配绿叶，青山衬白云。', '爆竹声中辞旧岁，梅花香里报新春。'],
    '反对': ['虚心使人进步，骄傲使人落后。', '满招损，谦受益。', '胜不骄，败不馁。', '生于忧患，死于安乐。',
           '横眉冷对千夫指，俯首甘为孺子牛。', '善有善报，恶有恶报。', '知之为知之，不知为不知。', '早起的鸟儿有虫吃，晚起的鸟儿没虫吃。'],
    '流水对': ['欲穷千里目，更上一层楼。', '读书破万卷，下笔如有神。', '旧时王谢堂前燕，飞入寻常百姓家。', '海内存知己，天涯若比邻。',
            '即从巴峡穿巫峡，便下襄阳向洛阳。', '野火烧不尽，春风吹又生。', '少壮不努力，老大徒伤悲。', '才饮长江水，又食武昌鱼。'],
}
NONE = ['他跑得像兔子一样快。', '雪花像鹅毛一样飘下来。', '天上的云像棉花一样白。', '月亮像玉盘一样挂在天上。', '小草向我招手。']
WHY = {'正对': '上下句意思相近、互相补充', '反对': '上下句意思相反、相对', '流水对': '上下句意思连贯（承接、因果或条件），拆开不能独立'}
OTHER_LAB = ['明喻', '语言拟人', '句子排比', '设问', '扩大夸张']
ST = {
    '正对': (['正对的上下句意思相近或互相补充，如「春风吹绿柳，秋雨润红花」。', '对偶要求上下句字数相等、结构相同。', '「两个黄鹂鸣翠柳，一行白鹭上青天」是正对。'],
           ['正对的上下句意思相反。', '「虚心使人进步，骄傲使人落后」是正对。', '对偶的上下句字数可以不一样。', '「欲穷千里目，更上一层楼」是正对。']),
    '反对': (['反对的上下句意思相反或相对，如「满招损，谦受益」。', '「虚心使人进步，骄傲使人落后」是反对。', '反对用相反的两面作对比，把道理说得更鲜明。'],
           ['反对的上下句意思相近。', '「明月松间照，清泉石上流」是反对。', '反对的上下句拆开以后意思都不完整。', '「读书破万卷，下笔如有神」是反对。']),
    '流水对': (['流水对的上下句意思连贯，有承接、因果、条件等关系，像流水一样分不开。', '「欲穷千里目，更上一层楼」是流水对。', '「海内存知己，天涯若比邻」是流水对。'],
            ['流水对的上下句意思相反。', '「虚心使人进步，骄傲使人落后」是流水对。', '流水对的上下句各说各的，拆开也完全独立。', '「春风吹绿柳，秋雨润红花」是流水对。']),
}


def lab(s):
    for c, v in P.items():
        if s in v: return c
    return None


def main():
    name, d, fn = load_bank('duiou')
    C = list(P); cnt = {}; out = []
    for i, q in enumerate(d['questions']):
        cls = q['类']; t = q['q']
        typ = 'A' if t.startswith('下面哪个') else 'B' if '用了哪种修辞' in t else 'C' if t.startswith('选') else 'D'
        k = cnt.get((cls, typ), 0); cnt[(cls, typ)] = k + 1
        rng = random.Random('do|%d' % i); oth = [c for c in C if c != cls]
        s = P[cls][k % 8]
        if typ == 'A':
            opts = [s, P[oth[0]][(k + 2) % 8], P[oth[1]][(k + 5) % 8], NONE[k % 5]]; rng.shuffle(opts)
            rest = '，'.join('「%s」%s' % (o.rstrip('。'), ('是' + lab(o)) if lab(o) else '不是对偶（是比喻句）' if '像' in o else '不是对偶') for o in opts if o != s)
            nq = {'q': '下面哪个是%s？' % cls, 'options': opts, 'answer': opts.index(s),
                  '解析': '「%s」%s，是%s。其他三个：%s。' % (s.rstrip('。'), WHY[cls], cls, rest)}
        elif typ == 'B':
            opts = [cls] + oth + [OTHER_LAB[k % 5]]; rng.shuffle(opts)
            nq = {'q': '%s 用了哪种修辞？' % s, 'options': opts, 'answer': opts.index(cls),
                  '解析': '上下句字数相等、结构相同，是对偶；%s，所以是%s。' % (WHY[cls], cls)}
        elif typ == 'C':
            up, down = s.rstrip('。').split('，')
            wrong1 = P[oth[k % 2]][(k + 3) % 8].rstrip('。').split('，')[1]
            wrong2 = P[cls][(k + 4) % 8].rstrip('。').split('，')[1]
            opts = [down, wrong1, wrong2, up]
            if len(set(opts)) < 4: opts[2] = P[cls][(k + 1) % 8].rstrip('。').split('，')[1]
            rng.shuffle(opts)
            nq = {'q': '选词填入___处：%s，___。' % up, 'options': opts, 'answer': opts.index(down),
                  '解析': '下句要和上句「%s」字数相等、结构相同，意思还要配得上：%s，%s。%s，是%s。「%s」「%s」是别的对偶里的句子，和上句配不上；「%s」是把上句重复了一遍。' % (
                      up, up, down, WHY[cls], cls, wrong1, wrong2, up)}
        else:
            tr, fl = ST[cls]; tt = tr[k % 3]; f = fl[:]; random.Random('doD|%s|%d' % (cls, k)).shuffle(f)
            opts = [tt] + f[:3]; rng.shuffle(opts)
            nq = {'q': '下面说法正确的是？', 'options': opts, 'answer': opts.index(tt),
                  '解析': tt + ' 其他三项都不对：' + '；'.join(x.rstrip('。') for x in f[:3]) + '。'}
        assert len(set(nq['options'])) == 4, nq
        nq['类'] = cls; out.append(nq)
    n = sum(1 for a, b in zip(d['questions'], out) if a != b)
    d['questions'] = out; save_bank(fn, name, d)
    # 讲解
    dd, tail = load_data()
    it = item(dd, '对偶', 'grammar')
    it['例子'] = [x for x in it['例子'] if not x.startswith('春种一粒粟')]
    it['例子'] = ['海内存知己，天涯若比邻。（流水对：上下句意思连贯）' if x == '海内存知己，天涯若比邻。（工对：词性相对工整）' else x for x in it['例子']]
    it['易错'] = '修辞里的对偶只要求字数相等、结构相同，不要求平仄；律诗里的“对仗”才讲平仄'
    v = it['变式表']['可变']
    v['类型'] = ['正对（意思相近：明月松间照，清泉石上流）', '反对（意思相反：横眉冷对千夫指，俯首甘为孺子牛）', '流水对（也叫串对，意思承接：才饮长江水，又食武昌鱼）']
    save_data(dd, tail)
    return n


if __name__ == '__main__':
    print('duiou', main())
