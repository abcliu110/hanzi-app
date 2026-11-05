#!/usr/bin/env python3
"""F1 语法 第 3 批：规则跨库矛盾（报告 yuwen.md §4）。幂等，可重复运行。

统一口径（依据：统编小学语文关联词教学「虽然……但是/可是/却……」成对呼应；
《现代汉语词典》「遇难」= 遭受迫害或意外灾祸而死亡；黄廖《现代汉语》约数表达）：
1. 「虽然」后一分句要有「但是/可是/却/还是」呼应（小学阶段）。
   - quiz_bank_suiran_danshi：子类「虽然……，……式」（判为正确用法）改为「虽然……却……式」，整库按选项顺序重写解析、去掉拼接选项。
   - quiz_bank_guanlianci_canque「虽然残缺式」保持判病，但换掉语义不通的「虽然他生病了，但是没来上学」，句子都是真转折。
   - 其他关联词库把「虽然……，……式」当干扰标签的，改成「虽然……却……式」（仍是干扰项）。
   - data.js「虽然…但是…」分类同步。
2. 约数：「大约/至少 + 多」可以说（「三十多」本身是约数），只算「大约……左右」叠用、「将近……多」矛盾。
   data.js 成分残缺或赘余 / 前后矛盾 / logic 自相矛盾的「大约三十多人」病例、quiz/data_yuwen.js spot「最少也有10多个」改掉。
3. 状语语序：描写性状语「认真地」放在「把」前后都通，不再判错；语序病例只用时间状语错位（与题库 quiz_bank_yuxu 一致）。
   quiz/data_yuwen.js spot#0、data.js 语序不当（例子/分类/例句解析/练习/辨析）同步。
4. logic 自相矛盾：「遇难者」也是死了的人，「他是众多遇难者中幸免的一个」仍矛盾 → 「他是这次事故中幸免于难的一个」；
   「胜负未分，结果打成平局」不矛盾（平局就是没分出胜负）→ 换「会场上一片寂静，同学们都在大声讨论」。
"""
import json, os, random, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, save_data, item, ROOT
from fix_yuwen_io import items as yitems
from fix_yuwen_sick import regen_class

# ---------------- 1a. 虽然…但是… 整库重写 ----------------
# (让步分句, 后一分句主语, 后一分句谓语)
SR = [
    ('外面下着雨', '他', '去公园跑步了'),
    ('她生病了', '', '坚持去上学'),
    ('作业很多', '他', '按时完成了'),
    ('妈妈很累', '她', '做好了晚饭'),
    ('路很远', '他', '走路去了学校'),
    ('爸爸工作很忙', '他', '每天陪我读书'),
    ('这件衣服很旧', '妹妹', '很喜欢它'),
    ('天气很冷', '爷爷', '早早起床锻炼'),
    ('这道题很难', '小明', '做出来了'),
    ('弟弟个子小', '他', '力气很大'),
    ('那本书很贵', '姐姐', '买下了它'),
    ('雪下得很大', '同学们', '准时到校了'),
]
SUB = ['虽然……但是……式', '尽管……还是……式', '虽然……却……式']
NAME = {SUB[0]: '虽然……但是……', SUB[1]: '尽管……还是……', SUB[2]: '虽然……却……'}
OLD3 = '虽然……，……式'


def sent(sub, t):
    c, s, r = t
    if sub == SUB[0]: return '虽然%s，但是%s%s。' % (c, s, r)
    if sub == SUB[1]: return '尽管%s，%s还是%s。' % (c, s, r)
    return '虽然%s，%s却%s。' % (c, s, r)

# 非转折句（干扰项）及其关系
OTHER = [('他不但会唱歌，而且会跳舞。', '不但……而且……', '递进'),
         ('因为下雨，所以运动会改期了。', '因为……所以……', '因果'),
         ('如果明天下雨，我们就不去郊游了。', '如果……就……', '假设'),
         ('只要多练习，就能把字写好。', '只要……就……', '条件')]
# 判断题的干扰标签（都是和转折不同的关系，不会多解）
OTHER_LABEL = ['不但……而且……式', '因为……所以……式', '如果……就……式', '只要……就……式', '只有……才……式', '一边……一边……式', '既……又……式', '无论……都……式']


