import { color } from "../design/tokens";
import { frac, hash2, hex, type RGB } from "./shading";

// Khan-atlas warp ikat (abr). One function, used by the skirt, the warp and the identity
// ring, so the fabric is literally the same everywhere it appears.
//   u — position across one repeat, sampled at the THREAD centre (0..1)
//   v — position along the warp, in repeat units
//   thread — warp thread index (drives misregistration: the "cloud" edge of abr)

const FIELD = hex(color.pomegranate);
const OUTLINE = hex("#16070D");
const SCHEMES: { outer: RGB; mid: RGB; core: RGB; flame: RGB }[] = [
  { outer: hex(color.lapis), mid: hex(color.bone), core: hex(color.ruby), flame: hex(color.emerald) },
  { outer: hex(color.emerald), mid: hex(color.bone), core: hex(color.lapis), flame: hex(color.cobalt) },
];

const tri = (y: number) => 1 - Math.abs(2 * y - 1);
const STEPS = 7; // binding steps — resist ties are applied to bundles, so edges are stepped
const BUNDLE = 6; // threads tied together per resist bundle

export const ikatAt = (u: number, v: number, thread: number, out: RGB) => {
  // misregistration: mostly per tied bundle, a little per thread, plus dye creeping along the warp
  const bundle = Math.floor(thread / BUNDLE);
  const vj =
    v +
    (hash2(bundle, 11) - 0.5) * 0.09 +
    (hash2(thread, 7) - 0.5) * 0.035 +
    (hash2(thread, Math.floor(v * 26)) - 0.5) * 0.045;
  const row = Math.floor(vj);
  const y = vj - row;
  const ax = Math.abs(u * 2 - 1) + (hash2(thread, Math.floor(v * 90) + 999) - 0.5) * 0.07;
  const s = SCHEMES[((row % 2) + 2) % 2];
  const w = Math.round((0.05 + 0.6 * tri(y)) * STEPS) / STEPS;
  let c: RGB;
  if (ax < w * 0.3) c = s.core;
  else if (ax < w * 0.62) c = s.mid;
  else if (ax < w) c = s.outer;
  else if (ax < w + 0.05) c = OUTLINE;
  else {
    const w2 = Math.round((0.02 + 0.26 * tri(frac(vj + 0.5))) * STEPS) / STEPS;
    c = 1 - ax < w2 ? s.flame : FIELD;
  }
  // silk: per-thread value variation + slub along the thread
  const g = 1 + (hash2(thread, 3) - 0.5) * 0.12 + (hash2(thread, Math.floor(v * 140)) - 0.5) * 0.07;
  out[0] = c[0] * g;
  out[1] = c[1] * g;
  out[2] = c[2] * g;
};
