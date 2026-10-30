"""Stamps a version on every script and the stylesheet in index.html, so a visitor's browser never mixes old and new
files after an update (GitHub Pages lets browsers keep files for 10 minutes). Run it before each commit that changes
css/ or js/:  python3 tools/stamp.py  (the version is the date and time, UTC)."""

import json, os, re, time

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
v = time.strftime("%Y%m%d%H%M", time.gmtime())
page = os.path.join(root, "index.html")
html = open(page, encoding="utf-8").read()
js = os.path.join(root, "js")  # every module, in js/ and its folders (js/hangout/ …)
mods = sorted(
    os.path.relpath(os.path.join(d, f), js).replace(os.sep, "/")
    for d, _, fs in os.walk(js)
    for f in fs
    if f.endswith(".js")
)
imap = {"imports": {f"./js/{m}": f"./js/{m}?v={v}" for m in mods}}
block = (
    '<script type="importmap">' + json.dumps(imap, separators=(",", ":")) + "</script>"
)
if '<script type="importmap">' in html:
    html = re.sub(r'<script type="importmap">.*?</script>', block, html, flags=re.S)
else:
    html = html.replace('<script type="module"', block + '\n<script type="module"', 1)
html = re.sub(r"css/app\.css\?v=[\w]+", f"css/app.css?v={v}", html)
html = re.sub(r"js/main\.js\?v=[\w]+", f"js/main.js?v={v}", html)
open(page, "w", encoding="utf-8").write(html)
print("stamped", v, len(mods), "modules")
