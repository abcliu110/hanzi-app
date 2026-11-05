"""zika-b 修复线公共库：按 NHZ_INDEX 顺序取第 1751–3500 字，读写 newhanzi/data/zika/<字>.js 并保持原文件格式。"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ZDIR = os.path.join(ROOT, 'data', 'zika')

def index():
    s = open(os.path.join(ROOT, 'newhanzi/data/index.js'), encoding='utf-8').read()
    return json.loads(s[s.index('['):s.rindex(']') + 1])

def chars_b():
    return [x['z'] for x in index()[1750:3500]]

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

def show(z, keys=None):
    """调试：打印一张卡（去掉笔顺）"""
    d = load(z); dd = dict(d['dim']); dd.pop('笔顺', None)
    if keys: dd = {k: dd.get(k) for k in keys}
    print(z, json.dumps(dd, ensure_ascii=False, indent=1)); print('src', json.dumps(d.get('src'), ensure_ascii=False))

if __name__ == '__main__':
    import sys
    a = sys.argv[1:]; keys = None
    if a and a[0] == '-k': keys = a[1].split(','); a = a[2:]
    for z in a: show(z, keys)
