// Shared numeric helpers for the per-pixel material shaders.
export type RGB = [number, number, number];

export const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const frac = (x: number) => x - Math.floor(x);

export const hash2 = (a: number, b: number) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const vnoise = (x: number, y: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi + seed * 131, yi);
  const b = hash2(xi + 1 + seed * 131, yi);
  const c = hash2(xi + seed * 131, yi + 1);
  const d = hash2(xi + 1 + seed * 131, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

export const fbm = (x: number, y: number, seed = 0, oct = 4) => {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += amp * vnoise(x * f, y * f, seed + i);
    f *= 2.03;
    amp *= 0.5;
  }
  return s;
};

// Light rig shared by every shader: key from upper-left, above (overhead spot slightly off-axis).
const n3 = (x: number, y: number, z: number): RGB => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
};
export const KEY = n3(-0.42, -0.5, 0.76);
export const HALF = n3(KEY[0], KEY[1], KEY[2] + 1);
export const RAKING = n3(-0.62, -0.5, 0.42);
export const RAKING_HALF = n3(RAKING[0], RAKING[1], RAKING[2] + 1);
