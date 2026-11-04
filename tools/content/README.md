# tools/content · 内容数据构建源

| 文件 | 作用 |
|---|---|
| `parse_zibiao_xml.py` | 从统编语文课本 PDF 抽取书后识字表/写字表（按颜色排除蓝色复现字），逐册与“共N个字”核对 |
| `parse_zibiao.py` | 同上，文本模式（用于无颜色信息的旧版 6下 写字表） |
| `zibiao.json` | 抽取结果：12 册识字表/写字表字串、课本标注字数、版本、是否写入 grade_map |
| `build_grade_map.py` | zibiao.json → `newhanzi/data/grade_map.js` |
| `shici_xiaoxue.json` | 统编小学古诗词篇目（册次/版本依据/原文来源/课本核对结果） |
| `build_shici.py` | 古诗库重建：课内篇目补齐与校正、文本清洗、shangxi/shiju 同步 |
| `check_content.js` | 内容校验（全角标点、无括号注释、无异体字、无重复标题、引用完整），由 tools/check_scripts.js 调用 |

课本 PDF 来源（不入库，体积大）：
- 2024 修订版 1上–4上、5上、6上，旧版 4下：https://github.com/hantang/yuwen （docs 分支，国家中小学智慧教育平台电子教材转存）
- 旧版（2019年12月第1版）5下、6下：https://github.com/TapXWorld/ChinaTextbook （小学/语文/统编版）

重跑：下载 PDF 到某目录，命名 1a 1b 2a 2b 3a 3b 4a 4x 5a 6a old_5b old_6b（.pdf），
在该目录执行 `python3 parse_zibiao_xml.py 1a 1b …`，再整理为 zibiao.json，然后 `python3 tools/content/build_grade_map.py`。
