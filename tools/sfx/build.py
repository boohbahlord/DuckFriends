"""Builds the game's sound files (assets/sfx/) from free recordings, offline, once.

Every sound is a real recording (CC0 or public domain; the lobby countdown and the new round are played on the
GeneralUser GS SoundFont's recorded instruments). Each is cut to its sound, faded in and out so it starts and ends at
silence (no pops), given the Medium look (22 kHz, a little 12-bit grit, a small room: the 32-bit era's compressed sound)
and saved as a small mono MP3, which every browser plays. A sound with a few takes (footsteps) gets one file per take.
It also writes js/sfxlist.js (each sound's files, and a loop's points) and assets/sfx/CREDITS.md.

Usage:
  python3 tools/sfx/build.py SOURCES KENNEY SF2 [names...]
    SOURCES  the raw recordings as gathered (/mnt/project-files/audio-sources: one folder per site)
    KENNEY   a checkout of Kenney's packs (git mirror github.com/ETdoFresh/kenney.nl: kenney_impactsounds …)
    SF2      GeneralUser-GS.sf2
    names    only these sounds (default: all)
Needs ffmpeg, numpy and tinysoundfont (see soundfont.py). Afterwards: npx prettier@3.6.2 --write js/sfxlist.js.
"""

import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from soundfont import MAKERS, SR  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "sfx")
RATE = 22050  # the files' sample rate
# the Medium look, before the room: the grit, then nothing left above about 9.5 kHz (as the 22 kHz games had)
LOOK = "lowpass=f=9000:poles=2,acrusher=bits=12:mix=1:mode=lin:aa=1,lowpass=f=9000:poles=2,lowpass=f=9500:poles=2"
ROOM = "aecho=0.8:0.5:30|55:0.12|0.07"  # a small room

OGA = "opengameart.org"
OGA_URL = {
    "guns": "https://opengameart.org/content/the-free-firearm-sound-library",
    "reload": "https://opengameart.org/content/gun-reload-sounds",
    "clicks2": "https://opengameart.org/content/equipment-clicks-ii",
    "clicks3": "https://opengameart.org/content/equipment-clicks-iii",
    "medieval": "https://opengameart.org/content/medieval-sound-effects-weapon-textures",
    "owlish": "https://opengameart.org/content/202-more-sound-effects",
    "rpg80": "https://opengameart.org/content/80-cc0-rpg-sfx",
    "jump": "https://opengameart.org/content/fantasy-weapons-and-apparel-sfx-library",
    "scifi": "https://opengameart.org/content/sci-fi-sounds",
    "steam": "https://opengameart.org/content/steam-release-sounds",
    "bang": "https://opengameart.org/content/25-cc0-bang-firework-sfx",
    "bamboo": "https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes",
    "swishes": "https://opengameart.org/content/swishes-sound-pack",
    "explosions": "https://opengameart.org/content/explosions-4",
    "crunch": "https://opengameart.org/content/7-eating-crunches",
    "drink": "https://opengameart.org/content/liquid-bottle-drink-set",
    "muffled": "https://opengameart.org/content/muffled-distant-explosion",
    "tinyworlds": "https://opengameart.org/content/explosion-0",
    "workshop": "https://opengameart.org/content/68-workshop-sounds",
    "wood100": "https://opengameart.org/content/100-cc0-metal-and-wood-sfx",
    "break75": "https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx",
    "crack35": "https://opengameart.org/content/35-wooden-crackshitsdestructions",
    "zombies": "https://opengameart.org/content/zombies-sound-pack",
    "electricity": "https://opengameart.org/content/electricity-game-sound-pack",
}
KENNEY_IMPACT = "https://kenney.nl/assets/impact-sounds"
KENNEY_UI = "https://kenney.nl/assets/ui-audio"
KENNEY_IFACE = "https://kenney.nl/assets/interface-sounds"
KENNEY_RPG = "https://kenney.nl/assets/rpg-audio"
KENNEY_CASINO = "https://kenney.nl/assets/casino-audio"
KENNEY_JINGLES = "https://kenney.nl/assets/music-jingles"
KENNEY_DIGITAL = "https://kenney.nl/assets/digital-audio"
KI = "kn:kenney_impactsounds/Audio/"
KF = "kn:kenney_interfacesounds/Audio/"
KU = "kn:kenney_uiaudio/Audio/"
KR = "kn:kenney_rpgaudio/Audio/"
KC = "kn:kenney_casinoaudio/Audio/"
KD = "kn:kenney_digitalaudio/Audio/"
GR = "oga:guns-reload/"
EC = GR + "equipmentclicks.wav"
C3 = GR + "equipment_clicks3.wav"
LK = "oga:guns-empty-click/"


def one(path, length, credit, **o):
    """a sound that is one whole short file"""
    return dict(layers=[(path, 0, length, 0, 1)], credit=credit, **o)


def ui(path, credit=("Kenney, Interface Sounds", KENNEY_IFACE)):
    """a faint menu sound: short, no room"""
    return one(path, 0.6, credit, room=False, kbps=32)


# the fireplace's spin: its clicker's ticks, close together at first and slowing to a stop (s)
TICKS, _t, _gap = [], 0.0, 0.055
while _t < 4.0:
    TICKS.append(_t)
    _t += _gap
    _gap *= 1.085

GUNS = ("Still North Media, The Free Firearm Sound Library", OGA_URL["guns"])

