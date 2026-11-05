#!/usr/bin/env python3
"""多音字漏读音检查：小学常考多音字（人工清单，依据《现代汉语词典》第7版常用读音）对照字卡 读音.拼音+罕用读音。
用法：python3 /workspace/work/hanzi-audit/scripts/zika_polyphone.py"""
import json
A = json.load(open('/workspace/work/hanzi-audit/scripts/zika_all.json')); C = A['cards']
P = """行 xíng háng|长 cháng zhǎng|乐 lè yuè|重 zhòng chóng|还 hái huán|得 dé de děi|地 dì de|的 de dí dì|了 le liǎo|着 zhe zháo zhuó zhāo|好 hǎo hào|为 wéi wèi|发 fā fà|传 chuán zhuàn|种 zhǒng zhòng|数 shù shǔ shuò|少 shǎo shào|便 biàn pián|会 huì kuài|调 diào tiáo|朝 cháo zhāo|空 kōng kòng|背 bèi bēi|藏 cáng zàng|处 chù chǔ|当 dāng dàng|倒 dǎo dào|弹 tán dàn|担 dān dàn|斗 dòu dǒu|恶 è wù ě|分 fēn fèn|干 gān gàn|更 gēng gèng|号 hào háo|和 hé hè huó huò hú|横 héng hèng|划 huá huà|几 jǐ jī|假 jiǎ jià|间 jiān jiàn|将 jiāng jiàng|角 jiǎo jué|觉 jué jiào|卡 kǎ qiǎ|看 kàn kān|累 lèi lěi léi|量 liàng liáng|露 lù lòu|落 luò là lào|没 méi mò|难 nán nàn|曲 qū qǔ|散 sàn sǎn|似 sì shì|宿 sù xiǔ xiù|相 xiāng xiàng|兴 xīng xìng|要 yào yāo|应 yīng yìng|载 zài zǎi|正 zhèng zhēng|中 zhōng zhòng|转 zhuǎn zhuàn|作 zuò zuō|参 cān shēn cēn|降 jiàng xiáng|薄 báo bó|冲 chōng chòng|称 chēng chèn|盛 shèng chéng|系 xì jì|吓 xià hè|夹 jiā jiá|尽 jìn jǐn|卷 juǎn juàn|扎 zhā zā zhá|涨 zhǎng zhàng|只 zhī zhǐ|结 jié jiē|给 gěi jǐ|血 xuè xiě|削 xiāo xuē|钻 zuān zuàn|都 dōu dū|差 chà chā chāi|场 chǎng cháng|大 dà dài|奇 qí jī|舍 shě shè|省 shěng xǐng|识 shí zhì|待 dài dāi|屏 píng bǐng|模 mó mú|片 piàn piān|漂 piāo piǎo piào|强 qiáng qiǎng jiàng|切 qiē qiè|圈 quān juàn|塞 sāi sè sài|色 sè shǎi|刹 shā chà|晃 huǎng huàng|鲜 xiān xiǎn|旋 xuán xuàn|咽 yān yàn yè|择 zé zhái|炸 zhà zhá|禁 jìn jīn|劲 jìn jìng|仇 chóu qiú|供 gōng gòng|冠 guān guàn|哄 hǒng hōng hòng|教 jiāo jiào|解 jiě jiè xiè|乘 chéng shèng|泊 bó pō|剥 bāo bō|埋 mái mán|闷 mēn mèn|蒙 méng mēng měng|宁 níng nìng|奔 bēn bèn|扇 shān shàn|晕 yūn yùn|悄 qiāo qiǎo|葛 gé gě|澄 chéng dèng|露 lù lòu|挣 zhèng zhēng|折 zhé zhē shé|似 sì shì|喝 hē hè|几 jǐ jī|铺 pū pù|兴 xīng xìng|没 méi mò|处 chù chǔ|恶 è wù|还 hái huán|creat 0"""
out = []
for item in P.split('|'):
    z, *rs = item.split()
    if z not in C: continue
    have = set(x.strip() for x in (C[z]['dim']['读音'].get('拼音', '') + ',' + (C[z]['dim']['读音'].get('罕用读音') or '')).replace('·', '').split(',') if x.strip())
    miss = [r for r in rs if r not in have]
    if miss: out.append((z, C[z]['dim']['读音'].get('拼音'), C[z]['dim']['读音'].get('罕用读音'), miss))
for o in out: print(*o, sep='\t')
print('命中', len(out))
