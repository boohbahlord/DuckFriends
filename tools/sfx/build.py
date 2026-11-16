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
}
KENNEY_IMPACT = "https://kenney.nl/assets/impact-sounds"
KENNEY_UI = "https://kenney.nl/assets/ui-audio"
KENNEY_IFACE = "https://kenney.nl/assets/interface-sounds"
KENNEY_RPG = "https://kenney.nl/assets/rpg-audio"
KI = "kn:kenney_impactsounds/Audio/"
KF = "kn:kenney_interfacesounds/Audio/"
KU = "kn:kenney_uiaudio/Audio/"
KR = "kn:kenney_rpgaudio/Audio/"


def one(path, length, credit, **o):
    """a sound that is one whole short file"""
    return dict(layers=[(path, 0, length, 0, 1)], credit=credit, **o)


def ui(path, credit=("Kenney, Interface Sounds", KENNEY_IFACE)):
    """a faint menu sound: short, no room"""
    return one(path, 0.6, credit, room=False, kbps=32)


GUNS = ("Still North Media, The Free Firearm Sound Library", OGA_URL["guns"])

"""Each sound: layers [(file, from s, length s, at s in the sound, gain[, low-pass Hz])], and how it's treated:
  rate   played faster (> 1, higher) or slower, as a turntable would
  lp     a darker low-pass (Hz)
  drive  squashes a gun's crack a little so the shot keeps its body, as old games' guns did
  room   the small room (default on)
  takes  [layers, …] in place of layers: one file each
  loop   (s) a seamless loop that long, in the middle of the file (js/sfxlist.js says where)
  sf     made on the SoundFont (soundfont.py) instead of from a file
  kbps   the MP3's bitrate (default 40)
Files: "oga:<folder>/<file>" (SOURCES/opengameart.org), "kn:<path>" (KENNEY), "sf:<maker>"."""
SOUNDS = {
    # ---- the lobby countdown (the owner's take B) and Dead Ducks Arcade's new round ----
    "countTick": dict(
        sf="count_tick",
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
    # ---- every gun its own reload ----
    "reloadHandgun": dict(
        layers=[("oga:guns-reload/gunreload1.wav", 0.1, 1.45, 0, 1)],
        credit=("SpringySpringo, Gun Reload Sounds", OGA_URL["reload"]),
    ),
    "reloadAk": dict(
        layers=[("oga:guns-reload/assaultriflereload1.wav", 0.0, 1.5, 0, 1)],
        credit=("SpringySpringo, Gun Reload Sounds", OGA_URL["reload"]),
    ),
    "reloadRevolver": dict(
        layers=[("oga:guns-reload/equipmentclicks.wav", 0.05, 0.85, 0, 1)],
        credit=("LFA, Equipment Clicks II", OGA_URL["clicks2"]),
    ),
    "reloadSmg": dict(
        layers=[("oga:guns-reload/equipmentclicks.wav", 1.9, 1.1, 0, 1)],
        credit=("LFA, Equipment Clicks II", OGA_URL["clicks2"]),
    ),
    "reloadSniper": dict(
        layers=[("oga:guns-reload/equipmentclicks.wav", 3.7, 1.2, 0, 1)],
        credit=("LFA, Equipment Clicks II", OGA_URL["clicks2"]),
    ),
    "reloadLmg": dict(
        layers=[("oga:guns-reload/equipment_clicks3.wav", 0.1, 1.45, 0, 1)],
        credit=("LFA, Equipment Clicks III", OGA_URL["clicks3"]),
    ),
    "reloadChaingun": dict(
        layers=[("oga:guns-reload/equipment_clicks3.wav", 3.2, 1.4, 0, 1)],
        credit=("LFA, Equipment Clicks III", OGA_URL["clicks3"]),
    ),
    "reloadShotgun": dict(
        layers=[("oga:guns-reload/equipment_clicks3.wav", 4.95, 1.6, 0, 1)],
        credit=("LFA, Equipment Clicks III", OGA_URL["clicks3"]),
    ),
    "reloadGlauncher": dict(
        layers=[("oga:guns-reload/equipment_clicks3.wav", 6.4, 1.3, 0, 1)],
        credit=("LFA, Equipment Clicks III", OGA_URL["clicks3"]),
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
    # ---- explosions: the grenade, the Jaime Bomb (bigger), the meteor ----
    "boom": dict(
        layers=[("oga:explosion-grenade/explosion1.ogg", 0, 1.6, 0, 1)],
        drive=2,
        credit=("EZduzziteh, Explosions (explosion1)", OGA_URL["explosions"]),
    ),
    "boomBig": dict(
        layers=[("oga:explosion-big/explosion3.ogg", 0, 1.7, 0, 1)],
        drive=2,
        credit=("EZduzziteh, Explosions (explosion3)", OGA_URL["explosions"]),
    ),
    "meteor": dict(
        layers=[("oga:explosion-big/lowFrequency_explosion_000.ogg", 0.05, 1.9, 0, 1)],
        drive=2,
        credit=("Kenney, Sci-fi Sounds (lowFrequency_explosion_000)", OGA_URL["scifi"]),
    ),
    # Dead Ducks Arcade's nuke: the biggest, a deep boom rolling away
    "nuke": dict(
        layers=[
            (
                "oga:explosion-big/NenadSimic_-_Muffled_Distant_Explosion.wav",
                0,
                3.0,
                0,
                1,
            )
        ],
        drive=2,
        kbps=48,
        credit=("NenadSimic, Muffled Distant Explosion", OGA_URL["muffled"]),
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
}


def load(path, srcs, kenney):
    """a file as mono float32 at SR"""
    if path.startswith("oga:"):
        path = os.path.join(srcs, OGA, path[4:])
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
    return np.frombuffer(raw, np.float32).astype(np.float64)


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
        af += [f"aresample={RATE}:resampler=soxr", LOOK] + (
            [ROOM] if d.get("room", True) else []
        )
        y = ff(x, SR, ",".join(af))
        if d.get("loop"):
            y, start = seamless(y, RATE, d["loop"])
            loop = [round(start, 4), round(start + d["loop"], 4)]
        else:
            y = fades(y, RATE, fout=0.015)
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
