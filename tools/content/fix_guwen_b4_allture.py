#!/usr/bin/env python3
"""F2 批次3：「关于 X，下面哪一项正确？」四项都是真陈述（报告 B4）。幂等。
fanyi/lishi/songdu/wenhua/wenxue/yufa 的「选内容」题：选项是各知识点的正确说明，问「正确」无法作答。
处理：题干改为「下面哪一项讲的是“X”？」（归属题）；干扰项全部换成同模块其他知识点的完整说明，
并排除与 X 相关的说明（含 X 名称、含 X 说明里出现的人名/篇名，或在人工相关表里，如 倒装句↔定语/状语/宾语/何…之）。
解析改为「“X”：<说明>」不变。meiti、gaopinci 的同类题在 B2 批次整题删除，这里不动。"""
import sys, os, re, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_guwen_io import *
B = load_banks(); h, K, t = load_kn()
MODS = ('fanyi', 'lishi', 'songdu', 'wenhua', 'wenxue', 'yufa')
PAT = re.compile(r'关于“(.+?)”，下面哪一项正确？$')
NEW = '下面哪一项讲的是“%s”？'
PERSONS = '孔子 孟子 庄子 荀子 列子 韩非子 吕不韦 吕氏春秋 贾谊 司马迁 陶渊明 谢灵运 刘义庆 韩愈 柳宗元 刘禹锡 范仲淹 欧阳修 周敦颐 苏轼 诸葛亮 刘备 刘禅 刘邦 项羽 曹刿 滕子京 扬雄'.split()
REL = {  # 人工相关表（双向）
    'yufa': [('倒装句', '定语'), ('倒装句', '状语'), ('倒装句', '宾语'), ('倒装句', '何…之'), ('宾语', '何…之'),
             ('被动句', '为…所…'), ('判断句', '者…也'), ('判断句', '主语'), ('语法与虚词、词类活用的关系', '为…所…'),
             ('语法与虚词、词类活用的关系', '者…也'), ('语法与虚词、词类活用的关系', '何…之'), ('语法与虚词、词类活用的关系', '判断句'),
             ('语法与虚词、词类活用的关系', '被动句'), ('语法与虚词、词类活用的关系', '倒装句'), ('语法与虚词、词类活用的关系', '省略句')],
    'lishi': [('纪年', '桃花源记'), ('纪年', '朝代脉络')],
}
def related(mid, a, b):
    return (a, b) in REL.get(mid, []) or (b, a) in REL.get(mid, [])
def is_target(q):
    return PAT.match(q['q']) or (q.get('类') == '选内容' and q['q'].startswith('下面哪一项讲的是'))
n = 0
for mid in MODS:
    stm = {}   # 点名 -> [说明]
    for k, o in B[mid]:
        for q in o['questions']:
            if q.get('类') == '选内容':
                stm.setdefault(k.split(':', 1)[1], []).append(q['options'][q['answer']])
    tok = {}
    for x, ss in stm.items():
        s = ''.join(ss)
        tok[x] = {x} | {p for p in PERSONS if p in s} | set(re.findall(r'《([^》]{2,8})》', s))
    pool = [(x, s) for x, ss in stm.items() for s in ss]
    for k, q in all_q(B, K):
        if not k.startswith(mid + ':') or q.get('类') != '选内容': continue
        x = k.split(':', 1)[1]
        ans = q['options'][q['answer']]
        def ok(px, s):
            if px == x or related(mid, px, x): return False
            if any(tk in s for tk in tok[x]): return False
            if x == '断句' and '停顿' in s: return False   # 语感「出声读，读出节奏和停顿」也沾断句
            if any(tk in ''.join(stm[x]) for tk in tok[px] if tk not in PERSONS or px in PERSONS): return False
            return True
        cands = [s for px, s in pool if ok(px, s)]
        cands = list(dict.fromkeys(cands))
        cands.sort(key=lambda s: hashlib.md5((x + ans + s).encode()).hexdigest())
        if len(cands) < 3:
            print('候选不足，跳过', k, len(cands)); continue
        pos = int(hashlib.md5((x + ans).encode()).hexdigest(), 16) % 4
        opts = cands[:3]; opts.insert(pos, ans)
        q['q'] = NEW % x; q['options'] = opts; q['answer'] = pos; n += 1
save_banks(B); save_kn(h, K, t)
print('改题', n)
