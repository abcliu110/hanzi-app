# 拼音区 · 10 字卡拼音可点（交接）

日期：2026-11-06（拼音区补厚第 1 路，第 5 项「跳转接入」）

## 改了什么
- `zika.html` 加载 `pinyin/syllables.js`、`syllable.js`、`audio/index.js`、`player.js`（已在 sw CORE 里，CORE 数不变）。
- `zika.js` 字卡顶部拼音：每个读音一个按钮（`.py-play`），点一下播 `pinyin/audio` 真人录音（NHZPinyinAudio，不用 Web Speech）；没有录音的（轻声 men/de 等、叹词）仍是普通文字。读音之间仍用「、」分隔，罕用读音标注不变。
- 下面加一行小字链接（`.py-split`）：第一个读音拆成「声母 + 带调韵母」（整体认读音节显示「整体认读」，零声母显示「零声母 …」），点了去 `pinyin.html?t=pindu`（整体认读去 `?t=zhengti`），同一框内打开。
- `zika.css`：按钮虚线下划线、≥44px 触控；小字链接 44px 高。
- `tests/pinyin.spec.js` 新用例：「佛」两个读音按钮 fó、fú，点 fó 请求 `cmn-fo2.mp3`，拆拼「f + ó」链到拼读页。

## 验证
- `tests/pinyin.spec.js`、`tests/audit-fixes.spec.js` 20/20；smoke/anim3 里字卡相关 10/10。1280 截图看过（`/workspace/work/py-shots-framework/zika-1280.png`，仓库外）。

## 未做 / 需负责人决定
- 字卡「读一读」按钮仍用浏览器 Web Speech 读「字 + 拼音」（原有功能，没动）。按拼音区规则「不用 Web Speech 读单字/声调」，建议改成只播真人音节录音或换成词语录音——要不要改？
- 拆拼链接现在统一去「拼读」页，没有定位到具体声母/韵母（拼音页只支持 `?t=` 到知识点）。
- 字卡在首页 iframe 里打开时，去拼音区是在同一框内跳转（和部首页一致）；返回由 nav-up 处理。
