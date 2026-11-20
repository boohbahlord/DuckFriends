---
paths:
  - "js/music.js"
  - "js/musicbar.js"
  - "js/sound.js"
  - "js/sfx*.js"
  - "js/sbaudio.js"
  - "js/hangout/piano*.js"
  - "tools/clickcheck.js"
  - "tools/sfx/**"
---
## Sound without pops (every sound made in code: songs, piano, sounds)
A pop is the wave jumping. Every rule below stops one kind of jump; check each one for every new voice or sound.
- Start every note from silence and end it at silence. Its gain node starts at 0 (`g.gain.value = 0`), then
  `setValueAtTime(0, t)` and a ramp up. Fade-ins of at least 5 ms (low notes 10 to 16 ms, thumps 16 ms or more). Fades
  out over at least 10 ms; with `setTargetAtTime(0, t, tau)`, stop the source no sooner than `t + 6 * tau`.
- Schedule ahead. Never set a start, a stop or a gain change at `currentTime` or before it: set late, the fade-in is
  skipped and the note clicks (in Chrome it can even start far too loud). Live notes: `currentTime + 0.02` or more
  (Firefox's `currentTime` only moves between tasks). A note-off uses the same lead as its note-on.
- Never jump a gain or a filter. No `.value =` and no `setValueAtTime` to a new level on something that is sounding.
  To change a level that is moving, hold it first (`cancelAndHoldAtTime(t)`, or `cancelScheduledValues(t)` then
  `setValueAtTime(param.value, t)`), then ramp. Exponential ramps can't reach 0: ramp to 0.0001, or use setTargetAtTime.
- Noise at a note's start (hammers, chiffs, breath, sticks) is heard as crackling: ramp it in over 5 ms or more, keep it
  quiet and dark (filtered), or leave it out.
- Leave headroom. The sum of everything playing stays under 1: lower each voice, and end the chain with a soft ceiling
  (see `chain()` in `js/hangout/pianokeys.js`). A `DynamicsCompressorNode` adds its own make-up gain, so it is not a
  limiter on its own.
- Recordings: a buffer that starts or ends away from 0, or a loop that doesn't meet itself, clicks. Fade the first and
  last few ms.
- Keep it light. Every oscillator costs work 44,100 times a second; too many at once and the sound stutters
  (crackles). Cap the voices, stop sources once silent, and prefer a recorded buffer for many repeats.
- Check it: render the sound offline and run `findClicks` from `tools/clickcheck.js` (0 clicks, 0 clipped). Render it
  late too (an `OfflineAudioContext.suspend()`, then schedule a few ms in the past) to prove a late note stays quiet.
