"""Z 字卡 · 形近字重做（宁缺勿滥），覆盖全部 3500 张字卡。

做法（重复运行结果相同）：
1. 下线 `来源 = IDS算法初筛` 的全部条目（只要共享任一部件就配对，大↔韭、水↔丧）。
2. 原有人工条目（人工整理/人工curated/无来源的手写条）逐条看过：写错的删或改（REVIEW 表）。
3. 人工形近组 GROUPS：笔画增减/位置不同（大太犬天夫、己已巳、未末、土士…），辨析逐条手写。
4. 规则「同部件换偏旁」（清晴请情、慕暮墓幕）：两字结构相同、共享的部件在同一位置、
   不同的只是偏旁，且两个偏旁都在 RAD 表里（表里写了偏旁名称和大致意思）；共享部件 ≥4 画
   或在 SHARE_OK 白名单里。每字最多取 3 个，按课本识字表册次（低年级优先）排序，合成一条辨析，
   并附各字卡运用链里的第一个常用词。偏旁不在表里或部件太简单的一律不配（宁缺勿滥）。
5. 每字形近条目最多 4 条（人工组 > 原人工条 > 规则条）。

依赖：cjkvi-ids 的 ids.txt（https://github.com/cjkvi/cjkvi-ids ，GPLv2，只读取不入库），
默认缓存在 /tmp/zs/ids.txt，不存在时自动下载。
用法：python3 tools/content/fix_zika_xingjin.py [--dry]
"""
import json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from fix_zika_b_lib import index, load, save, ROOT

IDS_PATH = os.environ.get('IDS_TXT', '/tmp/zs/ids.txt')
IDS_URL = 'https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt'
SRC_RULE = '同部件换偏旁（规则整理）'
SRC_GROUP = '人工整理（常见易混字）'
MAXN = 4

