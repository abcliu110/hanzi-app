# F4 · zika-a 字卡上半修复 · 交接日志

范围：`newhanzi/data/index.js` 的 `NHZ_INDEX` 顺序第 1–1750 字（一 … 按笔画排序到约 9 画），只改这些字的 `newhanzi/data/zika/<字>.js`。第 1751–3500 字归 zika-b。
问题清单：`docs/xiufu/shencha-2026-11-05/zika.md`。工具：`tools/content/fix_zika_a_*.py`（`fix_zika_a_lib.py` 负责取本段字表、按原格式读写字卡）。

复查（把审查脚本指向工作副本）：
```bash
mkdir -p /tmp/zs && cp <hanzi-audit>/scripts/zika_{load.js,scan.py} /tmp/zs/
sed -i "s#/workspace/work/hanzi-audit/snap/newhanzi/data#$PWD/newhanzi/data#; s#/workspace/work/hanzi-audit/scripts/zika_all.json#/tmp/zs/zika_all.json#" /tmp/zs/zika_load.js
sed -i "s#BASE = '/workspace/work/hanzi-audit/scripts/'#BASE = '/tmp/zs/'#" /tmp/zs/zika_scan.py
node /tmp/zs/zika_load.js && python3 /tmp/zs/zika_scan.py   # 再按本段字表过滤 zika_hits.json
```

## 已修

| 类别 | 处理 | 数量 | 提交 |
|---|---|---|---|
| 读音/例词硬错 | 拽：删 zhuǎi「神气」义项（拼音无此音，网络/方言用法）、删「扔（近义）」非本字词；讲解去掉编造的《说文》「拽，牵引也」（《说文》无拽字头，卡内说文条是「抴」，加 `说文原字头`=抴）。厂：本义格写「读 hǎn」但拼音没有，`罕用读音` 补 hǎn。拾：易错提示「拾级而上读 shè（古读），今多读 shí，待查」改为「读 shè」（《现代汉语词典》拾 shè：拾级）。本段内其余「读 X」机械命中 48 条逐条看过，都是提示里说的别的字或正确的变调说明，未改。葛、暴、酥、得、澄不在本段（归 zika-b）。 | 3 字 | 见下 |
| 占位语 | `fix_zika_a_placeholder.py`：运用链.文「待查」→ null（63 处）；带「（待查）」的冷僻词删除（182 处）；例句去「（示例）/示例：」前后缀（约 120 处），「这个用法出处待查。」置空；可信度「待查」删键（页面改显示「未标注」，95 字）；义项/形声拆解/易错提示里的「（…待查）」括注与「，待查」尾巴删去（约 85 处）。人工：于、克 本义格改为「气息舒展（《说文》释为“於”）」「能担当（《说文》释为“肩”）」；找 删空本义格；识 删「标识读音以最新版为准（待查）」一条。 | 500 处 / 约 330 字 | 见下 |

## 未修 / 断点
（随批次更新）
