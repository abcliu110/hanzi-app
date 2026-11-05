#!/usr/bin/env python3
"""GW 古文线 · A21 / A22-9 / A22-10 数据前提：给 guwen.js 小学课内篇目逐句加 句[]（停顿 停、逐字对译 对）。幂等。

字段格式（MAIN 线引擎按此读取；所有字段可缺省，缺了就降级）：
  句: [ { 原:'群儿戏于庭，一儿登瓮，足跌没水中。',      // 原文按 。！？（连同其后的 ”’）切句，逐句拼接 == 原文
          今:'一群小孩在庭院里玩耍，……',              // 本句译意；逐句拼接 == 译意（只在 译意 能按同样规则切成同样句数时给）
          停:'群儿/戏于庭，一儿/登瓮，足跌/没水中。',  // 朗读停顿，用半角 / 标在字间；去掉 / 后 == 原。没有出处的句子不给 停
          停源:'https://…',                              // 该句停顿的出处（教参/课本课后题/教案转引）
          对:[ ['庭','庭院',{i:4,源:'重点'}], … ] } ]   // 逐字（词）对译：[原文词, 今义, {i: 词在本句 原 里的起始下标, 源}]
  · 对 只收有出处的注释：源=='重点' 表示取自本篇 重点 字段（新补 9 篇的 重点 出自古诗文网/课本注，见 出处 字段；
    原有篇目的 重点 为仓库已有数据）。同一个词在全文出现多次时只标第一次（与原文点读的橙线一致），不推断其余几处。
  · 对 不是全句逐字覆盖：没有注释的字不标、不编今译。断句题用 停，填今译题用 对，排序题可用 今（按标点切块）。
  · 式（句式标签）本批不做。
范围：ke=='小学课内' 的篇目；《伯牙鼓琴》本条为《列子》版、课本为《吕氏春秋》版（TODO_STATUS Q11 待负责人定），不标。
停顿出处：各家教案对同一句的停顿略有出入，每篇只取一个来源、照抄其斜线位置（标点按本应用原文），URL 见下表。
运行：python3 tools/content/fix_gw_ju_tingdui.py"""
import json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'data', 'guwen.js')

TING = {
 '学弈': ('https://www.300zi.com/jiaoan/1875976.html（教参“本文朗读时，句中可作如下停顿”）',
   ['弈秋，通国之/善弈者也。', '使/弈秋/诲/二人弈，其一人/专心致志，惟/弈秋之为听；一人/虽/听之，一心以为/有鸿鹄/将至，思/援弓缴/而射之。',
    '虽/与之/俱学，弗若之矣。', '为是/其智/弗若与？', '曰：非/然也。']),
 '两小儿辩日': ('https://www.so618.com/shiju/gMpz.html（人教版教参“朗读本文可按以下提示读好句中的停顿”；第三句旧版作“一儿以日初出远”，停顿位置照搬）',
   ['孔子东游，见/两小儿/辩斗，问其故。', '一儿曰：“我以/日始出时/去人近，而/日中时/远也。”', '一儿曰：“我以/日初出远，而/日中时/近也。”',
    '一儿曰：“日初出/大如车盖，及日中/则如盘盂，此不为/远者小/而/近者大乎？”', '一儿曰：“日初出/沧沧凉凉，及其日中/如探汤，此不为/近者热/而/远者凉乎？”',
    '孔子不能决也。', '两小儿笑曰：“孰/为汝/多知乎？”']),
 '守株待兔': ('https://www.ahsrst.cn/a/202303/868588.html（教案课件出示的停顿）',
   ['宋人/有耕者。', '田中/有株，兔走/触株，折颈/而死。', '因/释其耒/而守株，冀/复得兔。', '兔/不可/复得，而/身为/宋国/笑。']),
 '道边李苦': ('http://www.hx.wj.czedu.cn/html/article4667469.html（四上《王戎不取道旁李》研究课教案）',
   ['王戎/七岁，尝/与诸小儿/游。', '看道边/李树多子折枝，诸儿/竞走/取之，唯/戎不动。', '人问之，答曰：“树在道边/而多子，此必/苦李。”', '取之，信然。']),
 '司马光': ('https://www.chinajiaoan.cn/doc/1679436608549892.html（课后题“跟着老师朗读课文，注意词句间的停顿”答案）',
   ['群儿/戏于庭，一儿/登瓮，足跌/没水中。', '众/皆/弃去，光/持石/击瓮/破之，水迸，儿/得活。']),
 '精卫填海': ('http://office.teacheredu.cn/zaixianyulan/teacheredu/webroot/files/202201/task/35002/202267776117192014.pdf（课后第一题的节奏划分）',
   ['炎帝/之/少女，名曰/女娃。', '女娃/游于东海，溺而/不返，故为/精卫，常衔/西山之木石，以堙于/东海。']),
 '囊萤夜读': ('https://mip.21cnjy.com/P/23296830.html（课件“读好停顿”）',
   ['胤/恭勤不倦，博学多通。', '家贫/不常得油，夏月/则/练囊/盛数十萤火/以照书，以夜继日焉。']),
 '铁杵成针': ('https://www.tihai5.com/timu/8264980gimk.html（练习题答案，只给了第二、五句）',
   [None, '世传/李太白/读书山中，未成，弃去。', None, None, '太白/感其意，还/卒业。']),
 '古人谈读书': ('https://mip.zhideedu.com/item/zZDE2OWUxODY2OTEzNjkwMjY3MTFkODI5h.html（《古人谈读书》节奏划分；“我非生而知之者”“吾尝终日不食”两句来源未给，不标）',
   ['知之/为知之，不知/为不知，是知也。', '敏而/好学，不耻/下问。', '默而/识之，学而/不厌，诲人/不倦。', None, None,
    '余/尝谓/读书/有三到，谓/心到、眼到、口到。', '心不在此，则/眼不看仔细，心眼/既不专一，却只/漫浪诵读，决不能记，记/亦不能久也。',
    '三到之中，心到最急。', '心既到矣，眼口/岂不到乎？']),
 '自相矛盾': ('http://www.hx.wj.czedu.cn/html/article6303183.html（五下《自相矛盾》研究课教案“指导朗读”）',
   ['楚人/有/鬻盾与矛者，誉之曰：“吾盾之坚，物/莫能陷也。”', '又/誉其矛曰：“吾矛之利，于物/无不陷也。”', '或曰：“以子之矛陷子之盾，何如？”',
    '其人/弗能应也。', '夫/不可陷之盾/与/无不陷之矛，不可/同世而立。']),
 '杨氏之子': ('https://www.gushiwen.cn/shiwenv_af4715c0208f.aspx（古诗文网“解读文章”的停顿举例）',
   ['梁国/杨氏子/九岁，甚/聪惠。', '孔君平/诣/其父，父/不在，乃/呼儿出。', '为/设果，果/有杨梅。', '孔/指以示儿/曰：“此/是君家果。”', '儿/应声答/曰：“未闻/孔雀/是夫子家/禽。”']),
 '曹冲称象': ('https://www.51jiaoxi.com/doc-18517479.html（六上《文言文二则》课件朗读停顿）',
   ['邓哀王/冲/字仓舒，少/聪察岐嶷，生/五六岁，智意所及，有若/成人之智。', '时/孙权/曾致巨象，太祖/欲知其斤重，访之/群下，咸/莫能出其理。',
    '冲曰：“置象/大船之上，而刻其水痕所至，称物/以载之，则/校可知矣。”', '太祖大悦，即/施行焉。']),
 '书戴嵩画牛': ('https://wenku.docs.qq.com/detail?docId=MGhoFOASgw（六上《书戴嵩画牛》教学设计“课件出示”停顿）',
   ['蜀中/有杜处士，好书画，所宝/以百数。', '有戴嵩/《牛》一轴，尤所爱，锦囊玉轴，常以自随。', '一日/曝书画，有一牧童/见之，拊掌/大笑，曰：“此画/斗牛也。',
    '牛斗，力/在角，尾/搐入/两股间，今乃掉尾而斗，谬/矣。”', '处士/笑/而然之。', '古语有云：“耕/当问奴，织/当问婢。”', '不可/改也。']),
}
SKIP = {'伯牙鼓琴'}
SEN = re.compile(r'[^。！？]+[。！？][”’]*')

