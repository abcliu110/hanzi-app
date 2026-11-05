"""F6 第 4 节：「阝」左耳刀（阜）/右耳刀（邑）分两段说明，各配例字；删除只有 1 个字的重复条目「邑」并入「阝」（可重复运行）。
依据：《说文》阜「大陸，山無石者」、邑「國也」；《现代汉语词典》阜＝土山。在字左的阝由阜变来，在字右的阝由邑变来（通行字典部首说明）。"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from fix_bushou_ui_lib import load, save
P = 'newhanzi/bushou/data.js'; ZP = 'newhanzi/bushou/zi_map.js'; IP = 'newhanzi/data/index.js'
D, fmt = load(P); Z, zfmt = load(ZP); I, ifmt = load(IP)
r = next(x for x in D if x['bushou'] == '阝')
LEFT = set('队防阶阳阴阵阿陈附际陆阻降陋陌陕限除陡险院陨陵陪陶陷隆随隋隐隅隘隔隙障隧')
r['benzi'] = '阜（左耳刀）/ 邑（右耳刀）'
r['bianti'] = ('阝有两种：在字的左边叫"左耳刀"，是"阜"的变形，阜就是土山；在字的右边叫"右耳刀"，'
               '是"邑"的变形，邑就是城镇。')
r['meaning'] = '左耳刀（阜）：土山、地势高低；右耳刀（邑）：城镇、地方。'
r['semantic'] = ('左耳刀旁的字多和山坡、地势高低有关，如阳、阴、陆、险、降、陡；'
                 '右耳刀旁的字多和城镇、地方、地名有关，如都、部、郊、邻、邮、郑。')
r['evo'] = ('左耳刀来自"阜"；右耳刀来自"邑"：甲骨文"邑"像围起来的城邑，金文小篆从"囗"从"卪"，'
            '在字右作偏旁时写作"阝"。')
r['examples'] = [{'z': z, 'w': w, 'in3500': True} for z, w in [
    ('阳', '太阳'), ('院', '医院'), ('陆', '大陆'), ('降', '下降'), ('险', '危险'),
    ('都', '首都'), ('部', '部分'), ('郊', '郊区'), ('邻', '邻居'), ('邮', '邮局')]]
chars = [c for c in r['chars'] if c != '邑']
r['chars'] = [c for c in chars if c in LEFT] + [c for c in chars if c not in LEFT] + ['邑']
r['count'] = len(r['chars'])
r['fm']['邑'] = '城镇、聚居地'
svg = r.get('图示') or ''
for a, b in [('阝（邑·右耳刀）', '阝（左阜·右邑）'),
             ('表示"城邑、封地"及地域行政的意义范畴。', '左耳刀（阜）：土山；右耳刀（邑）：城镇。'),
             ('>都</text>', '>阳</text>'), ('>首都</text>', '>太阳（左耳刀）</text>'),
             ('>部</text>', '>陆</text>'), ('>部分</text>', '>大陆（左耳刀）</text>'),
             ('>郊区</text>', '>郊区（右耳刀）</text>'), ('>邻居</text>', '>邻居（右耳刀）</text>'),
             ('💡 含阝的字多与邑·右耳刀相关', '💡 阝在左多和山坡地势有关，在右多和城镇地方有关')]:
    svg = svg.replace(a, b)
r['图示'] = svg
D[:] = [x for x in D if x['bushou'] != '邑']
Z['邑'] = '阝'
for e in I:
    if e['z'] == '邑':
        e['bu'] = '阝'; e['bu2'] = '邑'
save(P, D, fmt); save(ZP, Z, zfmt); save(IP, I, ifmt)
print('ok', r['count'], len(D))
