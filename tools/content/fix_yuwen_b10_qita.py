#!/usr/bin/env python3
"""Y 语法 第 10 批：「其他三个分别是另一类X或普通句 / 他类病句或正确句子 / 另外三种用法」套话（报告 yuwen.md §8）。幂等。

原解析只说「A 有X的毛病；其他三个分别是他类病句或正确句子，不是X。」不点名。按选项顺序逐个说清：
  病句题：干扰项若在本库/他库当过病句（「哪个句子有…的毛病」答案、「…属于哪种病句」题干、「把下面病句改正」原句），
          写「也是病句，但毛病是L」；若当过改正后的正确句或被解析判为通顺句，写「是通顺的句子」；
          少量没出处的按 MANUAL 表（只用讲解库/前几批已定的口径：「的」字短语可作宾语、至少+多可以说、
          时间状语要放在处所/描写状语前、介词短语开头吃掉主语）；仍定不了的只写「没有X的毛病」。
  句式题：干扰项若在本库当过某子类答案，写「是L的Y句」；否则按本库规则判普通句（没有把/被/叫/让，
          没有「是…的」，只有一个否定词，存现句开头不是处所词）；了/着/过 按「着/过/句末了/动词后了」判。
  正确项接上讲解库 data.js 同名子类「说明」。
干扰项判下来正好也是X（多解）的题不改，--report 列出。
另：被字句库干扰项「风吹感冒了她/他」（不成话）换成「风把她/他吹感冒了」（主动的把字句）。
用法：python3 fix_yuwen_b10_qita.py [--report]
"""
import os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, items

def n(s): return re.sub(r'[\s。，！？、；：“”"\'‘’「」]', '', str(s))
def bare(s): return str(s).strip().rstrip('。')

OKR = {  # 通顺句的补充说明（前几批已定口径）
    'de': '「…的」是「的」字短语，可以当宾语，句子完整',
    'yueshu': '「至少/最少」加「多」、「有…多」都可以说，不矛盾',
    'ling': '领属定语在最前，顺序没错（多用一个「的」只是不简洁）',
    'zhuang': '时间状语在前，顺序没错',
    'zhu': '有主语，句子完整',
}
MANUAL = {}
def man(kind, lab, *ss):
    for s in ss: MANUAL[n(s)] = (kind, lab)
man('ok', 'de', '小明穿了新的', '他买了红色的', '奶奶做了香喷喷的', '他画了一幅美丽的', '小红读了一本好看的', '爸爸买了大大的', '老师讲了有趣的')
man('ok', None, '奶奶做了香喷喷的饭', '小红读了一本好看的书', '爸爸买了大大的西瓜', '小明穿了新的衣服', '妈妈做了好吃的菜', '老师讲了有趣的故事', '他画了一幅美丽的风景', '他买了红色的衣服',
    '他的身材很瘦小', '他的身材很高大', '他的身材很魁梧', '他的身材很瘦弱', '他很快地睡着了', '他大声地喊叫着', '他认真地思考着问题', '他穿着一件紧身衣',
    '有50多个苹果', '有100多名学生', '有5天多', '有20多分钟', '有10多里路', '有20多人', '有30多本书')
man('ok', 'yueshu', '最少也有5天多', '最少也有10多个', '最少也有30多本书', '最少也有20多人', '最少也有10多里路', '最少也有50多个苹果', '最少也有100多名学生', '最少也有20多分钟')
man('ok', 'ling', '这是她的姐姐的裙子', '这是他的爸爸的车', '这是小明的哥哥的房间', '这是小红的妈妈的手表', '这是我的妈妈的书', '这是我的爷爷的老花镜', '这是他们的同学的书包', '这是我们的老师的办公室')
man('ok', None, '这是我妈妈的书', '这是她姐姐的裙子', '这是他们同学的书包', '这是我爷爷的老花镜', '这是小红妈妈的手表', '这是他爸爸的车', '这是小明哥哥的房间', '这是我们老师的办公室',
    '她认真地在图书馆看书', '他在操场上大声地喊叫', '妈妈在厨房里仔细地做饭', '他认真地在教室里写作业', '她在房间里轻轻地唱歌', '她轻轻地在房间里唱歌',
    '妈妈仔细地在厨房里做饭', '他大声地在操场上喊叫', '她在图书馆认真地看书', '他在教室里认真地写作业')
