# 交接 · 语法白板第 2 期 · 03f 回炉「双重否定」

文件：`newhanzi/wb/s/gj_shuangfou.js`（5 幕 → 9 幕）；`tools/wb/wblint.py` STRICT 加入「双重否定」。基线只重拍本项。
同一提交：按 `docs/yufa-neirong/cankao.md` B1–B4 的核实结论替换已回炉 4 项的 src（src 不上屏，哈希不变）：
- 把字句：朱德熙《语法讲义》「把」字句一节 → 13.7「把」；删去未核的吕叔湘 1948；加张伯江 2000《语言研究》第 1 期；王力「处置式」标「版本、章节待核」。
- 被字句：黄廖「第五章 语法」（错）→ 下册第四章第六节「二、几种常用句式」；加朱德熙 13.4「被 叫 让」。
- 存现句：范方莲《存在句》期号 → 1963 年第 5 期。
- 是…的句：刘月华「节次待核」→ 第四编第三章第一节「“是……的”句（一）」。

## 改了什么
| # | 幕 | lv | 新/旧 | 说明 |
|---|---|---|---|---|
| 1 | 是什么（title） | – | 旧 | 不变 |
| 2 | 两个“不”落下来（morph） | 1 | 新 | 他会来 → 他不会不来：两个「不」从上方落入并圈出 ✓（意思不变、更肯定） |
| 3 | 算一算（mark） | 1 | 旧 | lv 补 1 |
| 4 | 常见说法（cards） | 2 | 旧 | 不变 |
| 5 | 少一个就反了（morph，失败变换） | 2 | 新 | 大家都喜欢和平 → 没有人喜欢和平 ✗ 抖动、退回；改成「没有人不喜欢和平」（data.js 例子） |
| 6 | 易错（vs，不吃不喝） | 2 | 旧 | 不变 |
| 7 | 改对了吗（review） | 2 | 新 | 用双重否定改写「我一定要帮他」：同学写「我不能帮他」✗（少一个不）→ 我不能不帮他 |
| 8 | 更强还是更软（vs） | 3 | 新 | 他不会不来（更肯定）/ 我不是不想去（更软，留余地） |
| 9 | 口诀（end） | – | 旧 | 不变 |

- 旧知识点全保留：负负得正、不得不 / 不能不 / 不会不、不吃不喝不是双否。新例句自编。
- L3 的意义：正文「语气比必须更强」只对「不会不 / 不得不」类成立；「不是不」类语气反而弱——L3 把这点讲清，不改正文。

## L3 src 与核实
| src | 核实程度 | URL |
|---|---|---|
| 丁声树等《现代汉语语法讲话》（商务 1961）「双重否定……意思上是肯定的，不过跟单纯肯定不全一样」 | 仅二手（原话见 CCL 2022 论文转引；章节页码待核） | https://aclanthology.org/2022.ccl-1.3.pdf |
| 吕叔湘《疑问·否定·肯定》，《中国语文》1985 年第 4 期（「双重否定决不是数学上负乘负得正那样的互相抵销」，1985:247 转引） | 期号已核（cankao B6，语言所吕叔湘年谱）；原话二手 | http://ling.cass.cn/xueren/xzjs/202110/t20211029_5370378_3.html ；转引 https://journal.kci.go.kr/cccs/archive/articlePdf?artiId=ART001253618 |
| 旁证：双重否定「有时高于肯定或低于肯定」，丁声树 1961、吕叔湘、王力、胡裕树、黄廖等都描述了加强和减弱两种功能 | 仅二手（论文摘要） | http://www.abslw.com/36/abs692536.html ；维普「双重否定句都是语气更强语意更重吗」摘要 http://dianda.cqvip.com/Qikan/Article/Detail?from=Qikan_Article_Detail&id=1002533624 |
- 未用：叶文曦 2013（北大《语言学研究》2013(2):20–31，https://ccj.pku.edu.cn/article/info?aid=331299743）摘要未直接写「加强/减弱」，不作结论出处。

## 怎么验证
```bash
export LD_LIBRARY_PATH=/workspace/work/pwlibs/root/usr/lib/aarch64-linux-gnu
python3 tools/wb/check_wb.py --lint 双重否定 把字句 被字句 存现句 是…的句   # 0 错误 0 警告
env -u HTTPS_PROXY -u HTTP_PROXY python3 tools/wb/check_wb.py 双重否定      # 700/1100 全过，9 幕 190 秒
python3 tools/wb/baseline.py --only 双重否定 --write && python3 tools/wb/baseline.py --skip 双重否定   # 560 幕一致
```
截图字体：`~/.fonts/wqy-microhei.ttc`（apt-get download fonts-wqy-microhei 后 dpkg -x），只影响截图，不影响哈希。

## 待核
- 「不吃不喝不是双重否定」暂无权威一手出处（cankao B6），旧幕保留。
- 丁声树原书章节页码。

## 下一步
- 03g 歧义句（morph 分化；两图套盒留第 3 期）。
