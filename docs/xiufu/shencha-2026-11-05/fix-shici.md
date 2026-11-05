# F3 古诗词修复线 · 交接日志（fix-shici）

- 线名：shici（F3 古诗）；负责文件：`newhanzi/data/shici.js`、`data/shiju.js`、`data/shangxi.js`、`quiz/data_shici.js`、`games/shici/**`
- 问题清单：`docs/xiufu/shencha-2026-11-05/shici.md`（下称「报告」）
- 工具：`tools/content/fix_shici_io.py`（单行 JSON 数据文件读写，往返字节一致）；各批次脚本 `tools/content/fix_shici_b*_*.py`（幂等，可重复运行）
- 复查：把审查脚本复制到别处、`snap` 指向工作副本后跑 `sh scripts/shici_run_all.sh`（本线用 `/workspace/work/shici-scan/`，snap→fix-shici）

## 已修

### 批次1 · 原文确错 + 题库/飞花令/逐句讲同步课内版本（报告 §1、§10、§2 部分）
脚本 `tools/content/fix_shici_b1_sync.py`
- 诗库原文校正（加字段 `textFix` 标记）：
  - 醉花阴「把洒→把酒」；登高「衮衮→滚滚」；相思「秋来发故枝→春来发几枝」；闻王昌龄左迁龙标「随风→随君」（统编七上课本作「随君」）；
  - 茅屋为秋风所破歌整首换成古诗文网通行本（原文断句错位、「倚仗/骄儿/床床/度江」等错字），24 句不变。
  - 出处：古诗文网 shiwenv_324219410b89 / eeb217f8cb2d / f324eea45183 / m.gushiwen.cn shiwenv_62280919c9c5 / 8e9ecc95d6a4。
- 题库（所有模式，找错题的错句本身除外）、飞花令 500 首：与诗库只差 1–2 字的句子改成诗库版本（课内篇全改；拓展篇只改异体字或本次已校正的篇目），并按 `variants.json` 清洗异体（劒猨煖沈迳常娥…）。共 36 处句子替换 + 异体清洗；飞花令标题去掉乱码引号。
  - 课内：芙蓉楼「连江/入吴」、枫桥「渔火」（spot#14 的 exp/fix 一并改「火」）、江雪「径」、黄鹤楼「碧空」、早发白帝城「啼不住」、望天门山「至此回」、嫦娥「嫦/沉」、凉州词「春风」、别董大「千里」、过故人庄「开轩」、闻官军「剑外」、绝句「两个黄鹂」。
- 逐句讲：早发白帝城、望天门山（译文改「到这里转了个弯」）、过故人庄（「打开窗户」）、子夜吴歌（湄→边；bg 原写成思妇寄衣是秋/冬歌内容，改为罗敷拒太守，依古诗文网 shiwenv_21a94dcfbfa3）、望岳（曾云/「泰山横跨齐鲁」，不再说站在山顶）、相思、醉花阴。
- shiju 字→诗索引按 build_shici.py 第 8 步重建。
- 复查结果：`shici_scan_sync.py` quiz 0、feihua 0、zj 剩 2（白云歌、秋浦歌，归批次3整条重写）。

## 未修 / 断点
（随批次更新）
