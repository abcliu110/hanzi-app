# 拼音音频来源与许可

## 带调音节 `cmn-{音节}{1-4}.mp3`（1660 个文件，415 个音节 × 四声）

| 项 | 内容 |
|---|---|
| 录音人 | Chen Wang（王琛） |
| 作品 | audio-cmn「syllabs v.2」，zh_syllabs 录音集（SWAC Recorder 录制，2013） |
| 版权声明（嵌在 mp3 标签里） | Copyright © 2013 Wang Chen, Lopez Hugo, Vion Nicolas |
| 项目 | audio-cmn，Hugo Lopez（PLIDAM, INALCO）整理、压缩、命名；Nicolas Vion 录音软件 |
| 来源 | https://github.com/hugolpz/audio-cmn ，目录 `24k-abr/syllabs/`，提交 `f759a0f18f27690742957619e1248ed91e9b3f2c`（2026-10-26） |
| 许可证 | **CC BY-SA 3.0**（知识共享 署名-相同方式共享 3.0）https://creativecommons.org/licenses/by-sa/3.0/ |

### 许可证版本是怎么核实的（2026-11-06）

- 仓库**没有 LICENSE 文件**。README 的 Voices 表和 License 段只写「CC-by-sa」，**没写版本**；README 从 2018-02-01 首次提交到 2026-10-26 最新一次修改，许可写法一直是「CC-by-sa」，git 历史里没有出现过别的版本号。
- 版本号来自**音频文件本身**：每个 mp3 的 ID3 标签里有 `SWAC_COLL_LICENSE=CC-BY-SA-3.0`、`SWAC_COLL_COPYRIGHT=Copyright© 2013 Wang Chen, Lopez Hugo, Vion Nicolas`、`SWAC_SPEAK_NAME=Chen Wang 王琛`。`24k-abr/syllabs/` 1707 个文件里 1703 个带这个标签，值完全一致；没有标签的 4 个（`cmn-_hm1`、`cmn-lo1`、`cmn-peng3`、`cmn-zang3`）是 2026-10-13 提交 `0a3e44a`（Tim Uy，修复杂音）重新编码时丢了标签，不是另一种许可。
- 标签只写「3.0」，没写「Unported」或某个国家版本；按 CC 的习惯，不带地区的 3.0 就是 3.0 Unported。第三方 Taiji 的致谢页也写作 CC BY-SA 3.0 Unported。
- 注意别和 HSK 词语录音（Yue Tan，Shtooka cmn-caen-tan）混淆：那一套是 CC BY-SA 3.0 **United States**。本目录**没有**导入那一套。

### 导入时做了什么

- 码率：`24k-abr`（README：比 64k 小约一半、音质约 80%）。原样复制，没有剪辑、变速、重新编码。
- 没导入：28 个 `_` 开头的文件（普通话里没有的组合：_hm _hng _lvan _m _n _ng _nia）；19 个 `*5.mp3`（a5 … bing5，README v0.1.0 说已删除 5 声，但 24k-abr 目录里还残留 19 个，时长 0.9–5 秒不等，不是可靠的轻声录音）。
- 改名 1 个：源目录没有 `cmn-ju4.mp3`，而有 `cmn-jv4.mp3`（标签 SWAC_TEXT 也是 jv4，就是 jù）。为了和其他 ju 系列一致，复制为 `cmn-ju4.mp3`，内容未改。
- 一共 1660 个文件，约 7.2 MB；清单见 `index.js`（由 `tools/gen_pinyin_audio.py` 生成）。

### 怎么遵守 CC BY-SA

- 署名：拼音页（`pinyin.html`）底部有一行署名和许可证链接；本文件随仓库保存（发布站点时 `*.md` 不打包，所以页面署名是对外的那一份）。
- 相同方式共享：本目录的音频如果将来剪辑、变速、拼接后另存，改过的音频也要按 CC BY-SA 3.0 发布，并保留署名。App 代码只是播放这些文件，不受影响。
- 不加 DRM，不去掉 mp3 里的标签。
- 以上是对许可条款的理解，不是法律意见。

## 声母呼读音 `hudu/{声母}.mp3`

负责人自录（约定见 `hudu/README.md`），版权归负责人。缺失时页面显示「待录音」。

## 以后怎么补

- 64k 高音质：把源仓库 `64k/syllabs/` 同名文件覆盖进来即可（约 17 MB），文件名一致，不用改代码。
- 轻声：audio-cmn 没有轻声单字录音；轻声放在词语里教，词句用 edge-tts 离线生成（另一步）。
