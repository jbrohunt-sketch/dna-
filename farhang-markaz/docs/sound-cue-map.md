# Farhang Markaz — Sound / rhythm proposal v1 (Sound Director, Phase 5)

Status: DRAFT for client approval. **Provisional throughout** — the real doira/dutar recordings
set the grid. Companion to `motion-beat-sheet.md`.

## 1. Rhythmic proposal
- Uzbek doira accompaniment is built from **usul** (cyclic dum / tak / ring-stroke patterns).
  Assumption: a compound-duple dance usul in the family of *ufar* (6/8 maqom dance usul; Med for
  the genre, Low for exact stroke order) — or the player's Fergana dance usul (e.g. what they
  play for *Andijon polkasi*, duple; Low). Skeleton used here (placeholder, not a claim): dum on
  pulse 1, tak on pulse 5 as pickup. The player's actual usul replaces it.
- **Provisional grid:** pulse P = 6 f (♪); 6/8 bar = 36 f (dotted-quarter ≈ 100 BPM).
  **Film = 432 f (14.4 s)** = 12 bars of 6/8 or 18 bars of 2/4. Downbeats at 6 + 36k; opening
  mid-spin = opening mid-bar.
- **Range, not a lock:** P = 5–7 f (dotted-quarter 120–86 BPM) → loop 450 / 432 / 420 f; the
  player's comfortable tempo decides. Cruise ω tied to pulse: ω = 72°/(2P) (P = 6 → 6°/f; one of
  the 5 bundles passes 12 o'clock every 2 pulses).
- Non-integer real tempo: keep the performance un-quantised, snap each visual cue to the frame at
  or just after its detected onset; loop = n real bars rounded to whole frames, ≤ 1% stretch.

### Beat moves (Motion Director f → new f)
| beat | MD | new |
|---|---|---|
| T1 tak | 30 | 30 (pickup) |
| T1 dum / skin opens | 43 | 42 (downbeat) |
| second-wave tak | 66 | 66 |
| Return | 80 | 78 (downbeat) |
| T2 peel | 120 | 114 (downbeat) |
| String seat | 148 | 150 (downbeat) |
| Frets | 162–188 | 160–184 |
| Pluck 1 | 190 | 186 (downbeat) |
| Warp | 200–241 | 196–245 |
| SF2 | 246 | 246 |
| 2nd pluck / bend | 250 / 252 | 252 (pickup) |
| Plate close | 292 | 294 (downbeat) |
| Escalation | 312–349 | 312–341 |
| Final spin | 350–377 | 342–365 |
| Final dum / Identity | 376 / 378 | 366 / 366–401 |
| Handoff | 405–434 | 402–431 (30 f) |

Consequences: re-solve the escalation ω gain so θ(366) ≡ 298; pluck 2 *starts* the bend and the
seam closes on the dum @294 (resolves beat-sheet risk 2); `timeline.ts` must be rewritten.

## 2. Sound cue map
Contemporary layer = **stretched overtone**: spectral freeze of the event's own partials, from
the session recordings only, never pitch-ramped. Reversed-jingle swells replaced by forward ring
sounds. Offset rules — **A** transient at N, visual at N/N+1 (default lead 0–1 f; >~45 ms audio
lead is noticeable) · **B** ≤ 2 f lead for slow-onset visuals · **C** one tick per visual element
· **D** sound envelope drives the visual parameter.

| cue | f | visual | sound | dur/decay | contemporary | rule |
|---|---|---|---|---|---|---|
| S01 | 30 | T1 palm wave; spin brakes | tak, rim, bright | 60 ms | — | A |
| S02 | 42 | skin opens from centre | dum, open, low | 400 ms | skin overtone 0.8 s | A |
| S03 | 48–64 | rings sweep in | ring shake, short | 16 f | — | D |
| S04 | 66 | second wave | tak, lighter | 60 ms | — | A |
| S05 | 78 | Return: hole opens | pressed dum (muted) | 120 ms | — | A |
| S06 | 84–112 | rings sweep out | ring shake, decaying | 28 f | — | D |
| S07 | 114 | T2 peel: arm through ribbon | dutar fingertip slide, upper string, no pluck | 114–140 | — | B |
| S08 | 150 | string seat | palm-muted pluck, lower string | 120 ms | — | A |
| S09 | 160–184 | 13 frets tick on | finger over tied frets, one tick per fret | 2 f apart | — | C |
| S10 | 186 | pluck 1; she draws in | open pluck, lower string, fingernail | 1–1.5 s | — | A |
| S11 | 196–245 | warp spreads | (S10 sustain) | — | overtone of S10 fundamental, env = spread, gone by 245 | D |
| S12 | 252 | pluck 2 starts the bend | open pluck, upper string | 1.2 s | overtone under bend to 290 | A |
| S13 | 294 | plate seam closes | dum, open, medium | 300 ms | — | A |
| S14 | 296–311 | checks open (sweep) | ring cascade (tilted frame) | 16 f | — | D |
| S15 | 312–341 | escalation; tak waves; braid flicks | dum/tak each pulse to 329 (D312 t318 t324), then 3 f subdivisions to 341; dutar open-string accents on flicks (lo 318, hi 330) | per stroke | none | A |
| S16 | 342–365 | final spin | ring roll, env = ω (peak ~352, dies as she brakes) | roll | — | D |
| S17 | 366 | final dum; keyline → 0; identity | dum, open, full | 500 ms | overtone to ~392, < −40 dB by 400 | A |
| S18 | 402 | handoff: spin restarts | soft tak → ring slide (rotated frame) | 402 → wraps to f14 | — | A/D |

