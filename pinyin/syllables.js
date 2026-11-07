/* 普通话合法音节表（不带调）。浏览器：window.NHZ_PINYIN_SYLLABLES；node：require('./syllables.js')。
 *
 * main：415 个，取自 audio-cmn（hugolpz/audio-cmn，Chen Wang 录音）syllabs 文件名，
 *       去掉以 _ 开头的「普通话里不存在的组合」（_hm _hng _lvan _m _n _ng _nia）和残留的 *5 文件；
 *       ü 按《汉语拼音方案》写回（文件名里的 v → ü：lü nü lüe nüe）；源目录 ju 第 4 声误名 jv4，已并入 ju。
 *       这张表比教材音节表宽：包含 fe fiao cei tei den kei nou rua yai zhei shei lo 等罕用/口语/旧读音节，
 *       用来判断「拼写上能不能成立」，不表示一年级要学。
 * interj：叹词音节（《现代汉语词典》收），audio-cmn 没有可用录音（其 _m _n _ng _hm _hng 标为不用），也不在 main 里：
 *       yo（哟）ê（欸）m（呣）n ng（嗯）hm（噷）hng（哼）。解析器认为合法，但 interjection=true、没有音频。
 * 修改本表后运行 node newhanzi/tools/check_pinyin_syllables.js。 */
(function (root) {
  var main = [
    'a ai an ang ao',
    'ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu',
    'ca cai can cang cao ce cei cen ceng cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo ci cong cou cu cuan cui cun cuo',
    'da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo',
    'e ei en eng er',
    'fa fan fang fe fei fen feng fiao fo fou fu',
    'ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo',
    'ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo',
    'ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun',
    'ka kai kan kang kao ke kei ken keng kong kou ku kua kuai kuan kuang kui kun kuo',
    'la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lü lüe',
    'ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu',
    'na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nun nuo nü nüe',
    'o ou',
    'pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu',
    'qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun',
    'ran rang rao re ren reng ri rong rou ru rua ruan rui run ruo',
    'sa sai san sang sao se sen seng sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo si song sou su suan sui sun suo',
    'ta tai tan tang tao te tei teng ti tian tiao tie ting tong tou tu tuan tui tun tuo',
    'wa wai wan wang wei wen weng wo wu',
    'xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun',
    'ya yai yan yang yao ye yi yin ying yong you yu yuan yue yun',
    'za zai zan zang zao ze zei zen zeng zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo zi zong zou zu zuan zui zun zuo',
  ].join(' ').split(' ');
  var interj = ['yo', 'ê', 'm', 'n', 'ng', 'hm', 'hng'];
  var data = { main: main, interj: interj };
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.NHZ_PINYIN_SYLLABLES = data;
})(typeof self !== 'undefined' ? self : this);
