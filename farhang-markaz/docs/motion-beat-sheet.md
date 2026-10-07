# Farhang Markaz — Motion choreography v1 (Motion Director, Phase 5)

Status: DRAFT for client approval. Placeholder timing: 30 fps, 435 f (14.5 s), f435 ≡ f0.
θ = rotation (deg, clockwise); ω in °/frame (6°/f = π rad/s). **Every cue is re-derived by the
Sound Director from real audio; no BPM is locked.**

## 1. Beat sheet

| beat | frames | what we see | gesture | sound | params (from → to) |
|---|---|---|---|---|---|
| 0 Open | 0–29 | SF1 mid-spin | cruise spin; right arm rises | ring-shimmer bed | θ 28→208; armLift 0→−8 |
| 1 T1 tak | 30–43 | flat red wave leaves right palm; spin checks; arms/braids/cap draw into centre | palm strike | **tak @30** | strike@palm r 0→0.25R w 12→3; body 1→0 (34–43); ω 6→3 |
| 2 T1 dum | 44–79 | milk skin opens from where the cap vanished, swallows bundles; band reads as rim; 24 rings sweep in; second wave | (skin struck) | **dum @43**; jingle 50–64; tak @66 | skin.out 0→0.87R; rings 0→1 (sweep); strike r 0→0.87R; Doira rot = θ; ω 3→1.5 |
| 3 Return | 80–119 | hole opens in skin from centre; she blooms on cobalt; bundles reappear; skin's last 12 px stays as a keyline | arms open; spin re-accelerates | reversed-jingle swell | skin.in 0→0.87R−12; rings 1→0 (sweep); body 0→1 trailing hole by 4 f; ω 1.5→6 |
| 4 T2 peel | 120–161 | hero braid leaves ribbon, straightens, swings vertical, extends across disc to seat on keyline | arm sweeps through ribbon @120 | overtone glide; string-seat thud @148 | heroPeel 0→1 |
| 5 Dutar | 162–191 | braid unzips into two ink strings; 13 saffron frets tick on at top | she spins under strings | 13 jingle ticks | Dutar gap 3→38.3 (= warp pitch), weight→12, frets 0→13 (1/2 f) |
| 6 Pluck | 192–215 | palm passes left string → centred fundamental; she draws in; bundles retract to hem; frets tick off | palm pluck | **pluck @190** | pluck.amp 0→29; body 1→0 (192–203); warp [0,1]→[1,1]; frets 13→0; ω 6→0 |
| 7 Warp | 200–241 | cobalt field splits into 24 strips thinning into threads, spreading from the string; threads grow through ring to frame edges; dye spreads | (pluck) | pluck sustain + stretched overtone | spread 0→12 (2 f/thread); width 38.3→12; cobalt→sky as strip narrows; extent 0→1 (216–241); keyline 12→0; ring band→band/2; dye 0→1 |
| 8 SF2 | 242–251 | SF2 exactly at f246 | — | sustain decays | amp 29→22 |
| 9 T3 bend | 252–291 | warp curls around centre, closes at bottom seam; beyond-ring lengths drawn inside; flame tiles to 12, relaxes into bodom | — | **2nd pluck (other string) @250** | bend t 0→1; W 920→1156; h [−1144,776]→[0,193]; period ∞→2 threads; smooth 0→1 (270–291) |
| 10 Plate | 292–311 | threads widen to milk ground; glaze travels round from the ink thread; ring widens, checks open; medallion grows | — | 24 jingle hits | width 12→pitch−5; glaze 0→1; ring→band; checks 0→1 (sweep); lobes 0→1; plate rot ω 0→3 |
| 11 Escalation | 312–349 | cobalt floods back through bodom; milk left at centre becomes the cap; she blooms; bundles regrow; checked band + keyline stay; tak waves from palms; hero braid regrown split, flicks on each pluck | full arms; spin builds; palm strikes | dum/tak accelerating with ω; pluck accents | flood 0→1; lobes→cap bushes; body 0→1; heroPeel −1→0; warp [0,0]→[0,1]; flames 0→1; ω 3→9 |
| 12 Final spin | 350–377 | peak speed; bundles shear into arcs then retract into hem; arms/braids into cap as it grows; checks close to solid band | last turn | jingle roll → **dum @376** | ω 9→12 (f358)→0; shear→+23°; warp→[1,1]; checks 1→0; body 1→0; capScale 1→2.5; keyline 12→0 (376–378) |
| 13 Identity | 378–404 | SF3 at θ≡298 (4-fold cap reads 28°); wordmark drawn from centre axis to disc width | — | jingle tail | reveal 0→R (378–392) |
| 14 Handoff | 405–434 | wordmark closes to centre; cap shrinks + turns 90°; figure blooms out | spin restarts | reversed jingle into shimmer | reveal R→0 (405–418); capScale 2.5→1; θ 298→388; body 0→1 (412–434); braidLag 0→46; warp [0,0]→[0,1], flames 0→1 (418–434) |

