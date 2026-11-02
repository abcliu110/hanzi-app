# 任务书：小学英语「词源数据层」建库

> 本任务书自含全部背景，可直接转发执行。执行方为外部 AI；成果交回后由发包方抽查验收并入模，未过验收不入产品。

## 1. 背景与用途

发包方在做一个给中国小学生（兼顾初中）的英语学习 App。其「词汇解码区」的主线之一是**词源故事**：用词的来源与语义演变帮孩子理解、记住词义（如 school 的「闲暇→讨论→学校」）。目前项目词库有 2,473 个词，含音标、词素拆解、词频等字段，但**没有任何词源数据**。本任务就是补这一层：为一批词建立**逐词核源的词源档案**，供 App 的词页与讲解内容调用。

定位纪律（重要）：

- 本层只存**事实**：来源链、年代、语义演变路径、出处。儿童版故事文案不在本层写，由发包方在展示层另行撰写。
- **宁缺毋滥**：核不到可靠来源的词，标记「待核」交回，不许用模型记忆凑数。这是全任务的第一红线。

## 2. 收词范围

- 总盘子：发包方词库中的词（以小学教材与课标词为主）。本任务先做**第一批 80–120 词的样板批**，验收通过后再扩批。
- 选词标准（同时满足越多越优先）：
  1. 小学教材/课标内高频词；
  2. 词源故事性强：语义演变有清晰「跳变」或画面（如 muscle「小老鼠」、coach「马车→教练」型）；
  3. 词源学界无重大争议、来源链可核。
- 每个拟收词先过一遍第 4 节的核源流程；核不过的词直接换词，并在交付说明里列出被换掉的词与原因。

## 3. 每词档案字段（JSON 记录）

每条记录必须包含以下字段（缺一不可，缺失即标待核）：

| 字段 | 说明 |
|---|---|
| `word` | 词形（小写） |
| `wordbank_key` | 与词形相同即可，发包方入模时对词库 id |
| `source_chain` | 来源链数组：每站 `{lang, form, gloss, period}`，如 Greek → Latin → Old French → Middle English，逐站给当时词形与义 |
| `first_attested` | 英语中首用年代（世纪或年份）＋依据出处 |
| `original_meaning` | 进入英语时的原义（一句） |
| `semantic_path` | 语义演变路径数组：每站 `{meaning, period, how}`，`how` 写清变化方式（隐喻/转喻/泛化/窄化/借代等） |
| `mechanism_sentence` | 一句话点破核心语义跳变（如「闲暇时间用来讨论学问，地方就叫了这个名字」），须与 semantic_path 一致 |
| `modern_meanings_link` | 今义与原义的关系一句（为什么今天这个意思是从原义长出来的；若今义与原义已脱钩，如实写脱钩） |
| `story_hooks` | 供展示层写故事用的事实钩子数组：只列已核实的事实点，不写故事文案 |
| `sources` | 出处数组：每条 `{name, detail, url}`，name 为词典/数据库名，detail 到条目或页码级 |
| `evidence_grade` | 证据等级（见第 4 节分级） |
| `disputes` | 学界争议或不确定点；无则写「无已知争议」，有则如实登记两说，不许擅自裁定 |
| `folk_etymology_check` | 已排查的民间词源说法（如有流传的假词源，写明「某说法为民间词源，已排除」）；无则写「未见流传假词源」 |
| `status` | `verified`（双源互证通过）/ `待核`（未达标），只有 verified 可入产品 |

## 4. 核源纪律

**可用来源（按等级）**：

