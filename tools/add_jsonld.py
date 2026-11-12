import glob,json,re,html
S='https://suchetanabauri.com'
PID=S+'/#person'; WID=S+'/#website'; BID=S+'/#business'
def meta(s,pat):
    m=re.search(pat,s); return html.unescape(m.group(1)).strip() if m else None
person={"@type":"Person","@id":PID,"name":"Suchetana Bauri","alternateName":"Such Bauri",
 "url":S+"/","image":S+"/assets/img/hero-portrait.webp","email":"mailto:hello@suchetanabauri.com",
 "jobTitle":"AI Enablement and Communications Consultant",
 "description":"Communications strategist and AI enablement consultant with 17+ years in corporate, internal and change communications, helping organisations make AI useful and adopt it well.",
 "address":{"@type":"PostalAddress","addressLocality":"Hyderabad","addressRegion":"Telangana","addressCountry":"IN"},
 "alumniOf":[{"@type":"CollegeOrUniversity","name":"Jadavpur University"},{"@type":"CollegeOrUniversity","name":"MICA"}],
 "knowsAbout":["AI enablement","AI readiness assessment","AI workflow design","Change communication","Corporate communications","Internal communications","Employee engagement","Employer branding","Thought leadership","Content strategy","Digital marketing","UX design"],
 "sameAs":["https://www.linkedin.com/in/suchetanabauri","https://x.com/suchetana_bauri","https://www.instagram.com/suchetanabauri.co/","https://medium.com/@suchetana.bauri","https://github.com/suchetna"]}
ref={"@id":PID,"@type":"Person","name":"Suchetana Bauri","url":S+"/"}
website={"@type":"WebSite","@id":WID,"url":S+"/","name":"Suchetana Bauri","inLanguage":"en","publisher":{"@id":PID}}
SVN={'ai-enablement':'AI Enablement','branding':'Branding','communications':'Communications','design':'Design','digital-marketing':'Digital Marketing','thought-leadership':'Thought Leadership'}
def services():
    out=[]
    for p in sorted(glob.glob('services/*/index.html')):
        s=open(p,encoding='utf-8').read()
        out.append((p,SVN[p.split('/')[1]],meta(s,r'<meta name="description" content="([^"]*)"'),meta(s,r'<link rel="canonical" href="([^"]*)"')))
    return out
SV=services()
biz={"@type":"ProfessionalService","@id":BID,"name":"Suchetana Bauri — Communications, AI enablement and design","url":S+"/",
 "image":S+"/assets/img/og-home.jpg","email":"hello@suchetanabauri.com","founder":{"@id":PID},
 "address":person["address"],"areaServed":"Worldwide",
 "hasOfferCatalog":{"@type":"OfferCatalog","name":"Services","itemListElement":[{"@type":"Offer","itemOffered":{"@type":"Service","name":n,"url":u}} for _,n,_,u in SV]}}
def graph(nodes): return {"@context":"https://schema.org","@graph":nodes}
done=0
for p in glob.glob('**/index.html',recursive=True):
    s=open(p,encoding='utf-8').read()
    s=re.sub(r'\n?<script type="application/ld\+json" id="ld">.*?</script>','',s,flags=re.S)
    url=meta(s,r'<link rel="canonical" href="([^"]*)"'); desc=meta(s,r'<meta name="description" content="([^"]*)"')
    title=meta(s,r'<title>([^<]*)'); img=meta(s,r'<meta property="og:image" content="([^"]*)"')
    if p=='index.html': g=[website,person,biz]
    elif p=='about/index.html': g=[website,person,{"@type":"ProfilePage","@id":url+"#page","url":url,"name":title,"mainEntity":{"@id":PID},"isPartOf":{"@id":WID}}]
    elif p.startswith('blog/') and p!='blog/index.html':
        h1=meta(s,r'<h1 class="ar-h1">(.*?)</h1>'); h1=re.sub('<[^>]+>','',h1) if h1 else title.split(' | ')[0]
        date=meta(s,r'<time datetime="([^"]*)"'); sec=meta(s,r'class="tag">([^<]*)')
        mins=meta(s,r'(\d+) min read')
        art={"@type":"BlogPosting","@id":url+"#article","headline":h1,"description":desc,"url":url,"mainEntityOfPage":url,
             "image":img,"datePublished":date,"dateModified":date,"author":ref,"publisher":ref,"inLanguage":"en","isPartOf":{"@id":S+"/blog/#blog"}}
        if sec: art["articleSection"]=sec
        if mins: art["timeRequired"]=f"PT{mins}M"
        g=[art]
    elif p=='blog/index.html':
        posts=[]
        for q in sorted(glob.glob('blog/*/index.html')):
            t=open(q,encoding='utf-8').read(); u=meta(t,r'<link rel="canonical" href="([^"]*)"')
            h=meta(t,r'<h1 class="ar-h1">(.*?)</h1>'); d=meta(t,r'<time datetime="([^"]*)"')
            posts.append({"@type":"BlogPosting","headline":re.sub('<[^>]+>','',h or ''),"url":u,"datePublished":d})
        g=[{"@type":"Blog","@id":S+"/blog/#blog","url":url,"name":title,"description":desc,"author":ref,"blogPost":posts}]
    elif p=='lets-talk/index.html':
        g=[{"@type":"ContactPage","@id":url+"#page","url":url,"name":title,"description":desc,"isPartOf":{"@id":WID},"about":{"@id":PID}}]
    elif p=='services/index.html':
        g=[{"@type":"CollectionPage","@id":url+"#page","url":url,"name":title,"description":desc,"isPartOf":{"@id":WID},"about":{"@id":PID}}]
    elif p.startswith('services/'):
        name=SVN[p.split('/')[1]]
        g=[{"@type":"Service","@id":url+"#service","name":name,"serviceType":name,"description":desc,"url":url,"provider":ref,"areaServed":"Worldwide"}]
    elif p.startswith('work/') and p!='work/index.html':
        g=[{"@type":"CreativeWork","@id":url+"#work","name":title.split(' | ')[0],"description":desc,"url":url,"image":img,"creator":ref}]
    else:
        g=[{"@type":"WebPage","@id":url+"#page","url":url,"name":title,"description":desc,"isPartOf":{"@id":WID},"author":ref}] if url else None
    if not g: continue
    g=[{k:v for k,v in n.items() if v} for n in g]
    blk='<script type="application/ld+json" id="ld">'+json.dumps(graph(g),ensure_ascii=False,separators=(',',':'))+'</script>'
    s=s.replace('</head>',blk+'\n</head>',1); open(p,'w',encoding='utf-8').write(s); done+=1
print('pages',done)
