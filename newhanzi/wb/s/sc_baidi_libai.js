/* 古诗白板：李白《早发白帝城》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 4；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:早发白帝城|李白', { scenes: [
  { k: 'scroll', tab: '辞白帝',
    beats: [
      { line: '朝辞白帝彩云间', draw: ['city', 'caiyun'], hl: '辞', note: '辞：离开', noteX: 600, noteY: 300, say: '清早离开白帝城，身边还是彩云。' }
    ] },
  { k: 'scroll', tab: '一日还', keep: ['city', 'caiyun'],
    beats: [
      { line: '千里江陵一日还', draw: ['boat', 'river'], hl: '还', note: '还：回来', noteX: 600, noteY: 300, say: '一千里的江陵，一天就回来了。' }
    ] },
  { k: 'scroll', tab: '猿声', keep: ['city', 'caiyun', 'boat', 'river'],
    beats: [
      { line: '两岸猿声啼不住', draw: ['bank', 'apesound'], say: '两岸的猿声叫个不停。' },
      { say: '猿的叫声，从两岸一直传来。' }
    ] },
  { k: 'scroll', tab: '万重山', keep: ['boat', 'river'],
    beats: [
      { line: '轻舟已过万重山', draw: ['peaks'], say: '轻快的小船，已经穿过了层层叠叠的大山。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['city', 'caiyun', 'boat', 'river', 'bank', 'apesound', 'peaks'],
    lines: ['朝辞白帝彩云间，千里江陵一日还。', '两岸猿声啼不住，轻舟已过万重山。'], linesSay: '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。',
    marks: [{ t: '城', at: 'city' }, { t: '舟', at: 'boat' }, { t: '山', at: 'peaks', say: '彩云、轻舟、万重山——一天的路，全在这幅画里。' }] }
] });
