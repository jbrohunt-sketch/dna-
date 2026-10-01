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

Anchors in use:
- **Khan-atlas warp ikat (abr)** — Margilan. Abstracted as stepped *flame columns* running
  along the warp (radially on the overhead skirt), never as symmetric generic diamonds.
- **Rishtan ceramics** — ishkor (turquoise) and cobalt on a milky ground. Source of the
  cream + blue palette and of the geometry beat (replaces the former architecture/girih beat).
- **Women's Fergana square doppi with chamanda gul** — square, four-fold, pink flower + green
  bush motifs. Replaces the black-and-white Chust doppi (see register for confidence).
- **Many braids (qirq kokil tradition) with sochpopuk tassels** — expressed as grouped
  braid masses, not as dozens of separate strokes.
- **Doira** (frame drum, rings on the frame) and **dutar** (two strings, tied frets).
- **Fergana dance cues** — rounded arms, open palm-up hands. Avoid a straight-armed,
  palm-up/palm-down pose that reads as Mevlevi sema.

Do not use: zardozi gold (Bukhara court craft), velvet-and-gold Bukhara costume cues,
isolated eight-point stars, mosque/madrasa façades, married-woman cues (e.g. headscarf over
the braids) on this dancer.

## 3. Shape vocabulary — the dancer (overhead; R = skirt radius = 360 px, loop anchor)

- **Skirt:** circle of radius R with shallow scallops; khan-atlas flame columns as flat
  radial bands; flare scales R from 0.35R → R.
- **Bodice:** sleeveless nimcha as one flat shape.
- **Sleeves:** belong to the dress (ko'ylak) — khan-atlas, as flat capsules.
- **Arms:** rounded (curved capsules), never a rigid straight T.
- **Hands:** simple rounded palm-up shapes, no articulated fingers.
- **Headpiece:** square doppi seen from above; four chamanda gul motifs, rotated 90°.
- **Braids:** 6–8 grouped braid masses, each with internal subdivision implying several
  braids, each ending in a sochpopuk shape; plus **one hero braid** that separates and
  becomes the dutar string.
- **Never drawn:** face, skin tone rendering, fingers, feet, body curves, hair strands,
  fabric folds, stitching, shadows.

## 4. Palette (source of truth: `farhang-markaz/src/design/tokens.ts`)

| token | hex | source | role |
|---|---|---|---|
| cream | `#F3ECDF` | Rishtan milky slip ground | background — always, except a shape that scales to fill frame |
| milk | `#FFFAF2` | slip white | doira skin, light shapes, keylines |
| ink | `#15183A` | — | braids, doppi body, type |
| cobalt | `#1D3FD6` | Rishtan cobalt; indigo atlas | primary bold blue |
| sky | `#6F8BF7` | — | secondary blue, alternating panels |
| ishkor | `#14A39A` | Rishtan ishkor glaze | turquoise accent; ceramic beat |
| red | `#E5323F` | madder red in atlas; pomegranate | bodice, tassels, strike accent |
| pink | `#F49AB6` | chamanda gul flower | floral accent |
| leaf | `#2F9A5E` | chamanda gul bush | floral accent only |
| saffron | `#F4AE2A` | isparak yellow in atlas | tiny accent only |

Retired: ink/night dark grounds, gold, pomegranate/emerald dark jewels, ash, all `material.*`.
Do not introduce new hues without updating tokens.ts and this table together.

## 5. Motif abstractions

- **Doira:** cobalt rim ring + milk skin disc + a dotted inner ring of small rings in pairs.
  The strike is a flat expanding ring, synced to *dum* / *tak*.
- **Dutar:** exactly two parallel lines with short tied-fret bars; if the body is shown, the
  long-neck pear silhouette.
- **Ikat:** stepped flame columns; misregistration expressed as an offset of whole steps,
  never as blur.
- **Rishtan geometry:** plate structure (centre medallion, radial segments, border band) per
  the register; flat ishkor/cobalt on milk.

## 6. Transition grammar (preserved from v1–v2 — this is the project's core asset)

Every transition shares geometry, direction, rhythm or material logic. Objects never pop in.
- **Skirt circle → doira:** scallops flatten, hem → rim, panels clear to the skin.
- **Hero braid → dutar string:** the braid separates from its group, straightens, splits
  into two lines; frets tick on.
- **String → warp → ikat:** the plucked line divides into parallel warp bands; flame steps
  fill column by column.
- **Ikat columns → Rishtan plate:** the straight warp columns wrap into polar coordinates and
  become the plate's radial segments (and, implicitly, the skirt's radial panels).
- **Hem band → identity ring → frame 0:** the identity ring is the skirt's hem at the same
  centre, radius, rotation phase and colors; the loop blooms back into the spin.
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
  5. Does it read at thumbnail size (108×192)?
  6. Does every transformation have an audible cause?
  7. Does the last frame loop into the first (centre, radius, rotation, color)?
