#!/usr/bin/env python3
"""格律小作坊（A22-17 P2-2）平水韵字表子集生成 + 诗库 pz 核对（2026-11-07 SC2）。

来源：搜韵网《平水韵》（20170714 版 Word 文档，https://sou-yun.com/QR.aspx ），
      由 github.com/jkak/pingShuiYun 转为 JSON（data/oriYunDict.json，106 韵 → 字串），
      原样存于 tools/content/src/pingshui_souyun_20170714.json（方括号内注释不计）。
输出：data/pingshui_pz.js —— 只收 data/shici.js 带 pz 的诗用到的字 + 格律小作坊干扰字，
      window.NHZ_PINGSHUI = { src, chars: { 字: ['十一尤平', ...] } }（一个字列出它所在的全部韵部）。
核对（--check 或默认都会打印）：
  - 平水韵只有平声的字，pz 必须是平；只有仄声（上/去/入）的字，pz 必须是仄 → 不符即「冲突」；
  - 平仄两读的字（如 看/教/过/思）字表无法单独判定，记为「两读」，格律小作坊里不替孩子定平仄。
  - 有冲突的诗格律小作坊不开放（页面运行时同口径判定），清单见 docs/xiufu/shencha-2026-11-05/fix-shici.md。
用法：python3 tools/content/gen_sc2_pingshui.py [--check]   幂等：二次运行 0 改动；--check 时文件过期退出码 1。
"""
import json, os, re, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'pingshui_souyun_20170714.json')
OUT = os.path.join(ROOT, 'data', 'pingshui_pz.js')
DISTRACT = '明夜月春山水风花东南西北天地人云'  # 与 games/shici/gelu.html 的干扰字池一致

def han(c):
    o = ord(c)
    return 0x3400 <= o <= 0x9fff or 0x20000 <= o <= 0x3134f

def load_table():
    d = json.load(open(SRC, encoding='utf-8'))
    groups = {}
    for k, v in d.items():
        k = k.lstrip('\ufeff').strip()
        v = re.sub(r'\[[^\]]*\]', '', v)
        for c in v:
            if han(c):
                g = groups.setdefault(c, [])
                if k not in g:
                    g.append(k)
    return groups

def poems():
    js = 'global.window={};require(%s);console.log(JSON.stringify(window.NHZ_SHICI.poems.filter(function(p){return p.pz;})))' % json.dumps(os.path.join(ROOT, 'data', 'shici.js'))
    return json.loads(subprocess.check_output(['node', '-e', js]).decode('utf-8'))

def tone_of(gs):
    t = set('平' if g.endswith('平') else '仄' for g in gs)
    return t

def main():
    check = '--check' in sys.argv
    table = load_table()
    ps = poems()
    need = set(DISTRACT)
    for p in ps:
        for l in p['lines']:
            need.update(c for c in l if han(c))
    chars = {c: table[c] for c in sorted(need) if c in table}
    missing = sorted(c for c in need if c not in table)
    body = json.dumps({'src': '搜韵网《平水韵》20170714 版（https://sou-yun.com/QR.aspx），经 github.com/jkak/pingShuiYun 转 JSON；本文件只收诗库带 pz 的诗用到的字', 'chars': chars}, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    text = ('/* 平水韵字表子集（格律小作坊用）。由 tools/content/gen_sc2_pingshui.py 生成，勿手改。\n'
            '   每字列出它在平水韵中所在的全部韵部（末字 平/上/去/入）；两个声调都有的字是「两读」。 */\n'
            'window.NHZ_PINGSHUI = ' + body + ';\n')
    old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
    # 核对 pz
    conflicts, amb, total = [], 0, 0
    for p in ps:
        cs = [c for l in p['lines'] for c in l if han(c)]
        f = p['pz'].replace('|', '')
        for i, (c, w) in enumerate(zip(cs, f)):
            total += 1
            t = tone_of(chars.get(c, []))
            if len(t) != 1:
                amb += 1
                continue
            if w not in t:
                conflicts.append((p['order'], p['title'], i + 1, c, w, '/'.join(chars[c])))
    bad_poems = sorted(set((o, t) for o, t, *_ in conflicts))
    print('带 pz 的诗 %d 首 %d 字：与平水韵单读字冲突 %d 字（%d 首），两读字 %d，字表缺字 %d%s' % (
        len(ps), total, len(conflicts), len(bad_poems), amb, len(missing), (' ' + ''.join(missing)) if missing else ''))
    for o, t, i, c, w, g in conflicts:
        print('  冲突 %d《%s》第%d字「%s」pz=%s，平水韵 %s' % (o, t, i, c, w, g))
    if check:
        if old != text:
            print('data/pingshui_pz.js 过期，请重跑本脚本'); sys.exit(1)
        print('data/pingshui_pz.js 最新'); return
    if old != text:
        open(OUT, 'w', encoding='utf-8').write(text)
        print('写入 data/pingshui_pz.js（%d 字）' % len(chars))
    else:
        print('data/pingshui_pz.js 无变化（0 改动）')

if __name__ == '__main__':
    main()
