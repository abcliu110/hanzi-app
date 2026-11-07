#!/usr/bin/env python3
"""MAIN 收尾轮 · 逻辑 v2 遗留 3 处句子瑕疵（2026-11-07）。幂等：每处同时认「原值」和「目标值」，二次运行 0 改动。

逻辑 v2 纠错（fix_logic_v2_fixes.py，FIXES_REPORT.md）落地后仍留下 3 处与已定口径不一致的句子：

G1 同一律示范「咖啡一会儿变茶」（F11 遗留）
   F11 已把 choice「这杯咖啡不能一会儿变茶」改成「讨论“咖啡好不好喝”时，不能说着说着把奶茶也算进来」，
   理由（w6.json 四大逻辑规律 fix[3]）：同一律管的是思想里的概念和论题保持同一，不是“实物不能变”。
   FIXES_REPORT F11 注明 spot「这杯咖啡一会儿是咖啡，一会儿是茶」不在当时范围、未动；
   data.js 四大逻辑规律「动画」第 1 步词块「这杯/咖啡/不能/一会儿变茶」同病。
   → spot 题句与 fix、动画词块改用 F11 的新示范句（只换说法，题型、选项、答案不变）。

G2 公鸡打鸣：干扰项注释与 F67/F68 部分矛盾
   F67/F68 依据 Shimmura & Yoshimura 2013（Current Biology 23(6):R231，名古屋大学）：公鸡在天亮前 2–3 小时
   就开始打鸣，由体内生物钟控制；光、别的公鸡叫等外部刺激也能引起打鸣，但打鸣主要由生物钟定时。
   F67 去掉了“还颠倒了”（暗示天亮让公鸡叫）。但强加因果仍有三处说“反过来是天快亮的光线让公鸡叫”：
     · quiz choice「公鸡一叫，太阳就升起来。」误解标注 D（“也可能反过来：天快亮的光线让公鸡叫”）
     · 同题误解标注 C 的正反例「天亮可能是原因之一√」
     · data.js 强加因果 例句解析「公鸡一叫太阳就升起…」析末句（“说不定恰恰相反，是天快亮的光线让公鸡叫起来的”）
       —— 逻辑一分钟题池由此逐字生成，改后要重跑 newhanzi/tools/content/build_logic_daily.js。
   → 改成与 F67/F68 同一口径（生物钟、天亮前就叫、常一起出现≠因果）。

G3 强加因果 例子「早上没吃鸡蛋，所以没考好（毫无关联）」
   与本专题已定口径矛盾：F23/F24（w6.json 强加因果 fix）指出“饿着肚子影响考试状态有讲得通的因果链”，
   spot 题 fix 已改为“可能有一点影响，但不是唯一原因”；本专题深讲（思方网《因果关系1》出处）也说
   “饿着肚子确实可能没精神，只是不能说它是唯一原因”。“毫无关联”说过头。
   → 括注改为与深讲一致的说法；句子仍作错例（把没考好全推给一个鸡蛋）。

用法：python3 tools/content/fix_main_luoji_v2b.py [--check]
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
YW = os.path.join(ROOT, 'newhanzi/yuwen/data.js')
QZ = os.path.join(ROOT, 'newhanzi/quiz/data_logic.js')
YP = 'window.NHZ_YUWEN ='
QP = 'window.NHZ_QUIZ ='


def load_js(path, prefix):
    s = open(path, encoding='utf-8').read()
    assert s.startswith(prefix), path
    return s, json.loads(s[len(prefix):].strip().rstrip(';'))


def dump(prefix, obj):
    return prefix + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';\n'


LOG = []


def rec(tag, status, desc):
    LOG.append((tag, status, desc))


def swap(tag, obj, key, old, new, desc):
    """obj[key]：old→new；已是 new 记 already；都不是记 missing。"""
    cur = obj.get(key)
    if cur == new:
        return rec(tag, 'already', desc)
    if cur != old:
        return rec(tag, 'missing', desc + ' 原值对不上：' + json.dumps(cur, ensure_ascii=False)[:60])
    obj[key] = new
    rec(tag, 'applied', desc)


# ---------- G1 ----------
G1_OLD_S = '这杯咖啡一会儿是咖啡，一会儿是茶。'
G1_NEW_S = '大家在讨论“咖啡好不好喝”，他说着说着把奶茶也算了进来。'
G1_OLD_FIX = '概念要确定，前后一致'
G1_NEW_FIX = '讨论“咖啡好不好喝”，就一直说咖啡：说话前后概念要一致'
G1_OLD_TOK = ['这杯', '咖啡', '不能', '一会儿变茶']
G1_NEW_TOK = ['讨论', '咖啡', '不能', '扯进奶茶']

# ---------- G2 ----------
G2_Q = '公鸡一叫，太阳就升起来。下面说法正确的是？'
G2_C_OLD = {'误解': '说“唯一”太绝对，公鸡打鸣还有别的原因', '正反例': ['天亮可能是原因之一√', '天亮是唯一原因✗']}
G2_C_NEW = {'误解': '说“唯一”太绝对，公鸡打鸣还有别的原因：它靠体内生物钟，天亮前就开始叫', '正反例': ['生物钟让公鸡天亮前就叫√', '天亮是唯一原因✗']}
G2_D_OLD = {'误解': '也可能反过来：天快亮的光线让公鸡叫', '正反例': ['光线可能促使公鸡叫√', '两件事绝对无关✗']}
G2_D_NEW = {'误解': '两件事确实常一起出现（有联系），只是不是谁导致谁：天亮是地球自转造成的，公鸡靠生物钟在天亮前就开始叫',
            '正反例': ['常一起出现≠有因果√', '两件事绝对无关✗']}
G2_JU = '错：公鸡一叫太阳就升起，所以太阳是公鸡叫出来的'
G2_XI_OLD = '公鸡叫在前、太阳升在后，只过了“先后”这一关。换一换就知道：公鸡不叫，太阳照样升起。说不定恰恰相反，是天快亮的光线让公鸡叫起来的。'
G2_XI_NEW = '公鸡叫在前、太阳升在后，只过了“先后”这一关。换一换就知道：公鸡不叫，太阳照样升起。其实公鸡是靠体内的生物钟，在天亮前就开始叫；天亮是因为地球自转。'

# ---------- G3 ----------
G3_OLD = '错：早上没吃鸡蛋，所以没考好（毫无关联）'
G3_NEW = '错：早上没吃鸡蛋，所以没考好（饿着肚子可能没精神，但一个鸡蛋推不出考试成绩，不能说它是唯一原因）'


def run(yw, qz):
    items = {i['name']: i for c in yw['logic']['categories'] for i in c['items']}

    # G1 spot
    hits = [q for q in qz['modes'].get('spot', []) if q.get('s') in (G1_OLD_S, G1_NEW_S) and q.get('point') == '四大逻辑规律']
    if len(hits) != 1:
        rec('G1', 'missing', 'spot 咖啡题 命中 %d' % len(hits))
    else:
        q = hits[0]
        swap('G1', q, 's', G1_OLD_S, G1_NEW_S, 'quiz spot 咖啡 句子')
        swap('G1', q, 'fix', G1_OLD_FIX, G1_NEW_FIX, 'quiz spot 咖啡 fix')
    steps = (items['四大逻辑规律'].get('动画') or {}).get('steps') or []
    st = [s for s in steps if s.get('tokens') in (G1_OLD_TOK, G1_NEW_TOK)]
    if len(st) != 1:
        rec('G1', 'missing', '四大逻辑规律.动画 咖啡词块 命中 %d' % len(st))
    else:
        swap('G1', st[0], 'tokens', G1_OLD_TOK, G1_NEW_TOK, '四大逻辑规律.动画 第 1 步词块')

    # G2 quiz 误解标注 C / D
    hits = [q for q in qz['modes'].get('choice', []) if q.get('q') == G2_Q]
    if len(hits) != 1:
        rec('G2', 'missing', 'choice 公鸡一叫 命中 %d' % len(hits))
    else:
        for m in hits[0].get('误解标注') or []:
            for letter, old, new in (('C', G2_C_OLD, G2_C_NEW), ('D', G2_D_OLD, G2_D_NEW)):
                if m.get('选项') != letter:
                    continue
                for k in ('误解', '正反例'):
                    swap('G2', m, k, old[k], new[k], 'quiz choice 公鸡一叫 误解标注 %s.%s' % (letter, k))
    jx = [e for e in items['强加因果'].get('例句解析') or [] if e.get('句') == G2_JU]
    if len(jx) != 1:
        rec('G2', 'missing', '强加因果.例句解析 公鸡 命中 %d' % len(jx))
    else:
        swap('G2', jx[0], '析', G2_XI_OLD, G2_XI_NEW, '强加因果.例句解析 公鸡 析')

    # G3
    arr = items['强加因果'].get('例子') or []
    if G3_NEW in arr and G3_OLD not in arr:
        rec('G3', 'already', '强加因果.例子 没吃鸡蛋')
    elif G3_OLD in arr:
        arr[arr.index(G3_OLD)] = G3_NEW
        rec('G3', 'applied', '强加因果.例子 没吃鸡蛋')
    else:
        rec('G3', 'missing', '强加因果.例子 没吃鸡蛋 找不到')


def main():
    check = '--check' in sys.argv
    ys, yw = load_js(YW, YP)
    qs, qz = load_js(QZ, QP)
    assert dump(YP, yw) == ys and dump(QP, qz) == qs, '序列化与仓库格式不一致，先查再改'
    run(yw, qz)
    for t, st, d in LOG:
        print(t, st, d)
    applied = sum(1 for x in LOG if x[1] == 'applied')
    missing = sum(1 for x in LOG if x[1] == 'missing')
    print('applied=%d already=%d missing=%d' % (applied, sum(1 for x in LOG if x[1] == 'already'), missing))
    if check:
        sys.exit(1 if applied or missing else 0)
    if applied:
        open(YW, 'w', encoding='utf-8').write(dump(YP, yw))
        open(QZ, 'w', encoding='utf-8').write(dump(QP, qz))
    sys.exit(1 if missing else 0)


if __name__ == '__main__':
    main()
