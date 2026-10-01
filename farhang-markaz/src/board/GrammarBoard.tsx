import React from "react";
import { AbsoluteFill } from "remotion";
import { color, type ColorName } from "../design/tokens";
import { sans } from "../design/fonts";
import { lerp, path, type Pt } from "../shapes/geo";
import { Dancer } from "../shapes/Dancer";
import { Skirt } from "../shapes/Skirt";
import { Doppi } from "../shapes/Doppi";
import { BraidMass, Braids, HeroBraid, heroSpine, spine } from "../shapes/Braids";
import { Doira } from "../shapes/Doira";
import { Dutar } from "../shapes/Dutar";
import { IkatStrip } from "../shapes/Ikat";
import { RISHTAN_SPECS, RishtanPlate } from "../shapes/Rishtan";

// One-page visual grammar (v3) for Art Director + Cultural Auditor review.
export const BOARD = { width: 2400, height: 3480 } as const;
const M = 80;
const G = 40;
const CW = (BOARD.width - 2 * M - 2 * G) / 3; // 720
const CH = 760;
const TOP = 240;
const ART_H = 540;

const Cell: React.FC<{
  readonly i: number;
  readonly title: string;
  readonly caption: string;
  readonly children: React.ReactNode;
  readonly span?: number;
}> = ({ i, title, caption, children, span = 1 }) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const w = CW * span + G * (span - 1);
  return (
    <div style={{ position: "absolute", left: M + col * (CW + G), top: TOP + row * (CH + G), width: w, height: CH }}>
      <div style={{ borderTop: `3px solid ${color.ink}`, paddingTop: 16, fontFamily: sans, fontWeight: 700, fontSize: 28, letterSpacing: "0.04em", color: color.ink }}>
        {String(i + 1).padStart(2, "0")} — {title}
      </div>
      <svg viewBox={`0 0 ${w} ${ART_H}`} width={w} height={ART_H} style={{ marginTop: 18 }}>
        {children}
      </svg>
      <div style={{ fontFamily: sans, fontSize: 22, lineHeight: 1.4, color: color.ink, opacity: 0.78, marginTop: 14 }}>{caption}</div>
    </div>
  );
};

const Arrow: React.FC<{ readonly x: number; readonly y: number }> = ({ x, y }) => (
  <path d={`M${x - 14} ${y} L${x + 10} ${y} M${x + 2} ${y - 8} L${x + 10} ${y} L${x + 2} ${y + 8}`} stroke={color.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);

const Label: React.FC<{ readonly from: Pt; readonly to: Pt; readonly text: string; readonly anchor?: "start" | "end" }> = ({ from, to, text, anchor = "start" }) => (
  <g>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color.ink} strokeWidth={2} />
    <circle cx={from[0]} cy={from[1]} r={4} fill={color.ink} />
    <text x={to[0] + (anchor === "start" ? 8 : -8)} y={to[1] + 7} fontFamily={sans} fontSize={20} fontWeight={600} fill={color.ink} textAnchor={anchor}>
      {text}
    </text>
  </g>
);

const SWATCHES: { name: ColorName; source: string; role: string }[] = [
  { name: "cream", source: "Rishtan milky slip", role: "ground — always" },
  { name: "milk", source: "slip white", role: "doira skin, hands, keylines" },
  { name: "ink", source: "—", role: "braids, doppi, type" },
  { name: "cobalt", source: "Rishtan cobalt · indigo atlas", role: "primary bold blue" },
  { name: "sky", source: "—", role: "secondary blue panels" },
  { name: "ishkor", source: "Rishtan ishkor glaze", role: "turquoise · ceramic beat" },
  { name: "red", source: "madder red atlas", role: "nimcha, cuffs, tassels, strike" },
  { name: "pink", source: "chamanda gul flower", role: "floral accent" },
  { name: "leaf", source: "chamanda gul bush", role: "floral accent only" },
  { name: "saffron", source: "isparak yellow atlas", role: "tiny accent: frets, flame cores" },
];

