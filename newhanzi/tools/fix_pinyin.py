#!/usr/bin/env python3
"""主读音修正 + 校验（可重跑）。

数据：newhanzi/tools/pinyin_fix.json（人工表：primary / reviewed_keep / rare / uncertain）
写入：
  data/index.js          py / tl / L / t 用主读音（首页索引只显示主读音，罕用音不出现）
  data/pinyin_lookup.js  只列常用读音，主读音第一
  data/zika/<字>.js      读音.拼音 = 常用读音（主读音第一）；罕用/古音移到 读音.罕用读音，字卡里标注显示

用法（仓库根目录）：
  python3 newhanzi/tools/fix_pinyin.py apply   改写数据
  python3 newhanzi/tools/fix_pinyin.py check   只校验（CI 跑）；有问题退出码 1
校验项：三处主读音一致；主读音带声调（轻声字除外）；罕用音不当主读音、不出现在索引；
人工表里的读音都在该字读音列表内；装了 pypinyin 时，首音与 pypinyin 默认音不同且不在人工表里的字报错（需人工复核后入表）。
"""
import json, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
NH = os.path.dirname(HERE)
FIX = json.load(open(os.path.join(HERE, 'pinyin_fix.json'), encoding='utf-8'))
PRIMARY = {**FIX['reviewed_keep'], **FIX['primary']}
RARE = FIX['rare']
ADDED = FIX.get('added_common', {})
# 主读音本身就是轻声的字（不带声调符号也合法）
NEUTRAL_OK = set('们吧吗呢么的了着子啦瘩呐哟哩罢家头边过里地底价殖匙裳啰咱嘛'.replace(' ', ''))

TONES = {'ā':1,'á':2,'ǎ':3,'à':4,'ē':1,'é':2,'ě':3,'è':4,'ī':1,'í':2,'ǐ':3,'ì':4,'ō':1,'ó':2,'ǒ':3,'ò':4,
         'ū':1,'ú':2,'ǔ':3,'ù':4,'ǖ':1,'ǘ':2,'ǚ':3,'ǜ':4,'ń':2,'ň':3,'ǹ':4,'ḿ':2}

def tone_of(py):
    for c in py:
        if c in TONES: return TONES[c]
    return 5

def toneless(py):
    s = py.replace('ü', 'v').replace('ǖ', 'v').replace('ǘ', 'v').replace('ǚ', 'v').replace('ǜ', 'v').replace('·', '')
    s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')

def norm(p): return p.replace('·', '')

def load_var(path):
    s = open(path, encoding='utf-8').read()
    i = s.index('=')
    return s, s[:i + 1], json.loads(s[i + 1:].strip().rstrip(';'))

def zika_path(z): return os.path.join(NH, 'data', 'zika', z + '.js')

def readings_for(z, cur_list):
    """返回 (常用读音列表[主读音第一], 罕用读音列表)。cur_list 为当前完整读音列表（含罕用）。"""
    rare = [r for r in cur_list if norm(r) in set(RARE.get(z, []))]
    common = [r for r in cur_list if r not in rare]
    p = PRIMARY.get(z)
    if p:
        hit = [r for r in common if norm(r) == p]
        if not hit: raise SystemExit(f'{z}: 主读音 {p} 不在读音列表 {cur_list}')
        common = hit + [r for r in common if r != hit[0]]
    return common, rare

def full_list(du):
    lst = [x for x in du.get('拼音', '').split(',') if x]
    lst += [x for x in du.get('罕用读音', '').split(',') if x and x not in lst]
    return lst

