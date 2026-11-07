#!/usr/bin/env python3
"""A22-17 遗留：data/shici.js 的 pz（平仄谱）与平水韵单读字冲突 5 处（2026-11-08 PZ 线）。

出处：搜韵网《平水韵》20170714 版（https://sou-yun.com/QR.aspx ），经 github.com/jkak/pingShuiYun 转 JSON，
      原样存于 tools/content/src/pingshui_souyun_20170714.json；data/pingshui_pz.js 为其子集
      （tools/content/gen_sc2_pingshui.py 生成，该脚本 --check 列出的就是这 5 处）。
只改平水韵中仅一个声调的字（单读字），两读字不动：
  - 悯农（其一）  第 9 字「颗」  平→仄  平水韵只在 二十哿（上声）
  - 凉州词（王翰）第 18 字「场」 仄→平  平水韵只在 七阳（平声）
  - 己亥杂诗      第 12 字「究」 平→仄  平水韵只在 二十六宥（去声）
  - 过故人庄      第 24 字「场」 仄→平  平水韵只在 七阳（平声）
  - 春夜喜雨      第 24 字「俱」 仄→平  平水韵只在 七虞（平声）
（第 N 字 = 全诗去标点后的序号，与 pz 去「|」后的位置一一对应。）
只改 poems[].pz，不碰 pron（读音由 fix_shici_duyin.py 管）。
运行时再用字表逐字复核：该字在字表中必须仍是单读且声调等于新值，否则中止。

用法：python3 tools/content/fix_shici_pz5.py [--check]
幂等：二次运行 0 改动；--check 只检查，有待改项时退出码 1。
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io  # noqa: E402

PS_JS = os.path.join(io.ROOT, 'data', 'pingshui_pz.js')

# (order, 诗题, 作者, 第几字(1 起), 字, 旧, 新)
FIX = [
    (138, '悯农（其一）', '李绅', 9, '颗', '平', '仄'),
    (158, '凉州词', '王翰', 18, '场', '仄', '平'),
    (169, '己亥杂诗', '龚自珍', 12, '究', '平', '仄'),
    (37, '过故人庄', '孟浩然', 24, '场', '仄', '平'),
    (19, '春夜喜雨', '杜甫', 24, '俱', '仄', '平'),
]


def han(c):
    o = ord(c)
    return 0x3400 <= o <= 0x9fff or 0x20000 <= o <= 0x3134f


def ps_table():
    s = open(PS_JS, encoding='utf-8').read()
    m = re.search(r'window\.NHZ_PINGSHUI\s*=\s*(\{.*\});?\s*$', s, re.S)
    return json.loads(m.group(1))['chars']


def main():
    check = '--check' in sys.argv
    table = ps_table()
    doc = io.load('shici')
    changes = []
    for order, title, author, n, ch, old, new in FIX:
        ps = [p for p in doc['poems'] if p.get('order') == order and p.get('title') == title and p.get('author') == author]
        if len(ps) != 1:
            raise SystemExit(f'找不到唯一的 {order}《{title}》{author}（{len(ps)} 首）')
        p = ps[0]
        chars = [c for l in p['lines'] for c in l if han(c)]
        segs = p['pz'].split('|')
        flat = list(''.join(segs))
        if len(chars) != len(flat):
            raise SystemExit(f'《{title}》字数 {len(chars)} 与 pz {len(flat)} 不等')
        if chars[n - 1] != ch:
            raise SystemExit(f'《{title}》第{n}字是「{chars[n - 1]}」，预期「{ch}」')
        tones = set('平' if g.endswith('平') else '仄' for g in table.get(ch, []))
        if tones != {new}:
            raise SystemExit(f'「{ch}」平水韵 {table.get(ch)}，不是单读{new}，不改')
        cur = flat[n - 1]
        if cur == new:
            continue
        if cur != old:
            raise SystemExit(f'《{title}》第{n}字 pz 当前 {cur}，预期 {old}，请人工核对')
        flat[n - 1] = new
        out, i = [], 0
        for s in segs:
            out.append(''.join(flat[i:i + len(s)]))
            i += len(s)
        p['pz'] = '|'.join(out)
        changes.append(f'{order}《{title}》第{n}字「{ch}」pz {old}→{new}（平水韵 {"/".join(table[ch])}）')
    for c in changes:
        print(('待改 ' if check else '改 ') + c)
    if check:
        print('fix_shici_pz5 --check:', 'OK（无待改）' if not changes else f'{len(changes)} 处待改')
        return 1 if changes else 0
    if changes:
        io.dump('shici', doc)
    print('fix_shici_pz5:', f'{len(changes)} 处已改' if changes else '无变化（0 改动）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
