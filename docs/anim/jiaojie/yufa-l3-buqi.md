# 交接 · 语法白板「缺 L3」回炉（lint R4）

目标：给没有 lv:3 幕的语法项各补 1 幕 L3（带 src）+ 1 幕回练（review），内容取自 `docs/yufa-neirong/l3-huilian.json` 草稿（虚词精讲 16 项无草稿，先写批次 09）。按类别分批，每批一个提交。
起点：R4 警告 77 项（第 3 期回炉后）。

## 做法（每批相同）
- 引擎：`TPL.test` 加两个可选字段（不影响旧幕哈希）：`size`（词卡字号，默认 38，长句自动缩小，保证 ✓/✗ 不压卡）、`expl`（只念不画的讲解拍，承接内容稿 `say` 的第 2 句起）。
- 嵌入脚本（不入库，`/workspace/work/scratch/embed.py`）：草稿 L3 → `test` lv3：标题 = 草稿 `ask`；行 = 草稿 `ex`（最多 3 行；错句 ✗ 后紧跟改正行 ✓，同幕改正）；`expl` = 草稿 `say[1:]`。草稿回练 → `review` lv2（`good` 过长时按「：」拆成 good + why；「（或……）」备选去掉；`rule` 超 36 字取第一分句）。两幕插在「口诀」前。
- src：草稿里「黄廖增订六版下册「语法」章」统一改写为「下册第四章「语法」+ 对应节」（目录已核，cankao A1 / F）；介词、离合词按 cankao E / 可替换第 21、22 条；八百词条目在 cankao D 已核者去「待核」，未核者标「（条目原文待核）」。

## 批 1：词类 13 项（本提交）
名词 动词 形容词 数词 量词 代词 副词 介词 连词 助词 语气词 叹词 离合词——各 +2 幕（回练 lv2、L3 test lv3）。

| 项 | L3（草稿） | src 核实 | URL |
|---|---|---|---|
| 名词 | 时间、处所名词能直接作状语 | 黄廖第四章第二节（目录已核）；朱德熙第四章「名词 量词」（目录已核） | https://book.douban.com/subject/27094401/ ；https://book.douban.com/subject/1134199/ |
| 动词 | 状态动词不能加「着」 | 八百词「着」条（转录原文已核，cankao D）；朱德熙 5.15 动词后缀 p.68（目录） | http://cd.mdict.net/j779.html |
| 形容词 | 状态形容词不受「很」修饰 | 朱德熙《现代汉语形容词研究》《语言研究》1956 年第 1 期（期号两源已核） | https://jcb.pctj.edu.cn/info/1137/1643.htm ；https://news.pku.edu.cn/info/3021/134631.htm |
| 数词 | 两 / 二 分工 | 八百词「两」「二」条（条目原文**待核**）；韩敬体《二、两和俩、双》（语言所，原文已核） | http://ling.cass.cn/ziyuan/ywtd/ywmt/202111/t20211129_5377741.html |
| 量词 | 按形状挑量词 | 黄廖第四章第二节（目录）；朱德熙 4.12 量词 p.48（目录） | 同上 |
| 代词 | 我们 / 咱们 | 八百词「咱们」条（**待核**）；《现代汉语词典》「咱们」注意（二手转引原文） | https://kanazawa-u.repo.nii.ac.jp/record/5849/files/2-i.pdf |
| 副词 | 副词修饰数量 / 时间名词的例外 | 黄廖（目录）；八百词「才」「已经」条（转录已核，cankao D） | http://cd.mdict.net/j590.html ；http://cd.mdict.net/j487.html |
| 介词 | 介词不能悬空 | 刘丹青 2004《语言研究》第 1 期（摘要已核）；2003 书目录无「悬空」节，不写章节（cankao E） | https://yyyj.cbpt.cnki.net/portal/journal/portal/client/paper/a1e761fa9f246fa9b6e9961c94bcba27 |
| 连词 | 关联副词「就」不是连词 | 黄廖第四章第三节（目录） | https://book.douban.com/subject/27094401/ |
| 助词 | 「们」不与数量词同用 | 八百词「们」条（**待核**） | – |
| 语气词 | 语气词三组与连用顺序 | 朱德熙第十六章「语气词」p.207（目录） | https://book.douban.com/subject/1134199/ |
| 叹词 | 叹词与拟声词 | 黄廖第四章第二节（目录） | 同上 |
| 离合词 | 为什么不能再带宾语 | 赵元任《汉语口语语法》「离子化」；陆志韦等 1957 首提「离合词」（二手多源一致，cankao E） | https://www.cuhk.edu.hk/ics/clrc/crcl_104_1/wanghm.pdf |

验证：
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
python3 tools/wb/check_wb.py --lint 名词 动词 形容词 数词 量词 代词 副词 介词 连词 助词 语气词 叹词 离合词   # 0 错误 0 警告
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 名词 动词 形容词 数词 量词 代词 副词   # 700/1100 全过（两次跑，避开 120 秒限时）
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 介词 连词 助词 语气词 叹词 离合词
L=名词,动词,形容词,数词,量词,代词,副词,介词,连词,助词,语气词,叹词,离合词
python3 tools/wb/baseline.py --only $L --write && python3 tools/wb/baseline.py --skip $L   # 514 幕一致
```

## 断点
- 已做：批 1（R4 77 → 64）。
- 未做：批 2 复句 7、批 3 关联词 13、批 4 修辞格 8、批 5 病句 20（草稿齐）；批 6 虚词精讲 16（先写 l3-huilian 批次 09）。
- 下一步命令：`python3 /workspace/work/scratch/embed.py 并列复句 递进复句 选择复句 转折复句 因果复句 假设复句 条件复句`，然后按上面验证；src 逐条按 cankao F（复句 = 第四章第八节；邢福义《汉语复句研究》核书目）。
- 已知：「介词」项旧幕第 4 幕标签为空（旧问题，非本批引入）。
