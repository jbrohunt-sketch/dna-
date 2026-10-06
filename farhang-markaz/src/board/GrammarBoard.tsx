import React from "react";
import { AbsoluteFill } from "remotion";
import { color, count, dancer, type ColorName } from "../design/tokens";
import { sans } from "../design/fonts";
import { lerp, type Pt } from "../shapes/geo";
import { Dancer, handAt } from "../shapes/Dancer";
import { HemBand, Skirt } from "../shapes/Skirt";
import { Doppi } from "../shapes/Doppi";
import { BraidMass, Braids, HeroBraid, heroSpine, spine } from "../shapes/Braids";
import { Doira } from "../shapes/Doira";
import { Dutar } from "../shapes/Dutar";
import { IkatStrip } from "../shapes/Ikat";
import { RISHTAN_SPECS, RishtanPlate } from "../shapes/Rishtan";

// One-page visual grammar (v3 rev 2) — after Art Director + Cultural Auditor conditional passes.
export const BOARD = { width: 2400, height: 3480 } as const;
const M = 80;
const G = 40;
const CW = (BOARD.width - 2 * M - 2 * G) / 3;
const CH = 760;
const TOP = 240;
const ART_H = 540;
const FRAME0_ROT = 28;

const Cell: React.FC<{ readonly i: number; readonly title: string; readonly caption: string; readonly children: React.ReactNode }> = ({
  i,
  title,
  caption,
  children,
}) => (
  <div style={{ position: "absolute", left: M + (i % 3) * (CW + G), top: TOP + Math.floor(i / 3) * (CH + G), width: CW, height: CH }}>
    <div style={{ borderTop: `3px solid ${color.ink}`, paddingTop: 16, fontFamily: sans, fontWeight: 700, fontSize: 28, letterSpacing: "0.04em", color: color.ink }}>
      {String(i + 1).padStart(2, "0")} — {title}
    </div>
    <svg viewBox={`0 0 ${CW} ${ART_H}`} width={CW} height={ART_H} style={{ marginTop: 18 }}>
      {children}
    </svg>
    <div style={{ fontFamily: sans, fontSize: 21, lineHeight: 1.38, color: color.ink, opacity: 0.8, marginTop: 12 }}>{caption}</div>
  </div>
);

const Arrow: React.FC<{ readonly x: number; readonly y: number }> = ({ x, y }) => (
  <path d={`M${x - 12} ${y} L${x + 10} ${y} M${x + 2} ${y - 8} L${x + 10} ${y} L${x + 2} ${y + 8}`} stroke={color.ink} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);

const Label: React.FC<{ readonly from: Pt; readonly to: Pt; readonly text: string }> = ({ from, to, text }) => (
  <g>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color.ink} strokeWidth={2} />
    <circle cx={from[0]} cy={from[1]} r={4} fill={color.ink} />
    <text x={to[0] + 8} y={to[1] + 7} fontFamily={sans} fontSize={20} fontWeight={600} fill={color.ink}>
      {text}
    </text>
  </g>
);

const Small: React.FC<{ readonly x: number; readonly y: number; readonly children: React.ReactNode; readonly anchor?: "middle" | "start" }> = ({ x, y, children, anchor = "middle" }) => (
  <text x={x} y={y} fontFamily={sans} fontSize={18} textAnchor={anchor} fill={color.ink}>
    {children}
  </text>
);

const SWATCHES: { name: ColorName; source: string; role: string }[] = [
  { name: "cream", source: "Rishtan milky slip", role: "ground — always" },
  { name: "milk", source: "slip white", role: "doira skin, sleeves, doppi ground, cores" },
  { name: "ink", source: "Rishtan dark outline (stylised)", role: "braids, outlines, type" },
  { name: "cobalt", source: "Rishtan cobalt · indigo atlas", role: "primary blue, rim, hem band" },
  { name: "sky", source: "stylisation", role: "alternate skirt panels" },
  { name: "ishkor", source: "Rishtan ishkor; stands in for atlas/gul green", role: "plate, bushes, one ikat column" },
  { name: "red", source: "madder red (atlas)", role: "flames, nimcha, cuffs, tassels, strike" },
  { name: "pink", source: "chamanda gul flower", role: "florals only" },
  { name: "saffron", source: "isparak yellow (atlas)", role: "dutar frets only" },
];

