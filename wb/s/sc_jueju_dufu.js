/* 古诗白板：杜甫《绝句》（两个黄鹂鸣翠柳）「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 136；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:绝句（两个黄鹂鸣翠柳）|杜甫', { scenes: [
  { k: 'scroll', tab: '看窗外',
    beats: [ { draw: ['window'], say: '杜甫推开窗，他看见了什么？' } ] },
  { k: 'scroll', tab: '近·黄鹂', keep: ['window'],
    beats: [
      { line: '两个黄鹂鸣翠柳', draw: ['willow', 'oriole'], color: { '黄': 'oriole', '翠': 'willow' }, say: '两个黄鹂，在翠绿的柳树上唱歌。' },
      { draw: ['sing'], say: '鸣，是叫，是唱——你听到了吗？' }
    ] },
  { k: 'scroll', tab: '远·白鹭', keep: ['window', { o: 'willow', fill: '翠' }, { o: 'oriole', fill: '黄' }],
    beats: [
      { line: '一行白鹭上青天', draw: ['sky', 'egret'], color: { '青': 'sky', '白': 'egret' }, say: '一行白鹭，排着队飞上蓝天。' },
      { ask: '这两句哪里一样多？', cmp: '数量词：两个 / 一行　　颜色：黄、翠 / 白、青', say: '一句写近处，一句写远处；数量词、颜色字，两句一样多。' }
    ] },
  { k: 'scroll', tab: '窗·雪山', keep: ['window', { o: 'willow', fill: '翠' }, { o: 'oriole', fill: '黄' }, { o: 'sky', fill: '青' }, 'egret'],
    beats: [
      { line: '窗含西岭千秋雪', draw: ['snowpeak'], hl: '含', say: '窗含西岭千秋雪——窗户像画框，框住了雪山。' },
      { note: '千秋：很多很多年', noteX: 610, noteY: 460, say: '山上的雪，千年都不化。' }
    ] },
  { k: 'scroll', tab: '门·船', keep: ['window', { o: 'willow', fill: '翠' }, { o: 'oriole', fill: '黄' }, { o: 'sky', fill: '青' }, 'egret', 'snowpeak'],
    beats: [
      { line: '门泊东吴万里船', draw: ['door', 'boat'], hl: '泊', note: '泊：停船', noteX: 875, noteY: 170, say: '门泊东吴万里船——门口停着要去东吴的船。' },
      { draw: ['far'], say: '这船，要走一万里的路。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['window', { o: 'willow', fill: '翠' }, { o: 'oriole', fill: '黄' }, { o: 'sky', fill: '青' }, 'egret', 'snowpeak', 'door', 'boat', 'far'],
    lines: ['两个黄鹂鸣翠柳，一行白鹭上青天。', '窗含西岭千秋雪，门泊东吴万里船。'], linesSay: '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。',
    marks: [{ t: '近', at: 'willow' }, { t: '远', at: 'egret' }, { t: '久', at: 'snowpeak' }, { t: '长', at: 'boat', say: '近处、远处，千秋、万里——一扇窗装下了这么多。' }] }
] });
