/* 古诗白板：张继《枫桥夜泊》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 75；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:枫桥夜泊|张继', { scenes: [
  { k: 'scroll', tab: '月落霜天',
    beats: [
      { line: '月落乌啼霜满天', draw: ['moon', 'moondown', 'crow', 'frost'], hl: '霜', note: '霜：冷天结的白冰晶', noteX: 600, noteY: 300, say: '月亮落下去了，乌鸦在叫，霜盖满了天。' }
    ] },
  { k: 'scroll', tab: '江枫渔火', keep: ['moon', 'moondown', 'crow', 'frost'],
    beats: [
      { line: '江枫渔火对愁眠', draw: ['maple', 'river', 'lamp'], say: '江边的枫树、渔船上的灯火，陪着睡不着的旅人。' }
    ] },
  { k: 'scroll', tab: '寒山寺', keep: ['moon', 'moondown', 'crow', 'frost', 'maple', 'river', 'lamp'],
    beats: [
      { line: '姑苏城外寒山寺', draw: ['temple'], say: '姑苏城外，就是那座寒山寺。' }
    ] },
  { k: 'scroll', tab: '钟声客船', keep: ['moon', 'moondown', 'crow', 'frost', 'maple', 'river', 'lamp', 'temple'],
    beats: [
      { line: '夜半钟声到客船', draw: ['bell', 'boat'], hl: '钟', note: '钟：寺里的大钟', noteX: 600, noteY: 250, say: '半夜里，钟声传到了客船上。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['moon', 'moondown', 'crow', 'frost', 'maple', 'river', 'lamp', 'temple', 'bell', 'boat'],
    lines: ['月落乌啼霜满天，江枫渔火对愁眠。', '姑苏城外寒山寺，夜半钟声到客船。'], linesSay: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。',
    marks: [{ t: '月', at: 'moon' }, { t: '火', at: 'lamp' }, { t: '钟', at: 'bell', say: '月亮、渔火、钟声——枫桥的一个夜晚，全在这幅画里。' }] }
] });
