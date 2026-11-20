"""Sandbox zone Looks (plan Phase 3): the maps' own ground textures, cut from their pixel ground pictures and made to
tile. Where the ground repeats (planks, checks, tiles) I cut exactly one repeat, found by comparing the picture with
itself shifted; where it doesn't (grass), I mirror the cut four ways so its edges meet. Run from the repo:
python3 tools/bake-looks.py (writes assets/px/looks/<name>.webp)."""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/px/looks"
WORLD = ROOT / "assets/px/world"

# name: (ground picture, left, top, right, bottom of the place to cut from)
CUTS = {
    "cabin-wood": ("cabin-ground", 1100, 900, 1600, 1350),
    "cabin-deck": ("cabin-ground", 1400, 1612, 1900, 1780),
    "cabin-checks": ("cabin-ground", 2010, 815, 2390, 1050),
    "cabin-tiles": ("cabin-ground", 2015, 1065, 2195, 1225),
    "cabin-grass": ("cabin-ground", 520, 1060, 1000, 1440),
    "downpour-grass": ("downpour-ground", 200, 200, 700, 600),
    "downpour-roof": ("downpour-ground", 900, 700, 1500, 1000),
    "downpour-concrete": ("downpour-ground", 900, 1060, 1500, 1320),
    "downpour-church": ("downpour-ground", 1000, 1640, 1160, 2200),
}


def ground(name):
    """a world's ground picture, its bands (tools/pixel-world.cjs) put back together"""
    parts = [
        Image.open(p).convert("RGBA")
        for p in sorted(WORLD.glob(name + "*-*.webp"), key=lambda p: p.name)
    ]
    im = Image.new("RGBA", (parts[0].width, sum(p.height for p in parts)))
    y = 0
    for p in parts:
        im.paste(p, (0, y))
        y += p.height
    return im


def period(a, axis, lo=16, hi=None):
    """the shortest shift along axis that maps the picture onto itself (nearly), or 0"""
    n = a.shape[axis]
    hi = hi or n // 2
    best, bp = None, 0
    for p in range(lo, hi + 1):
        x = np.take(a, range(0, n - p), axis=axis).astype(int)
        y = np.take(a, range(p, n), axis=axis).astype(int)
        d = np.abs(x - y).mean()
        if best is None or d < best - 0.01:
            best, bp = d, p
        if d < 0.25:
            return p
    return 0


def tile(img):
    a = np.asarray(img)
    px, py = period(a, 1), period(a, 0)
    if px and py:
        return img.crop((0, 0, px, py))
    w = min(256, img.width) if not px else px
    h = min(256, img.height) if not py else py
    t = img.crop((0, 0, w, h))
    if not px:
        both = Image.new("RGBA", (w * 2, h))
        both.paste(t, (0, 0))
        both.paste(t.transpose(Image.FLIP_LEFT_RIGHT), (w, 0))
        t, w = both, w * 2
    if not py:
        both = Image.new("RGBA", (w, h * 2))
        both.paste(t, (0, 0))
        both.paste(t.transpose(Image.FLIP_TOP_BOTTOM), (0, h))
        t = both
    return t


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (g, l, t, r, b) in CUTS.items():
        out = tile(ground(g).crop((l, t, r, b)))
        out.save(OUT / f"{name}.webp", lossless=True)
        print(name, out.size)


if __name__ == "__main__":
    main()
