---
name: farhang-motion-language
description: Art direction, motion grammar, sound-sync rules and film structure for Farhang Markaz motion work (the Central Asian cultural project). Load before designing, animating, scoring, reviewing or rendering ANY Farhang Markaz visual — styleframes, the vertical spin film, identity animations, social cut-downs — and before changing colors, type, timing or transitions in farhang-markaz/.
---

# FARHANG MOTION LANGUAGE

Farhang Markaz is heritage passing *through* a contemporary digital machine — never heritage
being replaced by technology. Every decision below serves that sentence.

## 1. Visual treatment

- **Stylized editorial 2.5D.** Not photoreal, not cartoon, not an anonymous silhouette.
  Figures have specific, observed detail (a Chust doppi's pepper motif, the feathered
  edge of ikat, the tied gut frets of a dutar) rendered with graphic restraint.
- **Dark cinematic negative space** is the default state of the frame. Color arrives as
  *concentrated jewel-tone events*, not washes:
  - lapis / cobalt
  - pomegranate / ruby
  - emerald / turquoise
- **Warm antique gold is an accent only** — a hairline, an orbit, a ring, a single glint.
  Never a fill, never a gradient background, never on more than ~5% of the frame.
- **Cultural specificity over generic "Central Asian aesthetic."** Name the object, the
  region, the technique. If a motif can't be named (e.g. "ethnic pattern"), cut it.
- Favor: large negative space, exquisite typography, clean silhouettes, tactile material
  detail (skin membrane, silk warp, glaze, braided hair), fluid transformation.

### Never
Generic AI futurism · neon gradients · cyberpunk · "Silk Road fantasy" (camels, dunes,
caravans, lanterns) · excessive ornament · stock ethnic motifs · tourist-poster
composition · glow/bloom as a substitute for design · lens flares · particle confetti ·
HUD/scanline "tech" overlays · faux-calligraphy.

## 2. Motion grammar

- **Human movement is the animation engine.** The dancer's spin, arm sweep and braid
  momentum drive every other motion. Nothing moves on its own clock without a cause
  traceable to her body or to a sound she causes.
- **Every transition derives from shared geometry, material, rhythm or movement.**
  Skirt disc → doira membrane (shared circle). Braid → dutar string (shared line).
  Vibrating string → warp threads → weave → tile linework (shared line spacing).
  No crossfades between unrelated images. No wipes, no slides, no zoom-blur cuts.
- **Objects do not randomly appear.** Every element is either emitted, unfolded,
  revealed by a mask that is itself a motif, or resolved out of existing geometry.
- **The world accumulates.** Each return to the dancer keeps something from the scene
  before it (doira ring-pattern under her → then weave → then tile linework → gold orbit).
  Never reset the stage to empty after the opening.
- Easing: weight and momentum, not UI-snappy. Spin uses continuous angular velocity
  with eased accelerations; strikes are near-instant onsets with long decays.
  Avoid bouncy springs on cultural objects.
- Overhead camera is the home position. Departures (to the doira, to the string) are
  continuous camera/scale moves that return home.

## 3. Sound is part of the animation system

Causal rule for every major event: **gesture → sound → transformation.**
The sound onset lands on or 0–2 frames before the visual transformation it causes.

Palette:
- doira (frame drum): *dum* (center, low), *tak* (rim, bright), ring jingle (the metal
  rings inside the frame)
- restrained dutar-style pluck (silk/nylon string, short sustain, no reverb wash)
- optional: one extremely short additional Central Asian instrumental gesture, only if
  compositionally necessary
- one contemporary layer only: granular resonance / stretched overtone / low synthetic
  body / reversed acoustic texture — used to *extend* acoustic events, not replace them

Never: EDM drops, risers-and-impacts trailer grammar, generic "Middle Eastern" scales or
drones, ethnic vocal chops, stock "exotic" pads.

## 4. Palette tokens (source of truth: `farhang-markaz/src/design/tokens.ts`)

| token | hex | use |
|---|---|---|
| ink | `#07080B` | ground, negative space |
| night | `#0E1016` | secondary ground, deep shadow |
| lapis | `#1F3FA8` | jewel event (cool) |
| cobalt | `#2E5BD6` | lapis highlight |
| pomegranate | `#8E1630` | jewel event (warm) |
| ruby | `#C4213F` | pomegranate highlight |
| emerald | `#0F6B57` | jewel event (green) |
| turquoise | `#2BA7A0` | glaze highlight |
| gold | `#B8924A` | accent ONLY (hairlines, orbit, rings) |
| bone | `#E9E1D2` | type, membrane, warm white |
| ash | `#8A8579` | secondary type |

