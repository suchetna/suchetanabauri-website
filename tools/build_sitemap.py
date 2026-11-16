"""Rebuild sitemap.xml from every page. Run from the repo root:  python3 tools/build_sitemap.py

<lastmod> is the date the page's own content last changed, as Google asks: the visible text between
the navigation and the footer. Site-wide template edits (footer links, image sizes, scripts, structured
data blocks, the shared end-of-article call to action) don't count. A blog post never shows a date earlier than its published date.
Needs the git history (in a shallow clone, run: git fetch --depth=1000 origin main).
"""
import glob, re, subprocess, datetime, html

S = 'https://suchetanabauri.com'
today = datetime.date.today().isoformat()

def content_text(src):
    """The page's own words: everything between the end of the nav and the footer, tags removed."""
    s = re.sub(r'<(script|style|svg|noscript)\b.*?</\1>', ' ', src, flags=re.S | re.I)
    s = re.sub(r'<aside class="ar-cta.*?</aside>', ' ', s, flags=re.S)  # shared end-of-article call to action
    start = s.find('</header>', s.find('<!-- ============ NAV')) if '<!-- ============ NAV' in s else s.find('<body')
    end = s.find('<!-- ============ FOOTER')
    if end == -1: end = s.find('<footer')
    s = s[max(start, 0):end if end > 0 else len(s)]
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()

def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True).stdout

def lastmod(p, src):
    current = content_text(src)
    when = ''
    for line in git('log', '--format=%H %cs', '--', p).splitlines():
        sha, date = line.split()
        old = git('show', f'{sha}:{p}')
        if not old: break
        if content_text(old) != current: break   # older version had different content: stop
        when = date                               # this commit already had today's content
    if git('status', '--porcelain', '--', p).strip() and (not when or content_text(git('show', f'HEAD:{p}')) != current):
        when = today                              # content edited but not yet committed
    published = re.search(r'<time datetime="([^"]+)"', src)
    return max(filter(None, [when, published.group(1) if published else ''])) or today

pri = {'index.html': '1.0', 'about/index.html': '0.9', 'lets-talk/index.html': '0.8', 'blog/index.html': '0.8', 'work/index.html': '0.8', 'ai-readiness/index.html': '0.8'}
rows = []
for p in sorted(glob.glob('**/index.html', recursive=True)):
    s = open(p, encoding='utf-8').read()
    if 'noindex' in s: continue
    url = S + '/' + (p[:-len('index.html')])
    pr = pri.get(p, '0.7' if p.startswith(('services/', 'blog/')) else '0.6' if p.startswith('work/') else '0.3')
    rows.append((0 if p == 'index.html' else 1, url, lastmod(p, s), pr))
rows.sort()
out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
out += [f'  <url><loc>{u}</loc><lastmod>{l}</lastmod><priority>{p}</priority></url>' for _, u, l, p in rows]
out.append('</urlset>')
open('sitemap.xml', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('sitemap:', len(rows), 'urls')
