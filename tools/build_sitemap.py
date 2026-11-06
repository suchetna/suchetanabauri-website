"""Rebuild sitemap.xml from every page. Run from the repo root:  python3 tools/build_sitemap.py"""
import glob,re,subprocess,datetime
S='https://suchetanabauri.com'
today=datetime.date.today().isoformat()
def lastmod(p,s):
    m=re.search(r'<time datetime="([^"]+)"',s)
    try: g=subprocess.run(['git','log','-1','--format=%cs','--',p],capture_output=True,text=True).stdout.strip()
    except Exception: g=''
    return max(filter(None,[m.group(1) if m else '',g])) if (m or g) else today
pri={'index.html':'1.0','about/index.html':'0.9','lets-talk/index.html':'0.8','blog/index.html':'0.8','work/index.html':'0.8'}
rows=[]
for p in sorted(glob.glob('**/index.html',recursive=True)):
    s=open(p,encoding='utf-8').read()
    if 'noindex' in s: continue
    url=S+'/'+(p[:-len('index.html')])
    pr=pri.get(p,'0.7' if p.startswith(('services/','blog/')) else '0.6' if p.startswith('work/') else '0.3')
    rows.append((0 if p=='index.html' else 1,url,lastmod(p,s),pr))
rows.sort()
out=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
out+=[f'  <url><loc>{u}</loc><lastmod>{l}</lastmod><priority>{p}</priority></url>' for _,u,l,p in rows]
out.append('</urlset>')
open('sitemap.xml','w',encoding='utf-8').write('\n'.join(out)+'\n')
print('sitemap:',len(rows),'urls')
