#!/usr/bin/env python3
"""GW 线 · guwen.js 59 篇补学段字段（供 Q10 学段筛选；本脚本只写数据，不改页面默认显示）。幂等；--check 只校验。

字段：学段 ∈ 小学 / 初中 / 高中；学段源 = 依据（统编篇目 + 出处）。只标「统编教材篇目可核」的：
  · 小学：已有 ce（小学课内册次）的 14 篇，依据沿用该篇 ceBasis（统编小学册次，2026-11-04 build_guwen_level.py 已核）。
    其中《伯牙鼓琴》课本为《吕氏春秋》版、本条为《列子》版（Q11 待定），篇目在统编六上，照 ceBasis 原话标出差异。
  · 初中 / 高中：古诗文网「初中文言文」https://www.gushiwen.cn/wenyan/chuwen.aspx、「高中文言文」
    https://www.gushiwen.cn/wenyan/gaowen.aspx 的统编册次目录（高中只取必修、选择性必修，不算选修《中国古代诗歌散文欣赏》），
    再把本应用原文按句（≥3 字）逐句到该篇古诗文网原文里查，命中句数写在依据里（2026-11-07 抓取核对，表 XD）。
    篇名不同的照实写：《逍遥游（节选）》= 统编八下《北冥有鱼》原文；《燕雀安知鸿鹄之志》= 九年级《陈涉世家》开头；
    《己所不欲勿施于人》（卫灵公 15.24 子贡问）在统编高中选择性必修上《论语十二章》，不在七上《〈论语〉十二章》。
  · 不标（统编没有这篇文言原文，或只有白话改写）：刻舟求剑 掩耳盗铃 郑人买履 狐假虎威 画蛇添足 亡羊补牢 揠苗助长
    南辕北辙 买椟还珠 卧薪尝胆 破釜沉舟 完璧归赵 负荆请罪 小时了了 管宁割席 伤仲永（人教旧版七下，统编已无）
    始得西山宴游记（统编必修/选必无，旧人教选修有）。
运行：python3 tools/content/fix_gw_xueduan.py [--check]"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'data', 'guwen.js')
LIST = {'初中': '古诗文网「初中文言文」统编目录', '高中': '古诗文网「高中文言文」统编目录'}
# title -> (学段, 统编篇名, 古诗文网原文页, 本应用原文命中句数, 本应用原文句数)
XD = {
    '学而时习之': ('初中', '《论语》十二章', 'https://www.gushiwen.cn/shiwenv_d6640103678f.aspx', 3, 3),
    '温故而知新': ('初中', '《论语》十二章', 'https://www.gushiwen.cn/shiwenv_d6640103678f.aspx', 1, 1),
    '三人行必有我师': ('初中', '《论语》十二章', 'https://www.gushiwen.cn/shiwenv_d6640103678f.aspx', 2, 2),
    '学而不思则罔': ('初中', '《论语》十二章', 'https://www.gushiwen.cn/shiwenv_d6640103678f.aspx', 1, 1),
    '陋室铭': ('初中', '陋室铭', 'https://www.gushiwen.cn/shiwenv_6c1ea9b7dd44.aspx', 9, 9),
    '爱莲说': ('初中', '爱莲说', 'https://www.gushiwen.cn/shiwenv_6d2dcbe80f96.aspx', 7, 7),
    '吾日三省吾身': ('初中', '《论语》十二章', 'https://www.gushiwen.cn/shiwenv_d6640103678f.aspx', 3, 3),
    '己所不欲勿施于人': ('高中', '论语十二章', 'https://www.gushiwen.cn/shiwenv_48479bc1dedf.aspx', 3, 3),
    '桃花源记': ('初中', '桃花源记', 'https://www.gushiwen.cn/shiwenv_73add8822103.aspx', 29, 29),
    '岳阳楼记（节选）': ('初中', '岳阳楼记', 'https://www.gushiwen.cn/shiwenv_f3d6556dbcad.aspx', 15, 15),
    '燕雀安知鸿鹄之志': ('初中', '陈涉世家', 'https://www.gushiwen.cn/shiwenv_2a61bc6fe7d4.aspx', 4, 4),
    '鸿门宴（节选）': ('高中', '鸿门宴', 'https://www.gushiwen.cn/shiwenv_7cec0d1b3a86.aspx', 15, 15),
    '咏雪': ('初中', '咏雪', 'https://www.gushiwen.cn/shiwenv_a24c4f626d63.aspx', 6, 6),
    '陈太丘与友期': ('初中', '陈太丘与友期行', 'https://www.gushiwen.cn/shiwenv_d913f1cd0834.aspx', 8, 9),
    '师说': ('高中', '师说', 'https://www.gushiwen.cn/shiwenv_178197fd7202.aspx', 28, 28),
    '小石潭记': ('初中', '小石潭记', 'https://www.gushiwen.cn/shiwenv_1ab58966cf83.aspx', 12, 12),
    '记承天寺夜游': ('初中', '记承天寺夜游', 'https://www.gushiwen.cn/shiwenv_221828a8f12d.aspx', 7, 7),
    '马说': ('初中', '马说', 'https://www.gushiwen.cn/shiwenv_97ab33229f07.aspx', 8, 9),
    '醉翁亭记（节选）': ('初中', '醉翁亭记', 'https://www.gushiwen.cn/shiwenv_5cbf5b7be38f.aspx', 14, 14),
    '生于忧患死于安乐': ('初中', '生于忧患，死于安乐', 'https://www.gushiwen.cn/shiwenv_ff66d475ee44.aspx', 5, 5),
    '庖丁解牛': ('高中', '庖丁解牛', 'https://www.gushiwen.cn/shiwenv_8def13da8f71.aspx', 17, 17),
    '劝学（节选）': ('高中', '劝学', 'https://www.gushiwen.cn/shiwenv_9b5ed8061abe.aspx', 11, 13),
    '曹刿论战': ('初中', '曹刿论战', 'https://www.gushiwen.cn/shiwenv_0c4d9d86a850.aspx', 32, 32),
    '邹忌讽齐王纳谏': ('初中', '邹忌讽齐王纳谏', 'https://www.gushiwen.cn/shiwenv_1bba692e2e4c.aspx', 17, 18),
    '逍遥游（节选）': ('初中', '北冥有鱼', 'https://www.gushiwen.cn/shiwenv_970d99153fe9.aspx', 11, 11),
    '出师表（节选）': ('初中', '出师表', 'https://www.gushiwen.cn/shiwenv_8bc0871fe00b.aspx', 7, 8),
    '陈情表（节选）': ('高中', '陈情表', 'https://www.gushiwen.cn/shiwenv_f84986dafb2d.aspx', 28, 28),
    '兰亭集序（节选）': ('高中', '兰亭集序', 'https://www.gushiwen.cn/shiwenv_af279f0cdd95.aspx', 12, 12),
}


def load():
    js = ('const fs=require("fs"),vm=require("vm");const window={};vm.runInNewContext(fs.readFileSync(process.argv[1],"utf8"),{window});'
          'process.stdout.write(JSON.stringify(window.NHZ_GUWEN.texts));')
    return json.loads(subprocess.run(['node', '-e', js, G], check=True, capture_output=True).stdout.decode())


def want(t):
    if t.get('ce'):
        return '小学', '统编小学课内：' + (t.get('ceBasis') or t['ce'])
    if t['title'] in XD:
        st, name, url, hit, n = XD[t['title']]
        return st, '统编%s《%s》（%s；本应用原文 %d/%d 句与 %s 原文逐字一致，不计标点）' % (st, name.replace('《', '〈').replace('》', '〉'), LIST[st], hit, n, url)
    return None, None


def main():
    check = '--check' in sys.argv
    T = load()
    s = open(G, encoding='utf8').read(); orig = s
    cnt = {}
    for t in T:
        st, src = want(t)
        tag = "{title:'%s'," % t['title']
        i = s.find(tag); assert i >= 0, t['title']
        eol = s.find('\n', i)
        line = s[i:eol]
        line2 = re.sub(r" 学段:'[^']*', 学段源:'[^']*',", '', line)
        if st:
            assert "'" not in src
            line2 = line2.replace(tag, tag + " 学段:'%s', 学段源:'%s'," % (st, src), 1)
            cnt[st] = cnt.get(st, 0) + 1
        else:
            cnt['不标'] = cnt.get('不标', 0) + 1
        s = s[:i] + line2 + s[eol:]
    print('学段', cnt)
    if check:
        print('需要写入' if s != orig else '已是最新'); sys.exit(1 if s != orig else 0)
    if s != orig: open(G, 'w', encoding='utf8').write(s)
    print('已写入' if s != orig else '无改动')


if __name__ == '__main__':
    main()
