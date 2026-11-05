#!/usr/bin/env python3
"""生成 newhanzi/yuwen/quiz_bank_index.js：语法题库清单（知识点名 -> 文件、题数）。

yuwen.html 只加载这个小清单；进入某个知识点详情时，yuwen.js 才用 <script> 按需加载
对应的 quiz_bank_*.js（file:// 与 http:// 都可用）。新增/修改题库后重跑本脚本：
  python3 tools/gen_quiz_bank_index.py
"""
import json, os, re, glob

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAT = re.compile(r'window\.NHZ_GRAMMAR_BANK\[(".*?")\]\s*=\s*')

def main():
    idx = {}
    for p in sorted(glob.glob(os.path.join(ROOT, 'yuwen', 'quiz_bank_*.js'))):
        if p.endswith('quiz_bank_index.js'):
            continue
        txt = open(p, encoding='utf-8').read()
        m = PAT.search(txt)
        if m:
            name = json.loads(m.group(1))
            d = json.loads(txt[m.end():].rstrip().rstrip(';'))
        else:
            # 旧格式：window.NHZ_GRAMMAR_BANK = {"名词": {...}}（整对象赋值，只含一个点）
            m2 = re.search(r'window\.NHZ_GRAMMAR_BANK\s*=\s*', txt)
            assert m2, p
            whole = json.loads(txt[m2.end():].rstrip().rstrip(';'))
            assert len(whole) == 1, p
            name, d = next(iter(whole.items()))
        total = d.get('total') or len(d.get('questions') or [])
        rel = 'yuwen/' + os.path.basename(p)
        assert name not in idx, (name, p, idx.get(name))
        idx[name] = {'file': rel, 'total': total}
    out = os.path.join(ROOT, 'yuwen', 'quiz_bank_index.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* 自动生成：tools/gen_quiz_bank_index.py，勿手改 */\n')
        f.write('window.NHZ_GRAMMAR_BANK_INDEX = ')
        json.dump(idx, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print('quiz_bank_index.js: %d 个知识点' % len(idx))

if __name__ == '__main__':
    main()
