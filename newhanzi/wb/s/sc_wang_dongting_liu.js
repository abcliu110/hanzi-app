/* 古诗白板：刘禹锡《望洞庭》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 141；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:望洞庭|刘禹锡', { scenes: [
  { k: 'scroll', tab: '湖光秋月',
    beats: [
      { line: '湖光秋月两相和', draw: ['lake', 'moon'], say: '湖水和秋月，互相映衬着。' }
    ] },
  { k: 'scroll', tab: '潭面镜', keep: ['lake', 'moon'],
    beats: [
      { line: '潭面无风镜未磨', draw: ['mirror'], hl: '磨', note: '磨：磨光', noteX: 950, noteY: 250, say: '湖面没有风，像一面还没磨好的镜子。' }
    ] },
  { k: 'scroll', tab: '山水翠', keep: ['lake', 'moon', 'mirror'],
    beats: [
      { line: '遥望洞庭山水翠', draw: ['mtn'], color: { '翠': 'mtn' }, say: '远远望去，洞庭的山水一片翠绿。' }
    ] },
  { k: 'scroll', tab: '白银盘青螺', keep: ['lake', 'moon'],
    beats: [
      { line: '白银盘里一青螺', draw: ['silverplate', 'conch'], color: { '白': 'silverplate', '青': 'conch' }, hl: '螺', note: '螺：像田螺的样子', noteX: 300, noteY: 300, say: '白银盘子里，装着一只小小的青螺。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['lake', 'moon', 'mirror', 'mtn', 'silverplate', 'conch'],
    lines: ['湖光秋月两相和，潭面无风镜未磨。', '遥望洞庭山水翠，白银盘里一青螺。'], linesSay: '湖光秋月两相和，潭面无风镜未磨。遥望洞庭山水翠，白银盘里一青螺。',
    marks: [{ t: '月', at: 'moon' }, { t: '山', at: 'mtn' }, { t: '螺', at: 'conch', say: '湖水、青山、青螺——洞庭的秋色，全在这幅画里。' }] }
] });
