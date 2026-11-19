/* ---------- Survival (the owner's, Nov 19 19:27Z, 19:47Z and 19:52Z) ----------
   Dead Ducks Arcade's zombies on Downpour, with no rounds: "zombies continuously spawn ... the difficulty goes up and down
   and swells". It runs on Dead Ducks Arcade's engine (sandboxrules.js baseMode gives "l4dd" for it); this file holds
   what's its own, and l4ddrules.js asks it at each heartbeat (survTick). The phases, never announced:
   - rest: a few walkers wander about (the slowest zombies, 20% slower again), coming for a duck only when it's close or
     shines its flashlight's middle on one for 4 to 6 s; 20 to 42 whole seconds (15 more after a big rush); a merchant
     comes every rest (sure, not half the time). No slot machine and no pumps, so none of their squares.
   - peak: a horde, its size and its zombies' stats each from a shuffled bag (the first peak always round 9's), over the
     fences as in Dead Ducks Arcade; every walker on the map sprints with them. It ends when they're all dead.
   - tail: 10 to 15 s of walkers turning up far from everyone; the ones still alive come with the next peak.
   s.hang.sv = { ph: "rest" | "peak" | "tail", t: when it began, until: when a rest or a tail ends, k: peaks so far,
   big: the last horde was a big one, sz: [the sizes' bag], lv: [the stats' bag] }. This file has no imports. */

export const isSurv = (s) => !!s && !!s.options && s.options.mode === "surv";
/* the room's mode as the rules run it (rules.js reduceStep sets it before every action, as layout.js useMode): for the
   parts of the rules that see no state (a weapon's full ammo) */
let ON = false;
export const survOn = () => ON;
export const survSet = (o) => (ON = !!o && o.mode === "surv");

export const SV = {
  REST: [20, 42], // whole seconds of rest ("a range of integers. It could be any whole number")
  BIG_REST: 15, // more seconds of rest after a big horde ("there is an additional 10 or 15 seconds ... We'll say 15")
  TAIL: [10, 15], // seconds of walkers turning up far away after a horde ("a little like 10 or 15 second phase")
  TAIL_EVERY: 900, // ms between two of them
  SIZES: [24, 48], // a horde, each player ("it can only be 24 or 48 per player")
  LEVELS: [9, 13, 25], // its zombies' stats: as round 9's, 13's or 25's ("could be based off of round 9, maybe round 13 ... or after 25")
  FIRST: 9, // the first horde's (the owner's pick, Nov 19 19:35Z)
  WALK_K: 0.8, // a walker: the slowest zombie's speed, 20% slower ("maybe 20% slower")
  NEAR: 3, // duck lengths: a walker this close comes for you ("a few ducks away")
  LOSE: 9, // duck lengths: one that came for you and is this far again forgets you
  LIT: [4000, 6000], // ms in a flashlight's middle before a walker comes ("after 4 or 6 seconds, not in an exact time")
  LIT_FAR: 0.6, // of the beam's reach: its close part ("not like the very far edge of the flashlight")
  LIT_HALF: 0.5, // of the beam's half width: its middle
  START: [4, 2], // walkers about when the game starts: 4, and 2 more for each player
  REST_MOST: [4, 3], // walkers about in a rest at most: 4, and 3 more for each player
  REST_EVERY: 4000, // ms between two walkers wandering in during a rest
  FAR: 0.3, // of the map's width: how far from every duck a walker turns up, at least ("extremely far away enough")
  ROAM: 320, // world px: how far a walker wanders to its next spot, at most
  IDLE: [1000, 4000], // ms a walker stands about at a spot before it wanders on
  BEAM: { far: 560, half: (27 * Math.PI) / 180 }, // a flashlight (as l4dd.js CONE draws it)
  ARROWS: 300, // a bought bow's arrows ("The bow has 300 arrows")
  KIT: ["", "handgun", "", ""], // what a duck starts with ("players start out with only a pistol. No bow")
  GUNMEN: 0.25, // a peak's chance of gunmen instead of zombies ("maybe a 25% chance, that a group of ducks come in that have guns")
  CRIM: 0.75, // gunmen: criminals this likely, soldiers the rest ("like 75% chance") …
  STEP: 0.05, // … each pick making its own side this much less likely, till the other side comes up ("Every time that it's a criminal, it becomes 5% chance less likely")
};
/* which gunmen come: "c" criminals or "s" soldiers, and the streak after it (st: [the side picked last, how many times
   in a row]) */
