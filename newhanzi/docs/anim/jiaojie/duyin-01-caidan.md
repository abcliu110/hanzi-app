# 交接 · 易错读音 01：菜单小分组 + 多音字 / 易读错的字 / 审音改读

## 做了什么
- 拼音菜单（pinyin.html）在 12 个知识点之后加小分组「易错读音」，三张卡：`duoyin` 多音字（no 13）、`yicuo` 易读错的字（no 14）、`shenyin` 审音改读（no 15）。首页 index.html 没动。
  - 菜单数据：`pinyin/data.js` 里给条目加 `group: '易错读音'`；`pinyin.js` 在同组第一张卡前插 `<h3 class="py-grp-h">`（`pinyin.html` 一行样式，`grid-column:1/-1`）。
- 内容文件 `pinyin/content/{duoyin,yicuo,shenyin}.js`：草稿里的新块（poly / misread / shenyin / quiz-pick / quiz-sent / quiz-hear / quiz-wrong）全部改写成**已有块**：看 = `table`，练 = `quiz-choose`。每个文件是一个 IIFE：草稿数据原样留在 `kan` 里，用 `poly()` / `misread()` / `shenyin()` 包一层生成表格（同时登记到 `POLY` / `MIS` / `SY`），`lian` 里用 `quiz(kind, lv, h)` 从登记的数据生成选择题。最后把四段 `flat()` 一下（一个函数可以返回几个块）。
- 审音页写明：现行 = 1985《普通话异读词审音表》；2016 修订稿是征求意见稿，没有正式发布，表里只写「拟改」（原表没收、修订稿补写进去的现行读音写「写明」，不算改读）。
- 删掉不在 3500 字库的字：炽、犷、涎（yicuo）、荨、粳（shenyin；听读对比改用 杉 shā/shān、葛 gé/gě，「拟改」例子改用 风靡 mǐ→mí）。

## kp.js 小扩展（只动 quiz-choose，别的块没改）
| 字段 | 用法 |
|---|---|
| `item.play: 'chang2'` | 听音题：题面后出「▶ 听」按钮（点「下一题」时自动播一次）；没有录音的题自动不出（页面跳过，校验只提示） |
| `block.rv: '多音字'` | 错题打通：答错进 `nhz_wrong` + `nhz_srs`（明天复习），答对推进复习间隔；格式同 fuxi.js / yuwen.js 的 `NHZReview.record`（`q/options/answer` 是去掉 `{py:}{zi:}` 的纯文字，`src:'拼音'`，`point` = rv）。拼音页不加载 fuxi.js，kp.js 里留了一份同格式的最小 record（有 `window.NHZReview` 就用它） |
| `block.kind: 'pick'…` | 只给校验用：`练 ≥3 种题型` 时 quiz-choose 按 `type:kind` 算不同题型（pick 看词选音 / sent 句中读音 / hear 听音 / wrong 找注音错的 / judge 判断） |

## 读音核对（tools/check_pinyin_content.js 第 5 条）
内容对象带 `zidu: [[字, 拼音], …]`（页面当作「这个字的读音」展示的每一处）时：字必须在 `ziku/model-3500.json`，拼音必须是该字「读音.拼音」之一（NFC）。同一卡「用」里的 `words` 也逐字核（轻声、字库外的字跳过）。错读（yicuo 的 wrong）、旧读（shenyin 1985 以前的读法）不进 zidu。

## gushidu（古诗文读音）卡怎么接
1. `pinyin/data.js` 末尾加 `{ id: 'gushidu', no: 16, group: '易错读音', name: '古诗文读音', ex: '…', ds: '…', lv: '…', secs: [...] }`，同 group 自动排在这一组里，不用改 pinyin.js。
2. 新建 `pinyin/content/gushidu.js`，照 duoyin.js 的结构：IIFE + `key()` / `flat()` 两个小函数 + 自己的数据包装函数（返回 `table` 块）+ `quiz(kind, lv, h)`（返回 `{ type:'quiz-choose', kind, rv:'古诗文读音', lv, h, items }`，听音题 item 带 `play: key(拼音)`）。
3. 末尾填 `C.zidu`。诗里的特殊读音如果不在 3500 字库读音里（如叶音），不要放进 zidu，改成说明文字并写出处。
4. smoke.spec.js 的 `.py-card` 数量（现 15）+1；tests/duyin.spec.js 的 `CARDS` 和菜单顺序断言加上 gushidu。
5. 跑：`node newhanzi/tools/check_pinyin_content.js`、`PW_NO_SERVER=1 PORT=4741 npx playwright test tests/duyin.spec.js tests/pinyin.spec.js`（先在仓库根 `python3 -m http.server 4741 --bind 127.0.0.1`）。截图：`SHOTS_DIR=/某目录` 时 duyin.spec 存每张卡 768/1280 整页图。

