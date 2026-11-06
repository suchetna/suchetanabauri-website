"""Build llms.txt and feed.xml from the site's pages. Run from the repo root:  python3 tools/build_feeds.py"""
import glob,re,html,datetime
from email.utils import format_datetime
from xml.sax.saxutils import escape
S='https://suchetanabauri.com'
def read(p): return open(p,encoding='utf-8').read()
def meta(s,pat):
    m=re.search(pat,s,re.S); return html.unescape(re.sub('<[^>]+>','',m.group(1))).strip() if m else ''
def page(p):
    s=read(p)
    return dict(title=meta(s,r'<title>([^<]*)').split(' | ')[0], desc=meta(s,r'<meta name="description" content="([^"]*)"'),
                url=meta(s,r'<link rel="canonical" href="([^"]*)"'), h1=meta(s,r'<h1 class="ar-h1">(.*?)</h1>'),
                date=meta(s,r'<time datetime="([^"]*)"'), tag=meta(s,r'class="tag">([^<]*)'), img=meta(s,r'<meta property="og:image" content="([^"]*)"'))
posts=[page(p) for p in glob.glob('blog/*/index.html') if p!='blog/index.html']
posts.sort(key=lambda x:x['date'],reverse=True)
services=[page(p) for p in sorted(glob.glob('services/*/index.html'))]
SVN={'ai-enablement':'AI Enablement','branding':'Branding','communications':'Communications','design':'Design','digital-marketing':'Digital Marketing','thought-leadership':'Thought Leadership'}
for x in services: x['title']=SVN[x['url'].rstrip('/').split('/')[-1]]
work=[page(p) for p in sorted(glob.glob('work/*/index.html')) if p!='work/index.html']

# ---- llms.txt ----
L=["# Suchetana Bauri","",
"> Communications strategist and AI enablement consultant based in Hyderabad, India, with 17+ years in corporate, internal, employee and change communications. She helps organisations make AI useful and adopted well: AI readiness assessments, workflow design, change communication and team enablement, alongside thought leadership, branding, digital marketing and UX/UI design.","",
"Suchetana works remotely with teams worldwide. Education: MA and BA in English Literature (Jadavpur University); PG Certificate in Digital Marketing & Communications (MICA); Google UX Design and Google Digital Marketing & E-commerce certificates.","",
"Contact: hello@suchetanabauri.com or the contact form at https://suchetanabauri.com/lets-talk/","",
"## About",f"- [About Suchetana Bauri]({S}/about/): Background, experience and approach","",
"## Services"]+[f"- [{x['title']}]({x['url']}): {x['desc']}" for x in services]+["",
"## Writing"]+[f"- [{x['h1'] or x['title']}]({x['url']}): {x['desc']}" for x in posts]+["",
"## Selected work"]+[f"- [{x['title']}]({x['url']}): {x['desc']}" for x in work]+["",
"## Elsewhere",
"- [LinkedIn](https://www.linkedin.com/in/suchetanabauri)","- [X](https://x.com/suchetana_bauri)",
"- [Instagram](https://www.instagram.com/suchetanabauri.co/)","- [Medium](https://medium.com/@suchetana.bauri)",
"- [GitHub](https://github.com/suchetna)","",
"## Optional",f"- [Blog RSS feed]({S}/feed.xml)",f"- [Sitemap]({S}/sitemap.xml)",f"- [Privacy policy]({S}/privacy-policy/)",f"- [Terms of service]({S}/terms-of-service/)",""]
open('llms.txt','w',encoding='utf-8').write("\n".join(L))

# ---- feed.xml (RSS 2.0) ----
def rfc(d): return format_datetime(datetime.datetime.fromisoformat(d).replace(hour=9,tzinfo=datetime.timezone(datetime.timedelta(hours=5,minutes=30))))
items=[]
for x in posts:
    items.append(f"""  <item>
    <title>{escape(x['h1'] or x['title'])}</title>
    <link>{x['url']}</link>
    <guid isPermaLink="true">{x['url']}</guid>
    <pubDate>{rfc(x['date'])}</pubDate>
    <dc:creator>Suchetana Bauri</dc:creator>
    {'<category>'+escape(x['tag'])+'</category>' if x['tag'] else ''}
    <description>{escape(x['desc'])}</description>
    {'<enclosure url="'+x['img']+'" type="image/'+('webp' if x['img'].endswith('.webp') else 'jpeg')+'" length="0"/>' if x['img'] else ''}
  </item>""")
feed=f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>Suchetana Bauri — Blog</title>
  <link>{S}/blog/</link>
  <atom:link href="{S}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Writing on AI enablement, communication and design by Suchetana Bauri.</description>
  <language>en</language>
  <lastBuildDate>{rfc(posts[0]['date']) if posts else ''}</lastBuildDate>
{chr(10).join(items)}
</channel>
</rss>
"""
open('feed.xml','w',encoding='utf-8').write(feed)
print(f"llms.txt and feed.xml built: {len(posts)} posts, {len(services)} services, {len(work)} case studies")