"""Each sound: layers [(file, from s, length s, at s in the sound, gain[, low-pass Hz])], and how it's treated:
  rate   played faster (> 1, higher) or slower, as a turntable would
  lp     a darker low-pass (Hz)
  drive  squashes a gun's crack a little so the shot keeps its body, as old games' guns did
  squash a slow compressor: a long rumble stays loud after the blast instead of dying away
  room   the small room (default on)
  takes  [layers, …] in place of layers: one file each
  loop   (s) a seamless loop that long, in the middle of the file (js/sfxlist.js says where)
  sf     made on the SoundFont (soundfont.py) instead of from a file
  kbps   the MP3's bitrate (default 40)
  pre    an ffmpeg filter first (a field recording cleaned: its wind and water taken down)
  fin    a longer fade-in (s; default 5 ms), to ease a sharp attack
Files: "oga:<folder>/<file>" (SOURCES/opengameart.org), "gh:" (SOURCES/github.com: CC0 files found in open-source games'
repositories, their credits in its sources.csv), "wm:" (SOURCES/commons.wikimedia.org), "kn:<path>" (KENNEY),
"sf:<maker>"."""
SOUNDS = {
    # ---- the lobby countdown (the owner's take B) and Dead Ducks Arcade's new round ----
    "countTick": dict(
        sf="count_tick",
        lp=2600,
        fin=0.014,  # (its mallet's knock eased in: no sharp edge)
        credit=("GeneralUser GS SoundFont (S. Christian Collins)", None),
    ),
    "countGo": dict(
        sf="count_go",
        lp=3800,
        credit=("GeneralUser GS SoundFont (S. Christian Collins)", None),
    ),
    "l4round": dict(
        sf="round_start",
        kbps=48,
        credit=("GeneralUser GS SoundFont (S. Christian Collins)", None),
    ),
    # ---- footsteps: a duck on wood, light and higher; a zombie, slow, heavy and dull ----
    "step": dict(
        takes=[
            [(f"kn:kenney_impactsounds/Audio/footstep_wood_00{i}.ogg", 0, 0.4, 0, 1)]
            for i in range(5)
        ],
        rate=1.26,
        room=False,
        kbps=32,
        credit=("Kenney, Impact Sounds (footstep_wood)", KENNEY_IMPACT),
    ),
    "zstep": dict(
        takes=[
            [(f"kn:kenney_impactsounds/Audio/footstep_carpet_00{i}.ogg", 0, 0.5, 0, 1)]
            for i in (0, 1, 3)
        ],  # (Kenney's 002 and 004 repeat 001 and 003)
        rate=0.8,
        lp=1800,
        room=False,
        kbps=32,
        credit=("Kenney, Impact Sounds (footstep_carpet)", KENNEY_IMPACT),
    ),
    # ---- every gun its own shot (the owner: "each gun should have it's own sound") ----
    "handgun": dict(
        layers=[("oga:guns-pistol/X_39P.wav", 1.40, 0.7, 0, 1)],
        drive=4,
        credit=GUNS + ("Walther PPQ 9mm",),
    ),
    "revolver": dict(
        layers=[("oga:guns-pistol/A_42P.wav", 0.94, 0.8, 0, 1)],
        drive=4,
        credit=GUNS + ("1911 .45",),
    ),
    "smg": dict(
        layers=[("oga:guns-smg/G_31P.wav", 0.30, 0.5, 0, 1)],
        drive=4,
        credit=GUNS + ("M45 9mm SMG",),
    ),
    "ak": dict(
        layers=[("oga:guns-rifle-lmg/C_28P.wav", 0.60, 0.7, 0, 1)],
        drive=4,
        credit=GUNS + ("AK-47 7.62",),
    ),
    "lmg": dict(
        layers=[("oga:guns-rifle-lmg/D_32P.wav", 0.70, 0.6, 0, 1)],
        drive=4,
        credit=GUNS + ("AR-15 5.56",),
    ),
    "chaingun": dict(
        layers=[("oga:guns-smg/P_30P.wav", 0.96, 0.4, 0, 1)],
        drive=4,
        credit=GUNS + ("PPSh",),
    ),
    "sniper": dict(
        layers=[("oga:guns-sniper/W_29P.wav", 0.56, 1.2, 0, 1)],
        drive=4,
        credit=GUNS + ("Tikka T3 .30-06",),
    ),
    "shotgun": dict(
        layers=[("oga:guns-shotgun/K_22P.wav", 0.84, 1.1, 0, 1)],
        drive=5,
        credit=GUNS + ("Winchester Model 12",),
    ),
    "pump": dict(
        layers=[("oga:guns-shotgun-pump/shotguncock.wav", 0, 0.47, 0, 1)],
        credit=("SpringySpringo, Gun Reload Sounds", OGA_URL["reload"]),
    ),
    # the grenade launcher: the round leaving the tube (the owner: "a projectile leaving a tube"): a deep, hollow thump
    # with a dull boom under it, and the round's whoosh as it goes
    "glauncher": dict(
        layers=[
            (
                "kn:kenney_impactsounds/Audio/impactSoft_heavy_000.ogg",
                0,
                0.4,
                0,
                1,
                900,
            ),
            ("oga:explosion-big/cannon_01.ogg", 0.07, 0.45, 0, 0.35, 700),
            ("oga:knife-swish/swosh-01.flac", 0, 0.45, 0.05, 0.5, 3000),
        ],
        rate=0.85,
        drive=2,
        credit=(
            "Kenney, Impact Sounds (impactSoft_heavy); rubberduck, 25 CC0 bang / firework SFX (cannon_01); qubodup, "
            "Swish: bamboo stick weapon swooshes (swosh-01)",
            OGA_URL["bamboo"],
        ),
    ),
    "bow": dict(
        layers=[("oga:guns-bow/Scythian_Recurve_Shoot.wav", 0.18, 0.6, 0, 1)],
        credit=(
            "Ben Jaszczak & Brian Nelson, Medieval Sound Effects",
            OGA_URL["medieval"],
        ),
    ),
    "empty": dict(
        layers=[("oga:guns-empty-click/lock_01.ogg", 0.02, 0.3, 0, 1)],
        credit=("rubberduck, 80 CC0 RPG SFX (lock_01)", OGA_URL["rpg80"]),
    ),
    # ---- every gun its own reload, as long as its reload in the game (the owner, Nov 16: "some reloads are really long
    # or longer and some are shorter"): the magazine out, in, and the gun made ready again just before the end. RELOAD_S
    # in js/sound.js holds the same lengths (a Faster reload plays the file faster to fit) ----
    # the handgun, 1.2 s: the magazine out, in, the slide let go
    "reloadHandgun": dict(
        layers=[
            (GR + "gunreload1.wav", 0.05, 0.45, 0, 1),
            (GR + "gunreload1.wav", 0.66, 0.45, 0.42, 0.8),
            (GR + "gunreload1.wav", 1.25, 0.3, 0.88, 1),
        ],
        credit=("SpringySpringo, Gun Reload Sounds", OGA_URL["reload"]),
    ),
    # the revolver, 1.7 s: the cylinder out, five rounds in, the cylinder shut
    "reloadRevolver": dict(
        layers=[(EC, 0.07, 0.3, 0, 1)]
        + [
            (src, at, 0.12, 0.38 + i * 0.19, 0.42)
            for i, (src, at) in enumerate(
                [
                    (EC, 2.37),
                    (LK + "lock_02.ogg", 0.03),
                    (EC, 2.37),
                    (EC, 1.06),
                    (EC, 2.37),
                ]
            )
        ]
        + [(EC, 3.75, 0.32, 1.38, 1)],
        credit=(
            "LFA, Equipment Clicks II; rubberduck, 80 CC0 RPG SFX (lock_02)",
            OGA_URL["clicks2"],
        ),
    ),
    # the SMG, 1.4 s: the magazine out, in, the bolt pulled back
    "reloadSmg": dict(
        layers=[
            (EC, 1.92, 0.3, 0, 1),
            (EC, 2.37, 0.3, 0.5, 0.9),
            (LK + "lock_01.ogg", 0.01, 0.33, 1.02, 0.8),
        ],
        credit=(
            "LFA, Equipment Clicks II; rubberduck, 80 CC0 RPG SFX (lock_01)",
            OGA_URL["clicks2"],
        ),
    ),
    # the AK-47, 1.9 s: the magazine out, the new one rocked in, the charging handle racked
    "reloadAk": dict(
        layers=[
            (GR + "assaultriflereload1.wav", 0.0, 0.6, 0, 1),
            (GR + "assaultriflereload1.wav", 0.95, 0.61, 0.6, 1),
            (KR + "metalClick.ogg", 0.06, 0.36, 1.45, 0.75),
        ],
        credit=(
            "SpringySpringo, Gun Reload Sounds; Kenney, RPG Audio (metalClick)",
            OGA_URL["reload"],
        ),
    ),
    # the sniper, 2.2 s: the bolt up and back, three rounds pressed in, the bolt forward and down
    "reloadSniper": dict(
        layers=[(EC, 3.75, 0.32, 0, 1)]
        + [
            (src, at, 0.14, 0.55 + i * 0.3, 0.45)
            for i, (src, at) in enumerate(
                [(EC, 2.37), (LK + "lock_02.ogg", 0.03), (EC, 1.92)]
            )
        ]
        + [(EC, 0.07, 0.3, 1.58, 1), (KR + "metalLatch.ogg", 0.03, 0.2, 1.95, 0.6)],
        credit=(
            "LFA, Equipment Clicks II; rubberduck, 80 CC0 RPG SFX (lock_02); Kenney, RPG Audio (metalLatch)",
            OGA_URL["clicks2"],
        ),
    ),
    # the LMG, 2.8 s: the cover up, the old belt pulled, the box out and in, the new belt laid, the cover shut, racked
    "reloadLmg": dict(
        layers=[
            (C3, 0.18, 0.35, 0, 1),
            (KR + "beltHandle1.ogg", 0, 0.28, 0.5, 0.5),
            (C3, 0.83, 0.3, 0.9, 0.9),
            (C3, 1.43, 0.35, 1.45, 1),
            (KR + "beltHandle2.ogg", 0, 0.28, 1.9, 0.5),
            (C3, 2.66, 0.3, 2.22, 1),
            (KR + "metalClick.ogg", 0.06, 0.36, 2.48, 0.7),
        ],
        credit=(
            "LFA, Equipment Clicks III; Kenney, RPG Audio (beltHandle, metalClick)",
            OGA_URL["clicks3"],
        ),
    ),
    # the chain gun, 4 s (no reload in Dead Ducks Arcade): the empty box off, a new one on, its belt fed in, the
    # barrels' cover shut
    "reloadChaingun": dict(
        layers=[
            (C3, 3.24, 0.3, 0, 1),
            (C3, 3.7, 0.3, 0.45, 0.8),
            (KR + "beltHandle1.ogg", 0, 0.28, 1.2, 0.5),
            (C3, 6.35, 0.3, 1.75, 1),
            (C3, 7.2, 0.3, 2.3, 0.8),
            (KR + "beltHandle2.ogg", 0, 0.28, 2.75, 0.5),
            (C3, 11.38, 0.3, 3.3, 1),
            (KR + "metalLatch.ogg", 0.03, 0.2, 3.7, 0.6),
        ],
        credit=(
            "LFA, Equipment Clicks III; Kenney, RPG Audio (beltHandle, metalLatch)",
            OGA_URL["clicks3"],
        ),
    ),
    "reloadShotgun": dict(
        layers=[(C3, 4.95, 1.6, 0, 1)],
        credit=("LFA, Equipment Clicks III", OGA_URL["clicks3"]),
    ),
    # the grenade launcher, 4 s (no reload in Dead Ducks Arcade): broken open, three shells slid in, shut
    "reloadGlauncher": dict(
        layers=[(C3, 6.35, 0.3, 0, 1)]
        + [(C3, 13.1, 0.36, 0.75 + i * 0.75, 0.85) for i in range(3)]
        + [(C3, 16.23, 0.3, 3.15, 1), (KR + "metalLatch.ogg", 0.03, 0.2, 3.6, 0.6)],
        credit=(
            "LFA, Equipment Clicks III; Kenney, RPG Audio (metalLatch)",
            OGA_URL["clicks3"],
        ),
    ),
    # ---- items ----
    "medkit": dict(
        layers=[
            ("oga:medkit/Velcro_01.wav", 0, 1.04, 0, 1),
            ("oga:medkit/Cloth_03.wav", 0, 1.0, 0.85, 0.7),
        ],
        credit=(
            "OwlishMedia, 202 More Sound Effects (Velcro_01, Cloth_03)",
            OGA_URL["owlish"],
        ),
    ),
    "adrenaline": dict(
        layers=[("oga:adrenaline-injector/Nasal_Spray.wav", 0, 0.36, 0, 1)],
        credit=("OwlishMedia, 202 More Sound Effects (Nasal_Spray)", OGA_URL["owlish"]),
    ),
    # ---- moving: a really small jump, and the jetpack ----
    "hop": dict(
        layers=[("oga:jump-land/boots-leather-jump-01.wav", 0, 0.3, 0, 1)],
        rate=1.15,
        room=False,
        kbps=32,
        credit=("Vehicle, Fantasy Weapons and Apparel SFX Library", OGA_URL["jump"]),
    ),
    "jetStart": dict(
        layers=[("oga:jetpack-start/thrusterFire_000.ogg", 0, 0.45, 0, 1)],
        credit=("Kenney, Sci-fi Sounds (thrusterFire_000)", OGA_URL["scifi"]),
    ),
    "jetLoop": dict(
        layers=[("oga:jetpack-loop/spaceEngine_001.ogg", 1.0, 2.2, 0, 1)],
        loop=1.2,
        kbps=48,
        credit=("Kenney, Sci-fi Sounds (spaceEngine_001)", OGA_URL["scifi"]),
    ),
    "jetStop": dict(
        layers=[("oga:jetpack-stop/steam_hisses_-_Marker_2.wav", 0, 0.5, 0, 1)],
        lp=4000,
        credit=("bart, Steam Release Sounds", OGA_URL["steam"]),
    ),
    # ==== batch 2 ====
    # ---- a shot in flesh, by its round (fx.js BLEED_OF: small, big, heavy, shot) and the blades and blunt things ----
    "hitSmall": one(
        KI + "impactPunch_medium_000.ogg",
        0.4,
        ("Kenney, Impact Sounds (impactPunch_medium)", KENNEY_IMPACT),
    ),
    "hitBig": dict(
        layers=[
            (KI + "impactPunch_heavy_002.ogg", 0, 0.5, 0, 1),
            (KI + "impactSoft_medium_001.ogg", 0, 0.4, 0, 0.4),
        ],
        credit=(
            "Kenney, Impact Sounds (impactPunch_heavy, impactSoft_medium)",
            KENNEY_IMPACT,
        ),
    ),
    "hitHeavy": dict(
        layers=[
            (KI + "impactPunch_heavy_003.ogg", 0, 0.5, 0, 1),
            (KI + "impactSoft_heavy_002.ogg", 0, 0.5, 0, 0.7),
        ],
        rate=0.9,
        credit=(
            "Kenney, Impact Sounds (impactPunch_heavy, impactSoft_heavy)",
            KENNEY_IMPACT,
        ),
    ),
    "hitShot": dict(
        layers=[
            (KI + "impactSoft_medium_002.ogg", 0, 0.4, 0, 1),
            (KI + "impactPunch_medium_001.ogg", 0, 0.3, 0.02, 0.5),
            (KI + "impactPunch_medium_002.ogg", 0, 0.3, 0.045, 0.4),
        ],
        credit=(
            "Kenney, Impact Sounds (impactSoft_medium, impactPunch_medium)",
            KENNEY_IMPACT,
        ),
    ),
    "hitBlade": one(
        KR + "knifeSlice.ogg", 0.5, ("Kenney, RPG Audio (knifeSlice)", KENNEY_RPG)
    ),
    # the hammer and the chair landing on someone (the owner: "a blunt sound against flesh")
    "hitBlunt": dict(
        layers=[
            (KI + "impactPunch_heavy_004.ogg", 0, 0.5, 0, 1),
            (KI + "impactSoft_heavy_003.ogg", 0, 0.5, 0, 0.6),
        ],
        lp=2500,
        rate=0.85,
        credit=(
            "Kenney, Impact Sounds (impactPunch_heavy, impactSoft_heavy)",
            KENNEY_IMPACT,
        ),
    ),
    "hitArrow": dict(
        layers=[
            (KI + "impactSoft_medium_003.ogg", 0, 0.4, 0, 1),
            (KR + "knifeSlice2.ogg", 0, 0.4, 0, 0.45),
        ],
        credit=(
            "Kenney, Impact Sounds (impactSoft_medium) and RPG Audio (knifeSlice2)",
            KENNEY_IMPACT,
        ),
    ),
    "hitClaw": dict(
        layers=[
            (KR + "cloth3.ogg", 0, 0.4, 0, 0.8),
            (KR + "drawKnife2.ogg", 0, 0.4, 0, 0.6),
        ],
        rate=0.8,
        credit=("Kenney, RPG Audio (cloth3, drawKnife2)", KENNEY_RPG),
    ),
    # ---- a shot that missed, landing on the floor or a wall, by its round ----
    "landSmall": one(
        KI + "impactWood_light_000.ogg",
        0.4,
        ("Kenney, Impact Sounds (impactWood_light)", KENNEY_IMPACT),
    ),
    "landBig": one(
        KI + "impactWood_medium_000.ogg",
        0.5,
        ("Kenney, Impact Sounds (impactWood_medium)", KENNEY_IMPACT),
    ),
    "landHeavy": one(
        KI + "impactWood_heavy_000.ogg",
        0.6,
        ("Kenney, Impact Sounds (impactWood_heavy)", KENNEY_IMPACT),
    ),
    "landShot": dict(
        layers=[
            (KI + "impactGeneric_light_000.ogg", 0, 0.3, 0, 1),
            (KI + "impactGeneric_light_001.ogg", 0, 0.3, 0.03, 0.7),
            (KI + "impactGeneric_light_002.ogg", 0, 0.3, 0.06, 0.5),
        ],
        credit=("Kenney, Impact Sounds (impactGeneric_light)", KENNEY_IMPACT),
    ),
    "landArrow": one(
        KI + "impactPlank_medium_002.ogg",
        0.5,
        ("Kenney, Impact Sounds (impactPlank_medium)", KENNEY_IMPACT),
    ),
    "landDagger": one(
        KI + "impactMetal_light_000.ogg",
        0.5,
        ("Kenney, Impact Sounds (impactMetal_light)", KENNEY_IMPACT),
    ),
    # ---- swings and throws, each its own ----
    "knife": dict(
        layers=[("oga:knife-swish/Dagger_Swing.wav", 0, 0.5, 0, 1)],
        credit=(
            "Ben Jaszczak & Brian Nelson, Medieval Sound Effects (Dagger Swing)",
            OGA_URL["medieval"],
        ),
    ),
    "hammer": dict(
        layers=[("oga:knife-swish/swosh-10.flac", 0, 0.6, 0, 1)],
        rate=0.8,
        credit=(
            "qubodup, Swish: bamboo stick weapon swooshes (swosh-10)",
            OGA_URL["bamboo"],
        ),
    ),
    "chair": dict(
        layers=[("oga:knife-swish/swosh-01.flac", 0, 0.6, 0, 1)],
        rate=0.7,
        lp=3000,
        credit=(
            "qubodup, Swish: bamboo stick weapon swooshes (swosh-01)",
            OGA_URL["bamboo"],
        ),
    ),
    "throw": dict(
        layers=[("oga:knife-swish/swish-1.wav", 0, 0.5, 0, 1)],
        credit=("artisticdude, Swishes Sound Pack", OGA_URL["swishes"]),
    ),
    "cakeThrow": dict(
        layers=[("oga:knife-swish/swish-5.wav", 0, 0.5, 0, 1)],
        rate=1.1,
        credit=("artisticdude, Swishes Sound Pack", OGA_URL["swishes"]),
    ),
    "bonk": one(
        KI + "impactSoft_heavy_004.ogg",
        0.5,
        ("Kenney, Impact Sounds (impactSoft_heavy)", KENNEY_IMPACT),
    ),
    # ---- explosions. One boom for every explosive (the owner, Nov 16: the grenade's "sounds bad and should also be
    # the same explosion sound for any explosive"): the grenade, the launcher's shell, the Jaime Bomb (played louder).
    # A full crack, the deep body of a second recording under it, and a crunch.
    "boom": dict(
        layers=[
            ("oga:explosion-big/explosion.wav", 0, 0.98, 0, 1),
            ("oga:explosion-big/lowFrequency_explosion_000.ogg", 0.05, 1.6, 0, 0.8),
            ("oga:explosion-small/explosionCrunch_000.ogg", 0, 0.78, 0.01, 0.35),
        ],
        drive=2.5,
        credit=(
            "TinyWorlds, Explosion (explosion); Kenney, Sci-fi Sounds (lowFrequency_explosion_000, "
            "explosionCrunch_000)",
            OGA_URL["tinyworlds"],
        ),
    ),
    # the meteor and the nuke: catastrophic (the owner, Nov 16), each its own. The meteor: a deep, slowed impact that
    # keeps rumbling for about four seconds
    "meteor": dict(
        layers=[
            ("oga:explosion-big/explosion.wav", 0, 0.98, 0, 1),
            ("oga:explosion-big/lowFrequency_explosion_000.ogg", 0.05, 1.9, 0, 1),
            ("oga:explosion-big/cannon_01.ogg", 0, 1.2, 0.02, 0.6, 1500),
            ("oga:explosion-big/explosion3.ogg", 0, 1.7, 0.08, 0.45),
            (
                "oga:explosion-big/NenadSimic_-_Muffled_Distant_Explosion.wav",
                0,
                4.0,
                0.25,
                0.9,
            ),
        ],
        rate=0.8,
        drive=3,
        squash=True,
        kbps=48,
        credit=(
            "TinyWorlds, Explosion (explosion); EZduzziteh, Explosions (explosion3); Kenney, Sci-fi Sounds "
            "(lowFrequency_explosion_000); rubberduck, 25 CC0 bang / firework SFX (cannon_01); NenadSimic, Muffled "
            "Distant Explosion",
            OGA_URL["tinyworlds"],
        ),
    ),
    # Dead Ducks Arcade's nuke: the biggest of all. A blast slowed far down, a roar that keeps coming (the long tail of
    # a second explosion, darkened) and two deep rolls, about seven seconds
    "nuke": dict(
        layers=[
            ("oga:explosion-big/explosion.wav", 0, 0.98, 0, 1),
            ("oga:explosion-big/lowFrequency_explosion_000.ogg", 0.05, 1.9, 0, 1),
            ("oga:explosion-grenade/explosion1.ogg", 0.1, 3.9, 0.15, 0.7, 2500),
            (
                "oga:explosion-big/NenadSimic_-_Muffled_Distant_Explosion.wav",
                0,
                5.1,
                0.1,
                1,
            ),
            (
                "oga:explosion-big/NenadSimic_-_Muffled_Distant_Explosion.wav",
                0,
                5.1,
                1.4,
                0.7,
            ),
        ],
        rate=0.62,
        drive=3,
        squash=True,
        kbps=48,
        credit=(
            "TinyWorlds, Explosion (explosion); EZduzziteh, Explosions (explosion1); Kenney, Sci-fi Sounds "
            "(lowFrequency_explosion_000); NenadSimic, Muffled Distant Explosion",
            OGA_URL["tinyworlds"],
        ),
    ),
    # ... and the ringing in the ears it leaves, played with it (sound.js SFX.nuke)
    "nukeRing": dict(
        sf="nuke_ring",
        lp=6000,
        room=False,
        credit=("GeneralUser GS SoundFont (S. Christian Collins)", None),
    ),
    # ---- eating and drinking ----
    "chomp": dict(
        layers=[("oga:eat/crunch.1.ogg", 0, 0.5, 0, 1)],
        credit=("StarNinjas, 7 Eating Crunches", OGA_URL["crunch"]),
    ),
    "sip": dict(
        layers=[("oga:drink/swallow-01.flac", 0, 0.6, 0, 1)],
        credit=("qubodup, Liquid / bottle / drink set", OGA_URL["drink"]),
    ),
    # ---- the menus: faint ----
    "uiPress": ui(KU + "click3.ogg", ("Kenney, UI Audio (click3)", KENNEY_UI)),
    "uiOn": ui(KF + "toggle_001.ogg"),
    "uiOff": ui(KF + "toggle_002.ogg"),
    "uiOpen": ui(KF + "open_001.ogg"),
    "uiClose": ui(KF + "close_001.ogg"),
    "nope": ui(KF + "error_004.ogg"),
    "tick": ui(KF + "tick_001.ogg"),
    "done": ui(KF + "confirmation_001.ogg"),
    "bell": ui(KF + "bong_001.ogg"),
    "ping": ui(KF + "glass_001.ogg"),
    "pop": ui(KF + "drop_002.ogg"),
    "boop": ui(KF + "select_001.ogg"),
    # ---- batch 3: Dead Ducks Arcade's boards, groans, fireplace spin, sales and drops ----
    # a board torn off a window, three takes
    "l4crack": dict(
        takes=[
            [("oga:board-broken/wood_breaking_01.ogg", 0, 0.56, 0, 1)],
            [("oga:board-broken/bfh1_wood_breaking_01.ogg", 0, 0.3, 0, 1)],
            [("oga:board-broken/crack05.flac", 0.08, 0.75, 0, 1)],
        ],
        credit=(
            "rubberduck, 100 CC0 metal and wood SFX and 75 CC0 breaking / falling / hit SFX; Independent.nu, 35 "
            "wooden cracks, hits, destructions",
            OGA_URL["wood100"],
        ),
    ),
    # a board nailed back up: a hammer on a nail through a plank, three takes
    "l4nail": dict(
        takes=[
            [
                ("oga:board-nailed/workshop_-_wood_hammering.wav", t, 0.3, 0, 1),
                (KI + f"impactPlank_medium_00{i}.ogg", 0, 0.4, 0.005, 0.5),
            ]
            for i, t in ((0, 0.2), (1, 1.49), (2, 3.59))
        ],
        credit=(
            "bart, 68 Workshop Sounds (wood hammering); Kenney, Impact Sounds (impactPlank_medium)",
            OGA_URL["workshop"],
        ),
    ),
    # a zombie groaning, four takes (sound.js plays them at a slightly different pitch each time)
    "l4groan": dict(
        takes=[
            [(f"oga:zombie-groan/zombie-{n}.wav", 0, 0.9, 0, 1)] for n in (1, 5, 10, 15)
        ],
        lp=2600,
        rate=0.92,
        credit=("artisticdude, Zombies Sound Pack", OGA_URL["zombies"]),
    ),
    # the fireplace's spin, 4.2 s: a prize wheel's clicker slowing down, then a bell as it stops on a weapon
    "l4slot": dict(
        layers=[
            (
                KR + "metalClick.ogg",
                0.065,
                0.07,
                round(t, 3),
                round(0.55 - 0.2 * t / 4, 3),
            )
            for t in TICKS
        ]
        + [(KI + "impactBell_heavy_001.ogg", 0, 1.2, 4.12, 0.9, 4000)],
        credit=(
            "Kenney, RPG Audio (metalClick) and Impact Sounds (impactBell_heavy)",
            KENNEY_RPG,
        ),
    ),
    # a sale: coins in the hand and a small ding
    "l4till": dict(
        layers=[
            (KR + "handleCoins.ogg", 0, 0.6, 0, 1),
            (KF + "glass_003.ogg", 0, 0.6, 0.12, 0.45),
        ],
        credit=(
            "Kenney, RPG Audio (handleCoins) and Interface Sounds (glass)",
            KENNEY_RPG,
        ),
    ),
    # a drop: a soft chime as it falls from a zombie, a steel-drum jingle when it's taken
    "dropIn": dict(
        layers=[(KF + "glass_004.ogg", 0, 0.8, 0, 1)],
        credit=("Kenney, Interface Sounds (glass)", KENNEY_IFACE),
    ),
    "dropGot": dict(
        layers=[
            (
                "kn:kenney_musicjingles/Audio/Steel jingles/jingles_STEEL09.ogg",
                0,
                0.6,
                0,
                1,
            )
        ],
        credit=("Kenney, Music Jingles (steel)", KENNEY_JINGLES),
    ),
    # the flashlight (key 0): its own two clicks
    "flashOn": dict(
        layers=[(KF + "switch_005.ogg", 0, 0.3, 0, 1)],
        room=False,
        kbps=32,
        credit=("Kenney, Interface Sounds (switch)", KENNEY_IFACE),
    ),
    "flashOff": dict(
        layers=[(KF + "switch_006.ogg", 0, 0.3, 0, 1)],
        room=False,
        kbps=32,
        credit=("Kenney, Interface Sounds (switch)", KENNEY_IFACE),
    ),
    # stepping onto another tile or answer (game.js tileKnock): a casino chip laid down, soft (sound.js pitches it
    # by the tile)
    "tileIn": dict(
        layers=[(KC + "chipLay1.ogg", 0, 0.4, 0, 1)],
        room=False,
        kbps=32,
        credit=("Kenney, Casino Audio (chipLay)", KENNEY_CASINO),
    ),
    # ---- batch 4 (the owner: "look harder for those sounds or get creative"): the cats, the TV, the power box, quacks ----
    # a cat's meow, five takes: three of one kitten, a small mew, a grown cat
    "meow": dict(
        takes=[
            [("gh:cat-meow/kitten-meow-1.flac", 0.04, 0.6, 0, 1)],
            [("gh:cat-meow/kitten-meow-2.flac", 0, 0.6, 0, 1)],
            [("gh:cat-meow/kitten-meow-3.flac", 0, 0.6, 0, 1)],
            [("gh:cat-meow/kitten-mew-1.flac", 0.03, 0.9, 0, 1)],
            [("gh:cat-meow/mobs_mc_cat_idle.2.ogg", 0.17, 1.65, 0, 1)],
        ],
        credit=(
            "videog (freesound 149191), Jordan Irwin (AntumDeluge), SelsRoyalNavy (freesound 427081): all CC0, "
            "as credited in the Stendhal and VoxeLibre games",
            "https://freesound.org/people/videog/sounds/149191/",
        ),
    ),
    # a cat purring, a seamless loop (a cat in a lap: characters.js)
    "purr": dict(
        layers=[("gh:cat-purr/cat-purr-1.flac", 0, 4.29, 0, 1)],
        loop=3.0,
        kbps=32,
        credit=(
            "Belhene, cat purr (freesound 157837)",
            "https://freesound.org/people/Belhene/sounds/157837/",
        ),
    ),
    # a cat's hiss: a hiss pitched up, small and sharp
    "hiss": dict(
        layers=[("gh:cat-hiss/vampirette_hiss-01.flac", 0.07, 0.9, 0, 1)],
        rate=1.3,
        pre="highpass=f=900:poles=2",
        credit=(
            "Zabuhailo, hiss (freesound 146960)",
            "https://freesound.org/s/146960/",
        ),
    ),
    # the TV with no channel: a steady hiss, the same from start to end (the owner, Nov 16: "more constant and make
    # sure it is quiet"): two of rubberduck's even machine-hiss loops played end to end, darkened, a seamless loop
    "static": dict(
        layers=[
            ("gh:tv-static/machine_04.opus*6", 0, 3.7, 0, 1),
            ("gh:tv-static/machine_01.opus*3", 0, 3.6, 0, 0.4),
        ],
        lp=5000,
        loop=1.2,
        room=False,
        kbps=32,
        credit=(
            "rubberduck (OpenGameArt), machine loops",
            "https://opengameart.org/users/rubberduck",
        ),
    ),
    # the power box's transformer: a 100 Hz mains hum, a seamless loop
    "hum": dict(
        layers=[("gh:power-hum/machine_02.opus*6", 0, 3.7, 0, 1)],
        lp=1500,
        loop=1.2,
        room=False,
        kbps=32,
        credit=(
            "rubberduck (OpenGameArt), machine loop",
            "https://opengameart.org/users/rubberduck",
        ),
    ),
    # a duck's quack, four takes: real ducks (a U.S. Fish and Wildlife Service field recording, public domain), the
    # splashing and wind under them taken down
    "quack": dict(
        takes=[
            [("wm:duck-quacks/Ducks_landing_in_water.ogg", a, n, 0, 1)]
            for a, n in ((1.78, 0.3), (3.12, 0.22), (6.07, 0.24), (9.39, 0.24))
        ],
        pre="highpass=f=280:poles=2,afftdn=nf=-35,lowpass=f=4500:poles=2",
        credit=(
            "U.S. Fish and Wildlife Service, Ducks landing in water (public domain)",
            "https://commons.wikimedia.org/wiki/File:Ducks_landing_in_water.ogg",
        ),
    ),
    # ---- batch 3: Duck Cabin ----
    # a lamp's switch, on and off
    "lampOn": one(
        KU + "switch7.ogg", 0.3, ("Kenney, UI Audio (switch)", KENNEY_UI), kbps=32
    ),
    "lampOff": one(
        KU + "switch8.ogg", 0.3, ("Kenney, UI Audio (switch)", KENNEY_UI), kbps=32
    ),
    # the power box's big lever: a heavy metal clunk and its latch
    "lever": dict(
        layers=[
            (KI + "impactMetal_heavy_001.ogg", 0, 0.6, 0, 1, 2500),
            (KR + "metalLatch.ogg", 0.03, 0.2, 0.09, 0.6),
        ],
        credit=(
            "Kenney, Impact Sounds (impactMetal_heavy) and RPG Audio (metalLatch)",
            KENNEY_IMPACT,
        ),
    ),
    # the fire put out: water hissing on it; candles and lanterns blown out: a short, soft breath
    "fireOut": dict(
        layers=[("oga:adrenaline-injector/steam_hisses_-_Marker_1.wav", 0, 0.9, 0, 1)],
        lp=4000,
        credit=("bart, Steam Release Sounds", OGA_URL["steam"]),
    ),
    "candleOut": dict(
        layers=[("oga:knife-swish/swish-1.wav", 0, 0.35, 0, 1)],
        lp=1400,
        rate=0.7,
        credit=("artisticdude, Swishes Sound Pack", OGA_URL["swishes"]),
    ),
    # lit again: a match struck (a scratch, then the flame catching)
    "relight": dict(
        layers=[
            (KF + "scratch_002.ogg", 0, 0.25, 0, 0.8, 5000),
            ("oga:knife-swish/swosh-01.flac", 0, 0.4, 0.12, 0.5, 1500),
        ],
        credit=(
            "Kenney, Interface Sounds (scratch); qubodup, Swish: bamboo stick weapon swooshes (swosh-01)",
            KENNEY_IFACE,
        ),
    ),
    # the TV's power button
    "tvClick": one(
        KU + "switch33.ogg", 0.3, ("Kenney, UI Audio (switch)", KENNEY_UI), kbps=32
    ),
    # blackjack: a card dealt (four takes), chips stacked (three takes)
    "card": dict(
        takes=[[(KC + f"cardPlace{i}.ogg", 0, 0.5, 0, 1)] for i in (1, 2, 3, 4)],
        kbps=32,
        credit=("Kenney, Casino Audio (cardPlace)", KENNEY_CASINO),
    ),
    "chips": dict(
        takes=[[(KC + f"chipsStack{i}.ogg", 0, 0.7, 0, 1)] for i in (1, 2, 3)],
        kbps=32,
        credit=("Kenney, Casino Audio (chipsStack)", KENNEY_CASINO),
    ),
    # the cats and Justin at the food: a bite and a gulp
    "bite": dict(
        layers=[("oga:eat/crunch.3.ogg", 0, 0.5, 0, 1)],
        credit=("StarNinjas, 7 Eating Crunches", OGA_URL["crunch"]),
    ),
    "gulp": dict(
        layers=[("oga:drink/swallow-02.flac", 0, 0.6, 0, 1)],
        credit=("qubodup, Liquid / bottle / drink set", OGA_URL["drink"]),
    ),
    # the shadow duck fading in or out outside: a low, slow rush of air
    "whoosh": dict(
        layers=[("oga:knife-swish/swosh-01.flac", 0, 0.6, 0, 1)],
        lp=1200,
        rate=0.6,
        credit=(
            "qubodup, Swish: bamboo stick weapon swooshes (swosh-01)",
            OGA_URL["bamboo"],
        ),
    ),
    # a claw's swipe (a cat's, a zombie's): quick and light
    "swipe": dict(
        layers=[("oga:knife-swish/swosh-10.flac", 0, 0.4, 0, 1)],
        rate=1.4,
        credit=(
            "qubodup, Swish: bamboo stick weapon swooshes (swosh-10)",
            OGA_URL["bamboo"],
        ),
    ),
    # ==== batch 5: the owner's three new guns (Nov 16 16:25Z), each its own shot and its own reload ====
    # the double barrel: a 12-gauge's blast, a little deeper than the pump shotgun's (another gun's recording)
    "dbarrel": dict(
        layers=[("oga:guns-shotgun/H_21P.wav", 0.465, 1.1, 0, 1)],
        rate=0.94,
        drive=5,
        credit=GUNS + ("Charles Daly 12 ga",),
    ),
    # the burst rifle: one round of its three (an SKS's crack; the AK-47 and the LMG have their own)
    "burst": dict(
        layers=[("gh:gun-burst/sks.wav", 0, 0.7, 0, 1)],
        drive=4,
        credit=(
            "Tabasco, Gunshot Sounds (SKS)",
            "https://opengameart.org/content/gunshot-sounds",
        ),
    ),
    # the burst rifle's reload, 2 s: the magazine out, the new one in, the charging handle pulled and let go
    "reloadBurst": dict(
        layers=[
            ("gh:reload-burst/mag_out.wav", 0, 0.16, 0.1, 1),
            ("gh:reload-burst/mag_in.wav", 0, 0.24, 0.85, 1),
            ("gh:reload-burst/bolt.wav", 0, 0.38, 1.5, 1),
        ],
        credit=(
            "zer0_sol, Handgun Reload Sound Effect",
            "https://opengameart.org/content/handgun-reload-sound-effect",
        ),
    ),
    # the double barrel's reload, 2 s (a second a shell): broken open, two shells slid in, snapped shut
    "reloadDbarrel": dict(
        layers=[
            (C3, 8.655, 0.25, 0, 1),
            (KI + "impactMetal_light_000.ogg", 0, 0.3, 0, 0.5, 1500),
            (C3, 13.15, 0.35, 0.3, 0.35),
            ("gh:reload-dbarrel/shell-1.wav", 0.1, 0.3, 0.6, 0.9),
            ("gh:reload-dbarrel/shell-2.wav", 0, 0.35, 1.15, 0.9),
            (C3, 9.675, 0.2, 1.72, 1),
            (KI + "impactMetal_medium_000.ogg", 0, 0.3, 1.72, 0.6, 1800),
        ],
        credit=(
            "LFA, Equipment Clicks III; Shotgun Reload Sound Effects (Shell in Chamber); Kenney, Impact Sounds",
            "https://opengameart.org/content/shotgun-reload-sound-effects",
        ),
    ),
    # the flamethrower's tank swapped, 4 s: the empty one unlatched and set down, the full one on and screwed tight,
    # its valve opened (a little gas), the igniter's click
    "reloadFlamer": dict(
        layers=[
            (KR + "metalLatch.ogg", 0.03, 0.2, 0, 0.8),
            (C3, 14.675, 0.3, 0.3, 0.6),
            (KI + "impactMetal_heavy_000.ogg", 0, 0.45, 0.9, 0.7, 1200),
            (KI + "impactMetal_medium_001.ogg", 0, 0.35, 1.9, 0.7, 1500),
            (C3, 16.295, 0.25, 2.25, 0.7),
            (C3, 18.12, 0.2, 2.6, 0.7),
            ("gh:flamer/oxytorch_1.ogg", 0.05, 0.45, 3.0, 0.3, 3000),
            (KR + "metalClick.ogg", 0.06, 0.3, 3.62, 0.5),
        ],
        credit=(
            "Kenney, RPG Audio and Impact Sounds; LFA, Equipment Clicks III; rombart, oxytorch (freesound 197800)",
            OGA_URL["clicks3"],
        ),
    ),
    # the flamethrower: lit (the igniter's click, the fire's whoosh), its roar while held (a gas torch's roar spread
    # out, over a fire's crackle, deepened), and the fire's last puff as it's let go
    "flameStart": dict(
        layers=[
            (KR + "metalClick.ogg", 0.06, 0.2, 0, 0.35),
            ("gh:flamer/attack-fire-1.flac", 0.05, 1.0, 0.05, 1),
            ("gh:flamer/oxytorch_1.ogg", 0.05, 0.4, 0.15, 0.45),
        ],
        lp=7000,
        credit=(
            "Nic3_one, fire attack (freesound 166555, from Stendhal); rombart, oxytorch; Kenney, RPG Audio",
            "https://freesound.org/people/Nic3_one/sounds/166555/",
        ),
    ),
    "flameLoop": dict(
        layers=[
            ("gh:flamer/oxytorch_1.ogg~3.8", 0, 3.8, 0, 1),
            ("gh:flamer/fire_loop.opus", 5.0, 3.8, 0, 0.5, 3000),
        ],
        rate=0.8,
        lp=6000,
        loop=2.0,
        kbps=48,
        credit=(
            "rombart, oxytorch (freesound 197800, from CDDA-Soundpacks); PagDev, Fireplace Sound Loop",
            "https://freesound.org/s/197800/",
        ),
    ),
    "flameStop": dict(
        layers=[("gh:flamer/attack-fire-2.flac", 0.1, 0.7, 0, 1)],
        rate=0.8,
        lp=2500,
        credit=(
            "Nic3_one, fire attack (freesound 166555, from Stendhal)",
            "https://freesound.org/people/Nic3_one/sounds/166555/",
        ),
    ),
    # the new melees (#301), each its own swing and its own hit: the axe heavy, the sword with steel's ring, the pan a
    # broad flat swing and a frying pan's bonk
    "axe": dict(
        layers=[("gh:melee/attack-melee-04.ogg", 0, 0.6, 0, 1)],
        rate=0.85,
        credit=(
            "Jordan Irwin (AntumDeluge), melee swings (from Stendhal)",
            "https://opengameart.org/node/100746",
        ),
    ),
    "sword": dict(
        layers=[
            ("gh:melee/attack-melee-07.ogg", 0, 0.45, 0, 1),
            (KR + "drawKnife1.ogg", 0, 0.4, 0.02, 0.5),
        ],
        credit=(
            "Jordan Irwin (AntumDeluge), melee swings (from Stendhal); Kenney, RPG Audio (drawKnife1)",
            "https://opengameart.org/node/100746",
        ),
    ),
    "pan": dict(
        layers=[("gh:melee/attack-melee-06.ogg", 0, 0.4, 0, 1)],
        rate=0.75,
        credit=(
            "Jordan Irwin (AntumDeluge), melee swings (from Stendhal)",
            "https://opengameart.org/node/100746",
        ),
    ),
    "axeHit": dict(
        layers=[
            (KR + "chop.ogg", 0, 0.24, 0, 1),
            (KI + "impactPunch_heavy_001.ogg", 0, 0.4, 0, 0.5, 2000),
        ],
        credit=(
            "Kenney, RPG Audio (chop) and Impact Sounds (impactPunch_heavy)",
            KENNEY_RPG,
        ),
    ),
    "swordHit": dict(
        layers=[
            (KR + "knifeSlice2.ogg", 0.2, 0.35, 0, 1),
            ("gh:melee/clang-metallic-1.flac", 0, 0.35, 0, 0.25),
        ],
        credit=(
            "Kenney, RPG Audio (knifeSlice2); lostchocolatelab, clang (freesound 1468, from Stendhal)",
            KENNEY_RPG,
        ),
    ),
    "panHit": dict(
        layers=[
            ("gh:melee/clang-dull-1.flac", 0.15, 0.27, 0, 1),
            (KR + "metalPot3.ogg", 0, 0.45, 0, 0.6),
        ],
        credit=(
            "alienistcog, clang (freesound 124711, from Stendhal); Kenney, RPG Audio (metalPot3)",
            "https://freesound.org/people/alienistcog/sounds/124711/",
        ),
    ),
    # ==== batch 6: Dead Ducks Arcade's power box and the Angel machine (the owner, Nov 16 17:22Z) ====
    # the power on: the breaker thrown, a motor starting, the machines' hum coming up under it
    "powerUp": dict(
        layers=[
            (KI + "impactMetal_heavy_002.ogg", 0, 0.5, 0, 0.8, 2000),
            ("gh:power/motor_start_ping.ogg", 0, 1.7, 0.05, 1),
            ("gh:power-hum/machinery.ogg~2.2", 0, 2.2, 0.35, 0.45, 1500),
        ],
        credit=(
            "CogFireStudios, electric motor start (freesound 619835); joe_anderson22, machinery (freesound 392983); "
            "Kenney, Impact Sounds (both via CDDA-Soundpacks)",
            "https://freesound.org/s/619835/",
        ),
    ),
    # the power out: the breaker drops and the machine winds down to a stop (the owner: "sound like the machine went off")
    "powerDown": dict(
        layers=[
            (KI + "impactMetal_heavy_003.ogg", 0, 0.5, 0, 0.7, 1800),
            ("gh:power/engine_stop_combustion.ogg", 0.4, 1.6, 0.03, 1, 3000),
        ],
        credit=(
            "GiocoSound, engine stop (freesound 401553, via CDDA-Soundpacks); Kenney, Impact Sounds",
            "https://freesound.org/people/GiocoSound/sounds/401553/",
        ),
    ),
    # a part (or a jerry can) picked up: a grab and a little clink
    "partGot": dict(
        layers=[
            (KR + "handleSmallLeather.ogg", 0, 0.4, 0, 1),
            (KI + "impactMetal_light_002.ogg", 0, 0.3, 0.06, 0.5),
        ],
        credit=("Kenney, RPG Audio and Impact Sounds", KENNEY_RPG),
    ),
    # a part fitted into the box: set in, latched
    "partIn": dict(
        layers=[
            (KI + "impactPlate_medium_000.ogg", 0, 0.3, 0, 0.8, 2500),
            (KR + "metalLatch.ogg", 0.03, 0.2, 0.14, 1),
            (C3, 19.78, 0.15, 0.3, 0.6),
        ],
        credit=(
            "Kenney, Impact Sounds and RPG Audio; LFA, Equipment Clicks III",
            OGA_URL["clicks3"],
        ),
    ),
    # gas poured in: the cap off, the stream, the can glugging
    "gasPour": dict(
        layers=[
            ("oga:drink/bottle-open-01.flac", 0.25, 0.4, 0, 0.7),
            ("gh:pour/tap-water-2.opus", 2.5, 1.6, 0.3, 0.8, 2500),
            ("oga:drink/Drink_01.wav", 0.05, 0.45, 0.6, 0.6, 2000),
            ("oga:drink/Drink_02.wav", 0, 0.44, 1.15, 0.6, 2000),
        ],
        credit=(
            "Owlish Media, tap water and drinks; qubodup, Liquid bottle drink set (bottle-open-01)",
            "https://opengameart.org/content/202-more-sound-effects",
        ),
    ),
    # the Angel machine at work, its whole 5 s: the machine's hum, its glow rising, sparks snapping
    "angelWork": dict(
        layers=[
            ("gh:power-hum/machinery.ogg~5", 0, 5.0, 0, 0.6, 1500),
            ("gh:angel/charge.opus", 0, 4.1, 0.2, 0.45),
            ("gh:angel/snaploop.opus", 0.4, 4.4, 0.4, 0.7),
        ],
        lp=7000,
        kbps=48,
        credit=(
            "joe_anderson22, machinery (freesound 392983); Electricity Game Sound Pack (charge, snaploop)",
            "https://opengameart.org/content/electricity-game-sound-pack",
        ),
    ),
    # the orb out: a magic shimmer and a zap
    "angelOrb": dict(
        layers=[
            ("gh:angel/magical_1.opus", 0.05, 1.5, 0, 1),
            ("gh:angel/teleport.opus", 0, 0.7, 0, 0.4),
        ],
        credit=(
            "JaggedStone, Magic Spell SFX (magical_1); Electricity Game Sound Pack (teleport)",
            "https://opengameart.org/content/magic-spell-sfx",
        ),
    ),
    # ==== batch 7: the Sad Trombone special and fire (the owner, Nov 16 17:44Z) ====
    "trombone": dict(
        sf="sad_trombone",
        lp=6000,
        kbps=48,
        credit=("GeneralUser GS SoundFont (S. Christian Collins), trombone", None),
    ),
    # fire: a crackle on a loop while something burns (sound.js burn), and the whoosh as it catches (sound.js fire)
    "fire": dict(
        layers=[("gh:flamer/fire_loop.opus", 15.0, 3.8, 0, 1)],
        lp=6000,
        loop=2.0,
        kbps=40,
        credit=(
            "PagDev, Fireplace Sound Loop",
            "https://opengameart.org/content/fireplace-sound-loop",
        ),
    ),
    "fireLight": dict(
        layers=[("gh:flamer/attack-fire-3.flac", 0, 0.64, 0, 1)],
        lp=6000,
        credit=(
            "Nic3_one, fire attack (freesound 166555, from Stendhal)",
            "https://freesound.org/people/Nic3_one/sounds/166555/",
        ),
    ),
    # ==== batch 8 (the owner, Nov 17) ====
    # the Angelic pistol's blast: the grenade's boom made a little weaker (a touch higher, less low end, a shorter tail)
    "boomSmall": dict(
        layers=[
            ("oga:explosion-big/explosion.wav", 0, 0.8, 0, 1),
            ("oga:explosion-big/lowFrequency_explosion_000.ogg", 0.05, 0.9, 0, 0.45),
            ("oga:explosion-small/explosionCrunch_000.ogg", 0, 0.6, 0.01, 0.35),
        ],
        rate=1.12,
        drive=1.8,
        credit=(
            "TinyWorlds, Explosion (explosion); Kenney, Sci-fi Sounds (lowFrequency_explosion_000, "
            "explosionCrunch_000)",
            OGA_URL["scifi"],
        ),
    ),
    # the laser gun: its beam (one a second), the hiss as it overheats, and the steam off its hot barrel (on a loop)
    "laser": dict(
        layers=[
            (KD + "laser9.ogg", 0.112, 0.55, 0, 1, 5000),
            (KD + "laser3.ogg", 0.107, 0.45, 0, 0.5, 5000),
        ],
        rate=0.92,
        lp=6000,
        fin=0.02,
        credit=("Kenney, Digital Audio (laser9, laser3)", KENNEY_DIGITAL),
    ),
    "laserHiss": dict(
        layers=[("oga:jetpack-stop/steam_hisses_-_Marker_4.wav", 0, 1.2, 0, 1)],
        lp=6000,
        credit=("bart, Steam Release Sounds", OGA_URL["steam"]),
    ),
    "laserSteam": dict(
        layers=[("oga:laser-steam/steam_hisses_-_Marker_3-start.wav~3", 0, 3.0, 0, 1)],
        lp=3500,
        loop=1.5,
        room=False,
        kbps=32,
        credit=("bart, Steam Release Sounds", OGA_URL["steam"]),
    ),
}


