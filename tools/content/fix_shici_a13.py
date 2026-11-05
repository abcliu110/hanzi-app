#!/usr/bin/env python3
"""F3 古诗线 A13 待定异文 9 项（2026-11-05，用户授权按通行本+教材统一直接改）。
幂等：每处改前断言旧文仍在，改后断言旧文为 0、新文就位。

依据（均已联网核对）：
1) 剑客「把似君」→「把示君」：古诗文网主文「今日把示君，谁有不平事？（示 一作：似）」
   （m.gushiwen.cn mingju_juv_415645baae9a）。「谁为/谁有」各本分歧，未列入本次项，不动。
2) 宣州谢朓楼「览日月」→「览明月」、「销愁」→「消愁」：古诗文网主文
   「欲上青天揽明月。（揽 一作：览；明月 一作：日月）」「举杯消愁愁更愁。（消愁 一作：销愁）」；
   本次只改明月+消愁，览/揽不动。
3) 将进酒「君莫停」→「杯莫停」：古诗文网主文「将进酒，杯莫停。（杯莫停 一作：君莫停）」，
   统编高中语文必修上册同。「侧耳听/倾耳听」未列入本次项，不动。
4) 夜上受降城闻笛作者李益：诗库/赏析/飞花令/基础游戏已是李益，核实无改。
5) 白云歌「多白云」→「皆白云」：《全唐诗》卷一六六〈一作“白云歌送友人”云〉
   「楚山秦山皆白云，白云处处长随君。君今还入楚山里，云亦随君渡湘水。水上女萝衣白云，
   早卧早行君早起。」——本库其余 5 句与该一作本已一致，只改首句一字。
6) 白门前按通行本：本条为《上之回》别本（《李贺歌诗编》题《白门前》），原 11 句多处为
   校勘本讹字；文字据《全唐诗》卷三九三《上之回》通行本
   「上之回，大旗喜。悬红云，挞凤尾。剑匣破，舞蛟龙。蚩尤死，鼓逢逢。天高庆雷齐坠地，
   地无惊烟海千里。」改写，保留别本题名与首句「白门前」；逐句讲、艺术特色、背景同步重写，
   飞花令条目同步替换（含删末尾三条杂项「前八句仅数字不同/末四句/空」）。
7) 独坐敬亭山·其二标存疑：诗库标题/注/赏析标题已有（存疑）；飞花令题名补（存疑），
   与诗库标题统一。
8) 使至塞上「候吏」→「候骑」：与教材统一（初中语文八年级上册「萧关逢候骑」；
   古诗文网该页作「侯骑」，从教材）。
9) check 字段：9 首仍为「待核对」——本次只核对了所改字句，未对整首逐字核对，
   按任务要求不批量改 check。

同步范围：诗库 shici.js、赏析 shangxi.js、题库 quiz/data_shici.js、飞花令
games/shici/data_feihua.js、字→诗索引 shiju.js（按 build_shici.py 第 8 步重建）。
不改：games/shici/jichu/*.html 内嵌的旧版诗句（与本线不同步的另一份拷贝，见汇总）。
"""
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'newhanzi'))
HZ = re.compile(r'[\u3400-\u9fff\U00020000-\U0002ffff]')


def hz(s):
    return ''.join(HZ.findall(s or ''))


def poem(S, title):
    ps = [p for p in S['poems'] if p['title'] == title]
    assert len(ps) == 1, title
    return ps[0]


def shangxi(SX, title):
    xs = [x for x in SX if x['t'] == title]
    assert len(xs) == 1, title
    return xs[0]


def re_prefix_zj(x, p, old_lines=None):
    """按 build_shici.py 第 7 步：zj 每条的原句前缀按新 lines 重写（去标点匹配）。
    本次有改字的行：旧行去标点后也映射到新行。"""
    byhz = {hz(l): l for l in p['lines']}
    if old_lines:
        for old, new in zip(old_lines, p['lines']):
            byhz.setdefault(hz(old), new)
    out = []
    for z in x.get('zj', []):
        if '——' in z:
            pre, rest = z.split('——', 1)
            if hz(pre) in byhz:
                z = byhz[hz(pre)] + '——' + rest
        out.append(z)
    assert len(out) == len(p['lines']), (x['t'], len(out), len(p['lines']))
    x['zj'] = out


S = io.load('shici')
SX = io.load('shangxi')
Q = io.load('quiz')
c = {}

# ---------- 1) 剑客：把似君 → 把示君 ----------
p = poem(S, '剑客')
old = list(p['lines'])
assert p['lines'][2] == '今日把似君，'
p['lines'][2] = '今日把示君，'
x = shangxi(SX, '剑客')
x['ys'] = x['ys'].replace('今日把似君是转折', '今日把示君是转折')
re_prefix_zj(x, p, old)
assert '把似君' not in json.dumps(x, ensure_ascii=False)
c['jianke'] = '诗库+赏析'

