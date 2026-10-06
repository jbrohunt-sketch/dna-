// Farhang Markaz design tokens — v3 graphic direction. Single source of truth.
// Keep in sync with .claude/skills/farhang-motion-language/SKILL.md §4.

export const FRAME = { width: 1080, height: 1920, fps: 30 } as const;
export const CENTER = { x: FRAME.width / 2, y: FRAME.height / 2 } as const;

export const color = {
  cream: "#F3ECDF", // Rishtan milky slip — the ground
  milk: "#FFFAF2", // slip white — doira skin, light shapes, keylines
  ink: "#15183A", // Rishtan dark outline (stylised blue-black) — braids, outlines, type
  cobalt: "#1D3FD6", // Rishtan cobalt / indigo atlas — primary blue
  sky: "#6F8BF7", // secondary blue — stylisation, no source claimed
  ishkor: "#14A39A", // Rishtan ishkor glaze; also stands in for atlas / chamanda-gul green (stylisation)
  red: "#E5323F", // madder red / pomegranate
  pink: "#F49AB6", // chamanda gul flower — florals only
  saffron: "#F4AE2A", // isparak yellow — dutar frets only
} as const;

export type ColorName = keyof typeof color;

// Shared counts — morphs only work between shapes that share structure.
export const count = {
  hemScallops: 12, // = skirt panels = flame columns around the hem
  doiraRingPairs: 12, // ring pairs around the doira (24 rings)
  plateSegments: 12, // Rishtan plate radial segments (provisional — pending register)
  braidClusters: 7,
  hemFlames: 24, // flames in the hem band (= identity ring); SF1 test: 24 larger vs 36
} as const;

export const dancer = {
  R: 360, // skirt radius at full flare — also identity ring radius (loop anchor)
  band: 0.13, // hem band width (× R) = doira rim width = identity ring width
  doppi: 0.28, // doppi side (× R)
  minFeature: 3, // px at film scale — nothing thinner or smaller
  hemFlameW: 0.065, // hem flame width (× R); length = band → ratio ≥ 2
} as const;
