#!/usr/bin/env python3
"""F6（G 组）：常用偏旁表 pianpang.js 例字和归部/字形冲突（bushou_ui.md 第 14 节）。幂等。
规则：例字必须在 `to` 指向的部首条目 chars 里，且偏旁确实在该位置（「口字旁」要口在左、「子字旁」要子在左）。
- 口字旁 问（归门部、口不在左）→ 吹；子字旁 学/字/孝（子在下，字归宀、孝归耂）→ 孔，保留 孩 孙；
- 月字旁 明（归日部，题库 spot 也判「明不属于月部」）→ 肚；王字旁 to 玉→王（玩珠球现理 都在「王」条目）；
- 耳字旁 听/闻（归口/门部，闻的耳在框里）→ 聊；四点底 蒸（归艹）删；禾木旁 香（自成部）删；
- 鸟字旁 鸦（归牙部）删；鱼字旁 渔（归氵）删；舟字旁 舷（3500 外、点不进字卡）删。
末尾用 node 复核：每个例字都在目标部首 chars 里。"""
import os, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'newhanzi')
P = os.path.join(ROOT, 'bushou', 'pianpang.js')
s = open(P, encoding='utf8').read()
R = [
 ('["唱", "唱歌"], ["问", "问题"]', '["唱", "唱歌"], ["吹", "吹风"]'),
 ('["孩", "孩子"], ["学", "学习"], ["字", "写字"], ["孝", "孝顺"], ["孙", "孙子"]', '["孩", "孩子"], ["孙", "孙子"], ["孔", "孔雀"]'),
 ('ex: [["明", "明亮"], ["期", "星期"]', 'ex: [["肚", "肚子"], ["期", "星期"]'),
 ('name: "王字旁", to: "玉"', 'name: "王字旁", to: "王"'),
 ('ex: [["听", "听说"], ["闻", "新闻"], ["聪", "聪明"]', 'ex: [["聪", "聪明"], ["聊", "聊天"]'),
 (', ["蒸", "蒸汽"]', ''), (', ["香", "香气"]', ''), (', ["鸦", "乌鸦"]', ''), (', ["渔", "渔民"]', ''), (', ["舷", "船舷"]', ''),
]
n = 0
for a, b in R:
    if a in s: s = s.replace(a, b); n += 1
open(P, 'w', encoding='utf8').write(s)
chk = subprocess.run(['node', '-e', '''global.window={};require("./bushou/data.js");require("./bushou/pianpang.js");
const D=Object.values(window).find(v=>Array.isArray(v)&&v[0]&&v[0].bushou);const by={};D.forEach(r=>by[r.bushou]=r);
let bad=[];window.NHZ_PIANPANG.forEach(p=>{const r=by[p.to];if(!r){bad.push("缺条目"+p.to);return}
p.ex.forEach(e=>{if(!r.chars.includes(e[0]))bad.push(p.p+":"+e[0])})});console.log(bad.length?"BAD "+bad.join(" "):"OK")'''], cwd=ROOT, capture_output=True, text=True)
print('改', n, '处；复核', chk.stdout.strip(), chk.stderr.strip())
