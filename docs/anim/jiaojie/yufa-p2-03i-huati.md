# 交接 · 语法白板第 2 期 · 03i 回炉「话题句」

文件：`newhanzi/wb/s/gj_huati.js`（5 幕 → 8 幕）；STRICT 加入「话题句」（R7 错误级）。基线只重拍本项。
角色标签：原 `mark` 幕用 `col:'acc'/'cmp'` 下划线标「话题 / 做事的人」，全部改为上方 `tag`（`{t:huati|kid}`「说的是什么」、`{t:shishi|kid}`「动手的」、`{t:shoushi|kid}`「被动手的」）；文件里不再有用颜色标角色的写法。

## 改了什么
| # | 幕 | lv | 新/旧 | 说明 |
|---|---|---|---|---|
| 1 | 是什么（title） | – | 旧 | 不变 |
| 2 | 提到前面（morph + 同学错改） | 1 | 新 | 我已经吃了那道菜 → 那道菜，我已经吃了；先演示只搬「菜」、「那道」掉在原地 ✗ → 整块搬 ✓；上方 tag 动手的 / 被动手的跟块走（data.js 例「那道菜，我已经吃了」） |
| 3 | 看例句（mark） | 2 | 改 | 「那部电影」改 tag「说的是什么」；评论下划线、逗号停顿保留 |
| 4 | 放回去试试（test） | 2 | 旧 | lv 补 2 |
| 5 | 话题不一定做事（mark） | 2 | 改 | 「这件事」tag 话题、「你」tag 动手的（原为颜色下划线） |
| 6 | 改对了吗（review） | 2 | 新 | 我看过这本书 → 同学写「这本书看过我」✗（意思反了）→ 这本书，我看过 |
| 7 | 放不回去的话题（morph，失败变换） | 3 | 新 | 水果，我最爱吃草莓 → 我最爱吃水果草莓 ✗：语域式话题放不回去；「放回去试试」只对提上来的话题管用 |
| 8 | 口诀（end） | – | 旧 | 不变 |

- 旧知识点全保留：话题 + 评论、停顿 / 逗号、放回去检验、话题不一定是施事、话题评论要相关。新例句自编（「水果」例取 data.js 分类「水果，我最爱吃草莓」）。
- 按 cankao B8 的提醒：title 的「提到句首」只适用于论元共指性话题，L3 幕补了边界；title 文字未改（正文同此表述，属 data.js 范围）。

## L3 src 与核实
| src | 核实程度 | URL |
|---|---|---|
| 徐烈炯、刘丹青《话题的结构与功能》（上海教育出版社 1998；增订本 2007）第 4 章 4.3 语域式话题（话题与句内成分有论元共指、语域式、拷贝式三类关系） | 目录已核（豆瓣 2018 版）；第 4 章内容见语言所官方简介（原文已核） | https://book.douban.com/subject/30372499/ ；http://ling.cass.cn/keyan/xueshuchengguo/cgtj/202111/t20211108_5372697.html |
| 刘月华等《实用现代汉语语法》增订本 第五编第四章第一节「信息、话题、焦点」 | 目录已核；页码未核 | https://resources.allsetlearning.com/chinese/grammar/Reference:%E5%AE%9E%E7%94%A8%E7%8E%B0%E4%BB%A3%E6%B1%89%E8%AF%AD%E8%AF%AD%E6%B3%95 |

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
python3 tools/wb/check_wb.py --lint 话题句                                  # 0 错误
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 话题句        # 700/1100 全过，8 幕 197 秒
python3 tools/wb/baseline.py --only 话题句 --write && python3 tools/wb/baseline.py --skip 话题句
```

## 待核
- 「我最爱吃水果草莓」判 ✗：「水果草莓」作为并列 / 偏正组合在少数语境可说，本幕按「放回原位」变换失败处理（意思不是原句），旁白只说「放不回去」，不说「这句话错」。

## 下一步
- 03j 给字被动。
