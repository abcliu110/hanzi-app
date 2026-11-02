# newhanzi · 新版汉字字卡 Spec（v1）

> 目标：在 `hanzi-app` 仓库内新建子目录 `newhanzi/`，做"汉字 + 语文"学习应用。
> 两大内容线：① 3500字 × 6维度字卡（字库见 `ziku/DATA_MODEL.md`）；
> ② 语文知识库 `yuwen/`：语法 / 阅读理解方法技巧 / 写作技巧。

## 一、v1 六个维度（已确认）

| # | 维度 | 老 app 数据来源 | 状态 |
|---|------|----------------|------|
| 1 | 六书造字法归类 | `struct` 字段（按 `·` 切分，取含"形声/会意/象形/指事"的一项） | ✅ 直接复用 |
| 2 | 独体字 / 合体字 + 间架结构 | `struct` 字段（"独体字"→独体；"左右/上下/半包围/上中下结构"→结构） | ✅ 直接复用 |
| 3 | 字→词→句→文运用链 | `senses[].words`（词）、`senses[].example.text`（句）、`senses[].classic`（文/诗句） | ✅ 直接复用 |
| 4 | 笔顺动画 + 描红 | `anim/<字>.json` 书写 cues（100字已有）；`miswrite[]` 笔顺文字说明；描红用 canvas 新做 | ⚠️ 部分复用 |
| 5 | 字源动画演示 | `evo[]`（演变阶段框架）；`anim` intro 场景的甲骨文绘制 cues；字形图资源待补 | ⚠️ 部分复用 |
| 6 | 形近字辨析 | `codes[]` 中以"形近"开头的条目（如"形近辨：胃（上田）↔ 胄（上由）…"） | ✅ 提取复用 |

辅助字段（顺手复用，不单独成区）：`py`（拼音）、`fan`（繁体）、`bu`（部首）、
`parts`（形声拆解：形旁表义/声旁表音）、`misread[]`（易读错提示）。

## 二、字卡数据结构（data-adapter.js 输出）

```js
{
  zi: "头", py: "tóu", fan: "頭", bu: "大",
  liushu: "形声字",        // 六书归类（可能为 null）
  duti: false,             // 是否独体字
  jiegou: "上下结构",      // 间架结构（可能为 null）
  parts: { meaning: "页：表义…", sound: "豆：表音…", note: "…" }, // 形声拆解
  bishun: {
    text: "笔顺：点、点、横、撇、点…",  // 来自 miswrite
    anim: true                            // anim/<字>.json 是否存在
  },
  ziyuan: {
    evo: [{stage:"金文",desc:""},…],      // 演变阶段
    animIntro: true                        // 是否有甲骨文绘制动画
  },
  xingjin: ["形近辨：胃（上田）↔ 胄（上由）…"],  // 形近字条目
  yong: [                                  // 字→词→句→文，按义项组织
    { sense: "脑袋", type: "本义",
      words: ["点头","抬头"],
      sentence: "小狗听到名字，抬起了头。",
      classic: { text: "举头望明月，低头思故乡。", src: "李白《静夜思》" } }
  ],
  misread: ["“木头”里的“头”读轻声 tou。"]
}
```

## 三、页面框架

