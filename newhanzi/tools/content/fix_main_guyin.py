#!/usr/bin/env python3
"""MAIN 线 A22-1：古今异义天平剩余 12 词白板生成（幂等，二次运行 0 改动）。

素材只取 newhanzi/data/guwen_knowledge.js「古今异义」本条目（例子 / 分类 古义·今义说明 / 例句解析 / 深讲 / 辨析 / 口诀），
不补整句今译、不编情景。结构与首批 gw_gy_qizi.js 等 4 个手写文件一致：title → fix → vs → end。
天平框里句子超过 12 字（江 河）只放含该词的分句。例子有两句的（可以 汤 去），fix/vs 用第一句，第二句只在 vs 收尾“另见”里列出原句（不加解释）。
用法：python3 tools/content/fix_main_guyin.py [--check]
"""
import json, os, re, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
NH = ROOT
WORDS = {'牺牲': 'xisheng', '无论': 'wulun', '地方': 'difang', '可以': 'keyi', '汤': 'tang', '走': 'zou',
         '去': 'qu', '江': 'jiang', '河': 'he', '涕': 'ti', '臭': 'xiu', '颜色': 'yanse'}


def load():
    js = "global.window=global;require(%s);const c=NHZ_GUWEN_KNOWLEDGE.categories.find(c=>c.id=='guyin');" \
         "console.log(JSON.stringify({intro:c.intro,items:c.items}))" % json.dumps(os.path.join(NH, 'data', 'guwen_knowledge.js'))
    return json.loads(subprocess.check_output(['node', '-e', js]))


def q(s):
    return json.dumps(s, ensure_ascii=False).replace('"', "'") if "'" not in s else json.dumps(s, ensure_ascii=False)


def js(s):  # 单引号 JS 字符串
    assert "'" not in s and '\\' not in s, s
    return "'" + s + "'"


def build(p):
    w = p['name']
    fl = {f['类']: f for f in p['分类']}
    gu, jin = fl['古义']['说明'], fl['今义']['说明']
    ex = p['例子']
    s0 = ex[0]
    jx = {d['句']: d['析'] for d in p['例句解析']}
    why = jx[s0].replace("'", '“', 1).replace("'", '”', 1).replace("'", '“', 1).replace("'", '”', 1)
    sv = s0  # 天平框里放的句子：太长（>12 字）时只取含该词的分句（原文连续子串），整句仍在标题 sub 里
    if len(sv) > 12:
        sv = [c for c in re.split('[，。；]', s0) if w in c][0]
    i = sv.index(w)
    parts = [x for x in [sv[:i], w, sv[i + len(w):]] if x]
    k = parts.index(w)
    sj = p['深讲']
    if len(ex) > 1:
        sj = sj + '另见：' + '；'.join(ex[1:]) + '。'
    rows = []
    rows.append("  { k: 'title', tab: '是什么', t: %s, one: '字形相同、古今意思不同', say: %s }," % (
        js(w), js('“%s”是古今异义词。古今异义是字形相同、古今意思不同的词。' % w)))
    rows.append("  { k: 'fix', tab: '代一代', h: %s, read: %s, ask: '按今义读，对吗？',\n"
                "    bad: %s, err: %s, why: %s,\n"
                "    good: %s, ok: %s, fixSay: %s }," % (
                    js(s0), js('%s。先按今义试读：“%s”是%s。' % (s0, w, jin)),
                    js('%s ＝　%s' % (w, jin)), js(jin), js(why),
                    js('%s ＝　%s' % (w, gu)), js(gu), js('讲不通时换古义：“%s”是%s。' % (w, gu))))
    rows.append("  { k: 'vs', tab: '天平', h: '古今异义天平', sub: %s,\n"
                "    L: { t: '古义', s: [%s], k: %d, n: %s, say: %s },\n"
                "    R: { t: '今义', s: [%s], k: 0, n: %s, say: %s },\n"
                "    end: %s }," % (
                    js(s0), ','.join(js(x) for x in parts), k, js(gu),
                    js('古义：%s。“%s”里用的是古义。' % (gu, s0)),
                    js(w), js(jin), js('今义：%s。' % jin), js(sj)))
    rows.append("  { k: 'end', tab: '口诀', kj: %s, tip: %s }" % (js(p['口诀']), js(p['辨析'])))
    head = ("/* 古文白板：古今异义天平（A22-1，设计 docs/gaijin/guwen-gaijin-sheji.md P1-B）。由 tools/content/fix_main_guyin.py 生成，勿手改。\n"
            "   素材只取自 data/guwen_knowledge.js「古今异义」本条目「%s」（例子 / 分类 古义·今义 / 例句解析 / 深讲 / 辨析 / 口诀），不补整句今译、不编情景。\n"
            "   4 幕：是什么（title）→ 代一代（fix：先代今义 ✗，再换古义 ✓）→ 天平（vs）→ 口诀（end）。 */\n" % w)
    return head + "NHZWB.add(%s, { scenes: [\n%s\n] });\n" % (js('古文:' + w), '\n'.join(rows))


def main():
    check = '--check' in sys.argv
    data = load()
    items = {p['name']: p for p in data['items']}
    changed = 0
    for w, py in WORDS.items():
        out = build(items[w])
        fn = os.path.join(NH, 'wb', 's', 'gw_gy_%s.js' % py)
        old = open(fn, encoding='utf-8').read() if os.path.exists(fn) else None
        if old != out:
            changed += 1
            if not check:
                open(fn, 'w', encoding='utf-8').write(out)
    # 登记 wb/index.js
    ip = os.path.join(NH, 'wb', 'index.js')
    s = open(ip, encoding='utf-8').read()
    add = ''.join('  "古文:%s": "gw_gy_%s",\n' % (w, py) for w, py in WORDS.items() if '"古文:%s"' % w not in s)
    if add:
        changed += 1
        anchor = '  "古文:卑鄙": "gw_gy_beibi",\n'
        assert anchor in s
        s = s.replace(anchor, anchor + add)
        if not check:
            open(ip, 'w', encoding='utf-8').write(s)
    print('改动 %d 处' % changed)
    sys.exit(1 if (check and changed) else 0)


main()
