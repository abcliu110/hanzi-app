"""F3 批次2：《夏日绝句》体裁 七绝→五绝（诗库 ticai + 题库 choice）。幂等。
依据：每句 5 字、4 句 = 五言绝句；古诗文网 https://www.gushiwen.cn/shiwenv_e4cd80aceb52.aspx"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_shici_io as io
s = io.load('shici'); n = 0
for p in s['poems']:
    if p['title'] == '夏日绝句' and p.get('ticai') != '五绝':
        p['ticai'] = '五绝'; n += 1
io.dump('shici', s)
q = io.load('quiz')
for it in q['modes']['choice']:
    if it.get('q') == '《夏日绝句》是什么体裁？' and it['a'] != 3:
        assert it['opts'][3] == '五绝'
        it['a'] = 3
        it['exp'] = '《夏日绝句》每句5个字、一共4句，是五言绝句（五绝）。题目里的「绝句」只说明是四句，几言要数每句的字数。'
        it['误解标注'] = [
            {"选项": "A", "选项文本": "七绝", "误解": "没数每句几个字", "正反例": ["生当作人杰：5个字=五言√", "7个字一句才是七绝✗"]},
            {"选项": "B", "选项文本": "七律", "误解": "数不清句数判错体裁", "正反例": ["四句=绝句√", "八句=律诗，别混✗"]},
            {"选项": "C", "选项文本": "宋词", "误解": "看到作者是宋朝人就选宋词", "正反例": ["李清照也写诗，这首每句字数一样√", "词的句子长短不齐✗"]},
        ]
        n += 1
io.dump('quiz', q)
print('changed', n)
