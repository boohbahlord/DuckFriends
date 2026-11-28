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
    whole sound, or (cents from, cents to, vibrato cents, vibrato Hz, vibrato from s). Mono (the two sides summed).
    """
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
        for c, (a, b, *vib) in (bend or {}).items():
            cents = a + (b - a) * min(1, t / secs)
            if vib and t >= vib[2]:
                cents += vib[0] * math.sin(2 * math.pi * vib[1] * (t - vib[2]))
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


def vote_tick(sf2):
    """Vote for game mode and Vote for map, each second before the last five: a very soft, short beep, a plain sine on
    E5, so it is neither the lobby's knock (count_tick, used for the last five) nor its ding at zero (count_go)
    """
    a = play(sf2, [(0, 0, 8, 80, 76, 56, 0.06)], 0.35)
    return (a * env(len(a), 0.008, 0.03, 0.035)).astype(np.float32)


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


def sad_trombone(sf2):
    """the Sad Trombone special: the old "wah, wah, wah, waaah", four steps down a half step each on a trombone, the last
    one held, sagging a little and wobbling as it goes"""
    keys = [58, 57, 56, 55]
    a = play(
        sf2,
        [
            (i * 0.42, i, 0, 57, k, 100, 0.36 if i < 3 else 1.5)
            for i, k in enumerate(keys)
        ],
        3.2,
        bend={3: (0, -45, 28, 5.5, 1.55)},
    )
    return (a * env(len(a), 0.01, 2.0, 0.25)).astype(np.float32)


def game_over(sf2):
    """Dead Ducks Arcade, everyone's down (the owner, Nov 19: the bells and the new round's sound were wrong for the
    ending, on Downpour and on the cabin): no bell and no drone, a soft, sad close. A choir sings A, F, then D down to
    rest, over slow strings holding D minor; it swells in gently and fades away over about four seconds
    """
    a = play(
        sf2,
        [(0, 0, 0, 49, k, 80, 3.6) for k in (38, 50, 53, 57)]
        + [(0.05, 1, 0, 52, 69, 78, 0.85), (0.9, 1, 0, 52, 65, 74, 0.85)]
        + [(1.75, 1, 0, 52, 62, 76, 2.2)],
        5.5,
    )
    return (a * env(len(a), 0.25, 2.6, 0.9)).astype(np.float32)


def orb(sf2):
    """Sandbox, a loot orb coming: a soft, small sparkle, two high notes on a celesta (E6, then B6), quiet"""
    a = play(sf2, [(0, 0, 0, 8, 88, 60, 0.4), (0.09, 0, 0, 8, 95, 50, 0.5)], 1.2)
    return (a * env(len(a), 0.006, 0.25, 0.25)).astype(np.float32)


def cheat_on(sf2):
    """Sandbox, cheat mode on: a short chime up a fifth on a vibraphone (C5, G5)"""
    a = play(sf2, [(0, 0, 0, 11, 72, 70, 0.3), (0.11, 0, 0, 11, 79, 74, 0.5)], 1.1)
    return (a * env(len(a), 0.006, 0.3, 0.22)).astype(np.float32)


def cheat_off(sf2):
    """Sandbox, cheat mode off: the same chime down (G5, C5), a little softer"""
    a = play(sf2, [(0, 0, 0, 11, 79, 64, 0.3), (0.11, 0, 0, 11, 72, 60, 0.5)], 1.1)
    return (a * env(len(a), 0.006, 0.3, 0.22)).astype(np.float32)


def merchant_in(sf2):
    """the merchant at his spot, open for business: a little shop bell (a music box), two quick notes (G5, then C6: low, so it never pierces)"""
    a = play(sf2, [(0, 0, 0, 10, 79, 66, 0.5), (0.12, 0, 0, 10, 84, 60, 0.7)], 1.4)
    return (a * env(len(a), 0.006, 0.35, 0.3)).astype(np.float32)


def merchant_out(sf2):
    """the merchant running off: the same bell, down and softer (C6, then G5)"""
    a = play(sf2, [(0, 0, 0, 10, 84, 56, 0.5), (0.12, 0, 0, 10, 79, 50, 0.7)], 1.4)
    return (a * env(len(a), 0.006, 0.35, 0.3)).astype(np.float32)


def tick_of(sf2, key, vel):
    """a quiet tick on a marimba, from silence: 10 ms of nothing, then a soft 8 ms swell in, so its attack never clicks"""
    a = play(sf2, [(0.01, 0, 0, 12, key, vel, 0.08)], 0.4)
    lead = int(0.01 * SR)
    e = np.zeros(len(a))
    e[lead:] = env(len(a) - lead, 0.008, 0.04, 0.05)
    return (a * e).astype(np.float32)


def se_run(sf2):
    """Seriat, a .se file set running (its window only): a quiet, high tick (C6)"""
    return tick_of(sf2, 84, 60)


def se_stop(sf2):
    """Seriat, a .se file stopped: the same tick, a fifth lower and softer (F5)"""
    return tick_of(sf2, 77, 54)


MAKERS = {
    "sad_trombone": sad_trombone,
    "count_tick": count_tick,
    "count_go": count_go,
    "vote_tick": vote_tick,
    "round_start": round_start,
    "game_over": game_over,
    "orb": orb,
    "cheat_on": cheat_on,
    "cheat_off": cheat_off,
    "merchant_in": merchant_in,
    "merchant_out": merchant_out,
    "se_run": se_run,
    "se_stop": se_stop,
    "nuke_ring": nuke_ring,
}
