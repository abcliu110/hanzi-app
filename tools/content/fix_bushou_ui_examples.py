"""F6 第 3/17 节：部首页例字根本不含该部件、或与题库归部判断矛盾的，删除或换成本部字表里的字（可重复运行）。
不新造例字：替换只取该条目 chars 里已有的字。"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from fix_bushou_ui_lib import load, save
P = 'newhanzi/bushou/data.js'
D, fmt = load(P)
E = {r['bushou']: r for r in D}
def drop(k, zs):
    r = E[k]; r['examples'] = [e for e in r['examples'] if e['z'] not in zs]
def dedup(k):
    r = E[k]; seen = set(); out = []
    for e in r['examples']:
        if e['z'] in seen: continue
        seen.add(e['z']); out.append(e)
    r['examples'] = out
def repl(k, z, nz, w):
    r = E[k]
    assert nz in r['chars'], (k, nz)
    for e in r['examples']:
        if e['z'] == z: e.update({'z': nz, 'w': w, 'in3500': True})
def sem(k, a, b):
    r = E[k]
    if a in r['semantic']: r['semantic'] = r['semantic'].replace(a, b)
# 页：头、脸不含「页」
repl('页', '头', '额', '额头'); repl('页', '脸', '颈', '颈椎')
sem('页', '如头、脸、顶、须、顿、顽、顾、领等', '如顶、额、颈、顿、顽、顾、领等')
# 己：巴、卷不含己，巷含的是巳；每字只留一个
drop('己', {'巴', '巷', '卷'}); dedup('己')
# 麦：霡 卖 来 荞 不含麦；衇（血+𠂢）、麹、麺 为异体/日文用字
drop('麦', {'霡', '卖', '来', '荞', '衇', '麹', '麺'})
# 隶：肆（镸+聿）不含隶；隸、穅 为繁体/异体
drop('隶', {'肆', '隸', '穅'})
# 曰：帽、慢只含「冒/曼」，归巾/忄部
drop('曰', {'帽', '慢'})
# 夕：歹、岁不含夕
drop('夕', {'歹', '岁'})
# 月：明归日部（题库 spot[7]「明不属于月部」）
drop('月', {'明'}); sem('月', '（如明、期）', '（如期、朗）')
# 鸟：鸣归口部（题库 spot[20]）
drop('鸟', {'鸣'}); sem('鸟', '鸦、鸣、鹰', '鸦、鹰')
# 耳：听（口+斤）不含耳；闻归门部（题库 choice[40]）
drop('耳', {'听', '闻'}); sem('耳', '如听、闻、聪、聋等', '如聪、聋、聆、聊等')
# 王：皇归白部（题库 spot[28]）
drop('王', {'皇'})
save(P, D, fmt)
print('ok')
