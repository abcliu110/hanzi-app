# 交接 · 语法白板第 2 期 · 03j 回炉「给字被动」

文件：`newhanzi/wb/s/gj_geizi.js`（4 幕 → 9 幕）；STRICT 加入「给字被动」。基线只重拍本项。
引擎小修（`newhanzi/wb/wb-engine.js` morph `arrange`）：整块不在新排版里而淡出时，挂在块上的 tag / 外框一起淡出，块回来时再显出（03h 记的已知问题）。改后全量基线 577 幕一致（除本项），`selftest.py` 通过。

## 改了什么
| # | 幕 | lv | 新/旧 | 说明 |
|---|---|---|---|---|
| 1 | 是什么（title） | – | 旧 | 不变 |
| 2 | 被换成给（morph） | 1 | 新 | 我的钱包被偷了 → 我的钱包给偷了 ✓；「我的钱包」整块、上方 tag「被动手的」 |
| 3 | 换成“被”（vs） | 2 | 旧 | lv 补 2 |
| 4 | 不是“送给”（mark） | 2 | 改 | 「杯子」承受者由颜色下划线改为 tag「被动手的」 |
| 5 | 跟在“叫、让”后面（morph） | 2 | 新 | 他叫老师批评了一顿 → 他叫老师给批评了一顿 ✓（data.js 深讲例） |
| 6 | 两个“给”挨着（morph，失败变换） | 2 | 新 | 叫 → 给：他给老师给批评了一顿 ✗ 抖动、退回（规范 §10 已记「两个给连用不规范」） |
| 7 | 改对了吗（review） | 2 | 新 | 我的手机被摔坏了 → 同学写「我的手机给摔」✗（丢了结果）→ 我的手机给摔坏了 |
| 8 | “给”管不管被动（morph + roleTo） | 3 | 新 | 我把钱包给弄丢了（把字句里也有给）→ 钱包给弄丢了；施事 tag 随「我」淡出，钱包画主语线：位置主语、角色受事 |
| 9 | 口诀（end） | – | 旧 | 不变 |

- 旧知识点全保留：口语用给 / 书面用被、给是被动标记不是送给。新例句自编。

## L3 src 与核实
| src | 核实程度 | URL |
|---|---|---|
| 吕叔湘主编《现代汉语八百词》（增订本 1999）「给」条〔助〕：直接用在动词前，用于被动句、非被字句，也用于把字句 | 原文已核（第三方词典转录，无页码；cankao B9） | http://cd.mdict.net/j828.html |
| 朱德熙《语法讲义》13.5「给」p.179 | 目录已核（页码据书目站，cankao A3） | https://book.douban.com/subject/1134199/ |
| 复核用（未写进 src）：李宇明、陈前瑞《北京话“给”字被动句的地位及其历史发展》，《方言》2005 年第 4 期 | 摘要已核 | http://cqvip.com/QK/81953X/200504/21021262.html |

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
python3 tools/wb/check_wb.py --lint 给字被动                                # 0 错误
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 给字被动      # 700/1100 全过，9 幕 207 秒
python3 tools/wb/baseline.py --only 给字被动 --write && python3 tools/wb/baseline.py --skip 给字被动   # 577 幕一致
python3 tools/wb/selftest.py
```

## 待核
- 回练「动词后要带结果」依据吕叔湘《现代汉语语法要点》被动句注「动词一般不是一个简单的动词」（cankao B 补，原文 OCR 已核），用于「给」字句属类推。

## 下一步
- 高级句式 10 项 L3+回练写进 `docs/yufa-neirong/l3-huilian.json`（批「高级句式」），跑 `node tools/content/check_yufa_neirong.js`；第 2 期阶段小结。
