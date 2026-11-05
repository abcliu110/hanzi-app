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
    if len(t) > 8:
        warn('vs t 超 8 字：%s' % t)
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
    if base + L_idx < len(say):
        L['say'] = say[base + L_idx]
    if base + R_idx < len(say):
        R['say'] = say[base + R_idx]
    end = None
    if len(say) > base + 2:
        if len(say[base + 2]) <= 36:
            end = say[base + 2]
        else:
            warn('%s vs say[%d] 超 36 字，end 丢弃' % (who, base + 2))
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
                merged[-1]['r'] = merged[-1]['r'] + '改成“' + r['w'] + '”。'
            else:
                merged.append(r)
        rows = merged
    if len(rows) > 4:
        raise ValueError(who + '：行数 %d 超 4，需手工' % len(rows))
    d = {'k': 'test', 'lv': sc['lv'], 'tab': sc['tab'], 'rows': rows}
    if len(rows) <= 3 and sc.get('ask'):
        d['h'] = sc['ask'] if len(sc['ask']) <= 27 else sc['tab']
        rows[0]['q'] = sc['ask']
    elif len(rows) > 3 and sc.get('ask'):
        warn('%s test 4 行，h/ask 丢弃（放不下）：%s' % (who, sc['ask']))
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
    d = {'k': 'review', 'lv': 2, 'tab': sc.get('tab', '判对了吗'),
         'task': sc['task'], 'answer': strip_end(sc['answer']), 'ok': sc['ok']}
    if not sc['ok']:
        d['good'] = strip_end(good)
    if why:
        d['why'] = strip_end(why)
    rule = sc['rule']
    if len(rule) > 36:
        rule = re.split(r'[；;]', rule)[0] + '。'
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


if __name__ == '__main__':
    main()
