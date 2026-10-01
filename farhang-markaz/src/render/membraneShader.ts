import { material } from "../design/tokens";
import { clamp01, fbm, hex, RAKING, RAKING_HALF, smoothstep } from "./shading";

// Goat-skin doira membrane under a low raking light. Height field = skin fibre +
// bearing-edge roll-off + strike wave. Shading comes from the height gradient, so the
// strike reads as a physical displacement, not a drawn circle.

const SKIN = hex(material.membrane);
const SKIN_DARK = hex(material.membraneShadow);

export type Strike = { readonly x: number; readonly y: number; readonly t: number; readonly amp?: number };

export type MembraneParams = {
  readonly scale: number; // frame px per canvas px
  readonly ox: number; // canvas origin in frame px
  readonly oy: number;
  readonly cx: number; // frame px
  readonly cy: number;
  readonly Rm: number;
  readonly strike?: Strike;
  readonly pool: { readonly x: number; readonly y: number; readonly r: number };
};

const noiseCache = new Map<string, Float32Array>();
const fibre = (W: number, H: number, scale: number, ox: number, oy: number) => {
  const key = `${W}x${H}@${scale}:${ox},${oy}`;
  const hit = noiseCache.get(key);
  if (hit) return hit;
  const n = new Float32Array(W * H * 2);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const X = ox + x * scale;
      const Y = oy + y * scale;
      // fine fibre (anisotropic) + broad mottling
      n[(y * W + x) * 2] = fbm(X * 0.11, Y * 0.04, 3, 2) * 0.35 + fbm(X * 0.02, Y * 0.02, 9, 3) * 0.65;
      n[(y * W + x) * 2 + 1] = fbm(X * 0.004, Y * 0.004, 17, 3);
    }
  noiseCache.set(key, n);
  return n;
};

export const renderMembrane = (img: ImageData, p: MembraneParams) => {
  const { scale, ox, oy, cx, cy, Rm, strike, pool } = p;
  const W = img.width;
  const H = img.height;
  const d = img.data;
  const N = fibre(W, H, scale, ox, oy);
  const k = 0.06; // wave number (rad/px)
  const front = strike ? strike.t * Rm * 1.5 : 0;
  const decay = Rm * 0.55;
  const amp = strike ? (strike.amp ?? 9) * Math.pow(1 - strike.t, 1.4) : 0;

  for (let y = 1; y < H - 1; y++) {
    const Y = oy + y * scale;
    for (let x = 1; x < W - 1; x++) {
      const X = ox + x * scale;
      const dx = X - cx;
      const dy = Y - cy;
      const r = Math.hypot(dx, dy);
      if (r > Rm + scale) continue;
      const a = clamp01((Rm - r) / scale + 0.5);
      const rho = r / Rm;
      const i2 = (y * W + x) * 2;

      // fibre gradient (finite differences on the cached field)
      let gx = (N[i2 + 2] - N[i2 - 2]) * 0.5;
      let gy = (N[i2 + W * 2] - N[i2 - W * 2]) * 0.5;
      // skin rolling over the bearing edge
      if (rho > 0.9) {
        const s = (rho - 0.9) / 0.1;
        const slope = 2.4 * s * s;
        gx += (slope * dx) / r;
        gy += (slope * dy) / r;
      }
      // strike wave
      if (strike && amp > 0) {
        const sx = X - strike.x;
        const sy = Y - strike.y;
        const ds = Math.hypot(sx, sy) + 0.001;
        if (ds < front) {
          const env = Math.exp(-ds / decay) * smoothstep(front, front - 90, ds);
          const dh = amp * env * k * Math.cos(k * (ds - front));
          gx += (dh * sx) / ds;
          gy += (dh * sy) / ds;
        }
      }
      const nl = Math.hypot(gx, gy, 1);
      const nx = -gx / nl;
      const ny = -gy / nl;
      const nz = 1 / nl;
      const diff = Math.max(0, nx * RAKING[0] + ny * RAKING[1] + nz * RAKING[2]);
      const spec = Math.pow(Math.max(0, nx * RAKING_HALF[0] + ny * RAKING_HALF[1] + nz * RAKING_HALF[2]), 24);

      // albedo: mottled skin, darker playing ring (worn by fingers), glue line at the edge
      const mott = N[i2 + 1];
      let m = 0.9 + 0.36 * (mott - 0.5);
      const worn = smoothstep(0.66, 0.8, rho) * (1 - smoothstep(0.88, 0.93, rho));
      m *= 1 - 0.14 * worn * (0.6 + mott);
      const glue = smoothstep(0.93, 0.965, rho);
      const ar = (SKIN[0] * (1 - glue) + SKIN_DARK[0] * glue * 0.7) * m;
      const ag = (SKIN[1] * (1 - glue) + SKIN_DARK[1] * glue * 0.7) * m;
      const ab = (SKIN[2] * (1 - glue) + SKIN_DARK[2] * glue * 0.7) * m;

      // overhead spot: pool of light, the rest of the skin falls into darkness
      const pd = Math.hypot(X - pool.x, Y - pool.y);
      const ex = 0.09 + 0.91 * Math.pow(1 - smoothstep(pool.r * 0.15, pool.r, pd), 1.6);
      const lit = (0.08 + 1.08 * diff) * ex;
      const i = (y * W + x) * 4;
      d[i] = Math.min(255, (ar * lit + spec * 0.22 * ex) * 255);
      d[i + 1] = Math.min(255, (ag * lit + spec * 0.2 * ex) * 255);
      d[i + 2] = Math.min(255, (ab * lit + spec * 0.17 * ex) * 255);
      d[i + 3] = a * 255;
    }
  }
};
