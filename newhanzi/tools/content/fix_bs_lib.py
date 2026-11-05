"""BS 线公共：数据文件读写（复用 fix_bushou_ui_lib）+ 字卡读取。"""
import os, sys, json, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_bushou_ui_lib import load, save  # noqa: F401

NH = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
BUSHOU = os.path.join(NH, 'bushou', 'data.js')
ZIMAP = os.path.join(NH, 'bushou', 'zi_map.js')
QBUSHOU = os.path.join(NH, 'quiz', 'data_bushou.js')
QZIKA = os.path.join(NH, 'quiz', 'data_zika.js')

_card_cache = {}
def card(z):
    """字卡 data/zika/<字>.js；不在 3500 内返回 None。"""
    if z in _card_cache:
        return _card_cache[z]
    p = os.path.join(NH, 'data', 'zika', z + '.js')
    d = None
    if os.path.exists(p):
        s = io.open(p, encoding='utf-8').read()
        body = s[s.index('=') + 1:].strip().rstrip(';')
        d = json.loads(body)
    _card_cache[z] = d
    return d

def yunyong(z):
    c = card(z)
    if not c:
        return []
    return (c.get('dim') or {}).get('运用链') or []
