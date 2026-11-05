function _bsTimeline(title, stages, dur){
  dur = dur || 12;
  var n = stages.length;
  var s = '<svg viewBox="0 0 320 160">';
  s += '<text x="160" y="18" font-size="14" text-anchor="middle" class="svg-ink">' + title + '</text>';
  var x0 = 40, x1 = 280;
  s += '<line x1="' + x0 + '" y1="118" x2="' + x1 + '" y2="118" stroke-width="2" class="svg-muted-s"/>';
  for (var i = 0; i < n; i++) {
    var dx = n === 1 ? 160 : Math.round(x0 + i * (x1 - x0) / (n - 1));
    s += '<circle cx="' + dx + '" cy="118" r="3.5" class="svg-muted"/>';
  }
  s += '<circle r="5" class="svg-accent"><animateMotion dur="' + dur + 's" repeatCount="2" path="M' + x0 + ',118 L' + x1 + ',118"/></circle>';
  stages.forEach(function(st, i){
    var cx = n === 1 ? 160 : Math.round(x0 + i * (x1 - x0) / (n - 1));
    var a = i / n, b = (i + 1) / n;
    var kt = '0;' + a.toFixed(3) + ';' + (a + 0.03).toFixed(3) + ';' + (b - 0.03).toFixed(3) + ';' + b.toFixed(3) + ';1';
    s += '<g opacity="0.35">';
    s += '<animate attributeName="opacity" values="0.35;0.35;1;1;0.35;0.35" keyTimes="' + kt + '" dur="' + dur + 's" repeatCount="2"/>';
    s += '<rect x="' + (cx - 30) + '" y="30" width="60" height="60" rx="10" stroke-width="1.5" stroke-opacity="0" class="svg-panel svg-accent-s">';
    s += '<animate attributeName="stroke-opacity" values="0;0;0.9;0.9;0;0" keyTimes="' + kt + '" dur="' + dur + 's" repeatCount="2"/></rect>';
    s += '<g transform="translate(' + cx + ',60)">' + st.art + '</g>';
    s += '<text x="' + cx + '" y="108" font-size="12" class="svg-accent" text-anchor="middle">' + st.label
      + '<animate attributeName="opacity" values="0.35;0.35;1;1;0.35;0.35" keyTimes="' + kt + '" dur="' + dur + 's" repeatCount="2"/></text>';
    s += '</g>';
    s += '<text x="160" y="146" font-size="12" class="svg-accent" text-anchor="middle" opacity="0">' + st.note
      + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="' + kt + '" dur="' + dur + 's" repeatCount="2"/></text>';
  });
  return s + '</svg>';
}

/* 1. 字形演变：马（对应部首"马"） */

function bsAnimEvoMa(){
  var jia = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<path d="M-20,2 Q-20,-10 0,-10 Q20,-10 20,2 Q20,12 0,12 Q-20,12 -20,2"/>'
    + '<path d="M14,-6 L26,-20"/><path d="M26,-20 l6,-2 l-2,7 l-6,1 Z"/>'
    + '<path d="M-16,-9 l4,-6 l4,6 l4,-6 l4,6 l4,-6 l3,5"/>'
    + '<path d="M-20,4 Q-30,8 -28,20"/>'
    + '<path d="M-13,12 L-13,24 M-4,12 L-4,24 M6,12 L6,24 M15,12 L15,24"/>'
    + '</g>';
  var jin = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<circle cx="16" cy="-14" r="11"/>'
    + '<circle cx="19" cy="-16" r="2" stroke="none" class="svg-accent"/>'
    + '<path d="M-18,4 Q-18,-6 0,-6 Q14,-6 12,2"/>'
    + '<path d="M-14,-5 l4,-5 l4,5 l4,-5 l4,5"/>'
    + '<path d="M-18,6 Q-26,10 -24,20"/>'
    + '<path d="M-10,8 L-10,22 M2,8 L2,22"/>'
    + '</g>';
  var zhuan = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<path d="M-12,-18 L-12,-8 M0,-20 L0,-8 M12,-18 L12,-8"/>'
    + '<path d="M-16,-4 Q0,-12 16,-4"/><path d="M-16,4 L16,4"/>'
    + '<circle cx="-12" cy="13" r="2.6" stroke="none" class="svg-accent"/>'
    + '<circle cx="-4" cy="13" r="2.6" stroke="none" class="svg-accent"/>'
    + '<circle cx="4" cy="13" r="2.6" stroke="none" class="svg-accent"/>'
    + '<circle cx="12" cy="13" r="2.6" stroke="none" class="svg-accent"/>'
    + '</g>';
  var kai = '<text y="13" font-size="40" text-anchor="middle" class="svg-ink">马</text>';
  return _bsTimeline('字形演变 · 马', [
    {art:jia, label:'甲骨文', note:'像马的侧面：鬃毛、四足和尾巴都看得见'},
    {art:jin, label:'金文', note:'马头画得特别大，身子变小'},
    {art:zhuan, label:'小篆', note:'线条变规整，下面四点是马腿'},
    {art:kai, label:'楷书', note:'简化成今天的“马”'}
  ], 12);
}

