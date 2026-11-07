/* 古诗白板：柳宗元《江雪》「写诗现场」（设计 docs/gaijin/shici-gaijin-sheji.md P1-4；
   原文取自 data/shici.js；只讲本句画面，不编背景）。 */
NHZWB.add('诗:江雪|柳宗元', { scenes: [
  { k: 'title', tab: '诗题', t: '江雪', one: '唐 · 柳宗元', say: '柳宗元的《江雪》，这一幕只看其中一句。' },
  { k: 'mark', lv: 1, tab: '一个人钓鱼', h: '一个人钓鱼',
    s: ['独', '钓', '寒', '江', '雪'],
    say: '下雪的江上，只有一个人，在独自钓鱼。',
    ask: '江上还有别的人吗？',
    m: [
      { i: [0, 1], ring: 1, col: 'acc', say: '独钓，就是一个人独自钓鱼。', note: '一个人钓鱼' },
      { i: [2, 3, 4], col: 'acc', say: '寒江雪，下雪的、冷冷的江。', note: '下雪的江' }
    ],
    end: '雪天的江上，只有一个人在钓鱼。' },
  { k: 'scroll', lv: 1, tab: '画出来',
    beats: [ { line: '独钓寒江雪', draw: ['snowpeak', 'river', 'boat'], say: '雪山下面，江面上停着一只小船，雪天的江就是这样安静。' } ] }
] });
