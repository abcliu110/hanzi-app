#!/usr/bin/env python3
"""F1 语法 4f：歧义句库（报告 §2/§6「鸡不吃了」）。幂等。
「鸡不吃了」是施受（语义）歧义：鸡不吃食了／人不吃鸡了，停顿怎么切都一样，不是切分歧义；而且同型句「鹅不吃了」又在语义歧义题里当干扰项。
→ 切分歧义只用停顿/结构不同造成的句子（咬死了猎人的狗、两个学校的老师…），「鸡不吃了」归语义歧义；整库 300 题重写，干扰项只用别的类或没有歧义的句子。
"""
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank

# (句子, 两种理解, 改明确的句子)
P = {
    '切分歧义': [('咬死了猎人的狗。', '「咬死了｜猎人的狗」（狗被咬死）和「咬死了猎人的｜狗」（狗咬死了猎人）', '那只狗咬死了猎人。'),
              ('两个学校的老师来了。', '「两个｜学校的老师」（两位老师）和「两个学校的｜老师」（两所学校的老师）', '两位学校的老师来了。'),
              ('学生家长都来了。', '「学生、家长」（学生和家长）和「学生的家长」', '学生和家长都来了。'),
              ('我们三个人一组。', '「我们三个人｜一组」（三人同组）和「我们｜三个人一组」（每三人一组）', '我们每三个人分成一组。'),
              ('发现了敌人的哨兵。', '「发现了｜敌人的哨兵」和「发现了敌人的｜哨兵」（哨兵发现了敌人）', '我们的哨兵发现了敌人。')],
    '语义歧义': [('鸡不吃了。', '鸡不吃食了，还是人不吃鸡了', '鸡不吃食了。'),
              ('他走了一个小时。', '「走」是走路（走了一个小时的路），还是离开（离开一个小时了）', '他步行了一个小时。'),
              ('我借了他一本书。', '是我借给他，还是我向他借', '我向他借了一本书。'),
              ('门没有锁。', '门上没有装锁，还是门没有锁上', '门没有锁上。'),
              ('这个人好说话。', '「好（hǎo）说话」是脾气好、容易商量，还是「好（hào）说话」是爱说话', '这个人很爱说话。')],
    '指代歧义': [('他说他不去了。', '第二个「他」是说话的人自己，还是另一个人', '小明说小刚不去了。'),
              ('小明对小刚说他赢了。', '「他」是小明还是小刚', '小明对小刚说：“我赢了。”'),
              ('妈妈对奶奶说她的手机响了。', '「她」是妈妈还是奶奶', '妈妈对奶奶说：“您的手机响了。”'),
              ('小红和小丽是好朋友，她常常帮助她。', '两个「她」分别指谁说不清', '小红和小丽是好朋友，小红常常帮助小丽。'),
              ('老师让小华告诉小林，他明天参加比赛。', '「他」是小华还是小林', '老师让小华告诉小林，小林明天参加比赛。')],
}
PLAIN = ['小明在家里写作业。', '小红在舞台上唱歌。', '爸爸在公司上班。', '我们在操场上跑步。', '奶奶在阳台上浇花。']
WHY = {'切分歧义': '停顿或结构不同，意思就不同', '语义歧义': '词语可以有两种意思或两种施受关系', '指代歧义': '代词指谁说不清'}
ST = {
    '切分歧义': (['切分歧义是停顿不同、结构不同造成的歧义，如「咬死了猎人的狗」。', '「两个学校的老师」可以切成「两个｜学校的老师」，也可以切成「两个学校的｜老师」。', '消除切分歧义可以改换说法，让结构只有一种。'],
              ['「鸡不吃了」是切分歧义。', '切分歧义是代词指代不清。', '切分歧义的句子只有一种意思。', '在句末加「啊」就能消除切分歧义。']),
    '语义歧义': (['「鸡不吃了」是语义歧义：可以是鸡不吃食，也可以是人不吃鸡。', '语义歧义是词语有两种意思或两种施受关系造成的。', '「我借了他一本书」有歧义：不知道是借出还是借入。'],
              ['「鸡不吃了」是切分歧义。', '语义歧义是停顿不同造成的。', '语义歧义的句子不用修改。', '「小明在家里写作业」有语义歧义。']),
    '指代歧义': (['指代歧义是代词（他、她、它）不知道指谁。', '「他说他不去了」里第二个「他」指谁说不清，是指代歧义。', '消除指代歧义可以把代词换成人名。'],
              ['指代歧义是停顿不同造成的。', '「咬死了猎人的狗」是指代歧义。', '指代歧义的句子不用修改。', '在句末加「呢」就能消除指代歧义。']),
}


def lab(s):
    for c, v in P.items():
        if s in [x[0] for x in v]: return c
    return None


