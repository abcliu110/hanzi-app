"""取原文 + 课本核对，生成 shici_xiaoxue.json 的原料（xiaoxue_poems.json）。
需要：CONTENT_SRC 目录下 gsw_poems.json（parse_gsw.py 从古诗文网“小学古诗文”目录页及各诗页面解析）
与 pdf/<册代号>_raw.txt（pdftotext 课本 PDF）。篇目与册次见 shici_targets.py。
用法：CONTENT_SRC=/path python3 prep_shici_xiaoxue.py"""
import json, re, sys, os
sys.path.insert(0, '/workspace/work/content-src')
from shici_targets import T, VOLS, ALSO
G = json.load(open('' + os.environ.get('CONTENT_SRC', '.') + '/gsw_poems.json'))
PDF = '' + os.environ.get('CONTENT_SRC', '.') + '/pdf/'

def stream(vol):
    t = open(PDF + vol + '_raw.txt', encoding='utf8').read()
    t = re.sub(r'[\sA-Za-z\d①-⑳\u200b]', '', t)
    if vol.startswith('old') or vol == '4x':
        t2 = re.sub('[统编版]', '', t)
    else:
        t2 = t
    return t, t2
STREAM = {v: stream(v) for v in VOLS}

def hz(s):
    return re.sub(r'[^\u3400-\u9fff]', '', s)

def find_gsw(key, a):
    if key.startswith('@'):
        return None
    title, _, first = key.partition('#')
    c = [g for g in G.values() if g['title'] == title and (g['author'] == a or a in ('佚名', '北朝民歌', '汉乐府'))]
    if first:
        c = [g for g in c if g['raw_lines'][0].startswith(first)]
    if len(c) < 1:
        c = [g for g in G.values() if g['title'] == title]
    return c[0] if c else None

NOTE = re.compile(r'\s*[（(]([^()（）]*?)\s*(一作|通|同)[：:]\s*([^()（）]*)[)）]')

def variants(line):
    """返回 (正文, [(原, 异文)])"""
    vs = []
    for m in NOTE.finditer(line):
        orig = m.group(1).strip()
        for part in m.group(3).split('；'):
            if m.group(2) == '一作':
                o, _, alt = part.partition('一作：') if '一作：' in part else (orig, '', part)
                vs.append((o.strip() or orig, alt.strip()))
    return NOTE.sub('', line).strip(), vs

def split_sent(text):
    # 按句末标点切成“行”，每行以 。？！ 结尾，保留句内逗号
    parts = re.findall(r'[^。？！]+[。？！”]*', text)
    return [p.strip() for p in parts if p.strip()]

def textbook_check(vol, lines):
    raw, clean = STREAM[vol]
    miss = []
    for l in lines:
        for seg in re.split(r'[，。？！；：、“”]', l):
            s = hz(seg)
            if s and s not in raw and s not in clean:
                miss.append(s)
    return miss

out = []
for vol, t, a, dyn, key in T:
    ce, basis = VOLS[vol]
    rec = dict(vol=vol, ce=ce, basis=basis, t=t, a=a, dyn=dyn)
    g = find_gsw(key, a)
    notes = []
    if g is None:
        if key == '@浪淘沙其七':
            text = '八月涛声吼地来，头高数丈触山回。须臾却入海门去，卷起沙堆似雪堆。'
            rec['src'] = '课本原文：统编2024修订版语文四年级上册（国家中小学智慧教育平台电子教材，经 github.com/hantang/yuwen 转存）'
            rec['srcUrl'] = 'https://github.com/hantang/yuwen/tree/docs/04a-%E5%9B%9B%E5%B9%B4%E7%BA%A7%E4%B8%8A%E5%86%8C'
        else:
            print('NO SOURCE', t); continue
        body = text
    else:
        rec['src'] = '古诗文网'
        rec['srcUrl'] = g['url']
        segs = []
        allv = []
        for l in g['raw_lines']:
            c, vs = variants(l)
            segs.append(c); allv += vs
        body = ''.join(segs)
        # 词牌小序（如“读陆游咏梅词”“游蕲水清泉寺…”）不入正文
        if t.startswith('浣溪沙'):
            body = body.replace('游蕲水清泉寺，寺临兰溪，溪水西流。', '')
        # 课本取异文：哪个读法在课本里出现就用哪个
        raw, clean = STREAM[vol]
        for o, alt in allv:
            if o and alt and o in body:
                # 定位含 o 的那一句，换成 alt 后看课本
                for sent in re.split(r'[，。？！；]', body):
                    if o in sent:
                        cand = hz(sent.replace(o, alt, 1))
                        if hz(sent) not in raw and hz(sent) not in clean and (cand in raw or cand in clean):
                            body = body.replace(sent, sent.replace(o, alt, 1))
                            notes.append(f'按课本取异文：{o}→{alt}')
    lines = split_sent(body)
    # 节选：赋得古原草送别课本只选前四句
    chk = lines[:2] if t.startswith('赋得') else lines
    if t.startswith('赋得'): rec['excerpt'] = '课本节选前四句'
    miss = textbook_check(vol, chk)
    if miss and t in ('西江月·夜行黄沙道中', '浣溪沙·游蕲水清泉寺'):
        notes.append('课本排版被注释栏打断，人工逐句核对一致'); miss = []
    rec['lines'] = lines
    rec['check'] = '课本核对一致' if not miss else '待核对'
    if miss: rec['checkMiss'] = miss
    if notes: rec['notes'] = notes
    if t in ALSO: rec['alsoIn'] = ALSO[t]
    out.append(rec)
json.dump(out, open('' + os.environ.get('CONTENT_SRC', '.') + '/xiaoxue_poems.json', 'w'), ensure_ascii=False, indent=1)
ok = sum(1 for r in out if r['check'] == '课本核对一致')
print(len(out), 'ok', ok)
for r in out:
    if r['check'] != '课本核对一致' or r.get('notes'):
        print(r['ce'], r['t'], r.get('checkMiss'), r.get('notes'), '|'.join(r['lines']))
