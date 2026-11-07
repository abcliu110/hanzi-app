/* 古诗白板：李白《望庐山瀑布》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 2；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:望庐山瀑布|李白', { scenes: [
  { k: 'scroll', tab: '日·香炉',
    beats: [
      { line: '日照香炉生紫烟', draw: ['sun', 'peak', 'smoke'], say: '太阳照着香炉峰，山上冒起了紫色的烟。' }
    ] },
  { k: 'scroll', tab: '瀑·前川', keep: ['sun', 'peak', 'smoke'],
    beats: [
      { line: '遥看瀑布挂前川', draw: ['falls', 'river'], hl: '挂', note: '挂：像挂起来一样', noteX: 950, noteY: 300, say: '远远看去，瀑布像挂在山前的小河上。' }
    ] },
  { k: 'scroll', tab: '飞流', keep: ['sun', 'peak', 'smoke', 'falls', 'river'],
    beats: [
      { line: '飞流直下三千尺', draw: ['plunge'], say: '瀑布飞快地直落下来，足足有三千尺那么长。' }
    ] },
  { k: 'scroll', tab: '银河', keep: ['sun', 'peak', 'smoke', 'falls', 'river', 'plunge'],
    beats: [
      { line: '疑是银河落九天', draw: ['galaxy'], hl: '疑', note: '疑：好像', noteX: 950, noteY: 380, say: '真让人怀疑，是天上的银河落到了人间。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['sun', 'peak', 'smoke', 'falls', 'river', 'plunge', 'galaxy'],
    lines: ['日照香炉生紫烟，遥看瀑布挂前川。', '飞流直下三千尺，疑是银河落九天。'], linesSay: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。',
    marks: [{ t: '日', at: 'sun' }, { t: '瀑', at: 'falls' }, { t: '河', at: 'galaxy', say: '太阳、瀑布、银河——庐山的一天，全在这幅画里。' }] }
] });