/* 2. 字形演变：鱼（对应部首"鱼"） */

function bsAnimEvoYu(){
  var jia = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<path d="M-18,0 Q-18,-11 0,-11 Q18,-11 18,0 Q18,11 0,11 Q-18,11 -18,0"/>'
    + '<path d="M18,0 L29,-9 L29,9 Z"/>'
    + '<circle cx="-10" cy="-3" r="2.2" stroke="none" class="svg-accent"/>'
    + '<path d="M-3,-9 L-3,9"/><path d="M2,-11 L7,-17 M2,11 L7,17"/>'
    + '</g>';
  var jin = '<g stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="svg-accent-s">'
    + '<path d="M-20,0 L-6,-11 L10,-11 L20,0 L10,11 L-6,11 Z"/>'
    + '<path d="M20,0 L30,-10 L30,10 Z"/>'
    + '<circle cx="-10" cy="-3" r="2.2" stroke="none" class="svg-accent"/>'
    + '<path d="M-2,-9 L-2,9"/>'
    + '</g>';
  var zhuan = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<path d="M-14,-16 L14,-16 L10,-2 L-10,-2 Z"/><path d="M-14,-9 L14,-9"/>'
    + '<circle cx="-9" cy="10" r="2.6" stroke="none" class="svg-accent"/>'
    + '<circle cx="-3" cy="10" r="2.6" stroke="none" class="svg-accent"/>'
    + '<circle cx="3" cy="10" r="2.6" stroke="none" class="svg-accent"/>'
    + '<circle cx="9" cy="10" r="2.6" stroke="none" class="svg-accent"/>'
    + '</g>';
  var kai = '<text y="13" font-size="40" text-anchor="middle" class="svg-ink">鱼</text>';
  return _bsTimeline('字形演变 · 鱼', [
    {art:jia, label:'甲骨文', note:'像一条鱼：头、身子、尾巴、鱼鳍都有'},
    {art:jin, label:'金文', note:'鱼身变方变硬，开始符号化'},
    {art:zhuan, label:'小篆', note:'下部四点，是鱼尾的变形'},
    {art:kai, label:'楷书', note:'简化成今天的“鱼”'}
  ], 12);
}

/* 3. 字形演变：日（对应部首"日"） */

function bsAnimEvoRi(){
  var jia = '<circle r="16" stroke-width="2.5" fill="none" class="svg-accent-s"/>'
    + '<circle r="3" class="svg-accent"/>';
  var jin = '<rect x="-15" y="-15" width="30" height="30" rx="9" stroke-width="2.5" fill="none" class="svg-accent-s"/>'
    + '<line x1="-15" y1="0" x2="15" y2="0" stroke-width="2.5" class="svg-accent-s"/>';
  var zhuan = '<rect x="-14" y="-14" width="28" height="28" stroke-width="2.5" fill="none" class="svg-accent-s"/>'
    + '<line x1="-14" y1="0" x2="14" y2="0" stroke-width="2.5" class="svg-accent-s"/>';
  var kai = '<text y="13" font-size="40" text-anchor="middle" class="svg-ink">日</text>';
  return _bsTimeline('字形演变 · 日', [
    {art:jia, label:'甲骨文', note:'圆圈加一点，就是天上的太阳'},
    {art:jin, label:'金文', note:'圆圈变方，开始方正化'},
    {art:zhuan, label:'小篆', note:'方框加一横，规规矩矩'},
    {art:kai, label:'楷书', note:'就是今天的“日”'}
  ], 12);
}

