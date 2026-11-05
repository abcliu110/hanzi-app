# 交接 · 语法白板第 2 期 · 03h 回炉「兼语句」

文件：`newhanzi/wb/s/gj_jianyu.js`（5 幕 → 9 幕）；STRICT 加入「兼语句」（R1 / R7 错误级）。基线只重拍本项。
动词色施事：现文件已无 `col:'verb'` / 词类色标角色（第 1 期换色后只剩 `col:'cmp'` 对照色箭头说明「谁吃」，不是角色标注）；兼语的「一身两职」改为上方 `tag`（`{t:jianyu|kid}`）。

## 改了什么
| # | 幕 | lv | 新/旧 | 说明 |
|---|---|---|---|---|
| 1 | 是什么（title） | – | 旧 | 不变 |
| 2 | 两句并一句（morph） | 1 | 新 | 我请他。他吃饭。→ 我请他吃饭：第二个「他」淡出；第一个「他」上方 tag「一身两职」✓ |
| 3 | 看例句（mark + 箭头） | 2 | 旧 | lv 补 2 |
| 4 | 兼语和连动（vs） | 2 | 旧 | lv 补 2 |
| 5 | 常用的词（cards） | 2 | 旧 | lv 补 2 |
| 6 | “没”放哪儿（morph，失败变换） | 2 | 新 | 妈妈没让我看电视 → 妈妈让我没看电视 ✗ 抖动、退回（data.js「否定词放动词1前面」） |
| 7 | 改对了吗（review） | 2 | 新 | 我请小王。小王唱歌。→ 同学写「我请小王他唱歌」✗（多了「他」，diff.extra）→ 我请小王唱歌 |
| 8 | 抓住人，还是一件事（vs） | 3 | 新 | 我请他吃饭（「请」后不能停）/ 我知道：他吃过饭了（「知道」后能停）——兼语句与小句作宾语的区别 |
| 9 | 口诀（end） | – | 旧 | 不变 |

- 旧知识点全保留：定义、兼语、与连动句区别、请/让/叫/使/派、使偏书面让偏口语。新例句自编。
- 初版 lv1 幕两个「他」各挂 tag，第二个块淡出后 tag 残留与第一个重叠；改为只给保留的「他」挂 tag（morph 的 tag 挂在块上，块淡出时 tag 不淡出——引擎行为，记为已知问题）。

## L3 src 与核实
| src | 核实程度 | URL |
|---|---|---|
| 吕叔湘《现代汉语语法要点》（《现代汉语八百词》卷首）3.2(6) 兼语句：「动 1 后边不能停顿，这是兼语句和小句作宾语句的区别」 | 原文已核（cankao B10，《吕叔湘全集》第五卷扫描本 OCR） | https://bartos.web.elte.hu/lsx-babaici.pdf |
| 刘月华等《实用现代汉语语法》增订本 第四编第二章第四节「兼语句」p.708 | 目录已核（页码据书目站，cankao A4） | https://resources.allsetlearning.com/chinese/grammar/Reference:%E5%AE%9E%E7%94%A8%E7%8E%B0%E4%BB%A3%E6%B1%89%E8%AF%AD%E8%AF%AD%E6%B3%95 |
| 黄廖增订六版下册第四章第六节「二、几种常用句式」 | 目录已核；「兼语句与主谓短语作宾语：第一个动词后兼语句不能停顿」见据黄廖增订六版的笔记（二手） | https://book.douban.com/subject/27094401/ ；http://freekaoyan.com/note/record/2022/01-16/1642316741537885.shtml |

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
python3 tools/wb/check_wb.py --lint 兼语句                                  # 0 错误
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 兼语句        # 700/1100 全过，9 幕 202 秒
python3 tools/wb/baseline.py --only 兼语句 --write && python3 tools/wb/baseline.py --skip 兼语句   # 569 幕一致
```

## 已知问题
- morph：不在 `to` 里的块淡出时，挂在它上面的 tag / 外框不淡出（引擎 `arrange` 只淡出字块）。本项绕开；以后修引擎需重拍用到该情形的项。
- 「妈妈让我没看电视」判 ✗ 依据 data.js「否定词放动词1前面」；「让我不看电视」另有意思（让我别看），本幕用「没」避开。

## 下一步
- 03i 话题句（施事/受事/话题 tag；L3 按 cankao B8：有的话题放不回去）。
