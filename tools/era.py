"""---------- a map's picture in the old console's limits (notes/map-building-rules.md, "The old console's limits") ----------
I want the maps' worlds to hold to what a texture could on a 32-bit era console: 15-bit color (32 steps a channel), at
most 256 colors in one file (its own palette, like a texture's color table), and see-through in three steps (none,
half, all). The maps keep their look; only what the era couldn't show goes.
  python3 tools/era.py in.png out.webp               (out may be in: done in place)
  python3 tools/era.py in.png out.webp glow.webp [k] (its glows apart, to be added, k as strong: split; prints "glow")
tools/pixel-maps.cjs runs it on every file it makes; tools/pixel-budget.py checks with the same rules. Needs Pillow.
"""

import sys

from PIL import Image

MAX_COLORS = 256
# where see-through turns half and whole (a little higher than the middle: a soft glow keeps its brightest part as a
# half step and lets its faint edge go, as close to the drawing as three steps get)
HALF_FROM, ALL_FROM = 96, 176


def five(v):
    """a channel in 32 steps, as the era's 5 bits widened to 8"""
    k = (v * 31 + 127) // 255
    return (k << 3) | (k >> 2)


def is_five(v):
    k = v >> 3
    return v == (k << 3) | (k >> 2)


def snap(im):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            a = 0 if a < HALF_FROM else 128 if a < ALL_FROM else 255
            px[x, y] = (five(r), five(g), five(b), a) if a else (0, 0, 0, 0)
    return im


def era(im):
    im = snap(im.convert("RGBA"))
    if len(im.getcolors(im.width * im.height)) > MAX_COLORS:
        im = snap(im.quantize(MAX_COLORS, method=Image.FASTOCTREE).convert("RGBA"))
    return im


def split(im, strength=1):
    """a picture's soft light (a glow: see-through and bright) apart from the rest, as the era drew a glow: added to
    what's under it (the PS1's B+F). The glow is kept half see-through, its color twice its light, so added (css
    mix-blend-mode: plus-lighter) it gives back the light; and where nothing is under it to add to, it shows as a half
    step. A soft dark pixel (a shadow) stays with the rest. (rest, glow or None)"""
    im = im.convert("RGBA")
    glow = Image.new("RGBA", im.size)
    px, gx = im.load(), glow.load()
    any_glow = False
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if 8 <= a < ALL_FROM and 0.299 * r + 0.587 * g + 0.114 * b >= 64:
                k = 2 * a / 255 * strength
                gx[x, y] = (
                    min(255, round(r * k)),
                    min(255, round(g * k)),
                    min(255, round(b * k)),
                    255,
                )
                px[x, y] = (0, 0, 0, 0)
                any_glow = True
    if not any_glow:
        return era(im), None
    glow = era(glow)
    gx = glow.load()
    for y in range(glow.height):
        for x in range(glow.width):
            r, g, b, a = gx[x, y]
            if a:
                gx[x, y] = (r, g, b, 128)
    return era(im), glow


if __name__ == "__main__":
    src = Image.open(sys.argv[1])
    if len(sys.argv) > 3:
        rest, glow = split(src, float(sys.argv[4]) if len(sys.argv) > 4 else 1)
        if glow:
            glow.save(sys.argv[3], "WEBP", lossless=True, method=6)
            print("glow")
    else:
        rest = era(src)
    rest.save(sys.argv[2], "WEBP", lossless=True, method=6)