man('ok', 'zhuang', '他昨天在学校认真地学习', '他早上在公园高兴地跑步', '小明昨天高兴地去公园玩')
man('ok', 'zhu', '在春风的吹拂下，花园里开满了鲜花', '在上课的时候，同学们认真听讲', '在大家的努力下，我们取得了胜利', '当太阳升起的时候，我们开始了一天的学习',
    '经过三天的努力，我们完成了任务', '由于天气原因，学校推迟了运动会', '在老师的教导下，我学会了写字', '由于大家的齐心协力，我们克服了困难')
man('sick', '状语语序不当（时间状语「昨天/早上」应放在前面）', '小明高兴地昨天去公园玩', '他在学校昨天认真地学习', '他在公园早上高兴地跑步')
man('sick', '介词开头式（介词短语开头，后面没说是谁）', '在大家的努力下，取得了胜利', '由于天气原因，推迟了运动会', '经过三天的努力，完成了任务',
    '当太阳升起的时候，开始了一天的学习', '在老师的教导下，学会了写字', '由于大家的齐心协力，克服了困难', '在春风的吹拂下，开满了鲜花')
man('sick', '修饰搭配不当', '他大声地思考着问题', '他专心地睡觉', '她买了一条长长的短裙子', '他戴着一顶小小的大帽子', '他穿着一件宽大的紧身衣', '他静静地喊叫着')
# 「在上课的时候，认真听讲」可读作祈使句（批 2 口径），不判对错，走兜底「没有X的毛病」

CILEI = {}
for w in '跑 吃 跳 唱 写 读 笑 哭 走 游 画 做 玩 看 说 听 飞 打 睡 卖 起 买'.split(): CILEI[w] = '动词'
for w in '美丽 勇敢 善良 高大 雪白 干净 安静 快乐 寒冷 温暖 明亮 柔软 坚硬 聪明 漂亮 开心 红 大 小 高兴 认真 美好 新鲜 诚实 勤劳 活泼 可爱'.split(): CILEI[w] = '形容词'
for w in '很 非常 已经 正在 都 只 常常 也许 不 没 就 才 还 又 也 最 十分 刚刚 马上 一起 再 更 渐渐 忽然'.split(): CILEI[w] = '副词'

def lzg(s):
    s = bare(s)
    if '着' in s: return '着持续式'
    if '过' in s: return '过经历式'
    if s.endswith('了') and '了' not in s[:-1]: return '了₂变化式'
    if '了' in s[:-1]: return '了₁完成式'
    return None

def plain(bank, s):
    s = bare(s)
    if bank == '把字句' and '把' not in s: return '普通句，没有用「把」，不是把字句'
    if bank == '被字句' and not re.search('[被叫让]', s): return '主动句，没有「被/叫/让」，不是被字句' if '把' not in s else '把字句（主动说法），不是被字句'
    if bank == '是…的句' and not re.search('是.+的$', s): return '普通句，没有用「是……的」'
    if bank == '双重否定' and len(re.findall('[不没]', s)) == 1: return '单否定句，只有一个「不」'
    if bank == '存现句' and s.startswith('一'): return '一般主谓句：开头是人或物，不是处所词'
    return None

SUB = {'风吹感冒了她。': '风把她吹感冒了。', '风吹感冒了他。': '风把他吹感冒了。'}

