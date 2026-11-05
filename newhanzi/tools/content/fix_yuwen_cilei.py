#!/usr/bin/env python3
"""F1 语法：「词类/成分分类」四题型题库整库重写工具（选词 / 句子找词 / 填空选词 / 正误判断）。

题库按 types 分块、按 类 分子类；本工具保留每题的位置、题型和子类（可用 cls_map 改名/并类），只重写内容：
  A「下面哪个词是X？」  选项 = 本类 1 个 + 别的类 1 个 + 非本库词 2 个；解析按选项顺序逐个说是什么词
  B「S 句子中的X是？」  选项 = 句子里的 4 个词；解析说为什么
  C「选X填入___处：…」 选项 = 本类 1 个 + 别的类 1 个 + 非本库词 2 个；解析逐个说
  D「下面说法正确的是？」 选项 = 1 条对的完整说法 + 3 条错的；解析逐条
spec = {
  'classes': {类名: {'words': [...], 'sent': [(句子, [4 个词], 答案词)], 'fill': [(带___的句子, 答案词)],
                     'true': [...], 'false': [...], 'why': '这一类的判断理由（一句）'}},
  'non': [(词, 词类), ...],          # 非本库词（干扰项）
  'cls_map': {旧类名: 新类名},        # 可省
}
"""
import random


def qt(x):
    return '「%s」' % x


def _typ(t):
    if t.startswith('下面哪个词是') or t.startswith('下面哪个是'): return 'A'
    if '句子中' in t: return 'B'
    if t.startswith('选'): return 'C'
    if t.startswith('下面说法正确'): return 'D'
    raise ValueError(t)


def regen(d, spec, seed):
    C = spec['classes']; NON = spec['non']; cmap = spec.get('cls_map', {})
    lab = {}
    for c, v in C.items():
        for w in v['words']: lab.setdefault(w, c)
        for _, _, a in v['sent']: lab.setdefault(a, c)
        for _, a in v['fill']: lab.setdefault(a, c)
    for w, l in NON: lab.setdefault(w, l)
    names = list(C)
    cnt = {}; out = []
    for i, q in enumerate(d['questions']):
        cls = cmap.get(q['类'], q['类'])
        typ = _typ(q['q'])
        k = cnt.get((cls, typ), 0); cnt[(cls, typ)] = k + 1
        rng = random.Random('%s|%d' % (seed, i))
        S = C[cls]; oth = [c for c in names if c != cls]
        oc = oth[k % len(oth)]
        if typ in ('A', 'C'):
            if typ == 'A':
                ans = S['words'][k % len(S['words'])]
            else:
                stem, ans = S['fill'][k % len(S['fill'])]
            ow = C[oc]['words'][(k * 3 + 1) % len(C[oc]['words'])]
            n1 = NON[(k * 5) % len(NON)][0]; n2 = NON[(k * 5 + 3) % len(NON)][0]
            if n2 == n1: n2 = NON[(k * 5 + 4) % len(NON)][0]
            opts = [ans, ow, n1, n2]; rng.shuffle(opts)
            rest = '，'.join('%s是%s' % (qt(o), lab[o]) for o in opts if o != ans)
            if typ == 'A':
                exp = '%s是%s：%s其他三个：%s。' % (qt(ans), cls, S['why'], rest)
                nq = {'q': '下面哪个词是%s？' % cls, 'options': opts, 'answer': opts.index(ans), '解析': exp}
            else:
                exp = '题目要%s，填%s：%s。%s其他三个：%s。' % (cls, qt(ans), stem.replace('___', ans).rstrip('。'), S['why'], rest)
                nq = {'q': '选%s填入___处：%s' % (cls, stem), 'options': opts, 'answer': opts.index(ans), '解析': exp}
        elif typ == 'B':
            s, toks, ans = S['sent'][k % len(S['sent'])]
            opts = toks[:]; rng.shuffle(opts)
            exp = '%s中，%s是%s：%s' % (qt(s.rstrip('。')), qt(ans), cls, S['why'])
            nq = {'q': '%s 句子中的%s是？' % (s, cls), 'options': opts, 'answer': opts.index(ans), '解析': exp}
        else:
            true = S['true'][k % len(S['true'])]
            f = S['false'][:]; random.Random('%sD|%s|%d' % (seed, cls, k)).shuffle(f)
            opts = [true] + f[:3]; rng.shuffle(opts)
            exp = true + ' 其他三项都不对：' + '；'.join(x.rstrip('。') for x in f[:3]) + '。'
            nq = {'q': '下面说法正确的是？', 'options': opts, 'answer': opts.index(true), '解析': exp}
        assert len(set(nq['options'])) == 4, nq
        nq['类'] = cls; out.append(nq)
    n = sum(1 for a, b in zip(d['questions'], out) if a != b)
    d['questions'] = out
    return n
