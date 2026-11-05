#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 docs/yufa-neirong/01~07 的 50 项语法内容稿转成白板场景 newhanzi/wb/s/<id>.js。

用法：
  python3 tools/wb/embed_yufa_neirong.py --item rh_jiedai [--dry-run]
  python3 tools/wb/embed_yufa_neirong.py --group 05 [--dry-run]
  python3 tools/wb/embed_yufa_neirong.py --all [--dry-run]
  python3 tools/wb/embed_yufa_neirong.py --list-manual   # 列出需要手工场景的幕

转换规则（内容稿 -> 引擎模板，见 docs/anim/baiban-yufa-guifan.md）：
- title/end 由 title.term/kid、core 首句、pitfalls[0] 合成。
- cards/vs/test/fix/review 按本文件的机械规则转；转不了的幕（1/3/4 例 vs、
  含 ok:false 的 vs、mark/morph/nest/steps/line/slots/valence）走 MANUAL 表
  （见本文件后半部），没有 MANUAL 又转不了的幕直接报错，不静默出坏内容。
- 白板只认 data.js 已有条目：50 项尚未进 yuwen/data.js，登记进 wb/index.js 后
  仍需 data.js 集成才会在语法 tab 里出现入口（另一步，不在本脚本内）。
- 写完后须跑：node --check、python3 tools/wb/check_wb.py --lint <名>、
  check_wb <名>、baseline.py --only <名> --write。
