"""---------- a map's picture in the old console's limits (notes/map-building-rules.md, "The old console's limits") ----------
I want the maps' worlds to hold to what a texture could on a 32-bit era console: 15-bit color (32 steps a channel), at
most 256 colors in one file (its own palette, like a texture's color table), and see-through in three steps (none,
half, all). The maps keep their look; only what the era couldn't show goes.
  python3 tools/era.py in.png out.webp     (out may be in: done in place)
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


if __name__ == "__main__":
    out = era(Image.open(sys.argv[1]))
    out.save(sys.argv[2], "WEBP", lossless=True, method=6)
