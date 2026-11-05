"""fix-bushou-ui 公共：读写 window.X = <json>; 形式的数据文件，保持原格式（紧凑/带空格）。"""
import json, re, io
def load(path):
    s = io.open(path, encoding='utf-8').read()
    m = re.match(r'^(.*?=\s*)', s, re.S)
    head = m.group(1)
    body = s[len(head):]
    tail_m = re.search(r';?\s*$', body)
    tail = body[tail_m.start():]
    body = body[:tail_m.start()]
    spaced = body[:40].find('": ') >= 0
    return json.loads(body), (head, tail, spaced)
def save(path, obj, fmt):
    head, tail, spaced = fmt
    if spaced:
        body = json.dumps(obj, ensure_ascii=False)
    else:
        body = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    io.open(path, 'w', encoding='utf-8').write(head + body + tail)