## 2. Camera
Locked overhead, scale 1.0, disc centre (540,960) never moves. All scale change is object-level
(cap 0.28R↔0.7R; T2 strings span the full diameter = relative close-up, frets allowed). The 920 px
edge is always visible (skirt → doira rim → window ring → plate rim → identity disc). SF2 entry:
threads grow through the ring (`extent`) to the frame edges; exit: `bend` reels them back inside.

## 3. Transition mechanics (new parameters for the Remotion Engineer)
- **T1:** palm wave + `body` draw-in + braking ω on tak; skin opens on dum from the centre (cap
  and skin are the same milk). Skin outer radius 0.87R = bundle outer end, so it covers them
  exactly; band = rim. New: `Doira.skin [in,out]`; `rings` becomes an angular sweep.
- **Return:** skin drains outward; inner radius → 0.87R−12; hole always ahead of `body`.
- **T2:** new `heroPeel` (−1..1): 0→0.4 off-ribbon & lag→0; 0.4→0.8 decouples from θ to
  vertical; 0.8→1 extends to keyline (±0.87R). At 1 it equals `Dutar` (gap = w+3, weight = w) —
  swap components that frame. Dutar pluck → raised cosine (same structure as SF2).
- **T3:** factor SF2 into one `Cloth` component; threads as warp-space polygons through `bend`.
  New on Cloth: `spread, extent, width, dye, period, glaze, amp`; new on DyedThreads: `smooth`
  (quantised like `flame()`). Widening threads to pitch turns dyed spans into filled flames,
  then milk ground; the 12 remaining 5 px gaps become the ink dividers.
- **Escalation:** plate `flood, lobes, checks`; the milk patch left at centre becomes the cap;
  lobes fold back into its four bushes (rotated to θ).
- **Identity:** `Dancer.capScale` (independent of `body`), `Skirt.warp [in,out]`, `Skirt.shear`;
  every trace exits outward into the hem; keyline thins to 0 on the dum; wordmark `reveal` is a
  mask whose half-width grows 0→R.

## 4. Accumulation (fixed zones, outside-in, max one trace per transformation)
After T1: keyline only (12 px milk at 0.87R). During T3 the keyline is absorbed into the window
ring. After plate: rim keeps 24×2 checks (doira rings → plate cells), counter-rotating at −θ/4.
Escalation set: keyline, checked band, 5 red/pink bundles, hero braid split 8 px (dutar trace)
flicking 6 px per pluck, palm tak waves r ≤ 0.2R for 8 f. No bodom, spokes or frets.

## 5. Loop
Hold at θ = 298° (≡ −62°; the 4-fold cap equals SF3's 28°). Handoff ω: smoothstep 0→6°/f over
30 f, exactly 90° (normalise discrete steps), so θ(435) = 388 ≡ 28 and ω(435) = π rad/s with zero
acceleration. θ integrated over the film; a constant gain on ω over 312–377 solved so θ(378) ≡ 298
(mod 360). At f435: capScale 1, body 1, braidLag 46, braidReach 1, heroPeel 0, warp [0,1],
flames 1, shear 0, armLift 0, keyline 0, reveal 0. Braid lag keyed (not filtered) in the
handoff. Test: f434→f0 is an ordinary one-frame step.

## 6. Spin model
ω (rad/s): 0–29 π · 30–43 π→π/2 · 44–79 π/2→π/4 · 80–119 π/4→π · 120–191 π · 192–215 π→0 ·
216–291 0 (the string holds the world) · 292–311 0→π/2 · 312–349 π/2→1.5π · 350–358 1.5π→2π ·
358–377 2π→0 · 378–404 0 · 405–434 0→π (smoothstep).
Braid lag = 46°·ω_s/ω0 (ω_s = ω through a critically damped spring, τ≈5 f), clamped [−10°, 92°];
braidReach = 1 + 0.08(ω_s/ω0 − 1). Bundle shear = 0.5·(lag − 46°), on the braid's s^1.4 curve.
Peak 12°/f stays well under the 36°/f alias limit of the 5-fold bundles.

## 7. Risks
1. T1 skin / return reading as an iris wipe or crossfade → skin edge born from the shrinking
   cap, timed to dum; no opacity anywhere; every colour change is a moving edge; ω never 0 here.
2. Warp → plate reading as a radial bar chart / progress ring → decaying pluck bend persists
   through the bend; bundle misregistration keeps the textile read; seam closes at the bottom on
   the second pluck; plate rotates only after closing.
3. Escalation reading as a concentric infographic → only the four §4 traces, unequal sizes,
   own rotation rates; dancer dominant; 108×192 check at f330 and f358.
