"""---------- a map's picture in the old console's limits (notes/map-building-rules.md, "The old console's limits") ----------
I want the maps' worlds to hold to what a texture could on a 32-bit era console: 15-bit color (32 steps a channel), at
most 256 colors in one file (its own palette, like a texture's color table), and see-through in three steps (none,
half, all). The maps keep their look; only what the era couldn't show goes.
  python3 tools/era.py in.png out.webp               (out may be in: done in place)
  python3 tools/era.py in.png out.webp glow.webp [k] [soft] [light] [#under]   (its glows apart, to be added, k as
          strong, the light under soft see-through and at least light bright, over the color under: split; prints "glow")
tools/pixel-maps.cjs runs it on every file it makes; tools/pixel-budget.py checks with the same rules. Needs Pillow
(and numpy, for the dither).
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


# the era's 4x4 dither (the PS1 dithered as it wrote 15-bit color): an offset under half a step, so a color already on a
# step stays put and only what lies between steps is spread over its two neighbors
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def five_d(v, x, y):
    """a channel (0 to 255, a fraction allowed) in 32 steps, dithered at x, y"""
    return five(max(0, min(255, round(v + (BAYER[y & 3][x & 3] - 7.5) / 2))))


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


# a pixel is part of a smooth blend (a sky's gradient, a soft shade) when a pixel near it differs from it, but by no
# more than this in any channel: there the era's dither spreads it over its two steps, so the blend keeps its smoothness
# instead of breaking in bands. A flat color (nothing near differs) and an edge (one differs by more) stay exact.
SMOOTH_UPTO = 8


def smooth_dither(im):
    """im (RGBA) with each smooth blend's pixels set to their dithered steps (five_d), ready for snap"""
    import numpy as np  # (only here: the checker needs Pillow alone)

    a = np.asarray(im, dtype=np.int16)
    rgb, H, W = a[..., :3], im.height, im.width
    near_most = np.zeros((H, W), np.int16)
    differs = np.zeros((H, W), bool)
    for dy, dx in ((0, 1), (0, 2), (1, 0), (2, 0)):
        for sy, sx in ((dy, dx), (-dy, -dx)):
            o = np.roll(rgb, (sy, sx), (0, 1))
            d = np.abs(o - rgb).max(2)
            differs |= d > 0
            near_most = np.maximum(near_most, d)
    smooth = differs & (near_most <= SMOOTH_UPTO) & (a[..., 3] > 0)
    if not smooth.any():
        return im
    bay = np.array(BAYER, np.float64)
    off = (bay[np.arange(H)[:, None] & 3, np.arange(W)[None, :] & 3] - 7.5) / 2
    v = np.clip(np.round(rgb + off[..., None]), 0, 255).astype(np.int32)
    k = (v * 31 + 127) // 255
    d = (k << 3) | (k >> 2)
    out = a.astype(np.int32)
    out[..., :3] = np.where(smooth[..., None], d, rgb)
    return Image.fromarray(out.astype(np.uint8), "RGBA").copy()


def era(im):
    im = snap(smooth_dither(im.convert("RGBA")))
    if len(im.getcolors(im.width * im.height)) > MAX_COLORS:
        im = snap(im.quantize(MAX_COLORS, method=Image.FASTOCTREE).convert("RGBA"))
    return im


def split(im, strength=1, soft_to=ALL_FROM, light_from=64, under=(0, 0, 0)):
    """a picture's soft light (a glow: see-through under soft_to, and at least light_from bright) apart from the rest,
    as the era drew a glow: added to what's under it (the PS1's B+F; css mix-blend-mode: plus-lighter, a canvas's
    "lighter"). The glow holds its light, its color times its see-through, whole (where it has none it's see-through:
    added, nothing). under: the color mostly under it in the game; where today's picture covered that partly, the glow
    adds only the light above it, so the two look alike. Dithered as the era did, so a faint glow fades smoothly instead
    of in bands: in order (five_d) when that keeps it to MAX_COLORS, else spread (Floyd-Steinberg) over its best
    MAX_COLORS. A soft dark pixel (a shadow) stays with the rest. (rest, glow or None)
    """
    im = im.convert("RGBA")
    light = Image.new("RGB", im.size)
    px, lx = im.load(), light.load()
    lit = set()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if 0 < a < soft_to and 0.299 * r + 0.587 * g + 0.114 * b >= light_from:
                k = a / 255 * strength
                lx[x, y] = tuple(
                    round(max(0, (c - u) * k)) for c, u in zip((r, g, b), under)
                )
                px[x, y] = (0, 0, 0, 0)
                lit.add((x, y))
    if not lit:
        return era(im), None
    glow = Image.new("RGBA", im.size)
    gx = glow.load()
    for x, y in lit:
        gx[x, y] = tuple(five_d(c, x, y) for c in lx[x, y]) + (255,)
    if len(glow.getcolors(glow.width * glow.height)) > MAX_COLORS:
        # its best colors on the era's steps, from the colors it has each counted once (counted by pixels, the faint
        # haze takes them all and a bright core gets a few), one kept for none (black, adding nothing); then each pixel
        # the nearest, with what it misses passed on to its neighbors
        have = [c for _, c in glow.getcolors(glow.width * glow.height)]
        strip = Image.new("RGB", (len(have), 1))
        strip.putdata([c[:3] for c in have])
        pal = strip.quantize(MAX_COLORS - 1, method=Image.MEDIANCUT)
        pal.putpalette(
            [five(c) for c in pal.getpalette()[: 3 * (MAX_COLORS - 1)]] + [0, 0, 0]
        )
        spread = light.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG)
        spread = spread.convert("RGB").load()
        for x, y in lit:
            gx[x, y] = spread[x, y] + (255,)
    return era(im), glow


if __name__ == "__main__":
    src = Image.open(sys.argv[1])
    if len(sys.argv) > 3:
        rest, glow = split(
            src,
            float(sys.argv[4]) if len(sys.argv) > 4 else 1,
            int(sys.argv[5]) if len(sys.argv) > 5 else ALL_FROM,
            int(sys.argv[6]) if len(sys.argv) > 6 else 64,
            (
                tuple(int(sys.argv[7][i : i + 2], 16) for i in (1, 3, 5))
                if len(sys.argv) > 7
                else (0, 0, 0)
            ),
        )
        if glow:
            glow.save(sys.argv[3], "WEBP", lossless=True, method=6)
            print("glow")
    else:
        rest = era(src)
    rest.save(sys.argv[2], "WEBP", lossless=True, method=6)
