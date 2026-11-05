#!/usr/bin/env python3
"""F6（G 组）：家族含义 fm 古义/生僻义（bushou_ui.md 第 5 节点名条目）+ 变体说明/说文用语（第 11 节）。幂等。
fm 改取现代常用义，且和部首义相关（依《现代汉语词典》第7版 / 汉典 zdic.net 现代义项）：
  扌:扯 拉、撕 · 扔 抛出去 · 扣 套住、扣上 · 摄 拍摄、吸取；木:李 李树、李子；石:磁 磁铁、能吸铁；
  酉:配 搭配、配合（报告建议）；口:呕 吐；宀:守 看守、守护；贝:贿 用钱物收买；丷:单 单个、一个；
  香:香 气味好闻；幺:幻 虚幻、不真实；冂:网 捕鱼捉鸟的工具（原「网」循环释义）。
第 11 节：方 meaning「并船」（《说文》古义，孩子看不懂、和例字无关）→「方向、四方、方正」；
  已 bianti「已是"巳"的索引字头」（数据加工术语）→ 区分已/巳/己 字形；已的说文原是「巳」的说解，张冠李戴，清空；
  旡 shuowen 去掉混进引文的编者注「(今變隸作旡。)」。
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fix_bushou_ui_lib import load, save
P = os.path.join(os.path.dirname(__file__), '..', '..', 'bushou', 'data.js')
D, fmt = load(P)
FM = {('扌','扯'):'拉、撕', ('扌','扔'):'抛出去', ('扌','扣'):'套住、扣上', ('扌','摄'):'拍摄、吸取',
      ('木','李'):'李树、李子', ('石','磁'):'磁铁、能吸铁', ('酉','配'):'搭配、配合', ('口','呕'):'吐',
      ('宀','守'):'看守、守护', ('贝','贿'):'用钱物收买', ('丷','单'):'单个、一个', ('香','香'):'气味好闻',
      ('幺','幻'):'虚幻、不真实', ('冂','网'):'捕鱼捉鸟的工具'}
n = 0
for r in D:
    fm = r.get('fm') or {}
    for (b, z), v in FM.items():
        if r['bushou'] == b and z in fm and fm[z] != v: fm[z] = v; n += 1
    if r['bushou'] == '方' and '并船' in (r.get('meaning') or ''):
        r['meaning'] = '方：方向、四方，也指方正。'; n += 1
    if r['bushou'] == '已' and '索引字头' in (r.get('bianti') or ''):
        r['bianti'] = '已、巳、己长得像：已半封口，巳全封口，己不封口。'; r['shuowen'] = ''; n += 1
    if r['bushou'] == '旡' and '(今變隸作旡。)' in (r.get('shuowen') or ''):
        r['shuowen'] = r['shuowen'].replace('(今變隸作旡。)', '').strip(); n += 1
save(P, D, fmt)
print('改', n, '处')