## 条目数
- 多音字：101 字（L1 37 / L2 57 / L3 7，220 个读音），表 6 块，题 8 块（pick×3、sent×2、hear×2、wrong×1）。
- 易读错的字：112 条（L1 54 / L2 58），表 2 块 + 声旁表 1 块，题 6 块（pick/wrong/hear 各 L1、L2）。
- 审音改读：21 条（1985 改定 8 / 2016 修订稿 13），表 2 块，题 3 块（pick、judge、hear）。

## 没做 / 待定
- ~~古诗文读音 gushidu 卡（另一任务）~~ 2026-11-08 已做，见下节。
- 易读错的字每条后面的依据标签（「1985 审音表」/「《现汉》第 7 版」）沿用草稿，未逐条对审音表原文复核。
- 字库主读音顺序（TODO_STATUS Q6）没动。

## 2026-11-08 追加 · gushidu 古诗文读音（no 16）
- 菜单：`pinyin/data.js` 末尾加 `gushidu`（no 16，group 易错读音），排在审音改读之后；pinyin.js / pinyin.html 没动。
- 内容 `pinyin/content/gushidu.js`：照 duoyin.js 结构（IIFE + `key()` / `flat()` + 表格包装 + `quiz(kind, lv, h, rows)`，`rv:'古诗文读音'`，听音题 `play: key(拼音)`）。
  - 数据只来自 `data/shici.js` 的 pron（Q17 逐首校多音字）+ `tools/content/fix_shici_duyin.py` 写明的出处：`DATA` 夹在 `GEN:gushidu` / `GEN:end` 两行之间，由 **`tools/content/gen_py_gushidu.py`** 生成（幂等，`--check` 有待改时退出 1）。改了诗库 pron 后重跑它。
  - 每条 `{z, py, t, a, ke, g, ce, li, line, fx, rd}`：`li` = 诗库 lines 下标，`fx` = fix_shici_duyin 核过的 7 处的出处（其余空），`rd` = 3500 字库里该字带调读音（选项用）。小池「头」pron 已删、回落主音 tóu，按 fix 脚本出处收进来。
  - 不收：争议项 `SKIP`（鹿柴「返景」jǐng/yǐng、一剪梅「罗裳」shang、酬乐天「前头」tou，不下结论，只在 L3 说明里一句「课本未注音、各家说法不一，先不收」点到返景）；轻声 pron（两首「燕子」zi）。`/workspace/work/duyin-src/gushi_readings.json` 不存在，未用；鹿柴诗题「柴 zhài」不在 pron 里，未收。
  - 看：一二年级（L1，9 处）/ 三四年级（L2，15）/ 五六年级（L2，21）课内表；「课本是这样注的」7 处带依据（L2）；拓展诗词按字归并（L3，84 处 31 行）；叶音说明（L3）。听读：chips L1/L2/L3 + pairs（课本注音 vs 另一个读音，3 对）。练：pick L1（8）/ pick L2（34）/ hear L2（41，是/不是）/ wrong L2（41）/ pick L3（81）。用：诗里的词 8 + 课本核过的词 6（每个带 `t` 诗题），整首《春晓》《回乡偶书》（verse 带 `poem`）——「用」取诗库原诗，不是自编。
  - `C.zidu` = 全部 129 条；另挂 `C.gushi`（= DATA）、`C.gushiSkip`（= SKIP）供校验。
- `tools/check_pinyin_content.js` 第 6 条：`gushi` 与诗库 pron 逐条对账（诗题 / 行 / 字 / 读音一致；每条带调 pron 都收了或在 gushiSkip；争议项不得出现；pron 已删的须有 fx 且等于查表主音）；「用」里带 `t` 的词语、带 `poem` 的诗句须是原诗原文，诗里注过的字读音一致。已用改坏的副本验证会报错（读音不符 / 漏收 / 原文不符）。
- 测试：tests/duyin.spec.js `CARDS` 加 gushidu、菜单顺序断言 17 项、gushidu 表里不出现「返景入深林」，新增一例跑 `gen_py_gushidu.py --check` 并核春晓 jué、两处衰 shuāi、小池 tóu、争议不收、rv 统一；smoke 拼音卡数 15→16。
- 没做：易读错的字依据标签复核（另一任务）；Q6 字库主读音没动；争议三处待负责人定，定了以后改 data/shici.js pron（或 fix_shici_duyin.py），把对应项从 gen_py_gushidu.py 的 `DISPUTE` 去掉再重跑。