def spread(a, secs):
    """a short, steady recording (a gas torch's roar) made secs long: short pieces of it, each from a random place in it,
    overlapped and each faded in and out (sine fades at a quarter of a piece apart keep the loudness even), so it never
    repeats the same way"""
    rng = np.random.default_rng(7)
    a = a[int(0.02 * SR) : len(a) - int(0.02 * SR)]
    g = min(len(a), int(0.24 * SR))
    hop = g // 4
    w = np.sin(np.pi * (np.arange(g) + 0.5) / g)
    out = np.zeros(int(secs * SR) + g)
    for p in range(0, len(out) - g, hop):
        s = rng.integers(0, len(a) - g + 1)
        out[p : p + g] += a[s : s + g] * w
    return out[: int(secs * SR)] / np.sqrt(2)


def load(path, srcs, kenney):
    """a file as mono float32 at SR; "file*N": a loop recording played N times over, end to end; "file~S": a short,
    steady recording spread S seconds long (spread)"""
    times, secs = 1, 0
    if "~" in path:
        path, secs = path.rsplit("~", 1)
        secs = float(secs)
    if "*" in path:
        path, times = path.rsplit("*", 1)
        times = int(times)
    if path.startswith("oga:"):
        path = os.path.join(srcs, OGA, path[4:])
    elif path.startswith("gh:"):
        path = os.path.join(srcs, "github.com", path[3:])
    elif path.startswith("wm:"):
        path = os.path.join(srcs, "commons.wikimedia.org", path[3:])
    elif path.startswith("kn:"):
        path = os.path.join(kenney, path[3:])
    raw = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            path,
            "-ac",
            "1",
            "-ar",
            str(SR),
            "-f",
            "f32le",
            "-",
        ],
        capture_output=True,
        check=True,
    ).stdout
    a = np.tile(np.frombuffer(raw, np.float32).astype(np.float64), times)
    return spread(a, secs) if secs else a