export function gunSide(st) {
  const [side, n] = st || ["", 0],
    pc = Math.min(
      0.95,
      Math.max(
        0.05,
        SV.CRIM + (side === "c" ? -1 : side === "s" ? 1 : 0) * SV.STEP * n,
      ),
    ),
    k = Math.random() < pc ? "c" : "s";
  return [k, [k, k === side ? n + 1 : 1]];
}

/* a shuffled bag: the next one (and what's left); a new shuffle once it's empty ("it shuffles") */
export function nextOf(bag, all) {
  let left = bag && bag.length ? [...bag] : shuffle(all);
  const one = left.shift();
  return [one, left];
}
function shuffle(xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/* a whole number from a to b */
export const wholeIn = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));

/* how long a game has gone on (ms): from its start to now, or to the moment everyone was down */
export const survTime = (s, now) => {
  const L = s && s.hang && s.hang.l4;
  if (!L || !L.g) return 0;
  return Math.max(0, (L.over ? L.over.at : now) - L.g);
};
/* a new game: a rest first, its walkers about (l4ddrules.js setUp makes them) */
export function survStart(s, now) {
  s.hang.sv = {
    ph: "rest",
    t: now,
    until: now + wholeIn(SV.REST) * 1000,
    k: 0,
    big: 0,
    sz: [],
    lv: [],
    nx: now + SV.REST_EVERY,
  };
}
/* every heartbeat (l4ddrules.js l4Tick, which keeps the round's own numbers in L and the zombies in zs, and adds the
   ones pushed into zs): the phases go on. n: the players. h: what only l4ddrules.js can do, { walker(): a new walker
   far from everyone (or null), speedAt(level): a zombie's speed at that level's stats, go(): the merchant leaves,
   rest(): a rest begins (the merchant comes, the ghosts are back), gunmen(side): a wave of gunmen comes in instead of a
   horde ("c" criminals, "s" soldiers: gunmen.js), gunDone(): true once that wave is over } */
export function survTick(s, L, zs, now, n, h) {
  let sv = { ...s.hang.sv };
  const live = zs.filter((z) => z.st !== 3),
    walkers = live.filter((z) => z.wk);
  if (sv.ph === "rest") {
    if (now >= sv.nx) {
      sv.nx = now + SV.REST_EVERY;
      if (walkers.length < SV.REST_MOST[0] + SV.REST_MOST[1] * n) {
        const z = h.walker();
        if (z) zs.push(z);
      }
    }
    if (now >= sv.until && sv.k && Math.random() < SV.GUNMEN) {
      /* the peak is gunmen (never the first): the walkers don't sprint, and more keep wandering in (gunmen.js) */
      const [g, gs] = gunSide(sv.gs);
      h.gunmen(g);
      Object.assign(L, { t0: now, n: 0, made: 0, owe: 0, acc: 0, sec: -1 });
      sv = { ...sv, ph: "peak", t: now, until: 0, k: sv.k + 1, big: 0, g, gs };
      h.go();
    } else if (now >= sv.until) {
      /* the peak: the horde's size and its stats from their bags (the first one always round 9's), and every walker on
         the map sprints with it */
      let lvl = SV.FIRST,
        lv = sv.lv,
        size,
        sz;
      if (sv.k) [lvl, lv] = nextOf(lv, SV.LEVELS);
      [size, sz] = nextOf(sv.sz, SV.SIZES);
      for (const z of walkers) {
        for (const k of ["wk", "wt", "wd", "wn", "lt", "lw"]) delete z[k];
        z.l = [...z.l];
        z.l[1] = h.speedAt(lvl);
      }
      Object.assign(L, {
        r: lvl,
        t0: now,
        n: size * n,
        made: 0,
        owe: 0,
        acc: 0,
        sec: -1,
      });
      sv = {
        ...sv,
        ph: "peak",
        t: now,
        until: 0,
        k: sv.k + 1,
        g: "",
        big: size === Math.max(...SV.SIZES) ? 1 : 0,
        sz,
        lv,
      };
      h.go();
    }
  } else if (sv.ph === "peak" && sv.g) {
    if (now >= sv.nx) {
      sv.nx = now + SV.REST_EVERY;
      if (walkers.length < SV.REST_MOST[0] + SV.REST_MOST[1] * n) {
        const z = h.walker();
        if (z) zs.push(z);
      }
    } // ("the lame walker zombies ... will kind of be spawning in different parts of the map")
    if (h.gunDone()) {
      sv = {
        ...sv,
        ph: "tail",
        t: now,
        until: now + wholeIn(SV.TAIL) * 1000,
        nx: now,
      };
    }
  } else if (sv.ph === "peak") {
    if (L.made >= L.n && !live.some((z) => !z.wk)) {
      sv = {
        ...sv,
        ph: "tail",
        t: now,
        until: now + wholeIn(SV.TAIL) * 1000,
        nx: now,
      };
      L.n = L.made;
    }
  } else {
    if (now >= sv.nx) {
      sv.nx = now + SV.TAIL_EVERY;
      const z = h.walker();
      if (z) zs.push(z);
    }
    if (now >= sv.until) {
      sv = {
        ...sv,
        ph: "rest",
        t: now,
        until: now + (wholeIn(SV.REST) + (sv.big ? SV.BIG_REST : 0)) * 1000,
        nx: now + SV.REST_EVERY,
      };
      h.rest();
    }
  }
  s.hang.sv = sv;
}

