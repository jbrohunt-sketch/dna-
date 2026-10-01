import { color, dancer } from "../design/tokens";
import { ikatAt } from "./ikat";
import { clamp01, HALF, hex, KEY, smoothstep, type RGB } from "./shading";

// Overhead skirt: ikat albedo in fabric space (rotates with her), satin shading in world
// space (the key light does not rotate). Folds are radial pleats; the hem bulges with them.

const NT = 1920; // angular samples
const NR = 320; // radial samples
const COLS = 480; // warp threads around the hem — the "raster"
const RHO_MAX = 1.08;
const GOLD = hex(color.gold);

const cache = new Map<string, Float32Array>();
const table = (repeats: number, radialRepeats: number) => {
  const key = `${repeats}:${radialRepeats}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = new Float32Array(NT * NR * 3);
  const tmp: RGB = [0, 0, 0];
  const perCol = NT / COLS;
  for (let ti = 0; ti < NT; ti++) {
    const col = Math.floor(ti / perCol);
    const u = (((col + 0.5) / COLS) * repeats) % 1;
    for (let ri = 0; ri < NR; ri++) {
      const rho = (ri / (NR - 1)) * RHO_MAX;
      ikatAt(u, rho * radialRepeats + 0.3, col, tmp);
      const o = (ri * NT + ti) * 3;
      t[o] = tmp[0];
      t[o + 1] = tmp[1];
      t[o + 2] = tmp[2];
    }
  }
  cache.set(key, t);
  return t;
};

export type SkirtParams = {
  readonly cx: number; // centre in canvas pixels
  readonly cy: number;
  readonly R: number; // hem radius in canvas pixels
  readonly rotation: number; // deg
  readonly smear?: number; // deg of angular motion blur
  readonly foldPhase?: number;
  readonly foldDepth?: number; // 0 = flat disc, 1 = full pleats
  readonly hemAmp?: number;
  readonly innerR?: number; // >0 cuts a ring (identity)
  readonly gold?: boolean;
  readonly repeats?: number;
  readonly radialRepeats?: number;
  readonly exposure?: number;
};

export const renderSkirt = (img: ImageData, p: SkirtParams) => {
  const {
    cx,
    cy,
    R,
    rotation,
    smear = 0,
    foldPhase = 0,
    foldDepth = 1,
    hemAmp = 0.03,
    innerR = 0,
    gold = true,
    repeats = 12,
    radialRepeats = 3.4,
    exposure = 1,
  } = p;
  const T = table(repeats, radialRepeats);
  const W = img.width;
  const H = img.height;
  const d = img.data;
  const rot = (rotation * Math.PI) / 180;
  const sm = (smear * Math.PI) / 180;
  const K = smear > 0.5 ? 7 : 1;
  const F = dancer.hemScallops;
  const TWO_PI = Math.PI * 2;
  const cone = 0.22;

  for (let y = 0; y < H; y++) {
    const dy = y + 0.5 - cy;
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx;
      const r = Math.hypot(dx, dy);
      if (r > R * (1 + hemAmp) + 1) continue;
      if (innerR > 0 && r < innerR - 1) continue;
      const th = Math.atan2(dy, dx);
      const thl = th - rot;
      const phi = F * thl + 0.7 * Math.sin(5 * thl + 0.4) + foldPhase; // irregular pleats
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);
      const hemR = R * (1 + hemAmp * sp);
      let a = clamp01(hemR - r + 0.5);
      if (innerR > 0) a *= clamp01(r - innerR + 0.5);
      if (a <= 0) continue;
      const rho = r / R;
      const ri = Math.min(NR - 1, Math.round((rho / RHO_MAX) * (NR - 1)));

      // albedo, averaged along the direction of travel (rotational motion blur)
      let ar = 0;
      let ag = 0;
      let ab = 0;
      for (let k = 0; k < K; k++) {
        const tk = K > 1 ? thl + (sm * k) / (K - 1) : thl;
        let f = (tk / TWO_PI) % 1;
        if (f < 0) f += 1;
        const o = (ri * NT + Math.floor(f * NT)) * 3;
        ar += T[o];
        ag += T[o + 1];
        ab += T[o + 2];
      }
      ar /= K;
      ag /= K;
      ab /= K;

      // satin pleat normal (world space)
      const A = 0.44 * foldDepth * Math.pow(rho, 1.3) * (0.75 + 0.25 * Math.sin(3 * thl + 1.3));
      const ct = Math.cos(th);
      const st = Math.sin(th);
      let nx = cone * ct + A * cp * st;
      let ny = cone * st - A * cp * ct;
      let nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const diff = Math.max(0, nx * KEY[0] + ny * KEY[1] + nz * KEY[2]);
      const spec = Math.pow(Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]), 70);
      const ao = 0.7 + 0.3 * (0.5 + 0.5 * sp * foldDepth + 0.5 * (1 - foldDepth));
      const waist = innerR > 0 ? 1 : smoothstep(0.1, 0.32, rho);
      const edge = hemR - r;
      const lip = edge < 8 ? 0.5 + 0.5 * (edge / 8) : 1;
      const lit = (0.15 + 1.0 * diff) * ao * waist * lip * exposure;
      const sh = spec * 0.32 * waist * exposure;
      let or = ar * lit + sh * (0.7 * ar + 0.3);
      let og = ag * lit + sh * (0.7 * ag + 0.3);
      let ob = ab * lit + sh * (0.7 * ab + 0.3);

      // zardozi: couched gold thread just inside the hem
      if (gold && edge > 4 && edge < 7.5) {
        const g = 0.85 * smoothstep(4, 5, edge) * (1 - smoothstep(6.5, 7.5, edge));
        const gl = (0.35 + 0.9 * diff + spec * 1.5) * exposure;
        or = or * (1 - g) + GOLD[0] * gl * g;
        og = og * (1 - g) + GOLD[1] * gl * g;
        ob = ob * (1 - g) + GOLD[2] * gl * g;
      }
      const i = (y * W + x) * 4;
      d[i] = Math.min(255, or * 255);
      d[i + 1] = Math.min(255, og * 255);
      d[i + 2] = Math.min(255, ob * 255);
      d[i + 3] = a * 255;
    }
  }
};