/* 4. 字形演变：车（对应部首"车"） */

function bsAnimEvoChe(){
  var jia = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<circle cx="-10" cy="0" r="12"/><circle cx="-10" cy="0" r="3"/>'
    + '<rect x="4" y="-8" width="18" height="16" rx="2"/>'
    + '<line x1="-24" y1="0" x2="-31" y2="0"/><line x1="1" y1="0" x2="4" y2="0"/>'
    + '</g>';
  var jin = '<g stroke-width="2.5" fill="none" class="svg-accent-s">'
    + '<rect x="-24" y="-12" width="24" height="24"/>'
    + '<rect x="4" y="-8" width="18" height="16" rx="2"/>'
    + '<line x1="-28" y1="0" x2="-34" y2="0"/>'
    + '</g>';
  var zhuan = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<line x1="0" y1="-20" x2="0" y2="20"/>'
    + '<line x1="-13" y1="-14" x2="13" y2="-14"/>'
    + '<rect x="-9" y="-6" width="18" height="12"/>'
    + '<line x1="-13" y1="14" x2="13" y2="14"/>'
    + '</g>';
  var kai = '<text y="13" font-size="40" text-anchor="middle" class="svg-ink">车</text>';
  return _bsTimeline('字形演变 · 车', [
    {art:jia, label:'甲骨文', note:'车的俯视图：圆圆的车轮 + 车厢'},
    {art:jin, label:'金文', note:'车轮变方，线条变硬'},
    {art:zhuan, label:'小篆', note:'“車”：一根轴，穿起车身'},
    {art:kai, label:'楷书', note:'简化成今天的“车”'}
  ], 12);
}

/* 5. 偏旁变形：原字 → 作偏旁（数据驱动：氵/扌/亻/忄）
 * 左边原字大字，滑向右边时被"挤"窄（scaleX），右边偏旁弹出。
 * 标注"挤一挤、让位置"。 */

function bsAnimBian(key){
  var T = {
    '氵':{from:'水', name:'三点水', ex:'江', note:'水在左边站不下，挤成三点'},
    '扌':{from:'手', name:'提手旁', ex:'打', note:'手在左边，竖钩一收变成提手'},
    '亻':{from:'人', name:'单人旁', ex:'你', note:'人在左边，捺一收变成单人'},
    '忄':{from:'心', name:'竖心旁', ex:'快', note:'心在左边躺不下，站起来变三画'}
  };
  var t = T[key] || T['氵'];
  var dur = 8;
  var s = '<svg viewBox="0 0 320 172">';
  s += '<text x="160" y="18" font-size="14" text-anchor="middle" class="svg-ink">偏旁变形：' + t.from + ' → ' + key + '</text>';
  /* 左框：原字 */
  s += '<rect x="18" y="36" width="96" height="96" rx="10" stroke-width="1.5" class="svg-panel svg-muted-s"/>';
  s += '<text x="66" y="102" font-size="46" text-anchor="middle" class="svg-ink">' + t.from + '</text>';
  s += '<text x="66" y="126" font-size="12" text-anchor="middle" class="svg-muted">原字</text>';
  /* 右框：偏旁（弹出） */
  s += '<rect x="206" y="36" width="96" height="96" rx="10" stroke-width="1.5" class="svg-panel svg-muted-s"/>';
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;1;0" keyTimes="0;0.32;0.42;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<text x="254" y="102" font-size="46" text-anchor="middle" class="svg-accent">' + key + '</text></g>';
  s += '<text x="254" y="126" font-size="12" text-anchor="middle" class="svg-muted">作偏旁 · ' + t.name + '</text>';
  /* 中间虚线箭头 */
  s += '<line x1="128" y1="84" x2="192" y2="84" stroke-width="2" stroke-dasharray="6 4" class="svg-accent-s">'
    + '<animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="2"/></line>';
  s += '<polygon points="192,78 192,90 202,84" class="svg-accent"/>';
  /* 移动的字：从左框滑到右框，边滑边被"挤"窄 */
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.06;0.3;0.4;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<animateTransform attributeName="transform" type="translate" values="0 0;0 0;188 0;188 0;188 0" keyTimes="0;0.06;0.3;0.4;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<g transform="translate(66,84)">'
    + '<animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1 1;0.55 1;0.55 1;0.55 1" keyTimes="0;0.06;0.3;0.4;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<text x="0" y="16" font-size="46" text-anchor="middle" class="svg-accent">' + t.from + '</text>'
    + '</g></g>';
  s += '<text x="160" y="160" font-size="12" text-anchor="middle" class="svg-muted">“挤一挤、让位置”：' + t.note + '（如“' + t.ex + '”）</text>';
  return s + '</svg>';
}

