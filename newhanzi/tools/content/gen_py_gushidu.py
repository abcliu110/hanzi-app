"""拼音区 · 易错读音 · 古诗文读音（gushidu）数据生成（2026-11-08 GD）。

从 data/shici.js 的 pron 字段（Q17 逐首校多音字：888b48d3 / 0448d123 / 73663771 / 252bb9a6；
2026-11-07 fix_shici_duyin.py 按统编教材等核过 7 处）生成 pinyin/content/gushidu.js 里
「GEN:gushidu」与「GEN:end」两行之间的 DATA 数组，页面的表格、听读、题目都从 DATA 出。

- 收：每条带声调的 pron（轻声 zi 等不收，轻声没有录音、也不算古诗特殊读音）。
- 加：fix_shici_duyin.py 删掉 pron、回落查表主音的条目（小池「头」tóu），出处照该脚本。
- 不收（争议，不下结论）：DISPUTE 里的三处，见下。
- fx：fix_shici_duyin.py 核过的条目写出处（与该脚本头注一致），其余为空（依据 = 诗库 pron）。
- /workspace/work/duyin-src/gushi_readings.json 若存在只作参考，本脚本不读它（2026-11-08 不存在）。

幂等：再跑一次无变化。--check：只检查，有待改时退出码 1。
用法：python3 newhanzi/tools/content/gen_py_gushidu.py [--check]
"""
import json, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fix_shici_io as io  # noqa: E402
import fix_shici_duyin as fsd  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'pinyin', 'content', 'gushidu.js')

# 争议项：只按现状或不收——这里一律不收（2026-11-07 古诗读音核对的疑点，待负责人定）
DISPUTE = [
    ('鹿柴', '景'),                      # 返景 jǐng / yǐng：统编三上课文未注音，负责人拟 yǐng，教参作 jǐng
    ('一剪梅·红藕香残玉簟秋', '裳'),     # 罗裳 shang：拓展诗，无课本出处
    ('酬乐天扬州初逢席上见赠', '头'),    # 前头 tou：拓展诗，无课本出处
]

# fix_shici_duyin.py 核过的 7 处的出处（与该脚本头注逐条对应）
FX = {
    ('春晓', '觉'): '统编2024修订版一年级下册「日积月累」《春晓》全文注音「不觉 jué 晓」',
    ('回乡偶书二首·其一', '衰'): '人教版2001年二年级上册注 shuāi（新京报 2019-02-20）；《现代汉语词典》cuī 只用于等衰、丧服义；押韵读 cuī 属叶音，有争议',
    ('长歌行', '衰'): '统编旧版六年级下册「日积月累」收录、未注异读；依据同《回乡偶书》（押韵读 cuī 属叶音，有争议）',
    ('少年中国说（节选）', '干'): '统编2024修订版五年级上册第13课注释「干将，古代宝剑名」；《现代汉语词典》第7版【干将】gānjiāng',
    ('塞下曲', '骑'): '1985《普通话异读词审音表》「骑 qí（统读）」；统编四年级下册注释「骑，骑兵」，未注 jì',
    ('小池', '头'): '统编2024修订版一年级下册全文注音「立上头 shàng tóu」',
    ('闻官军收河南河北', '裳'): '统编旧版五年级下册课文注音「衣裳 cháng」',
}
CE = ['1上', '1下', '2上', '2下', '3上', '3下', '4上', '4下', '5上', '5下', '6上', '6下']
TONE = re.compile('[\u0304\u0301\u030c\u0300]')
PUNCT = '，。！？；：、'


def nfc(s):
    return unicodedata.normalize('NFC', s)


def ziku():
    out = {}
    for x in json.load(open(os.path.join(ROOT, 'ziku', 'model-3500.json'), encoding='utf-8')):
        r = ((x.get('dim') or {}).get('读音') or {}).get('拼音') or ''
        out[x['zi']] = [nfc(t) for t in re.split(r'[,，\s]+', r) if t]
    return out


