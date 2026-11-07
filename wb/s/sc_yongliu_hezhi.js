/* 古诗白板：贺知章《咏柳》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 41；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:咏柳|贺知章', { scenes: [
  { k: 'scroll', tab: '一树高',
    beats: [
      { line: '碧玉妆成一树高', draw: ['willow'], say: '柳树像用碧玉妆扮成的一样，长得高高的。' }
    ] },
  { k: 'scroll', tab: '绿丝绦', keep: ['willow'],
    beats: [
      { line: '万条垂下绿丝绦', draw: ['ribbon'], color: { '绿': 'ribbon' }, say: '千万条柳丝垂下来，像绿色的丝带。' }
    ] },
  { k: 'scroll', tab: '谁裁出', keep: ['willow', 'ribbon'],
    beats: [
      { line: '不知细叶谁裁出', draw: ['leaflet'], say: '不知道这些细细的叶子，是谁裁出来的。' },
      { ask: '是谁裁出了细叶？', say: '下一句就告诉你：是二月的春风。' }
    ] },
  { k: 'scroll', tab: '春风剪刀', keep: ['willow', 'ribbon', 'leaflet'],
    beats: [
      { line: '二月春风似剪刀', draw: ['wind', 'scissors'], say: '原来是二月的春风，像一把剪刀裁出了细叶。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['willow', 'ribbon', 'leaflet', 'wind', 'scissors'],
    lines: ['碧玉妆成一树高，万条垂下绿丝绦。', '不知细叶谁裁出，二月春风似剪刀。'], linesSay: '碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出，二月春风似剪刀。',
    marks: [{ t: '柳', at: 'willow' }, { t: '叶', at: 'leaflet' }, { t: '剪', at: 'scissors', say: '柳树、细叶、剪刀——春风裁出的柳，全在这幅画里。' }] }
] });
