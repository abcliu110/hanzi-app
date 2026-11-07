#!/usr/bin/env python3
"""GW 线 · A21 遗留「逐字对译点读」数据：给 guwen.js 其余篇目逐句加 句[]（原/今/对/式，有出处的加 停），
并给已有 句[] 的篇目补 式。幂等：二次运行 0 改动；--check 只校验不写（有待写改动时退出码 1）。

字段格式沿用 tools/content/fix_gw_ju_tingdui.py 头注（MAIN/quiz/songdu 已按此读取），本脚本新增 式：
  句: [ { 原, 今?, 停?, 停源?, 对?, 式? } ]
  · 原：原文按 。！？（连同其后的 ”’）切句，逐句拼接 == 原文（断言）。
  · 今：仓库已有 译意 按同样规则切句，句数与原文相同才逐句给（断言拼接 == 译意）；下表 JIN_FIX 两篇做了
        机械拆并（陋室铭首句今译按“；”拆成两句；岳阳楼记节选的编者括注句不对应原文，该句不给 今）。
        其余篇逐句对照已人工通读（2026-11-07 GW），未发现错位。
  · 对：只取本篇 重点 注释 [词, 释义, {i, 源:'重点'}]。本批新标的篇目只收「该词在全篇原文里只出现一次」的注释
        （出现多次时不知道注的是哪一处，不标；比 2026-11-05 小学 13 篇的「标第一次出现」更严）。不编今译。
  · 式：句式标签 [{名, 点, 析}]，只取 data/guwen_knowledge.js 语法类（句式与固定句式）条目里的
        例子 / 分类例子 / 例句解析 句子（去标点 ≥3 字）逐字出现在本句里的；析 = 该条 例句解析 的原话（没有则空）。
        同一句命中「倒装句」又命中其子点（宾语前置/定语后置/状语后置/主谓倒装）时只留子点。
        SHI_SKIP 列出人工排除的命中（知识库作对照例收入、并不是该句式的）。
  · 停 / 停源：只有 TING 表里给了出处的篇目才加，照抄出处斜线（标点按本应用原文），去 / 后 == 原（断言）。
范围：所有还没有 句[] 的篇目，《伯牙鼓琴》除外（本条为《列子》版，课本为《吕氏春秋》版，Q11 待负责人定）。
运行：python3 tools/content/fix_gw_a21_duiyi.py [--check]"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'data', 'guwen.js')
SEN = re.compile(r'[^。！？]+[。！？][”’]*')
SKIP = {'伯牙鼓琴'}
HZ = lambda s: re.sub(r'[^\u3400-\u9fff]', '', s or '')

# 今译机械拆并：title -> 函数(按 SEN 切好的译意句列表) -> 与原文句数相同的列表，None 表示该句不给 今
def _loushi(jj):
    a, b = jj[0].split('；', 1)
    return [a + '；', b] + jj[1:]
def _yueyang(jj):
    # 今9 “……（这里节选略去了两段……欢喜。” + 今10 “）唉！” 对应原文 “……嗟夫！”；含编者括注，不作该句今译
    assert jj[9].startswith('……（') and jj[10] == '）唉！', jj[9:11]
    return jj[:9] + [None] + jj[11:]
JIN_FIX = {'陋室铭': _loushi, '岳阳楼记（节选）': _yueyang}

# 句式命中人工排除：(条目名, 篇名, 原文句子片段) —— 原因写在右边
SHI_SKIP = {
    ('之所以', '生于忧患死于安乐', '所以动心忍性'),  # 知识库析“所以”是“用来”，是与“之所以”对照的例子，本句不是该句式
}

# 朗读停顿：title -> (出处, [每句带 / 的停顿或 None])
LY = 'http://www.lunyu8.cn/lunyuduanju/（论语网「论语停顿节奏划分」，按章号 %s）'
TING = {
 '陋室铭': ('http://www.yinruiwen.net/news/184660.htm（中学语文教学资源网《陋室铭》教案〔人教版七年级下册〕“划分出朗读节奏”点拨，原文用 | 标）',
   ["山/不在高，有仙/则名。", "水/不在深，有龙/则灵。", "斯是/陋室，惟吾/德馨。", "苔痕/上阶/绿，草色/入帘/青。", "谈笑/有/鸿儒，往来/无/白丁。",
    "可以/调/素琴，阅/金经。", "无/丝竹/之乱耳，无/案牍/之劳形。", "南阳/诸葛庐，西蜀/子云亭。", "孔子/云：何陋/之有？"]),
 '学而时习之': (LY % '1.1', ["子曰：“学而/时习之，不亦/说乎？", "有朋/自远方来，不亦/乐乎？", "人不知/而不愠，不亦/君子乎？”"]),
 '吾日三省吾身': (LY % '1.4', ["曾子曰：“吾日/三省吾身：为人谋/而不忠乎？", "与朋友交/而不信乎？", "传/不习乎？”"]),
 '温故而知新': (LY % '2.11', ["子曰：“温故/而知新，可以/为师矣。”"]),
 '学而不思则罔': (LY % '2.15', ["子曰：“学而/不思/则罔，思而/不学/则殆。”"]),
 '三人行必有我师': (LY % '7.22', ["子曰：“三人/行，必有/我师焉。", "择其/善者/而从之，其/不善者/而改之。”"]),
 '己所不欲勿施于人': (LY % '15.24', ["子贡/问曰：“有一言/而可以/终身行之者/乎？”", "子曰：“其/恕乎！", "己/所不欲，勿/施于人。”"]),
}


def load():
    js = ('const fs=require("fs"),vm=require("vm");const window={};'
          'vm.runInNewContext(fs.readFileSync(process.argv[1],"utf8"),{window});'
          'vm.runInNewContext(fs.readFileSync(process.argv[2],"utf8"),{window});'
          'process.stdout.write(JSON.stringify({T:window.NHZ_GUWEN.texts,K:window.NHZ_GUWEN_KNOWLEDGE}));')
    d = json.loads(subprocess.run(['node', '-e', js, G, os.path.join(ROOT, 'data', 'guwen_knowledge.js')],
                                  check=True, capture_output=True).stdout.decode())
    return d['T'], d['K']


SHI_NOT = {'主语', '谓语', '宾语', '定语', '状语', '补语', '语法与虚词、词类活用的关系'}
DAOZHUANG_SUB = {'宾语前置', '定语后置', '状语后置', '主谓倒装'}


def shi_examples(K):
    """[(条目名, key, 例句, 析)]"""
    y = [c for c in K['categories'] if c['id'] == 'yufa'][0]
    out = []
    for it in y['items']:
        if it['name'] in SHI_NOT:
            continue
        exs = []
        for e in it.get('例子') or []:
            if isinstance(e, str): exs.append((e, ''))
        for c in it.get('分类') or []:
            for e in c.get('例子') or []:
                if isinstance(e, str): exs.append((e, ''))
        for e in it.get('例句解析') or []:
            if isinstance(e, dict) and e.get('句'): exs.append((e['句'], e.get('析') or ''))
        for s, xi in exs:
            if len(HZ(s)) >= 3:
                out.append((it['name'], it['key'], s, xi))
    return out


def shi_for(title, sent, EX):
    hits = {}
    h = HZ(sent)
    for name, key, ex, xi in EX:
        if HZ(ex) not in h:
            continue
        if any(n == name and tt == title and frag in sent for n, tt, frag in SHI_SKIP):
            continue
        cur = hits.get(key)
        if cur is None:
            hits[key] = {'名': name, '点': key, '析': xi}
        elif xi and not cur['析']:
            cur['析'] = xi
    if any(v['名'] in DAOZHUANG_SUB for v in hits.values()):
        hits = {k: v for k, v in hits.items() if v['名'] != '倒装句'}
    return sorted(hits.values(), key=lambda v: v['点'])


def build(t, EX):
    yw, yy = t['原文'], t['译意']
    ss = SEN.findall(yw); assert ''.join(ss) == yw, t['title']
    jj = SEN.findall(yy)
    jin = None
    if ''.join(jj) == yy:
        if t['title'] in JIN_FIX:
            jin = JIN_FIX[t['title']](jj)
        elif len(jj) == len(ss):
            jin = jj
    if jin is not None:
        assert len(jin) == len(ss), (t['title'], len(jin), len(ss))
    src, ting = TING.get(t['title'], (None, None))
    if ting: assert len(ting) == len(ss), (t['title'], len(ting), len(ss))
    starts, p = [], 0
    for s in ss: starts.append(p); p += len(s)
    dui = [[] for _ in ss]
    for z, g in t['重点']:
        if not z or yw.count(z) != 1:
            continue
        k = yw.find(z)
        si = max(i for i, st in enumerate(starts) if st <= k)
        if k + len(z) > starts[si] + len(ss[si]): continue
        dui[si].append([z, g, {'i': k - starts[si], '源': '重点'}])
    out = []
    for i, s in enumerate(ss):
        o = {'原': s}
        if jin and jin[i]: o['今'] = jin[i]
        if ting and ting[i] is not None:
            assert ting[i].replace('/', '') == s, (t['title'], i, ting[i], s)
            o['停'] = ting[i]; o['停源'] = src
        if dui[i]: o['对'] = sorted(dui[i], key=lambda x: x[2]['i'])
        sh = shi_for(t['title'], s, EX)
        if sh: o['式'] = sh
        out.append(o)
    return out


def add_shi(t, EX):
    """已有 句[] 的篇目只补 式，其余字段原样"""
    out = []
    for o in t['句']:
        o = dict(o)
        sh = shi_for(t['title'], o['原'], EX)
        if sh: o['式'] = sh
        elif '式' in o: del o['式']
        out.append(o)
    return out


def write_block(s, title, ju):
    line = '句:' + json.dumps(ju, ensure_ascii=False, separators=(',', ':'))
    tag = "{title:'%s'," % title
    i = s.find(tag); assert i >= 0, title
    j = s.find('\n{title:', i + 1)
    if j < 0: j = s.rindex('\n]};')
    blk = s[i:j]
    end = blk.rstrip().rstrip(',').rstrip()
    assert end.endswith('}')
    tail = blk[len(end):]
    if '\n句:' in end:   # 句 总是篇目块最后一行（fix_gw_ju_tingdui.py 同此约定）
        pre = end[:end.index('\n句:')]
        pre = pre[:-1] if pre.endswith(',') else pre
    else:
        pre = end[:-1]
    nb = pre + ',\n' + line + '}'
    return s[:i] + nb + tail + s[j:]


def main():
    check = '--check' in sys.argv
    T, K = load()
    EX = shi_examples(K)
    s = open(G, encoding='utf8').read(); orig = s
    stat = {'篇': 0, '句': 0, '今': 0, '对': 0, '式': 0, '停': 0, '补式篇': 0}
    for t in T:
        if t['title'] in SKIP: continue
        if t.get('句') and t.get('ke') == '小学课内':
            ju = add_shi(t, EX)
            if any('式' in o for o in ju): stat['补式篇'] += 1
        else:
            ju = build(t, EX); stat['篇'] += 1
        for o in ju:
            stat['句'] += 1; stat['今'] += '今' in o; stat['对'] += len(o.get('对', []))
            stat['式'] += len(o.get('式', [])); stat['停'] += '停' in o
        if json.dumps(t.get('句'), ensure_ascii=False, sort_keys=True) != json.dumps(ju, ensure_ascii=False, sort_keys=True):
            s = write_block(s, t['title'], ju)
    print('统计', stat)
    if check:
        print('需要写入' if s != orig else '已是最新'); sys.exit(1 if s != orig else 0)
    if s != orig: open(G, 'w', encoding='utf8').write(s)
    print('已写入' if s != orig else '无改动')


if __name__ == '__main__':
    main()
