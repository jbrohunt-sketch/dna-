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
- **Khan-atlas warp ikat** — anchored in Margilan [R5, High]. Abstracted as stepped *flame
  columns* along the warp (radial on the overhead skirt). Lozenges only if labelled *abrbandi*.
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

## 3. Shape vocabulary — the dancer (overhead; R = skirt radius = 360 px, loop anchor)

- **Skirt:** circle of radius R with shallow scallops. Inner field = 12 plain panels
  alternating cobalt / sky. **Hem band** 0.84–0.97R (`dancer.band` = 0.13R, shared with the
  doira rim and the identity ring) carries 36 red flames with milk cores, each ≥ 2× as long
  as wide. Flare scales R from 0.35R → R.
- **Nimcha:** sleeveless, one red capsule.
- **Sleeves:** plain-silk dress sleeves [R6] — milk, with a red cuff.
- **Arms:** rounded curved capsules, never a rigid straight T. **Hands:** open palm-up ovals,
  no fingers; hand tips ≤ 0.80R.
- **Headpiece:** square doppi, side 0.28R, **milk ground** (the dark ground failed the
  thumbnail test and read as the black men's cap [R1]), band border, four bushes filling
  ~65% of each face, stems toward the centre, 3 pink flowers each (stylisation).
- **Braids:** a **tail**, not spokes — 7 solid ink masses rooted along the back edge of the
  doppi (0.12R behind centre), spread ±32°, width 0.06R → 0.03R, length 0.50–0.62R (tassels
  stay off the hem). Strand subdivision (5 per mass, ≈35 implied) only in close-ups.
  **Hero braid:** 2 strands with a cream divider, length 0.7R — it unzips into the dutar
  strings. Sochpopuk = silver cap (milk) + coral/silk tassel (red) [R4].
- **Minimum feature size:** 3 px at film scale (`dancer.minFeature`). Nothing thinner.
- **Never drawn:** face, skin tone rendering, fingers, feet, body curves, hair strands,
  fabric folds, stitching, shadows.

## 4. Palette (source of truth: `farhang-markaz/src/design/tokens.ts`)

| token | hex | source | role |
|---|---|---|---|
| cream | `#F3ECDF` | Rishtan milky slip | background — always, except a shape that scales to fill frame |
| milk | `#FFFAF2` | slip white | doira skin, sleeves, doppi ground, flame cores |
| ink | `#15183A` | Rishtan dark outline (stylised blue-black) | braids, outlines, type |
| cobalt | `#1D3FD6` | Rishtan cobalt; indigo atlas | primary blue, hem band, rim |
| sky | `#6F8BF7` | stylisation | alternate skirt panels |
| ishkor | `#14A39A` | Rishtan ishkor; stands in for atlas / chamanda-gul green | plate, doppi bushes, one ikat column |
| red | `#E5323F` | madder red (atlas) | flames, nimcha, cuffs, tassels, strike |
| pink | `#F49AB6` | chamanda gul flower | florals only |
| saffron | `#F4AE2A` | isparak yellow (atlas) | dutar frets only |

Every **accent** colour traces to a named source; ink and sky are stylisation. Retired: dark
grounds, gold/metallics, leaf (merged into ishkor), all `material.*`. Do not introduce new
hues without updating tokens.ts and this table together.

## 5. Motif abstractions

- **Doira:** seen from the open side [R10]: cobalt rim (width = hem band) + milk skin + 12
  ring pairs on the inner wall (stylised count). The strike is a flat red wave in the skin
  (struck on the far side), synced to *dum* / *tak*.
- **Dutar:** exactly two parallel lines with short tied-fret bars; if the body is shown, the
  long-neck pear silhouette.
- **Ikat:** stepped flames tapering at both ends, stacked tip-to-base into continuous
  zigzag columns; misregistration = whole-step offsets, never blur. One column in three
  carries ishkor (atlas green). Pink, sky and the misregistration are stylisation [R5].
- **Fergana-school plate, Rishtan palette** [R12]: milk ground; dark zone outlines; cobalt +
  ishkor only (no red, no pink). Centre = radiating four-lobed motif grown from the doppi's
  four bushes; middle field = bodom leaves, each in its own compartment (the bent warp);
  rim = checked band, 24 cells per row = the doira's 24 rings. Counts are stylisation.
- **Identity divider:** the two dutar strings (two parallel lines), never one line.

## 6. Transition grammar (preserved from v1–v2 — this is the project's core asset)

Every transition shares geometry, direction, rhythm or material logic. Objects never pop in.
- **T1 skirt → doira:** *tak* — her hand meets the hem and the strike wave starts at the hand;
  *dum* — the body (arms, nimcha, braids, doppi) draws into the centre and the milk skin opens
  from that point. Flames retract; the hem band becomes the rim; rings settle in pairs.
- **T2 hero braid → dutar:** the 2-strand hero braid peels from the tail, straightens under
  tension and unzips along its divider into the two strings; tied frets tick on; the pluck
  is the instant-after-release triangle.
- **T3 strings → warp → plate:** each string throws stepped echoes → 12 warp columns; flames
  dye the columns; the warp bends into a ring (`bend`, t 0 → 1) while each stepped flame
  relaxes into a bodom leaf (same vertices, `smooth` 0 → 1) and re-glazes to the Rishtan
  palette — a formal rhyme between pointed-oval shapes, **not** a claim that ikat flames
  derive from bodom.
- **Origins inside the plate:** rim checks = doira rings; four-lobed centre = doppi bushes.
- **Hem band → identity ring → frame 0:** the identity ring is the hem band with its 36
  flames at the frame-0 centre, radius and rotation; the loop blooms back into the spin.
- The world accumulates: each return to the dancer keeps something from the scene before.
- Speed is shown through shape (braid lag, stretch, spacing), never through blur.
- Morph engineering: generate paths in code with identical structure (same vertex/segment
  counts) and interpolate parameters; never tween unrelated path strings.

## 7. Typography

- Wordmark **FARHANG MARKAZ** in a clean geometric sans (default: Inter Tight, OFL,
  vendored in `public/fonts`), ink on cream, set inside the identity ring (markaz = centre).
  Divider = the dutar string.
- No wide-tracked luxury serif. Size/tracking/entry timing are provisional pending the
  reference.
- Safe areas in 1080×1920: key text ≥ 80 px from sides, ≥ 160 px from top/bottom.

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