/* 6. 六书 · 象形：木（对应部首"木"）
 * 甲骨文画出一棵树 → 小篆线条规整 → 楷书"木" */

function bsAnimXiangxing(){
  var tree = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<path d="M0,-20 L0,20"/>'
    + '<path d="M0,-8 L-14,-18 M0,-8 L14,-18"/>'
    + '<path d="M0,2 L-11,-6 M0,2 L11,-6"/>'
    + '<path d="M0,20 L-8,28 M0,20 L8,28"/>'
    + '</g>';
  var treeZhuan = '<g stroke-width="2.5" fill="none" stroke-linecap="round" class="svg-accent-s">'
    + '<path d="M0,-20 L0,20"/>'
    + '<path d="M0,-10 L-12,-18 M0,-10 L12,-18"/>'
    + '<path d="M0,-2 L-10,-10 M0,-2 L10,-10"/>'
    + '</g>';
  var muKai = '<text y="13" font-size="40" text-anchor="middle" class="svg-ink">木</text>';
  return _bsTimeline('六书 · 象形：木', [
    {art:tree, label:'甲骨文', note:'画出来的树：枝干和根都看得见'},
    {art:treeZhuan, label:'小篆', note:'线条变规整，树根不见了'},
    {art:muKai, label:'楷书', note:'“木”：横竖撇捺，一棵树的骨架'}
  ], 9);
}

/* 7. 六书 · 会意：人 + 木 = 休（对应部首"人"/"木"）
 * "人""木"相向滑到中间拼合，"+"变"="，"休"弹出 */

function bsAnimHuiyi(){
  var dur = 9;
  var s = '<svg viewBox="0 0 320 172">';
  s += '<text x="160" y="18" font-size="14" text-anchor="middle" class="svg-ink">六书 · 会意：人 + 木 = 休</text>';
  /* A：人（向右滑） */
  s += '<g>'
    + '<animateTransform attributeName="transform" type="translate" values="0 0;0 0;52 0;52 0;52 0" keyTimes="0;0.2;0.42;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<animate attributeName="opacity" values="1;1;1;0;0;1" keyTimes="0;0.42;0.5;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<rect x="26" y="52" width="84" height="84" rx="10" stroke-width="1.5" class="svg-panel svg-muted-s"/>'
    + '<text x="68" y="112" font-size="44" text-anchor="middle" class="svg-ink">人</text>'
    + '<text x="68" y="130" font-size="11" text-anchor="middle" class="svg-muted">人</text>'
    + '</g>';
  /* B：木（向左滑） */
  s += '<g>'
    + '<animateTransform attributeName="transform" type="translate" values="0 0;0 0;-52 0;-52 0;-52 0" keyTimes="0;0.2;0.42;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<animate attributeName="opacity" values="1;1;1;0;0;1" keyTimes="0;0.42;0.5;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<rect x="210" y="52" width="84" height="84" rx="10" stroke-width="1.5" class="svg-panel svg-muted-s"/>'
    + '<text x="252" y="112" font-size="44" text-anchor="middle" class="svg-ink">木</text>'
    + '<text x="252" y="130" font-size="11" text-anchor="middle" class="svg-muted">木（树）</text>'
    + '</g>';
  /* + 号 → = 号 */
  s += '<text x="160" y="104" font-size="28" class="svg-accent" text-anchor="middle" opacity="1">'
    + '<animate attributeName="opacity" values="1;1;0;0;0;1" keyTimes="0;0.35;0.45;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>+</text>';
  s += '<text x="160" y="104" font-size="28" class="svg-accent" text-anchor="middle" opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.35;0.45;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>=</text>';
  /* 休：弹出 */
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.45;0.55;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<g transform="translate(160,94)">'
    + '<animateTransform attributeName="transform" type="scale" additive="sum" values="0.6;0.6;1.15;1;1" keyTimes="0;0.45;0.55;0.62;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<rect x="-42" y="-42" width="84" height="84" rx="10" stroke-width="2" class="svg-panel svg-accent-s"/>'
    + '<text x="0" y="22" font-size="52" text-anchor="middle" class="svg-accent">休</text>'
    + '</g></g>';
  s += '<text x="160" y="162" font-size="12" class="svg-accent" text-anchor="middle" opacity="0">人靠着树休息 → “休”：两个意思拼出新意思'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.5;0.58;0.9;0.97;1" dur="' + dur + 's" repeatCount="2"/></text>';
  return s + '</svg>';
}

