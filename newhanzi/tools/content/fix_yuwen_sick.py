#!/usr/bin/env python3
"""F1 语法：病句库子类重做工具。

病句库每个子类按 4 种题型排布（同一子类内题目顺序不变，只重写内容）：
  A 「下面哪个句子有X的毛病？」   选项 = 这条病句 + 3 个通顺句（不再用别的病句当干扰项，避免多解）
  B 「S 属于哪种病句？」          选项 = 本子类名 + 3 个别的大类病句名（不放同库兄弟子类，避免分不开）
  C 「把下面病句改正，正确的是？」 选项 = 正确改法 + 原句 + 2 个真实的错误改法（不再用「的的」「XX XX」乱码）
  D 「下面说法正确的是？」         选项 = 对这条病句的正确诊断 + 3 个错误说法（完整句、例句加引号）
每题解析写清楚毛病在哪、怎么改。

条目 item = {
  's': 病句, 'fix': 正确改法, 'why': 毛病说明（接在「S」后面，如「只有前半个「只有」，缺了和它配对的「才」」）,
  'bad': [(错误改法, 为什么不对), (错误改法, 为什么不对)],
  'not': 这条病句「不是」的毛病大类（D 题错误说法用，可省略，默认按 cat 从 CATS 里挑别的大类）,
}
"""
import random, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 病句大类（B 题干扰项 / D 题错误诊断用）：名称 → 用于「毛病是……」的说法
CATS = {
    '主语残缺': '缺少主语',
    '宾语残缺': '缺少宾语',
    '搭配不当': '词语搭配不当',
    '语序不当': '语序不当',
    '重复啰嗦': '意思重复',
    '前后矛盾': '前后矛盾',
    '关联词使用不当': '关联词用错了',
    '指代不明': '指代不明',
}

# 通顺句（A 题干扰项）：简单、无歧义、不含任何病句类型
CORRECT = [
    '小明每天早上七点起床。', '妈妈在厨房里做饭。', '我们班的同学都很喜欢读书。', '秋天到了，树叶慢慢变黄了。',
    '弟弟把玩具收拾得整整齐齐。', '爷爷每天傍晚都去公园散步。', '老师耐心地给我们讲解难题。', '小红送给我一本有趣的故事书。',
    '春天来了，小草从地里钻了出来。', '他认真地完成了今天的作业。', '同学们在操场上快乐地做游戏。', '这只小猫的眼睛又圆又亮。',
    '下课铃一响，大家就跑出了教室。', '奶奶给我织了一条红色的围巾。', '我们要养成按时睡觉的好习惯。', '窗外传来一阵清脆的鸟叫声。',
    '爸爸开车送我去上学。', '星期天，我和妈妈去图书馆看书。', '小河里的水清得能看见小鱼。', '她唱的歌非常好听。',
    '这次春游，大家都玩得很开心。', '哥哥的个子比我高一点。', '我们一起把教室打扫干净了。', '天空中飘着几朵白云。',
]


def qt(x):
    return '「%s」' % x.rstrip('。')


def form_of(q):
    t = q['q']
    if t.startswith('下面哪个句子有'): return 'A'
    if '属于哪种病句' in t: return 'B'
    if t.startswith('把下面病句改正'): return 'C'
    if t.startswith('下面说法正确'): return 'D'
    return None


def q_of(label, cat, it, form, k, seed, siblings=()):
    rng = random.Random(seed)
    s, fix, why = it['s'], it['fix'], it['why']
    if form == 'A':
        pool = [c for c in CORRECT if c != fix]
        start = (k * 3) % len(pool)
        dis = [pool[(start + j) % len(pool)] for j in range(3)]
        opts = dis + [s]; rng.shuffle(opts)
        return {'q': '下面哪个句子有%s的毛病？' % label, 'options': opts, 'answer': opts.index(s),
                '解析': '%s%s，应改为%s。其他三句都是通顺的句子。' % (qt(s), why, qt(fix))}
    if form == 'B':
        others = [c for c in CATS if c != cat and c not in siblings]
        rng2 = random.Random(seed + 'B'); rng2.shuffle(others)
        opts = others[:3] + [label]; rng.shuffle(opts)
        return {'q': '%s 属于哪种病句？' % s, 'options': opts, 'answer': opts.index(label),
                '解析': '%s%s，属于%s。应改为%s。' % (qt(s), why, label, qt(fix))}
    if form == 'C':
        (b1, r1), (b2, r2) = it['bad']
        opts = [fix, s, b1, b2]; rng.shuffle(opts)
        return {'q': '把下面病句改正，正确的是？\n%s' % s, 'options': opts, 'answer': opts.index(fix),
                '解析': '%s%s，改成%s才通顺。%s%s；%s%s。' % (qt(s), why, qt(fix), qt(b1), r1, qt(b2), r2)}
    if form == 'D':
        nots = it.get('not') or [CATS[c] for c in CATS if c != cat]
        rng2 = random.Random(seed + 'D')
        wrong_cat = nots[rng2.randrange(len(nots))]
        true = '%s%s，应改为%s。' % (qt(s), why, qt(fix))
        f1 = '%s是通顺的句子，不用修改。' % qt(s)
        f2 = '%s的毛病是%s。' % (qt(s), wrong_cat)
        f3 = '%s应改为%s。' % (qt(s), qt(it['bad'][1][0] if it['bad'][1][0] != s else it['bad'][0][0]))
        opts = [true, f1, f2, f3]; rng.shuffle(opts)
        return {'q': '下面说法正确的是？', 'options': opts, 'answer': opts.index(true),
                '解析': '%s%s，应改为%s。它不是通顺的句子，毛病也不是%s。' % (qt(s), why, qt(fix), wrong_cat)}
    raise ValueError(form)


def regen_class(d, old_cls, items, label=None, cat='', siblings=(), new_cls=None, seed=''):
    """重写子类 old_cls 的全部题目；返回改写数。label 为题面上的子类名（默认 = 新类名）。"""
    new_cls = new_cls or old_cls
    label = label or new_cls
    k = {}
    n = 0
    for i, q in enumerate(d['questions']):
        if q['类'] not in (old_cls, new_cls): continue
        f = form_of(q)
        if not f: continue
        j = k.get(f, 0); k[f] = j + 1
        it = items[j % len(items)]
        nq = q_of(label, cat, it, f, j // len(items), '%s|%d' % (seed, i), siblings)
        nq['类'] = new_cls
        if nq != q:
            d['questions'][i] = nq; n += 1
    return n