def main():
    name, d, fn = load_bank('qiyi_ju')
    C = list(P); cnt = {}; out = []
    for i, q in enumerate(d['questions']):
        cls = q['类']; t = q['q']
        typ = 'A' if t.startswith('下面哪个') else 'B' if '属于哪种' in t else 'C' if t.startswith('把下面') else 'D'
        k = cnt.get((cls, typ), 0); cnt[(cls, typ)] = k + 1
        rng = random.Random('qy|%d' % i); oth = [c for c in C if c != cls]
        s, two, fix = P[cls][k % 5]
        if typ == 'A':
            opts = [s, P[oth[0]][(k + 1) % 5][0], P[oth[1]][(k + 3) % 5][0], PLAIN[k % 5]]; rng.shuffle(opts)
            rest = '，'.join('「%s」%s' % (o.rstrip('。'), ('是' + lab(o)) if lab(o) else '没有歧义') for o in opts if o != s)
            nq = {'q': '下面哪个是%s的歧义句？' % cls, 'options': opts, 'answer': opts.index(s),
                  '解析': '「%s」可以理解成%s，%s，是%s。其他三个：%s。' % (s.rstrip('。'), two, WHY[cls], cls, rest)}
        elif typ == 'B':
            opts = [cls] + oth + ['没有歧义']; rng.shuffle(opts)
            nq = {'q': '%s 属于哪种歧义句？' % s, 'options': opts, 'answer': opts.index(cls),
                  '解析': '「%s」可以理解成%s，%s，所以是%s。' % (s.rstrip('。'), two, WHY[cls], cls)}
        elif typ == 'C':
            b1 = s.rstrip('。') + '啊。'; b2 = s.rstrip('。') + '呢。'
            opts = [fix, s, b1, b2]; rng.shuffle(opts)
            nq = {'q': '把下面歧义句改明确，正确的是？\n%s' % s, 'options': opts, 'answer': opts.index(fix),
                  '解析': '「%s」可以理解成%s。改成「%s」就只有一种意思了。原句不改、句末加「啊」「呢」，两种意思都还在。' % (s.rstrip('。'), two, fix.rstrip('。'))}
        else:
            tr, fl = ST[cls]; tt = tr[k % 3]; f = fl[:]; random.Random('qyD|%s|%d' % (cls, k)).shuffle(f)
            opts = [tt] + f[:3]; rng.shuffle(opts)
            nq = {'q': '下面说法正确的是？', 'options': opts, 'answer': opts.index(tt),
                  '解析': tt + ' 其他三项都不对：' + '；'.join(x.rstrip('。') for x in f[:3]) + '。'}
        assert len(set(nq['options'])) == 4, nq
        nq['类'] = cls; out.append(nq)
    n = sum(1 for a, b in zip(d['questions'], out) if a != b)
    d['questions'] = out; save_bank(fn, name, d)
    from fix_yuwen_io import load_data, save_data, items
    dd, tail = load_data()
    for _, _, it in items(dd, 'grammar'):
        if it.get('例子'):
            it['例子'] = [x.replace('（或：这只鸡不吃了），说清主语', '（或：我们不吃鸡了），说清谁吃谁') for x in it['例子']]
        for c in it.get('分类', []):
            if c.get('类') == '切分歧义' and c.get('代表') == '鸡不吃了':
                c.update({'说明': '停顿（结构）不同，意思不同。', '代表': '咬死了猎人的狗', '例子': ['咬死了猎人的狗。']})
            if c.get('类') == '语义歧义' and '鸡不吃了。' not in c.get('例子', []):
                c['例子'] = ['鸡不吃了。'] + [e for e in c.get('例子', [])][:1]
        for e in it.get('例句解析', []):
            if e.get('句') == '鸡不吃了。' and '切分歧义' in e.get('析', ''):
                e['析'] = '可以是鸡不吃食，也可以是人不吃鸡——停顿怎么切都一样，是谁吃谁说不清，属于语义（施受）歧义。'
    save_data(dd, tail)
    import json
    from fix_yuwen_b4_yingcuo import load_quiz, save_quiz
    fq, pre, Q, tl, sep = load_quiz('data_yuwen.js')
    for x in Q['modes']['choice']:
        if x.get('q') == '“鸡不吃了”有几种理解？':
            j = json.dumps(x, ensure_ascii=False).replace('两种切分两种意思', '谁吃谁不同，有两种意思').replace('的切分', '这种理解').replace('切分', '理解').replace('理解只有“鸡｜不吃了”和“鸡不吃｜了”两种', '只有“鸡不吃食”和“人不吃鸡”两种理解')
            x.clear(); x.update(json.loads(j))
    save_quiz(fq, pre, Q, tl, sep)
    return n


if __name__ == '__main__':
    print('qiyi_ju', main())
