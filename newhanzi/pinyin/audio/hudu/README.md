# 声母呼读音（待负责人录音）

21 个声母各一条，放在本目录，文件名就是声母本身：

```
b.mp3 p.mp3 m.mp3 f.mp3 d.mp3 t.mp3 n.mp3 l.mp3 g.mp3 k.mp3 h.mp3
j.mp3 q.mp3 x.mp3 zh.mp3 ch.mp3 sh.mp3 r.mp3 z.mp3 c.mp3 s.mp3
```

- 读法：《汉语拼音方案》呼读音（b 玻、p 坡、m 摸、f 佛、d 得、t 特、n 讷、l 勒、g 哥、k 科、h 喝、j 基、q 欺、x 希、zh 知、ch 蚩、sh 诗、r 日、z 资、c 雌、s 思），**又轻又短，0.2–0.3 秒**，不要读成完整的一声音节。
- 格式：单声道 mp3，24–64 kbps 都行；头尾静音剪掉，音量和 `../cmn-*.mp3` 大致一致。
- y、w 不是声母，不录。
- 放进文件后运行 `python3 newhanzi/tools/gen_pinyin_audio.py` 更新清单，页面上对应声母的「待录音」就会变成可点播放。
- 版权：自录，归负责人所有；不受 audio-cmn 的 CC BY-SA 约束。
