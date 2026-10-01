// Farhang Markaz design tokens — single source of truth.
// Keep in sync with .claude/skills/farhang-motion-language/SKILL.md §4.

export const FRAME = { width: 1080, height: 1920, fps: 30 } as const;
export const CENTER = { x: FRAME.width / 2, y: FRAME.height / 2 } as const;

export const color = {
  // ground
  ink: "#07080B",
  night: "#0E1016",
  // jewel events
  lapis: "#1F3FA8",
  cobalt: "#2E5BD6",
  pomegranate: "#8E1630",
  ruby: "#C4213F",
  emerald: "#0F6B57",
  turquoise: "#2BA7A0",
  // accent only
  gold: "#B8924A",
  // type
  bone: "#E9E1D2",
  ash: "#8A8579",
} as const;

// Materials: physical surfaces, not palette events. Never used as flat graphic color.
export const material = {
  skin: "#9A6A50",
  skinLight: "#BE8D6E",
  hair: "#110D0B",
  hairSheen: "#3A2C24",
  walnut: "#2B1A12",
  walnutLight: "#4A2E1F",
  membrane: "#DDCCAB",
  membraneShadow: "#9C8A6C",
  silk: "#EDE4D0",
  doppi: "#0A0A0C",
  steel: "#8E949A",
  steelLight: "#E3E6E8",
} as const;

// Hard limit for gold coverage, used by review tooling / eyeballing.
export const GOLD_MAX_COVERAGE = 0.05;

// Overhead dancer proportions (px at 1080 wide).
export const dancer = {
  skirtRadius: 360, // fully flared hem radius — also the identity ring radius (loop anchor)
  hemScallops: 24, // pleat count — matches doira ring clusters
  braidCount: 12,
  braidLength: 330,
} as const;

export const ease = {
  // momentum, not UI snap
  weighted: [0.45, 0, 0.15, 1] as const,
  strikeDecay: [0.05, 0.9, 0.2, 1] as const,
  settle: [0.16, 1, 0.3, 1] as const,
};