def fades(x, sr, fin=0.005, fout=0.02):
    """from silence and back to it: 5 ms in, 20 ms out (CLAUDE.md, sound without pops)"""
    x = x.copy()
    k = min(len(x) // 2, int(fin * sr))
    x[:k] *= np.linspace(0, 1, k)
    k = min(len(x) // 2, int(fout * sr))
    x[-k:] *= np.linspace(1, 0, k) ** 2
    return x


def mixdown(layers, srcs, kenney):
    """the layers, each cut from its file (a few ms before the onset, so the attack is whole), faded and placed"""
    parts = []
    for path, at, length, place, gain, *lp in layers:
        a = load(path, srcs, kenney)
        if lp:
            a = ff(
                a, SR, f"lowpass=f={lp[0]}:poles=2,lowpass=f={lp[0]}:poles=2", SR
            )  # (this layer alone darker)
        s = max(0, int((at - 0.004) * SR))
        x = a[s : s + int(length * SR)]
        x = fades(x / max(1e-9, np.abs(x).max()), SR, fout=min(0.25, length / 3))
        parts.append((int(place * SR), x * gain))
    out = np.zeros(max(p + len(x) for p, x in parts))
    for p, x in parts:
        out[p : p + len(x)] += x
    return out


def ff(x, sr_in, af, sr_out=RATE):
    """x through an ffmpeg filter chain, back as float64 at sr_out"""
    raw = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-f",
            "f32le",
            "-ar",
            str(sr_in),
            "-ac",
            "1",
            "-i",
            "-",
            "-af",
            af,
            "-ar",
            str(sr_out),
            "-f",
            "f32le",
            "-",
        ],
        input=x.astype(np.float32).tobytes(),
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def seamless(x, sr, length):
    """a loop length s long that meets itself: its end crossfaded into its start, then a little of it repeated on both
    sides, so a loop point set a few ms off (an MP3's decoder delay) still meets itself. Returns (file, loop start s)
    """
    n, fade = int(length * sr), int(0.25 * sr)
    body = x[fade : fade + n].copy()
    tail = x[fade + n : fade + n + fade]
    w = np.linspace(0, 1, fade)
    body[:fade] = body[:fade] * np.sqrt(w) + tail * np.sqrt(
        1 - w
    )  # (equal power: an engine's roar is mostly noise)
    pad = int(0.15 * sr)
    file = np.concatenate([body[-pad:], body, body[:pad]])
    return file, pad / sr


def make(name, d, srcs, kenney, sf2):
    """one sound's file(s): a list of (file name, samples) and a loop's points"""
    takes = (
        [MAKERS[d["sf"]](sf2).astype(np.float64)]
        if "sf" in d
        else [mixdown(t, srcs, kenney) for t in d.get("takes", [d.get("layers")])]
    )
    out, loop = [], None
    for i, x in enumerate(takes):
        x = x / max(1e-9, np.abs(x).max())
        if d.get("drive"):
            x = np.tanh(d["drive"] * x) / np.tanh(d["drive"])
        x = np.concatenate(
            [x, np.zeros(int((0.15 if d.get("room", True) else 0.02) * SR))]
        )
        af = (
            [f"asetrate={round(SR * d['rate'])}", f"aresample={SR}"]
            if d.get("rate")
            else []
        )
        af += [f"lowpass=f={d['lp']}:poles=2"] if d.get("lp") else []
        af += [d["pre"]] if d.get("pre") else []
        af += (
            ["acompressor=threshold=0.05:ratio=8:attack=8:release=900:makeup=6"]
            if d.get("squash")
            else []
        )
        af += [f"aresample={RATE}:resampler=soxr", LOOK] + (
            [ROOM] if d.get("room", True) else []
        )
        y = ff(x, SR, ",".join(af))
        if d.get("loop"):
            y, start = seamless(y, RATE, d["loop"])
            loop = [round(start, 4), round(start + d["loop"], 4)]
        else:
            y = fades(y, RATE, fin=d.get("fin", 0.005), fout=0.015)
            y = y[
                : len(y) - np.argmax(np.abs(y[::-1]) > 1e-4)
            ]  # (trailing silence off)
            y = fades(y, RATE, fout=0.01)
        y *= 0.8 / max(1e-9, np.abs(y).max())
        out.append((f"{name}{'-' + str(i + 1) if len(takes) > 1 else ''}.mp3", y))
    return out, loop


def encode(path, y, kbps):
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-f",
            "f32le",
            "-ar",
            str(RATE),
            "-ac",
            "1",
            "-i",
            "-",
            "-c:a",
            "libmp3lame",
            "-b:a",
            f"{kbps}k",
            path,
        ],
        input=y.astype(np.float32).tobytes(),
        check=True,
    )


