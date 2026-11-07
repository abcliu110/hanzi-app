/* 古诗白板：杜牧《山行》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 48；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:山行|杜牧', { scenes: [
  { k: 'scroll', tab: '寒山石径',
    beats: [
      { line: '远上寒山石径斜', draw: ['mtn', 'stonepath'], say: '沿着弯弯的小石路，一直往寒冷的山上走。' }
    ] },
  { k: 'scroll', tab: '白云人家', keep: ['mtn', 'stonepath'],
    beats: [
      { line: '白云生处有人家', draw: ['cloud', 'house'], color: { '白': 'cloud' }, say: '白云飘出来的地方，住着几户人家。' }
    ] },
  { k: 'scroll', tab: '枫林晚', keep: ['mtn', 'stonepath', { o: 'cloud', fill: '白' }, 'house'],
    beats: [
      { line: '停车坐爱枫林晚', draw: ['maple'], say: '车停下来了，只因为爱这傍晚的枫林。' }
    ] },
  { k: 'scroll', tab: '霜叶红', keep: ['mtn', 'stonepath', { o: 'cloud', fill: '白' }, 'house', 'maple'],
    beats: [
      { line: '霜叶红于二月花', draw: ['mapleleaf', 'blossom'], hl: '霜', note: '霜：冷天结的白冰晶', noteX: 600, noteY: 300, say: '被霜打过的枫叶，比二月的花还要红。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['mtn', 'stonepath', { o: 'cloud', fill: '白' }, 'house', 'maple', 'mapleleaf', 'blossom'],
    lines: ['远上寒山石径斜，白云生处有人家。', '停车坐爱枫林晚，霜叶红于二月花。'], linesSay: '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。',
    marks: [{ t: '山', at: 'mtn' }, { t: '云', at: 'cloud' }, { t: '枫', at: 'maple', say: '山路、白云、枫林——秋天的山，全在这幅画里。' }] }
] });
