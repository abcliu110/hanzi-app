# 拼音区 · 08 知识点正式页渲染框架（交接）

日期：2026-11-06（负责人：「算了不做特效。你把内容补厚补强」——不做 3D/悬浮特效）

## 改了什么
- `pinyin.html` / `pinyin.js`：菜单 → 知识点页。点卡片后按需加载 `pinyin/content/<id>.js`（动态 `<script>`），有内容就交给 `pinyin/kp.js` 渲染完整页；文件不存在（或加载失败）就显示 `data.js` 原有简介 + 「完整内容还在写」提示。导航仍是 `NHZNavPage.set(['拼音', 知识点], [showHome, null])`，不用浏览器历史；`?t=<id>` 直达；`&brief=1` 只看 data.js 简介（测试旧芯片用）。
- 新增 `pinyin/kp.js`（`window.NHZPinyinKP.render / stop / level / setLevel / segment`）和 `pinyin/kp.css`。
  - 版式按原型 B1/B2：纵向长页；顶部 sticky 条「看 / 听读 / 练 / 用」段内跳转（scrollIntoView）+ 右上「浅 / 中 / 深」（L1/L2/L3）。默认「中」，选择存 `localStorage['nhz-py-lv']`，换知识点也记住。高档块在低档隐藏，段尾提示「深一点还有 N 块」。页尾显示 `src` 依据。
  - 块类型全部实现（SCHEMA.md 表）：text、chips（play 直接播 / tones 点开四声条 / hudu 呼读音，没录音显示「待录音 · 呼读字」/ 三者都没有 = 静态块，如介母）、groups、table（宽表横向滚动）、pairs、scene（点图字母淡入 + 播呼读音，没有就播词的第一个音节）、mirror、anim、quiz-listen（ask tone/initial/final/syllable；错了给对比听；final 在 j q x 后把 u 还原成 ü 再比）、quiz-choose、quiz-build（不合法组合灰掉并禁用「碰！」，j q x + ü 自动写成 ju）、quiz-mark、quiz-find、words、verse（real 小字 L2 起显示）、outline。
  - 内联 `{py:}`（单个或连写音节都能点，按 GB/T 解析）、`{zi:}`（链 `zika.html?zi=`，与部首页一样在同一框内打开）。选择题选项里的 `{py:}` 只上色不做按钮（避免按钮套按钮）。
  - anim：`tone-road`（声调路：L1 小车+路，L2 路角画调号线条，L3 五度刻度+调值；可换音节、四段连走）；tone-road 变调写法 `params:{from:[3,3],to:[2,3],syl:['ni','hao']}` → 「书上写 / 读的时候」两行小路，点「听」按顺序播放（只有单音节录音，页面已注明）。`bump`：支持内容 A 路约定 `params:{mode:'two'|'three'|'merge'|'direct', steps:[{parts:[{t,play?,hudu?}],result,play}]}`，也支持简写 `params:{items:['bā','guā'],three:true}`；声母块 0.18 秒冲上韵母块、两块不留空，合成后播放；有呼读音文件时先播呼读音。`glide`、`nasal` 暂显示 `fallback` 静态说明。
  - 只播 `pinyin/audio` 真人录音（NHZPinyinAudio），不调用 Web Speech；轻声、儿化音节不可点（儿化不拿基本音节顶替）。尊重 `prefers-reduced-motion`。离开页面时停止音频和动画。
  - 只用护眼 token；按钮 ≥44px；列数用容器查询（`.py-wrap` 是容器）：情境卡/声调路/词语 平板 2 列、桌面 4 列。
- `sw.js` 重新生成（CORE 112 项，新增 kp.js/kp.css）。内容文件按需加载，不进 CORE（首次打开后由 sw 网络优先缓存）。
- `tests/pinyin.spec.js`：旧芯片用例改走 `&brief=1`；新增 5 个用例：内容校验脚本、进声调+四段跳转+切档并记住+听音题判对错+返回、声母 21 个/待录音/碰撞拼读/不合法禁用/j+ü→jú/找一找/镜子、全部块类型 fixture 渲染（含 glide/nasal fallback、三拼、儿化、real）、没有内容文件时显示简介。

## 验证
- `tests/pinyin.spec.js` 11/11；smoke 里 pinyin、sw.js、768 / 1280 全部页面无溢出、页面加载等 110 项通过。
- 当前 12 个内容文件（含其他子任务写的 10 个）在 768 / 1280、L3 下全部渲染：无页面报错、无横向溢出、没有块渲染失败。截图 `/workspace/work/py-shots-framework/`（仓库外）。
- `node tools/check_scripts.js` 全过。

## 已知问题 / 以后
- `glide`（复韵母动程）、`nasal`（前后鼻）动画没做，按负责人「不做特效」先用 fallback 文字；内容 B 路给的 params（items / pairs）已在文件里，以后要做可直接读。
- 呼读音 21 条未录：声母页全部「待录音」，碰撞时只播合成音节。
- L3 下变调小路（mini）里调值数字和刻度略挤，能看清但不精致。
- 「看」段里已实现的 bump 动画不显示 content 的 fallback 文字（fallback 只在动画没实现时用）。
