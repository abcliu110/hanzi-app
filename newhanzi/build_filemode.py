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

def write_js(path, var, obj):
    with open(path, 'w', encoding='utf-8') as f:
        f.write('window.%s = ' % var)
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';')

def main():
    # 1. 首页索引
    idx_path = os.path.join(ROOT, 'data', 'index.json')
    idx = json.load(open(idx_path, encoding='utf-8'))
    write_js(os.path.join(ROOT, 'data', 'index.js'), 'NHZ_INDEX', idx)
    print('index.js: %d entries' % len(idx))

    # 2. 单字文件
    zdir = os.path.join(ROOT, 'data', 'zika')
    n = 0
    for fn in sorted(os.listdir(zdir)):
        if not fn.endswith('.json'):
            continue
        z = fn[:-5]
        rec = json.load(open(os.path.join(zdir, fn), encoding='utf-8'))
        write_js(os.path.join(zdir, z + '.js'), 'NHZ_ZIKA', rec)
        n += 1
    print('zika: %d files' % n)

    # 3. 语文知识库
    yuwen = {}
    for key, fn in [('grammar', 'grammar.json'), ('reading', 'reading.json'), ('writing', 'writing.json')]:
        yuwen[key] = json.load(open(os.path.join(ROOT, 'yuwen', fn), encoding='utf-8'))
    write_js(os.path.join(ROOT, 'yuwen', 'data.js'), 'NHZ_YUWEN', yuwen)
    print('yuwen/data.js: %s' % ', '.join('%s=%d类' % (k, len(v['categories'])) for k, v in yuwen.items()))

if __name__ == '__main__':
    main()
