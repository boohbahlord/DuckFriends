"""Stamps a version on every script and the stylesheet in index.html, so a visitor's browser never mixes old and new
files after an update (GitHub Pages lets browsers keep files for 10 minutes). Run it before each commit that changes
css/ or js/:  python3 tools/stamp.py  (the version is the date and time, UTC)."""

import hashlib, json, os, re, time

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

# Single Player (the owner's, Nov 18): the installed app keeps every file on the device (sw.js). The scripts and the
# stylesheet carry their version in index.html; everything else is listed here with a short fingerprint of its bytes,
# so the app only downloads a file again when it really changed.

kept = {}
for top in ["assets", "manifest.webmanifest"]:
    path = os.path.join(root, top)
    walk = (
        [(os.path.dirname(path), [], [top])]
        if os.path.isfile(path)
        else [(d, [], fs) for d, _, fs in os.walk(path)]
    )
    for d, _, fs in walk:
        for f in fs:
            if f.endswith(".md"):
                continue
            full = os.path.join(d, f)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            kept[rel] = hashlib.sha1(open(full, "rb").read()).hexdigest()[:10]
listing = os.path.join(root, "offline.json")
open(listing, "w", encoding="utf-8").write(
    json.dumps({"v": v, "files": dict(sorted(kept.items()))}, indent=0) + "\n"
)
print("stamped", v, len(mods), "modules,", len(kept), "files for Single Player")
