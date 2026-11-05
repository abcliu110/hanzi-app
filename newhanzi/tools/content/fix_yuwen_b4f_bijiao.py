#!/usr/bin/env python3
"""F1 语法 4f：比较句库（报告 §6 bijiao_ju #0/#1）。幂等。
原子类「更字句」（A比B更…）本身就是比字句，「他比以前更高了」既能判比字句也能判更字句（多解）；干扰项里还有病句
「今天比昨天冷，还要冷」。→ 子类改为比字句 / 没有字句 / 一样句（A跟B一样…，统编常见三种比较说法），整库 300 题重写，
干扰项只用别的比较说法或普通陈述句；「更」作为比字句里的程度加深在说法题里讲。data.js 比较句分类同步。
"""
import os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, load_data, save_data, item

BASE = [('他', '我', '高'), ('今天', '昨天', '冷'), ('西瓜', '苹果', '甜'), ('哥哥', '弟弟', '大'), ('这座山', '那座山', '高'),
        ('夏天', '冬天', '热'), ('这本书', '那本书', '有趣'), ('小明', '小红', '跑得快')]


def mk(cls, a, b, adj):
    if adj.startswith('跑得'):
        return {'比字句': '%s跑得比%s快。', '没有字句': '%s没有%s跑得快。', '一样句': '%s跟%s跑得一样快。'}[cls] % (a, b)
    return {'比字句': '%s比%s%s。', '没有字句': '%s没有%s%s。', '一样句': '%s跟%s一样%s。'}[cls] % (a, b, adj)

CLS = ['比字句', '没有字句', '一样句']
OLD = {'更字句': '一样句'}
WHY = {'比字句': '用「比」引出比较对象，说明前者超过后者', '没有字句': '用「没有」引出比较对象，说明前者比不上后者',
       '一样句': '用「跟（和）……一样」说明两者相同'}
PLAIN = ['今天很冷。', '他长得很高。', '西瓜很甜。', '小明跑得很快。', '这本书很有趣。']
ST = {
    '比字句': (['比字句用「比」引出比较对象，如「他比我高」。', '「他比我更高」也是比字句，「更」表示程度更深。', '「今天比昨天冷」是比字句。'],
            ['「我没有他高」是比字句。', '比字句里没有比较对象。', '「今天比昨天冷，还要冷」是通顺的比字句。', '「我跟他一样高」是比字句。']),
    '没有字句': (['「我没有他高」意思是我比不上他高，不一定是「我比他矮」很多。', '没有字句用「没有」引出比较对象，表示比不上。', '「今天没有昨天冷」是没有字句。'],
             ['「我没有他高」和「我比他高」意思一样。', '没有字句表示前者超过后者。', '「他比我高」是没有字句。', '「我跟他一样高」是没有字句。']),
    '一样句': (['「我跟他一样高」说明两个人高度相同。', '一样句用「跟（和）……一样」表示两者相同。', '「今天和昨天一样冷」是一样句。'],
            ['一样句表示前者超过后者。', '「他比我高」是一样句。', '「我没有他高」是一样句。', '一样句里不需要比较对象。']),
}


def lab(s):
    for c in CLS:
        for a, b, adj in BASE:
            if mk(c, a, b, adj) == s: return c
    return None


