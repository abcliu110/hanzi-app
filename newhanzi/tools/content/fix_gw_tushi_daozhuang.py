#!/usr/bin/env python3
"""古文 P2-C 遗留：倒装四子点真图示 + 「宾语」「何…之」图示宾语块修正。幂等；--check 只校验不写。

docs/gaijin/guwen-gaijin-sheji.md P2-C「知识点真图示替换」：P2-C 批 1–3（704397c2 / 40c1af71 / 2ff399f1）之后，
语法页「宾语前置 / 定语后置 / 状语后置 / 主谓倒装」四个子点（a8b0aa1e 从语文区并入）没有图示；
「宾语」「何…之」两张图示把「何陋之有」的宾语画错（宾语 把「何」「陋」各标宾语；何…之 顶行漏了「陋」），
宾语应为「何陋」整体（同库「宾语前置」分类：“宾语 + 之/是 + 动词”，例「何陋之有」；交接 guwen-donghua.md 待核 2）。

画法与 P2-C 批 1「词块搬家」同一套块与配色：红框 = 被搬动的成分，灰 = 标志（之/者，不译），蓝灰 = 动词/介词；
每行「原句块 → 正常语序块」，下方一行今译与出处。
素材只取 data/guwen_knowledge.js 该子点本条的「例句解析」（正常语序、今译、篇名都是条目原文），不补不编：
  宾语前置：何以战 / 吾谁与归 / 忌不自信 / 此之谓大丈夫
  定语后置：马之千里者 / 居庙堂之高 / 尝贻余核舟一
  状语后置：战于长勺 / 投以骨 / 皆以美于徐公
  主谓倒装：甚矣，汝之不惠 / 贤哉，回也
跑之前先断言每行用到的句子与今译仍在本条例句解析里（数据变了就停，不硬写）。
文件整体按 'window.NHZ_GUWEN_KNOWLEDGE=' + JSON.stringify + 原结尾 往返，写前断言与原文件逐字节一致。
"""
import json, os, subprocess, sys
NH = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
F = os.path.join(NH, 'data', 'guwen_knowledge.js')
INK, GRAY, RED, VERB, LINE, OK = '#2c3328', '#6b7566', '#b85a52', '#4a7a8c', '#c9c2b2', '#4a7a59'
ROLE = {  # role -> (fill, stroke, stroke-width, tag colour, bold tag)
    'mv': (RED + '1f', RED, 2, RED, True),
    'hub': (GRAY + '1f', LINE, 1.2, GRAY, False),
    'v': (VERB + '1f', LINE, 1.2, GRAY, False),
    'n': ('#f2f0e8', LINE, 1.2, GRAY, False),
}


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def txt(x, y, s, size=13, col=INK, bold=False, anchor='middle'):
    return '<text x="%s" y="%s" text-anchor="%s" font-size="%s" fill="%s"%s>%s</text>' % (
        x, y, anchor, size, col, ' font-weight="bold"' if bold else '', esc(s))


def bw(word):
    return max(46.0, 20 + 19 * len(word))


def row_w(blocks):
    return sum(bw(b[0]) for b in blocks) + 8 * (len(blocks) - 1)


def blocks_svg(blocks, x, y, h=52):
    out = []
    for word, tag, role in blocks:
        w = bw(word)
        fill, stroke, sw, tc, tb = ROLE[role]
        out.append('<rect x="%.1f" y="%s" width="%.1f" height="%s" rx="10" fill="%s" stroke="%s" stroke-width="%s"/>' % (x, y, w, h, fill, stroke, sw))
        out.append(txt('%.1f' % (x + w / 2), y + 24, word, 18, INK, True))
        if tag:
            out.append(txt('%.1f' % (x + w / 2), y + 43, tag, 11.5, tc, tb))
        x += w + 8
    return ''.join(out)