def apply():
    s, pre, idx = load_var(os.path.join(NH, 'data', 'index.js'))
    assert s == pre + ' ' + json.dumps(idx, ensure_ascii=False) + ';', 'index.js 格式与预期不同'
    ls, lpre, lk = load_var(os.path.join(NH, 'data', 'pinyin_lookup.js'))
    assert ls == lpre + ' ' + json.dumps(lk, ensure_ascii=False, separators=(',', ':')) + ';', 'pinyin_lookup.js 格式与预期不同'
    nz = 0
    for e in idx:
        z = e['z']
        text, zpre, rec = load_var(zika_path(z))
        du = rec['dim']['读音']
        common, rare = readings_for(z, full_list(du))
        new = {}
        for k, v in du.items():
            if k == '罕用读音': continue
            new[k] = ','.join(common) if k == '拼音' else v
            if k == '拼音' and rare: new['罕用读音'] = ','.join(rare)
        if new != du:
            done = False
            for sep in ((',', ':'), (', ', ': ')):
                old_enc = json.dumps(du, ensure_ascii=False, separators=sep)
                if text.count(old_enc) == 1:
                    text = text.replace(old_enc, json.dumps(new, ensure_ascii=False, separators=sep)); done = True; break
            if not done: raise SystemExit(f'{z}: 读音字段定位失败')
            open(zika_path(z), 'w', encoding='utf-8').write(text); nz += 1
        p = norm(common[0])
        e['py'] = common[0] if not common[0].startswith('·') else p
        e['tl'] = toneless(p); e['L'] = e['tl'][0].upper(); e['t'] = tone_of(p)
        lk[z] = ','.join(common)
    open(os.path.join(NH, 'data', 'index.js'), 'w', encoding='utf-8').write(pre + ' ' + json.dumps(idx, ensure_ascii=False) + ';')
    open(os.path.join(NH, 'data', 'pinyin_lookup.js'), 'w', encoding='utf-8').write(lpre + ' ' + json.dumps(lk, ensure_ascii=False, separators=(',', ':')) + ';')
    print(f'apply: 字卡改写 {nz} 个，索引/查表 {len(idx)} 字')

def check():
    errs = []
    _, _, idx = load_var(os.path.join(NH, 'data', 'index.js'))
    _, _, lk = load_var(os.path.join(NH, 'data', 'pinyin_lookup.js'))
    try:
        from pypinyin import pinyin, Style
    except ImportError:
        pinyin = None
    reviewed = set(PRIMARY)
    for e in idx:
        z = e['z']
        _, _, rec = load_var(zika_path(z))
        du = rec['dim']['读音']
        common = du['拼音'].split(',')
        rare = [x for x in du.get('罕用读音', '').split(',') if x]
        first = norm(common[0])
        if norm(e['py']) != first: errs.append(f'{z}: 索引 {e["py"]} ≠ 字卡 {first}')
        if norm(lk.get(z, '').split(',')[0]) != first: errs.append(f'{z}: 查表 {lk.get(z)} 首音 ≠ 字卡 {first}')
        if e['tl'] != toneless(first) or e['t'] != tone_of(first): errs.append(f'{z}: 索引 tl/t 与 {first} 不符')
        if tone_of(first) == 5 and z not in NEUTRAL_OK: errs.append(f'{z}: 主读音 {first} 无声调')
        if z in PRIMARY and first != PRIMARY[z]: errs.append(f'{z}: 主读音应为 {PRIMARY[z]}，现为 {first}')
        want_rare = set(RARE.get(z, []))
        if set(map(norm, rare)) != want_rare: errs.append(f'{z}: 罕用读音应为 {sorted(want_rare)}，现为 {rare}')
        if first in want_rare: errs.append(f'{z}: 罕用音 {first} 做了主读音')
        if any(norm(x) in want_rare for x in lk.get(z, '').split(',')): errs.append(f'{z}: 查表含罕用音')
        for r in ADDED.get(z, []):
            if norm(r) not in map(norm, common): errs.append(f'{z}: 应补常用读音 {r}，字卡现为 {common}')
            if norm(r) not in map(norm, lk.get(z, '').split(',')): errs.append(f'{z}: 查表缺补列读音 {r}')
        if pinyin and z not in reviewed:
            d = pinyin(z, style=Style.TONE)[0][0]
            if d != first and d in map(norm, common + rare):
                errs.append(f'{z}: 首音 {first} 与 pypinyin 默认 {d} 不同且未人工复核（请判断后写入 pinyin_fix.json）')
    for z in list(PRIMARY) + list(RARE):
        if not os.path.exists(zika_path(z)): errs.append(f'{z}: 人工表里的字不在字库')
    for x in errs: print('✗', x, file=sys.stderr)
    print(f'check_pinyin: {len(idx)} 字，问题 {len(errs)}' + ('' if pinyin else '（未装 pypinyin，跳过未复核检测）'))
    return 1 if errs else 0

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'apply': apply()
    sys.exit(check())
