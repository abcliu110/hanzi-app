"""F3 古诗线：数据文件读写（单行 JSON 的 JS 文件，保持原格式往返一致）。"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'newhanzi'))
FILES = {
    'shici':   ('data/shici.js', ',', ':'),
    'shiju':   ('data/shiju.js', ',', ':'),
    'shangxi': ('data/shangxi.js', ',', ':'),
    'quiz':    ('quiz/data_shici.js', ',', ':'),
    'feihua':  ('games/shici/data_feihua.js', ', ', ': '),
}
_meta = {}
def load(name):
    path, a, b = FILES[name]
    s = open(os.path.join(ROOT, path), encoding='utf-8').read()
    m = re.match(r'^(.*?=\s*)', s)
    pre = m.group(1)
    body = s[len(pre):]
    tail = ''
    for t in [';\n', ';', '\n']:
        if body.endswith(t):
            tail = t; body = body[:-len(t)]; break
    obj = json.loads(body)
    _meta[name] = (pre, tail)
    return obj
def dump(name, obj):
    path, a, b = FILES[name]
    pre, tail = _meta[name]
    s = pre + json.dumps(obj, ensure_ascii=False, separators=(a, b)) + tail
    open(os.path.join(ROOT, path), 'w', encoding='utf-8').write(s)
if __name__ == '__main__':
    import hashlib
    for n in FILES:
        p = os.path.join(ROOT, FILES[n][0]); h = hashlib.md5(open(p,'rb').read()).hexdigest()
        dump(n, load(n)); h2 = hashlib.md5(open(p,'rb').read()).hexdigest()
        print(n, 'roundtrip', 'OK' if h == h2 else 'DIFF')