- **一级**：Oxford English Dictionary (OED) 词源条目；权威词源词典（如 Onions《The Oxford Dictionary of English Etymology》、《Chambers Dictionary of Etymology》、Klein 词源词典）；大学出版社词典的词源栏。
- **二级**：Merriam-Webster、Collins、Cambridge 等学习词典的 etymology/word origin 栏；Etymonline（etymonline.com）——可用，但关键事实（年代、来源链首站）须再找一个一级或二级来源互证。
- **三级（仅作线索，不作定案依据）**：Wiktionary（须追到它引用的来源）、百科与博客文章。
- 每词至少**两个独立来源互证**才可标 `verified`，其中至少一个为一级或二级。只查到单一来源的，标 `待核` 并注明缺什么。
- **民间词源重点排查**（这类假故事在中文网络流传极广，命中即排除并登记在 `folk_etymology_check`）：如 posh 源于船舱缩写说、golf 源于「gentlemen only」说、sirloin「被封爵的牛排」说、news 源于四方首字母说、crap 源于 Crapper 姓氏说等。凡「首字母缩写成词」的词源说法，默认可疑，须一级来源证实才可采信。
- 年代与词形是高危字段：`first_attested` 与 `source_chain` 每站的 form/period 必须逐项对得上所引出处，不许约数糊弄（可写世纪范围，但须是出处支持的世纪）。

## 5. 交付格式

1. `etymology_batch1.json`：JSON 数组，每元素一条第 3 节记录。UTF-8，词形排序。
2. `etymology_batch1_notes.md`：交付说明，含：实际收词数与 verified/待核 分账；被换掉的词及原因清单；争议词清单（词＋两说摘要）；民间词源排除清单；执行中发现的字段规格问题（如有）。

## 6. 格式示例（仅示格式，执行时仍须按第 4 节重新核源）

```json
{
  "word": "school",
  "wordbank_key": "school",
  "source_chain": [
    {"lang": "Ancient Greek", "form": "scholē", "gloss": "闲暇；用闲暇所做的事（讨论、讲学）", "period": "古典时期"},
    {"lang": "Latin", "form": "schola", "gloss": "讲学、学校", "period": "古典拉丁"},
    {"lang": "Old English", "form": "scol", "gloss": "学校", "period": "古英语时期"}
  ],
  "first_attested": "古英语时期已有 scol（约公元 9–10 世纪文献）",
  "original_meaning": "闲暇，以及在闲暇中进行的讨论与讲学",
  "semantic_path": [
    {"meaning": "闲暇", "period": "希腊语阶段", "how": "本义"},
    {"meaning": "用闲暇做的讨论、讲学", "period": "希腊语阶段", "how": "转喻：由时间转到时间中的活动"},
    {"meaning": "讲学的地方、学校", "period": "拉丁语及以后", "how": "转喻：由活动转到活动场所，后固定为今义"}
  ],
  "mechanism_sentence": "先有闲暇才有学问：表示「闲暇」的词，先转指闲暇中的讨论，再转指讨论的场所，就成了今天的「学校」。",
  "modern_meanings_link": "今义「学校」是场所义的直接延续，与「闲暇」本义隔了两次转喻，外形上已看不出。",
  "story_hooks": ["scholē 本义是闲暇", "希腊人把闲暇用于讨论学问", "词义从时间→活动→场所两跳"],
  "sources": [
    {"name": "Etymonline", "detail": "school (n.1) 条目", "url": "https://www.etymonline.com/word/school"},
    {"name": "Merriam-Webster", "detail": "school 词源栏", "url": "https://www.merriam-webster.com/dictionary/school"}
  ],
  "evidence_grade": "二级双源互证（待一级复核）",
  "disputes": "无已知争议",
  "folk_etymology_check": "未见流传假词源",
  "status": "verified"
}
```

## 7. 验收标准（发包方执行，执行方须知）

- 抽查率不低于 20%：抽中词逐字段对出处复核，任一高危字段（年代、来源链首站、原义）与出处不符，整批退回重核。
- `verified` 记录若被查出只有单一来源或来源打不开，整批降级待核。
- 民间词源混入 verified 记录的，一票否决整批。
- 字段完整率 100%（待核条目须在 notes 中说明缺项）。

## 8. 红线汇总

1. 不许凭模型记忆写词源——每条事实都要落到可打开的出处。
2. 不许把民间词源、网络段子当词源。
3. 争议不许擅自裁定，两说并记。
4. 核不到就标待核，不许降低标准凑满词数。
5. 本层只存事实，不写儿童故事文案。