def main(srcs, kenney, sf2, *only):
    os.makedirs(OUT, exist_ok=True)
    listp = os.path.join(ROOT, "js", "sfxlist.js")
    files = {}
    for name, d in SOUNDS.items():
        if only and name not in only:
            continue
        out, loop = make(name, d, srcs, kenney, sf2)
        for f, y in out:
            encode(os.path.join(OUT, f), y, d.get("kbps", 40))
        files[name] = {"n": len(out), **({"loop": loop} if loop else {})}
        size = sum(os.path.getsize(os.path.join(OUT, f)) for f, _ in out)
        print(
            f"{name:16s} {len(out)} file(s) {size / 1024:6.1f} KB {len(out[0][1]) / RATE:5.2f} s"
        )
    jsonp = os.path.join(OUT, "list.json")
    if only and os.path.exists(jsonp):  # (a partial run keeps the others' entries)
        files = {**json.load(open(jsonp)), **files}
    files = {k: files[k] for k in SOUNDS if k in files}
    with open(jsonp, "w") as w:
        json.dump(files, w)
    with open(listp, "w") as w:
        w.write(
            "/* ---------- the sound files (written by tools/sfx/build.py: change the sounds there, not here) ----------\n"
            "   Each sound's number of files in assets/sfx/ (name.mp3, or name-1.mp3 … for a sound with a few takes), and a\n"
            "   loop's start and end (s). */\n"
            f"export const FILES = {json.dumps(files)};\n"
        )
    with open(os.path.join(OUT, "CREDITS.md"), "w") as w:
        w.write(
            "# Where every sound comes from\n\n"
            "All of them are real recordings, free to use in a game: CC0 1.0 (public domain) unless said otherwise.\n"
            "Each was cut, darkened and made smaller by `tools/sfx/build.py` (the recordings themselves aren't in\n"
            "the repo). The lobby countdown and the new round are played on the GeneralUser GS SoundFont's recorded\n"
            "instruments (its license: LICENSES.md).\n\n| Sound | From | License |\n|---|---|---|\n"
        )
        for name, d in SOUNDS.items():
            c = d["credit"]
            what = f"{c[0]}{' (' + c[2] + ')' if len(c) > 2 else ''}"
            link = f" — {c[1]}" if c[1] else ""
            lic = "GeneralUser GS license" if "sf" in d else "CC0 1.0"
            w.write(f"| {name} | {what}{link} | {lic} |\n")


if __name__ == "__main__":
    main(*sys.argv[1:])