# ---------- 2) 宣州谢朓楼：览日月 → 览明月，销愁 → 消愁 ----------
p = poem(S, '宣州谢朓楼饯别校书叔云')
old = list(p['lines'])
assert p['lines'][7] == '欲上青天览日月。'
assert p['lines'][9] == '举杯销愁愁更愁。'
p['lines'][7] = '欲上青天览明月。'
p['lines'][9] = '举杯消愁愁更愁。'
x = shangxi(SX, '宣州谢朓楼饯别校书叔云')
re_prefix_zj(x, p, old)
c['xuanzhou'] = '诗库+赏析'

# ---------- 3) 将进酒：君莫停 → 杯莫停 ----------
p = poem(S, '将进酒')
old = list(p['lines'])
assert p['lines'][13] == '君莫停。'
p['lines'][13] = '杯莫停。'
x = shangxi(SX, '将进酒')
re_prefix_zj(x, p, old)
c['jiangjinjiu'] = '诗库+赏析'

# ---------- 4) 夜上受降城闻笛：作者已是李益，核实无改 ----------
p = poem(S, '夜上受降城闻笛')
assert p['author'] == '李益'
assert shangxi(SX, '夜上受降城闻笛')['a'] == '李益'
c['shoujiangcheng'] = '已是李益，无改'

# ---------- 5) 白云歌：多白云 → 皆白云 ----------
p = poem(S, '白云歌送友人')
old = list(p['lines'])
assert p['lines'][0] == '楚山秦山多白云，'
p['lines'][0] = '楚山秦山皆白云，'
x = shangxi(SX, '白云歌送友人')
re_prefix_zj(x, p, old)
c['baiyunge'] = '诗库+赏析'

# ---------- 6) 白门前：按《上之回》通行本重写 ----------
p = poem(S, '白门前')
assert len(p['lines']) == 11 and p['lines'][0] == '白门前，'
p['lines'] = ['白门前，', '大旗喜。', '悬红云，', '挞凤尾。', '剑匣破，',
              '舞蛟龙。', '蚩尤死，', '鼓逢逢。', '天高庆雷齐坠地，', '地无惊烟海千里。']
p['note'] = '此诗为《上之回》别本（《李贺歌诗编》题《白门前》）；文字据《全唐诗》卷三九三《上之回》通行本，首句从别本题作“白门前”'
x = shangxi(SX, '白门前')
x['bg'] = '李贺的古体诗，是乐府旧题《上之回》的别本，写天子凯旋归来的热闹场面。具体背景已不可考。'
x['zj'] = ['白门前，——在白门前。',
           '大旗喜。——大旗欢舞招展。',
           '悬红云，——红旗连成一片，像红云悬在天上。',
           '挞凤尾。——旗端羽饰随风卷。',
           '剑匣破，——宝剑破匣腾空起。',
           '舞蛟龙。——恰如蛟龙舞蹁跹。',
           '蚩尤死，——黄帝凯旋，蚩尤死了。',
           '鼓逢逢。——战鼓咚咚声震天。',
           '天高庆雷齐坠地，——高天上庆贺的雷声一齐落到地上。',
           '地无惊烟海千里。——地上没有战火的烟尘，海内千里一片太平。']
x['ys'] = '白门前、大旗喜写天子凯旋归来；悬红云、挞凤尾写旗仗的威仪；剑匣破、舞蛟龙写宝剑出匣；蚩尤死、鼓逢逢写胜利的鼓声；天高庆雷齐坠地、地无惊烟海千里写天地同庆。全诗像一组快闪的画面，奇崛瑰丽，是李贺的风格。此诗为《上之回》别本。'
assert len(x['zj']) == len(p['lines'])
c['baimenqian'] = '诗库+赏析重写'

# ---------- 7) 独坐敬亭山·其二：诗库已有（存疑），飞花令题名同步（见下） ----------
p = poem(S, '独坐敬亭山·其二（存疑）')
assert '存疑' in p['title'] and '存疑' in (p.get('note') or '')
assert shangxi(SX, '独坐敬亭山·其二（存疑）')['t'].endswith('（存疑）')
c['jingtingshan2'] = '诗库已有存疑，飞花令题名同步'

# ---------- 8) 使至塞上：候吏 → 候骑 ----------
p = poem(S, '使至塞上')
old = list(p['lines'])
assert p['lines'][6] == '萧关逢候吏，'
p['lines'][6] = '萧关逢候骑，'
x = shangxi(SX, '使至塞上')
re_prefix_zj(x, p, old)
c['shizhisaishang'] = '诗库+赏析'

