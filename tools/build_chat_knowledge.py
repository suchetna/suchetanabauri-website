"""Build api/knowledge.txt, the website assistant's knowledge, from the live pages.

Run from the repo root after adding or changing pages:
    python3 tools/build_chat_knowledge.py
"""
import os, re
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://suchetanabauri.com'


def text_of(path, limit):
    s = BeautifulSoup(open(os.path.join(ROOT, path), encoding='utf-8').read(), 'html.parser')
    title = (s.title.string or '').replace(' | Suchetana Bauri', '').strip() if s.title else ''
    desc = s.find('meta', attrs={'name': 'description'})
    desc = desc['content'].strip() if desc else ''
    for t in s(['script', 'style', 'nav', 'footer', 'svg', 'header', 'form', 'noscript']):
        t.decompose()
    for t in s.select('.ar-notes, .ar-cta, .ar-listen, .m-menu, .bl-topics'):
        t.decompose()
    main = s.select_one('main') or s.body
    body = re.sub(r'\s+', ' ', main.get_text(' ', strip=True))
    body = body.replace('সুচেতনা', '').strip()
    if len(body) > limit:
        body = body[:limit].rsplit(' ', 1)[0] + ' …'
    return title, desc, body


def url_of(path):
    p = path.replace('index.html', '')
    return SITE + '/' + p if p else SITE + '/'


out = []
out.append('# About Suchetana Bauri (from suchetanabauri.com)')
t, d, b = text_of('index.html', 4500)
out.append(f'## Home page\nURL: {SITE}/\n{b}')
t, d, b = text_of('about/index.html', 4500)
out.append(f'## About\nURL: {SITE}/about/\n{b}')

out.append('# Services')
for svc in sorted(os.listdir(os.path.join(ROOT, 'services'))):
    p = f'services/{svc}/index.html'
    if os.path.exists(os.path.join(ROOT, p)):
        t, d, b = text_of(p, 3200)
        out.append(f'## {t}\nURL: {url_of(p)}\nSummary: {d}\n{b}')

out.append('# Case studies and work')
for w in sorted(os.listdir(os.path.join(ROOT, 'work'))):
    p = f'work/{w}/index.html'
    if os.path.exists(os.path.join(ROOT, p)):
        t, d, b = text_of(p, 1400)
        out.append(f'## {t}\nURL: {url_of(p)}\nSummary: {d}\n{b}')

out.append('# Articles (blog)')
for a in sorted(os.listdir(os.path.join(ROOT, 'blog'))):
    p = f'blog/{a}/index.html'
    if os.path.exists(os.path.join(ROOT, p)):
        t, d, b = text_of(p, 600)
        out.append(f'## {t}\nURL: {url_of(p)}\nSummary: {d}')

out.append('# Contact')
out.append('Email: hello@suchetanabauri.com\nContact form: https://suchetanabauri.com/lets-talk/\n'
           'LinkedIn: https://www.linkedin.com/in/suchetanabauri\nBased in Hyderabad, India; works with clients remotely.')

os.makedirs(os.path.join(ROOT, 'api'), exist_ok=True)
txt = '\n\n'.join(out) + '\n'
open(os.path.join(ROOT, 'api', 'knowledge.txt'), 'w', encoding='utf-8').write(txt)
print(f'api/knowledge.txt: {len(txt):,} characters (~{len(txt)//4:,} tokens)')