const straightened = (sp: readonly Pt[], to: Pt, t: number): Pt[] =>
  sp.map((p, k) => {
    const u = k / (sp.length - 1);
    const lx = lerp(sp[0][0], to[0], u);
    const ly = lerp(sp[0][1], to[1], u);
    return [lerp(p[0], lx, t), lerp(p[1], ly, t)] as Pt;
  });

export const GrammarBoard: React.FC = () => {
  const mid = ART_H / 2;
  const step = (k: number) => 95 + k * 176; // morph step centres
  return (
    <AbsoluteFill style={{ backgroundColor: color.cream }}>
      <div style={{ position: "absolute", left: M, top: 70, fontFamily: sans, color: color.ink }}>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.01em" }}>Farhang Markaz — Visual Grammar v3</div>
        <div style={{ fontSize: 26, marginTop: 10, opacity: 0.75 }}>
          Draft for Art Director + Cultural Auditor review · flat shapes on cream · Fergana anchor · shape → motion → transformation → cultural object → shape · ◇ = provisional
        </div>
      </div>

      <Cell i={0} title="BACKGROUND" caption="Cream (Rishtan slip) is always the ground. Only exception: a hero shape that scales until it fills the frame (skirt → doira at T1). No gradients, grain, vignette or lighting.">
        <rect x={150} y={70} width={225} height={400} fill={color.cream} stroke={color.ink} strokeWidth={2} />
        <Dancer id="b-bg" cx={262} cy={270} R={86} rotation={28} />
        <rect x={420} y={70} width={225} height={400} fill={color.cobalt} stroke={color.ink} strokeWidth={2} />
        <circle cx={532} cy={270} r={96} fill={color.milk} />
        <text x={262} y={505} fontFamily={sans} fontSize={20} textAnchor="middle" fill={color.ink}>default</text>
        <text x={532} y={505} fontFamily={sans} fontSize={20} textAnchor="middle" fill={color.ink}>shape fills frame</text>
      </Cell>

      <Cell i={1} title="PALETTE" caption="Every colour traces to a named Fergana source. Retired: dark grounds, gold/metallics, all simulated materials. ◇ Proportions and max colours per frame pending the reference.">
        {SWATCHES.map((s, k) => {
          const x = 10;
          const y = 26 + k * 51;
          return (
            <g key={s.name}>
              <circle cx={x + 22} cy={y + 18} r={20} fill={color[s.name]} stroke={color.ink} strokeWidth={s.name === "cream" || s.name === "milk" ? 2 : 0} />
              <text x={x + 56} y={y + 14} fontFamily={sans} fontSize={21} fontWeight={700} fill={color.ink}>
                {s.name} <tspan fontWeight={400} opacity={0.7}>{color[s.name]}</tspan>
              </text>
              <text x={x + 56} y={y + 38} fontFamily={sans} fontSize={18} fill={color.ink} opacity={0.75}>
                {s.source} · {s.role}
              </text>
            </g>
          );
        })}
      </Cell>

      <Cell i={2} title="TYPOGRAPHY ◇" caption="Inter Tight 700 (OFL), ink on cream, set inside the hem ring — markaz = centre. Divider is the dutar string. No wide-tracked luxury serif. ◇ Size, tracking and entry timing pending the reference.">
        <circle cx={360} cy={mid} r={236} fill="none" stroke={color.cobalt} strokeWidth={22} />
        <text x={360} y={mid - 26} fontFamily={sans} fontSize={64} fontWeight={700} textAnchor="middle" fill={color.ink} letterSpacing="0.02em">FARHANG</text>
        <line x1={290} x2={430} y1={mid + 4} y2={mid + 4} stroke={color.ink} strokeWidth={4} strokeLinecap="round" />
        <text x={360} y={mid + 82} fontFamily={sans} fontSize={64} fontWeight={700} textAnchor="middle" fill={color.ink} letterSpacing="0.02em">MARKAZ</text>
      </Cell>

      <Cell i={3} title="DANCER CONSTRUCTION" caption="≈10 flat shapes, R = 360 at film scale (loop anchor). Rounded arms, palm-up hands — not a rigid T (avoids reading as sema). Never drawn: face, fingers, skin rendering, folds, stitching, shadows.">
        <Dancer id="b-d" cx={250} cy={mid + 10} R={205} rotation={0} />
        <Label from={[250 + 0.3 * 205, mid + 10 + 0.85 * 205]} to={[500, 480]} text="skirt · atlas ×12" />
        <Label from={[250 + 0.5 * 205, mid + 10 - 0.16 * 205]} to={[500, 60]} text="sleeve + cuff" />
        <Label from={[250 + 0.8 * 205, mid + 10 - 0.08 * 205]} to={[500, 125]} text="palm-up hand" />
        <Label from={[250 + 0.22 * 205, mid + 10 + 0.03 * 205]} to={[500, 190]} text="nimcha" />
        <Label from={[250, mid + 10]} to={[500, 255]} text="doppi" />
        <Label from={[250 + 0.2 * 205, mid + 10 + 0.45 * 205]} to={[500, 330]} text="braid masses ×7" />
        <Label from={[250 - 0.55 * 205, mid + 10 + 0.32 * 205]} to={[500, 405]} text="hero braid" />
      </Cell>

      <Cell i={4} title="HEADPIECE" caption="Women's square doppi, chamanda gul type (Margilan/Tashkent, mid-20th c.) [R2 Med]: four identical bushes at the edge midpoints, stems to centre, thin band border. ◇ Flower count and dark ground are stylisation. Chust doppi not used (men's-coded) [R1].">
        <g transform={`translate(230 ${mid})`}>
          <Doppi size={300} keyline={0} />
        </g>
        <g transform={`translate(520 ${mid - 60})`}>
          <Doppi size={79} keyline={4} />
        </g>
        <text x={520} y={mid + 10} fontFamily={sans} fontSize={18} textAnchor="middle" fill={color.ink}>film scale</text>
        <g transform={`translate(640 ${mid - 60})`}>
          <Doppi size={24} keyline={2} />
        </g>
        <text x={640} y={mid + 10} fontFamily={sans} fontSize={18} textAnchor="middle" fill={color.ink}>thumbnail</text>
      </Cell>

      <Cell i={5} title="BRAID CONSTRUCTION" caption="qirq kokil (unmarried girl) [R3]: 7 grouped masses × 5 strands ≈ 35 implied braids. Each ends in a sochpopuk: silver cap (milk) + coral/silk tassel (red) [R4]. One slimmer hero braid separates and becomes the dutar string.">
        <BraidMass sp={spine(120, 120, 20, 14, 0, 380)} w0={52} w1={24} strands={5} />
        <HeroBraid sp={spine(120, 260, 18, 8, 0, 400)} R={420} />
        <g>
          <circle cx={560} cy={150} r={0} />
          <Braids cx={540} cy={330} R={150} rotation={0} lag={30} />
          <HeroBraid sp={heroSpine(540, 330, 150, 0, 30)} R={150} />
          <g transform="translate(540 330)">
            <Doppi size={34} keyline={3} />
          </g>
        </g>
        <text x={120} y={430} fontFamily={sans} fontSize={18} fill={color.ink}>mass (5 strands) · hero braid</text>
      </Cell>

      <Cell i={6} title="DRESS / IKAT" caption="Khan-atlas (Margilan) as stepped FLAME columns along the warp — steps from bundle tying, misregistration as whole-step offsets, never blur or generic diamonds. On the overhead skirt the warp runs radially.">
        <IkatStrip strip={{ cx: 190, baseY: 470, W: 300, t: 0 }} columns={4} H={400} flames={2} misregister />
        <Arrow x={385} y={mid} />
        <Skirt id="b-ik" cx={555} cy={mid} R={150} rotation={0} />
      </Cell>

      <Cell i={7} title="DOIRA" caption="Seen from the open side, where the rings hang on the inner wall [R10]: cobalt rim, milk skin, small rings in pairs. The strike is one flat red ring from the contact point, landing on dum / tak. No skin texture, no wood.">
        <Doira id="b-do" cx={360} cy={mid} R={230} strike={{ x: 250, y: mid - 60, r: 70, w: 10 }} />
      </Cell>

      <Cell i={8} title="RISHTAN GEOMETRY" caption="Replaces the architecture beat [R12, R13]. Milk ground, dark zone outlines, cobalt + ishkor; cinquefoil centre; radiating bodom leaves each in a compartment; checked rim. ◇ 12 compartments is a shared-count design choice, not documented.">
        <RishtanPlate cx={360} cy={mid} R={230} />
      </Cell>

      <Cell i={9} title="MORPH 1 — SKIRT → DOIRA" caption="Shared circle. On the strike: scallops flatten, panels and flames clear, the milk skin opens from the centre, the hem becomes the rim, rings settle in pairs.">
        {[0, 1, 2, 3].map((k) => {
          const x = step(k);
          const t = k / 3;
          return (
            <g key={k}>
              {k < 3 ? (
                <g>
                  <Skirt id={`m1-${k}`} cx={x} cy={mid} R={78} rotation={28 * (1 - t)} scallop={0.028 * (1 - t)} flames={1 - t * 1.5} panels={1 - t * 1.5} />
                  {k > 0 && <circle cx={x} cy={mid} r={78 * 0.87 * (k === 1 ? 0.35 : 0.8)} fill={color.milk} />}
                </g>
              ) : (
                <Doira id="m1-d" cx={x} cy={mid} R={78} strike={{ x: x - 30, y: mid - 20, r: 26, w: 5 }} />
              )}
              {k < 3 && <Arrow x={x + 88} y={mid} />}
            </g>
          );
        })}
      </Cell>

      <Cell i={10} title="MORPH 2 — HERO BRAID → DUTAR" caption="Shared line. The hero braid peels away from its group, straightens under tension, splits into two strings; tied frets tick on; the pluck is the instant-after-release triangle.">
        {[0, 1, 2, 3].map((k) => {
          const x = step(k);
          const hs = heroSpine(x + 40, mid - 120, 120, 0, 30);
          const to: Pt = [x - 50, mid + 200];
          return (
            <g key={k}>
              {k === 0 && (
                <g>
                  <Braids cx={x + 40} cy={mid - 120} R={120} rotation={0} lag={30} />
                  <HeroBraid sp={hs} R={120} />
                  <g transform={`translate(${x + 40} ${mid - 120})`}>
                    <Doppi size={26} keyline={2} />
                  </g>
                </g>
              )}
              {k === 1 && <HeroBraid sp={straightened(hs, to, 0.55)} R={120} />}
              {k === 2 && <path d={path(straightened(hs, to, 1), false)} stroke={color.ink} strokeWidth={4} fill="none" strokeLinecap="round" />}
              {k === 3 && <Dutar a={hs[0]} b={to} gap={12} frets={6} fretSpan={0.42} pluck={{ at: 0.72, amp: 14 }} />}
              {k < 3 && <Arrow x={x + 88} y={mid} />}
            </g>
          );
        })}
      </Cell>

      <Cell i={11} title="MORPH 3 — IKAT WARP → RISHTAN PLATE" caption="Shared columns + shared leaf. The warp bends into a ring (t: 0 → 1) while each stepped ikat flame relaxes into a smooth bodom leaf (same vertices) and re-glazes from atlas to Rishtan colours; rim and rosette close it.">
        {[0, 1, 2, 3].map((k) => {
          const x = step(k);
          const t = [0, 0.4, 0.8, 1][k];
          const inner = 22;
          const W = 2 * Math.PI * inner;
          return (
            <g key={k}>
              {k < 3 ? (
                <IkatStrip strip={{ cx: x, baseY: mid, W, t }} columns={6} H={50} flames={1} specs={k < 2 ? undefined : RISHTAN_SPECS} centreY={mid} smooth={[0, 0.35, 0.75][k]} dividers={k === 2 ? color.ink : undefined} />
              ) : (
                <RishtanPlate cx={x} cy={mid} R={78} />
              )}
              {k < 3 && <Arrow x={x + 88} y={mid} />}
            </g>
          );
        })}
      </Cell>
    </AbsoluteFill>
  );
};



