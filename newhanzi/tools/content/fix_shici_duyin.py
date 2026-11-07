"""古诗文读音核对（2026-11-07，负责人同意：按统编教材 / 人教编者答疑 / 1985《普通话异读词审音表》定读音）。

只改有出处的条目；无出处的只记疑点，不改（疑点见 /workspace/work/duyin-src/gushi_readings.json 与提交说明）。
幂等：再跑一次无变化。--check：只检查，有待改项时退出码 1。

用法：
  python3 newhanzi/tools/content/fix_shici_duyin.py          # 应用
  python3 newhanzi/tools/content/fix_shici_duyin.py --check  # 只检查

依据（教材 PDF 为 hantang/yuwen 收录的统编本，见 content-src/pdf/urls.txt）：
- 春晓「觉」jiào→jué：统编2024修订版一年级下册「日积月累」《春晓》全文注音「不觉 jué 晓」。
- 回乡偶书「衰」cuī→shuāi：人教版2001年二年级上册注 shuāi（新京报 2019-02-20，人民网转载）；
  统编旧版六上「日积月累」收录、未注异读；现汉 cuī 只用于等衰/丧服义；1985 审音表框架下的规范读法（孙玉文，人民日报海外版 2026-09-04）。
- 长歌行「衰」cuī→shuāi：统编旧版六下「日积月累」收录、未注异读；理由同上（押韵读 cuī 属叶音，有争议）。
- 少年中国说「干将」干 gàn→gān：统编2024修订版五上第13课注释「干将，古代宝剑名」；《现代汉语词典》第7版【干将】gānjiāng 古代宝剑名（另见 gànjiàng 能干的人）。
- 塞下曲「骑」补注 qí：1985 审音表「骑 qí（统读）」；统编四下注释「骑，骑兵」，未注 jì。
- 小池「头」tou→tóu（删去 pron，回落查表主音 tóu）：统编2024修订版一年级下册全文注音「立上头 shàng tóu」。
- 闻官军收河南河北「裳」shang→cháng：统编旧版五年级下册课文注音「衣裳 cháng」（另见人教社统编初中答疑「裳」读 cháng）。
- quiz/data_shici.js：「鬓毛衰」题答案改 shuāi，解析改正；「石径斜」题解析里「xié 和人家/花押 ia 韵」「古音 yé」两处不实，改正。
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fix_shici_io as io  # noqa: E402

# (诗题, 字键, 旧值或 None, 新值或 None=删除)
PRON = [
    ('春晓', '觉', 'jiào', 'jué'),
    ('回乡偶书二首·其一', '衰', 'cuī', 'shuāi'),
    ('长歌行', '衰', 'cuī', 'shuāi'),
    ('少年中国说（节选）', '干', 'gàn', 'gān'),
    ('塞下曲', '骑', None, 'qí'),
    ('小池', '头', 'tou', None),
    ('闻官军收河南河北', '裳', 'shang', 'cháng'),
]

Q_SHUAI = {
    "q": "「乡音难改鬓毛衰」中，「衰」读什么音？",
    "opts": ["cuī", "shuāi", "cuí", "suō"],
    "a": 1,
    "exp": "贺知章《回乡偶书》里「衰」按现行规范读 shuāi，指鬓发稀疏、变白（衰老）。旧时为了和「回」「来」押韵有读 cuī 的说法，但 cuī 在今天只用于「等衰」或古代丧服，课本注音也是 shuāi。",
    "误解标注": [
        {"选项": "A", "选项文本": "cuī", "误解": "把旧时为押韵改读的音当成规范读音",
         "正反例": ["旧时有人为了押韵读 cuī√", "按现行规范和课本注音，这里读 shuāi✗"]},
        {"选项": "C", "选项文本": "cuí", "误解": "声调拿不准",
         "正反例": ["「衰」在这里读 shuāi，第一声√", "「衰」没有 cuí 这个读音✗"]},
        {"选项": "D", "选项文本": "suō", "误解": "按字形猜读音",
         "正反例": ["「蓑」读 suō，和「衰」字形相近√", "这首诗里的「衰」读 shuāi✗"]},
    ],
}
XIE_EXP = "杜牧《山行》里「斜」读 xié（统编三年级上册课文注音）。唐代「斜」和「家」「花」同属麻韵，可以押韵；后来有人改读 xiá 来凑韵，那是「叶音」，现行规范读 xié，今天读起来不押韵也没关系。"
XIE_B = {"选项": "B", "选项文本": "yé", "误解": "把地名里的特殊读音搬过来",
         "正反例": ["「斜」只在古道名「褒斜」里读 yé√", "这首诗里读 xié✗"]}


def fix_shici(doc, changes):
    by_title = {}
    for p in doc['poems']:
        by_title.setdefault(p['title'], []).append(p)
    for title, ch, old, new in PRON:
        ps = by_title.get(title, [])
        if len(ps) != 1:
            raise SystemExit(f'诗题不唯一或不存在：{title}（{len(ps)} 首）')
        p = ps[0]
        pron = p.get('pron', {})
        cur = pron.get(ch)
        if cur == new:
            continue
        if cur != old:
            raise SystemExit(f'{title} {ch} 当前 {cur!r}，预期 {old!r}，请人工核对')
        if new is None:
            pron.pop(ch, None)
        else:
            if ch not in ''.join(p['lines']):
                raise SystemExit(f'{title}：{ch} 不在诗句中')
            pron[ch] = new
        if pron:
            p['pron'] = pron
        else:
            p.pop('pron', None)
        changes.append(f'shici {title} {ch}: {old} → {new if new else "（删除，回落查表主音）"}')


def fix_quiz(q, changes):
    items = q['modes']['choice']
    for i, it in enumerate(items):
        if it.get('q') == Q_SHUAI['q']:
            if it != Q_SHUAI:
                items[i] = Q_SHUAI
                changes.append('quiz 鬓毛衰：答案 cuī → shuāi，解析/误解标注改正')
        elif it.get('q') == '「远上寒山石径斜」中，「斜」读什么音？':
            if it.get('exp') != XIE_EXP:
                it['exp'] = XIE_EXP
                changes.append('quiz 石径斜：解析改正（押韵/叶音）')
            m = it.get('误解标注', [])
            for j, e in enumerate(m):
                if e.get('选项') == 'B' and e != XIE_B:
                    m[j] = XIE_B
                    changes.append('quiz 石径斜：B 项误解标注改正')


def main():
    check = '--check' in sys.argv
    changes = []
    doc = io.load('shici')
    fix_shici(doc, changes)
    q = io.load('quiz')
    fix_quiz(q, changes)
    for c in changes:
        print(('待改 ' if check else '改 ') + c)
    if check:
        print('fix_shici_duyin --check:', 'OK（无待改）' if not changes else f'{len(changes)} 处待改')
        return 1 if changes else 0
    if changes:
        io.dump('shici', doc)
        io.dump('quiz', q)
    print('fix_shici_duyin:', f'{len(changes)} 处已改' if changes else '无变化')
    return 0


if __name__ == '__main__':
    sys.exit(main())
