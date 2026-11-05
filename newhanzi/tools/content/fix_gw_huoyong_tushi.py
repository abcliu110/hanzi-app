#!/usr/bin/env python3
"""古文 词类活用「图示」真图示（原型：形容词使动用法）。幂等；--check 只校验不写。

把 data/guwen_knowledge.js「词类活用 › 形容词使动用法」的 图示（旧版：文字装进框的通用模板）换成「换帽子」图解，
与白板 wb/s/gw_hy_xing_shidong.js 同一套符号：▲蓝 = 形容词（词性帽），●红 = 动词（新岗位要的词性），
单下划线 = 谓语岗位，波浪线 = 宾语，圈 = 展开时补出的「使」。
素材：例句「必先苦其心志」「劳其筋骨」与释义「使……痛苦」「使……劳累」取自 data/guwen.js《生于忧患，死于安乐》重点；
今译「使他的内心痛苦」核对人教版教参译文（古诗文网 https://www.gushiwen.cn/GuShiWen_1e96b19da5.aspx）；
口诀、讲解、辨析取自该知识点本条；「意动：认为宾语……」取自同库「形容词意动用法」讲解。
文件整体按 'window.NHZ_GUWEN_KNOWLEDGE=' + JSON.stringify(obj) + 原结尾（'\\n' 或 ';\\n'）往返，写前断言与原文件逐字节一致。
"""
import json, os, subprocess, sys
NH = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
F = os.path.join(NH, 'data', 'guwen_knowledge.js')
INK, GRAY, ACC, ADJ, VERB, ROLE, OK = '#2c3328', '#6b7566', '#4a7a59', '#274b8f', '#c22f2f', '#4f5d7a', '#0f8c8c'


def t(x, y, s, size=18, col=INK, bold=False, anchor='middle'):
    return '<text x="%s" y="%s" text-anchor="%s" font-size="%s" fill="%s"%s>%s</text>' % (x, y, anchor, size, col, ' font-weight="bold"' if bold else '', s)


def wave(x0, x1, y):
    d, x = 'M%s %s' % (x0, y), x0
    while x < x1:
        d += ' q4 -4 8 0'; x += 8
    return '<path d="%s" fill="none" stroke="%s" stroke-width="1.6"/>' % (d, ROLE)


def svg():
    p = ['<svg viewBox="0 0 640 286" xmlns="http://www.w3.org/2000/svg" style="max-width:100%" role="img" aria-label="形容词使动用法图解：苦其心志＝使他的内心痛苦">']
    p.append(t(24, 28, '口诀：看位置看宾语', 13, GRAY, anchor='start'))
    # 左：原句，词性帽 ▲ 形容词
    p.append(t(110, 50, '原句（位置）', 13, GRAY))
    p.append('<polygon points="78,74 70,88 86,88" fill="%s"/>' % ADJ)
    p.append(t(78, 68, '形容词', 12, ADJ))
    p.append(t(78, 122, '苦', 30, INK, True))
    p.append(t(146, 122, '其心志', 26))
    p.append(wave(108, 186, 132))
    p.append(t(146, 152, '宾语', 12, ROLE))
    # 中：换帽子箭头
    p.append('<path d="M206 106 L262 106" stroke="%s" stroke-width="2" fill="none"/><path d="M254 100 L264 106 L254 112" stroke="%s" stroke-width="2" fill="none"/>' % (GRAY, GRAY))
    p.append(t(234, 94, '带了宾语', 12, GRAY))
    # 右：新帽 ● + 谓语岗位 + 释义
    p.append(t(380, 50, '换岗位：帽子跟着换', 13, GRAY))
    p.append('<polygon points="306,74 298,88 314,88" fill="%s" opacity=".3"/>' % ADJ)
    p.append('<path d="M317 82 L331 82 M326 78 L332 82 L326 86" stroke="%s" stroke-width="1.4" fill="none"/>' % GRAY)
    p.append('<circle cx="344" cy="82" r="8" fill="%s"/>' % VERB)
    p.append(t(344, 66, '动词', 12, VERB))
    p.append(t(344, 122, '苦', 30, VERB, True))
    p.append('<line x1="330" y1="132" x2="358" y2="132" stroke="%s" stroke-width="1.8"/>' % ROLE)
    p.append(t(344, 152, '谓语', 12, ROLE))
    p.append(t(412, 122, '其心志', 26))
    p.append(wave(374, 452, 132))
    p.append(t(412, 152, '宾语', 12, ROLE))
    p.append(t(540, 112, '使……痛苦', 20, ACC, True))
    # 下：展开 + 今译
    p.append('<rect x="90" y="172" width="460" height="52" rx="10" fill="%s14" stroke="%s" stroke-width="1.6"/>' % (ACC, ACC))
    p.append('<ellipse cx="138" cy="198" rx="17" ry="15" fill="none" stroke="%s" stroke-width="1.8"/>' % ACC)
    p.append(t(138, 206, '使', 22))
    p.append(t(174, 206, '＋', 16, GRAY))
    p.append(t(222, 206, '其心志', 22))
    p.append(t(270, 206, '＋', 16, GRAY))
    p.append(t(294, 206, '苦', 22))
    p.append(t(318, 206, '→', 18, GRAY))
    p.append(t(422, 206, '使他的内心痛苦', 22, OK))
    p.append(t(320, 248, '又如：劳其筋骨（劳：使……劳累）  ——《生于忧患，死于安乐》', 13, GRAY))
    p.append(t(320, 272, '使动是“使宾语……”，不是形容词自己；意动是“认为宾语……”。', 13, INK))
    p.append('</svg>')
    return ''.join(p)


def main():
    src = open(F, encoding='utf-8').read()
    data = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require(%s);process.stdout.write(JSON.stringify(window.NHZ_GUWEN_KNOWLEDGE))' % json.dumps(F)]))
    body = 'window.NHZ_GUWEN_KNOWLEDGE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    tail = src[len(body):]
    assert src.startswith(body) and tail in ('\n', ';\n', ';', ''), '往返不一致，停'
    cat = [c for c in data['categories'] if c['id'] == 'huoyong'][0]
    it = [x for x in cat['items'] if x['name'] == '形容词使动用法'][0]
    new = svg()
    if it.get('图示') == new:
        print('无改动'); return 0
    if '--check' in sys.argv:
        print('需要更新'); return 1
    it['图示'] = new
    open(F, 'w', encoding='utf-8').write('window.NHZ_GUWEN_KNOWLEDGE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + tail)
    print('已更新 形容词使动用法 图示（%d 字符）' % len(new)); return 0


if __name__ == '__main__':
    sys.exit(main())
