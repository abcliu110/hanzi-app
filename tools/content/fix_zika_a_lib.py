"""zika-a 修复线公共库：按 NHZ_INDEX 顺序取第 1–1750 字，读写 newhanzi/data/zika/<字>.js 并保持原文件格式。"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ZDIR = os.path.join(ROOT, 'newhanzi', 'data', 'zika')

def index():
    s = open(os.path.join(ROOT, 'newhanzi/data/index.js'), encoding='utf-8').read()
    return json.loads(s[s.index('['):s.rindex(']') + 1])

def chars_a():
    return [x['z'] for x in index()[:1750]]

_fmt = {}
def load(z):
    s = open(os.path.join(ZDIR, z + '.js'), encoding='utf-8').read()
    i = s.index('{'); pre = s[:i]
    m = re.search(r'\s*;?\s*$', s); body = s[i:m.start()]; tail = s[m.start():]
    d = json.loads(body)
    for seps in ((',', ':'), (', ', ': ')):
        for asc in (False, True):
            if json.dumps(d, ensure_ascii=asc, separators=seps) == body:
                _fmt[z] = (pre, tail, seps, asc, None); return d
    for ind in (1, 2, 4):
        if json.dumps(d, ensure_ascii=False, indent=ind) == body:
            _fmt[z] = (pre, tail, None, False, ind); return d
    raise ValueError('无法确定格式 ' + z)

def save(z, d):
    pre, tail, seps, asc, ind = _fmt[z]
    body = json.dumps(d, ensure_ascii=asc, indent=ind) if ind else json.dumps(d, ensure_ascii=asc, separators=seps)
    new = pre + body + tail
    p = os.path.join(ZDIR, z + '.js')
    if open(p, encoding='utf-8').read() != new:
        open(p, 'w', encoding='utf-8').write(new); return True
    return False
