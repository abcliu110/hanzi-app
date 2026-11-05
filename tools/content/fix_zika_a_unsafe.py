#!/usr/bin/env python3
"""zika-a：不适宜小学生的词/句/引文（审查报告 zika.md 第 17 节；本段 1–1750 字）。
人工逐条判断：只删成人/低俗/血腥/劝酒类词和引文，正常教育语境（爱护动物、违法、历史战争）保留。
不新造义项；改写的只有例句，引文只截取原句前半（不改字）。"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_a_lib as L

# 字: [(义项下标, 要删的词...)]
DEL_WORDS = {
    '诲': [(0, '诲淫')],
    '哇': [(0, '淫哇')],
    '级': [(4, '斩首若干级')],
    '胎': [(2, '投胎'), (3, '备胎')],
    '吊': [(3, '上吊')],
    '药': [(4, '药死')],
    '贱': [(3, '贱内')],
    '枪': [(4, '代枪', '捉刀（相关）')],
    '洗': [(3, '血洗')],
    '刃': [(1, '刃仇')],
    '罚': [(2, '罚酒')],
    '叼': [(0, '叼烟')],
    '姚': [(1, '妖娆（音近）')],
    '屁': [(3, '马屁')],
}
# 整个义项删除（粗口 / 划拳劝酒）：字: 义项文本
DEL_SENSE = {'屁': '没用的、不值一提的', '拇': '划拳（拇战）'}
# 引文：截取原句前半 / 置空
WEN = {
    ('戒', 2): {'text': '君子有三戒。', '出处': '《论语·季氏》'},
    ('郑', 2): {'text': '放郑声，远佞人。', '出处': '《论语·卫灵公》'},
    ('冶', 3): None,   # 慢藏诲盗，冶容诲淫
    ('疫', 0): None,   # 家家有僵尸之痛
}
JU = {('拷', 0): '旧时官府审案常常拷打犯人，这种做法很残忍，现在法律禁止。'}
YIXIANG = {('洗', 3): '像用水冲洗一样全部抢走'}

def run():
    A = set(L.chars_a()); n = 0; log = []
    for z in set(DEL_WORDS) | set(DEL_SENSE) | {k[0] for k in list(WEN) + list(JU) + list(YIXIANG)} | {'妓'}:
        assert z in A, z
        d = L.load(z); ch = d['dim']['运用链']
        for i, *ws in DEL_WORDS.get(z, []):
            for w in ws:
                assert w in ch[i]['词'], (z, i, w)
                ch[i]['词'].remove(w); log.append(f'{z}删词{w}')
        for (zz, i), v in WEN.items():
            if zz == z: ch[i]['文'] = v; log.append(f'{z}[{i}]引文')
        for (zz, i), v in JU.items():
            if zz == z: ch[i]['句'] = v; log.append(f'{z}[{i}]例句')
        for (zz, i), v in YIXIANG.items():
            if zz == z: ch[i]['义项'] = v
        if z in DEL_SENSE:
            k = [u['义项'] for u in ch].index(DEL_SENSE[z]); del ch[k]; log.append(f'{z}删义项{DEL_SENSE[z]}')
        if z == '妓':
            # 原卡三个义项都空，第三格是「（不在儿童场景展开）」占位；只留汉典第一义
            d['dim']['运用链'] = [{'义项': '古代以歌舞为业的女子', '类型': '本义', '词': ['歌妓', '乐妓', '舞妓'],
                                  '句': '唐代宫廷里有专门表演歌舞的乐妓。', '文': None}]
            log.append('妓 运用链收成一个义项')
        n += L.save(z, d)
    print('改动', n, '字'); print('；'.join(log))
if __name__ == '__main__': run()
