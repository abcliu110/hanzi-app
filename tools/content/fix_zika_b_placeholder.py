"""zika-b：清除第 1751–3500 字卡里显示给孩子的占位语（「待查」「（示例）」「示例：」「（说明）」）。
规则（宁删不编）：
- 运用链.词：含「待查」的词整条删除（多为冷僻/自造词）。
- 运用链.句：去掉「（示例）」「示例：」「（说明）」生成标记；句子本身含「待查」的清空。
- 运用链.文：text 为「待查」或含「待查」→ null；出处里的「待查」注 → 去掉该注（引文不含本字时整条置 null）。
- 字源.可信度 = 「待查」→ 删除该键（页面显示「未标注」，不再显示「说法尚待核对」）。
- 形声拆解 meaning/sound/note：删去含「待查」的括注；仍含「待查」的分句（按「；」切）整句删；只剩标点/破折号则置空。
用法：python3 tools/content/fix_zika_b_placeholder.py [--dry]"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_b_lib as L

MARK = re.compile(r'^\s*(（示例）|示例[：:])\s*|\s*(（示例）|（说明）)\s*$')
PAREN = re.compile(r'[（(［\[][^（）()［］\[\]]*待查[^（）()［］\[\]]*[）)］\]]')

def clean_part(s):
    if not s or '待查' not in s: return s
    s2 = PAREN.sub('', s)
    segs = [x for x in re.split(r'[；;]', s2) if x.strip()]
    segs = [x for x in segs if '待查' not in x]
    out = '；'.join(x.strip() for x in segs).replace('。；', '；')
    out = re.sub(r'^[\s。，、：:—\-]+$', '', out)
    out = re.sub(r'[，、：]\s*$', '', out).strip()
    if out and out[-1] not in '。！？）”」' and s.rstrip()[-1:] == '。': out += '。'
    return out

def fix_card(d):
    z = d['zi']; log = []
    for i, s in enumerate(d['dim'].get('运用链') or []):
        w = s.get('词') or []
        nw = [x for x in w if '待查' not in x]
        if nw != w: log.append(f'词[{i}] 删 {[x for x in w if "待查" in x]}'); s['词'] = nw
        j = s.get('句')
        if isinstance(j, str):
            nj = MARK.sub('', j)
            nj = MARK.sub('', nj)
            if '待查' in nj: nj = ''
            if nj != j: log.append(f'句[{i}] {j!r} → {nj!r}'); s['句'] = nj
        t = s.get('文')
        if isinstance(t, dict):
            tx = t.get('text') or ''; cc = t.get('出处') or ''
            if '待查' in tx or not tx.strip():
                s['文'] = None; log.append(f'文[{i}] 置空 {tx!r}')
            elif '待查' in cc:
                ncc = PAREN.sub('', cc).strip()
                if z not in tx: s['文'] = None; log.append(f'文[{i}] 不含本字且出处待查，置空')
                else: t['出处'] = ncc; log.append(f'文[{i}] 出处 {cc!r} → {ncc!r}')
    zy = d['dim'].get('字源')
    if isinstance(zy, dict) and (zy.get('可信度') or '').startswith('待查'):
        del zy['可信度']; log.append('可信度 待查 删')
    pd = d['dim'].get('形声拆解')
    if isinstance(pd, dict):
        for k in ('meaning', 'sound', 'note'):
            v = pd.get(k)
            if isinstance(v, str) and '待查' in v:
                nv = clean_part(v); pd[k] = nv; log.append(f'形声拆解.{k} {v!r} → {nv!r}')
    return log

if __name__ == '__main__':
    dry = '--dry' in sys.argv; n = 0
    for z in L.chars_b():
        d = L.load(z); lg = fix_card(d)
        if lg:
            for x in lg: print(z, x)
            if not dry and L.save(z, d): n += 1
    print('改卡', n)
