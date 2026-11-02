#!/usr/bin/env python3
"""批量生成部首"家族含义"：每个字在其部首意义家族中的一句话含义。

方法：
1. 取运用链"本义"义项（无则取首个义项）为核心语义
2. 清洗：去括号注、取首分句、去"专名"类过专义项
3. 部首动作类模板：扌/亻等加施事语境
4. 输出 {部首: {字: 家族含义}} JSON，供人工抽查 + 入库
"""
import json, re, os

ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(ROOT, 'ziku', 'model-3500.json')

# 部首语义（用于模板，取自研究报告白话含义的首句关键词）
# 动作类部首：含义句常需点出施事
ACTION_RAD = {
    '扌': '手', '亻': '人', '口': '口', '足': '脚', '目': '眼',
    '耳': '耳', '手': '手', '心': '心', '忄': '心',
}

def clean_yixiang(yx):
    """清洗义项：去括号、取首分句"""
    if not yx:
        return ''
    # 去括号内容
    yx = re.sub(r'[（(][^）)]*[）)]', '', yx)
    # 取首分句
    yx = re.split(r'[；;，。]', yx)[0].strip()
    # 去"专名"标记
    yx = yx.replace('（专名）', '').strip()
    return yx

def family_meaning(zi, bushou, yixiang, radical_meaning):
    """生成家族含义句"""
    yx = clean_yixiang(yixiang)
    if not yx or yx == '专名':
        # 回退：用部首含义兜底
        return ''
    # 动作类部首：如果义项是动词性，补施事
    if bushou in ACTION_RAD:
        subj = ACTION_RAD[bushou]
        # 如果义项已含施事（如"用手击"），直接用
        if subj in yx or '用' in yx[:2]:
            return yx
        # 动词性义项加施事
        if len(yx) <= 6:
            return f'用{subj}{yx}' if bushou in ('扌', '足') else f'{yx}'
    return yx

def main():
    m = json.load(open(MODEL, encoding='utf-8'))
    # bushou -> chars（从 index.js 读，保证与 app 一致）
    import subprocess
    idx = json.loads(subprocess.check_output(
        ['node', '-e', '''
global.window = {};
require("/home/hatch/workspace/repos/hanzi-app/newhanzi/data/index.js");
console.log(JSON.stringify(window.NHZ_INDEX.map(e => [e.z, e.bu])));
''']).decode('utf-8'))
    char_bu = dict(idx)
    char_rec = {x['zi']: x for x in m}

    out = {}
    stats = {'total': 0, 'empty': 0}
    for z, bu in char_bu.items():
        r = char_rec.get(z)
        if not r:
            continue
        yyl = r.get('dim', {}).get('运用链', [])
        benyi = [y for y in yyl if y.get('类型') == '本义']
        yx = (benyi[0] if benyi else (yyl[0] if yyl else {})).get('义项', '')
        fm = family_meaning(z, bu, yx, '')
        stats['total'] += 1
        if not fm:
            stats['empty'] += 1
            continue
        out.setdefault(bu, {})[z] = fm

    with open('/tmp/family_meanings_draft.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"total={stats['total']}, empty={stats['empty']}, radicals={len(out)}")
    # 抽查
    for bu in ['氵', '扌', '艹']:
        print(f'\n--- {bu} ---')
        for z, fm in list(out.get(bu, {}).items())[:8]:
            print(f'  {z}: {fm}')

if __name__ == '__main__':
    main()
