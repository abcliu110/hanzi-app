"""F6 第 9/10/12/13 节：部首页「代表例字」清理（可重复运行）。
- 9 同一个字占多个例字位：只留第一次出现
- 12 例字不在《通用规范汉字表》（以 ziku/pinyin.csv 为准）的繁体/异体/生僻字：删除；in3500 标记按字库（data/index.js）重算
- 13 不适合儿童的例词：毙/妓/伥 删除；其余换成字卡运用链里的词（斩首→斩断类、毒药→病毒类），没有就删
- 10 例词里没有例字（写成了释义）：换成该字字卡（data/zika/<字>.js 运用链「词」）里第一个含该字的词，字卡没有就删掉这个例字
例词只取本仓库字卡已有的词，不自造（唯一例外：股→屁股，审查报告建议）。"""
import sys, os, re, json, io
sys.path.insert(0, os.path.dirname(__file__))
from fix_bushou_ui_lib import load, save
P = 'newhanzi/bushou/data.js'
D, fmt = load(P)
S8105 = set()
for l in io.open('newhanzi/ziku/pinyin.csv', encoding='utf-8').read().split('\n')[1:]:
    m = re.match(r'^\d+,(.),', l)
    if m: S8105.add(m.group(1))
I, _ = load('newhanzi/data/index.js'); S3500 = {e['z'] for e in I}
BAD = re.compile(r'斩首|枪毙|毙命|歌妓|伥鬼|毒药|尸体|死亡|二胎|二审')
DROP = {'毙', '妓', '伥', '尸'}
# 字卡词表第一个词偏古的，人工从同一字卡词表里挑常用词（仍只用字卡已有的词）
PICK = {'初': '初春', '竞': '竞赛', '略': '简略', '勾': '打勾', '此': '因此', '兜': '衣兜', '斩': '斩断',
        '卵': '鸡卵', '黔': '黔江', '异': '奇异', '哩': '多着哩', '甫': '杜甫', '股': '屁股', '亡': '亡羊补牢', '死': '生死', '毒': '病毒'}
_zc = {}
def zwords(z):
    if z not in _zc:
        p = 'newhanzi/data/zika/%s.js' % z; ws = []
        if os.path.exists(p):
            try:
                d, _f = load(p)
                for it in (d.get('dim', {}).get('运用链') or []):
                    for w in it.get('词') or []:
                        if z in w and not BAD.search(w) and len(w) <= 4 and w not in ws: ws.append(w)
            except Exception: pass
        if PICK.get(z) in ws: ws.remove(PICK[z]); ws.insert(0, PICK[z])
        if z == '股' and '屁股' not in ws: ws.insert(0, '屁股')  # 字卡词表只有股肱/股份等，按审查报告建议用「屁股」
        _zc[z] = ws
    return _zc[z]
c = {'dup': 0, 'not8105': 0, 'unfriendly_drop': 0, 'unfriendly_swap': 0, 'word_swap': 0, 'word_drop': 0, 'flag': 0}
log = []
for r in D:
    out, seen = [], set()
    for e in r['examples']:
        z, w = e['z'], e.get('w', '')
        if z in seen: c['dup'] += 1; continue
        if z not in S8105: c['not8105'] += 1; log.append('%s 删 %s(%s) 非规范字' % (r['bushou'], z, w)); continue
        if BAD.search(w or ''):
            if z in DROP: c['unfriendly_drop'] += 1; log.append('%s 删 %s(%s)' % (r['bushou'], z, w)); continue
            ws = zwords(z)
            if ws: e['w'] = ws[0]; c['unfriendly_swap'] += 1; log.append('%s %s(%s)→%s' % (r['bushou'], z, w, ws[0]))
            else: c['unfriendly_drop'] += 1; log.append('%s 删 %s(%s)' % (r['bushou'], z, w)); continue
        elif w and z not in w:
            ws = zwords(z)
            if ws: e['w'] = ws[0]; c['word_swap'] += 1; log.append('%s %s(%s)→%s' % (r['bushou'], z, w, ws[0]))
            else: c['word_drop'] += 1; log.append('%s 删 %s(%s) 字卡无词' % (r['bushou'], z, w)); continue
        f = z in S3500
        if bool(e.get('in3500')) != f: e['in3500'] = f; c['flag'] += 1
        seen.add(z); out.append(e)
    r['examples'] = out
save(P, D, fmt)
print(c); print('\n'.join(log))
