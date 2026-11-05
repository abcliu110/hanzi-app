#!/usr/bin/env python3
"""F1 语法 第 8 批：模板解析补理由（报告 §8）。幂等。
只复述答案的四种模板，接上讲解库 data.js 里同名子类的「说明」（讲解里已经写好的判断理由，不新编）：
  「这句用了X。」/「这句属于X。」 → 「这句用了X：<说明>」
  「A填在这里最合适，是X。」        → 「填「A」，是X：<说明>」
  「改正后是：S。；原句X。」        → 「改正后是「S」。原句的毛病是X：<说明>」（顺带去掉「。；」）
同名子类在讲解里有多条不同说明、或没有说明的，不动。
"""
import os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files, load_data, items


def main():
    d, _ = load_data()
    M = collections.defaultdict(set)
    for s, c, it in items(d):
        for f in it.get('分类', []):
            if f.get('说明') and f['类'] != f['说明']: M[f['类']].add(f['说明'].strip())
    def why(x):
        v = M.get(x)
        if not v or len(v) != 1: return None
        w = next(iter(v)); return w if w.endswith(('。', '！', '？')) else w + '。'
    n = 0
    for fn in bank_files():
        name, b, _ = load_bank(fn); ch = False
        for q in b['questions']:
            e = q.get('解析', ''); new = None
            m = re.match(r'^这句(用了|属于)(.+?)。$', e)
            if m and why(m.group(2)): new = '这句%s%s：%s' % (m.group(1), m.group(2), why(m.group(2)))
            m = re.match(r'^(.+?)填在这里最合适，是(.+?)。$', e)
            if m and why(m.group(2)): new = '填「%s」，是%s：%s' % (m.group(1).rstrip('。'), m.group(2), why(m.group(2)))
            m = re.match(r'^改正后是：(.+?)。?；原句(.+?)。$', e)
            if m and why(m.group(2)): new = '改正后是「%s」。原句的毛病是%s：%s' % (m.group(1).rstrip('。'), m.group(2), why(m.group(2)))
            if new and new != e:
                q['解析'] = new; n += 1; ch = True
        if ch: save_bank(fn, name, b, recount_total=False)
    return n


if __name__ == '__main__':
    print(main())
