/* 古诗白板：王之涣《登鹳雀楼》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 38；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:登鹳雀楼|王之涣', { scenes: [
  { k: 'scroll', tab: '白日依山',
    beats: [
      { line: '白日依山尽', draw: ['sun', 'mtn'], color: { '白': 'sun' }, hl: '尽', note: '尽：完、没有了', noteX: 950, noteY: 320, say: '太阳靠着大山，慢慢落下去了。' }
    ] },
  { k: 'scroll', tab: '黄河入海', keep: ['sun', 'mtn'],
    beats: [
      { line: '黄河入海流', draw: ['river', 'sea'], color: { '黄': 'river' }, say: '黄河的水，流进了大海。' }
    ] },
  { k: 'scroll', tab: '千里目', keep: ['sun', 'river', 'sea'],
    beats: [
      { line: '欲穷千里目', draw: ['tower', 'gaze'], hl: '穷', note: '穷：尽', noteX: 300, noteY: 300, say: '想要看尽千里远的地方。' }
    ] },
  { k: 'scroll', tab: '一层楼', keep: ['tower', 'gaze'],
    beats: [
      { line: '更上一层楼', draw: ['upstep'], say: '那就再上一层楼。' },
      { say: '站得高，看得远。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['sun', 'mtn', 'river', 'sea', 'tower', 'gaze', 'upstep'],
    lines: ['白日依山尽，黄河入海流。', '欲穷千里目，更上一层楼。'], linesSay: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
    marks: [{ t: '日', at: 'sun' }, { t: '河', at: 'river' }, { t: '楼', at: 'tower', say: '太阳、黄河、高楼——登上楼看到的远方，全在这幅画里。' }] }
] });
