#!/usr/bin/env python3
"""语法白板静态检查（设计 docs/anim/baiban-yufa-gaijin-sheji.md §8，R1–R13）。纯 Python，不需要 Playwright。

由 check_wb.py --lint 调用，也可单独跑：python3 tools/wb/wblint.py [-v] [名称…]
退出码：有错误 1，只有警告 0。

迁移期：STRICT 里的项（已回炉）R1/R7 为错误；其余旧项为警告，按清单逐项转错误（设计 §9）。
"""
import math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', 'newhanzi'))
WB = os.path.join(ROOT, 'wb')

# 已回炉、R1 / R7 按错误级检查的语法点（第 1 期：单句成分 7 项）
STRICT = {'主语', '谓语', '宾语', '定语', '状语', '补语', '趋向补语引申义',
          # 第 2 期：高级句式逐项回炉后加入（被字句、话题句、兼语句的施事 / 受事 / 话题必须走 tag，R7 错误级）
          '把字句', '被字句', '存现句', '是…的句', '比较句', '双重否定', '歧义句', '兼语句', '话题句', '给字被动'}

CLS_KEYS = {'noun', 'adj', 'pron', 'verb', 'adv', 'prep', 'conj', 'interj', 'tagc'}
JUDGE_KEYS = {'ok', 'bad'}
ROLE_KINDS = {'zhu', 'wei', 'bin', 'ding', 'zhuang', 'bu', 'bar'}
NEG = ['没有', '不', '没', '别', '未', '无', '非', '莫', '勿']
AGENT_WORDS = ['施事', '受事', '动手的', '被动手的', '做事的人', '话题', '本体', '喻体']
NUMS = '一二三四五六七八九十两百千万几0123456789'
QUANTS = '个只本张条位件头匹棵朵把支块片句次双群些'


# ---------------- JS 字面量解析（场景数据只用对象 / 数组 / 字符串 / 数字 / 布尔） ----------------
class P:
    def __init__(self, s): self.s, self.i = s, 0

    def ws(self):
        s = self.s
        while self.i < len(s):
            if s[self.i].isspace(): self.i += 1
            elif s.startswith('//', self.i): self.i = s.find('\n', self.i) if s.find('\n', self.i) >= 0 else len(s)
            elif s.startswith('/*', self.i): self.i = s.index('*/', self.i) + 2
            else: break

    def peek(self): self.ws(); return self.s[self.i] if self.i < len(self.s) else ''

    def eat(self, c):
        if self.peek() != c: raise ValueError('第 %d 字符处应为 %r，得 %r' % (self.i, c, self.s[self.i:self.i + 20]))
        self.i += 1

    def val(self):
        c = self.peek()
        if c == '{':
            self.i += 1; o = {}
            while self.peek() != '}':
                k = self.key(); self.eat(':'); o[k] = self.val()
                if self.peek() == ',': self.i += 1
            self.i += 1; return o
        if c == '[':
            self.i += 1; a = []
            while self.peek() != ']':
                a.append(self.val())
                if self.peek() == ',': self.i += 1
            self.i += 1; return a
        if c in '\'"': return self.str()
        m = re.compile(r'-?\d+(\.\d+)?|true|false|null|undefined').match(self.s, self.i)
        if not m: raise ValueError('无法解析：%r' % self.s[self.i:self.i + 30])
        self.i = m.end(); t = m.group(0)
        return {'true': True, 'false': False, 'null': None, 'undefined': None}.get(t, float(t) if '.' in t else int(t) if t[0] in '-0123456789' else t)

    def key(self):
        c = self.peek()
        if c in '\'"': return self.str()
        m = re.compile(r'[A-Za-z_$][\w$]*').match(self.s, self.i)
        if not m: raise ValueError('键名错误：%r' % self.s[self.i:self.i + 20])
        self.i = m.end(); return m.group(0)

    def str(self):
        q = self.s[self.i]; self.i += 1; out = []
        while self.s[self.i] != q:
            if self.s[self.i] == '\\':
                self.i += 1; ch = self.s[self.i]
                out.append({'n': '\n', 't': '\t'}.get(ch, ch))
            else: out.append(self.s[self.i])
            self.i += 1
        self.i += 1; return ''.join(out)


def load_scene_file(path):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'NHZWB\.add\(\s*([\'"])(.+?)\1\s*,', s)
    if not m: raise ValueError('找不到 NHZWB.add(')
    p = P(s); p.i = m.end()
    spec = p.val()
    return m.group(2), spec, s


def load_terms():
    f = os.path.join(WB, 'terms.js')
    if not os.path.exists(f): return None
    s = open(f, encoding='utf-8').read()
    m = re.search(r'window\.NHZWB_TERMS\s*=\s*', s)
    p = P(s); p.i = m.end(); return p.val()


