"""F3：逐句讲（shangxi.zj）按 lines 一一对应改写的公共函数。"""
import fix_shici_io as io
def apply(table):
    """table: {(title, author): [译文, ...]}，译文条数必须等于 lines 条数；zj = 原句（去尾标点保留）+ '——' + 译文"""
    s = io.load('shici'); sx = io.load('shangxi'); n = 0
    P = {(p['title'], p['author']): p for p in s['poems']}
    for key, trs in table.items():
        p = P[key]; x = [x for x in sx if (x['t'], x['a']) == key][0]
        assert len(trs) == len(p['lines']), (key, len(trs), len(p['lines']))
        zj = [l + '——' + t for l, t in zip(p['lines'], trs)]
        if x['zj'] != zj:
            x['zj'] = zj; n += 1
    io.dump('shangxi', sx)
    return n