def lookup_main():
    s = open(os.path.join(ROOT, 'data', 'pinyin_lookup.js'), encoding='utf-8').read()
    obj = json.loads(re.search(r'window\.NHZ_PINYIN\s*=\s*(\{.*\})\s*;?\s*$', s, re.S).group(1))
    return {k: v.split(',')[0] for k, v in obj.items()}


def build():
    assert set(FX) == {(t, z) for t, z, _o, _n in fsd.PRON}, 'FX 与 fix_shici_duyin.PRON 不一致'
    poems = io.load('shici')['poems']
    by_title = {p['title']: p for p in poems}
    main = lookup_main()
    zk = ziku()
    skip = set(DISPUTE)
    rows = []
    for p in poems:
        keys = list((p.get('pron') or {}).items())
        # fix_shici_duyin 删掉 pron、回落主音的条目
        for t, z, _old, new in fsd.PRON:
            if t == p['title'] and new is None and z not in (p.get('pron') or {}):
                keys.append((z, main[z]))
        for k, py in keys:
            z, _, li = k.partition('@')
            if (p['title'], z) in skip:
                continue
            if not TONE.search(unicodedata.normalize('NFD', py)):
                continue  # 轻声
            lines = p['lines']
            i = int(li) if li else next(n for n, l in enumerate(lines) if z in l)
            assert z in lines[i], (p['title'], k)
            rows.append({
                'z': z, 'py': nfc(py), 't': p['title'], 'a': p.get('author', ''),
                'ke': p.get('ke', ''), 'g': p.get('grade', ''), 'ce': p.get('ce', ''),
                'li': i, 'line': lines[i].rstrip(PUNCT), 'fx': FX.get((p['title'], z), ''),
                # 3500 字库里这个字带声调的读音（选择题选项用；轻声不进）
                'rd': [r for r in zk.get(z, []) if TONE.search(unicodedata.normalize('NFD', r))],
            })
            assert nfc(py) in rows[-1]['rd'], ('读音不在 3500 字库', p['title'], z, py)
    for t, z in skip:
        assert t in by_title, '争议项诗题不存在：' + t
    order = {t: n for n, t in enumerate(p['title'] for p in poems)}
    rows.sort(key=lambda r: (0 if r['ke'] == '课内' else 1, CE.index(r['ce']) if r['ce'] in CE else 99, order[r['t']]))
    return rows


def render(rows):
    body = ',\n'.join('    ' + json.dumps(r, ensure_ascii=False, separators=(', ', ': ')) for r in rows)
    skip = json.dumps([list(x) for x in DISPUTE], ensure_ascii=False, separators=(', ', ': '))
    return '  var DATA = [\n' + body + '\n  ];\n  var SKIP = ' + skip + '; /* 争议项，不收（不下结论） */\n'


def main():
    check = '--check' in sys.argv
    src = open(OUT, encoding='utf-8').read()
    m = re.search(r'(  /\* GEN:gushidu[^\n]*\n)(.*?)(  /\* GEN:end \*/)', src, re.S)
    if not m:
        raise SystemExit('gushidu.js 里找不到 GEN:gushidu … GEN:end 标记')
    rows = build()
    new = src[:m.start(2)] + render(rows) + src[m.end(2):]
    changed = new != src
    print('gen_py_gushidu:', len(rows), '条（课内', sum(r['ke'] == '课内' for r in rows), '/ 拓展', sum(r['ke'] != '课内' for r in rows),
          '，出处条', sum(bool(r['fx']) for r in rows), '，不收争议', len(DISPUTE), '）')
    if check:
        print('gen_py_gushidu --check:', '待更新' if changed else 'OK（无待改）')
        return 1 if changed else 0
    if changed:
        open(OUT, 'w', encoding='utf-8').write(new)
    print('gen_py_gushidu:', '已更新 gushidu.js' if changed else '无变化')
    return 0


if __name__ == '__main__':
    sys.exit(main())
