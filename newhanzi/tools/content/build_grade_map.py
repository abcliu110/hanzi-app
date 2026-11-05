#!/usr/bin/env python3
"""生成 newhanzi/data/grade_map.js（字→册次）。
数据：tools/content/zibiao.json（由 parse_zibiao_xml.py 从统编课本 PDF 书后字表抽取，逐册与课本“共N个字”核对一致）。
口径：取「识字表」（会认字），一字取首次出现册；只收 in_grade_map=true 的册（2024 修订版）。
运行：python3 tools/content/build_grade_map.py"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
Z = json.load(open(os.path.join(ROOT, 'tools/content/zibiao.json'), encoding='utf8'))
ORDER = ['1上', '1下', '2上', '2下', '3上', '3下', '4上', '4下', '5上', '5下', '6上', '6下']
gm, meta = {}, {}
for ce in ORDER:
    v = Z['volumes'].get(ce)
    st = {'edition': v['edition'] if v else '', 'mapped': 0}
    if v and v['in_grade_map'] and '识字表' in v:
        for ch in v['识字表']['chars']:
            if ch not in gm:
                gm[ch] = ce
                st['mapped'] += 1
        st['status'] = '已录入（识字表%d字，与课本核对一致）' % v['识字表']['n']
    elif v and v['in_grade_map']:
        st['status'] = '本册课本只有写字表（会写字），无识字表；按“识字表首次出现册”口径不单列（写字表见 xie）'
    else:
        st['status'] = '待核对：2024修订版本册尚未取得，旧版字表已抽取备查（tools/content/zibiao.json），未写入'
    meta[ce] = st
js = '''/* 按年级找字：年级归属表（统编小学语文各册书后「识字表」）。
 * 由 tools/content/build_grade_map.py 生成，勿手改。
 *
 * 来源：统编义务教育教科书·语文（人民教育出版社）各册 PDF 电子教材
 *   （国家中小学智慧教育平台版，经 github.com/hantang/yuwen 转存），
 *   书后识字表按课本脚注排除蓝色复现字；每册字数与表尾“共N个生字”核对一致。
 * 版本：2024 修订版（根据《义务教育语文课程标准（2022年版）》修订）
 *   1上 1下 2上 2下 3上 3下 4上 5上；6上课本只有写字表，不按识字表口径单列。
 * 未录入：4下 5下 6下——修订版下册尚未取得；旧版（2019）字表已抽取在
 *   tools/content/zibiao.json 备查，是否先用旧版待负责人确认。
 * 口径：取识字表（会认），一字取首次出现册；写字表（会写）见 NHZ_GRADE_META.xie。
 * 格式：window.NHZ_GRADE_MAP = { '字': 册次 }，册次取 12 值：1上 … 6下。
 */
'''
xie = {ce: v['写字表']['chars'] for ce, v in Z['volumes'].items() if v['in_grade_map'] and '写字表' in v}
js += 'window.NHZ_GRADE_MAP = ' + json.dumps(gm, ensure_ascii=False, separators=(',', ':')) + ';\n'
js += 'window.NHZ_GRADE_META = ' + json.dumps({'source': '统编语文2024修订版课本书后识字表/写字表（国家中小学智慧教育平台电子教材）', 'basis': '识字表·首次出现册', 'volumes': meta, 'xie': xie}, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'data/grade_map.js'), 'w', encoding='utf8').write(js)
print('mapped', len(gm), {ce: m['mapped'] for ce, m in meta.items()})
