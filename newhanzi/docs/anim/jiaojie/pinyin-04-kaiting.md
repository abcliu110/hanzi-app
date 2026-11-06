# 拼音区 · 04 拼音页可听（交接）

日期：2026-11-06

## 改了什么
- `pinyin/player.js`（`window.NHZPinyinAudio`）：只播 `pinyin/audio/` 里的真人录音，**不用 Web Speech**。先查清单（`pinyin/audio/index.js`），没有的文件不请求。http(s) 下 fetch 整个文件 + Web Audio 解码播放（AudioContext 在点击同步栈里 resume，照顾平板 Safari；整文件 200 响应能被 sw 缓存），file:// 或失败时退回 `<audio>`。`hasSyl/hasHudu/playSyl/playHudu/stop/last`。以后字卡点拼音可以直接复用。
- `pinyin.js` 芯片：
  - 带调芯片（声调页 ā á ǎ à）：点一下直接播。
  - 单韵母、复韵母、鼻韵母、整体认读、y/w（`i → yi` 取箭头后面）：点开下方「四声条」，四个按钮用 `NHZPinyinSyllable.mark` 生成（ā á ǎ à / ǖ ǘ ǚ ǜ / uī…），各播 1–4 声。韵母单念借用零声母音节：i→yi、u→wu、ü→yu、ui→wei、iu→you、ie→ye、üe→yue、in→yin、un→wen、ün→yun、ing→ying，四声条里注明「单念时和音节 wen 读法一样」。再点同一芯片收起；同时只开一个。
  - 声母：有 `hudu/{声母}.mp3` 就可点播放；没有就显示「待录音」、虚线、不可点（现在 21 个全是待录音）。
  - 没有音频的（ong 单念）：虚线、灰字、不可点。
  - 「b/p」「an/ang」这类成对芯片拆成两个芯片，各按自己的规则。
  - 切换知识点/回首页时停止播放。
- `pinyin.html`：样式只用护眼 token（可点＝accent 描边，展开＝accent-soft 底，不可点＝虚线 muted）；按钮 ≥48px；加载 `pinyin/syllables.js`、`syllable.js`、`audio/index.js`、`player.js`。
- `sw.js` 重新生成：CORE 110 项（新增上面 4 个小脚本）；mp3 不进 CORE，按需缓存。
- `tests/pinyin.spec.js` 新用例：四声条、请求到 `cmn-yu3.mp3` / `cmn-a4.mp3`、声母 21 个待录音、ong 不可点、un→wen、整体认读 16 个可点、没调用 speechSynthesis、无页面报错、署名在。

## 验证
- `node tools/check_scripts.js` 全过；`tests/pinyin.spec.js` 6/6；smoke 里 pinyin/溢出/sw/导航相关 15/15。
- 768 和 1280 截图看过：四声条、待录音、署名排版正常，无溢出。

## 未做 / 注意
- 声母呼读音 21 条等负责人录；放进 `pinyin/audio/hudu/` 后跑 `python3 newhanzi/tools/gen_pinyin_audio.py`，芯片自动变可点。
- 没有真机（iPad Safari）实测出声；headless 里确认请求发出、无报错。
- 无头浏览器缺 Noto Sans 时 ǖ 等字形是组合渲染，真机字体正常即可；必要时换字体。
- o 的四声用 audio-cmn `o1–o4`，是否接近「喔」需要人耳听。
- 轻声没有音频（audio-cmn 无轻声），声调页只放了四声。