## 3. Silence & density
| section | frames | max voices |
|---|---|---|
| Open | 0–29 (ring tail dies by f14, then near-silence) | 1 |
| T1 | 30–77 | 3 |
| Return | 78–113 | 2 |
| Peel / seat | 114–159 (near-silent) | 1 |
| Frets / pluck / warp | 160–245 (230–251 decay only, near-silent around SF2) | 2 |
| Bend / plate | 252–311 | 3 |
| Escalation | 312–341 (the only dense passage) | 4 |
| Final spin | 342–365 | 2 |
| Identity | 366–401 (392–401 silence: the wordmark reads in quiet) | 2 |
| Handoff | 402–431 | 2 |

## 4. Loop audio
No bed, no drone — nothing sounds without a cause. Render the mix as a circular buffer: S18's
tail folds onto f0–14 so samples are continuous across the seam. The seam sits in a low-energy,
noise-like ring decay; nothing tonal and no transient within ±6 f of f0 (masks platform AAC
padding). 48 kHz → 1 frame = 1,600 samples; 432 f = 691,200 samples. Test: three loops back to
back with no fades; f431→f0 is an ordinary step.

## 5. Placeholder plan (TEMP — never final)
- `scripts/gen-temp-audio.mjs` (deterministic, seeded) → 48 kHz mono WAVs in
  `public/audio/temp/`, all prefixed `TEMP_`; render composition `Film-TempAudio`.
- Files: `TEMP_dum_open` (75→60 Hz sine drop + noise click, τ 180 ms) · `TEMP_dum_muted` (τ 60 ms)
  · `TEMP_tak`, `TEMP_tak_soft` (noise band-passed 2.5–4 kHz) · `TEMP_ring_shake / cascade / roll /
  slide` (high-passed inharmonic-sine grains) · `TEMP_fret_tick` (1 ms click) · `TEMP_dutar_slide`
  (band-passed noise) · `TEMP_pluck_lo` (147 Hz) / `TEMP_pluck_hi` (196 Hz, a fourth up)
  Karplus–Strong, damped ~1 s (pitches arbitrary) · `TEMP_pluck_muted` ·
  `TEMP_ctx_overtone_lo/hi` (2× sine, 80 ms attack). Deliberately synthetic, no scale, no
  reverb; transient trimmed to sample 0.
- Wiring: `timeline.ts` exports one `audioCues[]` (`{id, frame, src, gainDb, durationInFrames,
  visualCue}`); visual cue frames read from the same list. A `Soundtrack` component maps each
  cue to `<Sequence from={frame}><Audio/></Sequence>` (`@remotion/media`; check trim props via
  remotion-docs). Cues whose tail passes DURATION are mounted again at `from = frame − DURATION`.
  Silent cue markers render in Studio only.
- Gain (peak dBFS, no compression/limiter, temp bus ceiling −6): dum −12 · tak −15 · pluck −14 ·
  rings −20 · fret ticks −30 · slide −32 · overtone ≥ 12 dB under its parent.

## 6. Recording brief
- **Doira:** dum open + pressed, 3 dynamics × 5 round-robins, rings live and hand-damped; tak
  open + soft + any snapped-finger rim stroke (get its name); rings: single flicks, 0.3 s and
  1.2 s shakes, tilt cascade, frame-rotation slide, uneven swell roll; phrases: the player's
  ufar and a Fergana dance usul at P = 5 / 6 / 7 f (120 / 100 / 86 BPM), free and to click; then
  one take played against the animatic — **this take sets the grid**.
- **Dutar:** silk strings if available, nylon otherwise [R11]; player's standard fourth tuning +
  fifth and unison alternatives (instrument sets absolute pitch). Per string: fingernail open
  plucks 3 dyn × 5; natural decay + damped at 0.3 s / 1 s; palm-muted plucks; left-hand slides
  over tied frets (up/down, slow/fast); fingertip brushes; natural harmonics. Open strings only,
  no melody.
- **Contemporary layer:** built only from this session (freezes of skin resonance, open-string
  sustains, harmonics). **No additional Central Asian gesture** — not compositionally necessary.
- Advisory: dry treated room (RT60 < 0.3 s); doira SDC/LDC at skin 40–60 cm + SDC ring side
  30 cm; dutar SDC at neck–soundboard joint 25–30 cm + one near the bowl; 48 kHz / 24-bit; 30 s
  room tone; mono-safe.

## 7. Risks
| risk | avoid by |
|---|---|
| looped 6/8 groove → stock "Middle Eastern" | strokes only where there is a gesture; repetition only in the escalation |
| sema / dervish read [R9] | spin + drone + reverb triggers it → dry, no drone |
| "exotic" dutar | two open-string pitches only; no augmented-second runs |
| overtone becomes a riser | never pitch up or swell into a hit; always decays under its parent |
| final dum → trailer boom | no sub enhancement, reverb or pre-swell; roll follows ω and dies first |
| escalation → EDM build | density of strokes only; no filter sweeps / sidechain |
| rings as "sparkle" SFX | cap ring cues at 6 |
| placeholders become final | TEMP naming + review gate before final timing |
| usul names overclaimed | verify with the musician; keep them out of copy |
