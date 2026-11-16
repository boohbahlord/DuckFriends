"""The few game sounds I play on SoundFont instruments (the GeneralUser GS SoundFont, through TinySoundFont): the lobby
countdown, Dead Ducks Arcade's new round and the ring after its nuke. Used by build.py; each returns mono float32 at SR.

Needs: pip install tinysoundfont --no-deps (MIT), numpy, and GeneralUser-GS.sf2 (its license: assets/sfx/LICENSES.md).
"""

import math

import numpy as np
import tinysoundfont as tsf

SR = 44100


def play(sf2, notes, secs, bend=None):
    """notes: [(at s, channel, bank, preset, key, velocity, length s)]; bend: {channel: (cents from, cents to)} over the
    whole sound. Mono (the two sides summed)."""
    s = tsf.Synth(samplerate=SR, gain=-3)
    sf = s.sfload(sf2)
    for c in {n[1] for n in notes}:
        bank, preset = next((n[2], n[3]) for n in notes if n[1] == c)
        s.program_select(c, sf, bank, preset, bank == 128)
        s.pitchbend_range(c, 2)
    ev = sorted(
        [(at, 1, c, key, vel) for at, c, _, _, key, vel, _ in notes]
        + [(at + ln, 0, c, key, 0) for at, c, _, _, key, _, ln in notes]
    )
    out, t, step = [], 0.0, 0.01
    while t < secs:
        for e in [e for e in ev if t <= e[0] < t + step]:
            if e[1]:
                s.noteon(e[2], e[3], e[4])
            else:
                s.noteoff(e[2], e[3])
        for c, (a, b) in (bend or {}).items():
            cents = a + (b - a) * min(1, t / secs)
            s.pitchbend(c, max(0, min(16383, round(8192 + cents / 200 * 8192))))
        buf = np.frombuffer(s.generate(int(step * SR)), dtype=np.float32)
        out.append(buf.reshape(-1, 2).mean(1))
        t += step
    return np.concatenate(out).astype(np.float32)


def env(n, attack, hold, tau):
    """a swell over attack s, held, then a fade with time constant tau"""
    t = np.arange(n) / SR
    e = np.where(t < attack, np.sin(0.5 * math.pi * t / attack) ** 2, 1.0)
    return np.where(t > attack + hold, np.exp(-(t - attack - hold) / tau), e)


def count_tick(sf2):
    """the lobby countdown, each second: a soft, low knock on B4, a Vibraphone over a Marimba, with no sine on top (the
    owner, Nov 16: the blips before the last were harsh too, as B5 they were); build.py darkens it
    """
    return play(sf2, [(0, 0, 0, 11, 71, 72, 0.07), (0, 1, 0, 12, 71, 58, 0.07)], 0.6)


def count_go(sf2):
    """at zero: a fourth above the blips (E6), not the old octave and a fifth, so it rings without piercing (the owner:
    "less ear piercing at the last pitch"), with two softer repeats for the echo; build.py darkens it too
    """
    return play(
        sf2,
        [
            (0, 0, 8, 80, 88, 92, 1.0),
            (0, 1, 0, 11, 88, 70, 1.0),
            (0.12, 0, 8, 80, 88, 40, 0.7),
            (0.24, 0, 8, 80, 88, 22, 0.5),
        ],
        2.0,
    )


def round_start(sf2):
    """Dead Ducks Arcade, a new round: far off and hard to make out. A low drone (A, a fifth, a minor ninth and a tritone
    on slow strings, a choir an octave up, each sliding down a little), wind, and a thin glassy whine high above; it
    swells for about two seconds and fades over six"""
    a = play(
        sf2,
        [(0, 0, 0, 49, k, 100, 7.5) for k in (33, 40, 46, 51)]
        + [(0, 1, 0, 52, k, 70, 7.5) for k in (45, 52)]
        + [(0, 2, 3, 122, 60, 90, 7.5), (0.6, 3, 0, 92, 81, 60, 7.0)],
        8.5,
        bend={0: (-6, -55), 1: (8, -45), 3: (0, -100)},
    )
    return (a * env(len(a), 2.2, 0.4, 1.6)).astype(np.float32)


def nuke_ring(sf2):
    """Dead Ducks Arcade's nuke: the ears ringing after it, as a flashbang leaves them (the owner, Nov 16): two sines
    high up (E7), a few cents apart so the ring beats a little, swelling in fast and dying away over about four
    seconds under the roar"""
    a = play(
        sf2,
        [(0, 0, 8, 80, 100, 90, 5.0), (0, 1, 8, 80, 100, 70, 5.0)],
        5.5,
        bend={1: (14, 6)},
    )
    return (a * env(len(a), 0.05, 0.4, 1.4)).astype(np.float32)


MAKERS = {
    "count_tick": count_tick,
    "count_go": count_go,
    "round_start": round_start,
    "nuke_ring": nuke_ring,
}