```
newhanzi/
  SPEC.md            本文件
  index.html         入口：搜字 / 按组浏览 → 跳 zika.html?zi=<字>
  zika.html          字卡页骨架（6 个分区 + 顶部字头区）
  zika.css           样式（大字、大按钮，儿童友好；深色模式跟随系统）
  zika.js            字卡渲染逻辑
  data-adapter.js    老数据 → 字卡 schema（纯函数，可单测）
  ziku/              字库：3500字 × 12维度数据模型（见 ziku/DATA_MODEL.md）
    ziku-level1-3500.json   通用规范汉字表·一级字表（高三及以下范围）
    model-3500.json         全量数据模型（12维度，含笔顺SVG）
    model-3500-slim.json    轻量数据模型
    build_model.py          构建脚本（权威数据源合并）
    fill_gaps.py            补数据缺口（形近字/六书/缺字组词）
    promote_aux.py          辅助字段升维 + 切分单字文件
    sources/                Unihan / hanzi-writer-data / 说文解字 / IDS / CC-CEDICT 等原始数据
  data/
    index.js           3500字索引（window.NHZ_INDEX；file:// 与 http:// 通用）
    zika/<字>.js       3500个单字文件（window.NHZ_ZIKA，按需 <script> 加载）
  build_filemode.py    JSON -> .js 构建脚本（幂等；源头 ziku/model-3500.json）
  index.html / index.js / zika.html / zika.js / zika.css   字卡前端
    - 首页：识字表式列表（借鉴 Pleco 声调五色/Kanji Study 多视图/新华字典拼音部首笔画索引/宝宝巴士识字表/Skritter 已学计数）
    - 按拼音/部首/笔画三视图切换 + 右侧快速索引 + 搜索 + 只看未学 + 已学进度
    - 今日面板：总进度 / 今日新字 / 待复习（已学记录带首次学习日期，localStorage）
    - 字卡：12维度→5分区呈现，笔顺SVG动画+canvas描红+练字打分+朗读，打开即记为已学
  yuwen.html / yuwen.js   语文知识库前端（语法44/阅读14/写作16条，三模块Tab+分类+手风琴条目，首页banner入口）
  yuwen/             语文知识库（JSON，供 App 调用）
    grammar.json     语法：词类12 / 短语5 / 句子成分6 / 复句7 / 修辞8 / 病句6
    reading.json     阅读理解：通用方法4 / 题型公式6 / 文体策略4
    writing.json     写作：审题3 / 立意3 / 选材3 / 结构4 / 语言3
  bushou.html / bushou.js   偏旁部首知识库前端（手风琴条目：变体/说文/语义场/例字/含此部首的字，例字与字表均链字卡；搜索+有释义过滤，首页🧩banner入口）
  bushou/            偏旁部首知识库
    data.js          window.NHZ_BUSHOU（241条：106全资料[含义+说文+语义场+例字] + 97说解[本地说文540部提取] + 38纯字表；有释义覆盖3420/3500字）
    zi_map.js        window.NHZ_ZI_BUSHOU（字→部首 关联表，3500字；变体已在构建时归并）
  build_bushou.py    部首库构建脚本（研究报告解析 + 3500字映射 + 变体归并 + 超范围例字标记in3500）
  数据模型（双向关联）：
    部首条目 {bushou, benzi, bianti, shuowen, shuowen_url, meaning, semantic,
              examples[{z,w,in3500}], chars[→汉字], count, has_meaning}
    汉字 dim['部首']['部首'] --(zi_map)--> 部首条目；部首条目.chars --(zika.html?zi)--> 汉字
    字卡 → 部首库：字头区部首chip + 🧩含义一句话均链 bushou.html?b=部首（自动展开定位）
```

字卡分区顺序（阅读动线，12 维度 → 5 个分区）：
1. **字头区**：大字 + 读音（点读）+ 部首/笔画/繁体/结构/六书徽章
2. **字从哪来**：字源（说文解字/反切/小篆/演变阶段）+ 六书归类（形旁/声旁徽章）
3. **字长什么样**：间架结构 + 顶层部件 + 形声拆解 + 笔顺动画（SVG逐笔）+ 描红（canvas）+ 笔顺文字
4. **别认错**：形近字辨析卡片 + 易错提示
5. **字的魔法**：运用链（按义项展开 词→句→文）

## 四、数据缺口（v1 后补，不阻塞上线）

- `anim/` 目前只有 100 字的动画 → 无动画的字，笔顺区降级显示 `miswrite` 文字 + 静态笔顺
- `evo[].desc` 多为空 → 字源区先展示阶段徽章 + intro 动画，文字解说后续补
- 形近字只覆盖部分字 → 无数据的字该区隐藏

## 五、运行

```bash
cd hanzi-app && python3 -m http.server 8000
# 打开 http://localhost:8000/newhanzi/
```