/* a walker: does it go on wandering (true), or come for a duck? It comes for one this close, or one whose flashlight's
   middle has been on it 4 to 6 s (z.lt: since when, z.lw: how long it takes this time); it forgets one that got far
   enough away. pls: the ducks it could come for, { id, xy, p (its pos) }. off: the flashlights switched off. far(d):
   duck lengths between it and a spot; clear(x0, y0, x1, y1): nothing in between */
export function survWatch(z, pls, now, W, H, off, far, clear) {
  if (z.wk === 2) {
    const q = pls.find((q) => q.id === z.wt);
    if (q && far(q.xy) <= SV.LOSE) return false;
    z.wk = 1;
    delete z.wt;
  }
  let lit = null;
  for (const q of pls) {
    if (far(q.xy) < SV.NEAR) {
      z.wk = 2;
      z.wt = q.id;
      return false;
    }
    if (!lit && litBy(z, q, W, H, off, clear)) lit = q;
  }
  if (!lit) {
    delete z.lt;
    delete z.lw;
    return true;
  }
  if (!z.lt) {
    z.lt = now;
    z.lw = SV.LIT[0] + Math.round(Math.random() * (SV.LIT[1] - SV.LIT[0]));
  }
  if (now - z.lt < z.lw) return true;
  z.wk = 2;
  z.wt = lit.id;
  delete z.lt;
  delete z.lw;
  return false;
}
/* is zombie z in the close part of the middle of duck q's flashlight? */
function litBy(z, q, W, H, off, clear) {
  const p = q.p;
  if (!p || off[q.id]) return false;
  const ax = (+p.ax || 0) * W,
    ay = (+p.ay || 0) * H,
    l = Math.hypot(ax, ay),
    dx = z.x - q.xy[0],
    dy = z.y - q.xy[1],
    d = Math.hypot(dx, dy);
  if (l < 1e-6 || d < 1 || d > SV.BEAM.far * SV.LIT_FAR) return false;
  if ((dx * ax + dy * ay) / (d * l) < Math.cos(SV.BEAM.half * SV.LIT_HALF))
    return false;
  return clear(q.xy[0], q.xy[1], z.x, z.y);
}

/* a time in seconds as the timer shows it: 0:42, 12:05, 1:02:09 */
export function clockOf(secs) {
  const t = Math.max(0, Math.floor(secs)),
    h = Math.floor(t / 3600),
    m = Math.floor((t % 3600) / 60),
    sec = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
