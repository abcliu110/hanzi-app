#!/usr/bin/env python3
"""将辅助字段提升为正式维度：读音 / 笔画 / 部首 / 繁体 / 形声拆解 / 易错提示.

新记录结构：{zi, level, dim: {12个维度}, src: {维度: 来源}}
12 维度：读音、笔画、部首、繁体、六书、结构、运用链、笔顺、字源、形近字、形声拆解、易错提示
"""
import json, os, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(BASE, '..', '..')

records = json.load(open(os.path.join(BASE, 'model-3500.json'), encoding='utf-8'))

# 老app misread（易错提示）
with open(os.path.join(APP, 'char-index.json'), encoding='utf-8') as f:
    char_index = json.load(f)
misread_map = {}
grp_files = {}
for ch, grp in char_index.items():
    grp_files.setdefault(str(grp), []).append(ch)
for grp, chs in grp_files.items():
    fp = os.path.join(APP, 'data', f'zi-{grp}.json')
    if not os.path.exists(fp):
        continue
    d = json.load(open(fp, encoding='utf-8'))
    for c in d.get('chars', []):
        if c.get('misread'):
            misread_map[c['zi']] = c['misread']

SRC_BASE = '通用规范汉字表(gsc_pinyin.csv)+Unihan'
new_records = []
for r in records:
    dim = r.get('dim', {})
    src = r.get('src', {})
    nd = {}
    ns = {}
    # 1-4: 基础字段升维
    if r.get('pinyin'):
        nd['读音'] = {'拼音': r['pinyin']}
        if r.get('pinyin_unihan'):
            nd['读音']['unihan拼音'] = r['pinyin_unihan']
        ns['读音'] = SRC_BASE
    if r.get('bihua') is not None:
        nd['笔画'] = {'笔画数': r['bihua']}
        ns['笔画'] = SRC_BASE
    if r.get('bushou'):
        nd['部首'] = {'部首': r['bushou']}
        ns['部首'] = SRC_BASE
    if r.get('fan'):
        nd['繁体'] = {'繁体': r['fan']}
        ns['繁体'] = SRC_BASE
    # 5-10: 原有6维度（顺序固定）
    for k in ['六书', '结构', '运用链', '笔顺', '字源', '形近字']:
        if dim.get(k):
            nd[k] = dim[k]
            ns[k] = src.get(k, '')
    # 11: 形声拆解（已有则保留）
    if dim.get('形声拆解'):
        nd['形声拆解'] = dim['形声拆解']
        ns['形声拆解'] = '老app.parts'
    # 12: 易错提示（新增）
    if r['zi'] in misread_map:
        nd['易错提示'] = misread_map[r['zi']]
        ns['易错提示'] = '老app.misread'
    new_records.append({'zi': r['zi'], 'level': r['level'], 'dim': nd, 'src': ns})

json.dump(new_records, open(os.path.join(BASE, 'model-3500.json'), 'w', encoding='utf-8'),
          ensure_ascii=False)
# slim
slim = []
for r in new_records:
    r2 = json.loads(json.dumps(r, ensure_ascii=False))
    bs = r2.get('dim', {}).get('笔顺', {})
    if isinstance(bs.get('strokes'), list):
        bs['strokes'] = f"<{len(bs['strokes'])}笔SVG>"
    if isinstance(bs.get('medians'), list):
        bs['medians'] = f"<{len(bs['medians'])}笔中线>"
    slim.append(r2)
json.dump(slim, open(os.path.join(BASE, 'model-3500-slim.json'), 'w', encoding='utf-8'),
          ensure_ascii=False)

# 重新切分单字文件
outdir = os.path.join(BASE, '..', 'data', 'zika')
shutil.rmtree(outdir, ignore_errors=True)
os.makedirs(outdir, exist_ok=True)
chars = []
for r in new_records:
    chars.append(r['zi'])
    with open(os.path.join(outdir, r['zi'] + '.json'), 'w', encoding='utf-8') as f:
        json.dump(r, f, ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(BASE, '..', 'data', 'chars.json'), 'w', encoding='utf-8') as f:
    json.dump(chars, f, ensure_ascii=False, separators=(',', ':'))

import collections
cov = collections.Counter()
for r in new_records:
    for k in r['dim']:
        cov[k] += 1
print('=== 12维度覆盖率 ===')
for k in ['读音', '笔画', '部首', '繁体', '六书', '结构', '运用链', '笔顺', '字源', '形近字', '形声拆解', '易错提示']:
    print(f'  {k}: {cov[k]}/3500 = {cov[k]/3500:.1%}')
