# 拼音区内容文件格式（pinyin/content/*.js）

每个知识点一个文件：`pinyin/content/<id>.js`，id 与菜单一致：
shengdiao danyunmu shengmu yw pindu fuyunmu biyunmu zhengti pinxie yibian yinbian yinjiebiao

```js
(window.NHZ_PY_CONTENT = window.NHZ_PY_CONTENT || {})['danyunmu'] = {
  id: 'danyunmu', name: '单韵母', lv: 'L1–L3',
  lead: '一句话说清本知识点学什么（自编）',
  src: ['统编一上第 1、2 课', '《汉语拼音方案》韵母表'],      // 依据，页面底部显示
  kan:  [ /* 块 */ ],   // 看：情境、动画、对比
  ting: [ /* 块 */ ],   // 听读：真人音频
  lian: [ /* 块 */ ],   // 练：随机出题、判对错、不扣分
  yong: [ /* 块 */ ]    // 用：自编词语、短句、儿歌
};
```

## 块（每块都可带 `lv: 1|2|3`，缺省 1；页面只显示 ≤ 当前档位的块；`h` 小标题，`note` 出处小字）

| type | 字段 | 说明 |
|---|---|---|
| `text` | `h`, `p: [段落]` | 讲解文字。段落内可用 `{py:mā}` 表示可点发音的拼音、`{zi:妈}` 表示可点去字卡的字 |
| `chips` | `h`, `items: [{t:'a', play:'a1'} 或 {t:'ā', play:'a1', sub:'阿'} 或 {t:'b', hudu:'b'}]` | 字母/音节芯片。`play` = audio-cmn 音节键（拼音字母+调号数字，ü 写 v，如 `lv4`）；`tones:'a'` 表示点开出四声条；`hudu` = 呼读音文件名（缺失显示「待录音」） |
| `groups` | `h`, `groups: [{label:'第 3 课', items:[同 chips]}]` | 分组芯片 |
| `table` | `h`, `head: [...]`, `rows: [[...]]` | 表格；单元格可用 `{py:}` `{zi:}` |
| `pairs` | `h`, `pairs: [[{t,play},{t,play}], ...]`, `tip` | 对比听（送气/不送气、前后鼻等） |
| `scene` | `h`, `items: [{letter:'b', thing:'挂钩上的布包', word:'包', py:'bāo', svg:'<svg…>'}]` | 音形结合情境卡。svg 只画物和动物，不画人 |
| `mirror` | `h`, `base:'b'` | b/d/p/q 镜像翻转演示 |
| `anim` | `h`, `kind:'tone-road'|'bump'|'glide'|'nasal'`, `params:{…}` | 动画（由框架实现；没实现的 kind 先显示静态说明 `fallback`） |
| `quiz-listen` | `h`, `pool: ['ba1','pa1',…]`, `ask:'initial'|'final'|'tone'|'syllable'`, `options: [...]`（可省，自动从 pool 推） | 听音选择，随机出题 |
| `quiz-choose` | `h`, `items: [{q:'…', options:['…'], answer:0, why:'…'}]` | 选择题，随机顺序 |
| `quiz-build` | `h`, `initials:[…]`, `finals:[…]`, `tones:[1,2,3,4]` | 拼读机：选声母+韵母+声调，碰撞后播放（不合法组合禁用，用 NHZPinyinSyllable 判） |
| `quiz-mark` | `h`, `items: ['hao','liu',…]` | 标调练习：点调号该落的字母 |
| `quiz-find` | `h`, `target:'b'`, `distract:['d','p','q']`, `n:12` | 找一找 |
| `words` | `h`, `items: [{w:'妈妈', py:'mā ma'}]` | 自编词语，拼音按字标原调；轻声音节不可点 |
| `verse` | `h`, `title`, `lines: [{w:'小木马，不怕坡。', py:'xiǎo mù mǎ, bù pà pō.'}]`, `real: {'不':'bú'}` | 自编儿歌/短句；`real` 为 L2 起显示的实际读音 |
| `outline` | `h`, `p:[…]` | 仅在功能还没做完时临时说明，不得超过 1 块 |

## 规则
- 讲解、例词、例句、儿歌全部自编；不搬运课本或其他 App 内容。
- 只能引用 `pinyin/audio/index.js` 里有的音频键；没有的不要写 `play`。轻声无录音。
- L1 = 一年级能懂；L2 = 规则和原理；L3 = 学理（五度、舌位、正词法等）。内容不删，只分层。
- 事实依据：统编 2024 一上（21 声母、y/w 不算声母、6 单韵母、24 韵母分组、16 整体认读）；《汉语拼音方案》；GB/T 16159-2012；教育部《汉语拼音的教学特色》。
- 每个知识点：看 ≥3 块、听读 ≥3 块、练 ≥3 种题型、用 ≥2 块（词语 ≥8 个 + 至少 1 首自编儿歌或 2 句短句）；L1/L2/L3 都要有内容。
- 校验：`node tools/check_pinyin_content.js`（框架任务负责写）检查格式、音频键存在、拼音可解析、数量下限。
