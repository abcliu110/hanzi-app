"""Z 字卡 · 空义项补写（全 3500 字）+ 残余占位。

数据：tools/content/fix_zika_z_yixiang.tsv
  主体行  字+义项序号|义项|要删的词(逗号分隔)
  #OVERRIDE 段  字+序号|义项(空=不改)|要删的词|新例句|要加的词
  #DROP 段  整条删除的义项（古义/通假且删完罕用词后无词可用，如 矢“同屎”、衙“衙衙”、嗽“同漱”）
义项按《现代汉语词典》《新华字典》常用义用白话写，只写本字今天常用的意思；
同时删掉 CC-CEDICT 组词里的罕用/错误/人名/网络词（血皿、叼盘、巩俐、诽闻、撩妹、约翰壹书…）。
残余占位：肖 删「肖先生（示例）」；蓉 第 4 义项类型「待查」→ 不标类型；太 老app_struct 去「（说法待查）」。
只改义项为空的格（重复运行时已填的格不动）。用法：python3 tools/content/fix_zika_z_yixiang.py
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(__file__))
from fix_zika_b_lib import load, save

HERE = os.path.dirname(__file__)

def parse():
    main, ov, drop = {}, {}, set()
    mode = 'main'
    for line in open(os.path.join(HERE, 'fix_zika_z_yixiang.tsv'), encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip():
            continue
        if line.startswith('#'):
            mode = line[1:].lower(); continue
        if mode == 'drop':
            drop |= set(line.split()); continue
        f = line.split('|') + [''] * 5
        k = f[0]
        if mode == 'main':
            main[k] = (f[1], [w for w in f[2].split(',') if w])
        else:
            ov[k] = (f[1], [w for w in f[2].split(',') if w], f[3], [w for w in f[4].split(',') if w])
    return main, ov, drop

def key(k):
    m = re.match(r'(.)(\d+)$', k); return m.group(1), int(m.group(2))

def run():
    main, ov, drop = parse()
    cards = {}
    stat = {'义项补写': 0, '删词': 0, '删义项': 0, '改句': 0, '改卡': 0}
    for k in list(main) + list(ov) + list(drop):
        z, i = key(k)
        if z not in cards:
            cards[z] = load(z)
    for k, (yx, dels) in main.items():
        z, i = key(k); L = cards[z]['dim']['运用链']
        if i >= len(L) or (L[i].get('义项') or '').strip():
            continue  # 已填过（重复运行）
        s = L[i]
        s['义项'] = yx; stat['义项补写'] += 1
        if s.get('类型') == '待查':
            s['类型'] = None
        n = len(s.get('词') or [])
        s['词'] = [w for w in (s.get('词') or []) if w not in dels]
        stat['删词'] += n - len(s['词'])
    for k, (yx, dels, ju, adds) in ov.items():
        z, i = key(k); s = cards[z]['dim']['运用链'][i]
        if yx:
            s['义项'] = yx
        s['词'] = [w for w in (s.get('词') or []) if w not in dels]
        for w in adds:
            if w not in s['词']:
                s['词'].insert(0, w)
        if ju and s.get('句') != ju:
            s['句'] = ju; stat['改句'] += 1
    for z in {key(k)[0] for k in drop}:
        idx = sorted([key(k)[1] for k in drop if key(k)[0] == z], reverse=True)
        L = cards[z]['dim']['运用链']
        for i in idx:
            k = z + str(i)
            if i < len(L) and k in main and L[i].get('义项') == main[k][0]:  # 只删本次刚补写的那格，重复运行不误删
                L.pop(i); stat['删义项'] += 1
    # 残余占位
    for z in ('肖', '蓉', '太'):
        cards.setdefault(z, load(z))
    for s in cards['肖']['dim']['运用链']:
        s['词'] = [w for w in s.get('词') or [] if '示例' not in w]
    for s in cards['蓉']['dim']['运用链']:
        if s.get('类型') == '待查':
            s['类型'] = None
    t = cards['太']['dim'].get('六书') or {}
    for kk, v in list(t.items()):
        if isinstance(v, str) and '（说法待查）' in v:
            t[kk] = v.replace('（说法待查）', '')
    for z, c in cards.items():
        if save(z, c):
            stat['改卡'] += 1
    print(stat)

if __name__ == '__main__':
    run()