# ---------- 偏旁表：位置 -> {部件: (名称, 意思或 '')} ----------
LEFT = {
 '氵': ('三点水', '和水有关'), '冫': ('两点水', '和冰、冷有关'), '扌': ('提手旁', '和手的动作有关'),
 '亻': ('单人旁', '和人有关'), '口': ('口字旁', '和嘴有关'), '日': ('日字旁', '和太阳、时间有关'),
 '目': ('目字旁', '和眼睛有关'), '月': ('月字旁', '多和身体有关'), '木': ('木字旁', '和树木有关'),
 '禾': ('禾木旁', '和庄稼有关'), '米': ('米字旁', '和粮食有关'), '纟': ('绞丝旁', '和丝线有关'),
 '讠': ('言字旁', '和说话有关'), '饣': ('食字旁', '和吃有关'), '钅': ('金字旁', '和金属有关'),
 '火': ('火字旁', '和火有关'), '土': ('提土旁', '和泥土有关'), '王': ('王字旁', '多和玉有关'),
 '石': ('石字旁', '和石头有关'), '忄': ('竖心旁', '和心情有关'), '犭': ('反犬旁', '和野兽有关'),
 '礻': ('示字旁', '和祭祀、祝福有关'), '衤': ('衣字旁', '和衣服有关'), '𧾷': ('足字旁', '和脚有关'),
 '车': ('车字旁', '和车有关'), '贝': ('贝字旁', '和钱财有关'), '马': ('马字旁', '和马有关'),
 '女': ('女字旁', ''), '山': ('山字旁', '和山有关'), '弓': ('弓字旁', ''), '虫': ('虫字旁', '和虫子有关'),
 '舟': ('舟字旁', '和船有关'), '耳': ('耳字旁', '和耳朵有关'), '彳': ('双人旁', '和走路有关'),
 '巾': ('巾字旁', '和布有关'), '阝': ('左耳刀', ''), '酉': ('酉字旁', ''), '鱼': ('鱼字旁', '和鱼有关'),
 '革': ('革字旁', '和皮革有关'), '牜': ('牛字旁', '和牛有关'), '歹': ('歹字旁', ''), '方': ('方字旁', ''),
 '子': ('子字旁', ''), '矢': ('矢字旁', ''), '立': ('立字旁', ''), '白': ('白字旁', ''), '田': ('田字旁', ''),
}
RIGHT = {
 '页': ('页字边', '多和头有关'), '刂': ('立刀旁', '和刀有关'), '攵': ('反文旁', ''), '欠': ('欠字边', ''),
 '力': ('力字边', '和力气有关'), '鸟': ('鸟字边', '和鸟有关'), '阝': ('右耳刀', ''), '殳': ('殳字边', ''),
 '隹': ('隹字边', ''), '彡': ('三撇', ''), '斤': ('斤字边', ''), '见': ('见字边', ''), '戈': ('戈字边', ''),
 '寸': ('寸字边', ''),
}
TOP = {
 '艹': ('草字头', '和草有关'), '竹': ('竹字头', '和竹子有关'), '宀': ('宝盖头', '和房屋有关'),
 '雨': ('雨字头', '和天气有关'), '穴': ('穴宝盖', ''), '冖': ('秃宝盖', ''), '罒': ('四字头', ''),
 '山': ('山字头', ''), '日': ('日字头', ''),
}
BOTTOM = {
 '心': ('心字底', '和心情有关'), '㣺': ('心字底（写成小）', '和心情有关'), '灬': ('四点底', '和火有关'),
 '皿': ('皿字底', '和器皿有关'), '土': ('土字底', ''), '日': ('日字底', ''), '巾': ('巾字底', ''),
 '手': ('手字底', ''), '贝': ('贝字底', ''), '女': ('女字底', ''), '木': ('木字底', ''), '虫': ('虫字底', ''),
 '口': ('口字底', ''), '火': ('火字底', ''), '衣': ('衣字底', ''), '石': ('石字底', ''), '米': ('米字底', ''),
 '子': ('子字底', ''), '玉': ('玉字底', ''), '言': ('言字底', ''), '足': ('足字底', ''), '目': ('目字底', ''),
 '鸟': ('鸟字底', ''), '马': ('马字底', ''), '力': ('力字底', ''), '大': ('大字底', ''), '云': ('云字底', ''),
}
ENC = {  # 包围结构：外框
 ('⿺', 0): {'辶': ('走之底', '和行走有关'), '走': ('走字底', '和行走有关'), '廴': ('建之旁', '')},
 ('⿸', 0): {'疒': ('病字旁', '和疾病有关'), '广': ('广字旁', '和房屋有关'), '尸': ('尸字头', ''),
            '厂': ('厂字旁', ''), '户': ('户字头', '')},
 ('⿵', 0): {'门': ('门字框', '')},
}
RAD = {('⿰', 0): LEFT, ('⿰', 1): RIGHT, ('⿱', 0): TOP, ('⿱', 1): BOTTOM}
RAD.update(ENC)
SHARE_OK = set('也巴马工丁及己方少羊白')
BAD_SHARE = set('厶乚丩卂夂匕乂丷八几刀力又寸卜七九儿二亠冖爫彐')  # 太简单的部件，换偏旁后并不易混  # 不足 4 画但换偏旁是课本常考的部件