const straightened = (sp: readonly Pt[], to: Pt, t: number): Pt[] =>
  sp.map((p, k) => {
    const u = k / (sp.length - 1);
    return [lerp(p[0], lerp(sp[0][0], to[0], u), t), lerp(p[1], lerp(sp[0][1], to[1], u), t)] as Pt;
  });

export const GrammarBoard: React.FC = () => {
  const mid = ART_H / 2;
  const step = (k: number) => 92 + k * 178;
  return (
    <AbsoluteFill style={{ backgroundColor: color.cream }}>
      <div style={{ position: "absolute", left: M, top: 70, fontFamily: sans, color: color.ink }}>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.01em" }}>Farhang Markaz — Visual Grammar v3 · rev 3</div>
        <div style={{ fontSize: 26, marginTop: 10, opacity: 0.75 }}>
          After two Art Director + Cultural Auditor review rounds · flat shapes on cream · Fergana anchor · [R#] = cultural register entry · ◇ = provisional / stylisation
        </div>
      </div>

      <Cell i={0} title="BACKGROUND" caption="Cream (Rishtan slip) is always the ground. Only exception: a hero shape that scales until it fills the frame (skirt → doira at T1). No gradients, grain, vignette, lighting or shadows.">
        <rect x={150} y={70} width={225} height={400} fill={color.cream} stroke={color.ink} strokeWidth={2} />
        <Dancer id="b-bg" cx={262} cy={270} R={92} rotation={FRAME0_ROT} />
        <rect x={420} y={70} width={225} height={400} fill={color.cobalt} stroke={color.ink} strokeWidth={2} />
        <circle cx={532} cy={270} r={96} fill={color.milk} />
        <Small x={262} y={505}>default</Small>
        <Small x={532} y={505}>shape fills frame</Small>
      </Cell>

      <Cell i={1} title="PALETTE" caption="Every accent colour traces to a named source; ink and sky are stylisation. Leaf merged into ishkor; saffron = frets only; pink = florals only. Retired: dark grounds, gold/metallics, simulated materials. ◇ Proportions pending the reference.">
        {SWATCHES.map((s, k) => {
          const y = 22 + k * 56;
          return (
            <g key={s.name}>
              <circle cx={32} cy={y + 20} r={21} fill={color[s.name]} stroke={color.ink} strokeWidth={s.name === "cream" || s.name === "milk" ? 2 : 0} />
              <text x={66} y={y + 16} fontFamily={sans} fontSize={21} fontWeight={700} fill={color.ink}>
                {s.name} <tspan fontWeight={400} opacity={0.7}>{color[s.name]}</tspan>
              </text>
              <text x={66} y={y + 40} fontFamily={sans} fontSize={18} fill={color.ink} opacity={0.75}>
                {s.source} · {s.role}
              </text>
            </g>
          );
        })}
      </Cell>

      <Cell i={2} title="TYPOGRAPHY · IDENTITY ◇" caption="The identity ring IS the hem band (0.13R, 36 flames) at the frame-0 rotation — so the last frame blooms back into the spin. Inter Tight 700, ink. Divider = the two dutar strings spanning the ring, one plucked — never a short double bar. ◇ Size, tracking, timing pending the reference.">
        <HemBand cx={360} cy={mid} R={268} />
        <text x={360} y={mid - 30} fontFamily={sans} fontSize={60} fontWeight={700} textAnchor="middle" fill={color.ink} letterSpacing="0.02em">FARHANG</text>
        <Dutar a={[360 - 268 * 0.845, mid + 1]} b={[360 + 268 * 0.845, mid + 1]} gap={10} pluck={{ at: 0.32, amp: -5 }} weight={3} />
        <text x={360} y={mid + 76} fontFamily={sans} fontSize={60} fontWeight={700} textAnchor="middle" fill={color.ink} letterSpacing="0.02em">MARKAZ</text>
      </Cell>

      <Cell i={3} title="DANCER CONSTRUCTION" caption="≈10 shape families, R = 360 at film scale. Rounded arms, plain-silk sleeves [R6], palm-up hands [R8]; braids as a tail rooted at the doppi, not spokes. Reduces a dervish reading; braids + doppi carry the distinction [R9]. Right: true 0.1× (108×192) check.">
        <Dancer id="b-d" cx={235} cy={mid + 10} R={200} rotation={0} />
        <Label from={[235 + 0.45 * 200, mid + 10 - 0.82 * 200]} to={[460, 40]} text="hem band · 36 flames" />
        <Label from={[235 + 0.45 * 200, mid + 10 - 0.13 * 200]} to={[460, 100]} text="silk sleeve + cuff" />
        <Label from={[235 + 0.74 * 200, mid + 10 - 0.08 * 200]} to={[460, 160]} text="palm-up hand" />
        <Label from={[235 + 0.24 * 200, mid + 10 + 0.12 * 200]} to={[460, 220]} text="nimcha" />
        <Label from={[235, mid + 10]} to={[460, 280]} text="doppi 0.28R" />
        <Label from={[235 + 0.08 * 200, mid + 10 + 0.5 * 200]} to={[460, 340]} text="braid tail ×7" />
        <Label from={[235 - 0.42 * 200, mid + 10 + 0.42 * 200]} to={[460, 400]} text="hero braid" />
        <rect x={600} y={430} width={108} height={192 * 0.55} fill={color.cream} stroke={color.ink} strokeWidth={1} />
        <Dancer id="b-thumb" cx={654} cy={430 + 53} R={36} rotation={FRAME0_ROT} />
      </Cell>

      <Cell i={4} title="HEADPIECE" caption="Women's square doppi, chamanda gul type (Margilan/Tashkent, mid-20th c.) [R2 Med]: four bushes fill each face, stems to centre, band border. Milk ground chosen because the dark ground failed the thumbnail test (read as a black men's cap [R1]). ◇ Ground + 3 flowers are stylisation.">
        <g transform={`translate(215 ${mid})`}>
          <Doppi size={300} keyline={0} />
        </g>
        <g transform={`translate(500 ${mid - 70})`}>
          <Doppi size={dancer.doppi * dancer.R} keyline={5} />
        </g>
        <Small x={500} y={mid + 10}>film scale</Small>
        <g transform={`translate(640 ${mid - 70})`}>
          <Doppi size={dancer.doppi * dancer.R * 0.1} keyline={1} />
        </g>
        <Small x={640} y={mid + 10}>0.1×</Small>
        <g transform={`translate(570 ${mid + 120})`}>
          <Doppi size={70} keyline={0} ground="ink" />
          <line x1={-44} y1={-44} x2={44} y2={44} stroke={color.red} strokeWidth={5} />
        </g>
        <Small x={570} y={mid + 185}>dark ground: rejected</Small>
      </Cell>

      <Cell i={5} title="BRAID CONSTRUCTION" caption="qirq kokil (unmarried girl) [R3]. Film scale: 7 solid masses in a tail (±32°, 0.06→0.03R). Close-ups only: 5 strands per mass (≈35 implied). Hero braid = 2 strands (it unzips into the strings). Sochpopuk = silver cap + coral/silk tassel [R4].">
        <BraidMass sp={spine(70, 90, 8, 10, 0, 400)} w0={60} w1={30} strands={5} divider={4} />
        <Small x={70} y={60} anchor="start">close-up: 5 strands</Small>
        <HeroBraid sp={spine(70, 230, 6, 6, 0, 330)} R={520} />
        <Small x={70} y={205} anchor="start">hero braid: 2 strands</Small>
        <Braids cx={520} cy={320} R={240} rotation={-60} lag={18} hero />
        <g transform={`translate(520 320) rotate(-60)`}>
          <Doppi size={dancer.doppi * 240} keyline={3} />
        </g>
        <Small x={430} y={520} anchor="start">film scale: solid tail</Small>
      </Cell>

      <Cell i={6} title="DRESS / IKAT" caption="Khan-atlas (Margilan) [R5]: stepped flames tapering at both ends, stacked tip-to-base into flame columns; misregistration = whole-step offsets. On the skirt: plain panels + one hem band of 36 flames (≥2× long as wide). ◇ Colours are stylisation.">
        <IkatStrip strip={{ cx: 175, baseY: 495, W: 300, t: 0 }} columns={6} H={440} flames={4} misregister />
        <Arrow x={370} y={mid} />
        <Skirt id="b-ik" cx={555} cy={mid} R={150} rotation={0} />
      </Cell>

      <Cell i={7} title="DOIRA" caption="Seen from the open side, where the rings hang on the inner wall [R10]: cobalt rim (= hem band width), milk skin, 12 ring pairs (stylised count). The strike is a flat red wave in the skin (struck on the far side), on dum / tak. No texture, no wood.">
        <Doira id="b-do" cx={360} cy={mid} R={230} strike={{ x: 205, y: mid - 120, r: 80, w: 10 }} />
      </Cell>

      <Cell i={8} title="PLATE · FERGANA-SCHOOL, RISHTAN PALETTE" caption="Replaces architecture [R12, R13]. Milk ground, dark outlines, cobalt + ishkor. Four-lobed centres are documented (V&A O225424); growing it from the doppi's bushes is a design rhyme. Bodom leaves in 12 compartments; checked rim = doira's 24 rings. ◇ Counts are stylisation.">
        <RishtanPlate cx={360} cy={mid} R={235} />
      </Cell>

      <Cell i={9} title="MORPH 1 — SKIRT → DOIRA (T1)" caption="Tak: her hand meets the hem; the strike wave starts at the hand. Dum: the body draws into the centre and the skin opens from there. Flames retract; the hem band becomes the rim; rings settle in pairs.">
        {[0, 1, 2, 3].map((k) => {
          const x = step(k);
          const R = 80;
          const hand = handAt(1, R);
          const hx = x + hand.at[0] * Math.cos((FRAME0_ROT * Math.PI) / 180) - hand.at[1] * Math.sin((FRAME0_ROT * Math.PI) / 180);
          const hy = mid + hand.at[0] * Math.sin((FRAME0_ROT * Math.PI) / 180) + hand.at[1] * Math.cos((FRAME0_ROT * Math.PI) / 180);
          return (
            <g key={k}>
              {k === 0 && (
                <g>
                  <Dancer id="m1a" cx={x} cy={mid} R={R} rotation={FRAME0_ROT} hero={false} />
                  <circle cx={hx} cy={hy} r={10} fill="none" stroke={color.red} strokeWidth={4} />
                </g>
              )}
              {k === 1 && (
                <g>
                  <Skirt id="m1b" cx={x} cy={mid} R={R} rotation={FRAME0_ROT} flames={0.5} panels={0.5} />
                  <circle cx={x} cy={mid} r={R * 0.3} fill={color.milk} />
                  <Dancer id="m1b2" cx={x} cy={mid} R={R} rotation={FRAME0_ROT} hero={false} body={0.3} flare={0} />
                  <circle cx={hx} cy={hy} r={24} fill="none" stroke={color.red} strokeWidth={4} />
                </g>
              )}
              {k === 2 && (
                <g>
                  <circle cx={x} cy={mid} r={R} fill={color.cobalt} />
                  <circle cx={x} cy={mid} r={R * (1 - dancer.band) * 0.92} fill={color.milk} />
                </g>
              )}
              {k === 3 && <Doira id="m1d" cx={x} cy={mid} R={R} strike={{ x: hx, y: hy, r: 40, w: 3 }} />}
              {k < 3 && <Arrow x={x + 90} y={mid} />}
            </g>
          );
        })}
      </Cell>

      <Cell i={10} title="MORPH 2 — HERO BRAID → DUTAR (T2)" caption="The 2-strand hero braid peels from the tail, straightens under tension and unzips along its divider into two strings; tied frets tick on [R11]; the pluck is the instant-after-release triangle.">
        {[0, 1, 2, 3].map((k) => {
          const x = step(k);
          const hs = heroSpine(x + 30, mid - 130, 150, -40, 18);
          const to: Pt = [x - 40, mid + 210];
          return (
            <g key={k}>
              {k === 0 && (
                <g>
                  <Braids cx={x + 30} cy={mid - 130} R={150} rotation={-40} lag={18} hero minFeature={1.5} />
                  <g transform={`translate(${x + 30} ${mid - 130}) rotate(-40)`}>
                    <Doppi size={dancer.doppi * 150} keyline={2} />
                  </g>
                </g>
              )}
              {k === 1 && <HeroBraid sp={straightened(hs, to, 0.6)} R={150} minFeature={1.5} />}
              {k === 2 && (
                <g>
                  <HeroBraid sp={straightened(hs, to, 1).slice(0, 10)} R={150} minFeature={1.5} />
                  <Dutar a={straightened(hs, to, 1)[9]} b={to} gap={10} weight={4} />
                </g>
              )}
              {k === 3 && <Dutar a={hs[0]} b={to} gap={14} frets={6} fretSpan={0.4} pluck={{ at: 0.72, amp: 14 }} />}
              {k < 3 && <Arrow x={x + 90} y={mid} />}
            </g>
          );
        })}
      </Cell>

      <Cell i={11} title="MORPH 3 — STRINGS → WARP → PLATE (T3)" caption="Each string throws stepped echoes → 12 warp columns; flames dye them; the warp bends into a ring while each stepped flame relaxes into a bodom leaf and re-glazes to Rishtan colours — a formal rhyme between pointed-oval shapes, not a claim of derivation.">
        {[0, 1, 2, 3].map((k) => {
          const x = step(k);
          const inner = 22;
          const W = 2 * Math.PI * inner;
          const cols = count.plateSegments;
          return (
            <g key={k}>
              {k === 0 &&
                Array.from({ length: cols }, (_, i) => {
                  const u = -W / 2 + (i + 0.5) * (W / cols);
                  const isString = i === cols / 2 - 1 || i === cols / 2;
                  const d = Math.abs(i - (cols - 1) / 2);
                  return (
                    <line key={i} x1={x + u} x2={x + u} y1={mid - 40} y2={mid + 40} stroke={color.ink} strokeWidth={isString ? 4 : 2} opacity={isString ? 1 : 0.85 - d * 0.1} />
                  );
                })}
              {k === 1 && <IkatStrip strip={{ cx: x, baseY: mid, W, t: 0 }} columns={cols} H={80} flames={2} centreY={mid} />}
              {k === 2 && (
                <IkatStrip strip={{ cx: x, baseY: mid, W, t: 0.5 }} columns={cols} H={46} flames={1} specs={RISHTAN_SPECS} smooth={0.5} centreY={mid} dividers={color.ink} dividerWidth={1.5} />
              )}
              {k === 3 && <RishtanPlate cx={x} cy={mid} R={80} />}
              {k < 3 && <Arrow x={x + 90} y={mid} />}
            </g>
          );
        })}
      </Cell>
    </AbsoluteFill>
  );
};