def main():
    name, d, fn = load_bank('bijiao_ju')
    cnt = {}; out = []
    for i, q in enumerate(d['questions']):
        cls = OLD.get(q['类'], q['类']); t = q['q']
        typ = 'A' if t.startswith('下面哪个') else 'B' if '属于哪种' in t else 'C' if t.startswith('把下面') else 'D'
        k = cnt.get((cls, typ), 0); cnt[(cls, typ)] = k + 1
        rng = random.Random('bj|%d' % i); oth = [c for c in CLS if c != cls]
        a, b, adj = BASE[k % 8]; s = mk(cls, a, b, adj)
        if typ == 'A':
            b1 = BASE[(k + 3) % 8]; b2 = BASE[(k + 5) % 8]
            opts = [s, mk(oth[0], *b1), mk(oth[1], *b2), PLAIN[k % 5]]; rng.shuffle(opts)
            rest = '，'.join('「%s」%s' % (o.rstrip('。'), ('是' + lab(o)) if lab(o) else '是普通陈述句，没有比较对象') for o in opts if o != s)
            nq = {'q': '下面哪个是%s？' % cls, 'options': opts, 'answer': opts.index(s),
                  '解析': '「%s」%s，是%s。其他三个：%s。' % (s.rstrip('。'), WHY[cls], cls, rest)}
        elif typ == 'B':
            opts = CLS + ['不是比较句']; rng.shuffle(opts)
            nq = {'q': '%s 属于哪种比较句？' % s, 'options': opts, 'answer': opts.index(cls),
                  '解析': '「%s」%s，所以是%s。' % (s.rstrip('。'), WHY[cls], cls)}
        elif typ == 'C':
            adjw = adj.replace('跑得', '')
            if cls == '比字句':
                src = '%s很%s，%s不%s。' % (a, adj if not adj.startswith('跑得') else '跑得快', b, adjw if not adj.startswith('跑得') else '跑得快')
                if adj.startswith('跑得'): src = '%s跑得快，%s跑得不快。' % (a, b)
                ans = mk('比字句', a, b, adj); wrong = [mk('没有字句', a, b, adj), mk('比字句', b, a, adj), mk('一样句', a, b, adj)]
            elif cls == '没有字句':
                src = '%s不%s，%s%s。' % (a, adjw, b, adjw) if not adj.startswith('跑得') else '%s跑得不快，%s跑得快。' % (a, b)
                ans = mk('没有字句', a, b, adj); wrong = [mk('比字句', a, b, adj), mk('没有字句', b, a, adj), mk('一样句', a, b, adj)]
            else:
                src = '%s很%s，%s也很%s，两个差不多。' % (a, adjw, b, adjw) if not adj.startswith('跑得') else '%s跑得快，%s也跑得快，两个差不多。' % (a, b)
                ans = mk('一样句', a, b, adj); wrong = [mk('比字句', a, b, adj), mk('没有字句', a, b, adj), mk('比字句', b, a, adj)]
            opts = [ans] + wrong; rng.shuffle(opts)
            nq = {'q': '把下面句子改成%s，正确的是？\n%s' % (cls, src), 'options': opts, 'answer': opts.index(ans),
                  '解析': '原句的意思改成%s是「%s」。%s，意思要和原句一致；其他三个要么不是%s，要么把比较的意思说反了。' % (cls, ans.rstrip('。'), WHY[cls], cls)}
        else:
            tr, fl = ST[cls]; tt = tr[k % 3]; f = fl[:]; random.Random('bjD|%s|%d' % (cls, k)).shuffle(f)
            opts = [tt] + f[:3]; rng.shuffle(opts)
            nq = {'q': '下面说法正确的是？', 'options': opts, 'answer': opts.index(tt),
                  '解析': tt + ' 其他三项都不对：' + '；'.join(x.rstrip('。') for x in f[:3]) + '。'}
        assert len(set(nq['options'])) == 4, nq
        nq['类'] = cls; out.append(nq)
    n = sum(1 for x, y in zip(d['questions'], out) if x != y)
    d['questions'] = out; save_bank(fn, name, d)
    from fix_yuwen_io import bank_files
    for f2 in bank_files():
        if f2.endswith('bijiao_ju.js'): continue
        n2, d2, _ = load_bank(f2); ch = False
        for q in d2['questions']:
            if '更字句' in q['options'] and '一样句' not in q['options']:
                assert q['options'][q['answer']] != '更字句'
                q['options'] = ['一样句' if o == '更字句' else o for o in q['options']]; ch = True
        if ch: save_bank(f2, n2, d2, recount_total=False)
    dd, tail = load_data()
    it = item(dd, '比较句', 'grammar')
    it['分类'] = [c for c in it['分类'] if c['类'] != '更字句'] + [{'类': '一样句', '说明': '用「跟（和）……一样」表示两者相同。', '代表': 'A 跟 B 一样＋形容词', '例子': ['我跟他一样高。']}]
    it['深讲'] = '比较句常见三种说法：A 比 B ＋形容词（A 超过 B，可加「更」「还」表示程度更深）；A 没有 B ＋形容词（A 比不上 B，不等于 A 比 B 差很多）；A 跟 B 一样＋形容词（两者相同）。'
    for p in it['练习']:
        if p['q'] == '“弟弟比我高半头”属于？': p['options'] = ['比字句', '没有字句', '一样句', '把字句']
        if p['q'] == '“更”表？':
            p.update({'q': '“他比我更高”属于？', 'options': ['比字句', '没有字句', '一样句', '把字句'], 'answer': 0,
                      '解析': '用「比」引出比较对象「我」，是比字句；「更」表示程度更深。', '类': '比字句'})
    it['怎么认'] = ['句子里有没有「比」「没有」「跟……一样」？有。', '这些词后面是不是比较的对象？是的。', '句末是不是说比较的结果（高、冷、跑得快）？是的。']
    save_data(dd, tail)
    return n


if __name__ == '__main__':
    print('bijiao_ju', main())
