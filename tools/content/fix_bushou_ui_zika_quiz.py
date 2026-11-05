"""F6 识字题库修复（2026-11-05 审查 bushou_ui.md 第 19–23 节）。可重复运行：按题干/原文定位，已改过的跳过。
用法：python3 tools/content/fix_bushou_ui_zika_quiz.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_bushou_ui_lib as L
P = 'newhanzi/quiz/data_zika.js'
D, F = L.load(P); M = D['modes']
log = []
def find(mode, key, val):
    for i, q in enumerate(M[mode]):
        if q.get(key) == val: return i, q
    return None, None
def setq(mode, key, val, **kw):
    i, q = find(mode, key, val)
    if q is None: return
    q.update(kw); log.append('%s[%d] %s' % (mode, i, val))

# 19 标准答案错
setq('spot', 's', '他迫不急待地跑了过去。', a=1)
setq('spot', 's', '他按耐不住好奇心，打开了盒子。', a=1)
# 20 多解/无解/矛盾
setq('spot', 's', '我只到他今天不来。', s='我知到他今天不来。', opts=['我', '知', '到', '他'], a=2,
     fix='我知道他今天不来。', exp="'知道'的'道'不能写成'到'；'到'是到达，如'走到'。")
setq('spot', 's', '她是个骄里骄气的女孩。', s='她太骄气了，一点苦都不肯吃。', opts=['太', '骄', '气', '苦'], a=1,
     fix='她太娇气了，一点苦都不肯吃。')
setq('spot', 's', '请把你的问题题出来。', s='请把你的意见题出来。', opts=['意', '见', '题', '出'], a=2,
     fix='请把你的意见提出来。')
setq('spot', 's', '十五的月亮又园又亮。', opts=['五', '月', '园', '亮'], a=2)
i, q = find('choice', 'q', '“日”字加一笔不能变成？')
if q and '田' in q['opts']:
    q['opts'] = ['早' if o == '田' else o for o in q['opts']]
    q['exp'] = '“日”加一笔可变“目、白、由、田”；“早”下面是“十”，要加两笔。'
    for mz in q['误解标注']:
        mz['正反例'] = [x.replace('田', '早') for x in mz['正反例']]
    log.append('choice[%d] 日加一笔' % i)
i, q = find('choice', 'q', '“王”字加一笔可以变成？')
if q and '都对' in q['opts']:
    q['opts'] = ['玉', '全', '皇', '珠']; q['a'] = 0
    q['exp'] = '“王”加一点变“玉”；“全”上面是人字头，要加两笔；“皇、珠”笔画更多。'
    q['误解标注'] = [
        {'选项': 'B', '选项文本': '全', '误解': '形近误判：“全”上面是人字头（撇、捺两笔），不是“王”加一笔。', '正反例': ['王+丶=玉√', '王+一笔=全✗']},
        {'选项': 'C', '选项文本': '皇', '误解': '形近误判：“皇”上面是“白”，比“王”多了5笔。', '正反例': ['王+丶=玉√', '王+一笔=皇✗']},
        {'选项': 'D', '选项文本': '珠', '误解': '形近误判：“珠”是王字旁加“朱”，比“王”多了6笔。', '正反例': ['王+丶=玉√', '王+一笔=珠✗']}]
    log.append('choice[%d] 王加一笔' % i)
i, q = find('choice', 'q', '“休”字的意思和哪两部分有关？')
if q and 'B和C都对' in q['opts']:
    q['opts'] = ['人+木', '日+木', '人+目', '口+木']; q['a'] = 0
    q['exp'] = '“休”=亻（人）+木，人靠着树休息，是会意字。'
    q['误解标注'] = [
        {'选项': 'B', '选项文本': '日+木', '误解': '看错部件：“休”左边是单人旁“亻”（就是人），不是“日”。', '正反例': ['休=亻+木√', '休=日+木✗']},
        {'选项': 'C', '选项文本': '人+目', '误解': '看错部件：“休”右边是“木”，不是“目”。', '正反例': ['休=亻+木√', '休=人+目✗']},
        {'选项': 'D', '选项文本': '口+木', '误解': '看错部件：“口+木”是“呆、杏”，不是“休”。', '正反例': ['休=亻+木√', '休=口+木✗']}]
    log.append('choice[%d] 休' % i)
setq('choice', 'q', '读作“wù”的字，正确的是？', q='读作“wù”、又是天干的字是？')
setq('blank', 's', '他高兴___（de）跳了起来。', s='他跑___（de）满头大汗。',
     exp='动作后面说明程度、结果用“得”，如“跑得满头大汗”；动作前面用“地”，如“高兴地跳”；“我的”用“的”。')
i, q = find('choice', 'q', '“高兴de跳起来”的“de”，正确字形是？')
if q and '得' in q['opts']:
    q['opts'] = ['底' if o == '得' else o for o in q['opts']]
    for mz in q['误解标注']:
        if mz['选项文本'] == '得':
            mz.update({'选项文本': '底', '误解': '形近字混淆：“底(dǐ)”如“底下”，读音、用法都不对；动作“跳”前面用“地”。', '正反例': ['高兴地跳√', '高兴底跳✗']})
    log.append('choice[%d] 高兴de跳' % i)
i, q = find('choice', 'exp', '“地”后跟动作，如“高兴地跳”。')
if q and '高兴得跳' in q['opts']:
    q['opts'] = ['高兴第跳' if o == '高兴得跳' else o for o in q['opts']]
    for mz in q['误解标注']:
        if mz['选项文本'] == '高兴得跳':
            mz.update({'选项文本': '高兴第跳', '误解': '同音字混淆：“第(dì)”如“第一”，表示次序，不能放在动作前面。', '正反例': ['高兴地跳√', '高兴第跳✗']})
    log.append('choice[%d] 高兴地跳' % i)
# 22 解析读音/字形
i, q = find('choice', 'q', '下面说法正确的是？')
for j, q in enumerate(M['choice']):
    if q.get('exp', '').startswith('“未”上短下长'):
        q['exp'] = '“未”上短下长，“末”上长下短；“土/士”也靠横的长短区分；“千/干”看第一笔：千是撇，干是横。'
        for mz in q['误解标注']:
            if mz['选项'] == 'D':
                mz['误解'] = '细节忽视：“千”第一笔是撇，“干”第一笔是横；只看大架子不看第一笔。'
                mz['正反例'] = ['千/干看第一笔区分√', '千=干✗']
        log.append('choice[%d] 千干' % j)
for j, q in enumerate(M['choice']):
    for mz in q.get('误解标注', []):
        if '“迟到”的“迟”读chī' in mz.get('误解', ''):
            mz['误解'] = '音近字混淆：“迟到”的“迟”读chí（二声），不是chī；“迟”表时间晚，和“吃饭”这个动作无关。'
            log.append('choice[%d] 迟' % j)
i, q = find('choice', 'q', '“yǐ经”的“yǐ”，正确字形是？')
if q:
    q['exp'] = '“已经”用半开口的“已（yǐ）”；“己”全开口（自己），“巳”全封口（巳时）；“以”也读yǐ，用在“可以、以后”。'
    for mz in q['误解标注']:
        if mz['选项文本'] == '己': mz.update({'误解': '形近字混淆：“己”全开口，是“自己”的“己”。', '正反例': ['已经√', '己经✗']})
        if mz['选项文本'] == '巳': mz.update({'误解': '形近字混淆：“巳”全封口，是“巳时”的“巳”。', '正反例': ['已经√', '巳经✗']})
        if mz['选项文本'] == '以': mz.update({'误解': '同音字混淆：“以”也读yǐ，用在“可以、以后”，不能写“以经”。', '正反例': ['已经√', '以经✗']})
    log.append('choice[%d] 已' % i)
setq('choice', 'q', '“shuǐ果”的“shuǐ”，正确字形是？', exp='“水果”用“水（shuǐ，三声）”；“睡、税”读shuì（四声），“说”读shuō。')
i, q = find('choice', 'q', '“头发”的“发”，正确拼音是？')
if q:
    q['exp'] = '“头发”的“发”读fà（口语里常读轻声）；“发芽”读fā。'
    for mz in q['误解标注']:
        mz['正反例'] = [x.replace('tóufa√', 'tóufà√') for x in mz['正反例']]
    log.append('choice[%d] 头发' % i)
setq('judge', 'q', '“头发”的“发”读 fà。', exp='“头发”的“发”读fà（口语里常读轻声）；“发芽”读fā。')
i, q = find('choice', 'q', '“zuò业”的“zuò”，正确字形是？')
if q:
    # 原题错：“作业”本身用“作”。改成问“zuò作业”的动词。
    q['q'] = '“zuò作业”的第一个“zuò”，正确字形是？'
    q['exp'] = '动手去做的事用“做”：做作业、做饭；“作业、作品”这类名词里用“作”。'
    for mz in q['误解标注']:
        if mz['选项文本'] == '作': mz['误解'] = '以为做和作可互换：名词“作业”里是“作”，但前面表示“动手去做”的动词要用“做”。'
        if mz['选项文本'] == '座': mz.update({'误解': '同音字混淆：“座”是座位、一座山，不是动作。', '正反例': ['做作业√', '座作业✗']})
        if mz['选项文本'] == '坐': mz.update({'误解': '同音字混淆：“坐”是坐下，不是“做事”的做。', '正反例': ['做作业√', '坐作业✗']})
    log.append('choice[%d] 做作业' % i)
setq('blank', 's', '妈妈___（zuò）了好多好吃的。', exp='动手去做的事用“做”：做饭、做事；“作业、作品”这类名词里用“作”。')
for j, q in enumerate(M['choice']):
    if q.get('exp') == '“做作业”用“做”；单用“作业”一词时用“作”。':
        q['exp'] = '“做作业”：动词用“做”，名词“作业”里用“作”。'
        for mz in q['误解标注']:
            if mz['选项文本'] == '坐作业': mz['误解'] = '同音字混淆：“坐”是坐下，不是“做事”的做。'
            if mz['选项文本'] == '座作业': mz['误解'] = '同音字混淆：“座”是座位，不是动作。'
        log.append('choice[%d] 做作业2' % j)

# 21 答案位置重排：choice 题按下标 i%4 定目标位置，确定性、可复查；选项含“都对/B和C”等指位置的不动
import re
POS = re.compile(r'都对|都不对|以上|[A-D]和[A-D]|[A-D]、[A-D]|[A-D]项')
moved = 0
for j, q in enumerate(M['choice']):
    n = len(q['opts'])
    if any(POS.search(str(o)) for o in q['opts']): continue
    tgt = j % n
    if q['a'] == tgt: continue
    perm = list(range(n))  # 新位置 -> 旧下标：交换 a 与 tgt
    perm[tgt], perm[q['a']] = q['a'], tgt
    old = q['opts']; q['opts'] = [old[k] for k in perm]
    inv = {perm[k]: k for k in range(n)}
    for mz in q.get('误解标注', []):
        oi = ord(mz['选项'][0]) - 65
        if 0 <= oi < n: mz['选项'] = chr(65 + inv[oi])
    q['a'] = tgt; moved += 1
log.append('choice 答案位置重排 %d 题' % moved)
L.save(P, D, F)
print('\n'.join(log))
