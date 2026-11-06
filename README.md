# suchetanabauri.com

Source for Suchetana Bauri's website: communication, AI enablement and design, built for clarity.

Plain HTML, CSS and JavaScript, with no build step, so any static host (including Hostinger's Git deployment) can serve it as-is.

- `index.html`: home page
- `about/index.html`: About page
- `assets/css/site.css`: all styles (scoped to `#top.sbh`)
- `assets/js/site.js`: scroll effects (reveals, timeline, result bars)
- `assets/img/`: optimised greyscale WebP images

Designs live in Figma; pages are built from those frames.

## Structured data

Every page carries a JSON-LD block (`<script type="application/ld+json" id="ld">`) describing the
person, services, blog posts and case studies for search engines and AI assistants. After adding or
editing a page, regenerate it from the repo root:

    python3 tools/add_jsonld.py

It reads each page's title, description, canonical URL, og:image and (for posts) the date and tag,
and replaces the existing block. Social profiles and bio facts live at the top of the script.

## llms.txt and RSS feed

`llms.txt` (a plain-language summary for AI assistants) and `feed.xml` (the blog's RSS feed) are
generated from the pages. After publishing a new post, service or case study, run:

    python3 tools/build_feeds.py && python3 tools/add_jsonld.py

## Search engines

- Sitemap: rebuild after adding pages with `python3 tools/build_sitemap.py` (run it after committing, so dates are right).
- IndexNow key file: `/da26e59ce942459891bec4a444372273.txt`. To tell Bing/Yandex about a new or changed page, open in a browser:
  `https://api.indexnow.org/indexnow?url=PAGE_URL&key=da26e59ce942459891bec4a444372273`
