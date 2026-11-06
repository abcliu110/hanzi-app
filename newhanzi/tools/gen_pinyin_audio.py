#!/usr/bin/env python3
"""生成拼音音频清单 newhanzi/pinyin/audio/index.js（window.NHZ_PINYIN_AUDIO）。

页面先查清单再播放：清单里没有的音节/声母呼读音不发请求，芯片显示为不可点或「待录音」，
不会因为 404 报错。

- 带调音节：pinyin/audio/cmn-{音节}{1-4}.mp3（audio-cmn，Chen Wang，CC BY-SA 3.0，见 ATTRIBUTION.md）
  音节拼写沿用 audio-cmn：ü 写 v（lv nv lve nve），ju qu xu yu 系列写 u。
- 声母呼读音：pinyin/audio/hudu/{声母}.mp3（负责人自录，21 个；缺失的就不进清单）

用法（仓库根或 newhanzi/ 下均可）：
  python3 newhanzi/tools/gen_pinyin_audio.py          # 改写清单
  python3 newhanzi/tools/gen_pinyin_audio.py --check  # 清单与目录不一致时退出码 1
新增/删除音频文件后重跑一次。
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
AUD = os.path.join(ROOT, 'pinyin', 'audio')
OUT = os.path.join(AUD, 'index.js')
INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x',
            'zh', 'ch', 'sh', 'r', 'z', 'c', 's']
FILE = re.compile(r'^cmn-([a-z]+)([1-4])\.mp3$')


def build():
    syl = {}
    bad = []
    for f in sorted(os.listdir(AUD)):
        if not f.endswith('.mp3'):
            continue
        m = FILE.match(f)
        if not m:
            bad.append(f)
            continue
        syl.setdefault(m.group(1), set()).add(m.group(2))
    hdir = os.path.join(AUD, 'hudu')
    have = set(os.listdir(hdir)) if os.path.isdir(hdir) else set()
    hudu = [i for i in INITIALS if i + '.mp3' in have]
    extra = sorted(f for f in have if f.endswith('.mp3') and f[:-4] not in INITIALS)
    data = {
        'base': 'pinyin/audio/',
        'syl': {k: ''.join(sorted(v)) for k, v in sorted(syl.items())},
        'hudu': hudu,
        'huduAll': INITIALS,
    }
    body = ('/* 由 tools/gen_pinyin_audio.py 生成，勿手改。音节录音：Chen Wang（王琛），audio-cmn，CC BY-SA 3.0；'
            '见 pinyin/audio/ATTRIBUTION.md */\nwindow.NHZ_PINYIN_AUDIO = ' +
            json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    return body, data, bad, extra


def main():
    body, data, bad, extra = build()
    nfiles = sum(len(v) for v in data['syl'].values())
    if bad:
        print('✗ 文件名不符合 cmn-{音节}{1-4}.mp3：' + ', '.join(bad)); sys.exit(1)
    if extra:
        print('✗ hudu/ 里有不是 21 个声母的文件：' + ', '.join(extra)); sys.exit(1)
    if '--check' in sys.argv:
        cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if cur != body:
            print('pinyin/audio/index.js 已过期，请运行 python3 newhanzi/tools/gen_pinyin_audio.py'); sys.exit(1)
        print('拼音音频清单最新：%d 个音节，%d 个文件，呼读音 %d/21' % (len(data['syl']), nfiles, len(data['hudu'])))
        return
    open(OUT, 'w', encoding='utf-8').write(body)
    print('pinyin/audio/index.js：%d 个音节，%d 个文件，呼读音 %d/21' % (len(data['syl']), nfiles, len(data['hudu'])))


if __name__ == '__main__':
    main()
