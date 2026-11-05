# F2 古文修复线 · 交接日志（fix-guwen）

- 线名：f2（F2 古文）；负责文件：`newhanzi/data/guwen.js`、`data/guwen_knowledge.js`、`newhanzi/guwen/**`、`quiz/data_guwen.js`（及由前两者生成的 `data/guwen_links.js`）
- 问题清单：`docs/xiufu/shencha-2026-11-05/guwen.md`（下称「报告」）
- 工具：`tools/content/fix_guwen_io.py`（15 个题库 / 知识库读写，往返字节一致；`save_banks` 自动重算 total/types 并按题库顺序重建 `quiz/data_guwen.js`；`all_q/drop_q` 同步改知识库「练习」里的题副本）；各批次脚本 `tools/content/fix_guwen_b*_*.py`（幂等，可重复运行）
- 每次改 guwen.js / guwen_knowledge.js 后跑 `python3 tools/content/build_guwen_links.py` 重建 `data/guwen_links.js`
- 复查：审查脚本复制到别处、路径指向工作副本后跑（本线用 `/workspace/work/hanzi-fix/f2/scan/`：`SNAP=<repo>/newhanzi node guwen_load.js > /tmp/f2_guwen_all.json` 后跑各 `guwen_*_scan*.py`）

## 已修

（格式：问题 · 处理 · 数量 · 复查结果）

- B1 题库答案/解析相反 · `fix_guwen_b1_answer.py`：xuci:所「所闻」「所从来」正确项改为「与动词组成‘所＋动词’结构」（原答案「所以表凭借原因」）；「所以传道受业解惑」答案保留，解析改为「所以＝用来……的」与答案一致（含选词填空、知识库例句解析）；「既来之，则安之」的「安」答案改形容词使动用法并移到 huoyong:形容词使动用法（知识库例子/深讲/例句解析/练习同步），删「哪个词属于名词使动[苦,安,难,日]」；xuci:于「取之于蓝」解析改「从」、「青于蓝」表比较；名词作状语例句补「环」（日扳仲永环谒于邑人，《伤仲永》）· 改 9 题、删 1 题、移 1 题 · 复查：6 题逐题核对已与解析一致；guwen_links 30→31 篇（伤仲永例句补字后命中）

## 未修 / 断点
（随批次更新）
