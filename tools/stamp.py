"""Stamps a version on every script and the stylesheet in index.html, so a visitor's browser never mixes old and new
files after an update (GitHub Pages lets browsers keep files for 10 minutes). Run it before each commit that changes
css/ or js/:  python3 tools/stamp.py  (the version is the date and time, UTC)."""

import hashlib, json, os, re, subprocess, time

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

# Preloading (the owner's, Nov 19): a browser finds the game's modules one level at a time (main.js, then what it
# imports, then what those import …), and on a slow phone every level costs a whole round trip. So I list every
# module the game starts with (all that main.js imports, however deep; not the ones loaded later with import()) for
# the browser to ask for at once, the closest to main.js first.
step = re.compile(
    r"^\s*(?:import|export)\s[^;]*?from\s*[\"']([^\"']+)[\"']|^\s*import\s*[\"']([^\"']+)[\"']",
    re.M,
)
order, todo = [], ["main.js"]
while todo:
    m = todo.pop(0)
    if m in order or m not in mods:
        continue
    order.append(m)
    src = open(os.path.join(js, m), encoding="utf-8").read()
    for a, b in step.findall(src):
        to = os.path.normpath(os.path.join(os.path.dirname(m), a or b)).replace(
            os.sep, "/"
        )
        todo.append(to)
pre = "\n".join(f'<link rel="modulepreload" href="./js/{m}?v={v}" />' for m in order)
# … and the rest of the game, which js/later.js asks for once the first screen is up (the owner's, Nov 19): what its
# import()s bring, the closest first, then every other module, so the installed app and a later window find them near
later_src = open(os.path.join(js, "later.js"), encoding="utf-8").read()
todo = [
    os.path.normpath(r).replace(os.sep, "/")
    for r in re.findall(r"import\(\s*[\"']\./([^\"']+)[\"']", later_src)
]
rest = []
while todo:
    m = todo.pop(0)
    if m in order or m in rest or m not in mods:
        continue
    rest.append(m)
    src = open(os.path.join(js, m), encoding="utf-8").read()
    for a, b in step.findall(src):
        todo.append(
            os.path.normpath(os.path.join(os.path.dirname(m), a or b)).replace(
                os.sep, "/"
            )
        )
rest += [m for m in mods if m not in order and m not in rest]
later = json.dumps([f"./js/{m}?v={v}" for m in rest], separators=(",", ":"))
pre += f'\n<script type="application/json" id="df-later">{later}</script>'
pre = "<!-- preload -->\n" + pre + "\n<!-- /preload -->"
if "<!-- preload -->" in html:
    html = re.sub(
        r"<!-- preload -->.*?<!-- /preload -->", lambda _: pre, html, flags=re.S
    )
else:  # (just after the import map: a module asked for before it would miss the map)
    html = re.sub(
        r'(<script type="importmap">.*?</script>)',
        lambda m: m.group(1) + "\n" + pre,
        html,
        count=1,
        flags=re.S,
    )
html = re.sub(r"css/app\.css\?v=[\w]+", f"css/app.css?v={v}", html)
html = re.sub(r"js/main\.js\?v=[\w]+", f"js/main.js?v={v}", html)
open(page, "w", encoding="utf-8").write(html)

# Single Player (the owner's, Nov 18): the installed app keeps every file on the device (sw.js). The scripts and the
# stylesheet carry their version in index.html; everything else is listed here with a short fingerprint of its bytes,
# so the app only downloads a file again when it really changed.

kept = {}
for top in ["assets", "modes", "manifest.webmanifest"]:
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
            # the ducks' part files (tools/duck-parts.cjs): only what the plain duck needs at the usual size, so an
            # installed phone stays small. A duck whose files aren't on the device is made whole, as before
            if rel.startswith("assets/px/ducks/") and not re.match(
                r"assets/px/ducks/32/(index|main|s-rubber)-", rel
            ):
                continue
            kept[rel] = hashlib.sha1(open(full, "rb").read()).hexdigest()[:10]
listing = os.path.join(root, "offline.json")
open(listing, "w", encoding="utf-8").write(
    json.dumps({"v": v, "files": dict(sorted(kept.items()))}, indent=0) + "\n"
)
print(
    "stamped",
    v,
    len(mods),
    "modules,",
    len(order),
    "first,",
    len(rest),
    "after,",
    len(kept),
    "files for Single Player",
)

# I want notes/repomap.md to never go stale, so it is made again on every stamp (tools/repomap.mjs)
try:
    print(
        subprocess.run(
            ["node", os.path.join(root, "tools", "repomap.mjs")],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    )
except (OSError, subprocess.CalledProcessError) as e:
    print("repomap skipped:", e)
