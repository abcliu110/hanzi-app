"""Z 字卡 · 例词/例句不含本字（全 3500 字）。

审查报告第 15 节：通假/古义项给的词和句都是那个通假字（画「谋划」词「计划」），页面上看不到本字，
孩子会以为「计划」是「画」的组词。处理规则（机械、可重复运行）：
1. 运用链每格的「词」只保留含本字的；「—」等占位一并去掉。
2. 「句」不含本字的置空（含「（文言用法，现代口语少用。）」这类占位句）。
3. 处理后一格既无词、也无句、引文也不含本字：
   - 类型为「本义」：保留这一格（义项本身就是对本义的说明，如 页「人头」），只是没有词句；
   - 其他类型（通假、假借、古义引申）：整格删除——对小学生用处小，留着只会误导。
4. 一张卡至少保留一格；若全部会被删，保留原第一格（只做 1、2 步）。
用法：python3 tools/content/fix_zika_z_buhanzi.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from fix_zika_b_lib import index, load, save

def run():
    st = {'删词': 0, '清句': 0, '删格': 0, '改卡': 0}
    for z in [x['z'] for x in index()]:
        c = load(z); L = c['dim'].get('运用链') or []
        new = []
        for s in L:
            ws = s.get('词') or []
            keep = [w for w in ws if isinstance(w, str) and z in w]
            st['删词'] += len(ws) - len(keep)
            s['词'] = keep
            if s.get('句') and z not in s['句']:
                s['句'] = ''; st['清句'] += 1
            wen = s.get('文') if isinstance(s.get('文'), dict) else None
            has = keep or s.get('句') or (wen and z in (wen.get('text') or ''))
            if not has and s.get('类型') != '本义':
                st['删格'] += 1; continue
            new.append(s)
        if L and not new:
            new = [L[0]]; st['删格'] -= 1
        c['dim']['运用链'] = new
        if save(z, c):
            st['改卡'] += 1
    print(st)

if __name__ == '__main__':
    run()