/* 8. 六书 · 形声：江 = 氵（形） + 工（声）（对应部首"氵"）
 * "江"先整体出现，再拆成左右两部分：金色形旁表义、红色声旁表声，最后合拢 */

function bsAnimXingsheng(){
  var dur = 9;
  var s = '<svg viewBox="0 0 320 186">';
  s += '<text x="160" y="18" font-size="14" text-anchor="middle" class="svg-ink">六书 · 形声：江 = 氵 + 工</text>';
  /* 完整的江 */
  s += '<text x="160" y="112" font-size="60" class="svg-accent" text-anchor="middle" opacity="1">江'
    + '<animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes="0;0.18;0.28;0.78;0.88;1" dur="' + dur + 's" repeatCount="2"/></text>';
  /* 氵：从中间滑到左边，金色 */
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.2;0.3;0.72;0.82;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<animateTransform attributeName="transform" type="translate" values="0 0;0 0;-80 0;-80 0;0 0" keyTimes="0;0.2;0.35;0.68;0.82;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<text x="160" y="112" font-size="60" text-anchor="middle" class="svg-accent">氵</text>'
    + '</g>';
  /* 工：从中间滑到右边，红色 */
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.2;0.3;0.72;0.82;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<animateTransform attributeName="transform" type="translate" values="0 0;0 0;80 0;80 0;0 0" keyTimes="0;0.2;0.35;0.68;0.82;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<text x="160" y="112" font-size="60" text-anchor="middle" class="svg-red">工</text>'
    + '</g>';
  /* 拆开时的虚线框 */
  s += '<rect x="44" y="52" width="72" height="76" rx="10" fill="none" stroke-width="1.5" stroke-dasharray="5 4" opacity="0" class="svg-accent-s">'
    + '<animate attributeName="opacity" values="0;0;0.8;0.8;0;0" keyTimes="0;0.3;0.38;0.68;0.78;1" dur="' + dur + 's" repeatCount="2"/></rect>';
  s += '<rect x="204" y="52" width="72" height="76" rx="10" fill="none" stroke-width="1.5" stroke-dasharray="5 4" opacity="0" class="svg-red-s">'
    + '<animate attributeName="opacity" values="0;0;0.8;0.8;0;0" keyTimes="0;0.3;0.38;0.68;0.78;1" dur="' + dur + 's" repeatCount="2"/></rect>';
  /* 左标签：形旁 */
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.32;0.42;0.68;0.78;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<text x="80" y="148" font-size="13" text-anchor="middle" class="svg-accent">形旁 · 表义</text>'
    + '<text x="80" y="166" font-size="11" text-anchor="middle" class="svg-muted">和水有关</text>'
    + '</g>';
  /* 右标签：声旁 */
  s += '<g opacity="0">'
    + '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.32;0.42;0.68;0.78;1" dur="' + dur + 's" repeatCount="2"/>'
    + '<text x="240" y="148" font-size="13" text-anchor="middle" class="svg-red">声旁 · 表声</text>'
    + '<text x="240" y="166" font-size="11" text-anchor="middle" class="svg-muted">读音的线索</text>'
    + '</g>';
  /* 底部说明（江完整时显示） */
  s += '<text x="160" y="158" font-size="12" class="svg-accent" text-anchor="middle" opacity="1">形声字：一半管意思，一半管读音'
    + '<animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes="0;0.15;0.25;0.8;0.9;1" dur="' + dur + 's" repeatCount="2"/></text>';
  return s + '</svg>';
}