# ---------- 人工形近组（辨析手写；只给组里在 3500 字表里的字） ----------
GROUPS = [
 ('大太犬天夫', '大加一点在下面是太（太阳），加一点在右上是犬（小犬），上面加一横是天（天空），天的撇穿出上面就是夫（农夫）'),
 ('己已巳', '己开口最大（自己），已半封口（已经），巳全封口（巳时）'),
 ('土士', '土上面一横短、下面一横长（泥土）；士上面一横长、下面一横短（战士）'),
 ('王玉主', '王加一点在右下是玉（玉石），加一点在头上是主（主人）'),
 ('戊戌戍戎', '戊（wù）里面是空的；戌（xū）里面一横；戍（shù）里面一点；戎（róng）里面是十字'),
 ('贝见', '贝下面是撇和点（宝贝），见下面是撇和竖弯钩（看见）'),
 ('白自', '自比白里面多一横（自己），白里面只有一横（白色）'),
 ('今令', '令比今下面多一点（命令），今没有这一点（今天）'),
 ('拔拨', '拔右边比友多一点（拔河），拨右边是发（拨打）'),
 ('买卖', '卖比买上面多个十（卖东西），买上面没有十（买东西）'),
 ('休体', '休右边是木（休息），体右边是本（身体）'),
 ('良艮', '良比艮上面多一点（良好），艮没有这一点'),
 ('狼狠', '狼右边是良，有一点（狼群）；狠右边是艮，没有点（狠心）'),
 ('历厉', '历里面是力（日历），厉里面是万（厉害）'),
 ('宇字', '宇下面是于（宇宙），字下面是子（写字）'),
 ('儿几', '儿第二笔是竖弯钩（儿子），几第二笔是横折弯钩（几个）'),
 ('乞气', '气比乞多一横（空气），乞只有一横（乞求）'),
 ('勺匀', '勺里面是一点（勺子），匀里面是两笔（均匀）'),
 ('目且', '且最下面一横长，两头伸出来（而且）；目最下面一横不伸出来（目光）'),
 ('木本术', '木加一短横在下面是本（本子），加一点在右上是术（技术）'),
 ('王丰', '丰的竖上下都出头（丰收），王的竖不出头（大王）'),
 ('兵乒乓', '兵下面是两点（士兵），乒只留左下一撇，乓只留右下一点（乒乓球）'),
 ('师帅', '师比帅右边多一横（老师），帅没有这一横（元帅）'),
 ('复夏', '复上面是撇、横和日（复习），夏上面是一横和自（夏天）'),
 ('密蜜', '密下面是山（秘密），蜜下面是虫（蜂蜜）'),
 ('券卷', '券下面是刀（入场券），卷下面是㔾（试卷）'),
 ('刀刃', '刃比刀多一点（刀刃），刀没有这一点（小刀）'),
 ('斤斥', '斥比斤多一点（斥责），斤没有这一点（公斤）'),
 ('又叉', '叉比又多一点（叉子），又没有这一点（又是）'),
 ('苦若', '苦下面是古（苦瓜），若下面是右（若是）'),
 ('了子', '子比了多一横（孩子），了没有这一横（好了）'),
 ('季李', '季上面是禾（季节），李上面是木（李子）'),
 ('杏呆', '杏是木在上、口在下（杏树）；呆是口在上、木在下（发呆）'),
 ('鸣呜', '鸣右边是鸟（鸟鸣），呜右边是乌，少一点（呜呜地哭）'),
 ('心必', '必比心多一撇（必须），心没有这一撇（开心）'),
 ('水永冰', '永比水上面多一点（永远），冰比水左边多两点水（冰块）'),
 ('方万', '方上面有一点（方向），万上面没有点（一万）'),
 ('代伐', '代右边是弋（代替），伐右边是戈，比弋多一撇（伐木）'),
 ('位住', '位右边是立（座位），住右边是主（住房）'),
 ('去云', '去上面是土、下面是厶（去年）；云上面是二、下面是厶（白云）'),
 ('用甩', '甩最后一笔是竖弯钩（甩手），用最后一笔是竖（用力）'),
 ('夕久', '夕最后一笔是点（夕阳），久最后一笔是捺（很久）'),
 ('刀刁', '刀第二笔是撇（小刀），刁第二笔是提（刁难）'),
 ('卵卯', '卵里面有两点（鸡卵），卯里面没有点（卯时）'),
 ('风凤', '风里面是㐅（大风），凤里面是又（凤凰）'),
 ('尺尽', '尽比尺下面多两点（尽力），尺没有点（尺子）'),
 ('寨赛', '上面一样：寨下面是木（山寨），赛下面是贝（比赛）'),
 ('上下', '上的长横在下面（上面），下的长横在上面（下面）'),
 ('幼幻', '幼右边是力（幼小），幻右边是横折钩（幻想）'),
 ('荧萤莹营', '上面一样：荧下面是火（荧光），萤下面是虫（萤火虫），莹下面是玉（晶莹），营下面是吕（营地）'),
 ('莺鸟', '莺比鸟上面多草字头和秃宝盖（黄莺）'),
 ('常堂掌赏', '上面一样：常下面是巾（常常），堂下面是土（课堂），掌下面是手（手掌），赏下面是贝（欣赏）'),
 ('慕暮墓幕', '上面都是莫：慕下面是小（心的变形，羡慕），暮下面是日（傍晚，暮色），墓下面是土（墓地），幕下面是巾（布，幕布）'),
]

