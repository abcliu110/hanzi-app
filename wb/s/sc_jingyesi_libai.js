/* 古诗白板：李白《静夜思》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 1；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:静夜思|李白', { scenes: [
  { k: 'scroll', tab: '床前月光',
    beats: [
      { line: '床前明月光', draw: ['bed', 'moon'], say: '床前洒满了明亮的月光。' }
    ] },
  { k: 'scroll', tab: '地上霜', keep: ['bed', 'moon'],
    beats: [
      { line: '疑是地上霜', draw: ['frost'], hl: '疑', note: '疑：好像', noteX: 950, noteY: 300, say: '还以为是地上结了一层霜。' }
    ] },
  { k: 'scroll', tab: '举头望月', keep: ['bed', 'moon', 'frost'],
    beats: [
      { line: '举头望明月', draw: ['lookup'], say: '抬起头，望着天上的明月。' }
    ] },
  { k: 'scroll', tab: '低头思乡', keep: ['bed', 'moon', 'frost', 'lookup'],
    beats: [
      { line: '低头思故乡', draw: ['house', 'bowdown'], hl: '思', note: '思：想念', noteX: 600, noteY: 250, say: '低下头，就想起了自己的家乡。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['bed', 'moon', 'frost', 'lookup', 'house', 'bowdown'],
    lines: ['床前明月光，疑是地上霜。', '举头望明月，低头思故乡。'], linesSay: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    marks: [{ t: '月', at: 'moon' }, { t: '霜', at: 'frost' }, { t: '乡', at: 'house', say: '月光、霜、家乡——一个夜晚的思念，全在这幅画里。' }] }
] });
