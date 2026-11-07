#!/usr/bin/env python3
"""LEFTOVER 2026-11-07 A-05～A-08：古文义项与例句矛盾的几处（幂等；--check 只校验不写）。

依据（逐条）：
1 古今异义「去」：「我以日始出时去人近」的“去”是“距离”，不是“离开”（统编六下《两小儿辩日》注释“去：离；距离”，
  见古诗文网系注释 https://www.gushiwenku.cn/shiwen/0e2c8bd/ 、人教社课件 https://www.renjiaoshe.com/z/686226.html ；
  本库一词多义「去」已把此句归“距离”）。古今异义「去」条目讲的是 古义=离开，故把这句从该条目的 例子/分类/例句解析 撤下，
  只留《陈太丘与友期行》两句（太丘舍去 / 待君久不至，已去），不改讲解。白板 wb/s/gw_gy_qu.js 随后由 fix_main_guyin.py 重生成。
2 一词多义「信」、实词「信」：例句解析「为人谋而不忠乎」句中没有“信”字。换成同章下一句「与朋友交而不信乎」，
  析按杨伯峻《论语译注》1.4 注“信——诚也”、译“同朋友往来是否诚实呢”（http://dh.aks.ac.kr/~red/pdf/%E8%AB%96%E8%AA%9E%E8%AD%AF%E8%A8%BB.pdf ），
  并挂到分类「诚信」下。
3 一词多义「行」：「其身正，不令而行」被归「品行、行为」，此句“行”是政令推行、行得通
  （人民网释义“政令将会畅行无阻”http://theory.people.com.cn/n1/2016/0905/c40531-28690416.html ），不是品行；
  本条目没有“推行”义项，按“无出处不编义项”只撤下这句（例子 / 分类 / 例句解析），不新增义项。
4 虚词「乃」：①「乃不知有汉，无论魏晋」课下注释“乃：竟然”（《桃花源记》，https://www.yjbys.com/wenxue/taohuayuanji/85813.html ），
  原挂在「承接」并析成“承接：于是、就（竟然…）”自相矛盾 → 从「承接」撤下，析改“竟然”；
  ②「乃悟前狼假寐」课文注“乃：才”（《狼》，http://www.yinruiwen.net/news/190736.htm ），原挂「承接」并析成承接 → 从「承接」撤下，析改“才”；
  ③ 图示里「承接」一行例句由「乃不知有汉，无论魏晋」改为同条目已有的「见渔人，乃大惊」。
5 guwen.js《狐假虎威》重点「信：相信」：句「子以我为不信」中“不信”注作“不真实，不可靠”
  （古诗文网系注释 https://74c.net/mingju/46109.html ；cnenc 注释同），重点与 句.对 改为“真实，可靠（不信：不真实，不可靠）”，
  今译「你要是不信」改为「你要是认为我说的不真实」（译意同步，句数不变）。
"""
import json, os, re, sys

NH = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
FK = os.path.join(NH, 'data', 'guwen_knowledge.js')
FG = os.path.join(NH, 'data', 'guwen.js')
PRE = 'window.NHZ_GUWEN_KNOWLEDGE='


def load_k():
    raw = open(FK, encoding='utf-8').read()
    assert raw.startswith(PRE)
    body = raw[len(PRE):]
    tail = ';\n' if body.endswith(';\n') else '\n'
    obj = json.loads(body[:-len(tail)])
    assert PRE + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + tail == raw, '往返不一致'
    return obj, tail, raw


def item(obj, cid, name):
    c = [c for c in obj['categories'] if c['id'] == cid][0]
    r = [i for i in c['items'] if i['name'] == name]
    assert len(r) == 1, (cid, name)
    return r[0]


def drop(lst, s):
    return [x for x in lst if x != s and not (isinstance(x, str) and x.startswith(s + '（'))]


