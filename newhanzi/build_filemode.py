#!/usr/bin/env python3
"""把 JSON 数据文件转成 .js（挂到 window 全局），让 app 双击 file:// 也能跑。

原理：<script src> 不受 file:// 的 fetch 跨域限制，http:// 下同样可用。
源头是 ziku/model-3500.json；本脚本可重复跑（幂等）。
生成：
  newhanzi/data/index.js            <- data/index.json      (window.NHZ_INDEX)
  newhanzi/data/zika/<字>.js        <- data/zika/<字>.json  (window.NHZ_ZIKA)
  newhanzi/yuwen/data.js            <- yuwen/*.json         (window.NHZ_YUWEN)
"""
import json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))  # newhanzi/

def norm_list(x):
    """脏数据规范化：字符串 -> [字符串]，None -> []"""
    if x is None:
        return []
    if isinstance(x, list):
        return x
    return [x]

def normalize_rec(rec):
    d = rec.get('dim', {})
    if '易错提示' in d:
        d['易错提示'] = norm_list(d['易错提示'])
    bs = d.get('笔顺')
    if isinstance(bs, dict) and '笔顺文字' in bs:
        bs['笔顺文字'] = norm_list(bs['笔顺文字'])
    return rec

def write_js(path, var, obj):
    with open(path, 'w', encoding='utf-8') as f:
        f.write('window.%s = ' % var)
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';')

def load_js_var(path, var):
    """读回 window.VAR = {...}; 格式的 .js"""
    with open(path, encoding='utf-8') as f:
        txt = f.read()
    prefix = 'window.%s = ' % var
    assert txt.startswith(prefix), path
    body = txt[len(prefix):]
    if body.endswith(';'):
        body = body[:-1]
    return json.loads(body)

def main():
    # 1. 首页索引（如只有 .js，从 .js 读回）
    idx_js = os.path.join(ROOT, 'data', 'index.js')
    idx_json = os.path.join(ROOT, 'data', 'index.json')
    if os.path.exists(idx_json):
        idx = json.load(open(idx_json, encoding='utf-8'))
        write_js(idx_js, 'NHZ_INDEX', idx)
    else:
        idx = load_js_var(idx_js, 'NHZ_INDEX')
    print('index.js: %d entries' % len(idx))

    # 2. 单字文件（就地规范化脏数据类型）
    zdir = os.path.join(ROOT, 'data', 'zika')
    n = 0
    for fn in sorted(os.listdir(zdir)):
        if not fn.endswith('.js'):
            continue
        p = os.path.join(zdir, fn)
        rec = normalize_rec(load_js_var(p, 'NHZ_ZIKA'))
        write_js(p, 'NHZ_ZIKA', rec)
        n += 1
    print('zika: %d files normalized' % n)

    # 3. 语文知识库
    yuwen = {}
    for key, fn in [('grammar', 'grammar.json'), ('reading', 'reading.json'), ('writing', 'writing.json')]:
        yuwen[key] = json.load(open(os.path.join(ROOT, 'yuwen', fn), encoding='utf-8'))
    write_js(os.path.join(ROOT, 'yuwen', 'data.js'), 'NHZ_YUWEN', yuwen)
    print('yuwen/data.js: %s' % ', '.join('%s=%d类' % (k, len(v['categories'])) for k, v in yuwen.items()))

if __name__ == '__main__':
    main()