def main(report=False):
    d, _ = load_data()
    WHY = {}; G = collections.defaultdict(set)
    for s, c, it in items(d):
        for f in it.get('分类', []):
            if f.get('说明'):
                WHY[(it['name'], f['类'])] = f['说明'].strip().rstrip('。'); G[f['类']].add(f['说明'].strip().rstrip('。'))
    def why(b, x):
        return WHY.get((b, x)) or (next(iter(G[x])) if len(G.get(x, ())) == 1 else None)
    banks = [(fn,) + load_bank(fn)[:2] for fn in bank_files()]
    SICK = collections.defaultdict(set); OK = set(); CLS = collections.defaultdict(set)
    for fn, name, b in banks:
        for q in b['questions']:
            Q = q['q']; a = q['options'][q['answer']]; c = q.get('类')
            m = re.match(r'下面哪个句子有(.+?)的毛病', Q)
            if m: SICK[n(a)].add((name, m.group(1)))
            m = re.match(r'(.+?)\s*属于哪种病句', Q)
            if m: SICK[n(m.group(1))].add((name, str(a)))
            m = re.match(r'把下面病句改正，正确的是？\n(.+)', Q)
            if m and c: SICK[n(m.group(1))].add((name, c)); OK.add(n(a))
            if '其他三句都是通顺的句子' in q.get('解析', ''):
                OK.update(n(o) for j, o in enumerate(q['options']) if j != q['answer'])
            if re.match(r'下面哪个是(.+?)的(.+?)？', Q) and c: CLS[n(a)].add((name, c))
            m = re.match(r'(.+?)\s*属于哪种用法', Q)
            if m: CLS[n(m.group(1))].add((name, str(a)))
    st = collections.Counter(); rep = []
    for fn, name, b in banks:
        ch = False
        for i, q in enumerate(b['questions']):
            e = q.get('解析', '')
            m = re.search(r'^(.+?)(是|有|表示)(.+?)；其他三个分别是(.+?)，不是(.+?)。$', e)
            if not m: continue
            x = q.get('类'); A = q['options'][q['answer']]
            for j, o in enumerate(q['options']):
                if o in SUB and SUB[o] not in q['options']: q['options'][j] = SUB[o]; st['sub'] += 1
            sick = '毛病' in q['q']
            mm = re.match(r'下面哪个是(.+?)的(.+?)？', q['q']); Y = mm.group(2) if mm else ''
            parts = []; bad = None
            for j, o in enumerate(q['options']):
                if j == q['answer']: continue
                k = n(o); lab = None
                if name == '名词':
                    w = bare(o).strip('“”'); lab = '「%s」是%s' % (w, CILEI[w]) if w in CILEI else None
                    if lab is None: bad = 'cilei ' + w
                elif name == '了/着/过':
                    L = lzg(o)
                    if L == x: bad = 'multi'
                    lab = '「%s」是%s：%s' % (bare(o), L, why(name, L)) if L else None
                elif sick:
                    S = {t for t in SICK.get(k, ()) if t[1] != x or t[0] == name}
                    M = MANUAL.get(k)
                    if S:
                        same = [t for t in S if t[0] == name] or list(S)
                        labs = {t[1] for t in same}
                        if x in labs: bad = 'multi'
                        elif len(labs) == 1: lab = '「%s」也是病句，但毛病是%s' % (bare(o), next(iter(labs)))
                        else: bad = 'labs ' + '/'.join(labs)
                    elif k in OK or (M and M[0] == 'ok'):
                        r = OKR.get(M[1]) if M and M[1] else None
                        lab = '「%s」是通顺的句子%s' % (bare(o), '（%s）' % r if r else '')
                    elif M and M[0] == 'sick':
                        if M[1].startswith(x): bad = 'multi'
                        lab = '「%s」也是病句，但毛病是%s' % (bare(o), M[1])
                    if lab is None and not bad: lab = '「%s」没有%s的毛病' % (bare(o), x); st['fallback'] += 1
                else:
                    C = {t[1] for t in CLS.get(k, ()) if t[0] == name}
                    if x in C: bad = 'multi'
                    elif len(C) == 1: lab = '「%s」是%s的%s' % (bare(o), next(iter(C)), Y)
                    elif len(C) > 1: bad = 'labs'
                    else:
                        p = plain(name, o)
                        lab = '「%s」是%s' % (bare(o), p) if p else None
                        if not p: bad = 'plain ' + bare(o)
                if bad: break
                parts.append(lab)
            if bad:
                st['skip'] += 1; rep.append('%s#%d %s | %s | %s' % (name, i, bad, q['q'][:30], '/'.join(q['options']))); continue
            w = why(name, x); head = m.group(1).strip().strip('“”').rstrip('。')
            verb = m.group(2)
            if name == '名词': first = '「%s」是名词（%s：%s）' % (head, x, w) if w else '「%s」是名词' % head
            elif sick: first = '「%s」有%s的毛病%s' % (bare(A), x, '：' + w if w else '')
            elif name == '了/着/过': first = '「%s」%s%s（%s：%s）' % (bare(A), verb, m.group(3), x, w)
            else: first = '「%s」是%s的%s%s' % (bare(A), x, Y, '：' + w if w else '')
            new = first + '。其他三个：' + '；'.join(parts) + '。'
            if new != e: q['解析'] = new; ch = True; st['fixed'] += 1
        if ch: save_bank(fn, name, b, recount_total=False)
    print(dict(st))
    if report: print('\n'.join(rep))

if __name__ == '__main__':
    main('--report' in sys.argv)