# ---------- 原有人工条目复核：辨析原文（或其片段）-> 新文本 / None(删) ----------
REVIEW = {
 '上下面是长横，下下面是点': None,  # 由 GROUPS 上下 替代
 '临下面是彐，监下面是皿': None,
 '事比史下面多之': None,
 '形近辨析': None,
 '形近字：代/伐': None, '形近字：伐（fá 砍）—代（dài 替代）。': None,
 '形近：壬/王': '任右边是壬，上面是一撇（任务），不是王',
 '形近字：位/住': None,
 '形近字：去/云': None,
 '形近字：方/万': None,
 '形近字：用/甩': None,
 '形近字：话/活/括': None,
 '头上面有一点，买上面没有点': None,
 '寨上面多一个宀，赛上面只有一个宀': None,
 '恭上面是共，慕上面是莫': None,
 '暮上面是日，慕下面是心': None,
 '本下面多一横，禾上面是撇': None,
 '枣下面是朿，束下面是口': None,
 '棘是两个束上下相叠，辣左边是辛右边是束': None,
 '棠比堂左边多木字旁，下面是口，堂下面是土': None,
 '形近字：天—夭，“夭”的第一笔是撇。': '沃右边是夭，第一笔是撇（肥沃），不是天',
 '熏比黑上面多重': None,
 '莹下面是火和玉，萤下面是虫': None, '萤下面是虫，莹下面是火和玉': None,
 '营下面是吕和口，萤下面是虫': None, '萤比荧上面多草字头': None,
 '莺比鸟上面多草字头': None, '鹰上面是广，莺上面是草字头': None,
 '莽下面是犬，芒下面是亡': None,
 '隆右边是生，降右边是夅': None,
 '风右边是叉': None, '凤右边是鸟，风右边是叉': None,
 '趁比乘左边多走字旁': None,
 '跃右边是翟，踊右边是勇': None, '踊右边是勇，跃右边是翟': None,
 '遣比贵左边多走之底': None,
 '面比而外面多方框': None,
 '表比衣下面多毛': None,
 '久比夕多一捺': None,
 '印左边是爪，却左边是去': None,
 '卵比卯上面多一撇': None,
 '刁下面是竖，刀下面是撇': None,
 '尽比尺上面多尸': None,
 '工下面是横，才下面是撇': None, '才下面是撇，工下面是横': None,
 '康比庸上面多广字头': None,
 '幼下面是力，幻下面是横折': None,
 '常下面是巾，堂下面是土': None,
 '德右边是十目心，得右边是日寸': '德右边是十、罒、一、心（道德），得右边是日和寸（得到）',
 '乌比鸟少一点': '乌比鸟少一点（乌鸦全身黑，看不见眼睛）',
}

TONE_GRADE = ['1上', '1下', '2上', '2下', '3上', '3下', '4上', '4下', '5上', '5下', '6上', '6下']


def load_ids():
    if not os.path.exists(IDS_PATH):
        os.makedirs(os.path.dirname(IDS_PATH), exist_ok=True)
        urllib.request.urlretrieve(IDS_URL, IDS_PATH)
    ids = {}
    for l in open(IDS_PATH, encoding='utf-8'):
        if l.startswith('#'):
            continue
        p = l.rstrip('\n').split('\t')
        if len(p) < 3:
            continue
        pick = None
        for v in p[2:]:
            m = re.match(r'(.*?)(\[([A-Z]+)\])?$', v)
            if m.group(3) is None or 'G' in m.group(3):
                pick = m.group(1); break
        ids[p[1]] = pick or re.sub(r'\[.*\]', '', p[2])
    return ids


def grade_map():
    import subprocess
    js = "const window={};eval(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(JSON.stringify(window.NHZ_GRADE_MAP))"
    return json.loads(subprocess.check_output(['node', '-e', js, os.path.join(ROOT, 'newhanzi/data/grade_map.js')]))


def first_word(card, z, G, SS):
    """取最常用的一个例词：其余字都在字表且课本册次最低；同分取两字词、取靠前的。"""
    best = None
    for si, s in enumerate(card['dim'].get('运用链') or []):
        for wi, w in enumerate(s.get('词') or []):
            if not (isinstance(w, str) and z in w and len(w) == 2) or re.search(r'[（(a-zA-Z…]', w):
                continue
            rest = [c for c in w if c != z]
            if not all(c in SS for c in rest):
                continue
            g = max((TONE_GRADE.index(G[c]) if G.get(c) in TONE_GRADE else 20) for c in rest) if rest else 0
            key = (g + {'本义': 8, '假借': 2}.get(s.get('类型'), 0), len(w), si, wi)  # 本义格多是古义词（洋水、涂水），往后排
            if best is None or key < best[0]:
                best = (key, w)
    return best[1] if best and best[0][0] < 12 else ''


