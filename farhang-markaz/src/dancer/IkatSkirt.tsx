import React, { useMemo } from "react";
import { color, dancer } from "../design/tokens";
import { polar, rng, smoothClosed, toPath, type Pt } from "../design/geometry";

// Khan-atlas (warp ikat) skirt seen from directly overhead.
// Panels hang vertically, so from above the warp — and the abr ("cloud") motifs — run radially.

type Props = {
  readonly uid: string;
  readonly cx: number;
  readonly cy: number;
  readonly radius?: number;
  readonly rotation: number; // deg
  readonly flare: number; // 0 = hanging, 1 = fully open disc
  readonly smear?: number; // deg of rotational motion smear
  readonly hemPhase?: number; // animates the pleat wave
  readonly bare?: boolean; // no shadow / trim (used as a ghost inside other objects)
};

const PANELS = 12;

const hemRadius = (R: number, a: number, rot: number, phase: number) =>
  R * (1 + 0.028 * Math.sin(((a - rot) * Math.PI * dancer.hemScallops) / 180 + phase));

export const hemPath = (cx: number, cy: number, R: number, rot: number, phase = 0) => {
  const pts: Pt[] = [];
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * 360;
    pts.push(polar(cx, cy, hemRadius(R, a, rot, phase), a));
  }
  return smoothClosed(pts);
};

// Lozenge in polar space with feathered (jittered) edges — the ikat "abr".
const abr = (
  cx: number,
  cy: number,
  aMid: number,
  rMid: number,
  halfLen: number,
  halfAng: number,
  rand: () => number,
) => {
  const pts: Pt[] = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    // diamond parametrisation, softened
    const s = Math.sin(t);
    const c = Math.cos(t);
    const k = 1 / (Math.abs(s) + Math.abs(c));
    const jitter = 1 + (rand() - 0.5) * 0.22; // dye bleed along the warp
    const r = rMid + c * k * halfLen * jitter;
    const a = aMid + s * k * halfAng * (1 + (rand() - 0.5) * 0.12);
    pts.push(polar(cx, cy, r, a));
  }
  return toPath(pts, true);
};

export const IkatSkirt: React.FC<Props> = ({
  uid,
  cx,
  cy,
  radius = dancer.skirtRadius,
  rotation,
  flare,
  smear = 0,
  hemPhase = 0,
  bare = false,
}) => {
  const R = radius * (0.35 + 0.65 * flare);
  const hem = hemPath(cx, cy, R, rotation, hemPhase);

  // Motifs are built in a rotation-free frame then rotated as a group (cheap + stable).
  const motifs = useMemo(() => {
    const rand = rng(7);
    const out: { d: string; fill: string; o: number }[] = [];
    const rows = [0.36, 0.6, 0.84];
    const schemes = [
      [color.lapis, color.bone, color.emerald],
      [color.emerald, color.ruby, color.bone],
      [color.bone, color.lapis, color.pomegranate],
    ];
    for (let p = 0; p < PANELS; p++) {
      const aMid = (p / PANELS) * 360;
      rows.forEach((rr, k) => {
        const sch = schemes[(p + k) % schemes.length];
        const halfAng = (180 / PANELS) * 0.78;
        const halfLen = R * 0.085 * (0.8 + rr * 0.6);
        const rMid = R * rr;
        out.push({ d: abr(0, 0, aMid, rMid, halfLen, halfAng, rand), fill: sch[0], o: 0.92 });
        out.push({ d: abr(0, 0, aMid, rMid, halfLen * 0.62, halfAng * 0.58, rand), fill: sch[1], o: 0.95 });
        out.push({ d: abr(0, 0, aMid, rMid, halfLen * 0.26, halfAng * 0.22, rand), fill: sch[2], o: 1 });
        // half-drop flame between lozenges, on the panel seam
        if (k < rows.length - 1) {
          out.push({
            d: abr(0, 0, aMid + 180 / PANELS, R * (rr + 0.08), halfLen * 0.55, halfAng * 0.35, rand),
            fill: (p + k) % 2 ? color.ruby : color.night,
            o: 0.7,
          });
        }
      });
    }
    return out;
  }, [R]);

  const pleats = useMemo(() => {
    const n = dancer.hemScallops * 2;
    return Array.from({ length: n }, (_, i) => {
      const a0 = (i / n) * 360;
      const a1 = ((i + 1) / n) * 360;
      const p1 = polar(0, 0, R * 1.08, a0);
      const p2 = polar(0, 0, R * 1.08, a1);
      return { d: `M0 0 L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z`, o: i % 2 ? 0.42 : 0 };
    });
  }, [R]);

  const ghosts = smear > 0 ? [1, 0.3] : [1];

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-hem`}>
          <path d={hem} />
        </clipPath>
        <filter id={`${uid}-bleed`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves={2} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={7} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation={0.9} />
        </filter>
        <filter id={`${uid}-silk`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves={1} seed={11} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id={`${uid}-depth`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#000" stopOpacity={0.8} />
          <stop offset="0.3" stopColor="#000" stopOpacity={0.12} />
          <stop offset="0.82" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.5} />
        </radialGradient>
        <linearGradient id={`${uid}-key`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
        <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
      </defs>

      {/* cast shadow onto the floor */}
      {!bare && <path d={hem} fill="#000" opacity={0.7} transform="translate(14 22)" filter={`url(#${uid}-shadow)`} />}

      <g clipPath={`url(#${uid}-hem)`}>
        <circle cx={cx} cy={cy} r={R * 1.1} fill={color.pomegranate} />
        <g transform={`translate(${cx} ${cy})`}>
          {ghosts.map((o, gi) => (
            <g
              key={gi}
              opacity={o}
              transform={`rotate(${rotation - (gi * smear) / 2})`}
              filter={`url(#${uid}-bleed)`}
            >
              {motifs.map((m, i) => (
                <path key={i} d={m.d} fill={m.fill} opacity={m.o} />
              ))}
            </g>
          ))}
          <g transform={`rotate(${rotation})`}>
            {pleats.map((p, i) => (
              <path key={i} d={p.d} fill="#000" opacity={p.o} />
            ))}
          </g>
        </g>
        <circle cx={cx} cy={cy} r={R * 1.1} fill={color.bone} filter={`url(#${uid}-silk)`} />
        <circle cx={cx} cy={cy} r={R * 1.04} fill={`url(#${uid}-depth)`} />
        <circle cx={cx} cy={cy} r={R * 1.1} fill={`url(#${uid}-key)`} />
      </g>
      {/* zardozi hem trim — gold accent hairline */}
      {!bare && (
        <path d={hemPath(cx, cy, R * 0.985, rotation, hemPhase)} fill="none" stroke={color.gold} strokeWidth={2} opacity={0.85} />
      )}
    </g>
  );
};
