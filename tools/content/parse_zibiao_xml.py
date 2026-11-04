"""从统编语文课本 PDF（国家中小学智慧教育平台电子版，经 hantang/yuwen 与 TapXWorld/ChinaTextbook 转存）
抽取书后「识字表」「写字表」。蓝色字＝此前已学、作为多音字复现，不计入本册生字（课本脚注说明），按颜色排除。
用法：python3 parse_zibiao_xml.py 1a 1b ...（同目录下 <k>.pdf）输出 zibiao_xml.json"""
import re,json,sys,subprocess,os
import xml.etree.ElementTree as ET
LABEL=re.compile(r'^(语文园地[一二三四五六七八]?|识字|阅读|课文|汉语拼音|习作|我上学了|识字表|写字表|认字表)$')
def isblue(c):
    c=c.lstrip('#'); r,g,b=int(c[0:2],16),int(c[2:4],16),int(c[4:6],16)
    return b>150 and r<120
def parse(k):
    n=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo',k+'.pdf'],capture_output=True,text=True).stdout).group(1))
    xf=f'/tmp/zb_{k}'
    subprocess.run(['pdftohtml','-xml','-i','-q','-f',str(max(1,n-16)),'-l',str(n),k+'.pdf',xf],capture_output=True)
    raw=open(xf+'.xml',encoding='utf8',errors='replace').read()
    root=ET.fromstring(re.sub(r'<(/?)(b|i|a)( [^>]*)?>','',raw))
    fonts={}
    items=[]
    for page in root.iter('page'):
        for el in page:
            if el.tag=='fontspec': fonts[el.get('id')]=(int(el.get('size')),el.get('color'))
            elif el.tag=='text':
                if int(el.get('left'))<0 or int(el.get('left'))>int(page.get('width')): continue  # 跨页重复的影子文本
                t=''.join(el.itertext()); items.append((int(page.get('number')),int(el.get('top')),int(el.get('left')),int(el.get('height')),el.get('font'),t))
    items.sort(key=lambda x:(x[0],x[1],x[2]))
    res={}
    state=None;cur=None
    for pg,top,left,h,f,t in items:
        s=re.sub(r'\s+','',t)
        if s in('识字表','认字表') and fonts[f][0]>=30: state='shi';cur={'new':[],'blue':[],'page':pg};continue
        if s=='写字表' and fonts[f][0]>=30: state='xie';cur={'new':[],'blue':[],'page':pg};continue
        if state is None: continue
        m=re.search(r'（共\s*(\d+)\s*个',t)
        if m:
            cur['stated']=int(m.group(1)); res[state]=cur; state=None; continue
        if h<24 or h>60 or LABEL.match(s): continue  # h>60 为“统编版”水印
        cj=re.findall(r'[\u3400-\u9fff]',t)
        if not cj or '①' in t: continue
        if len(s)>=12 and not re.fullmatch(r'[\d\u3400-\u9fff]+',s): continue
        (cur['blue'] if isblue(fonts[f][1]) else cur['new']).extend(cj)
    out={}
    for kind,v in res.items():
        new=list(dict.fromkeys(v['new'])); blue=list(dict.fromkeys(v['blue']))
        out[kind]=dict(chars=''.join(new),n=len(new),stated=v.get('stated'),blue=''.join(blue),ok=len(new)==v.get('stated'))
        print(k,kind,'new',len(new),'stated',v.get('stated'),'blue',''.join(blue),'OK' if len(new)==v.get('stated') else 'MISMATCH')
    return out
if __name__=='__main__':
    allr={}
    for k in sys.argv[1:]: allr[k]=parse(k)
    json.dump(allr,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'zibiao_xml.json'),'w'),ensure_ascii=False,indent=1)
