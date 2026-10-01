import { color, material } from "../design/tokens";
import { ikatAt } from "./ikat";
import { clamp01, frac, hex, smoothstep, type RGB } from "./shading";

// Warp threads as discrete lit cylinders carrying the same ikat as the skirt.
// Each thread is a column — ikat is the loom's original raster.

const SILK = hex(material.silk);
const WEFT = hex(color.night);

export type WarpParams = {
  readonly ox: number; // canvas origin, frame px
  readonly oy: number;
  readonly x0: number;
  readonly x1: number;
  readonly yTop: number;
  readonly count: number;
  readonly repeatsAcross: number;
  readonly repeatH: number;
  readonly dye: number; // 0..1 reveal from yTop downward
  readonly dyeSpan: number;
  readonly weaveFrom: number; // frame y where weft begins
  readonly weave: number; // 0..1
  readonly pool: { readonly x: number; readonly y: number; readonly r: number };
};

export const renderWarp = (img: ImageData, p: WarpParams) => {
  const W = img.width;
  const H = img.height;
  const d = img.data;
  const pitch = (p.x1 - p.x0) / p.count;
  const tmp: RGB = [0, 0, 0];
  const dyeLimit = p.yTop + p.dye * p.dyeSpan;
  const rowH = Math.max(3, pitch * 0.9);
  for (let y = 0; y < H; y++) {
    const Y = p.oy + y + 0.5;
    if (Y < p.yTop) continue;
    const topFade = smoothstep(p.yTop, p.yTop + 30, Y);
    const inWeave = p.weave > 0 && Y > p.weaveFrom && Y < p.weaveFrom + p.weave * 2000;
    const row = Math.floor((Y - p.weaveFrom) / rowH);
    const fy = frac((Y - p.weaveFrom) / rowH);
    for (let x = 0; x < W; x++) {
      const X = p.ox + x + 0.5;
      if (X < p.x0 || X > p.x1) continue;
      const ft = (X - p.x0) / pitch;
      const ti = Math.floor(ft);
      const fx = ft - ti;
      const across = (fx - 0.5) / 0.4; // thread occupies 80% of the pitch
      const onThread = Math.abs(across) < 1;
      const weftOver = inWeave && (ti + row) % 2 === 0;
      if (!onThread && !inWeave) continue;

      let r: number;
      let g: number;
      let b: number;
      let shade: number;
      if (weftOver || (!onThread && inWeave)) {
        const cy = Math.abs((fy - 0.5) / 0.45);
        if (cy >= 1) continue;
        shade = 0.4 + 0.6 * Math.sqrt(1 - cy * cy);
        r = WEFT[0] * 1.6;
        g = WEFT[1] * 1.6;
        b = WEFT[2] * 1.9;
      } else {
        shade = 0.35 + 0.65 * Math.sqrt(1 - across * across) + (across < -0.3 && across > -0.7 ? 0.18 : 0);
        if (Y < dyeLimit) {
          const u = frac(((ti + 0.5) / p.count) * p.repeatsAcross);
          ikatAt(u, (Y - p.yTop) / p.repeatH, ti, tmp);
          [r, g, b] = tmp;
        } else {
          r = SILK[0] * 0.55;
          g = SILK[1] * 0.55;
          b = SILK[2] * 0.55;
        }
      }
      const pd = Math.hypot(X - p.pool.x, Y - p.pool.y);
      const ex = 0.1 + 0.9 * (1 - smoothstep(p.pool.r * 0.2, p.pool.r, pd));
      const k = shade * ex;
      const i = (y * W + x) * 4;
      d[i] = Math.min(255, r * k * 255);
      d[i + 1] = Math.min(255, g * k * 255);
      d[i + 2] = Math.min(255, b * k * 255);
      d[i + 3] = clamp01(topFade) * 255;
    }
  }
};
