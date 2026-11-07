/* 古诗白板：杨万里《晓出净慈寺送林子方》「诗画同生」（分镜与旁白依据 docs/gaijin/shici-gaijin-sheji.md (e) 之一；
   原文取自 data/shici.js order 137；不讲写作背景——背景需注出处后再进旁白）。物件只用几何线稿，不画人物。 */
NHZWB.add('诗:晓出净慈寺送林子方|杨万里', { scenes: [
  { k: 'scroll', tab: '西湖六月',
    beats: [
      { line: '毕竟西湖六月中', draw: ['lake', 'sun'], say: '到底还是西湖的六月最好。' }
    ] },
  { k: 'scroll', tab: '风光不同', keep: ['lake', 'sun'],
    beats: [
      { line: '风光不与四时同', say: '西湖的风光，和春夏秋冬都不一样。' },
      { ask: '到底不一样在哪里？', cmp: '六月西湖，和春夏秋冬都不一样', say: '到底不一样在哪里？往下看荷花就知道了。' }
    ] },
  { k: 'scroll', tab: '莲叶无穷碧', keep: ['lake', 'sun'],
    beats: [
      { line: '接天莲叶无穷碧', draw: ['lotusleaf'], color: { '碧': 'lotusleaf' }, hl: '碧', note: '碧：深绿', noteX: 300, noteY: 300, say: '莲叶连着天边，绿得没有尽头。' }
    ] },
  { k: 'scroll', tab: '荷花别样红', keep: ['lake', 'sun', 'lotusleaf'],
    beats: [
      { line: '映日荷花别样红', draw: ['lotus'], color: { '红': 'lotus' }, say: '太阳照着荷花，红得和别处不一样。' }
    ] },
  { k: 'scroll', tab: '收卷', keep: ['lake', 'sun', 'lotusleaf', 'lotus'],
    lines: ['毕竟西湖六月中，风光不与四时同。', '接天莲叶无穷碧，映日荷花别样红。'], linesSay: '毕竟西湖六月中，风光不与四时同。接天莲叶无穷碧，映日荷花别样红。',
    marks: [{ t: '日', at: 'sun' }, { t: '叶', at: 'lotusleaf' }, { t: '花', at: 'lotus', say: '西湖、莲叶、荷花——六月的西湖，全在这幅画里。' }] }
] });