Materials (`material.*` in tokens.ts) are physical surfaces — skin, hair, walnut doira
frame, goat-skin membrane, silk string, black doppi — never used as flat graphic color.

Do not introduce new hues without updating tokens.ts and this table together.

## 5. Typography

- Wordmark: **FARHANG MARKAZ**, wide-tracked caps, high-contrast editorial serif
  (Cormorant Garamond 500–600, vendored in `public/fonts`) in bone; gold used for at most one hairline.
- Secondary/system layer: a restrained monospace (IBM Plex Mono) at small size for
  the "machine" voice (coordinates, cue counts) — sparingly, never as decoration noise.
- Generous safe areas: in 1080×1920, key text ≥ 80 px from sides, ≥ 160 px from top/bottom
  (UI chrome on vertical platforms).

## 6. The film (locked concept — do not redesign while implementing)

Vertical 1080×1920, 12–15 s, seamless loop. Overhead spinning dancer; dress opens into a
circular graphic form; long braids move radially.

1. **Open in motion.** No intro card. Frame 0 = mid-spin.
2. **T1 — doira.** Skirt disc fills frame → resolves into doira membrane + rim.
   A real doira strike causes the change.
3. **Return.** Overhead dancer again; a subtle doira-derived ring pattern stays under her.
4. **T2 — dutar.** Braid or sweeping arm draws a line → straightens into a dutar string.
   A single pluck triggers the next transition.
5. **T3 — textile/architecture.** Vibrating string → fine geometry → warp/weave (ikat)
   → briefly Central Asian tile/girih linework.
6. **Escalation.** Overhead. Doira circle, textile geometry, architectural linework, gold
   orbit, jewel colors coexist around her.
7. **Resolve.** Final large spin resolves through shared circular geometry into the
   FARHANG MARKAZ identity. Last frame must match frame 0's circle (radius, rotation
   phase, color) for a seamless loop.

## 7. Production rules

- SVG / masks / procedural React first. Generated video/image only for what code cannot
  convincingly produce (primarily complex human motion).
- One cue map (`src/design/timeline.ts`) drives both audio placement and visual events.
  Never hard-code a frame number for an event in a scene file.
- Styleframes before animation; preview in Studio; render `--scale=0.5` drafts before
  the master.
- Review checklist before showing work:
  1. Can every visible object's origin be explained by a prior shape or gesture?
  2. Is gold ≤ ~5% of the frame?
  3. Is ≥ ~40% of the frame true negative space (except the doira fill moment)?
  4. Can each motif be named specifically (object, region, technique)?
  5. Does every transformation have an audible cause?
  6. Does the last frame loop into the first?

## 8. Named motifs in the codebase (reuse, don't reinvent)

Materials are rendered by per-pixel shaders (`src/render/*`, drawn into `PixelCanvas`) under
one light rig (`shading.ts`: KEY from upper-left/above, RAKING for the doira). Graphic
linework stays SVG. Never fake material with flat fills or gradients alone.

| component | what it is (be this specific) |
|---|---|
| `render/ikat.ts` | THE khan-atlas warp-ikat function: stepped abr lozenges, bundle-tied misregistration, dye creep along the warp. Skirt, warp and identity ring all sample it — same fabric everywhere |
| `render/skirtShader` | overhead satin skirt: ikat in fabric space, irregular radial pleats lit in world space, rotational motion blur, couched zardozi gold thread at the hem |
| `dancer/OverheadDancer` | floor shadow + skirt canvas + lit rig (velvet lapis sleeves, emerald nimcha, Fergana-school hands) with cast shadows |
| `dancer/Braids` | many thin braids (qirq kokil), three-strand plait lobes, sochpopuk tassels (steel cap, ruby threads, one gold bead) |
| `dancer/Doppi` | Chust doppi from above: satin black, four white qalampir motifs, stitched crown border |
| `motifs/Doira` + `render/membraneShader` | lacquered walnut frame, goat-skin membrane under raking light, strike = physical wave in the height field; `Halqa` steel rings in pairs; `DoiraGround` = what stays under the dancer |
| `motifs/Dutar` | two silk strings a fourth apart, tied gut frets, top still a braid, long-exposure vibration, shadow cast on what's beneath |
| `motifs/Warp` + `render/warpShader` | fan of threads from the string → discrete lit warp threads carrying the ikat → weft. Ikat is the loom's original raster: this is the heritage/machine bridge |
| `motifs/Girih` | eight-point star-and-cross (khatam) strapwork, Timurid tile linework |
| `motifs/GoldOrbit` | the tassel's path as one gold hairline |
| `identity/IkatRing` + `Wordmark` | identity ring = the skirt's hem band (outer r = skirtRadius, loop anchor); wordmark inside, divider is a silk string |
