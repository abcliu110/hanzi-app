#!/usr/bin/env python3
"""F1 语法 第 7 批：乱码干扰项（报告 §10：「漂亮漂亮」「的的」「了了」「越来越越来越」）。幂等。
判定（只认确定的乱码，不碰「盼望着，盼望着」这类正常反复）：某个干扰项去掉一处「XX」重叠里的一份后，正好等于本题另一个选项或题干里的原句
——也就是生成器把原句里的词机械重复了一遍；另外含「的的」「了了」的干扰项也算。这样的干扰项直接删掉（不编造新干扰项），答案下标随之调整；解析里提到它的半句一并删去。
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files


def garbled(o, pool):
    o = str(o)
    if re.search(r'的的|了了(?!解)', o): return True   # 「的的」「了了」在这些句子里都是机械重复
    for L in range(1, 7):
        for i in range(len(o) - 2 * L + 1):
            r = o[i:i + L]
            if not re.match(r'^[\u4e00-\u9fa5]+$', r): continue
            if o[i + L:i + 2 * L] == r:
                if o[:i + L] + o[i + 2 * L:] in pool: return True
    return False


def main():
    tot = 0; qn = 0
    for fn in bank_files():
        name, d, _ = load_bank(fn); ch = False
        for q in d['questions']:
            stem = q['q'].split('\n')[-1].strip()
            pool = set(map(str, q['options'])) | {stem, stem.rstrip('。') + '。'}
            bad = [j for j, o in enumerate(q['options']) if j != q['answer'] and garbled(o, pool - {str(o)})]
            if not bad or len(q['options']) - len(bad) < 2: continue
            ans = q['options'][q['answer']]
            for j in bad:
                g = str(q['options'][j])
                e = q.get('解析', '')
                e = re.sub(r'「%s」[^；。]*[；。]' % re.escape(g.rstrip('。')), '', e)
                q['解析'] = e
            q['options'] = [o for j, o in enumerate(q['options']) if j not in bad]
            q['answer'] = q['options'].index(ans)
            tot += len(bad); qn += 1; ch = True
        if ch: save_bank(fn, name, d, recount_total=False)
    return qn, tot


if __name__ == '__main__':
    print(main())