def load():
    js = ('const fs=require("fs"),vm=require("vm");const window={};vm.runInNewContext(fs.readFileSync(process.argv[1],"utf8"),{window});'
          'process.stdout.write(JSON.stringify(window.NHZ_GUWEN.texts));')
    return json.loads(subprocess.run(['node', '-e', js, G], check=True, capture_output=True).stdout.decode())

def build(t):
    yw, yy = t['原文'], t['译意']
    ss = SEN.findall(yw); assert ''.join(ss) == yw, t['title']
    jj = SEN.findall(yy)
    jin = jj if (''.join(jj) == yy and len(jj) == len(ss)) else None
    src, ting = TING[t['title']]
    assert len(ting) == len(ss), (t['title'], len(ting), len(ss))
    # 句起点
    starts, p = [], 0
    for s in ss: starts.append(p); p += len(s)
    dui = [[] for _ in ss]
    for z, g in t['重点']:
        k = yw.find(z)
        if k < 0: continue
        si = max(i for i, st in enumerate(starts) if st <= k)
        if k + len(z) > starts[si] + len(ss[si]): continue   # 跨句不标
        dui[si].append([z, g, {'i': k - starts[si], '源': '重点'}])
    out = []
    for i, s in enumerate(ss):
        o = {'原': s}
        if jin: o['今'] = jin[i]
        if ting[i] is not None:
            assert ting[i].replace('/', '') == s, (t['title'], i, ting[i], s)
            o['停'] = ting[i]; o['停源'] = src
        if dui[i]:
            o['对'] = sorted(dui[i], key=lambda x: x[2]['i'])
        out.append(o)
    return out

def main():
    T = load()
    s = open(G, encoding='utf8').read(); orig = s
    n = 0
    for t in T:
        if t.get('ke') != '小学课内' or t['title'] in SKIP: continue
        ju = build(t)
        line = '句:' + json.dumps(ju, ensure_ascii=False, separators=(',', ':'))
        tag = "{title:'%s'," % t['title']
        i = s.find(tag); assert i >= 0
        j = s.find('\n{title:', i + 1)
        if j < 0: j = s.rindex('\n]};')
        blk = s[i:j]
        end = blk.rstrip().rstrip(',').rstrip()
        assert end.endswith('}')
        tail = blk[len(end):]
        if '\n句:' in end:
            pre = end[:end.index('\n句:')]
            pre = pre[:-1] if pre.endswith(',') else pre
        else:
            pre = end[:-1]
        nb = pre + ',\n' + line + '}' + tail
        s = s[:i] + nb + s[j:]
        n += 1
    if s != orig: open(G, 'w', encoding='utf8').write(s)
    print('逐句标注 %d 篇' % n, '已写入' if s != orig else '无改动')

if __name__ == '__main__':
    main()
