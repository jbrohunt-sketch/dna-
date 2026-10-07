---
name: farhang-motion-language
description: Art direction, motion grammar, cultural rules, sound-sync rules and film structure for Farhang Markaz motion work (the Fergana-anchored Central Asian cultural project). Load before designing, animating, scoring, reviewing or rendering ANY Farhang Markaz visual — styleframes, the vertical spin film, identity animations, social cut-downs — and before changing colors, type, timing, shapes or transitions in farhang-markaz/.
---

# FARHANG MOTION LANGUAGE — v3 (graphic direction)

> **v3 supersedes v1–v2.** v1–v2 pursued dark cinematic negative space, simulated materials
> (satin, goat skin, lit threads) and a luxury serif. The client rejected that register.
> If any code, comment or older note says "dark", "material", "shader", "lighting", "gold
> accent" or "Cormorant", it is v2 residue: do not follow it.

Core sentence: **shape → motion → transformation → cultural object → shape.**
Heritage passes *through* a contemporary design system; it is not replaced by it, and it is
not a costume placed in front of decoration.

## 1. Visual treatment (from the client brief — firm)

Graphic · abstract · shape-based · colorful but controlled · culturally specific ·
extremely polished · playful · modern · fluid · visually inevitable.

- **Cream / light ground.** The background is a light field, not darkness.
- **Flat geometric forms.** Crisp primitives (circle, capsule, rounded square, teardrop,
  stroke, arc). Depth comes from overlap and scale, not from lighting.
- **Abstract human construction.** The dancer is an abstract geometric figure read through
  silhouette, geometry, braids, dress motion and specific costume cues — never facial or
  anatomical realism.
- **Bold blue, pink/red floral accents, selective jewel tones** — each color traceable to a
  named Fergana source (§4).
- **Minimal texture. No simulated lighting or material realism** (no shaders, specular,
  cast shadows, grain, vignette, blur, motion smear) unless a specific, written justification
  is approved by the Art Director.
- **When something feels weak, do not add detail.** First ask: stronger geometry? better
  proportion? clearer color? better timing? fewer elements? a more elegant transformation?

### Never
Cinematic realism · luxury fashion photography · heritage collage · maximalist ornament ·
cyberpunk / neon / HUD · generic "Silk Road" (camels, dunes, caravans, lanterns, domes,
Registan postcards) · ornament wallpaper · motifs that can't be named · two complete cultural
objects competing at once (except the escalation beat) · realistic anatomy, faces, fingers ·
simulated fabric, skin, wood, metal · metallic gold.

### Provisional — pending the client's reference film
The client will supply the actual advertising reference. Until it is analysed, do NOT infer
further stylistic properties from the phrase "premium tech advertising". The following are
working defaults only, to be confirmed or replaced against the reference:
color proportions, max colors per frame, stroke-weight scale, keyline gaps, easing curves,
hold lengths, end-card duration, type size and tracking.

## 2. Cultural anchor — Fergana Valley (Uzbekistan)

Every cultural element names its object, place and technique, and carries a confidence level.
The calibrated register lives in `farhang-markaz/docs/cultural-register.md`; the skill states
only the design consequence. Specificity, not brittle certainty: where an association is
strong but not exclusive, say "strongly associated", not "only".

Anchors in use (register IDs in brackets):
- **Khan-atlas warp ikat** — anchored in Margilan [R5, High]. Drawn as abrbandi resist-dye on
  threads (§5); label "abrbandi (khan-atlas-derived)".
- **Rishtan ceramics** — ishkor glaze; cobalt and turquoise on a milky ground with dark
  outlines; mainly floral [R12, High/Med]. Source of the cream + blue palette and of the
  ceramic beat, which replaces the former architecture beat: **radial floral zoning, not girih**.
- **Women's square doppi with four floral-bush motifs (chamanda gul type)** — documented for
  Margilan and Tashkent [R2, Med]. Flower count and ground colour are stylisation. The black
  Chust doppi is strongly men's-coded [R1] and is not used on her.
- **Many braids (qirq kokil, conventionally "forty")** — marks an unmarried girl [R3, Med-High]:
  7 grouped masses × 5 implied strands. **Sochpopuk** = silver cap + coral/silk tassel [R4].
- **Doira** — rings fixed inside the frame on the open side, not visible from the skin face
  [R10]. **Dutar** — two strings, ~13–15 tied frets [R11].
