/* 古诗白板：苏轼《惠崇春江晚景》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 147；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:惠崇春江晚景|苏轼', { scenes: [
  { k: 'scroll', tab: '竹外桃花',
    beats: [
      { line: '竹外桃花三两枝', draw: ['bamboo', 'peach'], say: '竹林外面，桃花开了三两枝。' }
    ] },
  { k: 'scroll', tab: '鸭先知', keep: ['bamboo', 'peach'],
    beats: [
      { line: '春江水暖鸭先知', draw: ['river', 'duck'], hl: '暖', note: '暖：水变暖了', noteX: 600, noteY: 300, say: '春天的江水变暖了，鸭子最先知道。' }
    ] },
  { k: 'scroll', tab: '蒌蒿芦芽', keep: ['bamboo', 'peach', 'river', 'duck'],
    beats: [
      { line: '蒌蒿满地芦芽短', draw: ['hao', 'reedshoot'], hl: '短', note: '短：才长出一点', noteX: 600, noteY: 300, say: '蒌蒿长满了地，芦芽才冒出短短的一点。' }
    ] },
  { k: 'scroll', tab: '河豚欲上', keep: ['bamboo', 'peach', 'river', 'duck', 'hao', 'reedshoot'],
    beats: [
      { line: '正是河豚欲上时', draw: ['puffer'], hl: '欲', note: '欲：将要', noteX: 600, noteY: 300, say: '正是河豚要游上来的时候。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['bamboo', 'peach', 'river', 'duck', 'hao', 'reedshoot', 'puffer'],
    lines: ['竹外桃花三两枝，春江水暖鸭先知。', '蒌蒿满地芦芽短，正是河豚欲上时。'], linesSay: '竹外桃花三两枝，春江水暖鸭先知。蒌蒿满地芦芽短，正是河豚欲上时。',
    marks: [{ t: '竹', at: 'bamboo' }, { t: '鸭', at: 'duck' }, { t: '豚', at: 'puffer', say: '竹子、桃花、鸭子、河豚——春天的江边，全在这幅画里。' }] }
] });