def main(dry=False):
    IDX = index(); S = [x['z'] for x in IDX]; SS = set(S)
    st = {x['z']: x['st'] for x in IDX}
    G = grade_map()
    grank = lambda z: (TONE_GRADE.index(G[z]) if G.get(z) in TONE_GRADE else 20, S.index(z))
    ids = load_ids()
    cards = {z: load(z) for z in S}
    words = {z: first_word(cards[z], z, G, SS) for z in S}
    ALLRAD = set().union(*[set(t) for t in RAD.values()])
    w = lambda z: f'（{words[z]}）' if words[z] else ''

    # 规则：同部件换偏旁
    fam = {}   # (op, radpos, shared) -> [(z, rad)]
    for z in S:
        d = ids.get(z, '')
        if len(d) != 3 or d[0] not in '⿰⿱⿺⿸⿵':
            continue
        for rp in (0, 1):
            tab = RAD.get((d[0], rp))
            if not tab:
                continue
            rad, shared = d[1 + rp], d[2 - rp]
            if rad not in tab or shared in tab and shared == rad:
                continue
            if ord(shared) >= 0x20000 or shared in BAD_SHARE or (shared in ALLRAD and shared not in SHARE_OK):
                continue  # 扩展区部件页面显示不出；共享的是偏旁本身（讨/谁/设、泪/相）不算形近
            ok = shared in SHARE_OK or (st.get(shared, 4) >= 4 if shared in SS else not re.match(r'[\u31c0-\u31ef一丨丿丶乛乙]', shared))
            if ok:
                fam.setdefault((d[0], rp, shared), []).append((z, rad))
    rule = {}  # z -> text
    for (op, rp, shared), mem in fam.items():
        rads = {}
        for z, r in mem:
            rads.setdefault(r, z)  # 同一偏旁只取一个（理论上不会重复）
        if len(mem) < 2:
            continue
        tab = RAD[(op, rp)]
        for z, r in mem:
            others = sorted([m for m in mem if m[0] != z and m[1] != r], key=lambda m: grank(m[0]))[:3]
            if not others:
                continue
            lst = [(z, r)] + others
            def one(c, rr):
                return f'{c}是{tab[rr][0]}' + w(c)   # 不写偏旁“和…有关”：今义常对不上（称≠庄稼）
            names = '、'.join(c for c, _ in lst)
            rule[z] = (f'{names}都有「{shared}」，偏旁不同：' + '，'.join(one(c, rr) for c, rr in lst) + '。',
                       [c for c, _ in others])

    stat = {'IDS删': 0, '原人工删': 0, '原人工改': 0, '组': 0, '规则': 0, '改卡': 0, '无形近': 0}
    for z in S:
        c = cards[z]; dim = c['dim']
        old = dim.get('形近字') or []
        if isinstance(old, dict):
            old = [old]
        new, covered = [], set()
        # 人工组
        for chars, text in GROUPS:
            if z in chars:
                oth = [x for x in chars if x != z and x in SS]
                if oth:
                    new.append({'字': '/'.join(oth), '辨析': text, '来源': SRC_GROUP}); covered |= set(oth); stat['组'] += 1
        # 原人工条
        for x in old:
            if isinstance(x, dict) and x.get('来源') == 'IDS算法初筛':
                stat['IDS删'] += 1; continue
            t = x if isinstance(x, str) else (x.get('辨析') or '')
            if t in REVIEW:
                if REVIEW[t] is None:
                    stat['原人工删'] += 1; continue
                x = dict(x) if isinstance(x, dict) else {'辨析': t}
                x['辨析'] = REVIEW[t]; stat['原人工改'] += 1
            pz = set((x.get('字') or '').replace('/', '')) if isinstance(x, dict) else set()
            if pz and pz <= covered:
                continue  # 人工组已覆盖
            if any((y.get('辨析') if isinstance(y, dict) else y) == (x.get('辨析') if isinstance(x, dict) else x) for y in new):
                continue
            new.append(x); covered |= pz
        # 规则条
        if z in rule and len(new) < MAXN:
            text, oth = rule[z]
            if not set(oth) <= covered:
                new.append({'字': '/'.join(oth), '辨析': text, '来源': SRC_RULE}); stat['规则'] += 1
        new = new[:MAXN]
        if new != old:
            dim['形近字'] = new
            src = c.get('src') or {}
            if '形近字' in src:
                src['形近字'] = '老app.codes（人工复核）+人工形近组+同部件换偏旁规则（tools/content/fix_zika_xingjin.py）'
            if not dry and save(z, c):
                stat['改卡'] += 1
        if not new:
            stat['无形近'] += 1
    print(json.dumps(stat, ensure_ascii=False))


if __name__ == '__main__':
    main('--dry' in sys.argv)