# ---------- 四个倒装子点 ----------
SPEC = {
    '宾语前置': {
        'head': '宾语跑到动词（介词）前面：翻译时搬回后面，“之”“是”只是标志，不译',
        'rows': [
            ('何以战？', [('何', '宾语', 'mv'), ('以', '介词', 'v'), ('战', '动词', 'n')],
             [('以', '介词', 'v'), ('何', '宾语', 'mv'), ('战', '动词', 'n')], '凭什么作战', '曹刿论战', '疑问代词作宾语'),
            ('微斯人，吾谁与归？', [('吾', '', 'n'), ('谁', '宾语', 'mv'), ('与', '介词', 'v'), ('归', '', 'n')],
             [('吾', '', 'n'), ('与', '介词', 'v'), ('谁', '宾语', 'mv'), ('归', '', 'n')], '我同谁一道呢', '岳阳楼记', '疑问代词作宾语'),
            ('忌不自信', [('忌', '', 'n'), ('不', '否定', 'n'), ('自', '宾语', 'mv'), ('信', '动词', 'v')],
             [('忌', '', 'n'), ('不', '否定', 'n'), ('信', '动词', 'v'), ('自', '宾语', 'mv')], '邹忌不相信自己', '邹忌讽齐王纳谏', '否定句代词作宾语'),
            ('此之谓大丈夫', [('此', '宾语', 'mv'), ('之', '标志', 'hub'), ('谓', '动词', 'v'), ('大丈夫', '', 'n')],
             [('谓', '动词', 'v'), ('此', '宾语', 'mv'), ('大丈夫', '', 'n')], '这就叫作大丈夫', '富贵不能淫', '“之”提宾，不译'),
        ]},
    '定语后置': {
        'head': '定语放到中心语后面：翻译时把定语挪回前面，“之”“者”不译成“的”',
        'rows': [
            ('马之千里者', [('马', '中心语', 'n'), ('之', '标志', 'hub'), ('千里', '定语', 'mv'), ('者', '标志', 'hub')],
             [('千里', '定语', 'mv'), ('马', '中心语', 'n')], '日行千里的马', '马说', '中心语＋之＋定语＋者'),
            ('居庙堂之高', [('居', '', 'v'), ('庙堂', '中心语', 'n'), ('之', '标志', 'hub'), ('高', '定语', 'mv')],
             [('居', '', 'v'), ('高', '定语', 'mv'), ('庙堂', '中心语', 'n')], '在高高的朝堂上做官', '岳阳楼记', '中心语＋之＋形容词'),
            ('尝贻余核舟一', [('核舟', '中心语', 'n'), ('一', '数量', 'mv')],
             [('一', '数量', 'mv'), ('核舟', '中心语', 'n')], '曾经送我一只核舟', '核舟记', '数量词后置（原句：尝贻余核舟一）'),
        ]},
    '状语后置': {
        'head': '介宾短语（于／以＋名词）在动词后面：翻译时挪到动词前面作状语',
        'rows': [
            ('战于长勺', [('战', '动词', 'v'), ('于长勺', '状语', 'mv')],
             [('于长勺', '状语', 'mv'), ('战', '动词', 'v')], '在长勺作战', '曹刿论战', '“于”：在'),
            ('屠惧，投以骨', [('投', '动词', 'v'), ('以骨', '状语', 'mv')],
             [('以骨', '状语', 'mv'), ('投', '动词', 'v')], '把骨头扔给狼', '狼', '“以”：把；又省了“之”'),
            ('皆以美于徐公', [('美', '形容词', 'v'), ('于徐公', '比较', 'mv')],
             [('于徐公', '比较', 'mv'), ('美', '形容词', 'v')], '都认为我比徐公美', '邹忌讽齐王纳谏', '“于”表比较：比'),
        ]},
    '主谓倒装': {
        'head': '谓语提到主语前面加强感叹：翻译时把主语调回前面',
        'rows': [
            ('甚矣，汝之不惠', [('甚矣', '谓语', 'mv'), ('汝之不惠', '主语', 'n')],
             [('汝之不惠', '主语', 'n'), ('甚矣', '谓语', 'mv')], '你太不聪明了', '愚公移山', '谓语“甚矣”提前'),
            ('贤哉，回也', [('贤哉', '谓语', 'mv'), ('回也', '主语', 'n')],
             [('回也', '主语', 'n'), ('贤哉', '谓语', 'mv')], '颜回真是贤德啊', '〈论语〉十二章', '谓语“贤哉”提前'),
        ]},
}


