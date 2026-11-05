# 语法白板 · 内容稿（数据层）

状态：**草稿**，待负责人审。本目录只放内容数据，不碰引擎（`newhanzi/wb/wb-engine.js`）和现有场景（`newhanzi/wb/s/`）。
依据：`docs/anim/baiban-yufa-gaijin-sheji.md`（§3 符号、§4 lv/src/术语、§5 模板数据格式、§6 叙事手法）、`docs/anim/baiban-yufa-guifan.md`（§0.1、§8 准确性）。所有「待确认」项按设计文档 §10 的默认方案处理。
校验：`node tools/content/check_yufa_neirong.js [--list-daihe]`（已接入 `tools/check_scripts.js`，CI 会跑）。

## 文件

| 文件 | 内容 |
|---|---|
| `01-jushi.json` | 句型句式：双宾语句、连动句、主谓谓语句、四种句类、引语转述、多重复句、紧缩复句 |
| `02-buyu.json` | 补语细分：结果、可能、程度、时量、动量补语 |
| `03-cici.json` | 词与短语：重叠、能愿动词、方位词、同位短语、介宾短语、“的”字短语、“所”字结构 |
| `04-shenceng.json` | 语法学深层（讲浅版）：配价、语义指向、层次分析、省略与 ∅、话题与焦点、语序与重音 |
| `05-xiuci.json` | 修辞补齐：借代、对比、反语、顶真、互文、通感 |
| `06-wenyan.json` | 文言语法：判断句、被动句、省略句、宾语前置、定语后置、状语后置、主谓倒装、词类活用、虚词之/其/而/以/于/乎 |
| `07-biaodian.json` | 标点：引号、冒号、顿号与分号、破折号、省略号 |
| `l3-huilian.json` | 现有 99 项各补 1 幕 L3 + 1 幕回练 |

## 数据格式（新增条目）

```jsonc
{
  "group": "句型句式",              // 文件组别
  "items": [{
    "id": "jx_shuangbin",            // 小写字母数字下划线；不得与 newhanzi/wb/index.js 的场景 id 重复
    "group": "句型句式",
    "title": { "term": "双宾语句", "kid": "给谁 + 给什么" },   // 双名制：术语 + 儿童名
    "core": "一句话核心",
    "tpl": ["valence", "morph"],     // 建议模板：trunk/morph/nest/valence/review + 现有 12 种
    "rel": ["宾语"],                 // 可选：相关的现有 99 项（必须是 data.js 里的名称）
    "scenes": [ /* 1 幕 L1、2–4 幕 L2、1 幕 L3、1 幕回练 */ ],
    "pitfalls": ["易错点"],
    "status": "草稿"
  }]
}
```

幕（scene）：

| 字段 | 说明 |
|---|---|
| `lv` | 1 / 2 / 3（回练幕为 2） |
| `k` | 模板名（设计文档 §5 + 现有模板） |
| `tab` | 幕标签 |
| `say` | 旁白，字符串数组（按 3.5 字/秒计时；带 `ask` 的拍先停 4 秒） |
| `ex` | 例句数组：`{ s, ok, is, fix, why, note }`。`ok` 是对错（`ok:false` 为病句，**必须**在同一对象给 `fix`）；`is` 是「是不是这个语法点」（正反例，不要求 fix） |
| `ask` | 揭晓前的「想一想」问题 |
| `act` | 画面动作要点（字符串数组） |
| `src` | L3 必填：真实可核对的书目/课本/国家标准；拿不准写「待核……」 |
| 回练专用 | `k:'review'`、`huilian:true`、`task`、`answer`、`ok`、`good`（ok:false 时必填）、`rule`、可选 `diff` |

## l3-huilian.json 格式

```jsonc
{ "items": { "名词": { "l3": { /* lv:3 幕，带 src */ }, "huilian": { /* k:'review' 幕 */ } } }, "complete": false }
```
`complete:true` 时校验要求覆盖全部 99 项。

## 约定

- 例句全部自编；只借鉴手法。文言例句为仿古自编短句，不引课文原句。
- 角色（施事/受事/话题）只用上方文字标签描述，不借用成分线或词类色（设计文档 §3.4）。
- 多重复句层次符号沿用教学惯例：第一层「｜」、第二层「‖」；与成分层的主谓分界 ‖ 不同屏出现。
- 交接文档：`docs/anim/jiaojie/yufa-neirong-*.md`。
