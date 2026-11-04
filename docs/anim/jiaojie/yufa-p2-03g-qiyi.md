# 交接 · 语法白板第 2 期 · 03g 回炉「歧义句」

文件：`newhanzi/wb/s/gj_qiyi.js`（5 幕 → 10 幕）；STRICT 加入「歧义句」。基线只重拍本项。
本期只做 **morph 变换分化**；「一句两图」套盒幕（nest + pic）按设计 §9 留到第 3 期补。

## 改了什么
| # | 幕 | lv | 新/旧 | 说明 |
|---|---|---|---|---|
| 1 | 是什么（title） | – | 旧 | 不变 |
| 2 | 换个说法（morph） | 1 | 新 | 鸡不吃了 → 我们不吃鸡了：「鸡」搬到「不吃」后，「我们」落入 ✓（只剩一种意思） |
| 3 | 切分不同（vs） | 1 | 旧 | lv 补 1 |
| 4 | 词义不同（vs） | 2 | 旧 | lv 补 2 |
| 5 | 变一变：说的是老师（morph） | 2 | 新 | 表扬了班长的老师 → 老师表扬了班长 ✓（第一种意思） |
| 6 | 变一变：表扬了谁（morph） | 2 | 新 | 表扬了班长的老师 → 把班长的老师表扬了 ✓（「班长的老师」整块搬；第二种意思） |
| 7 | 怎么消除（steps） | 2 | 旧 | lv 补 2 |
| 8 | 改对了吗（review） | 2 | 新 | 小明说他不去了 → 同学改「小明说他自己不去了」✗（还是指小明）→ 小明说小刚不去了 |
| 9 | 变不过去（morph，失败变换） | 3 | 新 | 写完了作业的同学 → 把作业的同学写完了 ✗：同形短语只有一种意思；「能不能变，就能看出有几种意思」 |
| 10 | 口诀（end） | – | 旧 | 不变 |

- 旧知识点全保留：切分歧义、词义歧义、三种消歧办法、与「表意不明」的关系；指代歧义（data.js 分类）进了回练幕。
- 新例句自编（「表扬了班长的老师」与 data.js「咬死了猎人的狗」同结构，未用学界名例作主例，Q13）。

## L3 src 与核实
| src | 核实程度 | URL |
|---|---|---|
| 陆俭明《现代汉语语法研究教程》第三节「变换分析法」 | 目录已核（cankao A5：第四版 2013 / 第五版 2019 节名一致） | https://book.douban.com/subject/25668889 ；https://m.douban.com/book/subject/34826224/ |
| 黄伯荣、廖序东《现代汉语》增订六版下册第四章第四节「四、多义短语」 | 目录已核 | https://book.douban.com/subject/27094401/ |

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
python3 tools/wb/check_wb.py --lint 歧义句                                  # 0 错误
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 歧义句        # 700/1100 全过，10 幕 217 秒
python3 tools/wb/baseline.py --only 歧义句 --write && python3 tools/wb/baseline.py --skip 歧义句
```

## 已知问题
- review 的错误圈按估宽定位，「他自己」圈略偏左（旧模板既有问题，见 03a）。

## 下一步
- 03h 兼语句（清除动词色施事，改 tag）。第 3 期补「一句两图」nest 幕。