- **Dance cues** — rounded arms, wrist circles, palms often upward [R8, Med / Low-Med]. The
  spin is shared across Uzbek dance, not a Fergana marker. An abstracted open-arm spin risks
  a dervish misreading (sema, or tanoura with a coloured skirt) [R9]: avoid right-palm-up /
  left-palm-down, head tilt, white skirt, tall hat, and keep the female cues (braids, doppi)
  legible at thumbnail size.

Do not use: zardozi or metallic gold [R7]; eight-point star-and-cross or any isolated octagram
[R13]; palak discs [R14]; Iznik cues on ceramics (raised tomato red, tulip/carnation/saz leaf,
central star, calligraphy band, mehrob niche) [R12]; mosque/madrasa façades; married-woman
cues (e.g. headscarf over the braids).

## 3. Shape vocabulary — the dancer (approved styleframes rev 7)

Overhead. **R = 460 px** (≈ 85% of frame width) — the bold-blue disc at frame centre is the
fixed loop anchor in every frame. Source: `src/shapes/*`, `src/styleframes/Styleframes.tsx`.

- **Skirt:** a solid cobalt disc of radius R (true circle). The khan-atlas-derived ikat sits on
  **5 bundles of milk warp threads** (odd count — never 4-fold rotational: a swastika-adjacent
  read [cultural note]) running radially from 0.42R to 60 px inside the rim; the motif is
  dyed onto the threads (`IkatThreads`). No wedges, no cards, no hem flames. The outer
  `dancer.band` (0.13R) is implicit at rest and becomes the doira rim when the skin opens.
- **Body:** one continuous milk **arm-arc** from hand to hand through the shoulders (rounded,
  forward), ending straight outward in **blunt half-disc palms** (curve to the wrist, flat
  open edge outward — no knob, no point, no curl). Nimcha omitted (stylisation, R6).
- **Headpiece:** square doppi, 0.28R, milk ground, one ink border at the edge (no cream
  halo), tighter corners, four bushes with one merged pink flower silhouette each
  (stylisation of R2). Tilted 28° at frame 0.
- **Braids:** **one swept ribbon** — 6 thin braids (0.03R) tightly parallel along a shared
  spiral that trails the spin, ends staggered, a sochpopuk bead at each tip (milk cap + red
  coral bead, circles only). The outermost is the hero braid (2 strands) → dutar string. It
  reads as *long hair* at thumbnail size; claim *qirq kokil* only where strands separate
  (close-ups) [R3].
- **Minimum feature size:** 3 px at film scale, outlines included; strings/warp threads 12 px.
- **Never drawn:** face, skin rendering, fingers, feet, body curves, hair strands, folds,
  stitching, shadows, map-pin teardrops.

## 4. Palette (source of truth: `farhang-markaz/src/design/tokens.ts`)

| token | hex | source | role |
|---|---|---|---|
| cream | `#F3ECDF` | Rishtan milky slip | background — always, except a shape that scales to fill frame |
| milk | `#FFFAF2` | slip white | arm-arc, palms, skirt warp threads, doppi ground, doira skin |
| ink | `#15183A` | Rishtan dark outline (stylised blue-black) | braids, outlines, type |
| cobalt | `#1D3FD6` | Rishtan cobalt; indigo atlas | primary blue, hem band, rim |
| sky | `#6F8BF7` | stylisation | SF2 warp threads |
| ishkor | `#14A39A` | Rishtan ishkor; stands in for atlas / chamanda-gul green | plate, doppi bushes, one ikat column |
| red | `#E5323F` | madder red (atlas) | ikat dye (outer), tassel beads, strike |
| pink | `#F49AB6` | chamanda gul flower | cap flowers, ikat dye core |
| saffron | `#F4AE2A` | isparak yellow (atlas) | dutar frets only |

Every **accent** colour traces to a named source; ink and sky are stylisation. Retired: dark
grounds, gold/metallics, leaf (merged into ishkor), all `material.*`. Do not introduce new
hues without updating tokens.ts and this table together.

## 5. Motif abstractions

- **Ikat (one method everywhere):** abrbandi resist-dye — one stepped flame motif dyed onto
  parallel threads (exactly thread-width, on the thread path), bundle offsets mirror-symmetric
  on three levels; red outer, pink core; motif length / half-width = `dancer.ikatAspect` (4)
  in every frame so skirt and warp are visibly the same cloth. Label it **"abrbandi
  (khan-atlas-derived)"**, not plain "khan-atlas" [R5].
- **Warp (SF2):** 24 sky threads at disc width, full frame height (the ring is a window),
  one ink thread = the plucked dutar string; raised-cosine bend, neighbours decay, threads
  more than 6 away stay straight.
