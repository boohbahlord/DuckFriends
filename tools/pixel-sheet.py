# ---------- a map's pixel files on sheets (slimming step 3: the owner's, Nov 20 19:11Z, "how people did 32 bits right
# in the olden days") ----------
# Old consoles kept their small pictures together on a sheet and showed a piece of it. This puts a map's pixel files on
# as few sheets as it can (each at most MAX pixels to a side, the size old devices still take), each piece with its
# edge pixels copied once round it (so a piece shown between screen pixels never takes its neighbour's), every file
# once however often the map shows it, cut to what it shows (its see-through edges left off) unless it's named with a
# ! at its end (a strip of frames: kept whole). Called by tools/pixel-sheets.cjs:
#   python3 tools/pixel-sheet.py <out dir> <file> <file>! …
# writes <out dir>/sheet-<hash>.webp (lossless, as every pixel file) and prints, as JSON, where each file went:
#   { file: [sheet file, x, y, w, h, left, top, W, H] }   (left, top: where the piece starts in the file; W, H: the
#   file's size)
import hashlib
import io
import json
import os
import sys

from PIL import Image

MAX = 2048
PAD = 1  # (the edge copied round each piece: one pixel)


def pack(sizes):
    """shelves, tallest first, on one sheet as near square as the pieces make it: {file: (x, y)}, and its size (None
    when they don't fit on one)"""
    order = sorted(sizes, key=lambda f: (-sizes[f][1], -sizes[f][0], f))
    area = sum((w + 2 * PAD) * (h + 2 * PAD) for w, h in sizes.values())
    widest = max(w for w, _ in sizes.values()) + 2 * PAD
    width = min(MAX, max(widest, int(area**0.5 * 1.05)))
    at, x, y, shelf, W = {}, 0, 0, 0, 0
    for f in order:
        w, h = (v + 2 * PAD for v in sizes[f])
        if x + w > width:
            x, y, shelf = 0, y + shelf, 0
        if y + h > MAX:
            return None, None
        at[f] = (x + PAD, y + PAD)
        x += w
        shelf = max(shelf, h)
        W = max(W, x)
    return at, (W, y + shelf)


def grown(im):
    """the piece with its edge pixels once round it: a row above and below, then a column each side, corners and all"""
    w, h = im.size
    g = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    g.paste(im, (1, 1))
    g.paste(im.crop((0, 0, w, 1)), (1, 0))
    g.paste(im.crop((0, h - 1, w, h)), (1, h + 1))
    g.paste(g.crop((1, 0, 2, h + 2)), (0, 0))
    g.paste(g.crop((w, 0, w + 1, h + 2)), (w + 1, 0))
    return g


def webp(im):
    b = io.BytesIO()
    im.save(b, "WEBP", lossless=True, method=6)
    return b.getvalue()


def main():
    out, args = sys.argv[1], sys.argv[2:]
    whole = {a[:-1] for a in args if a.endswith("!")}
    files = list(
        dict.fromkeys(a.rstrip("!") for a in args)
    )  # (in the map's order: like pieces side by side)
    ims, cut, colors = {}, {}, {}
    for f in files:
        im = Image.open(f).convert("RGBA")
        box = (0, 0, *im.size)
        if f not in whole:
            box = im.getchannel("A").getbbox() or (0, 0, 1, 1)
        if max(box[2] - box[0], box[3] - box[1]) > MAX - 2 * PAD:
            continue  # (a strip too long for a sheet stays its own file: not in what's printed)
        cut[f] = (*box[:2], *im.size)
        ims[f] = im.crop(box)
        colors[f] = {c for _, c in ims[f].getcolors(1 << 24)}
    # each sheet has at most 256 colours, its own palette as an old console's (and as each file had: a sheet past
    # them costs more than its files did), and fits in MAX × MAX: the first sheet each piece fits on
    bins = []
    for f in ims:
        for b in bins:
            if len(b["c"] | colors[f]) <= 256:
                at, _ = pack({g: ims[g].size for g in b["f"] + [f]})
                if at:
                    b["f"].append(f)
                    b["c"] |= colors[f]
                    break
        else:
            bins.append({"f": [f], "c": set(colors[f])})
    placed = {}
    for b in bins:
        if len(b["f"]) < 2:
            continue  # (alone: its own file still)
        at, size = pack({g: ims[g].size for g in b["f"]})
        sh = Image.new("RGBA", size, (0, 0, 0, 0))
        for g, (x, y) in at.items():
            sh.paste(grown(ims[g]), (x - PAD, y - PAD))
        data = webp(sh)
        if len(data) >= sum(os.path.getsize(g) for g in b["f"]):
            continue  # (no smaller than its files: they stay)
        name = (
            os.path.join(out, "sheet-" + hashlib.sha1(data).hexdigest()[:12]) + ".webp"
        )
        with open(name, "wb") as fh:
            fh.write(data)
        for g, (x, y) in at.items():
            placed[g] = [name, x, y, *ims[g].size, *cut[g]]
    print(json.dumps(placed))


main()
