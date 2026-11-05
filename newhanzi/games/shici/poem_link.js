/* A22-14 小游戏回流深链（共享模块）：只读 window.NHZ_SHICI（data/shici.js），不改任何数据文件。
   用法：POEM_LINK.href(诗句, 诗题, 作者) -> '../../../shici.html#poem-N' 或 null（诗库里没有就不链，不编造）；
   POEM_LINK.linkHtml(诗句, 诗题, 作者) -> '📖 去读整首《题》' 锚点 HTML 或 ''；
   POEM_LINK.splitTip('诗题·作者') -> {t, a}（题名本身含 '·' 时按最后一个 '·' 切分）。 */
(function(){
  function strip(s){ return String(s || '').replace(/[，。！？、；：·"”'「」『』《》\s]/g, ''); }
  function norm(s){ return strip(s).replace(/其([一二三四五六七八九十])/g, '$1'); }
  var byLine = {}, byTA = {};
  var P = (window.NHZ_SHICI && NHZ_SHICI.poems) || [];
  P.forEach(function(p){
    byTA[norm(p.title) + '|' + norm(p.author)] = p.order;
    (p.lines || []).forEach(function(l){
      var k = strip(l);
      if(k && !byLine[k]) byLine[k] = p.order;
    });
  });
  function orderFor(line, title, author){
    if(line && byLine[strip(line)]) return byLine[strip(line)];
    if(title && byTA[norm(title) + '|' + norm(author || '')]) return byTA[norm(title) + '|' + norm(author || '')];
    return null;
  }
  window.POEM_LINK = {
    orderFor: orderFor,
    href: function(line, title, author){
      var o = orderFor(line, title, author);
      return o ? '../../../shici.html#poem-' + o : null;
    },
    linkHtml: function(line, title, author){
      var o = orderFor(line, title, author);
      if(!o) return '';
      var t = title || '';
      return '<div style="margin-top:8px"><a href="../../../shici.html#poem-' + o + '">📖 去读整首' + (t ? '《' + t + '》' : '') + '</a></div>';
    },
    splitTip: function(tip){
      var s = String(tip || '');
      var i = s.lastIndexOf('·');
      if(i < 0) return { t: s, a: '' };
      return { t: s.slice(0, i), a: s.slice(i + 1) };
    }
  };
})();
