#!/usr/bin/env python3
"""BS 批 3：部首「家族含义」fm 逐条复核（bushou_ui.md 第 5 节，接手断点「其余约 500 条古义」）。幂等。
方法：2750 条 fm 全部过一遍（对照每字字卡「运用链」义项，字卡义项取自汉典/《说文》），
把用了古义、借义、专名/译音/姓氏、方言义、和部首家族无关义项的改成现代常用义；
本义正好能说明部首来历的，写成「今义（本指X）」。决定表在 fix_bs_b3_fm_decisions.py。
取值规则：今义/本义文字都必须在该字字卡运用链里找得到（脚本断言）；字卡没有的 8 条按《现代汉语词典》写，出处见 SRC。
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_bs_lib import load, save, BUSHOU, yunyong
from fix_bs_b3_fm_decisions import D as DEC, SRC

def clean(y):
    y = re.sub(r'[（(][^）)]*(?:[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]|古|说文|方言|今|一说|本义|后起|据)[^）)]*[）)]', '', y)
    y = re.sub(r'\s+[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$', '', y)
    y = re.sub(r'^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+[：:\s]+', '', y)
    return y.strip().rstrip('；;，,')

PY = 'a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü'
def strip_all(y):
    while True:
        y2 = re.sub(r'[（(][^（()）]*[）)]', '', y)
        if y2 == y: return y.strip()
        y = y2

def find(z, kw):
    yy = yunyong(z)
    for y in yy:
        if clean(y['义项']) == kw:
            return kw
    for y in yy:
        if kw in y['义项']:
            return clean(y['义项'])
    return None

def resolve(key, spec):
    b, z = key.split(' ')
    if spec == '':
        return None
    if spec.startswith('='):
        assert key in SRC, key
        return spec[1:]
    if '|本指:' in spec:
        a, o = spec.split('|本指:')
        ta, to = find(z, a), find(z, o)
        assert ta and to, (key, spec, ta, to)
        return '%s（本指%s）' % (strip_all(ta), strip_all(to))
    t = find(z, spec)
    assert t, (key, spec, [y['义项'] for y in yunyong(z)])
    return t

if __name__ == '__main__':
    data, fmt = load(BUSHOU)
    idx = {r['bushou']: r for r in data}
    bad = []; n = 0; out = []
    for key, spec in DEC.items():
        b, z = key.split(' ')
        r = idx.get(b)
        if not r or z not in (r.get('fm') or {}):
            if spec == '' and r: continue  # 已删
            bad.append((key, 'no fm')); continue
        try:
            v = resolve(key, spec)
        except AssertionError as e:
            bad.append((key, str(e)[:160])); continue
        fm = r['fm']
        if v is None:
            del fm[z]; n += 1; out.append((key, '(删)')); continue
        if fm[z] != v:
            out.append((key, fm[z] + ' → ' + v)); fm[z] = v; n += 1
    if bad:
        for x in bad: print('FAIL', x)
        sys.exit(1)
    if '-v' in sys.argv:
        for k, s in out: print(k, s)
    save(BUSHOU, data, fmt)
    print('改', n, '条 / 决定表', len(DEC), '条')
