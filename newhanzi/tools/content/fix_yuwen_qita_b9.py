#!/usr/bin/env python3
"""Y 语法：批 9 说法题干扰项说明补回（2026-11-08 负责人拍板「语法题库干扰项说明按批 9–13 口径补回，只追加「其余：…」，不删现有」）。幂等。

背景：批 9（dceb3a65，fix_yuwen_b9_shuofa.py）给 5725 道「下面说法正确的是？」说法题逐个写了错项错因
（「对的是：…其他三个不对：错项1——理由1；错项2——理由2；错项3——理由3。」）。2026-11-06 guoyun_liu 的
「题库重写」系列把其中一部分题的解析改成只讲答案（「其余选项不符合题干要求…」）或给每个错项套同一句话
（「错误：X。。判断时要看主语和谓语的词性、搭配及句子意义。」）。

做法（只追加，不删、不改现有解析）：
  1. 来源只用批 9 提交 dceb3a65 当时的错因（--extract 从 git 历史抽出，存 fix_yuwen_qita_b9.json，随仓库提交）。
  2. 与现题库对题：题干 + 选项集合（去引号/标点后）完全一致、且答案选项一致才算同一题；
     题目或选项已被重写、对不上的跳过并计数。
  3. 现解析已经逐个说明了某个错项（「错误：<该选项>。<具体理由>」，理由不是同一解析里重复 3 次以上的套话），
     该错项不补；全部错项都已说明的题不动。
  4. 其余在现解析末尾追加「其余：错项——理由；错项——理由。」（按现题选项顺序，选项用现题的写法）。
用法：
  python3 fix_yuwen_qita_b9.py            # 写入
  python3 fix_yuwen_qita_b9.py --check    # 只检查，有待改动时退出码 1（二次运行应为 0 改动）
  python3 fix_yuwen_qita_b9.py --extract  # 从 git 历史重新抽取批 9 错因到 JSON（一般不需要）
  python3 fix_yuwen_qita_b9.py --report   # 打印每库统计
"""
import os, re, sys, json, subprocess, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_yuwen_io import load_bank, save_bank, bank_files

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_JSON = os.path.join(HERE, 'fix_yuwen_qita_b9.json')
B9 = 'dceb3a65'
HEAD_MARK = '其他三个不对：'
PAT = re.compile(r'window\.NHZ_GRAMMAR_BANK\[(".*?")\]\s*=\s*(.*);\s*$', re.S)


def N(s):
    return re.sub(r'[「」“”"\'\s。．.，,；;：:！？!?、]', '', str(s))


def key_of(q):
    return N(q['q']) + '\u0001' + '\u0002'.join(sorted(N(o) for o in q.get('options', [])))


