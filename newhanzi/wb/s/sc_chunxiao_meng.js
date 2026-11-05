/* 古诗白板：孟浩然《春晓》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 34；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:春晓|孟浩然', { scenes: [
  { k: 'scroll', tab: '不觉晓',
    beats: [
      { line: '春眠不觉晓', draw: ['sun'], hl: '晓', note: '晓：天亮', noteX: 600, noteY: 300, say: '春天睡着了，连天亮了都不知道。' }
    ] },
  { k: 'scroll', tab: '闻啼鸟', keep: ['sun'],
    beats: [
      { line: '处处闻啼鸟', draw: ['oriole', 'sing'], hl: '闻', note: '闻：听见', noteX: 600, noteY: 400, say: '到处都听得见鸟儿在叫。' }
    ] },
  { k: 'scroll', tab: '夜来风雨', keep: ['sun', 'oriole', 'sing'],
    beats: [
      { line: '夜来风雨声', draw: ['wind', 'rain'], say: '夜里，传来了风声和雨声。' }
    ] },
  { k: 'scroll', tab: '花落', keep: ['sun', 'oriole', 'sing'],
    beats: [
      { line: '花落知多少', draw: ['blossom', 'petals'], say: '花儿被吹落了，不知道落了多少。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['sun', 'oriole', 'sing', 'wind', 'rain', 'blossom', 'petals'],
    lines: ['春眠不觉晓，处处闻啼鸟。', '夜来风雨声，花落知多少。'], linesSay: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    marks: [{ t: '晓', at: 'sun' }, { t: '鸟', at: 'oriole' }, { t: '花', at: 'blossom', say: '天亮、鸟叫、落花——一个春天的早晨，全在这幅画里。' }] }
] });