"""
import difflib
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WB = os.path.join(ROOT, 'newhanzi', 'wb')
DRAFT_DIR = os.path.join(ROOT, 'docs', 'yufa-neirong')
INDEX_JS = os.path.join(WB, 'index.js')

GROUPS = [
    ('01', '01-jushi.json', '句型句式'),
    ('02', '02-buyu.json', '补语细分'),
    ('03', '03-cici.json', '词与短语'),
    ('04', '04-shenceng.json', '深层语法'),
    ('05', '05-xiuci.json', '修辞补齐'),
    ('06', '06-wenyan.json', '文言语法'),
    ('07', '07-biaodian.json', '标点符号'),
]

WARNINGS = []


def warn(msg):
    WARNINGS.append(msg)
    print('  ! ' + msg, file=sys.stderr)


def js(v):
    """JS 字面量：键不加引号、字符串单引号（与现有场景文件风格一致）。"""
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if v is None:
        return 'null'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if isinstance(v, list):
        return '[' + ', '.join(js(x) for x in v) + ']'
    return '{ ' + ', '.join(
        (k if re.match(r'^[A-Za-z_]\w*$', k) else js(k)) + ': ' + js(x)
        for k, x in v.items() if x is not None) + ' }'


# ---------------- 文本小工具 ----------------

def strip_paren(s):
    return re.sub(r'（[^）]*）', '', s)


def strip_end_punct(s):
    return re.sub(r'[。！？；，、]+$', '', s.strip())


def first_sent(s):
    """首句（含句末标点）。"""
    m = re.split(r'(?<=[。！？])', s.strip(), maxsplit=1)
    return m[0]


def clauses(s):
    """按 。；，、？！ 切句，保留标点。"""
    return [c for c in re.split(r'(?<=[。；，、？！])', s) if c]


def fit_start(s, maxlen, minlen=0):
    """从头累积子句：minlen=0 时取能容下的最长前缀；minlen>0 时一到 minlen 就停。"""
    out = ''
    for c in clauses(s):
        if out and len(out) + len(c) > maxlen:
            break
        out += c
        if minlen > 0 and len(out) >= minlen:
            break
    if not out or len(out) > maxlen:
        return None
    return out


def fit_last(s, maxlen, minlen=10):
    """取最后一个长度在 [minlen, maxlen] 内的整句（只按 。；？！ 切，不按 ，切）。"""
    for c in reversed([x for x in re.split(r'(?<=[。；？！])', s) if x]):
        t = strip_end_punct(c)
        if minlen <= len(t) <= maxlen:
            return t
    return None


def h_of(say0, tab, who):
    """标题 h：say[0] 够短就用，否则用 tab。"""
    if say0 and len(say0) <= 22:
        return say0
    return tab


# ---------------- title / end ----------------

def title_scene(it):
    term = it['title']['term']
    kid = it['title']['kid']
    core = strip_paren(it['core'])
    one = first_sent(core)
    if len(one) > 32:
        one = fit_start(core, 32) or one
    one = strip_end_punct(one)
    if len(one) > 32:
        warn('%s title.one 超 32 字，已截断：%s' % (term, one))
        one = one[:31] + '…'
    say = it['core'].split('；')[0]
    if len(say) > 48:
        say = fit_start(it['core'], 48) or first_sent(it['core'])
    say = strip_end_punct(say)
    if len(say) > 48:
        warn('%s title.say 超 48 字：%s' % (term, say))
    if len(kid) > 20:
        warn('%s kid 超 20 字：%s' % (term, kid))
    return {'k': 'title', 'tab': '是什么', 't': term, 'one': one, 'kj': kid, 'say': say}


def end_scene(it):
    term = it['title']['term']
    kid = it['title']['kid']
    tip = it['pitfalls'][0]
    if len(tip) > 36:
        tip2 = fit_start(tip, 36, 10) or fit_last(tip, 36, 10)
        if tip2:
            tip = tip2
        else:
            warn('%s end.tip 超 36 字，已截断：%s' % (term, tip))
            tip = tip[:35] + '…'
    return {'k': 'end', 'kj': kid, 'tip': tip}


# ---------------- cards ----------------

def cards_scene(sc, it):
    term = it['title']['term']
    ex = sc['ex']
    items = []
    for e in ex:
        s = e['s']
        if not e.get('ok', True):
            items.append({'n': '不对', 'w': s + ' → ' + e['fix']})
        elif e.get('note'):
            items.append({'n': e['note'], 'w': s})
        elif len(ex) == 1 and len(s) <= 16:
            items.append({'n': s})
        else:
            items.append({'n': '', 'w': s, 'say': s})
    d = {'k': 'cards', 'lv': sc['lv'], 'tab': sc['tab'], 'items': items}
    say = sc.get('say', [])
    if say:
        s0 = say[0]
        # h：say[0] 够短且不是例句本身就用，否则用 tab
        d['h'] = s0 if (len(s0) <= 22 and s0 not in [e['s'] for e in ex]) else sc['tab']
        if len(say) > 1:
            s1 = say[1]
            if 10 <= len(s1) <= 35:
                d['end'] = s1
            elif len(s1) > 35 and len(ex) == 1:
                # 单例卡的 say[1] 常是解释 + 定义收尾，取末句作收尾
                last = fit_last(s1, 35, 10)
                if last:
                    d['end'] = last
    if sc.get('ask'):
        warn('%s cards「%s」ask 丢弃（cards 模板不支持 ask）：%s' % (term, sc['tab'], sc['ask']))
    if sc['lv'] == 3:
        if sc.get('src'):
            d['src'] = sc['src']
        else:
            warn('%s cards「%s」L3 缺 src' % (term, sc['tab']))
    return [d]


# ---------------- vs ----------------

def vs_fragment(s, who):
    """vs 侧边例句：去括号、去句末标点，单 token，超 12 字取后段。"""
    t = strip_end_punct(strip_paren(s))
    if len(t) > 12:
        tail = None
        for c in reversed(re.split(r'[——，；、]', t)):
            if c:
                tail = c
                break
        if tail and len(tail) <= 12:
            t = tail
        else:
            warn('%s vs 例句超 12 字未切：%s' % (who, t))
    return t


def _match_say(say_list, ex):
    """say 序号 -> 唯一匹配的 ex 序号（按例句去标点后前 6 字关键串）。

    内容稿的 say 顺序通常跟 ex，但个别幕是反的（如 bu_chengdu「两个“坏了”」）；
    关键串唯一命中时以命中为准，含糊时回落到位置对应。
    """
    keys = []
    punct = set('。！？；，、：""''——…·')
    for e in ex:
        t = ''.join(c for c in strip_paren(e['s']) if c not in punct and not c.isspace())
        keys.append(t[:6])
    m = {}
    for si, s in enumerate(say_list):
        hits = [ei for ei, k in enumerate(keys) if k and k in s]
        if len(hits) == 1:
            m[si] = hits[0]
    return m


def vs_side(e, term, is_true):
    """一侧 L/R：t/n/s/k。"""
    note = e.get('note')
    if note:
        t0 = re.split(r'[，、（]', note)[0]
        t = t0 if t0 else term
        rest = note[len(t0):]
        if rest.startswith('（'):
            n = rest[1:].rstrip('）')
        elif rest.startswith(('，', '、')):
            n = rest[1:]
        elif rest == '':
            n = None
        else:
            n = rest
        if n == t:
            n = None
    else:
        t = term if is_true else '不是' + term
        n = None
    if len(t) > 10:
        warn('vs t 超 10 字：%s' % t)
    if n and len(n) > 54:
        warn('vs n 超 54 字：%s' % n)
    return {'t': t, 's': [vs_fragment(e['s'], term)], 'k': 0, 'n': n}


def vs_scene(sc, it):
    term = it['title']['term']
    who = '%s vs「%s」' % (term, sc['tab'])
    ex = sc['ex']
    if len(ex) == 1:
        raise ValueError(who + '：1 例 vs 需手工写 L/R（见 MANUAL）')
    if len(ex) == 3:
        raise ValueError(who + '：3 例 vs 需手工（第 3 例放 end）')
    if len(ex) >= 4:
        raise ValueError(who + '：4 例 vs 需手工拆分')
    if any(not e.get('ok', True) for e in ex):
        raise ValueError(who + '：含 ok:false 例句，需手工')
    falses = [i for i, e in enumerate(ex) if e.get('is') is False]
    if len(falses) == 1:
        ti = 1 - falses[0]
        L = vs_side(ex[ti], term, True)
        R = vs_side(ex[falses[0]], term, False)
        L_idx, R_idx = ti, falses[0]
        if not ex[ti].get('note') and not ex[falses[0]].get('note'):
            raise ValueError(who + '：两侧均无 note，t 需手工指定')
    elif len(falses) == 0:
        L = vs_side(ex[0], term, True)
        R = vs_side(ex[1], term, True)
        L_idx, R_idx = 0, 1
        if not ex[0].get('note') or not ex[1].get('note'):
            raise ValueError(who + '：两侧 note 不全，t 需手工指定')
    else:
        raise ValueError(who + '：两侧均为 is:false，无法分边')
    say = sc.get('say', [])
    # say 按 ex 顺序排，不按 L/R 顺序；L3 时 say[0] 常是「想一想：」提问，解释从 say[1] 起
    base = 1 if (sc['lv'] == 3 and say and say[0].startswith('想一想')) else 0
    match = _match_say(say, ex)

    def side_say(ei):
        for si, mej in sorted(match.items()):
            if mej == ei and si >= base:
                return say[si]
        return say[base + ei] if base + ei < len(say) else None

    lsay, rsay = side_say(L_idx), side_say(R_idx)
    if lsay:
        L['say'] = lsay
    if rsay:
        R['say'] = rsay
    end = None
    ei_end = base + 2
    if ei_end < len(say) and match.get(ei_end) is None:
        if len(say[ei_end]) <= 36:
            end = say[ei_end]
        else:
            warn('%s vs say[%d] 超 36 字，end 丢弃' % (who, ei_end))
    d = {'k': 'vs', 'lv': sc['lv'], 'tab': sc['tab'], 'L': L, 'R': R}
    if say:
        d['h'] = h_of(say[0], sc['tab'], term)
    if sc.get('ask'):
        d['ask'] = sc['ask']
    if sc.get('src'):
        d['src'] = sc['src']
    elif sc['lv'] == 3:
        warn('%s L3 vs 缺 src' % who)
    if end:
        d['end'] = end
    return [d]


# ---------------- test ----------------

def test_rows(sc, it):
    """ex -> test rows；返回 (rows, extra_end)。"""
    term = it['title']['term']
    say = sc.get('say', [])
    say0 = re.sub(r'^想一想：', '', say[0]) if say else ''
    rows = []
    for e in sc['ex']:
        s = e['s']
        if not e.get('ok', True):
            rows.append({'w': s, 'ok': False, 'r': e.get('why') or '不对。', 'note': '不对'})
            if e.get('fix'):
                rows.append({'w': e['fix'], 'ok': True, 'say': '改成：' + e['fix'],
                             'r': '改过来就通顺了。', 'note': '改正'})
        elif e.get('is') is False:
            note = e.get('note') or ('不是' + term)
            rows.append({'w': s, 'ok': True, 'r': note + '，不是' + term + '。', 'note': note})
        else:
            note = e.get('note')
            rows.append({'w': s, 'ok': True, 'r': note or '能说。', 'note': note or '能说'})
    if rows and say0:
        rows[0]['say'] = say0
    return rows


def test_scene(sc, it):
    term = it['title']['term']
    who = '%s test「%s」' % (term, sc['tab'])
    rows = test_rows(sc, it)
    if len(rows) > 4:
        # 5 行：把 fix 行并入上一条 bad 行的 r
        merged = []
        for r in rows:
            if r.get('note') == '改正' and merged and merged[-1].get('ok') is False:
                merged[-1]['r'] = merged[-1]['r'] + '改成“' + strip_end(r['w']) + '”。'
            else:
                merged.append(r)
        rows = merged
    if len(rows) > 4:
        raise ValueError(who + '：行数 %d 超 4，需手工' % len(rows))
    d = {'k': 'test', 'lv': sc['lv'], 'tab': sc['tab'], 'rows': rows}
    if len(rows) <= 3 and sc.get('ask'):
        d['h'] = sc['ask'] if len(sc['ask']) <= 27 else sc['tab']
    elif len(rows) > 3 and sc.get('ask'):
        warn('%s test 4 行，h 丢弃（放不下）：%s' % (who, sc['ask']))
    if sc.get('ask'):
        # q 附在首行 r 拍上（4 行时 h 虽无，提问仍保留）
        rows[0]['q'] = sc['ask']
    n = max(len(r['w']) for r in rows)
    size = round(460 / n)
    if size < 38:
        d['size'] = size
    say = sc.get('say', [])
    if len(say) > 1:
        d['expl'] = say[1:]
    if sc.get('src'):
        d['src'] = sc['src']
    return [d]


# ---------------- fix ----------------

def char_diff(a, b):
    """最长差异段：返回 (err_in_a, ok_in_b)。"""
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    best = None
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        seg_a, seg_b = a[i1:i2], b[j1:j2]
        ln = max(len(seg_a), len(seg_b))
        if best is None or ln > best[0]:
            best = (ln, seg_a, seg_b)
    if best is None:
        return None, None
    return best[1] or None, best[2] or None


def fix_scene(sc, it):
    term = it['title']['term']
    who = '%s fix「%s」' % (term, sc['tab'])
    ex = sc['ex']
    bads = [e for e in ex if not e.get('ok', True)]
    oks = [e for e in ex if e.get('ok', True)]
    if len(bads) != 1:
        raise ValueError(who + '：bad 例 %d 句，需手工拆分' % len(bads))
    bad, good, why = bads[0]['s'], bads[0]['fix'], bads[0].get('why') or '不对。'
    if len(bad) > 27:
        warn('%s fix bad 超 27 字（size 42 一行约 27 字）：%s' % (who, bad))
    if len(good) > 27:
        warn('%s fix good 超 27 字：%s' % (who, good))
    err, ok = char_diff(bad, good)
    d = {'k': 'fix', 'lv': sc['lv'], 'tab': sc['tab'], 'bad': bad, 'good': good, 'why': why}
    if err:
        d['err'] = err
    if ok:
        d['ok'] = ok
    say = sc.get('say', [])
    if say:
        d['h'] = h_of(say[0], sc['tab'], term)
    if sc.get('ask'):
        d['ask'] = sc['ask']
    if sc['lv'] == 3:
        if sc.get('src'):
            d['src'] = sc['src']
        else:
            warn('%s fix「%s」L3 缺 src' % (who, sc['tab']))
    if oks:
        e0 = oks[0]
        if len(e0['s']) <= 36:
            d['end'] = e0['s']
    return [d]


# ---------------- review ----------------

def strip_end(s):
    return re.sub(r'[。]$', '', s.strip())


def review_scene(sc, it):
    good = re.sub(r'（或[^）]*）', '', sc['good']).strip()
    why = None
    if '：' in good and len(good) > 14:
        good, why = good.split('：', 1)
    if len(good) > 27:
        # good 按 size 40 一行约 27 字；超长时按 ； 拆成 good + why（why 只作旁白）
        for sep in ('；', '，'):
            if sep in good:
                a, b = good.split(sep, 1)
                if a and len(a) <= 27:
                    good, why = a, b
                    break
        if len(good) > 27:
            warn('%s review good 超 27 字（size 40 一行约 27 字），需手工：%s'
                 % (it['title']['term'], good))
    d = {'k': 'review', 'lv': 2, 'tab': sc.get('tab', '判对了吗'),
         'task': sc['task'], 'answer': strip_end(sc['answer']), 'ok': sc['ok']}
    if not sc['ok']:
        d['good'] = strip_end(good)
    if why:
        d['why'] = strip_end(why)
    rule = sc['rule']
    if len(rule) > 36:
        rule = re.split(r'[；;]', rule)[0]
        if not rule.endswith(('。', '！', '？')):
            rule += '。'
    d['rule'] = rule
    diff = sc.get('diff')
    if diff:
        out = {}
        if 'wrong' in diff:
            out['bad'] = diff['wrong']
        if 'extra' in diff:
            out['extra'] = diff['extra']
        if 'miss' in diff:
            out['miss'] = diff['miss']
        if out:
            d['diff'] = out
    return [d]


MECHANICAL = {'cards': cards_scene, 'vs': vs_scene, 'test': test_scene,
              'fix': fix_scene, 'review': review_scene}

# MANUAL 表在文件后半部：MANUAL[item_id][scene_idx] = fn(it, sc) -> [engine scenes]
MANUAL = {}


def convert_item(it):
    """一项内容稿 -> (scene_name, [engine scenes])。"""
    term = it['title']['term']
    scenes = [title_scene(it)]
    man = MANUAL.get(it['id'], {})
    for i, sc in enumerate(it['scenes']):
        if i in man:
            scenes.extend(man[i](it, sc))
            continue
        fn = MECHANICAL.get(sc['k'])
        if not fn:
            raise ValueError('%s 场景 %d：k=%s 无机械转换，需 MANUAL' % (term, i, sc['k']))
        try:
            scenes.extend(fn(sc, it))
        except ValueError as e:
            raise ValueError('%s 场景 %d：%s' % (term, i, e))
    scenes.append(end_scene(it))
    return term, scenes


def emit(item_id, term, scenes):
    lines = ["NHZWB.add(%s, {" % js(term), '  scenes: [']
    for j, sc in enumerate(scenes):
        comma = ',' if j < len(scenes) - 1 else ''
        lines.append('  ' + js(sc) + comma)
    lines.append('  ]')
    lines.append('});')
    return '\n'.join(lines) + '\n'


def load_all():
    items = {}
    for gid, fname, _gname in GROUPS:
        data = json.load(open(os.path.join(DRAFT_DIR, fname), encoding='utf-8'))
        for it in data['items']:
            items[it['id']] = (gid, it)
    return items


def load_index():
    src = open(INDEX_JS, encoding='utf-8').read()
    names = re.findall(r'"([^"]+)":\s*"([^"]+)"', src)
    return {n: f for n, f in names}


def update_index(new_entries, dry=False):
    """new_entries: [(group_id, group_name, term, item_id)]。追加到对象末尾。"""
    src = open(INDEX_JS, encoding='utf-8').read()
    idx = load_index()
    todo = []
    for _gid, _gn, term, iid in new_entries:
        if term in idx:
            if idx[term] == iid:
                print('index.js 已有 %s -> %s，跳过' % (term, iid))
                continue
            raise ValueError('index 已有同名条目：%s -> %s' % (term, idx[term]))
        if iid in idx.values():
            raise ValueError('index 已有同 id：%s' % iid)
        todo.append((_gid, _gn, term, iid))
    if not todo:
        return
    new_entries = todo
    # 插在最后的 "};" 之前
    pos = src.rfind('\n};')
    if pos < 0:
        raise ValueError('index.js 找不到结尾 };')
    block = []
    cur = None
    for gid, gname, term, iid in new_entries:
        if gid != cur:
            block.append('  /* Q13 新增 50 项（docs/yufa-neirong/%s）：%s */' % (gid, gname))
            cur = gid
        block.append('  "%s": "%s",' % (term, iid))
    new_src = src[:pos] + '\n' + '\n'.join(block) + src[pos:]
    if dry:
        print('--- index.js 将追加 ---')
        print('\n'.join(block))
        return
    open(INDEX_JS, 'w', encoding='utf-8').write(new_src)
    print('index.js 已登记 %d 项' % len(new_entries))


def main():
    a = sys.argv[1:]
    dry = '--dry-run' in a
    a = [x for x in a if x != '--dry-run']
    if '--list-manual' in a:
        items = load_all()
        for iid, (_gid, it) in sorted(items.items()):
            man = MANUAL.get(iid, {})
            need = []
            for i, sc in enumerate(it['scenes']):
                if i in man or sc['k'] in MECHANICAL:
                    if i in man:
                        need.append('%d:%s(手工)' % (i, sc['k']))
                    continue
                need.append('%d:%s(无转换)' % (i, sc['k']))
            if need:
                print('%s %s: %s' % (iid, it['title']['term'], ' '.join(need)))
        return
    items = load_all()
    targets = []
    if '--all' in a:
        targets = [(gid, it) for gid, it in items.values()]
    elif '--group' in a:
        g = a[a.index('--group') + 1]
        targets = [(gid, it) for gid, it in items.values() if gid == g]
        if not targets:
            print('无此组：%s' % g, file=sys.stderr)
            sys.exit(1)
    elif '--item' in a:
        iid = a[a.index('--item') + 1]
        if iid not in items:
            print('无此项：%s' % iid, file=sys.stderr)
            sys.exit(1)
        gid, it = items[iid]
        targets = [(gid, it)]
    else:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    entries = []
    for gid, it in targets:
        term, scenes = convert_item(it)
        out = emit(it['id'], term, scenes)
        path = os.path.join(WB, 's', it['id'] + '.js')
        if dry:
            print('===== %s (%s) %d 幕 =====' % (it['id'], term, len(scenes)))
            print(out)
        else:
            open(path, 'w', encoding='utf-8').write(out)
            print('写 %s：%s，%d 幕' % (it['id'], term, len(scenes)))
        gname = dict((g, n) for g, _f, n in GROUPS)[gid]
        entries.append((gid, gname, term, it['id']))
    if not dry:
        update_index(entries)
    if WARNINGS:
        print('\n共 %d 条警告：' % len(WARNINGS), file=sys.stderr)
        for w in WARNINGS:
            print('  ! ' + w, file=sys.stderr)


# ---------------- 手工辅助 ----------------

def fix_multi(ends=None):
    """多 bad fix → 每 bad 一幕 fix；ends[i] 为第 i 幕的 end（可省）。"""
    def f(it, sc):
        ex = sc['ex']
        bads = [e for e in ex if not e.get('ok', True)]
        say = sc.get('say', [])
        out = []
        for j, b in enumerate(bads):
            bad, good, why = b['s'], b['fix'], b.get('why') or '不对。'
            err, ok = char_diff(bad, good)
            d = {'k': 'fix', 'lv': sc['lv'], 'tab': sc['tab'], 'bad': bad,
                 'good': good, 'why': why}
            if err:
                d['err'] = err
            if ok:
                d['ok'] = ok
            if say:
                d['h'] = h_of(say[0], sc['tab'], it['title']['term'])
            if sc.get('ask'):
                d['ask'] = sc['ask']
            if ends and j < len(ends) and ends[j]:
                d['end'] = ends[j] if isinstance(ends[j], str) else sc['say'][ends[j]]
            out.append(d)
        return out
    return f


def vs2(L, R, end=None, h=None):
    """手工 vs：L/R 由调用方给定 {t, s:[…], k:0, n?, say?}；h/ask/src 从 sc 取。

    用于缺 note 的 vs（t/n 须从 say/tab 里人工确认，不可机械猜）。
    L/R/end 里的 say 可写整数 i，取 sc['say'][i]；end 可写整数 i 或字符串。
    h：None 时自动（say[0]≤22 字就用，否则用 tab）；传字符串/整数可指定。
    """
    def f(it, sc):
        def res(side):
            d = dict(side)
            if isinstance(d.get('say'), int):
                d['say'] = sc['say'][d['say']]
            return d
        d = {'k': 'vs', 'lv': sc['lv'], 'tab': sc['tab'], 'L': res(L), 'R': res(R)}
        say = sc.get('say', [])
        if isinstance(h, int):
            d['h'] = sc['say'][h]
        elif h:
            d['h'] = h
        elif say:
            d['h'] = say[0] if len(say[0]) <= 22 else sc['tab']
        if sc.get('ask'):
            d['ask'] = sc['ask']
        if sc.get('src'):
            d['src'] = sc['src']
        if isinstance(end, int):
            d['end'] = sc['say'][end]
        elif end:
            d['end'] = end
        return [d]
    return f


def vs1_to_test(note):
    """1 例 vs → test（1 行）：L3 单例深讲沿用 L3→test 的既有做法。

    row.w = 唯一例句；row.r = say[1]（解释句）；expl = say[2:]；note 由调用方给定。
    """
    def f(it, sc):
        say = sc.get('say', [])
        s = strip_end_punct(strip_paren(sc['ex'][0]['s']))
        row = {'w': s, 'ok': True, 'r': say[1] if len(say) > 1 else '能说。',
               'note': note}
        if say:
            row['say'] = re.sub(r'^想一想：', '', say[0])
        d = {'k': 'test', 'lv': sc['lv'], 'tab': sc['tab'], 'rows': [row]}
        if sc.get('ask'):
            d['h'] = sc['ask'] if len(sc['ask']) <= 27 else sc['tab']
            row['q'] = sc['ask']
        n = max(len(r['w']) for r in d['rows'])
        size = round(460 / n)
        if size < 38:
            d['size'] = size
        if len(say) > 2:
            d['expl'] = say[2:]
        if sc.get('src'):
            d['src'] = sc['src']
        return [d]
    return f


# ================= MANUAL 手工场景 =================
# MANUAL[item_id][scene_idx] = fn(it, sc) -> [engine scenes]。
# 机械转不了的幕（1/3/4 例 vs、含 ok:false 的 vs、mark/morph/nest/steps/line/
# slots/valence）都在这里手工写；say/ex/ask 仍从内容稿 JSON 取，不另编内容。


def _jiedai_l3(it, sc):
    """借代 L3「长发姐姐 · 长发」：两侧均无 note，t/n 手工指定。"""
    return [{'k': 'vs', 'lv': 3, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc.get('ask'), 'src': sc['src'],
             'L': {'t': '借代', 's': ['长发唱得真好'], 'k': 0,
                   'n': '本体不见了，只用“长发”代人', 'say': sc['say'][2]},
             'R': {'t': '不是借代', 's': ['长发姐姐唱得真好'], 'k': 0,
                   'n': '本体“姐姐”还在，“长发”是定语', 'say': sc['say'][1]},
             'end': sc['say'][3]}]


MANUAL['rh_jiedai'] = {4: _jiedai_l3}


# ================= 01 句型句式 =================

def _shuangbin_valence1(it, sc):
    say = sc['say']
    return [{'k': 'valence', 'lv': 1, 'tab': sc['tab'], 'h': say[0],
             'ask': sc.get('ask'),
             'rows': [{'s': ['奶奶', '给', '我', '一个', '苹果'], 'v': 1,
                       'args': [0, {'i': 2, 'tag': '给谁'}, {'i': 4, 'tag': '给什么'}],
                       'say': say[1]}]}]


def _shuangbin_slots(it, sc):
    say = sc['say']
    return [{'k': 'slots', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': say[0], 'slots': ['谁', '动词', '给谁', '给什么'], 'key': [2, 3],
             'ex': [{'s': ['老师', '教', '我们', '一首歌'], 'hl': [2, 3], 'say': say[1]},
                    {'s': ['小明', '送', '妹妹', '一张卡片'], 'hl': [2, 3]}],
             'bad': {'s': ['奶奶', '给', '一个苹果', '我'], 'miss': 2,
                     'say': '放反了：先说人，后说东西，不能倒过来。'}}]
    # 注：有 bad 时不设 end（slots 模板 bad 行 y=514 与 end y=530 会重叠，既有场景亦如此）


def _shuangbin_morph(it, sc):
    a = {'k': 'morph', 'lv': 2, 'tab': sc['tab'], 'h': '第一次：加上“给”',
         'from': [{'id': 'S', 'w': ['我']}, {'id': 'V', 'w': ['送']},
                  {'id': 'R', 'w': ['妹妹'], 'tag': '给谁'},
                  {'id': 'T', 'w': ['一张卡片'], 'tag': '给什么', 'np': 1}],
         'to': ['S', 'V', {'id': 'g', 'w': ['给']}, 'R', 'T'],
         'moveSay': '“给”从上方落到“送”后面。', 'toSay': '我送给妹妹一张卡片。',
         'okSay': '意思没变，能说。'}
    # 注：第二变 from 用「这张卡片」而非内容稿 ex 的「一张卡片」——「把」后须是确定的那一件
    b = {'k': 'morph', 'lv': 2, 'tab': sc['tab'], 'h': '第二次：换成“把”字句',
         'from': [{'id': 'S', 'w': ['我']}, {'id': 'V', 'w': ['送给']},
                  {'id': 'R', 'w': ['妹妹']}, {'id': 'T', 'w': ['这张卡片'], 'np': 1}],
         'to': ['S', {'id': 'b', 'w': ['把'], 'hub': 1}, 'T', 'V', {'id': 'le', 'w': ['了']}, 'R'],
         'read': '我送给妹妹这张卡片。',
         'moveSay': '“这张卡片”搬到“把”后面，“了”跟在动词后。',
         'toSay': '我把这张卡片送给了妹妹。', 'okSay': '意思没变，能说。'}
    return [a, b]


def _shuangbin_valence3(it, sc):
    say = sc['say']
    return [{'k': 'valence', 'lv': 3, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc.get('ask'), 'src': sc['src'],
             'rows': [{'s': ['我', '借', '了', '他', '一本', '书'], 'v': 1,
                       'args': [0, {'i': 3, 'tag': '借谁'}, {'i': [4, 5], 'tag': '借什么'}],
                       'say': say[1]},
                      {'s': ['我', '借给', '他', '一本', '书'], 'v': 1,
                       'args': [0, {'i': 2, 'tag': '借给谁'}, {'i': [3, 4], 'tag': '借什么'}],
                       'say': '加上“给”，书只能从我这儿到他那儿。'},
                      {'s': ['我', '向', '他', '借', '了', '一本', '书'], 'v': 3,
                       'args': [0, {'i': 2, 'tag': '向谁借'}, {'i': [5, 6], 'tag': '借什么'}],
                       'say': '向他借，书从他那儿到我这儿。'}],
             'end': say[3]}]


MANUAL['jx_shuangbin'] = {0: _shuangbin_valence1, 1: _shuangbin_slots,
                          3: _shuangbin_morph, 4: _shuangbin_valence3}


def _liandong_steps(it, sc):
    return [{'k': 'steps', 'lv': 1, 'tab': sc['tab'], 'h': sc['say'][0],
             'items': ['跑过去', '开门'], 'end': '一个人，接连做了两件事。'}]


def _liandong_line(it, sc):
    say = sc['say']
    return [{'k': 'line', 'lv': 3, 'tab': sc['tab'], 'h': say[0],
             'say': say[1], 'src': sc['src'],
             'pts': [{'x': '先坐车', 'w': '他坐公交车到学校', 'n': '先坐车，后到校'},
                     {'x': '先到校', 'w': '他到学校坐公交车', 'n': '先到校，后坐车'}],
             'end': say[3]}]


MANUAL['jx_liandong'] = {0: _liandong_steps,
    2: vs2({'t': '连动句', 's': ['我去食堂吃饭'], 'k': 0,
            'say': '吃饭的是“我”，连动句。'},
           {'t': '兼语句', 's': ['我请他吃饭'], 'k': 0,
            'n': '不是连动句', 'say': '吃饭的是“他”，兼语句。'},
           end=1),
    4: _liandong_line}


def _zhuweiwei_nest(it, sc):
    return [{'k': 'nest', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'], 'style': 'box',
             's': ['他', '身体', '很好'], 'tree': ['zw', 0, ['zw', 1, 2]],
             'ask': sc.get('ask')}]
    # say 省略：nest 按盒子自动生成旁白（「“身体”和“很好”装进一个盒子：谁+怎样。」）


MANUAL['jx_zhuweiwei'] = {
    0: _zhuweiwei_nest,
    2: vs2({'t': '主谓谓语句', 's': ['他身体很好'], 'k': 0,
            'n': '主语是“他”，谓语是“身体很好”', 'say': 2},
           {'t': '普通主谓句', 's': ['他的身体很好'], 'k': 0,
            'n': '主语是“他的身体”，谓语是“很好”', 'say': 1},
           end=0),
    3: vs2({'t': '先说这本书', 's': ['这本书我看完了'], 'k': 0,
            'n': '话题是这本书', 'say': 1},
           {'t': '先说我', 's': ['我这本书看完了'], 'k': 0,
            'n': '话题是我', 'say': 1},
           end='很多语法学家认为，汉语句首的大主语就是“话题”。'),
}


def _yinyu_steps1(it, sc):
    return [{'k': 'steps', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'items': ['去掉冒号、引号', '换人称，看谁对谁说', '去掉语气词、称呼'],
             'end': '小红对我说，她借我的书看完了。'}]


def _yinyu_steps2(it, sc):
    return [{'k': 'steps', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'items': ['问话转述：“吗？”变成“没有。”', '请求转述：“你快去”变成“让我快去”'],
             'end': '问号、叹号都换成句号。'}]


MANUAL['jx_yinyu'] = {
    0: vs2({'t': '原话', 's': ['妈妈说：“我明天去学校”'], 'k': 0,
            'n': '引号框住原话', 'say': 0},
           {'t': '转述', 's': ['妈妈说她明天去学校'], 'k': 0,
            'n': '引号没了，“我”变“她”', 'say': 1}),
    1: _yinyu_steps1,
    2: _yinyu_steps2,
    4: vs2({'t': '当时在公园', 's': ['小明说：“我在这儿等你”'], 'k': 0,
            'n': '“这儿”是小明站的地方'},
           {'t': '现在在家里', 's': ['小明说他在那儿等我'], 'k': 0,
            'n': '“这儿”改成“那儿”', 'say': 1},
           end='语言学把它们叫“指示语”。'),
}


def _duochong_nest(it, sc):
    say = sc['say']
    return [{'k': 'nest', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'], 'style': 'box',
             'size': 40, 'read': say[0],
             's': ['虽然', '天', '很', '冷', '但是', '大家', '都', '来了', '而且', '来', '得', '很', '早'],
             'tree': ['zhuanzhe', ['fuju', 0, 1, 2, 3],
                      ['dijin', ['fuju', 4, 5, 6, 7], ['fuju', 8, 9, 10, 11, 12]]],
             'ask': sc.get('ask')}]
    # say 省略：nest 自动生成按盒子旁白；size 40（44 时最外框会出界）


def _duochong_steps(it, sc):
    return [{'k': 'steps', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'items': ['数一数有几个分句', '圈出关联词', '找第一层：哪个关联词“管”得最远', '在每一块里再分'],
             'end': '第一层画“｜”，第二层画“‖”。'}]


def _duochong_vs(it, sc):
    # 内容稿是 vs，但要点是两句的切法不同（台阶线）：改成两幕 nest（stair），分句作词块，
    # 只切两层，不切词内。act「两句的台阶形状对比」由两幕先后对照实现。
    say = sc['say']
    a = {'k': 'nest', 'lv': 3, 'tab': sc['tab'], 'h': '第一句：转折先分', 'style': 'stair',
         's': ['虽然下雨了', '但是比赛照常进行', '因为场馆有屋顶'],
         'tree': ['zhuanzhe', 0, ['yinguo', 1, 2]], 'ask': sc.get('ask'), 'src': sc['src']}
    b = {'k': 'nest', 'lv': 3, 'tab': sc['tab'], 'h': '第二句：因果先成块', 'style': 'stair',
         's': ['因为下雨了', '比赛推迟了', '但是观众都没走'],
         'tree': ['zhuanzhe', ['yinguo', 0, 1], 2], 'src': sc['src'], 'end': say[3]}
    return [a, b]


def _duochong_fix(it, sc):
    # fix 模板 bad/good 按 size 42 一行约 27 字；带 ①②③ 的原句 28/29 字会出界，
    # 去掉序号标记（｜‖ 切分位置才是要点，say/why 里的 ①②③ 指代仍成立）。
    ex = sc['ex'][0]
    bad = ex['s'].replace('①', '').replace('②', '').replace('③', '')
    good = ex['fix'].replace('①', '').replace('②', '').replace('③', '')
    err, ok = char_diff(bad, good)
    d = {'k': 'fix', 'lv': 2, 'tab': sc['tab'], 'bad': bad, 'good': good,
         'why': ex.get('why') or '不对。'}
    if err:
        d['err'] = err
    if ok:
        d['ok'] = ok
    say = sc.get('say', [])
    if say:
        d['h'] = h_of(say[0], sc['tab'], it['title']['term'])
    return [d]


MANUAL['jx_duochong'] = {0: _duochong_nest, 1: _duochong_steps,
                         2: _duochong_fix, 3: _duochong_vs}


def _jinsuo_morph0(it, sc):
    say = sc['say']
    return [{'k': 'morph', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'from': [{'id': 'r', 'w': ['如果']}, {'id': 'a', 'w': ['你', '去']},
                      {'id': 'b', 'w': ['我', '就', '去']}],
             'to': ['a', 'b'], 'read': say[0],
             'moveSay': '把“如果”和逗号拿掉，压一压。', 'toSay': '你去我就去。',
             'okSay': '意思没变，能说。', 'ask': sc.get('ask'), 'end': say[2]}]


def _jinsuo_morph2(it, sc):
    a = {'k': 'morph', 'lv': 2, 'tab': sc['tab'], 'h': '“不见不散”松开',
         'from': [{'id': 'a', 'w': ['不见']}, {'id': 'b', 'w': ['不散']}],
         'to': [{'id': 'if', 'w': ['如果']}, 'a', {'id': 'mian', 'w': ['面']},
                {'id': 'jiu', 'w': ['就']}, 'b', {'id': 'qu', 'w': ['去']}],
         'moveSay': '两块向两边拉开，“如果”“就”从上方落入，“面”“去”补上。',
         'toSay': '如果不见面，就不散去。', 'okSay': '意思没变，能说。'}
    b = {'k': 'morph', 'lv': 2, 'tab': sc['tab'], 'h': '“再忙也要吃早饭”松开',
         'from': [{'id': 'a', 'w': ['再忙']}, {'id': 'b', 'w': ['也要', '吃', '早饭']}],
         'to': [{'id': 'jishi', 'w': ['即使']}, 'a', 'b'],
         'moveSay': '补进“即使”，松开成复句。', 'toSay': '即使再忙，也要吃早饭。',
         'okSay': '意思没变，能说。'}
    return [a, b]


MANUAL['jx_jinsuo'] = {
    0: _jinsuo_morph0,
    2: _jinsuo_morph2,
    3: vs2({'t': '紧缩复句', 's': ['他一进门就喊妈妈'], 'k': 0,
            'n': '“一…就”连着两件事', 'say': 0},
           {'t': '连动句', 's': ['他进门喊妈妈'], 'k': 0,
            'n': '没有关联格式，是单句', 'say': 1}),
    4: vs2({'t': '发生过一次', 's': ['他一到家就睡了'], 'k': 0,
            'n': '到家，紧接着睡了', 'say': 1},
           {'t': '常常这样', 's': ['我一紧张就结巴'], 'k': 0,
            'n': '只要紧张，就会结巴', 'say': 2},
           end=3),
}

MANUAL['jx_julei'] = {
    4: vs2({'t': '感叹或祈使', 's': ['火！'], 'k': 0,
            'n': '大喊“火！”，提醒大家', 'say': '大喊“火！”，是提醒大家。'},
           {'t': '疑问', 's': ['火？'], 'k': 0,
            'n': '指着问“火？”，是疑问', 'say': '指着问“火？”，是疑问。'},
           end='“火！”是非主谓句，句类靠语调定。'),
}


# ================= 02 补语细分 =================

MANUAL['bu_chengdu'] = {
    4: vs2({'t': '程度补语', 's': ['小狗累坏了'], 'k': 0,
            'n': '小狗没有坏，只是累到极点', 'say': 2},
           {'t': '结果补语', 's': ['杯子摔坏了'], 'k': 0,
            'n': '杯子真的坏了', 'say': 1},
           end=3),
    # 注：say[1] 讲 ex[1]（杯子）、say[2] 讲 ex[0]（小狗），顺序是反的，已按 ex 对位；
    # act 里的状态图（完整→碎了 / 程度条）vs 模板画不出，只保留文字对照。
}

MANUAL['bu_dongliang'] = {
    2: vs2({'t': '一次', 's': ['这本书我看了一次'], 'k': 0,
            'n': '看过一回，不一定看完', 'say': 0},
           {'t': '一遍', 's': ['这本书我看了一遍'], 'k': 0,
            'n': '从第一页看到最后一页', 'say': 1},
           h='一次和一遍'),
    4: vs2({'t': '名量', 's': ['他嘴里含着一口苹果'], 'k': 0,
            'n': '量苹果有多少', 'say': 1},
           {'t': '动量', 's': ['他咬了一口苹果'], 'k': 0,
            'n': '量咬了几次', 'say': 2},
           end='“口、脚、眼、拳”借来数动作，叫借用动量词。'),
}


def _bu_jieguo_morph(it, sc):
    say = sc['say']
    return [{'k': 'morph', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'from': [{'id': 'S', 'w': ['弟弟']}, {'id': 'b', 'w': ['把']},
                      {'id': 'O', 'w': ['杯子']}, {'id': 'V', 'w': ['打']}],
             'to': ['S', 'b', 'O', 'V', {'id': 'r', 'w': ['碎']}, {'id': 'le', 'w': ['了']}],
             'read': '弟弟把杯子打。', 'ask': sc.get('ask'),
             'moveSay': '“碎”从上方落到“打”后面，紧贴着不留空。',
             'toSay': '弟弟把杯子打碎了。', 'okSay': say[1],
             'state': {'a': '杯子好好的', 'b': '杯子碎了',
                       'say': '打之前，杯子好好的；打之后，杯子碎了。'}}]


MANUAL['bu_jieguo'] = {
    0: _bu_jieguo_morph,
    4: vs2({'t': '累的是“我”', 's': ['我写累了'], 'k': 0,
            'n': '结果挂在主语上', 'say': '写累了：累的是“我”。'},
           {'t': '错的是字', 's': ['我写错了'], 'k': 0,
            'n': '结果挂在动作上', 'say': '写错了：错的是写的字。'},
           end='衣服洗干净了：干净的是衣服。'),
}


def _bu_keneng_morph(it, sc):
    def one(h, a, b, toSay, okSay, moveSay='“不”从上方落进缝里。'):
        return {'k': 'morph', 'lv': 2, 'tab': sc['tab'], 'h': h,
                'from': [{'id': 'a', 'w': [a]}, {'id': 'b', 'w': [b]}],
                'to': ['a', {'id': 'bu', 'w': ['不']}, 'b'],
                'read': a + b + '。', 'moveSay': moveSay, 'toSay': toSay, 'okSay': okSay}
    return [one('做完 → 做不完', '做', '完', '做不完。', '插进“不”，就成了可能补语。'),
            one('上去 → 上不去', '上', '去', '上不去。', '插进“不”，就成了可能补语。'),
            one('吃了 → 吃不了', '吃', '了', '吃不了。', '“了”读 liǎo：吃不了。',
                '“不”从上方落进缝里，“了”读 liǎo。')]


MANUAL['bu_keneng'] = {
    1: _bu_keneng_morph,
    4: vs2({'t': '否定：学不会', 's': ['这门课我学不会'], 'k': 0,
            'n': '常常单独用', 'say': '否定的“学不会”常常单独用。'},
           {'t': '肯定：学得会', 's': ['你学得会吗？——学得会'], 'k': 0,
            'n': '多半在问答里', 'say': '肯定的“学得会”多半在问答里。'},
           end='肯定的意思，平时多用“能”：我能学会。'),
}


def _bu_shiliang_line(it, sc):
    say = sc['say']
    return [{'k': 'line', 'lv': 1, 'tab': sc['tab'], 'h': say[0], 'say': say[1],
             'pts': [{'x': '下水', 'w': '开始游'},
                     {'x': '上岸', 'w': '游完了', 'n': '半个小时'}],
             'end': '说时间长短的词跟在动词后面，就是时量补语。'}]


MANUAL['bu_shiliang'] = {
    0: _bu_shiliang_line,
    4: vs2({'t': '只说三年', 's': ['他学了三年汉语'], 'k': 0,
            'n': '现在可能不学了', 'say': 1},
           {'t': '到现在三年', 's': ['他学了三年汉语了'], 'k': 0,
            'n': '而且还在学', 'say': 2},
           end=3),
}


# ================= 03 词与短语 =================

MANUAL['cd_chongdie'] = {
    4: vs2({'t': '定语：程度轻', 's': ['她有一双大大的眼睛'], 'k': 0,
            'n': '“大大的”带一点喜爱', 'say': 1},
           {'t': '状语：程度重', 's': ['他的成绩大大地提高了'], 'k': 0,
            'n': '“大大地”是程度很深', 'say': 2},
           end='定语、谓语位置程度轻，状语、补语位置程度重。'),
}


def _dezi_morph(it, sc):
    return [{'k': 'morph', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'from': [{'id': 'S', 'w': ['我']}, {'id': 'V', 'w': ['要']},
                      {'id': 'A', 'w': ['红', '的']}, {'id': 'N', 'w': ['苹果']}],
             'to': ['S', 'V', 'A'], 'read': '我要红的苹果。', 'ask': sc.get('ask'),
             'moveSay': '“苹果”淡出，省掉了。', 'toSay': '我要红的。',
             'okSay': '“红的”就是“红的苹果”，大家都知道。'}]


def _dezi_mark(it, sc):
    say = sc['say']
    a = {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
         's': ['开车', '的', '是', '我', '爸爸'], 'say': '开车的是我爸爸。',
         'm': [{'i': [0, 1], 'role': 'zhu', 'say': '“开车的”作主语。'}]}
    b = {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
         's': ['这本', '书', '是', '图书馆', '的'], 'say': '这本书是图书馆的。',
         'm': [{'i': [3, 4], 'role': 'bin', 'say': '“图书馆的”作宾语。'}],
         'end': say[0]}
    return [a, b]


MANUAL['cd_dezi'] = {
    0: _dezi_morph,
    3: _dezi_mark,
    4: vs2({'t': '送的东西', 's': ['这本书是送你的'], 'k': 0,
            'n': '送的是东西', 'say': '可以是送给你的东西。'},
           {'t': '送你的人', 's': ['送你的在门口等着'], 'k': 0,
            'n': '送的是人', 'say': '也可以是送你回家的人。'},
           end='“的”字短语会把意思“转”到人或东西身上。'),
}


def _fangwei_slots(it, sc):
    say = sc['say']
    return [{'k': 'slots', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'say': say[1].split('。')[0] + '。', 'slots': ['球', '在', '箱子', '方位词'],
             'key': 3,
             'ex': [{'s': ['球', '在', '箱子', '里']},
                    {'s': ['球', '在', '箱子', '上']},
                    {'s': ['球', '在', '箱子', '旁边'], 'say': '这些说位置的词叫方位词。'}]}]
    # 注：3 例 + end 会纵向重叠（末行 y=514 与 end y=530），规则改放末例 say；ask 无 bad 位可挂，丢弃


MANUAL['cd_fangwei'] = {
    0: _fangwei_slots,
    2: fix_multi(ends=[None, 2]),
    4: vs2({'t': '在桌子上', 's': ['在桌子上'], 'k': 0,
            'n': '“在”和“上”合起来框', 'say': '“在”只说“在某处”，“上”说明是哪个位置。'},
           {'t': '在北京', 's': ['在北京'], 'k': 0,
            'n': '“北京”本身是地方', 'say': '普通名词本身不是地方，要靠方位词把它变成地方。'},
           end=2),
}


def _jiebin_mark0(it, sc):
    return [{'k': 'mark', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             's': ['小狗', '在', '操场上', '跑'], 'say': sc['say'][0], 'ask': sc.get('ask'),
             'm': [{'i': 1, 'sym': 'prep', 'say': '“在”是介词，像领路的人。'},
                   {'i': [1, 2], 'role': 'zhuang', 'say': '“在操场上”作状语，告诉我们在哪儿跑。'}]}]


def _jiebin_cards(it, sc):
    return [{'k': 'cards', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'items': [{'n': '状语', 'w': '他在图书馆看书。'},
                       {'n': '补语', 'w': '他住在学校旁边。'},
                       {'n': '定语', 'w': '我借了一本关于恐龙的书。'},
                       {'n': '“在”是动词', 'w': '他在家。'}]}]


MANUAL['cd_jiebin'] = {
    0: _jiebin_mark0,
    2: _jiebin_cards,
    4: vs2({'t': '动词', 's': ['我给他一本书'], 'k': 0,
            'n': '“给”自己就是动作', 'say': 1},
           {'t': '介词', 's': ['我给他写信'], 'k': 0,
            'n': '“给他”只交代对象', 'say': 2},
           end='汉语的介词大多是从动词变来的。'),
}


def _nengyuan_cards(it, sc):
    return [{'k': 'cards', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'items': [{'n': '学会的本领', 'w': '我会游泳。'},
                       {'n': '达到的程度', 'w': '我能游一千米。'},
                       {'n': '条件不允许', 'w': '我今天感冒了，不能游泳。'},
                       {'n': '可能', 'w': '明天会下雨。'}]}]


MANUAL['cd_nengyuan'] = {
    1: _nengyuan_cards,
    4: vs2({'t': '推测', 's': ['他应该到家了'], 'k': 0,
            'n': '大概已经到家了', 'say': 1},
           {'t': '要求', 's': ['你应该早点到家'], 'k': 0,
            'n': '你该早点回来', 'say': 2},
           end='能愿动词有推测和义务两种用法。'),
}

MANUAL['cd_tongwei'] = {
    4: vs2({'t': '同位短语', 's': ['我们学生要爱护课桌'], 'k': 0,
            'n': '我们就是学生，能说', 'say': 1},
           {'t': '偏正短语', 's': ['我们学校有一个大操场'], 'k': 0,
            'n': '“我们学校”是“我们的学校”', 'say': 2},
           end='同位短语也可看作特殊的偏正结构。'),
}


# ---------- 04 组：深层 ----------
def _cengci_nest1(it, sc):
    # 妈妈买的新书包：zw(妈妈/买) + pz(新/书包)，再 de(妈妈买/的)，根 pz
    return [{'k': 'nest', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'], 's': ['妈妈', '买', '的', '新', '书包'],
             'tree': ['pz', ['de', ['zw', 0, 1], 2], ['pz', 3, 4]]}]


def _cengci_stair(it, sc):
    # 小明认真地写作业：zw(小明/谓语)，谓语再切 pz(认真地/动宾)，动宾再切 db(写/作业)
    return [{'k': 'nest', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'style': 'stair', 's': ['小明', '认真地', '写', '作业'],
             'tree': ['zw', 0, ['pz', 1, ['db', 2, 3]]]}]


def _cengci_reads(it, sc):
    say = sc['say']
    return [{'k': 'nest', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             's': ['三个', '班', '的', '同学'],
             'reads': [{'tree': ['pz', 0, ['pz', ['de', 1, 2], 3]],
                        'pic': {'t': '三个人'}, 'say': say[0]},
                       {'tree': ['pz', ['pz', 0, 1], ['de', 2, 3]],
                        'pic': {'t': '三个班的一群人'}, 'say': say[1]}],
             'both': say[2]}]


def _cengci_reads3(it, sc):
    say = sc['say']
    return [{'k': 'nest', 'lv': 3, 'tab': sc['tab'], 'h': sc['tab'],
             'style': 'box', 'ask': sc['ask'], 'src': sc['src'],
             's': ['进口', '零件'],
             'reads': [{'tree': ['db', 0, 1], 'pic': {'t': '动宾：把零件买进来'},
                        'say': '一种是动宾：进口零件——把零件买进来。'},
                       {'tree': ['pz', 0, 1], 'pic': {'t': '偏正：进口的零件'},
                        'say': '一种是偏正：进口的零件。'}],
             'both': '层次相同，关系不同，也会产生歧义。'}]


MANUAL['sx_cengci'] = {
    0: _cengci_nest1,
    1: _cengci_stair,
    3: _cengci_reads,
    4: _cengci_reads3,
}


def _huati_vs(it, sc):
    say = sc['say']
    return [{'k': 'vs', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'],
             'L': {'t': '问', 's': ['谁', '打碎了', '杯子'], 'k': 0,
                   'n': '问的是“谁”', 'say': say[0]},
             'R': {'t': '答', 's': ['是', '弟弟', '打碎的'], 'k': 1,
                   'n': '最要紧的是“弟弟”', 'say': say[1]}}]


MANUAL['sx_huati_jiaodian'] = {
    0: _huati_vs,
    4: vs2({'t': '答对了', 's': ['我是昨天来的'], 'k': 0,
            'n': '焦点是“昨天”，正好回答“什么时候”', 'say': 1},
           {'t': '答错了', 's': ['是我昨天来的'], 'k': 0,
            'n': '焦点变成了“我”，像问“谁来的”', 'say': 2},
           end='同样几个词，焦点放错，就答非所问。'),
}


def _peijia_l1(it, sc):
    say = sc['say']
    return [{'k': 'valence', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'],
             'rows': [{'s': ['下雨', '了'], 'v': 0, 'args': [], 'say': say[0]},
                      {'s': ['弟弟', '游泳'], 'v': 1, 'args': [0], 'say': say[1]},
                      {'s': ['我', '喜欢', '画画'], 'v': 1, 'args': [0, 2], 'say': say[2]},
                      {'s': ['奶奶', '给', '我', '一个', '苹果'], 'v': 1,
                       'args': [0, {'i': 2, 'tag': '给谁'}, {'i': 4, 'tag': '给什么'}],
                       'say': say[3]}]}]


def _peijia_empties(it, sc):
    say = sc['say']
    return [{'k': 'valence', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'end': say[2],
             'empties': [{'s': ['奶奶', '给', '我'], 'v': 1, 'args': [0, 2],
                          'missWord': '一个苹果', 'missAt': 3, 'say': say[0],
                          'fixSay': '补上“一个苹果”，话就说完了。'},
                         {'s': ['这次', '比赛', '使', '我'], 'v': 2,
                          'args': [[0, 1], 3], 'missWord': '明白了坚持的意义',
                          'missAt': 4, 'say': say[1],
                          'fixSay': '补上“明白了坚持的意义”。'}]}]


def _peijia_move(it, sc):
    say = sc['say']
    return [{'k': 'valence', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'end': say[2],
             'rows': [{'s': ['我', '吃', '了', '苹果'], 'v': 1, 'args': [0, 3],
                       'say': '我吃了苹果。“吃”两只手。'},
                      {'s': ['苹果', '我', '吃', '了'], 'v': 2, 'args': [1, 0],
                       'say': say[1]}]}]


def _peijia_l3(it, sc):
    say = sc['say']
    return [{'k': 'valence', 'lv': 3, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'], 'src': sc['src'],
             'end': '动词必须带的名词叫“论元”。',
             'rows': [{'s': ['门口', '站着', '一位', '老师'], 'v': 1, 'args': [3],
                       'say': say[1]},
                      {'s': ['一位', '老师', '站在', '门口'], 'v': 2, 'args': [1],
                       'say': '一位老师站在门口。“站”抓的还是“老师”。'}]}]


MANUAL['sx_peijia'] = {
    0: _peijia_l1,
    1: _peijia_empties,
    3: _peijia_move,
    4: _peijia_l3,
}


def _shenglue_vs(it, sc):
    say = sc['say']
    return [{'k': 'vs', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'], 'end': say[2],
             'L': {'t': '问', 's': ['你吃饭了吗'], 'k': 0,
                   'n': '问“你”吃没吃', 'say': say[0]},
             'R': {'t': '答', 's': ['（我）吃了'], 'k': 0,
                   'n': '“我”省掉了', 'say': say[1]}}]


def _shenglue_mark(it, sc):
    # 承前省一幕、蒙后省一幕；∅ 用 tag 标“省了谁”，箭头指回/指向
    return [{'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '小明进了门，∅放下书包。',
             's': ['小明', '进了', '门', '∅', '放下', '书包'],
             'm': [{'i': 3, 'tag': '省了“小明”', 'say': '这里省了“小明”。'}],
             'arrows': [{'f': 3, 't': 0, 'note': '承前',
                         'say': '∅ 指回前面的“小明”。'}]},
            {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '∅一进门，他就喊饿。', 'end': '∅ 读作“空”，表示这里本来有一个词。',
             's': ['∅', '一', '进门', '他', '就', '喊', '饿'],
             'm': [{'i': 0, 'tag': '省了“他”', 'say': '这里省了“他”。'}],
             'arrows': [{'f': 0, 't': 3, 'note': '蒙后',
                         'say': '∅ 指向后面的“他”。'}]}]


MANUAL['sx_shenglue'] = {
    0: _shenglue_vs,
    1: _shenglue_mark,
    2: vs2({'t': '省略', 's': ['小明拿起书，∅走了出去'], 'k': 0,
            'n': '补得出“小明”', 'say': 0},
           {'t': '残缺', 's': ['使班级卫生有了很大改善'], 'k': 0,
            'n': '主语补不出唯一的词', 'say': 1},
           end='能补出唯一的词，才叫省略。'),
}


def _yuxu_morph(it, sc):
    say = sc['say']
    return [{'k': 'morph', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'], 'read': say[0],
             'from': [{'id': 'gou', 'w': ['狗']}, {'id': 'v', 'w': ['咬']},
                      {'id': 'mao', 'w': ['猫']}],
             'to': ['mao', 'v', 'gou'],
             'moveSay': '把“狗”和“猫”换个位置。', 'toSay': '猫咬狗。',
             'okSay': '字一样，事情完全反过来了。',
             'roleTo': {'mao': 'zhu', 'gou': 'bin'},
             'roleSay': '“猫”到了前面，成了动手的；“狗”到了后面，成了被动手的。'}]


def _yuxu_cards(it, sc):
    say = sc['say']
    return [{'k': 'cards', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'end': say[2],
             'items': [{'n': '不很好：不太好', 'w': '这道菜不很好吃。'},
                       {'n': '很不好：非常差', 'w': '这道菜很不好吃。'},
                       {'n': '一会儿再说：过一阵再说', 'w': '我们一会儿再说。'},
                       {'n': '再说一会儿：继续说一阵', 'w': '我们再说一会儿。'}]}]


MANUAL['sx_yuxu_zhongyin'] = {
    0: _yuxu_morph,
    1: _yuxu_cards,
    4: vs2({'t': '确定的信', 's': ['信来了'], 'k': 0,
            'n': '大家在等的那封信', 'say': 1},
           {'t': '新来的一封', 's': ['来信了'], 'k': 0,
            'n': '事先不知道是谁的', 'say': 2},
           end='动词前的名词常是已知的，动词后的常是新出现的。'),
}


def _zhixiang_mark1(it, sc):
    say = sc['say']
    return [{'k': 'mark', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'ask': sc['ask'], 'say': say[0],
             's': ['他', '高高兴兴', '地', '吃', '了', '一碗', '面'],
             'm': [{'i': 1, 'role': 'zhuang',
                    'say': '“高高兴兴”挨着“吃”，可是高兴的是谁？是“他”。'}],
             'arrows': [{'f': 1, 't': 0, 'note': '高兴的是“他”',
                         'say': '箭头越过“吃”，弯回“他”。'}]},
            {'k': 'mark', 'lv': 1, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '姐姐浓浓地泡了一杯茶。',
             's': ['姐姐', '浓浓', '地', '泡', '了', '一杯', '茶'],
             'm': [{'i': 1, 'role': 'zhuang', 'say': '“浓浓”挨着“泡”，修饰“泡”。'}],
             'arrows': [{'f': 1, 't': 6, 'note': '浓的是“茶”',
                         'say': '箭头向右，越过“泡了一杯”，落到“茶”。'}]}]


def _zhixiang_mark2(it, sc):
    say = sc['say']
    return [{'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '我们都喜欢猫。',
             's': ['我们', '都', '喜欢', '猫'],
             'm': [{'i': 1, 'sym': 'adv', 'say': '“都”是副词。'}],
             'arrows': [{'f': 1, 't': 0, 'note': '指“我们”',
                         'say': '“都”指“我们”：每个人都喜欢。'}]},
            {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '这些书我都看过。',
             's': ['这些', '书', '我', '都', '看过'],
             'm': [{'i': 3, 'sym': 'adv', 'say': '“都”是副词。'}],
             'arrows': [{'f': 3, 't': 0, 'note': '指“这些书”',
                         'say': '“都”指“这些书”：每本都看过。'}]},
            {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '你都买了什么？',
             's': ['你', '都', '买', '了', '什么'],
             'm': [{'i': 1, 'sym': 'adv', 'say': '“都”是副词。'}],
             'arrows': [{'f': 1, 't': 4, 'note': '指“什么”',
                         'say': '“都”指后面的“什么”：要你把买的东西全说出来。'}]}]


def _zhixiang_mark3(it, sc):
    return [{'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '我吃饱了。',
             's': ['我', '吃', '饱', '了'],
             'm': [{'i': 2, 'role': 'bu', 'say': '“饱”是补语。'}],
             'arrows': [{'f': 2, 't': 0, 'note': '说的是“我”',
                         'say': '饱的是“我”。'}]},
            {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '衣服洗干净了。',
             's': ['衣服', '洗', '干净', '了'],
             'm': [{'i': 2, 'role': 'bu', 'say': '“干净”是补语。'}],
             'arrows': [{'f': 2, 't': 0, 'note': '说的是“衣服”',
                         'say': '干净的是“衣服”。'}]},
            {'k': 'mark', 'lv': 2, 'tab': sc['tab'], 'h': sc['tab'],
             'say': '我把作业写完了。',
             's': ['我', '把', '作业', '写', '完', '了'],
             'm': [{'i': 4, 'role': 'bu', 'say': '“完”是补语。'}],
             'arrows': [{'f': 4, 't': 3, 'note': '说的是动作',
                         'say': '“完”说的是“写”这个动作做完了。'}]}]


MANUAL['sx_zhixiang'] = {
    0: _zhixiang_mark1,
    1: _zhixiang_mark2,
    2: _zhixiang_mark3,
    3: vs2({'t': '只吃一个', 's': ['我只吃了一个苹果'], 'k': 0,
            'n': '“只”指“一个”：吃得少', 'say': 0},
           {'t': '只有我吃', 's': ['只有我吃了苹果'], 'k': 0,
            'n': '“只”指“我”：别人都没吃', 'say': 1},
           end='位置一换，指向就换，意思也跟着变。'),
    4: vs2({'t': '车上的是“他”', 's': ['他在车上看书'], 'k': 0,
            'n': '“在车上”指人所在的地方', 'say': 1},
           {'t': '本子上的是画', 's': ['他在本子上画画'], 'k': 0,
            'n': '人并不在本子上', 'say': 2},
           end='能说“把画画在本子上”，不能说“把书看在车上”。'),
}


if __name__ == '__main__':
    main()