# ---------- 抽取批 9 错因 ----------
def _git(*a):
    root = subprocess.run(['git', '-C', HERE, 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
    r = subprocess.run(['git', '-C', root] + list(a), capture_output=True, text=True)
    return r.returncode, r.stdout


def _parse(txt):
    m = PAT.search(txt)
    if m:
        return json.loads(m.group(1)), json.loads(m.group(2))
    m2 = re.match(r'window\.NHZ_GRAMMAR_BANK\s*=\s*(\{.*\});(\s*)$', txt, re.S)
    return next(iter(json.loads(m2.group(1)).items()))


def b9_reasons(q):
    """批 9 解析 → {错项选项原文: 理由}；格式不符返回 None。"""
    e = q['解析']; k = e.find(HEAD_MARK)
    if k < 0: return None
    body = e[k + len(HEAD_MARK):]
    if body.endswith('。'): body = body[:-1]
    wrong = [i for i in range(len(q['options'])) if i != q['answer']]
    out, pos = {}, 0
    for n, i in enumerate(wrong):
        h = q['options'][i].rstrip('。') + '——'
        if not body.startswith(h, pos): return None
        if n + 1 < len(wrong):
            p = body.find('；' + q['options'][wrong[n + 1]].rstrip('。') + '——', pos + len(h))
            if p < 0: return None
            out[q['options'][i]] = body[pos + len(h):p]; pos = p + 1
        else:
            out[q['options'][i]] = body[pos + len(h):]
    return out


def extract():
    rc, names = _git('show', '--name-only', '--format=', B9)
    files = [f for f in names.split() if '/quiz_bank_' in f]
    entries, nb9, bad, stat = {}, 0, 0, {}
    cur = {}
    for fn in bank_files():
        n, dc, _ = load_bank(fn); cur[n] = {}
        for q in dc['questions']: cur[n].setdefault(key_of(q), []).append(q)
    for f in files:
        _, new = _git('show', '%s:%s' % (B9, f)); _, old = _git('show', '%s^:%s' % (B9, f))
        name, d = _parse(new); _, d0 = _parse(old)
        st = stat.setdefault(name, {'b9': 0, 'gone': 0, 'explained': 0})
        for q, q0 in zip(d['questions'], d0['questions']):
            if q.get('解析') == q0.get('解析'): continue
            nb9 += 1; st['b9'] += 1
            if key_of(q) not in cur.get(name, ()):
                st['gone'] += 1; continue   # 题目/选项已被重写，对不上
            r = b9_reasons(q)
            if r is None: bad += 1; continue
            if all(explained(c['解析'], c['options'][i]) for c in cur[name][key_of(q)]
                   for i in range(len(c['options'])) if i != c['answer']):
                st['explained'] += 1; continue   # 现解析已逐项说明，不需要来源
            entries.setdefault(name, {})[key_of(q)] = {
                'answer': N(q['options'][q['answer']]),
                'reasons': {N(o): v for o, v in r.items()}}
    out = {'_src': '批 9 提交 %s（fix_yuwen_b9_shuofa.py）各说法题解析「其他三个不对：」后的逐项错因' % B9,
           '_note': '只存抽取时（2026-11-08 起的现题库）仍能在现题库对上（题干+选项集合一致）、且现解析没逐项说明错项的题；stat.explained = 已逐项说明不需补的批 9 题数；stat.gone = 批 9 题已被重写对不上、跳过的数',
           '_b9_total': nb9, '_parse_fail': bad, 'stat': stat, 'banks': entries}
    with open(SRC_JSON, 'w', encoding='utf-8') as fp:
        json.dump(out, fp, ensure_ascii=False, indent=0, sort_keys=True)
        fp.write('\n')
    print('extract: 批 9 题 %d，对不上跳过 %d，解析失败 %d，写入 %s' % (nb9, sum(v['gone'] for v in stat.values()), bad, SRC_JSON))


# ---------- 判断现解析是否已说明某错项 ----------
SEG = re.compile(r'(正确|错误)：')


def explained(e, opt):
    e = e.split(' 其余：')[0]   # 本脚本追加的部分不算现有说明（保证幂等）
    ms = list(SEG.finditer(e))
    if not ms: return False
    segs = [e[a.end(): b.start() if b else len(e)].strip() for a, b in zip(ms, ms[1:] + [None])]
    tails = []
    for t in segs:
        p = t.find('。'); tails.append(N(t[p + 1:]) if p >= 0 else '')
    cnt = collections.Counter(tails)
    no = N(opt)
    for t, tail in zip(segs, tails):
        if N(t).startswith(no):
            r = N(t)[len(no):]
            return len(r) >= 4 and cnt[tail] < 3
    return False


def addition(q, src):
    """返回要追加的文字（无需追加返回 ''）。"""
    wrong = [i for i in range(len(q['options'])) if i != q['answer']]
    parts = []
    for i in wrong:
        o = q['options'][i]
        if explained(q['解析'], o): continue
        r = src['reasons'].get(N(o))
        if not r: return None
        parts.append(o.rstrip('。') + '——' + r)
    if not parts: return ''
    return '其余：' + '；'.join(parts) + '。'


def run(check=False, report=False):
    J = json.load(open(SRC_JSON, encoding='utf-8')); data = J['banks']
    st = collections.Counter(); per = {}
    for fn in bank_files():
        name, d, _ = load_bank(fn)
        src = data.get(name)
        if not src: continue
        c = collections.Counter(); changed = False
        seen = set()
        for q in d['questions']:
            k = key_of(q); s = src.get(k)
            if not s: continue
            seen.add(k)
            if N(q['options'][q['answer']]) != s['answer']: c['答案不同跳过'] += 1; continue
            add = addition(q, s)
            if add is None: c['选项对不上跳过'] += 1; continue
            if not add: c['已逐项说明'] += 1; continue
            if q['解析'].rstrip().endswith(add): c['已补过'] += 1; continue
            e = q['解析'].rstrip()
            q['解析'] = e + ('' if not e else ' ') + add
            c['补回'] += 1; changed = True
        per[name] = c; st.update(c)
        if changed and not check: save_bank(fn, name, d, recount_total=False)
    if report:
        for n, c in per.items():
            print(n, dict((k, v) for k, v in c.items() if v))
    print('批 9 说法题 %d，题目/选项已被重写对不上跳过 %d' % (J['_b9_total'], sum(v['gone'] for v in J['stat'].values())))
    print('批 9 题现解析已逐项说明 %d（不补）' % sum(v['explained'] for v in J['stat'].values()))
    print('补回 %d，已逐项说明 %d，已补过 %d，答案不同跳过 %d，选项对不上跳过 %d' % (
        st['补回'], st['已逐项说明'], st['已补过'], st['答案不同跳过'], st['选项对不上跳过']))
    if check:
        print('check: 待改动 %d' % st['补回'])
        sys.exit(1 if st['补回'] else 0)


if __name__ == '__main__':
    if '--extract' in sys.argv: extract()
    else: run(check='--check' in sys.argv, report='--report' in sys.argv)