def fix_k(obj):
    n = 0
    # 1 古今异义 去
    it = item(obj, 'guyin', '去')
    S = '我以日始出时去人近'
    if S in it['例子']:
        it['例子'] = drop(it['例子'], S)
        for f in it['分类']:
            f['例子'] = drop(f['例子'], S)
        it['例句解析'] = [d for d in it['例句解析'] if d['句'] != S]
        n += 1
    # 2 一词多义 / 实词 信
    for cid in ('duoyi', 'shici'):
        it = item(obj, cid, '信')
        old, new = '为人谋而不忠乎', '与朋友交而不信乎'
        if old in it['例子']:
            it['例子'] = [new if x == old else x for x in it['例子']]
            for d in it['例句解析']:
                if d['句'] == old:
                    d['句'] = new
                    d['析'] = "'信'在这里是'诚实'的意思：同朋友往来是否诚实呢（《论语·学而》，杨伯峻注：信，诚也）。"
            for f in it['分类']:
                if f['类'] == '诚信' and new not in f['例子']:
                    f['例子'].append(new)
            n += 1
    # 3 一词多义 行
    it = item(obj, 'duoyi', '行')
    S = '其身正，不令而行'
    if S in it['例子']:
        it['例子'] = drop(it['例子'], S)
        for f in it['分类']:
            f['例子'] = drop(f['例子'], S)
        it['例句解析'] = [d for d in it['例句解析'] if d['句'] != S]
        n += 1
    # 4 虚词 乃
    it = item(obj, 'xuci', '乃')
    cj = [f for f in it['分类'] if f['类'] == '承接'][0]
    for S, mean in (('乃不知有汉，无论魏晋', '“乃”表示出乎意料：竟然（问现在是什么朝代，竟然不知道有汉朝，更不必说魏晋。课下注释：乃，竟然）。'),
                    ('乃悟前狼假寐', '“乃”是“才”：屠户这才明白前一只狼是假装睡觉（课文注释：乃，才）。')):
        if S in cj['例子']:
            cj['例子'].remove(S)
            for d in it['例句解析']:
                if d['句'] == S:
                    d['析'] = mean
            n += 1
    old = '<text x="330" y="68" text-anchor="start" font-size="15" fill="#2c3328">乃不知有汉，无论魏晋</text>'
    if old in it['图示']:
        it['图示'] = it['图示'].replace(old, old.replace('乃不知有汉，无论魏晋', '见渔人，乃大惊'))
        n += 1
    return n


G_REPL = [
    ("['信','相信']", "['信','真实，可靠（不信：不真实，不可靠）']"),
    ('["信","相信",{"i":5,"源":"重点"}]', '["信","真实，可靠（不信：不真实，不可靠）",{"i":5,"源":"重点"}]'),
    ('你要是不信，我走在前面', '你要是认为我说的不真实，我走在前面'),
]


def fix_g(raw):
    # 只在《狐假虎威》这一篇里替换
    a = raw.index("title:'狐假虎威'") if "title:'狐假虎威'" in raw else raw.index('"title":"狐假虎威"')
    b = raw.index('\n{', a) if '\n{' in raw[a:] else len(raw)
    seg = raw[a:b]
    n = 0
    for o, w in G_REPL:
        c = seg.count(o)
        if c:
            seg = seg.replace(o, w); n += c
    return raw[:a] + seg + raw[b:], n


def main():
    check = '--check' in sys.argv
    obj, tail, rawk = load_k()
    nk = fix_k(obj)
    newk = PRE + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + tail
    rawg = open(FG, encoding='utf-8').read()
    newg, ng = fix_g(rawg)
    if check:
        if nk or ng:
            print('需要运行 fix_lo_guwen_yiyi.py：知识库 %d 处、guwen.js %d 处' % (nk, ng)); sys.exit(1)
        print('fix_lo_guwen_yiyi 已是最新'); return
    if newk != rawk:
        open(FK, 'w', encoding='utf-8').write(newk)
    if newg != rawg:
        open(FG, 'w', encoding='utf-8').write(newg)
    print('知识库改 %d 处、guwen.js 改 %d 处' % (nk, ng))


if __name__ == '__main__':
    main()