def q_choose(sub, k, rng):
    t = SR[k % len(SR)]
    ans = sent(sub, t)
    others = [s for s in SUB if s != sub]
    opts = [(ans, NAME[sub])]
    for j, o in enumerate(others):
        opts.append((sent(o, SR[(k + 3 + 4 * j) % len(SR)]), NAME[o]))
    ot = OTHER[k % len(OTHER)]
    opts.append((ot[0], ot[1]))
    rng.shuffle(opts)
    exp = '「%s」用的是「%s」，表示转折：前面先承认一个情况，后面说出相反或意外的结果。' % (ans.rstrip('。'), NAME[sub])
    rest = [o for o in opts if o[0] != ans]
    exp += '其他三句：' + '；'.join('「%s」用的是「%s」' % (o[0].rstrip('。'), o[1]) for o in rest) + '。'
    return {'q': '下面哪个句子用了「%s」这组关联词？' % NAME[sub], 'options': [o[0] for o in opts],
            'answer': [o[0] for o in opts].index(ans), '解析': exp}


def q_judge(sub, k, rng):
    t = SR[k % len(SR)]
    s = sent(sub, t)
    others = [x for x in SUB if x != sub]
    # 一个同为转折的别的组合 + 两个非转折组合
    dis = [others[k % 2]]
    pool = OTHER_LABEL[:]; rng.shuffle(pool)
    dis += pool[:2]
    opts = dis + [sub]; rng.shuffle(opts)
    key = {SUB[0]: '「虽然」和「但是」', SUB[1]: '「尽管」和「还是」', SUB[2]: '「虽然」和「却」'}[sub]
    exp = '句子里成对出现的是%s，所以是「%s」，表示转折。' % (key, NAME[sub])
    exp += '「%s」虽然也表示转折，但句子里没有用这一对词。' % NAME[dis[0]]
    return {'q': '%s 用的关联词是？' % s, 'options': opts, 'answer': opts.index(sub), '解析': exp}


def q_fill_que(k, rng):
    """虽然……却……式的填空：只空「却」。"""
    c, s, r = SR[k % len(SR)]
    stem = '选词填入___处：虽然%s，%s___%s。' % (c, s, r)
    opts = ['却', '就', '所以', '而且']; rng.shuffle(opts)
    exp = ('前面用了「虽然」，表示转折，后面要用「却」来呼应：虽然%s，%s却%s。'
           '「就」常配「如果、只要」，「所以」配「因为」，「而且」配「不但」，都和「虽然」配不上。') % (c, s, r)
    return {'q': stem, 'options': opts, 'answer': opts.index('却'), '解析': exp}


STATE_TRUE = {
    SUB[0]: ['「虽然……但是……」表示转折，后一分句的意思和前一分句相反或相对。',
             '用了「虽然」，后一分句一般要用「但是」「可是」「却」来呼应。'],
    SUB[1]: ['「尽管……还是……」表示转折：「尽管」先承认一个情况，「还是」引出不受它影响的结果。',
             '「尽管」和「虽然」意思相近，后面常用「还是」「但是」「却」来呼应。'],
    SUB[2]: ['「虽然……却……」表示转折，「却」要放在后一分句的主语后面。',
             '「虽然……却……」和「虽然……但是……」都表示转折。'],
}
STATE_FALSE = {
    SUB[0]: ['「虽然……但是……」表示因果关系。', '「虽然……但是……」表示假设关系。', '「虽然……但是……」表示递进关系。',
             '「虽然」后面可以用「所以」来呼应。'],
    SUB[1]: ['「尽管……还是……」表示因果关系。', '「尽管……还是……」表示条件关系。', '「尽管……还是……」表示递进关系。',
             '「尽管」后面可以用「所以」来呼应。'],
    SUB[2]: ['「虽然……却……」表示因果关系。', '「虽然……却……」表示假设关系。', '「却」要放在后一分句的主语前面。',
             '用了「虽然」，后一分句什么词都不用加也算用对了关联词。'],
}


