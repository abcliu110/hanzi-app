"""F6 接手 A11：部首「看图说话」图示里的空位/占位（可重复运行）。只删不编：
- 标题「X（）」空括号 → 「X」
- 第二行占位文字「部首含义」整行删掉，标题下移居中
- 末尾提示框「💡 含X的字多与相关」（缺关键词）整组删掉，画布高度随之收短
另：图示里的例字与 examples 同步（前面已删掉的 明/皇/头/脸/听/闻 换成本条 examples 里的字）。"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
from fix_bushou_ui_lib import load, save
P = 'newhanzi/bushou/data.js'
D, fmt = load(P)
SWAP = {'月': [('明', '明月', '腿', '大腿')], '王': [('皇', '皇室', '球', '足球')],
        '页': [('头', '头发', '额', '额头'), ('脸', '脸庞', '颈', '颈椎')],
        '耳': [('听', '听讲', '职', '职务'), ('闻', '耳闻', '联', '联系')]}
cnt = {'空括号': 0, '部首含义': 0, '缺关键词提示': 0, '例字同步': 0}
for r in D:
    s = r.get('图示')
    if not s: continue
    o = s
    s, n = re.subn(r'(font-weight="bold">[^<（]+)（）</text>', r'\1</text>', s); cnt['空括号'] += n
    s, n = re.subn(r'<text x="70" y="48"([^>]*)>([^<]*)</text><text x="70" y="70"[^>]*>部首含义</text>',
                   r'<text x="70" y="54"\1>\2</text>', s); cnt['部首含义'] += n
    m = re.search(r'<g opacity="0"><animate[^>]*/><rect x="52" y="(\d+)"[^>]*/><text[^>]*>💡 含[^<]*的字多与相关</text></g>', s)
    if m:
        y = int(m.group(1))
        s = s[:m.start()] + s[m.end():]
        s = re.sub(r'viewBox="0 0 640 (\d+)"', lambda mm: 'viewBox="0 0 640 %d"' % min(int(mm.group(1)), y), s, count=1)
        cnt['缺关键词提示'] += 1
    for a, aw, b, bw in SWAP.get(r['bushou'], []):
        k = s.find('>%s</text>' % a)
        if k >= 0:
            s = s[:k] + s[k:].replace('>%s</text>' % a, '>%s</text>' % b, 1).replace('>%s</text>' % aw, '>%s</text>' % bw, 1)
            cnt['例字同步'] += 1
    # 通用：图示里的单字例字已不在 examples 的，换成 examples 里还没上图的字（字和下一行例词一起换）
    items = re.findall(r'<text x="70" y="\d+"[^>]*font-size="16"[^>]*>([^<]*)</text><text x="70" y="\d+"[^>]*>([^<]*)</text>', s)
    ex = r['examples']; exz = [e['z'] for e in ex]
    shown = {a for a, _ in items}
    for a, aw in items[1:]:
        if len(a) == 1 and a not in exz:
            nxt = next((e for e in ex if e['z'] not in shown), None)
            if not nxt:  # 没有可换的字：整组删掉（保留编号的连续性只对末项成立，所以只删末项）
                if (a, aw) == items[-1]:
                    s = re.sub(r'<g opacity="0">(?:(?!<g ).)*?>%s</text><text[^>]*>%s</text></g>' % (re.escape(a), re.escape(aw)), '', s, count=1)
                    cnt['例字同步'] += 1
                continue
            s = s.replace('>%s</text>' % a, '>%s</text>' % nxt['z'], 1).replace('>%s</text>' % aw, '>%s</text>' % nxt['w'], 1)
            shown.add(nxt['z']); cnt['例字同步'] += 1
    r['图示'] = s
save(P, D, fmt)
print(cnt)
