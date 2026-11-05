"""F6 部首键清理（bushou_ui.md 第 1、2 节）：
- 拆掉「X、Y」组合键、「?」「一字头」等 17 个异常条目，字并入主部首条目；
- data/index.js 的 bu 改成单个主部首，另存 bu2（「也可查」）；
- zi_map 同步；修明显错映射 盒/盖→皿、桌→木、鸡→鸟。
主部首取《现代汉语词典》《新华字典》部首检字表的通行归部；两部都收时取对儿童更直观、与本库题目口径一致的一个，另一个进 bu2。
可重复运行。"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_bushou_ui_lib as L
PD, PZ, PI = 'newhanzi/bushou/data.js', 'newhanzi/bushou/zi_map.js', 'newhanzi/data/index.js'
D, FD = L.load(PD); Z, FZ = L.load(PZ); I, FI = L.load(PI)
# 字: (index.bu, 部首条目键, bu2)
FIX = {
    '卫': ('卩', '卩', '乛'), '无': ('一', '一', '旡'), '内': ('冂', '冂', '丨'), '午': ('十', '十', '丿'),
    '史': ('口', '口', '丨'), '有': ('月', '月', ''), '背': ('月', '月', '北'), '鸡': ('鸟', '鸟', '又'),
    '果': ('木', '木', '丨'), '乳': ('乙', '乛', '爫'), '奏': ('大', '大', '一'), '看': ('目', '目', '手'),
    '羔': ('⺶', '⺶', '灬'), '桑': ('木', '木', '又'), '焉': ('灬', '火', ''), '乾': ('乙', '乛', '龺'),
    '章': ('立', '立', '音'), '辈': ('车', '车', '非'), '翰': ('羽', '羽', '龺'), '冀': ('八', '八', '匕'),
    '赣': ('贝', '贝', '音'),
    # 明显错映射
    '盒': ('皿', '皿', ''), '盖': ('皿', '皿', ''), '桌': ('木', '木', '⺊'),
}
# 家族含义：搬过去时改成现代常用义；古义/虚义的去掉（宁缺）
FM = {'奏': '演奏', '看': '用眼睛瞧', '背': '脊背', '乾': '干燥', '有': None, '焉': None, '盖': '盖子、遮盖',
      '桌': '桌子', '盒': '盒子', '鸡': '家禽，会打鸣'}
st = {e['z']: (e.get('st', 99), e.get('tl', '')) for e in I}
by = {r['bushou']: r for r in D}
log = []
# index
for e in I:
    if e['z'] in FIX:
        bu, key, bu2 = FIX[e['z']]
        if e['bu'] != bu:
            log.append('index %s: %s → %s' % (e['z'], e['bu'], bu)); e['bu'] = bu
        if bu2: e['bu2'] = bu2
        elif 'bu2' in e: del e['bu2']
# data.js：从旧条目移出，加入新条目
for z, (bu, key, bu2) in FIX.items():
    tgt = by[key]
    old_fm = None
    for r in D:
        if r is not tgt and z in r['chars']:
            r['chars'] = [c for c in r['chars'] if c != z]; r['count'] = len(r['chars'])
            old_fm = r['fm'].pop(z, old_fm)
            log.append('data %s: %s → %s' % (z, r['bushou'], key))
    if z not in tgt['chars']:
        tgt['chars'].append(z)
        tgt['chars'].sort(key=lambda c: st.get(c, (99, '')))
        tgt['count'] = len(tgt['chars'])
    fmv = FM.get(z, old_fm) if z in FM else old_fm
    if fmv: tgt['fm'][z] = fmv
    elif z in tgt['fm'] and z in FM: del tgt['fm'][z]
    Z[z] = key
# 删掉空了的异常条目
def abnormal(k): return len(k) != 1 or k == '?'
before = len(D)
D[:] = [r for r in D if not (r['count'] == 0 and (abnormal(r['bushou']) or r['bushou'] == '⺷'))]
if len(D) != before: log.append('删除条目 %d 个' % (before - len(D)))
left = [r['bushou'] for r in D if abnormal(r['bushou'])]
assert not left, left
assert not [z for z, v in Z.items() if abnormal(v)], 'zi_map 仍有异常键'
assert not [e['z'] for e in I if abnormal(e['bu'])], 'index 仍有异常 bu'
L.save(PD, D, FD); L.save(PZ, Z, FZ); L.save(PI, I, FI)
print('\n'.join(log)); print('条目数', len(D))