def q_state(sub, k, rng):
    if k % 2 == 0:
        true = STATE_TRUE[sub][(k // 2) % 2]
        fl = STATE_FALSE[sub][:]; rng.shuffle(fl)
        opts = [true] + fl[:3]
        exp = true + ' 其他三项：' + '；'.join(x.rstrip('。') for x in fl[:3]) + '，都不对。'
    else:
        t = SR[k % len(SR)]
        s = sent(sub, t)
        true = '「%s」用了「%s」，前后是转折关系。' % (s.rstrip('。'), NAME[sub])
        ot = OTHER[k % len(OTHER)]
        o2 = sent([x for x in SUB if x != sub][0], SR[(k + 5) % len(SR)])
        f1 = '「%s」用了「%s」，前后是转折关系。' % (ot[0].rstrip('。'), NAME[sub])
        f2 = '「%s」前后是%s关系。' % (s.rstrip('。'), ['因果', '递进', '假设'][k % 3])
        f3 = '「%s」用了「%s」。' % (o2.rstrip('。'), NAME[sub])
        opts = [true, f1, f2, f3]
        exp = '%s「%s」用的是「%s」，表示%s；「%s」用的是另一组转折关联词。' % (
            true, ot[0].rstrip('。'), ot[1], ot[2], o2.rstrip('。'))
    rng.shuffle(opts)
    return {'q': '下面说法正确的是？', 'options': opts, 'answer': opts.index(true), '解析': exp}


def fix_suiran():
    name, d, fn = load_bank('suiran_danshi')
    qs = d['questions']
    cnt = {}
    out = []
    for i, q in enumerate(qs):
        cls = q['类']
        if cls == OLD3: cls = SUB[2]
        typ = None
        t = q['q']
        if t.startswith('下面哪个句子用'): typ = 'A'
        elif '用的关联词是' in t: typ = 'B'
        elif t.startswith('选关联词填入') or t.startswith('选词填入'): typ = 'C'
        elif t.startswith('下面说法正确'): typ = 'D'
        k = cnt.get((cls, typ), 0); cnt[(cls, typ)] = k + 1
        rng = random.Random('sr|%d' % i)
        if typ == 'A': nq = q_choose(cls, k, rng)
        elif typ == 'B': nq = q_judge(cls, k, rng)
        elif typ == 'C':
            if cls == SUB[2]: nq = q_fill_que(k, rng)
            else: nq = dict(q)  # 第 1 批已重写（只空「虽然/尽管」，干扰项配不上）
        elif typ == 'D': nq = q_state(cls, k, rng)
        else: raise ValueError(t)
        nq['类'] = cls
        out.append(nq)
    n = sum(1 for a, b in zip(qs, out) if a != b)
    d['questions'] = out
    save_bank(fn, name, d)
    return n

# ---------------- 1b. 关联词残缺·虽然残缺式 ----------------
NOT_GL = ['缺少主语', '缺少宾语', '语序不当', '意思重复']


def I(s, fix, b1, r1, b2, r2):
    return {'s': s, 'fix': fix, 'why': '用了「虽然」，后一分句却没有「但是」「可是」「却」来呼应', 'bad': [(b1, r1), (b2, r2)], 'not': NOT_GL}

R_SUO = '「虽然」不能和表示因果的「所以」配对'
R_ER = '「虽然」不能和表示递进的「而且」配对'
GL_SUIRAN = [
    I('虽然天气很冷，他坚持跑步。', '虽然天气很冷，但是他坚持跑步。', '虽然天气很冷，所以他坚持跑步。', R_SUO, '虽然天气很冷，而且他坚持跑步。', R_ER),
    I('虽然作业很多，他按时完成了。', '虽然作业很多，但是他按时完成了。', '虽然作业很多，所以他按时完成了。', R_SUO, '虽然作业很多，他就按时完成了。', '「就」配「如果、只要」，不能和「虽然」呼应'),
    I('虽然路很远，我们准时到了。', '虽然路很远，可是我们准时到了。', '虽然路很远，因此我们准时到了。', '「因此」表示因果，不能和「虽然」配对', '虽然路很远，而且我们准时到了。', R_ER),
    I('虽然弟弟年龄小，他懂得很多道理。', '虽然弟弟年龄小，但是他懂得很多道理。', '虽然弟弟年龄小，所以他懂得很多道理。', R_SUO, '虽然弟弟年龄小，而且他懂得很多道理。', R_ER),
    I('虽然这道题很难，小明做出来了。', '虽然这道题很难，但是小明做出来了。', '虽然这道题很难，所以小明做出来了。', R_SUO, '虽然这道题很难，小明才做出来了。', '「才」配「只有」，不能和「虽然」呼应'),
    I('虽然他身体不好，每天坚持锻炼。', '虽然他身体不好，却每天坚持锻炼。', '虽然他身体不好，所以每天坚持锻炼。', R_SUO, '虽然他身体不好，而且每天坚持锻炼。', R_ER),
    I('虽然这件衣服很旧，妹妹很喜欢它。', '虽然这件衣服很旧，但是妹妹很喜欢它。', '虽然这件衣服很旧，所以妹妹很喜欢它。', R_SUO, '虽然这件衣服很旧，妹妹就很喜欢它。', '「就」配「如果、只要」，不能和「虽然」呼应'),
    I('虽然爸爸工作很忙，他常常陪我读书。', '虽然爸爸工作很忙，可是他常常陪我读书。', '虽然爸爸工作很忙，所以他常常陪我读书。', R_SUO, '虽然爸爸工作很忙，而且他常常陪我读书。', R_ER),
]


def fix_canque():
    name, d, fn = load_bank('guanlianci_canque')
    n = regen_class(d, '虽然残缺式', GL_SUIRAN, label='「虽然」缺呼应', cat='关联词使用不当', siblings=('关联词缺一半',), new_cls='虽然残缺式', seed='gl_sr')
    save_bank(fn, name, d)
    return n

# ---------------- 1c. 其他库的干扰标签 ----------------


def fix_labels():
    n = 0
    for fn in bank_files():
        if fn.endswith('quiz_bank_suiran_danshi.js'): continue
        name, d, _ = load_bank(fn)
        ch = False
        for q in d['questions']:
            if OLD3 in q['options']:
                assert q['options'][q['answer']] != OLD3, (fn, q)
                q['options'] = [SUB[2] if o == OLD3 else o for o in q['options']]
                if OLD3 in q.get('解析', ''): q['解析'] = q['解析'].replace(OLD3, SUB[2])
                ch = True; n += 1
        if ch: save_bank(fn, name, d, recount_total=False)
    return n

# ---------------- 2–4. 讲解 data.js ----------------


def rep_list(lst, old, new):
    c = 0
    for i, x in enumerate(lst):
        if x == old: lst[i] = new; c += 1
    return c


def fix_data():
    d, tail = load_data()
    log = []
    # 1d 虽然…但是… 分类
    it = item(d, '虽然…但是…', 'grammar')
    for c in it['分类']:
        if c['类'] == OLD3:
            c.update({'类': SUB[2], '说明': '后一分句用「却」呼应「虽然」，「却」放在后一分句的主语后面。', '代表': '虽然……却……',
                      '例子': ['虽然下着雨，运动会却照常举行。']})
            log.append('虽然…但是…分类')
    it['深讲'] = it['深讲'].replace('转折的后句不能省。', '转折的后句不能省；小学阶段用了「虽然」，后句要用「但是」「可是」「却」来呼应。')
    # 关联词残缺 分类说明
    it = item(d, '关联词残缺', 'grammar')
    for c in it['分类']:
        if c['类'] == '虽然残缺式':
            c['说明'] = '用了「虽然」，后一分句没有「但是」「可是」「却」来呼应。'
    # 2 约数：大约+多 不算病句
    it = item(d, '成分残缺或赘余', 'grammar')
    log.append(rep_list(it['例子'], '病：大约有三百多人参加了会议→改：有三百多人参加了会议（“大约”与“多”重复）',
                        '病：大约有三百人左右参加了会议→改：大约有三百人参加了会议（“大约”与“左右”重复）'))
    it = item(d, '前后矛盾', 'grammar')
    log.append(rep_list(it['例子'], '病：大约有三百多人参加→改：有三百多人参加（删“大约”）',
                        '病：将近有三百多人参加→改：将近有三百人参加（“将近”是不到，“多”是超过，删去“多”）'))
    # 3 语序不当
    it = item(d, '语序不当', 'grammar')
    it['例子'] = [
        '病：我把作业昨天晚上写完了→改：我昨天晚上把作业写完了（时间状语放到“把”前面）',
        '病：我们在学校昨天开了运动会→改：我们昨天在学校开了运动会（先说时间，再说地点）',
        '病：一位优秀的我们班的学生→改：我们班的一位优秀的学生（领属定语放最前）',
        '病：一件红色的妈妈的毛衣→改：妈妈的一件红色的毛衣',
        '病：我们要认真克服并发现缺点→改：我们要发现并认真克服缺点（先发现，后克服）',
        '病：同学们讨论并听取了老师的报告→改：同学们听取并讨论了老师的报告（先听，后讨论）',
    ]
    it['易错'] = '多重定语顺序（领属在最前）、时间和地点状语的先后、动作的先后'
    for c in it['分类']:
        if c['类'] == '状语语序不当':
            c.update({'说明': '状语放错了位置：表示时间的词一般放在地点、「把」字短语前面。', '代表': '时间＋地点／把＋动词',
                      '例子': ['我把作业昨天晚上写完了。']})
    for e in it['例句解析']:
        if e['句'] == '我昨天晚上把作业认真地写完了。':
            e.update({'句': '我把作业昨天晚上写完了。', '析': '表示时间的「昨天晚上」要放在「把作业」前面，改为：我昨天晚上把作业写完了。'})
    for p in it['练习']:
        if p['q'] == '“我昨天晚上把作业认真地写完了”怎么改？':
            p.update({'q': '“我把作业昨天晚上写完了”怎么改？',
                      'options': ['我把作业写完了昨天晚上', '我昨天晚上把作业写完了', '我把昨天晚上作业写完了', '昨天晚上作业我把写完了'],
                      'answer': 1, '解析': '表示时间的「昨天晚上」要放在「把作业」前面。'})
    for _, _, x in yitems(d, 'grammar'):
        if '辨析' in x and '（认真地把作业写完了）' in x['辨析']:
            x['辨析'] = x['辨析'].replace('（认真地把作业写完了）', '（把作业昨天晚上写完了，应为昨天晚上把作业写完了）')
            log.append('辨析:' + x['name'])
    # 4 logic 自相矛盾
    it = item(d, '自相矛盾', 'logic')
    R = {
        '他是众多遇难者中幸免的一个': '他是这次事故中幸免于难的一个',
        '大约三十多人': '将近三十多人',
        '三十多人': '将近三十人',
        '这场球赛胜负未分，结果双方打成平局': '会场上一片寂静，同学们都在大声讨论',
        '这场球赛胜负未分，双方最终握手言和': '会场上一片寂静，同学们都在认真听讲',
    }
    svg = it['图示']
    for a, b in R.items():
        svg = svg.replace('>%s<' % a, '>%s<' % b)
    it['图示'] = svg
    it['例子'] = [
        '错：他是众多死难者中幸免的一个', '对：他是这次事故中幸免于难的一个',
        '错：将近三十多人（“将近”是不到三十，“多”是超过三十，自相矛盾）', '对：将近三十人／三十多人',
        '错：会场上一片寂静，同学们都在大声讨论', '对：会场上一片寂静，同学们都在认真听讲',
        '错：这道题我不会做，但我已经做出来了', '对：这道题我一开始不会做，后来做出来了',
        '错：操场上一个人也没有，只有小明在跑步', '对：操场上只有小明在跑步',
    ]
    it['例句解析'] = [
        {'句': '错：他是众多死难者中幸免的一个',
         '析': '“死难者”就是已经死了的人，“幸免”是没死——同一个人既死了又没死，自己打自己。（“遇难者”也是在灾祸中死去的人，换成它照样矛盾。）改成“他是这次事故中幸免于难的一个”就通了。'},
        {'句': '错：将近三十多人（“将近”是不到三十，“多”是超过三十，自相矛盾）',
         '析': '“将近三十”是还不到三十，“三十多”是已经超过三十——一个说不到，一个说超过，两个意思撞车，留一个就行：“将近三十人”或“三十多人”。注意：“大约三十多人”可以说，“三十多”本身就是一个大概的数。'},
    ]
    for p in it['练习']:
        if p['q'] == '“大约五十多个同学参加了比赛”错在哪里？':
            p.update({'q': '“将近五十多个同学参加了比赛”错在哪里？', 'options': ['数字不对', '“将近”和“多”自相矛盾', '同学写错了'],
                      'answer': 1, '解析': '“将近五十”是不到五十，“五十多”是超过五十，两个意思打架，留一个：“将近五十个同学”或“五十多个同学”。'})
        if p['q'] == '下面哪句自相矛盾？' and '他是遇难者中幸免的一个' in p['options']:
            p['options'] = ['他是这次事故中幸免于难的一个', '他是死难者中幸免的一个', '他是幸存者中的一个']
            p['解析'] = '“死难者”已经死了，不可能“幸免”；另外两句都没有自己打自己。'
        if p['q'] == '“这场球赛胜负未分，结果双方打成平局”为什么错？':
            p.update({'q': '“会场上一片寂静，同学们都在大声讨论”为什么错？',
                      'options': ['会场写错了', '“一片寂静”和“大声讨论”意思打架', '同学们写错了'], 'answer': 1,
                      '解析': '“一片寂静”是一点声音也没有，“大声讨论”却很吵——前后不能同时成立。'})
    it['讲解'] = '前后说法打架：他是众多死难者中幸免的一个（都死了还幸免？）。'
    st = it['动画']['steps']
    if st and st[-1]['note'].startswith('撞车'):
        st[-1]['note'] = '撞车！改成“他是这次事故中幸免于难的一个”'
    save_data(d, tail)
    return log

# ---------------- quiz/data_yuwen.js ----------------
QY = os.path.join(ROOT, 'quiz', 'data_yuwen.js')
QPRE = 'window.NHZ_QUIZ ='


def fix_quiz_yuwen():
    s = open(QY, encoding='utf-8').read()
    m = re.match(r'(window\.NHZ_QUIZ =)(.*?)(;\s*)$', s, re.S)
    body, tail = m.group(2), m.group(3)
    Q = json.loads(body)
    n = 0
    for x in Q['modes']['spot']:
        if x.get('s') == '我昨天晚上把作业认真地写完了':
            x.update({'s': '我把作业昨天晚上写完了', 'fix': '我昨天晚上把作业写完了',
                      'exp': '表示时间的“昨天晚上”要放在“把作业”前面：我昨天晚上把作业写完了。'}); n += 1
        if x.get('s') == '最少也有10多个':
            x.update({'s': '将近有20多个', 'fix': '将近有20个', 'exp': '“将近”是不到20，“多”是超过20，自相矛盾，删去“多”。（“至少有10多个”“大约10多个”可以说。）'}); n += 1
    for x in Q['modes']['choice']:
        if x.get('q') == '“我昨天晚上把作业认真地写完了”的毛病是？':
            x['q'] = '“我把作业昨天晚上写完了”的毛病是？'
            x['exp'] = '表示时间的“昨天晚上”要放在“把作业”前面：我昨天晚上把作业写完了。'
            for m in x['误解标注']:
                m['误解'] = m['误解'].replace('“认真地”', '“昨天晚上”')
                m['正反例'] = [e.replace('语序：认真地把作业写完√', '语序：昨天晚上把作业写完√') for e in m['正反例']]
            n += 1
    for x in Q['modes']['order']:
        if x.get('answer') == '他把作业认真地完成了':
            # 「认真地」放在「把」前后都通，排序题会有两个答案；换成唯一语序
            x.update({'items': ['把', '作业', '写', '完', '了', '他'], 'answer': '他把作业写完了'}); n += 1
    js = json.dumps(Q, ensure_ascii=False, separators=(',', ':'))
    a, b = '语序：认真地把作业写完✗', '语序：把作业昨天写完✗'
    n += js.count(a); js = js.replace(a, b)
    assert '认真地把' not in js and '把作业认真地' not in js
    open(QY, 'w', encoding='utf-8').write(QPRE + js + tail)
    return n


if __name__ == '__main__':
    print('suiran_danshi', fix_suiran())
    print('guanlianci_canque', fix_canque())
    print('labels', fix_labels())
    print('data.js', fix_data())
    print('data_yuwen', fix_quiz_yuwen())
