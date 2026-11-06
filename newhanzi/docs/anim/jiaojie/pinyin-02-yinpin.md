# 拼音区 · 02 音频导入（交接）

日期：2026-11-06（负责人当天同意音频混合方案：带调音节用 audio-cmn；声母呼读音自录；词句 edge-tts 暂不做）

## 改了什么
- `pinyin/audio/cmn-{音节}{1-4}.mp3`：audio-cmn `24k-abr/syllabs/` 原样复制，**1660 个文件 / 415 个音节 × 四声，约 7.2 MB**（源提交 `f759a0f`）。24k 全量 7.5 MB < 30 MB，所以全部导入，不用按课挑。
  - 没导入：28 个 `_` 开头（普通话没有的组合）；19 个残留的 `*5.mp3`（a5…bing5，时长 0.9–5 秒，不是可靠的轻声）。
  - `cmn-jv4.mp3` → 复制为 `cmn-ju4.mp3`（源目录 ju 只有 1–3 声，第 4 声被命名成 jv4）。
  - 拼写沿用 audio-cmn：ü 写 v（`lv nv lve nve`），ju qu xu yu 系列写 u。
- `pinyin/audio/index.js`（`window.NHZ_PINYIN_AUDIO`）：音节→已有声调、已有的呼读音。由 `tools/gen_pinyin_audio.py` 生成；`--check` 已接进 `tools/check_scripts.js`。页面先查清单，没有的文件不发请求。
- `pinyin/audio/ATTRIBUTION.md`：来源、许可证核实过程、导入时的处理、怎么遵守 CC BY-SA。
- `pinyin/audio/hudu/README.md`：声母呼读音约定 `hudu/{b,p,m,f,d,t,n,l,g,k,h,j,q,x,zh,ch,sh,r,z,c,s}.mp3`，轻短 0.2–0.3 秒；放好后跑 `python3 newhanzi/tools/gen_pinyin_audio.py`。
- `pinyin.html` 底部署名一行（录音人、audio-cmn、CC BY-SA 3.0 链接）。
- `sw.js`：音频**不进 CORE**；`/pinyin/audio/*.mp3` 改为缓存优先、首次播放时下载并缓存（文件内容不变）。CORE 仍 106 项。

## 许可证核实结果
- 仓库没有 LICENSE 文件；README 从 2018 首版到 2026-10-26 最新版都只写「CC-by-sa」，无版本号。
- **版本号在 mp3 标签里**：`SWAC_COLL_LICENSE=CC-BY-SA-3.0`，1707 个文件中 1703 个带标签且一致；另 4 个（`_hm1 lo1 peng3 zang3`）是 2026-10-13 修复杂音时重编码丢了标签。结论：**CC BY-SA 3.0（Unported）**，版权声明 `Copyright© 2013 Wang Chen, Lopez Hugo, Vion Nicolas`。
- HSK 词语录音（Yue Tan）是 CC BY-SA 3.0 US，本次没导入。

## 验证
- `node tools/check_scripts.js`：全过（含音频清单检查）。
- Playwright：pinyin 页无报错、768/1280 无溢出、sw.js 清单最新、拼音导航用例，5/5 通过。

## 未做 / 以后
- 声母呼读音 21 条待负责人录（目前 0/21）。
- 想要更好音质：用源仓库 `64k/syllabs/` 同名覆盖（约 17 MB），不用改代码。
- o 的读音（cmn-o1 是否接近「喔 ō」）需要人耳确认。
- 发布站点 `build_site.py` 不打包 `*.md`，对外署名靠页面底部那一行。
