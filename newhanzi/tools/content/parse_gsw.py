# 古诗文网“小学古诗文”目录（https://www.gushiwen.cn/gushi/xiaoxue.aspx）各诗页面 → gsw_poems.json；在 CONTENT_SRC 目录运行，需先把页面存到 gsw_pages/
import json,re,html,os
lst=json.load(open('gsw_xiaoxue_list.json'))
out={}
for o in lst:
    u=o['url']; key=u.split('_')[-1].replace('.aspx','')
    if key in out: continue
    h=open(f'gsw_pages/{key}.html',encoding='utf8').read()
    m=re.search(r'<div id="zhengwen'+key+r'">([\s\S]*?)<div class="contson" id="contson'+key+r'">([\s\S]*?)</div>',h)
    if not m: print('NOPARSE',key,o['title']); continue
    head,body=m.groups()
    title=html.unescape(re.sub(r'<[^>]+>','',re.search(r'<h1[^>]*>([\s\S]*?)</h1>',head).group(1))).strip()
    src=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',re.search(r'<p class="source">([\s\S]*?)</p>',head).group(1)))).strip()
    dyn=re.search(r'〔(.*?)〕',src); author=src.split('〔')[0].strip()
    body=html.unescape(body)
    body=re.sub(r'<br\s*/?>|</p>','\n',body); body=re.sub(r'<[^>]+>','',body)
    raw=body.strip()
    lines=[l.strip() for l in raw.split('\n') if l.strip()]
    out[key]=dict(key=key,url='https://www.gushiwen.cn/shiwenv_'+key+'.aspx',title=title,author=author,dynasty=dyn.group(1) if dyn else '',raw_lines=lines)
json.dump(out,open('gsw_poems.json','w'),ensure_ascii=False,indent=1)
for k,v in out.items(): print(v['title'],v['author'],v['dynasty'],'|'.join(v['raw_lines'])[:110])
