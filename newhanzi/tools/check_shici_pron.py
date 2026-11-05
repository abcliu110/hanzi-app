"""Q17 校验：shici.js 里 pron 字段的合法性。

检查：
1. pron 的字在该诗中出现；"字@行号" 键的行号在范围内且对应行含该字；
2. 读音是该字的查表读音之一（data/pinyin_lookup.js 含 Q6 新增的 xiá/jì/cuī/líng/wú/yù 等）；
3. 同字不出现 "字" 与 "字@行号" 混用；
4. （仅提示）读音等于查表主音时打印 INFO（Q3 的斜 xié 属注释性读音，允许）。

用法：python3 newhanzi/tools/check_shici_pron.py
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, '..', 'tools', 'content'))
import fix_shici_io as io  # noqa: E402


def load_lookup():
    s = open(os.path.join(ROOT, 'data', 'pinyin_lookup.js'), encoding='utf-8').read()
    m = re.search(r'window\.NHZ_PINYIN\s*=\s*(\{.*\})\s*;?\s*$', s, re.S)
    obj = json.loads(m.group(1))
    return {ch: v.split(',') for ch, v in obj.items()}


def main():
    lookup = load_lookup()
    doc = io.load('shici')
    poems = doc['poems']
    errors, infos, n_pron = [], [], 0
    for p in poems:
        pron = p.get('pron')
        if not pron:
            continue
        lines = p.get('lines', [])
        all_chars = ''.join(lines)
        for key, py in pron.items():
            n_pron += 1
            m = re.match(r'^(.*)@(\d+)$', key)
            ch, li = (m.group(1), int(m.group(2))) if m else (key, None)
            if len(ch) != 1:
                errors.append(f"{p.get('title')}：键 {key!r} 不是单字")
                continue
            if ch not in all_chars:
                errors.append(f"{p.get('title')}：pron 字 {ch!r} 不在诗中")
            if li is not None:
                if li >= len(lines):
                    errors.append(f"{p.get('title')}：{key!r} 行号 {li} 超出 {len(lines)} 行")
                elif ch not in lines[li]:
                    errors.append(f"{p.get('title')}：{key!r} 第 {li} 行无此字：{lines[li]!r}")
            if ch not in lookup:
                errors.append(f"{p.get('title')}：{ch!r} 不在 pinyin_lookup.js 中")
            elif py not in lookup[ch]:
                errors.append(f"{p.get('title')}：{ch!r} 读音 {py!r} 不在查表读音 {lookup[ch]} 中")
            elif py == lookup[ch][0]:
                infos.append(f"{p.get('title')}：{ch!r} 读音 {py} 等于查表主音（注释性 pron）")
        # 同字混用检查
        by_char = {}
        for key in pron:
            by_char.setdefault(key.split('@')[0], []).append(key)
        for ch, keys in by_char.items():
            if len(keys) > 1 and any('@' in k for k in keys) and any('@' not in k for k in keys):
                errors.append(f"{p.get('title')}：字 {ch!r} 同时有整字键和 @行号 键 {keys}")
    poems_with = sum(1 for p in poems if p.get('pron'))
    print(f"check_shici_pron: {len(poems)} 首，{poems_with} 首有 pron，共 {n_pron} 条")
    for i in infos:
        print('INFO:', i)
    for e in errors:
        print('ERROR:', e)
    print('check_shici_pron:', 'OK' if not errors else f'{len(errors)} 个错误')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
