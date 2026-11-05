"""Z 字卡 · 义项无词无句（本义格空）补写（全 3500 字，按年级从低到高）。

数据：tools/content/fix_zika_z_benyi.tsv，每行 字+义项序号|新义项|词|句
- 今义仍常用的格：补 1–3 个常用词 + 一句生活例句（按《现代汉语词典》《新华字典》常用义）。
- 今天不用的古本义格：句写成一句古义说明，出处取卡内《说文解字》条或卡内引文（文）。
只在该格 词、句 都为空时写入（重复运行 0 改动）；词须含本字、不与同卡其他义项重复（重复的跳过并报告）；句须含本字。
用法：python3 tools/content/fix_zika_z_benyi.py
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(__file__))
from fix_zika_b_lib import load, save

HERE = os.path.dirname(__file__)

def rows():
    for n, line in enumerate(open(os.path.join(HERE, 'fix_zika_z_benyi.tsv'), encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        f = line.split('|')
        assert len(f) == 4, (n, line)
        m = re.match(r'(.)(\d+)$', f[0]); assert m, (n, line)
        yield m.group(1), int(m.group(2)), f[1].strip(), [w for w in f[2].split(',') if w.strip()], f[3].strip()

def run():
    cards, changed, stat, warn, err = {}, set(), {'格': 0, '改义项': 0, '加词': 0, '加句': 0}, [], []
    for z, i, yx, ws, ju in rows():
        if z not in cards:
            cards[z] = load(z)
        L = cards[z]['dim']['运用链']
        if i >= len(L):
            warn.append(f'{z}{i} 越界'); continue
        s = L[i]
        if (s.get('词') or []) or (s.get('句') or ''):
            continue
        if not ju or z not in ju:
            err.append(f'{z}{i} 句不含本字：{ju}'); continue
        others = {w for j, t in enumerate(L) if j != i for w in (t.get('词') or [])}
        keep = []
        for w in ws:
            if z not in w:
                err.append(f'{z}{i} 词不含本字：{w}'); continue
            if w in others:
                warn.append(f'{z}{i} 词「{w}」与其他义项重复，跳过'); continue
            keep.append(w)
        if yx and s.get('义项') != yx:
            s['义项'] = yx; stat['改义项'] += 1
        s['词'] = keep; s['句'] = ju
        stat['格'] += 1; stat['加词'] += len(keep); stat['加句'] += 1
        changed.add(z)
    if err:
        print('\n'.join(err)); sys.exit('有错误，未写入')
    n = sum(save(z, cards[z]) for z in changed)
    print(stat, '改卡', n)
    for w in warn:
        print('  ', w)

if __name__ == '__main__':
    run()
