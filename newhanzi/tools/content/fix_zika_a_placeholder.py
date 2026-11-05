#!/usr/bin/env python3
"""zika-a：清除显示给孩子的「待查」「（示例）」「示例：」占位（只动第 1–1750 字）。
规则（可重复运行，幂等）：
- 运用链.文 的 text/出处 含「待查/待补」→ 文 = null（页面不渲染古文框）
- 运用链.词 中带「待查」的词 → 删除（多为冷僻词，不补）
- 运用链.句：去掉「（示例）」「示例：」前后缀；整句只是「…出处待查」类说明 → 置空
- 字源.可信度 = 「待查」→ 删除该键（页面显示「未标注」，不再显示「说法尚待核对」）
- 义项/形声拆解/易错提示：删去「（…待查…）」括注、「，待查」「——待查」尾巴；整段只剩「待查」→ 置空
用法：python3 tools/content/fix_zika_a_placeholder.py [--dry]
"""
import re, sys, json
sys.path.insert(0, __import__('os').path.dirname(__file__))
import fix_zika_a_lib as L
DRY = '--dry' in sys.argv
PH = re.compile(r'待查|待补')

def clean_txt(t):
    if not t or not PH.search(t): return t
    o = t
    t = re.sub(r'（[^（）]*(待查|待补)[^（）]*）', '', t)
    t = re.sub(r'\([^()]*(待查|待补)[^()]*\)', '', t)
    t = re.sub(r'［[^［］]*(待查|待补)[^［］]*］', '', t)
    t = re.sub(r'[，,；;、：:—\-]*\s*[^，。；：:（）［］]*(待查|待补)[。.]?', '', t)
    t = re.sub(r'^[：:\s；;。，]+|[：:\s；;，]+$', '', t)
    t = re.sub(r'；；+', '；', t).replace('；。', '。').replace('，。', '。')
    if re.fullmatch(r'[\s。，；：]*', t): t = ''
    return t

def run():
    log = []
    for z in L.chars_a():
        d = L.load(z); dm = d['dim']
        for i, s in enumerate(dm.get('运用链') or []):
            tx = s.get('文')
            if isinstance(tx, dict) and PH.search((tx.get('text') or '') + (tx.get('出处') or '')):
                s['文'] = None; log.append((z, f'文[{i}]', json.dumps(tx, ensure_ascii=False), 'null'))
            ws = s.get('词') or []
            nw = [w for w in ws if not PH.search(w)]
            if nw != ws: log.append((z, f'词[{i}]', '、'.join(ws), '、'.join(nw))); s['词'] = nw
            jz = s.get('句') or ''
            nj = re.sub(r'^\s*(（示例）|\(示例\)|示例[：:])\s*|\s*(（示例）|\(示例\))\s*$', '', jz)
            if PH.search(nj) and re.search(r'出处待查|用法待查|^[^。]{0,12}待查。?$', nj): nj = ''
            elif PH.search(nj): nj = clean_txt(nj)
            if nj != jz: log.append((z, f'句[{i}]', jz, nj)); s['句'] = nj
            yx = s.get('义项') or ''
            if PH.search(yx):
                ny = clean_txt(yx); log.append((z, f'义项[{i}]', yx, ny)); s['义项'] = ny
        zy = dm.get('字源') or {}
        if zy.get('可信度') == '待查':
            del zy['可信度']; log.append((z, '可信度', '待查', '(删)'))
        xs = dm.get('形声拆解') or {}
        for k in ('meaning', 'sound', 'note'):
            v = xs.get(k)
            if isinstance(v, str) and PH.search(v):
                nv = clean_txt(v); log.append((z, f'形声拆解.{k}', v, nv)); xs[k] = nv
        if dm.get('易错提示'):
            nt = [clean_txt(t) for t in dm['易错提示']]
            if nt != dm['易错提示']:
                log.append((z, '易错提示', ' | '.join(dm['易错提示']), ' | '.join(nt)))
                dm['易错提示'] = [t for t in nt if t]
        if not DRY: L.save(z, d)
    return log

if __name__ == '__main__':
    lg = run()
    for r in lg: print('\t'.join(r))
    print('共', len(lg), '处', '（dry）' if DRY else '')