# check 字段一律不动
for t in ['剑客', '宣州谢朓楼饯别校书叔云', '将进酒', '夜上受降城闻笛', '白云歌送友人',
          '白门前', '独坐敬亭山·其二（存疑）', '使至塞上']:
    assert poem(S, t)['check'].startswith('待核对'), t

io.dump('shici', S)
io.dump('shangxi', SX)

# ---------- 题库：剑客「把似君」7 处 → 「把示君」 ----------
qs = json.dumps(Q, ensure_ascii=False)
assert qs.count('把似君') == 7, qs.count('把似君')
qs = qs.replace('把似君', '把示君')
Q = json.loads(qs)
# order38 单字排序题：items 里的单字「似」→「示」
o38 = Q['modes']['order'][38]
assert o38['answer'] == '今日把示君。' and '似' in o38['items']
o38['items'] = ['示' if v == '似' else v for v in o38['items']]
assert ''.join(sorted(o38['items'])) == ''.join(sorted(list('今日把示君')))
io.dump('quiz', Q)
c['quiz'] = '剑客 7 处 + order38 单字 1 处'

# ---------- 飞花令：文本级替换（文件后有 A22-14 桥接代码，不走 io.load） ----------
fpath = os.path.join(ROOT, 'games/shici/data_feihua.js')
f = open(fpath, encoding='utf-8').read()
head, sep, tail = f.partition('];\n')
assert sep, '飞花令 POEMS 数组结尾未找到'
arr = head
repl = [
    ('"今日把似君"', '"今日把示君"'),
    ('"君莫停"', '"杯莫停"'),
    ('"欲上青天览日月"', '"欲上青天览明月"'),
    ('"举杯销愁愁更愁"', '"举杯消愁愁更愁"'),
    ('"楚山秦山多白云"', '"楚山秦山皆白云"'),
    ('"萧关逢候吏"', '"萧关逢候骑"'),
    ('"独坐敬亭山（其二）"', '"独坐敬亭山·其二（存疑）"'),
]
for a, b in repl:
    assert arr.count(a) == 1, (a, arr.count(a))
    arr = arr.replace(a, b)
old_bmq = '{"t": "白门前", "a": "李贺", "lines": ["白门前", "大楼喜", "悬虹云", "挞龙尾", "剑破匣", "舞蛟龙", "蚩尤死", "鼓龙蓬", "天堕地", "无惊飞", "海千里", "前八句仅数字不同", "末四句", ""]}'
new_bmq = '{"t": "白门前", "a": "李贺", "lines": ["白门前", "大旗喜", "悬红云", "挞凤尾", "剑匣破", "舞蛟龙", "蚩尤死", "鼓逢逢", "天高庆雷齐坠地", "地无惊烟海千里"]}'
assert arr.count(old_bmq) == 1
arr = arr.replace(old_bmq, new_bmq)
# 《鼓吹曲辞将进酒》条目已有「杯莫停」，不动；断言飞花令里不再有旧文
assert '"君莫停"' not in arr and '把似君' not in arr and '览日月' not in arr
assert '销愁' not in arr and '多白云' not in arr and '候吏' not in arr
open(fpath, 'w', encoding='utf-8').write(arr + sep + tail)
c['feihua'] = '7 处替换 + 白门前整条 + 敬亭其二题名'

# ---------- shiju 重建（build_shici.py 第 8 步） ----------
idx, meta = {}, {}
for p in S['poems']:
    meta[str(p['order'])] = {'t': p['title'], 'a': p['author']}
    seen = set()
    for ch in hz(''.join(p['lines'])):
        if ch in seen:
            continue
        seen.add(ch)
        lst = idx.setdefault(ch, [])
        if len(lst) < 8:
            lst.append(p['order'])
SJ = io.load('shiju')
SJ['idx'] = idx
SJ['meta'] = meta
io.dump('shiju', SJ)
c['shiju'] = '重建'

print(json.dumps(c, ensure_ascii=False, indent=2))
print('A13 完成：旧文残留检查')
for pat in ['把似君', '览日月', '销愁', '候吏', '多白云', '大楼喜', '悬虹云', '鼓龙蓬']:
    n = sum(open(os.path.join(ROOT, f), encoding='utf-8').read().count(pat)
            for f in ['data/shici.js', 'data/shangxi.js', 'quiz/data_shici.js',
                      'games/shici/data_feihua.js'])
    print(f'  {pat}: {n}')
    assert n == 0, pat
print('  君莫停（诗库/飞花令《将进酒》条目）：',
      open(os.path.join(ROOT, 'data/shici.js'), encoding='utf-8').read().count('君莫停'),
      open(os.path.join(ROOT, 'games/shici/data_feihua.js'), encoding='utf-8').read().count('"君莫停"'))