def daozhuang_svg(name, spec):
    rows = spec['rows']
    RH = 96
    H = 52 + RH * len(rows) + 8
    p = ['<svg viewBox="0 0 640 %d" xmlns="http://www.w3.org/2000/svg" style="max-width:100%%" role="img" aria-label="%s图解：原句词块搬回正常语序">' % (H, name)]
    p.append(txt(24, 28, spec['head'], 13, GRAY, anchor='start'))
    y = 44
    for sen, src, dst, jin, pian, note in rows:
        x0 = 24
        p.append(blocks_svg(src, x0, y))
        ax = max(x0 + row_w(src) + 14, 300)
        p.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="2"/>' % (ax, y + 26, ax + 30, y + 26, OK))
        p.append('<polygon points="%s,%s %s,%s %s,%s" fill="%s"/>' % (ax + 38, y + 26, ax + 28, y + 20, ax + 28, y + 32, OK))
        p.append(blocks_svg(dst, ax + 48, y))
        cap = '今译：' + jin + '（《' + pian + '》）　' + note
        p.append(txt(24, y + 74, cap, 13, OK, anchor='start'))
        y += RH
    p.append('</svg>')
    return ''.join(p)


def check_rows(it, spec):
    ana = it.get('例句解析') or []
    for sen, src, dst, jin, pian, note in spec['rows']:
        hit = [a for a in ana if a.get('句') == sen.rstrip('？') or a.get('句') == sen]
        assert hit, '%s：例句解析里没有「%s」，停' % (it['name'], sen)
        assert jin in hit[0]['析'] and pian in hit[0]['析'], '%s：「%s」今译/篇名与例句解析不符，停' % (it['name'], sen)


# ---------- 宾语 / 何…之：宾语块改为「何陋」整体 ----------
def fix_heloum(svg, anchor_start, anchor_end, y):
    """把 anchor_start 到 anchor_end 之间（旧块行）换成 何陋/之/有 三块，居中 320。已改过则原样返回。"""
    if anchor_start not in svg:
        return svg
    i = svg.index(anchor_start)
    j = svg.index(anchor_end, i)
    blocks = [('何陋', '宾语', 'mv'), ('之', '标志', 'hub'), ('有', '动词', 'v')]
    x = 320 - row_w(blocks) / 2
    return svg[:i] + blocks_svg(blocks, x, y, 58) + svg[j:]


def main():
    src = open(F, encoding='utf-8').read()
    data = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require(%s);process.stdout.write(JSON.stringify(window.NHZ_GUWEN_KNOWLEDGE))' % json.dumps(F)]))
    body = 'window.NHZ_GUWEN_KNOWLEDGE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    tail = src[len(body):]
    assert src.startswith(body) and tail in ('\n', ';\n', ';', ''), '往返不一致，停'
    cat = [c for c in data['categories'] if c['id'] == 'yufa'][0]
    by = {x['name']: x for x in cat['items']}
    changed = []
    for name, spec in SPEC.items():
        it = by[name]
        check_rows(it, spec)
        new = daozhuang_svg(name, spec)
        if it.get('图示') != new:
            it['图示'] = new; changed.append(name)
    b = by['宾语']
    nb = fix_heloum(b.get('图示', ''), '<rect x="207.0" y="126"', '<text x="24" y="210.0"', 126)
    if nb != b.get('图示'):
        b['图示'] = nb; changed.append('宾语')
    h = by['何…之']
    nh = fix_heloum(h.get('图示', ''), '<rect x="236.5" y="48"', '<text x="320" y="132"', 48)
    if nh != h.get('图示'):
        h['图示'] = nh; changed.append('何…之')
    OLD, NEW = '“何”从动词前面，搬到动词后面', '“何陋”从动词前面，搬到动词后面'
    if OLD in h.get('图示', ''):
        h['图示'] = h['图示'].replace(OLD, NEW)
        if '何…之' not in changed: changed.append('何…之')
    if not changed:
        print('无改动'); return 0
    if '--check' in sys.argv:
        print('需要更新：' + '、'.join(changed)); return 1
    open(F, 'w', encoding='utf-8').write('window.NHZ_GUWEN_KNOWLEDGE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + tail)
    print('已更新图示：' + '、'.join(changed)); return 0


if __name__ == '__main__':
    sys.exit(main())
