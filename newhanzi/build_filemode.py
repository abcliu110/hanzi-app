#!/usr/bin/env python3
"""把 JSON 数据文件转成 .js（挂到 window 全局），让 app 双击 file:// 也能跑。

原理：<script src> 不受 file:// 的 fetch 跨域限制，http:// 下同样可用。
源头是 ziku/model-3500.json；本脚本可重复跑（幂等）。
生成：
  newhanzi/data/index.js            <- data/index.json      (window.NHZ_INDEX)
  newhanzi/data/zika/<字>.js        <- data/zika/<字>.json  (window.NHZ_ZIKA)
  newhanzi/yuwen/data.js            <- 直接编辑维护（window.NHZ_YUWEN，唯一源；旧版 yuwen/*.json 已于 2026-11-05 删除）
  newhanzi/yuwen/quiz_bank_index.js <- yuwen/quiz_bank_*.js (tools/gen_quiz_bank_index.py)
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
    # 1. 首页索引：data/index.json -> data/index.js；若无 json 则从现有 .js 读回（保持不动）
    #    注意：不要从 model-3500.json 重建——原 index.json 已删除，重建会丢失原有拼音/声调处理细节。
    #    部首修正请直接改 data/index.js（surgical patch）。
    idx_js = os.path.join(ROOT, 'data', 'index.js')
    idx_json = os.path.join(ROOT, 'data', 'index.json')
    if os.path.exists(idx_json):
        idx = json.load(open(idx_json, encoding='utf-8'))
        write_js(idx_js, 'NHZ_INDEX', idx)
    else:
        idx = load_js_var(idx_js, 'NHZ_INDEX')
    print('index.js: %d entries' % len(idx))

    # 2. 单字文件：.json -> .js（就地规范化脏数据类型）；转完删 .json
    zdir = os.path.join(ROOT, 'data', 'zika')
    n = 0
    for fn in sorted(os.listdir(zdir)):
        p = os.path.join(zdir, fn)
        if fn.endswith('.json'):
            rec = normalize_rec(json.load(open(p, encoding='utf-8')))
            write_js(p[:-5] + '.js', 'NHZ_ZIKA', rec)
            os.remove(p)
            n += 1
        elif fn.endswith('.js'):
            rec = normalize_rec(load_js_var(p, 'NHZ_ZIKA'))
            write_js(p, 'NHZ_ZIKA', rec)
            n += 1
    print('zika: %d files converted/normalized' % n)

    # 3. 语文知识库
    #    yuwen/data.js 为唯一源（直接编辑维护）；旧版 yuwen/*.json 已于 2026-11-05 删除，
    #    --rebuild-yuwen 已废弃：任何重建都不得从 json 覆盖 data.js（旧行为会让内容回退）。
    if '--rebuild-yuwen' in sys.argv:
        build_yuwen()
    else:
        print('yuwen/data.js: 保持不动（唯一源；--rebuild-yuwen 已废弃，json 源已删除）')

    # 4. 语法题库清单（yuwen.html 按需加载题库用）
    import subprocess
    subprocess.run([sys.executable, os.path.join(ROOT, '..', 'tools', 'gen_quiz_bank_index.py')], check=True)

def build_yuwen():
    # 已废弃：旧版 yuwen/*.json 源已于 2026-11-05 删除（且 logic.json 早已缺失），
    # yuwen/data.js 为唯一源。绝不允许从 json 重建覆盖 data.js。
    sys.exit('build_yuwen 已废弃：yuwen/*.json 源已删除，yuwen/data.js 为唯一源，请直接编辑 data.js')

if __name__ == '__main__':
    main()
