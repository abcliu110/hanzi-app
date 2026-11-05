"""F3 批次4：题库答案/解析与知识矛盾（报告 §4 其余项）+ 意象标签。幂等。
- 鸟鸣涧不是辋川所作（《皇甫岳云溪杂题五首》之一，写友人皇甫岳云溪别墅）：choice#116 解析、stories.王维、shangxi 鸟鸣涧 bg
  依据 https://www.gushiwen.cn/shiwenv_8ec950bd1395.aspx
- 律诗颔联颈联「必须对仗，铁规则」→「一般要求对仗」（崔颢《黄鹤楼》颔联不对仗）；知识卡「七律章法」去掉颔联「对仗」
- 排律「八句以上」→「十句以上」（律诗本身就是八句）
- judge「乐府是唐代的诗歌体裁」=错 不成立 → 换成「乐府原来是汉代的音乐机关」=对
- 婵娟题去掉「美女」选项（婵娟本可指美人）
- 意象 19 个标签改成孩子能懂、互不包含的词；意象题 15 道重配干扰项（同题不出近义标签）
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_shici_io as io
N = [0]
def setv(d, k, v):
    if d.get(k) != v: d[k] = v; N[0] += 1

q = io.load('quiz'); C = q['modes']['choice']; J = q['modes']['judge']
s = io.load('shici'); sx = io.load('shangxi')
def ch(qtext):
    r = [c for c in C if c['q'] == qtext]; return r[0] if r else None
def jd(*qtexts):
    for t in qtexts:
        r = [c for c in J if c['q'] == t]
        if r: return r[0]
    raise SystemExit('judge not found ' + qtexts[0])

# 鸟鸣涧 / 辋川
c = ch('王维在蓝田买下了什么？')
setv(c, 'exp', '王维在蓝田买下辋川别业，画了《辋川图》，还和朋友裴迪写了《辋川集》，《鹿柴》《竹里馆》就是其中的诗。')
setv(s['stories'], '王维', s['stories']['王维'].replace('《山居秋暝》《鸟鸣涧》都是在那里写成的', '《辋川集》里的《鹿柴》《竹里馆》就写于那里'))
for x in sx:
    if x['t'] == '鸟鸣涧':
        setv(x, 'bg', x['bg'].replace('王维隐居辋川时所作。', '这是王维《皇甫岳云溪杂题五首》中的第一首，写的是友人皇甫岳云溪别墅一带的春夜山景。'))

# 对仗
c = ch('律诗的哪两联必须对仗？') or ch('律诗一般要求哪两联对仗？')
setv(c, 'q', '律诗一般要求哪两联对仗？')
setv(c, 'exp', '律诗中间两联——颔联（三四句）和颈联（五六句）一般要求对仗。这是常规，也有例外，比如崔颢《黄鹤楼》的颔联就不对仗。')
for o in c['误解标注']:
    o['正反例'] = [x.replace('中间两联必须对仗√', '中间两联一般要对仗√') for x in o['正反例']]
j = jd('律诗的颔联和颈联必须对仗。', '律诗的颔联和颈联一般要求对仗。')
setv(j, 'q', '律诗的颔联和颈联一般要求对仗。')
setv(j, 'exp', '对。律诗中间两联（三四句、五六句）一般要对仗；也有少数名篇例外，如崔颢《黄鹤楼》颔联。')
j = jd('律诗的首联和尾联必须对仗。')
setv(j, 'exp', '不对，一般要求对仗的是中间两联：颔联和颈联；首联、尾联可对可不对。')
k = [k for k in s['knowledge'] if k.get('t') == '七律章法'][0]
setv(k, 'd', k['d'].replace('——崔颢《黄鹤楼》（颔联·承，对仗）', '——崔颢《黄鹤楼》（颔联·承，这一联不讲对仗，是名篇里的例外）'))

# 排律
c = ch('排律是什么？')
if c['opts'][3] != '十句以上的加长版律诗':
    c['opts'][3] = '十句以上的加长版律诗'; N[0] += 1
setv(c, 'exp', '排律是加长版律诗：一般十句以上，可以十二句甚至几十句，除首尾两联外，中间各联都要对仗。')
for o in c['误解标注']:
    o['正反例'] = [x.replace('排律八句以上√', '排律十句以上√') for x in o['正反例']]
j = jd('排律是八句以上的律诗。', '排律是十句以上的律诗。')
setv(j, 'q', '排律是十句以上的律诗。')
setv(j, 'exp', '对。律诗是八句，排律是加长版，一般十句以上，中间各联都要对仗。')

# 乐府
j = jd('乐府是唐代的诗歌体裁。', '“乐府”原来是汉代管理音乐、采集民歌的机关。')
setv(j, 'q', '“乐府”原来是汉代管理音乐、采集民歌的机关。')
setv(j, 'a', True)
setv(j, 'exp', '对。汉代设乐府机关，采集民间歌谣配上音乐；后来人们把这类配乐的诗歌也叫乐府，唐代还有「新乐府」。')

# 婵娟
for qt in ('“婵娟”在诗词里通常指什么？', '「但愿人长久，千里共婵娟」中的“婵娟”指什么？'):
    c = ch(qt)
    if '美女' in c['opts']:
        i = c['opts'].index('美女'); c['opts'][i] = '星星'; L = 'ABCD'[i]
        for o in c['误解标注']:
            if o['选项'] == L:
                o['选项文本'] = '星星'; o['误解'] = '夜空里的东西乱套'; o['正反例'] = ['满天星斗才说星√', '千里共婵娟是共赏明月✗']
        N[0] += 1
c = ch('“婵娟”在诗词里通常指什么？')
setv(c, 'exp', '苏轼「但愿人长久，千里共婵娟」——婵娟本来形容姿态美好，诗词里常用来指月亮。')

# 意象标签
NEW = {'月': '思乡', '柳': '送别', '雁': '盼家书', '雨': '喜雨·愁雨', '酒': '豪情', '剑': '报国', '竹': '气节',
       '燕': '时光流转', '花': '美好易逝', '菊': '隐逸高洁', '梅': '坚贞', '雪': '纯洁孤寂', '烛': '相思',
       '梦': '思念·如梦', '海': '开阔胸怀', '霜': '秋深', '春': '生机希望', '秋': '悲凉伤感', '鸟': '报春·自由'}
CONFLICT = [{'烛', '梦', '月'}, {'燕', '鸟', '春'}, {'月', '雁'}, {'秋', '霜'}, {'竹', '梅', '菊'}, {'花', '春'}]
def clash(a, b): return a == b or any(a in g and b in g for g in CONFLICT)
old2zi = {}
for im in s['imagery']:
    old2zi[im['mean']] = im['zi']; old2zi[NEW[im['zi']]] = im['zi']
    setv(im, 'mean', NEW[im['zi']])
    if im['zi'] == '柳':
        setv(im, 'line', '客舍青青柳色新。')
        if 28 not in im['poems']: im['poems'] = [28] + im['poems']; N[0] += 1
order = [im['zi'] for im in s['imagery']]
for c in C:
    if not c['q'].startswith('诗里写到“') or not c['q'].endswith('诗人多半在表达什么？'): continue
    zi = c['q'][5]; ans = NEW[zi]
    src = [old2zi.get(o, o) for o in c['opts']]
    a = c['a']; src[a] = zi
    used = set([zi])
    for i in range(4):
        if i == a: continue
        z = src[i]
        if z not in NEW or clash(z, zi) or any(clash(z, u) for u in used if u != zi):
            z = next(x for x in order if not clash(x, zi) and all(not clash(x, u) for u in used))
        src[i] = z; used.add(z)
    opts = [NEW[z] for z in src]
    if opts != c['opts']:
        c['opts'] = opts; N[0] += 1
    c['误解标注'] = [{'选项': 'ABCD'[i], '选项文本': opts[i], '误解': '把「%s」的意思套到「%s」上' % (src[i], zi),
                    '正反例': ['%s多写%s√' % (src[i], opts[i]), '%s多写%s✗' % (zi, ans)]} for i in range(4) if i != a]
for m in q['modes'].get('match', []):
    if m.get('pairs') and all(len(pp) == 2 and pp[0] in NEW for pp in m['pairs']):
        new = [[pp[0], NEW[pp[0]]] for pp in m['pairs']]
        if new != m['pairs']: m['pairs'] = new; N[0] += 1
io.dump('quiz', q); io.dump('shici', s); io.dump('shangxi', sx)
print('changed', N[0])