- **Doira:** seen from the open side [R10]: cobalt rim (width = `dancer.band`), milk skin,
  ring pairs on the inner wall (stylised count); strike = flat red wave, on *dum* / *tak*.
- **Dutar:** two parallel strings, tied-fret bars only in close-up T2 frames.
- **Fergana-school plate, Rishtan palette** [R12]: milk ground, dark outlines, cobalt + ishkor
  only; four-lobed centre (documented; derivation from the doppi = design rhyme); bodom
  compartments; checked rim. Counts are stylisation.

## 6. Transition grammar

Every transition shares geometry, direction, rhythm or material logic. Objects never pop in.
One stage on screen at a time; the 920 px disc is the constant stage.
- **T1 skirt → doira:** *tak* at her hand, then the body (arms, cap, braids) draws into the
  centre and the milk skin opens from it on *dum*; the bundles clear; the outer band is the rim.
- **T2 hero braid → dutar:** the hero braid peels from the ribbon, straightens, unzips into
  two strings; frets tick on; one string is plucked.
- **T3 string → warp → plate:** the pluck spreads to neighbouring threads (decaying); the
  motif is dyed across the threads; the warp then bends into the plate's ring (`bend`) while
  stepped flames relax into bodom leaves (formal rhyme, not derivation) and re-glaze.
- **Identity → frame 0:** end-card hold = solid disc + cap tile (0.7R, 28°); in the loop
  handoff the tile eases to 0.28R and the arm-arc, braids and bundles bloom out of it.
- The world accumulates; speed is shown through shape, never blur; morphs interpolate
  parameters on identical structures.

## 7. Typography

- Wordmark **FARHANG MARKAZ**, Inter Tight 600 (OFL, vendored), ink, one line, set **above**
  the disc (out of the bottom platform-UI zone), width locked to the disc diameter.
  The disc never moves to make room for type.
- ◇ Size, tracking and entry timing remain provisional pending the client's reference.
- Safe areas in 1080×1920: key text ≥ 80 px from sides, ≥ 160 px from top/bottom.
- Never describe the chamanda gul cap as *the* Fergana symbol in copy (one documented type, R2);
  don't call *farhang* an Uzbek word without verification (register open item).

## 8. Motion and sound

- **Human movement is the animation engine.** Nothing moves on its own clock without a cause
  traceable to her body or to a sound she causes.
- **gesture → sound → transformation.** Sound onset on or 0–2 frames before the change.
- 30 fps, ~14–15 s, seamless loop. **The rhythmic grid is set by the Sound Director from the
  actual doira/dutar material — do not hard-code a BPM.** Use temporary synchronized
  placeholders for styleframe and early-motion tests; real recordings before final timing.
- Sound palette: doira *dum* / *tak* / ring jingle; restrained dutar pluck; at most one
  extremely short additional Central Asian gesture if necessary; one subtle contemporary
  layer (granular / stretched overtone / low synthetic body / reversed acoustic) that
  extends acoustic events. Never EDM, trailer grammar, stock "exotic" music.

## 9. The film (locked structure)

1. Open mid-spin, no intro card. 2. T1 skirt → doira on a strike. 3. Return overhead with a
doira-derived ring kept under her. 4. T2 hero braid → dutar string; a pluck triggers.
5. T3 string → warp → ikat → Rishtan plate geometry. 6. Escalation: accumulated motifs
around her. 7. Final spin → hem ring → FARHANG MARKAZ identity → loops to frame 0.

## 10. Production rules and review

- Flat SVG, masks, transforms, procedural React. Centralised tokens (`tokens.ts`) and cue
  map (`timeline.ts`); never hard-code event frames in scene files.
- Source of truth for look: approved styleframes rev 7 (`farhang-markaz/review/SF1-3`, code in
  `src/styleframes`). The grammar board is the Phase 2 gate record only.
- Workflow gates: visual grammar board → Art Director + Cultural Auditor pass → three
  styleframes → Adversarial Critic + Cultural Auditor → motion + sound → implementation.
- Review checklist for every frame:
  1. Does every element's origin trace to a prior shape or gesture?
  2. Is the ground cream/light, and is there zero simulated lighting/material?
  3. Can any element be removed without loss? (If yes, remove it.)
  4. Can each motif be named (object, place, technique) with a register entry?
  5. Does it read at a true 0.1× render (108×192), checked by actually downscaling the frame
     (`Checks/DancerCheck` + ffmpeg `scale=108:192:flags=area`)?
  6. Does every transformation have an audible cause?
  7. Does the last frame loop into the first (centre, radius, rotation, color)?
