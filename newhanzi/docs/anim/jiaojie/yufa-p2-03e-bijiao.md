# 交接 · 语法白板第 2 期 · 03e 回炉「比较句」

文件：`newhanzi/wb/s/gj_bijiao.js`（5 幕 → 9 幕）；`tools/wb/wblint.py` STRICT 加入「比较句」。基线只重拍本项。

## 正文疑点（新增设计 §10 Q24，待负责人签字）
`yuwen/data.js`「比较句」讲解 / 辨析写「我没有他高 ≠ 我比他矮（可能一样高）」。核对结果：
- 吕叔湘《现代汉语八百词》（1980:62，转引）：「A 不比 BX」意思是「A 跟 B 差不多」；「A 没有 BX」意思是「A 比 B（－X）」。刘月华（1983:846，转引）：「A 没有 B……」才是「A 比 B……」的否定形式，「不比」的基本句义是 A 跟 B 差不多。
- 转引出处（原文已读）：李丽君《第二语言汉语教学中的“比”字句否定式》，九州大学《言語文化論究》39，2017，pp.33–45：https://catalog.lib.kyushu-u.ac.jp/opac_download_md/1832795/p033.pdf （doi:10.15017/1832795）
- 结论：「可能一样高」属于「不比」，不属于「没有」。本版处理同 Q20 先例：旧幕「“没有”的意思」改为「我没有他高 = 我不如他高，他高一些」，不打 ✗；「差不多高」放进 L3「不比」幕。**data.js 正文已改**（2026-11-05 按负责人“不需要我拍板”授权执行，比较句讲解/深讲/辨析/易错/练习/小测同步 Q24；另修 data_yuwen.js 三道错题：选择题选项、判断题翻转为真、改写题答案改为“他没有我高”）。
- 八百词原书页码未亲见，只记转引页码，标「转引」。

## 改了什么
| # | 幕 | lv | 新/旧 | 说明 |
|---|---|---|---|---|
| 1 | 是什么（title） | – | 旧 | 不变 |
| 2 | 换个说法（morph） | 1 | 新 | 我比他高 → 他没有我高：两人对调、「比」淡出、「没有」落入 ✓（变换判断） |
| 3 | 公式（slots） | 1 | 旧 | lv 补 1 |
| 4 | “没有”的意思（vs） | 2 | 改 | Q24 修正：比 = 我高 / 没有 = 我不如他高，他高一些 |
| 5 | 差多少放哪儿（morph，失败变换） | 2 | 新 | 弟弟比我高半头 → 弟弟比我半头高 ✗ 抖动、退回；数量放形容词后（「高半头」出自 data.js 练习） |
| 6 | 易错（test） | 2 | 旧 | 不用「很」，lv 补 2 |
| 7 | 改对了吗（review） | 2 | 新 | 把「我比他高」改成「没有」句：同学写「我没有他高」✗（意思反了）→ 他没有我高 |
| 8 | “不比”和“没有”（vs） | 3 | 新 | 他没有我高（他矮一些）/ 他不比我高（多是差不多，常用来反驳） |
| 9 | 口诀（end） | – | 旧 | 不变 |

- 旧知识点保留：定义、架子、没有字句、更/还、不用很、自比（口诀 tip）。「没有 ≠ 反过来」按 Q24 更正。
- 新例句全部自编。

## L3 / L2 src 与核实 URL
| src | 核实程度 | URL |
|---|---|---|
| 刘月华、潘文娱、故韡《实用现代汉语语法》（增订本，商务印书馆 2001）第四编第六章「比较的方式」第二节「比较性质、程度的差别、高低」 | 目录已核（章节名一致；页码未核） | https://resources.allsetlearning.com/chinese/grammar/Reference:%E5%AE%9E%E7%94%A8%E7%8E%B0%E4%BB%A3%E6%B1%89%E8%AF%AD%E8%AF%AD%E6%B3%95 ；商务印书馆书页（版次、执笔分工含「比较的方式」）https://www.cp.com.cn/book/7-100-03210-5_04.html |
| 吕叔湘主编《现代汉语八百词》（增订本，商务印书馆 1999）「比」条、「没有」条 | 仅二手（结论见李丽君 2017 转引；八百词书目见社科院语言所页） | http://ling.cass.cn/keyan/xueshuchengguo/cgtj/202112/t20211209_5380579.html |

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu   # 沙箱缺 libatk 等，见下
python3 tools/wb/check_wb.py --lint 比较句        # 0 错误 0 警告
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 比较句   # 700 / 1100 全过
python3 tools/wb/baseline.py --only 比较句 --write && python3 tools/wb/baseline.py --skip 比较句   # 556 幕一致
```
实测：9 幕 182 秒。

## 环境备注
沙箱无 root：Playwright 缺 libatk / libatspi / libXcomposite / libXdamage，用 `apt-get download`（自定 Dir::State::Lists）下载 deb 后 `dpkg -x` 到 `/workspace/work/pwlibs/root`，跑前设 `LD_LIBRARY_PATH`。沙箱无中文字体，总览截图里汉字是方框，只能核对布局。

## 已知问题 / 待核
- Q24 已执行（2026-11-05，负责人授权“不需要我拍板”）；data.js 正文已改，白板 9 幕复核通过。
- 八百词「比」「没有」条原书页码未核。

## 下一步
- 03f 双重否定。
