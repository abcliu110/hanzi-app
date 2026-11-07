#!/usr/bin/env python3
"""醉花阴正文改「销魂 / 人比」并统一 data/shici.js 内引文（2026-11-08，负责人 00:55 拍板「全部按照你的建议来」）。

出处：古诗文网《醉花阴·薄雾浓云愁永昼》 https://www.gushiwen.cn/shiwenv_324219410b89.aspx
  正文「莫道不销魂，帘卷西风，人比黄花瘦。」（注：销魂 一作：消魂；人比 一作：人似）
  名句页 https://m.gushiwen.cn/mingju/juv_0c8599b8f15c.aspx 同。

范围（只动 data/shici.js）：
  - poems 里醉花阴末行「莫道不消魂，帘卷西风，人似黄花瘦。」→「莫道不销魂，帘卷西风，人比黄花瘦。」；
    textFix 追加本次说明。pron/pz 不动（销/消同音 xiāo，比/似同为仄声）。
  - knowledge / imagery 等其余字段里该句的异文引文统一成正文。
  - data/shiju.js 字→诗索引（同 build_shici.py 第 8 步算法）只重算受影响的 销/消/比/似 四字，其余字不动。
  - 上片「瑞脑消金兽」古诗文网正文作「销」（一作消），本次未拍板，不改。
幂等：再跑 0 改动。--check：有待改项退出码 1。
用法：python3 newhanzi/tools/content/fix_shici_zuihuayin.py [--check]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io  # noqa: E402

TITLE = '醉花阴·薄雾浓云愁永昼'
NEW = '莫道不销魂，帘卷西风，人比黄花瘦'
OLDS = ['莫道不消魂，帘卷西风，人似黄花瘦', '莫道不消魂，帘卷西风，人比黄花瘦',
        '莫道不销魂，帘卷西风，人似黄花瘦']
AFFECTED = '销消比似'
FIXNOTE = '；2026-11-08 末句按古诗文网正文改「销魂」「人比」'

cnt = {'n': 0}


def fix_str(s):
    for o in OLDS:
        if o in s:
            cnt['n'] += s.count(o)
            s = s.replace(o, NEW)
    return s


def walk(o):
    if isinstance(o, str):
        return fix_str(o)
    if isinstance(o, list):
        return [walk(v) for v in o]
    if isinstance(o, dict):
        return {k: walk(v) for k, v in o.items()}
    return o


def main():
    check = '--check' in sys.argv
    d = io.load('shici')
    ps = [p for p in d['poems'] if p['title'] == TITLE]
    assert len(ps) == 1, len(ps)
    p = ps[0]
    for i, l in enumerate(p['lines']):
        p['lines'][i] = fix_str(l)
    assert NEW + '。' in p['lines'], p['lines']
    if cnt['n'] and FIXNOTE not in p.get('textFix', ''):
        p['textFix'] = p.get('textFix', '') + FIXNOTE
    for k in list(d.keys()):
        if k != 'poems':
            d[k] = walk(d[k])
    # 诗库其余诗里不会有这句；保险起见只处理醉花阴之外的非 lines 字段
    for q in d['poems']:
        if q is p:
            continue
        for k in list(q.keys()):
            if k != 'lines':
                q[k] = walk(q[k])
    # shiju 索引：只重算受本次改字影响的四字
    sj = io.load('shiju')
    idx = {}
    for q in d['poems']:
        seen = set()
        for ch in ''.join(q['lines']):
            if ch not in AFFECTED or ch in seen:
                continue
            seen.add(ch)
            lst = idx.setdefault(ch, [])
            if len(lst) < 8:
                lst.append(q['order'])
    nsj = 0
    for ch in AFFECTED:
        if sj['idx'].get(ch) != idx.get(ch):
            nsj += 1
            if ch in idx:
                sj['idx'][ch] = idx[ch]
            else:
                sj['idx'].pop(ch, None)
    print('改动', cnt['n'], '处；shiju 索引', nsj, '字')
    if check:
        sys.exit(1 if (cnt['n'] or nsj) else 0)
    if cnt['n']:
        io.dump('shici', d)
    if nsj:
        io.dump('shiju', sj)


if __name__ == '__main__':
    main()