def index():
    s = open(os.path.join(WB, 'index.js'), encoding='utf-8').read()
    return dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', s))


# ---------------- 色差 ----------------
def lab(h):
    h = h.lstrip('#'); rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    rgb = [((c + .055) / 1.055) ** 2.4 if c > .04045 else c / 12.92 for c in rgb]
    x = (rgb[0] * .4124 + rgb[1] * .3576 + rgb[2] * .1805) / .95047
    y = (rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722)
    z = (rgb[0] * .0193 + rgb[1] * .1192 + rgb[2] * .9505) / 1.08883
    f = lambda t: t ** (1 / 3) if t > .008856 else 7.787 * t + 16 / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def de(a, b): return math.dist(lab(a), lab(b))


def engine_pal(src):
    m = re.search(r'var PAL = \{(.*?)\};', src, re.S)
    pal = dict(re.findall(r'(\w+):\s*\'(#[0-9a-fA-F]{6})\'', m.group(1))) if m else {}
    layers = {}
    for name, keys in re.findall(r'\*\s+层 (\w+)（[^）]*）：([\w ]+)', src):
        layers[name] = keys.split()
    return pal, layers


# ---------------- 规则 ----------------
def walk(o):
    """遍历场景里所有 dict（含嵌套的 m / rows / arrows / grow…）"""
    if isinstance(o, dict):
        yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)


def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)


