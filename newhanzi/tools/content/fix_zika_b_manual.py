"""zika-b 人工逐字修复（第 1751–3500 字）。每个函数改一张卡；重复运行无副作用。
依据见 docs/xiufu/shencha-2026-11-05/fix-zika-b.md。用法：python3 tools/content/fix_zika_b_manual.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import fix_zika_b_lib as L

FIX = {}
def fix(z):
    def deco(f): FIX[z] = f; return f
    return deco

def Y(d): return d['dim']['运用链']

# ---- 读音 / 例词硬错 ----
@fix('葛')
def _(d):  # 《现代汉语词典》：葛 gě 姓；复姓诸葛 Zhūgě
    for s in Y(d):
        if s['义项'].startswith('姓氏'):
            s['义项'] = '姓氏（gě），也用在复姓“诸葛”里'
            s['词'] = ['诸葛（gě）', '葛（gě）姓', '诸葛亮']
    d['dim']['易错提示'] = ['多音字：葛藤、瓜葛读 gé；姓氏“葛”和复姓“诸葛”读 gě。']

@fix('暴')
def _(d):  # 《现代汉语词典》：暴晒 bàoshài、暴露 bàolù；pù 只用于“一暴十寒”（同“曝”）
    y = Y(d)
    y[0]['义项'] = '晒（读 pù，今天只用在“一暴十寒”里）'
    y[0]['词'] = ['一暴十寒']
    if '暴晒' not in y[2]['词']: y[2]['词'] = ['暴雨', '暴涨', '暴晒']
    d['dim']['易错提示'] = ['多数读 bào（暴雨、暴晒、暴露）；只有“一暴十寒”读 pù。']

@fix('酥')
def _(d):  # “耶酥”是“耶稣”的错字，删；义项据《现代汉语词典》“酥”②③
    s = Y(d)[0]
    s['义项'] = '松脆，一咬就碎；也指用油和面做成的松脆点心'
    s['类型'] = '本义'
    s['词'] = ['酥脆', '酥松', '奶酥', '酥油']

@fix('澄')
def _(d):  # “澄清”已在 chéng 义项；dèng 格只留不会混的词
    for s in Y(d):
        if s['义项'].startswith('dèng'):
            s['词'] = ['澄沙', '澄一澄']

# ---- 占位语收尾（脚本 fix_zika_b_placeholder.py 处理不了的） ----
@fix('寅')
def _(d):
    s = Y(d)[0]
    if '待查' in s['义项']:
        s['义项'] = '古文字字形像一支箭（一种说法），本义今已不明'
        s['词'] = []

@fix('着')
def _(d):  # 本义格只有“本义待查”，无词无句 → 删除该格（“着”是“著”的俗写，见易错/说文原字头）
    y = Y(d)
    if y and '待查' in (y[0]['义项'] or ''): y.pop(0)

@fix('嫩')
def _(d):
    pd = d['dim'].get('形声拆解') or {}
    if pd.get('sound') == '敕': pd['sound'] = ''

def main(only=None):
    ch = 0
    for z, f in FIX.items():
        if only and z not in only: continue
        d = L.load(z); f(d)
        if L.save(z, d): ch += 1; print('改', z)
    print('共改', ch)

if __name__ == '__main__':
    main(set(sys.argv[1:]) or None)
