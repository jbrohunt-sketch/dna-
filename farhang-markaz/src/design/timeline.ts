// Cue map: one source of truth for audio onsets AND visual events.
// Frame numbers at 30 fps. 14 s = 420 frames. DRAFT — locked after styleframe review.
// Rule: gesture → sound → transformation (sound onset 0–2 frames before the visual change).

export const DURATION = 420;

export const cue = {
  // 0 — open mid-spin (no intro card)
  spinOpen: 0,
  // T1 doira
  doiraDum1: 30, // first dum, skirt flares on it
  doiraTak: 52,
  doiraStrike: 66, // the hand strike that turns skirt → membrane
  membraneHold: 72,
  // return
  returnToDancer: 120, // ring-pattern stays on the ground
  // T2 dutar
  armSweep: 168, // braid/arm draws the line
  stringTaut: 204,
  pluck: 228, // single pluck → T3
  // T3 textile / architecture
  warpSplit: 240,
  ikatDye: 258,
  weave: 276,
  girih: 294,
  // escalation
  escalation: 318,
  // resolve
  finalSpin: 360,
  identity: 384,
  loopHandoff: 404, // ring → skirt bloom, matches frame 0
} as const;

export type CueName = keyof typeof cue;
