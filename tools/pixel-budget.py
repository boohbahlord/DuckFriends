"""---------- the pixel files against the limits (notes/map-building-rules.md, "The old console's limits") ----------
I want the game to work as if it ran on an old fixed-palette console: few colors, small files, nothing converted at run
time. This lists every pixel file in assets/px with
  - its colors that are not in the game's colors (js/pixelpalette.js PALETTE) or its see-through that is not one of
    the three steps (none, half, all), for the files that hold colors; the maps' worlds and pictures (mapw, maps)
    hold to the era's texture limits instead (tools/era.py: 15-bit color, at most 256 colors a file);
  - files over their size budget, each folder's total against its budget, and the whole total.
Files that hold numbers instead of colors (the ducks' shade sheets, the card masks) are only weighed.
  python3 tools/pixel-budget.py            the report
  python3 tools/pixel-budget.py --list     each file that's off, by name
  python3 tools/pixel-budget.py --strict   exit 1 if anything is off (for a check before a commit)
Needs Pillow."""

import os
import re
import sys
from fnmatch import fnmatch

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from era import MAX_COLORS, is_five  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PX = os.path.join(ROOT, "assets", "px")
KB = 1024

# the budgets (keep them the same as the notes): one file, and each folder's total
FILE_MAX = 384 * KB
FOLDER_MAX = {
    "ducks": 10 * 1024 * KB,
    "mapw": 3 * 1024 * KB,
    "world": 1536 * KB,
    "cards": 384 * KB,
    "art": 256 * KB,
}
FOLDER_DEFAULT = 256 * KB
TOTAL_MAX = 16 * 1024 * KB

# files that hold numbers, not colors: weighed only
DATA = ["ducks/*", "cards/tint.webp", "cards/base.webp"]
# the maps' worlds and pictures: the era's texture limits (tools/era.py) instead of the game's colors
ERA = ["mapw/*", "maps/*"]
ALPHA_STEPS = {0, 128, 255}


def palette():
    src = open(os.path.join(ROOT, "js", "pixelpalette.js"), encoding="utf-8").read()
    part = src.split("PALETTE START")[1].split("PALETTE END")[0]
    return {
        tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))
        for h in re.findall(r'"#([0-9a-fA-F]{6})"', part)
    }


def near(r, g, b, pal):
    """a half see-through pixel is kept by the browser times its see-through, so its color comes back a step or two
    off; it counts as its color when it's that close"""
    return any(
        abs(r - R) <= 2 and abs(g - G) <= 2 and abs(b - B) <= 2 for R, G, B in pal
    )


def fits_era(r, g, b, a):
    if is_five(r) and is_five(g) and is_five(b):
        return True
    return a < 255 and all(
        any(is_five(c + d) for d in range(-2, 3) if 0 <= c + d <= 255)
        for c in (r, g, b)
    )


def colors_off(path, pal, era):
    """(pixels off the colors, pixels with see-through off the steps, pixels shown, colors used)"""
    im = Image.open(path).convert("RGBA")
    off = alpha = shown = used = 0
    for n, (r, g, b, a) in im.getcolors(im.width * im.height):
        if a == 0:
            continue
        shown += n
        used += 1
        if a not in ALPHA_STEPS:
            alpha += n
        if (
            not fits_era(r, g, b, a)
            if era
            else (r, g, b) not in pal and not (a < 255 and near(r, g, b, pal))
        ):
            off += n
    return off, alpha, shown, used


def main():
    strict = "--strict" in sys.argv
    pal = palette()
    files = []
    for d, _, names in os.walk(PX):
        for n in names:
            if n.endswith((".webp", ".png")):
                p = os.path.join(d, n)
                files.append((os.path.relpath(p, PX).replace(os.sep, "/"), p))
    files.sort()
    bad = 0
    folders = {}
    print(
        f"palette: {len(pal)} colors; maps: 15-bit color, at most {MAX_COLORS} a file; see-through steps {sorted(ALPHA_STEPS)}"
    )
    print("\noff the colors (files that hold colors; --list names each file):")
    groups = {}
    for rel, p in files:
        size = os.path.getsize(p)
        top = rel.split("/")[0]
        folders[top] = folders.get(top, 0) + size
        if any(fnmatch(rel, g) for g in DATA):
            continue
        era = any(fnmatch(rel, g) for g in ERA)
        off, alpha, shown, used = colors_off(p, pal, era)
        if era and used > MAX_COLORS:
            off = max(off, 1)
        g = groups.setdefault(os.path.dirname(rel), [0, 0, 0, 0, 0])
        g[0] += 1
        g[2] += off
        g[3] += alpha
        g[4] += shown
        if off or alpha:
            bad += 1
            g[1] += 1
            if "--list" in sys.argv:
                print(
                    f"  {rel}: {off} of {shown} pixels off the colors, {alpha} off the see-through steps, {used} colors"
                )
    for d, (n, nbad, off, alpha, shown) in sorted(groups.items()):
        if nbad:
            print(
                f"  {d}/: {nbad} of {n} files; {100 * off / max(shown, 1):.1f}% of their pixels off the colors, {100 * alpha / max(shown, 1):.1f}% off the see-through steps"
            )
    print("\nfiles over the budget of one file:", FILE_MAX // KB, "KB")
    for rel, p in files:
        size = os.path.getsize(p)
        if size > FILE_MAX:
            bad += 1
            print(f"  {rel}: {size // KB} KB")
    print("\nfolders (total / budget):")
    for top, size in sorted(folders.items(), key=lambda t: -t[1]):
        cap = FOLDER_MAX.get(top, FOLDER_DEFAULT)
        over = size > cap
        bad += over
        print(f"  {top}: {size // KB} KB / {cap // KB} KB{'  OVER' if over else ''}")
    total = sum(folders.values())
    over = total > TOTAL_MAX
    bad += over
    print(
        f"\ntotal: {total // KB} KB in {len(files)} files / {TOTAL_MAX // KB} KB{'  OVER' if over else ''}"
    )
    print(f"{bad} thing(s) off the limits")
    if strict and bad:
        sys.exit(1)


if __name__ == "__main__":
    main()
