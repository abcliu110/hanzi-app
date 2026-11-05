#!/usr/bin/env python3
"""zika-b：不适宜小学生的词/句/引文（审查报告 zika.md 第 17 节；本段 1751–3500 字）。
口径同 zika-a（fix_zika_a_unsafe.py）：只删成人/低俗/血腥/劝酒赌博类词与引文、骂人义项、酷刑义项；
正常教育语境（警察抓小偷、历史战争、禁止吸烟）与课文名句保留。不新造义项；引文只截原句前半（不改字）或置空。可重复运行。"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_b_lib as L

# 字: [(义项开头, 要删的词...)]
DEL_WORDS = {
    '秽': [('丑陋', '淫秽')],
    '淫': [('过度', '淫威', '骄奢淫逸'), ('迷惑', '淫心（古）')],
    '萄': [('像葡萄', '葡萄胎（专）')],
    '裸': [('不加包装', '裸考', '裸价')],
    '赌': [('拿财物', '赌钱', '赌场'), ('打赌', '赌一把'), ('拿重要', '赌命')],
    '嗜': [('爱吃', '嗜酒')],
    '揍': [(None, '揍死')],
    '捅': [('戳', '捅一刀')],
    '勒': [(None, '勒死')],
    '屠': [('大量杀人', '屠城')],
    '格': [('打斗', '格杀')],
    '溅': [(None, '血溅')],
    '漓': [(None, '鲜血淋漓')],
    '滩': [(None, '一滩血')],
    '骚': [('诗人', '风骚')],
    '蛋': [('称呼人', '笨蛋')],
    '臀': [(None, '提臀')],
    '脐': [(None, '脐屎')],
    '睛': [(None, '吸睛')],
    '敬': [(None, '敬酒')],
    '烙': [(None, '烙刑')],
    '溺': [('水名', '（古义）'), ('小便', '（同尿）')],
}
# 整个义项删除：字: 义项开头
DEL_SENSE = {'滚': '走开（骂人）', '嗜': '贪恋坏事', '烹': '古代的酷刑', '袜': '古代女子的胸衣'}
# 引文：截取原句前半 / 置空  (字, 义项开头): 新值
WEN = {   # (字, 原引文片段): 新值
    ('剔', '刳剔孕妇'): None,
    ('剖', '比干剖'): None,
    ('聘', '奔則為妾'): None,
    ('嫉', '善淫'): {'text': '众女嫉余之蛾眉兮。', '出处': '屈原《离骚》'},
    ('椎', '椎杀晋鄙'): {'text': '朱亥袖四十斤铁椎。', '出处': '《史记·魏公子列传》'},
}
# 例句改写 (字, 义项开头): 新句
JU = {
    ('啤', '啤酒'): '啤酒是用大麦酿成的，小朋友不能喝。',
    ('墅', '别墅'): '山脚下有一座带花园的别墅。',
    ('瑰', None): '花店里摆满了红红的玫瑰。',
    ('剪', None): '故事里，英雄剪除了山中的强盗。',
}
# 讲解局部替换
JJ = {'磷': ('本义为鬼火。', '本义是夜里在野外看到的磷火（古人误以为是“鬼火”）。')}


def senses(d): return d['dim']['运用链']

def pick(d, head, need=None):
    """按义项开头找义项；head 为 None 时找含 need（词/引文/句关键字）的义项。"""
    out = []
    for s in senses(d):
        if head is None:
            blob = ''.join(s.get('词') or []) + (s.get('句') or '') + str(s.get('文') or '')
            if need is None or need in blob: out.append(s)
        elif (s.get('义项') or '').startswith(head): out.append(s)
    return out


def run():
    B = set(L.chars_b()); n = 0
    zs = set(DEL_WORDS) | set(DEL_SENSE) | {k[0] for k in list(WEN) + list(JU)} | set(JJ)
    for z in sorted(zs):
        assert z in B, z
        d = L.load(z)
        for head, *ws in DEL_WORDS.get(z, []):
            for s in pick(d, head):
                s['词'] = [w for w in s['词'] if w not in ws]
        if z in DEL_SENSE:
            d['dim']['运用链'] = [s for s in senses(d) if not (s.get('义项') or '').startswith(DEL_SENSE[z])]
        for (zz, frag), v in WEN.items():
            if zz != z: continue
            for s in senses(d):
                t = s.get('文')
                if isinstance(t, dict) and frag in (t.get('text') or ''): s['文'] = v
        for (zz, key), v in JU.items():
            if zz != z: continue
            for s in senses(d):
                if key is None:
                    old = s.get('句') or ''
                    if z == '瑰' and '情人节' in old: s['句'] = v
                    if z == '剪' and old.startswith('（故事里'): s['句'] = v
                elif (s.get('义项') or '').startswith(key) and s.get('句') and s['句'] != v:
                    if z != '啤' or '喜欢喝' in s['句']: s['句'] = v
        if z == '勒':
            d['dim']['易错提示'] = [str(x).replace('勒紧、勒死读 lēi', '勒紧读 lēi') for x in d['dim'].get('易错提示') or []]
        if z in JJ:
            a, b = JJ[z]; y = d['dim']['字源']
            if y.get('讲解'): y['讲解'] = y['讲解'].replace(a, b)
        if L.save(z, d): n += 1; print('改', z)
    print('改动', n, '字')

if __name__ == '__main__': run()
