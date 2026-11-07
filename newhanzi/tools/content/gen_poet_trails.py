#!/usr/bin/env python3
"""诗人足迹（A22-13）轨迹数据 → data/poet_trails.js + wb/s/route_*.js（幂等；--check 只校验不写）。

规则（负责人 2026-11-07）：trail 必须按年谱有出处，核不了的诗人不做。
- 每站的年份与地点都要能在 src 所列年谱/年表里找到；诗挂到站上，要么年谱本条列了该诗，
  要么 note 里写明「作地据本库赏析」（data/shangxi.js 已有数据）。
- 年谱之间系年不同的，tag 写「一说…」；年谱本身写「约」「前后」的，tag 写「约」。
- 杜牧：没找到可在线核对的年谱（只有百科生平），按规则不做（2026-11-07）。
- 诗题必须与 data/shici.js 收录一致（脚本会校验）。
坐标：x=(经度-74)/61*1000，y=(纬度-18)/35*1000，同城/近城略偏移以免叠在一起。
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

LB = ['台北市教育局「寻找李白」李白年表', 'https://tmrc.tiec.tp.edu.tw/HTML/RSR200811041123123RN/%E5%8F%83%E8%B3%BD%E4%BD%9C%E5%93%81-%E5%B0%8B%E6%89%BE%E6%9D%8E%E7%99%BD/%E6%AD%B2%E6%9C%88%E8%A8%98%E4%BA%8B.htm']
DF = ['杜甫生平与文学创作年表（据《杜工部集》及历代编年）', 'https://www.dufugushi.com/dufunianbiao.html']
WW = ['陈铁民《王维年谱》（诗昆网转录）', 'https://www.shikun.net/show.asp?id=340']
WW2 = ['维基百科·王维（生平）', 'https://zh.wikipedia.org/wiki/%E7%8E%8B%E7%BB%B4']
MH = ['刘文刚《孟浩然年谱》（网页存档）', 'https://web.archive.org/web/20131220170222/http://web.it.nctu.edu.tw/~lccpan/newpage7.htm']
BJ = ['任见《白居易传》附年谱', 'https://www.sohu.com/a/411699330_643334']
BJ2 = ['维基百科·赋得古原草送别（引陈振孙、汪立名白居易年谱）', 'https://zh.wikipedia.org/wiki/%E8%B5%8B%E5%BE%97%E5%8F%A4%E5%8E%9F%E8%8D%89%E9%80%81%E5%88%AB']
SS = ['简要苏轼年谱', 'http://www.wcai.net/poetry/sudongpo/nianpu1.htm']
WC = ['维基百科·王昌龄（生平，据李云逸等考订）', 'https://zh.wikipedia.org/wiki/%E7%8E%8B%E6%98%8C%E9%BE%84']
WC2 = ['古诗文网·芙蓉楼送辛渐 创作背景', 'https://m.gushiwen.cn/shiwenv_f433a64dd504.aspx']
LY = ['《陆游的生平》分期年表', 'http://www.hygart.com/e24293.html']
LY2 = ['维基百科·陆游', 'https://zh.wikipedia.org/wiki/%E9%99%86%E6%B8%B8']
XQ = ['邓广铭《辛稼轩年谱》生平年表（古诗文网转录）', 'http://m.shangshiwen.com/ziliao_456.html']
XQ2 = ['古诗文网·辛弃疾介绍', 'http://m.shangshiwen.com/author_217.html']


def S(year, place, x, y, poems, src, note=None, tag=None, say=None):
    d = {'year': year, 'place': place, 'x': x, 'y': y, 'poems': poems, 'src': src[0]}
    if say: d['say'] = say
    if tag: d['tag'] = tag
    if note: d['note'] = note
    return d, src


POETS = [
  ('李白', '701–762', [LB], [
    S(724, '峨眉山', 482, 331, ['峨眉山月歌'], LB, '年表：二十四岁游峨眉山，出蜀，经三峡'),
    S(725, '庐山', 689, 334, ['望庐山瀑布', '望庐山瀑布水二首·其一'], LB, '年表：开元十三年登庐山，著《望庐山瀑布二首》'),
    S(725, '天门山', 724, 400, ['望天门山'], LB),
    S(728, '黄鹤楼', 661, 360, ['黄鹤楼送孟浩然之广陵'], LB, '年表系于728年暮春；古诗文网等创作背景作730年，孟浩然年谱作726年', '一说730'),
    S(732, '长安', 572, 466, ['行路难三首·其一'], LB, '年表：在长安穷途失路，作《行路难》'),
    S(736, '嵩山', 639, 471, ['将进酒'], LB, '年表：岑勋寻访李白至嵩山，元丹丘相邀，作《将进酒》'),
    S(742, '长安', 575, 462, [], LB, '年表：奉诏入京，待诏翰林；744年请还山'),
    S(753, '敬亭山', 756, 378, ['独坐敬亭山'], LB, '年表：从梁园南下宣城'),
    S(754, '桃花潭', 710, 352, ['赠汪伦'], LB, '年表：秋冬游秋浦、泾县', '一说755'),
    S(759, '白帝城', 582, 343, ['早发白帝城'], LB, '年表：流放夜郎途中至白帝城遇赦'),
  ]),
  ('杜甫', '712–770', [DF], [
    S(736, '泰山', 707, 520, ['望岳'], DF, '年表：游齐赵，往兖州省父'),
    S(757, '长安', 572, 466, ['春望'], DF, '年表：困在沦陷的长安，四月逃往凤翔'),
    S(761, '成都', 493, 360, ['春夜喜雨', '茅屋为秋风所破歌', '江畔独步寻花七绝句·其一', '江畔独步寻花（其五）'], DF, '年表：上元二年在成都草堂'),
    S(763, '梓州', 510, 374, ['闻官军收河南河北'], DF, '年表：广德元年春在梓州'),
    S(764, '成都', 497, 356, ['绝句（两个黄鹂鸣翠柳）', '绝句（迟日江山丽）'], DF, '年表：应严武邀携家返蜀；两首《绝句》作于回到草堂后，据本库赏析'),
    S(767, '夔州', 582, 343, ['登高'], DF, '年表：大历二年移居赤甲、瀼西、东屯，都在夔州'),
    S(770, '湘江舟中', 640, 308, [], DF, '年表：病逝于潭州、岳州之间的舟中', say='770年冬，杜甫病逝在潭州到岳州之间的船上。'),
  ]),
  ('王维', '701–761', [WW, WW2], [
    S(701, '蒲州', 597, 480, [], WW2, '生于蒲州（今山西永济）', say='701年，王维出生在蒲州。'),
    S(717, '长安', 572, 466, ['九月九日忆山东兄弟'], WW, '年谱：十七岁，在长安，间至洛阳'),
    S(737, '凉州', 469, 569, ['使至塞上'], WW2, '737年以监察御史出使凉州慰劳将士；《使至塞上》作于此行，据古诗文网创作背景'),
    S(761, '长安', 575, 462, [], WW2, '761年去世。《鹿柴》《竹里馆》属辋川集、《送元二使安西》，年谱未见确切系年，未挂站', say='761年，王维在长安去世。'),
  ]),
  ('孟浩然', '689–740', [MH], [
    S(711, '鹿门山', 626, 400, [], MH, '年谱：与张子容同隐鹿门山。《春晓》《过故人庄》年谱未系年，未挂站', say='711年前后，孟浩然隐居在鹿门山。'),
    S(717, '洞庭湖', 641, 326, ['望洞庭湖赠张丞相'], MH, '年谱：八月游洞庭，登岳阳楼作诗献张说（此诗一题《岳阳楼》）；一说赠张九龄', '一说733'),
    S(726, '武昌', 661, 360, [], MH, '年谱：三月游扬州途经武昌，李白于黄鹤楼作诗送行（各家系年不同）'),
    S(728, '长安', 572, 466, [], MH, '年谱：在长安应进士不第，冬离开'),
    S(729, '建德江', 743, 329, ['宿建德江'], MH, '年谱：秋往游吴越，冬游桐庐江、建德江'),
    S(740, '襄阳', 619, 405, [], MH, '年谱：疾发，终于襄阳南园', say='740年，孟浩然在襄阳家中去世。'),
  ]),
  ('白居易', '772–846', [BJ, BJ2], [
    S(787, '长安', 572, 466, ['赋得古原草送别'], BJ2, '陈振孙、汪立名年谱系于贞元三年；作地与谒顾况事有异说（一说在江南）', '作地有异说'),
    S(817, '庐山', 689, 334, ['大林寺桃花'], BJ, '年谱：在江州司马任，庐山草堂成，四月九日游大林寺'),
    S(822, '杭州', 765, 350, [], BJ, '年谱：七月除杭州刺史，十月到任'),
    S(824, '洛阳', 630, 474, [], BJ, '年谱：杭州任满，分司东都，卜居履道坊。《暮江吟》《忆江南》年谱未列，未挂站'),
  ]),
  ('苏轼', '1037–1101', [SS], [
    S(1072, '杭州', 757, 351, ['六月二十七日望湖楼醉书', '饮湖上初晴后雨'], SS, '1071年到杭州通判任；《望湖楼醉书》作于熙宁五年（本库赏析），年谱：熙宁六年作《饮湖上初晴后雨》'),
    S(1075, '密州', 741, 514, ['江城子·乙卯正月二十日夜记梦', '江城子·密州出猎', '水调歌头·明月几时有'], SS, '年谱：熙宁八年知密州作《江城子·记梦》；熙宁九年作《水调歌头·丙辰中秋》'),
    S(1082, '黄州', 672, 354, ['念奴娇·赤壁怀古', '定风波·莫听穿林打叶声'], SS, '年谱：元丰五年在黄州，两游赤壁，作《念奴娇·大江东去》；《定风波》题序记沙湖道中遇雨'),
    S(1082, '蕲水', 680, 370, ['浣溪沙·游蕲水清泉寺'], SS, '贬居黄州期间游蕲水清泉寺所作，作地据本库赏析', '黄州时期'),
    S(1084, '庐山', 689, 334, ['题西林壁'], SS, '年谱：元丰七年游庐山、石钟山，作《题西林壁》'),
  ]),
  ('王昌龄', '约698–约757', [WC, WC2], [
    S(725, '塞外', 469, 569, ['从军行', '出塞'], WC, '约725年有西北塞外之行，726年秋归；《出塞》《从军行》等边塞诗一般认为作于此行前后', '约'),
    S(727, '长安', 572, 466, [], WC, '进士及第'),
    S(742, '芙蓉楼', 744, 406, ['芙蓉楼送辛渐'], WC2, '任江宁丞时，在润州芙蓉楼送辛渐', '约'),
    S(748, '龙标', 592, 266, [], WC, '天宝年间贬龙标尉（743–753年之间）；李白《闻王昌龄左迁龙标遥有此寄》即为此事', '约'),
    S(757, '亳州', 685, 453, [], WC, '安史之乱中为刺史闾丘晓所杀（755–757年之间）', '约', say='安史之乱中，王昌龄在亳州被害。'),
  ]),
  ('陆游', '1125–1210', [LY, LY2], [
    S(1155, '沈园', 758, 340, ['钗头凤·红酥手'], LY, '年表：三十一岁春游沈园，题《钗头凤》'),
    S(1170, '夔州', 582, 343, [], LY, '年表：由山阴入蜀，冬到夔州任通判，作《入蜀记》'),
    S(1172, '南郑', 541, 431, [], LY, '年表：入王炎幕，驻南郑（三月至十一月）'),
    S(1172, '成都', 493, 360, [], LY, '年表：改成都府安抚司参议官，此后在蜀中至1178年'),
    S(1192, '山阴', 768, 350, ['秋夜将晓出篱门迎凉有感'], LY2, '1190年后长期居山阴；本诗作于绍熙三年秋，据本库赏析'),
    S(1210, '山阴', 764, 346, ['示儿'], LY, '年表：八十六岁卒，有《示儿》诗'),
  ]),
  ('辛弃疾', '1140–1207', [XQ, XQ2], [
    S(1140, '济南', 705, 534, [], XQ, '年谱：生于山东历城四风闸（时为金占区）', say='1140年，辛弃疾出生在济南。'),
    S(1182, '上饶', 720, 299, ['西江月·夜行黄沙道中', '清平乐·村居'], XQ, '年谱：1181年起建带湖新居，此后在上饶家居；两词作于上饶闲居时，据本库赏析'),
    S(1188, '上饶', 724, 303, ['破阵子·为陈同甫赋壮词以寄之'], XQ, '年谱：陈同甫（陈亮）来访，鹅湖同憩，长歌相答；此词为寄陈亮之作', '约'),
    S(1205, '京口', 744, 406, ['永遇乐·京口北固亭怀古'], XQ2, '开禧元年知镇江府，登北固亭作'),
    S(1207, '铅山', 706, 288, [], XQ, '年谱：1196年徙居铅山期思，1207年秋病逝', say='1207年秋，辛弃疾在铅山病逝。'),
  ]),
]

FILES = {'李白': 'route_libai', '杜甫': 'route_dufu', '王维': 'route_wangwei', '孟浩然': 'route_menghaoran',
         '白居易': 'route_baijuyi', '苏轼': 'route_sushi', '王昌龄': 'route_wangchangling',
         '陆游': 'route_luyou', '辛弃疾': 'route_xinqiji'}


def js(v):
    return json.dumps(v, ensure_ascii=False).replace('"', "'")


def station_js(d, keys=('year', 'place', 'x', 'y', 'poems', 'tag', 'note', 'src', 'say')):
    return '{ ' + ', '.join('%s: %s' % (k, js(d[k])) for k in keys if k in d) + ' }'


def default_say(poet, d):
    """旁白只念年份、地点、诗题（不念依据长注，控制每幕时长 ≤2 分钟）。"""
    yr = ('约' if d.get('tag') == '约' else '') + '%d年' % d['year']
    s = '%s，%s到了%s。' % (yr, poet, d['place'])
    if d['poems']:
        s += '在这里写下了' + '、'.join('《%s》' % t for t in d['poems']) + '。'
    return s


def build():
    for name, _, _, sts in POETS:
        for d, _ in sts:
            d.setdefault('say', default_say(name, d))
    data_lines = []
    for name, life, srcs, sts in POETS:
        rows = ',\n'.join('    ' + station_js(d) for d, _ in sts)
        src_js = ', '.join('{ t: %s, url: %s }' % (js(s[0]), js(s[1])) for s in srcs)
        data_lines.append("  { name: %s, life: %s, src: [%s], trail: [\n%s\n  ] }" % (js(name), js(life), src_js, rows))
    head = '''/* 诗人足迹地图 · 轨迹数据（设计 docs/gaijin/shici-gaijin-sheji.md P1-1；A22-13）
 * 本文件由 newhanzi/tools/content/gen_poet_trails.py 生成，改轨迹请改脚本再重跑（同时重写 wb/s/route_*.js）。
 * 规则（负责人 2026-11-07）：每站年份、地点须能在 src 所列年谱/年表找到；核不了的诗人不做（杜牧暂未做）。
 * 字段：year 年份，place 地名，x/y 0–1000 坐标（x=(经度-74)/61*1000，y=(纬度-18)/35*1000，近城略偏移），
 * poems 此地所作、且 data/shici.js 收录的诗题；tag「约 / 一说… / 作地有异说」；note 弹卡说明；src 本站依据。 */
'''
    out = {'data/poet_trails.js': head + 'window.NHZ_POET_TRAILS = { poets: [\n' + ',\n'.join(data_lines) + '\n] };\n'}
    for name, life, srcs, sts in POETS:
        places = ',\n'.join('      ' + station_js(dict(d, name=d['place']), ('name', 'x', 'y', 'year', 'poems', 'tag', 'note', 'src', 'say')) for d, _ in sts)
        n = len(sts)
        out['wb/s/%s.js' % FILES[name]] = (
            "/* 古诗白板：诗人足迹·%s（A22-13；由 tools/content/gen_poet_trails.py 从同一份年谱数据生成，勿手改）。\n"
            "   依据：%s。 */\n"
            "NHZWB.add('诗人足迹:%s', { scenes: [\n"
            "  { k: 'route', tab: '%s足迹', t: '%s', sub: '%s · %d 站',\n"
            "    places: [\n%s\n    ] }\n"
            "] });\n") % (name, '；'.join(s[0] for s in srcs), name, name, name, life, n, places)
    return out


def check_titles():
    code = "global.window={};require('./data/shici.js');process.stdout.write(JSON.stringify(window.NHZ_SHICI.poems.map(p=>[p.title,p.author])))"
    arr = json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT))
    have = set((t, a) for t, a in arr)
    bad = [(n, p) for n, _, _, sts in POETS for d, _ in sts for p in d['poems'] if (p, n) not in have]
    return bad


def main():
    bad = check_titles()
    if bad:
        print('诗题不在诗库：', bad); sys.exit(1)
    out = build()
    check = '--check' in sys.argv
    changed = 0
    for rel, txt in out.items():
        p = os.path.join(ROOT, rel)
        old = open(p, encoding='utf-8').read() if os.path.exists(p) else None
        if old != txt:
            changed += 1
            if not check:
                open(p, 'w', encoding='utf-8').write(txt)
    print(('需更新 ' if check else '写入 ') + '%d 个文件（共 %d）' % (changed, len(out)))
    if check and changed: sys.exit(1)


if __name__ == '__main__':
    main()