def lint_item(name, spec, raw, terms, out):
    strict = name in STRICT
    E = lambda r, msg: out.append(('E', r, name, msg))
    Wn = lambda r, msg: out.append(('W', r, name, msg))
    scenes = spec.get('scenes', [])
    # R1 色值
    for m in re.finditer(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(', raw):
        line = raw[:m.start()].count('\n') + 1
        (E if strict else Wn)('R1', '第 %d 行手填色值 %s（只许语义键）' % (line, m.group(0)))
    lv1 = lv3 = 0
    for i, sc in enumerate(scenes):
        tag = '第%d幕(%s)' % (i + 1, sc.get('k'))
        k, lv = sc.get('k'), sc.get('lv')
        # R2
        if k in ('title', 'end'):
            if 'lv' in sc: E('R2', tag + ' title/end 不带 lv')
        else:
            if lv is not None and lv not in (1, 2, 3): E('R2', tag + ' lv 只能是 1/2/3，得 %r' % lv)
            if (lv or 1) == 1: lv1 += 1
            if lv == 3: lv3 += 1
        # R3
        if lv == 3 and not str(sc.get('src') or '').strip(): E('R3', tag + ' lv:3 必须有 src')
        for d in walk(sc):
            col = d.get('col'); tone = d.get('tone')
            for v in (col, tone):
                if isinstance(v, str) and v in JUDGE_KEYS: E('R6', tag + ' 对错色 %r 只能经 ✓/✗ 使用' % v)
                if isinstance(v, str) and v == 'role': E('R6', tag + ' 成分墨只能经 role 成分线使用')
            if d.get('role') is not None and isinstance(col, str) and col in CLS_KEYS: E('R6', tag + ' 成分线不得同时染词类色')
            if isinstance(d.get('role'), str) and d['role'] not in ROLE_KINDS and k not in ('trunk',):
                E('R6', tag + ' 未知成分线 %r' % d['role'])
            # R7
            note = str(d.get('note') or '') + str(d.get('up') or '')
            if any(w in note for w in AGENT_WORDS) and (d.get('role') or (isinstance(col, str) and (col in CLS_KEYS or col.startswith('#')))):
                (E if strict else Wn)('R7', tag + ' 语义角色「%s」须用 tag，不得用成分线或词类色' % note)
        # R9
        bad_flag = (sc.get('ok') is False and k in ('review', 'morph')) or 'wrongTry' in sc or sc.get('absurd')
        if bad_flag and not (sc.get('good') or sc.get('fix') or sc.get('say') or (sc.get('wrongTry') or {}).get('say')):
            E('R9', tag + ' 错句 / 错答必须同幕改正或说明')
        if k == 'fix' and not sc.get('good'): E('R9', tag + ' fix 幕必须有 good')
        # R8 trunk
        if k == 'trunk':
            toks = sc.get('core') or sc.get('s') or []
            allw = list(toks) + [w for g in sc.get('grow', []) for w in g.get('ins', [])]
            keep = {x.get('i') for x in sc.get('keep', [])}
            keepw = {x.get('w') for x in sc.get('keep', []) if x.get('w')}
            for j, w in enumerate(toks):
                if any(n in w for n in NEG) and j not in keep and w not in keepw:
                    E('R8', tag + ' 否定词「%s」必须在 keep 里' % w)
            for g in sc.get('grow', []):
                ws = ''.join(g.get('ins', []))
                if any(n in ws for n in NEG) and not g.get('keep'): E('R8', tag + ' 生长出的否定词「%s」必须标 keep' % ws)
                if re.search('[%s][%s]' % (NUMS, QUANTS), ws) and not (g.get('keep') or g.get('cutOk')):
                    E('R8', tag + ' 数量词「%s」被剪须标 keep 或写 cutOk 理由' % ws)
        # R10
        for s in strings(sc):
            for kk in re.findall(r'\{t:([a-z]+)', s):
                if terms is None or kk not in terms: E('R10', tag + ' 术语占位 {t:%s} 在 terms.js 里找不到' % kk)
        # R11 每幕最多一种强调色
        tones = set()
        for d in walk(sc):
            for v in (d.get('col'), d.get('tone')):
                if isinstance(v, str) and (v == 'acc' or v.startswith('#')): tones.add(v)
        if len(tones) > 1: Wn('R11', tag + ' 强调色不止一种：%s' % ', '.join(sorted(tones)))
        # R12
        for d in walk(sc):
            if 'min' in d or 'think' in d: E('R12', tag + ' 场景数据不许写 min / think 绕过节奏')
    # R4
    if not lv1: E('R4', '至少要有 1 幕 lv=1')
    if not lv3: Wn('R4', '建议至少 1 幕 lv=3')
    if strict and not lv3: E('R4', '已回炉项必须至少 1 幕 lv=3')


def lint_engine(out):
    src = open(os.path.join(WB, 'wb-engine.js'), encoding='utf-8').read()
    E = lambda r, msg: out.append(('E', r, '引擎', msg))
    # R5
    pal, layers = engine_pal(src)
    if not pal or not layers: E('R5', '解析不到 PAL 或分层注释')
    lay_of = {k: n for n, ks in layers.items() for k in ks}
    for a in pal:
        for b in pal:
            if a >= b or a not in lay_of or b not in lay_of or lay_of[a] == lay_of[b]: continue
            if {a, b} == {'noun', 'ink'}: continue   # 写死豁免：名词实心▲ vs 正文墨（形状不同）
            d = de(pal[a], pal[b])
            if d < 20: E('R5', '跨层近色 %s %s / %s %s：ΔE=%.1f < 20' % (a, pal[a], b, pal[b], d))
    # R12
    if not re.search(r'var CPS = 3\.5;', src): E('R12', '旁白速度 CPS 必须是 3.5')
    if not re.search(r'var THINK = 4;', src): E('R12', '想一想停顿 THINK 必须是 4')
    # R13：播放器之前（绘制路径）不得出现随机数和时钟
    k = src.find('/* ---------- 播放器 ---------- */')
    draw = src[:k] if k > 0 else src
    for m in re.finditer(r'Math\.random|\bDate\b|performance\.', draw):
        E('R13', '绘制路径第 %d 行出现 %s' % (draw[:m.start()].count('\n') + 1, m.group(0)))
    if k < 0: E('R13', '找不到播放器分界注释')


def main(argv):
    verbose = '-v' in argv
    names = [a for a in argv if not a.startswith('-')]
    idx = index(); terms = load_terms()
    out = []
    lint_engine(out)
    if terms is not None:
        for kk, e in terms.items():
            if not isinstance(e, dict) or not e.get('t') or not e.get('kid'): out.append(('E', 'R10', 'terms.js', '术语 %s 缺 t / kid' % kk))
    for n, fid in idx.items():
        if names and n not in names: continue
        try:
            name, spec, raw = load_scene_file(os.path.join(WB, 's', fid + '.js'))
        except Exception as e:
            out.append(('E', 'parse', n, '解析失败：%s' % e)); continue
        if name != n: out.append(('E', 'parse', n, '文件里注册的名称是 %s' % name))
        lint_item(n, spec, raw, terms, out)
    errs = [o for o in out if o[0] == 'E']; warns = [o for o in out if o[0] == 'W']
    for o in errs: print('✗ [%s] %s：%s' % (o[1], o[2], o[3]))
    if verbose:
        for o in warns: print('· [%s] %s：%s' % (o[1], o[2], o[3]))
    by = {}
    for o in warns: by[o[1]] = by.get(o[1], 0) + 1
    print('%s lint：%d 错误，%d 警告%s' % ('✗' if errs else '✓', len(errs), len(warns),
          '（' + '，'.join('%s×%d' % kv for kv in sorted(by.items())) + '；-v 看明细）' if warns else ''))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
