/* GENOME ATLAS — renders window.ATLAS (produced by pipeline/analyze.py). No network access. */
(function () {
  "use strict";
  const A = window.ATLAS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n, d = 0) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (x, d = 1) => fmt(x * 100, d) + "%";
  const CH = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","X","Y"];
  const STREAM_ORDER = ["iranian", "oasis", "steppe", "south", "east", "anatolian", "europe", "composite", "other"];
  const TIER_NAMES = { A: "Observed", B: "Strong inference", C: "Probabilistic", D: "Exploratory", X: "Non-genetic" };

  /* ---------------- shared UI ---------------- */
  const tip = $("#tooltip");
  function showTip(e, html) { tip.innerHTML = html; tip.classList.add("on"); moveTip(e); }
  function moveTip(e) {
    const pad = 14, r = tip.getBoundingClientRect();
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hideTip() { tip.classList.remove("on"); }
  function bindTips(root) {
    $$("[data-tip]", root).forEach((n) => {
      n.addEventListener("mouseenter", (e) => showTip(e, n.getAttribute("data-tip")));
      n.addEventListener("mousemove", moveTip);
      n.addEventListener("mouseleave", hideTip);
    });
  }
  const tt = (title, rows) => `<div class='tt-title'>${esc(title)}</div>` + rows.map(([k, v]) => `<div class='tt-row'><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
  const tier = (t, withName = true) => `<span class="tier" data-t="${t}" title="Evidence tier ${t}: ${esc(A.meta.tiers[t]?.desc || "")}"><b>${t}</b>${withName ? esc(TIER_NAMES[t]) : ""}</span>`;
  function why(rows) {
    const body = rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("");
    return `<details class="why"><summary>Why do we think this?</summary><dl>${body}</dl></details>`;
  }
  const srcFile = () => `<span class="mono">${esc(A.meta.dataset.file)}</span> <span class="faint">(sha256 ${esc(A.meta.dataset.sha256.slice(0, 12))}…)</span>`;

  /* ---------------- navigation (state-based: no URL/hash changes, safe in sandboxed previews) ---------------- */
  const CHAPTERS = [
    { id: "portrait", roman: "I", name: "Portrait", q: "Who am I, genetically?", subs: [["portrait", "Portrait"], ["findings", "What stands out"], ["identity", "Seven kinds of ancestry"]] },
    { id: "origins", roman: "II", name: "Origins", q: "Where did my ancestry come from, and when?", subs: [["river", "River of ancestry"], ["tajik", "Places"], ["services", "Services compared"], ["time", "Timeline"]] },
    { id: "lines", roman: "III", name: "Lineages", q: "What can be traced to each parent?", subs: [["lineages", "Paternal & maternal lines"], ["parents", "Which parent?"]] },
    { id: "body", roman: "IV", name: "Body", q: "What does my DNA say about traits and health?", subs: [["traits", "Traits"], ["health", "Health & drug response"]] },
    { id: "genome", roman: "V", name: "Genome", q: "What exactly is in my data?", subs: [["chromosomes", "Chromosome explorer"], ["explorer", "Variant explorer"], ["quality", "Data quality"], ["method", "Method & privacy"]] },
  ];
  const chapterOf = (sub) => CHAPTERS.find((c) => c.subs.some(([id]) => id === sub));
  const state = { sub: "portrait", arg: null };
  function buildNav() {
    $("#nav-links").innerHTML = CHAPTERS.map((c) => `
      <div class="chap" data-chap="${c.id}">
        <button class="chap-btn" data-go="${c.subs[0][0]}"><span class="roman">${c.roman}</span><span>${c.name}</span></button>
        <div class="chap-subs">${c.subs.map(([id, n]) => `<button class="sub-btn" data-go="${id}">${n}</button>`).join("")}</div>
      </div>`).join("");
  }
  const rendered = new Set();
  function go(sub, arg = null) {
    if (!RENDER[sub]) sub = "portrait";
    state.sub = sub; state.arg = arg;
    const chap = chapterOf(sub);
    $$(".chap").forEach((c) => c.classList.toggle("open", c.dataset.chap === chap.id));
    $$("[data-go]", $("#nav-links")).forEach((b) => b.classList.toggle("active", b.dataset.go === sub));
    $("#chapter-head").innerHTML = `<div class="chap-eyebrow"><span class="roman">${chap.roman}</span>${esc(chap.name)}<span class="sep">·</span><span class="q">${esc(chap.q)}</span></div>
      <div class="subtabs">${chap.subs.map(([id, n]) => `<button data-go="${id}" aria-selected="${id === sub}">${n}</button>`).join("")}</div>`;
    $$("section.page").forEach((s) => s.classList.toggle("active", s.id === sub));
    const el = $("#" + sub);
    if (!rendered.has(sub) || (sub === "chromosomes" && arg)) { RENDER[sub](el, arg); bindTips(el); rendered.add(sub); reveal(el); }
    try { sessionStorage.setItem("atlas-view", sub); } catch {}
    window.scrollTo({ top: 0 });
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go]");
    if (t) { e.preventDefault(); go(t.dataset.go, t.dataset.arg || null); }
  });
  function reveal(root) {
    const els = $$(".panel, .finding, .tl-card, .layer, .door, h2", root);
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -40px 0px" });
    els.forEach((n, i) => { n.classList.add("rv"); n.style.transitionDelay = Math.min(i % 6, 5) * 40 + "ms"; io.observe(n); });
    setTimeout(() => els.forEach((n) => n.classList.add("in")), 1600); // never leave content hidden
  }
  function lens() {
    const set = (v) => { document.body.dataset.lens = v; $$(".lens button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === v)); };
    $$(".lens button").forEach((b) => b.addEventListener("click", () => set(b.dataset.l)));
    set("all");
  }
  function theme() {
    const saved = (() => { try { return localStorage.getItem("atlas-theme"); } catch { return null; } })();
    const set = (t) => {
      if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
      $$(".theme-toggle button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.t === t));
      try { localStorage.setItem("atlas-theme", t); } catch {}
    };
    $$(".theme-toggle button").forEach((b) => b.addEventListener("click", () => set(b.dataset.t)));
    set(saved || "auto");
  }

  /* ---------------- chart helpers ---------------- */
  const hetBins = (ch) => {
    const b = A.bins.data[ch];
    return b.markers.map((m, i) => ({ i, m, h: b.het[i], all: b.all_markers[i], rate: m >= 10 ? b.het[i] / m : null }));
  };
  const SEQ = ["var(--seq-0)", "var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)"];
  const seqColor = (v, lo, hi) => (v == null ? "var(--surface-2)" : SEQ[Math.max(0, Math.min(5, Math.floor(((v - lo) / (hi - lo)) * 6)))]);
  const panelSites = () => [...A.traits, ...A.pgx.sites, ...A.health.sites].filter((s) => s.chrom);

  function karyogram(opts = {}) {
    const W = 1000, lab = 44, rowH = opts.rowH || 16, gap = opts.gap || 9, maxL = A.chromosomes["1"].length;
    const chroms = CH, H = chroms.length * (rowH + gap) + 26;
    const sites = panelSites();
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Karyogram: heterozygosity per 2 Mb window, runs of homozygosity, and annotated variants">`;
    chroms.forEach((ch, r) => {
      const y = r * (rowH + gap) + 6, L = A.chromosomes[ch].length, w = ((W - lab - 10) * L) / maxL, bw = (w * A.bins.size) / L;
      s += `<g class="karyo-row" data-ch="${ch}"><text class="ch-name" x="${lab - 10}" y="${y + rowH - 4}" text-anchor="end">${ch}</text>`;
      s += `<rect x="${lab}" y="${y}" width="${w}" height="${rowH}" rx="${rowH / 2}" fill="var(--surface-2)"/>`;
      const isSex = ch === "X" || ch === "Y";
      const bins = hetBins(ch);
      const maxAll = Math.max(...bins.map((b) => b.all));
      bins.forEach((b) => {
        const x = lab + b.i * bw; if (x > lab + w) return;
        const v = isSex ? (b.all ? b.all / maxAll : null) : b.rate;
        const col = isSex ? seqColor(v, 0, 1.0001) : seqColor(v, 0.06, 0.3);
        const t = isSex ? tt(`chr${ch} · ${b.i * 2}–${b.i * 2 + 2} Mb`, [["markers", fmt(b.all)], ["note", "haploid in males: density shown"]])
          : tt(`chr${ch} · ${b.i * 2}–${b.i * 2 + 2} Mb`, [["SNVs called", fmt(b.m)], ["heterozygous", b.rate == null ? "too few markers" : pct(b.rate)]]);
        s += `<rect x="${x.toFixed(1)}" y="${y + 2}" width="${Math.max(bw - 0.6, 0.6).toFixed(2)}" height="${rowH - 4}" fill="${col}" data-tip="${esc(t)}"/>`;
      });
      const cx = lab + (w * A.chromosomes[ch].centromere) / L;
      s += `<path d="M${cx - 3},${y - 1} L${cx + 3},${y - 1} L${cx},${y + 3} Z M${cx - 3},${y + rowH + 1} L${cx + 3},${y + rowH + 1} L${cx},${y + rowH - 3} Z" fill="var(--ink-3)"/>`;
      A.roh.segments.filter((g) => g.chrom === ch).forEach((g) => {
        const x0 = lab + (w * g.start) / L, x1 = lab + (w * g.end) / L;
        s += `<rect x="${x0}" y="${y + rowH + 1.5}" width="${Math.max(x1 - x0, 2)}" height="3" rx="1.5" fill="var(--roh)" data-tip="${esc(tt("Run of homozygosity", [["location", `chr${ch}:${fmt(g.start)}–${fmt(g.end)}`], ["length", g.length_mb + " Mb"], ["SNPs", g.snps]]))}"/>`;
      });
      if (opts.sites !== false) sites.filter((v) => v.chrom === ch).forEach((v) => {
        const x = lab + (w * v.pos) / L;
        s += `<path d="M${x - 3.5},${y - 5} L${x + 3.5},${y - 5} L${x},${y + 1} Z" fill="var(--ink)" data-tip="${esc(tt(v.rsid + " · " + v.gene, [["genotype", v.genotype], ["position", `chr${ch}:${fmt(v.pos)}`], ["", v.trait || v.condition || v.star || ""]]))}"/>`;
      });
      s += `</g>`;
    });
    s += `</svg>`;
    return s;
  }
  const karyoLegend = () => `<div class="legend"><span><i style="background:linear-gradient(90deg,var(--seq-0),var(--seq-2),var(--seq-5));width:60px"></i>heterozygosity per 2 Mb (low → high)</span><span><i style="background:var(--roh);height:4px"></i>run of homozygosity ≥1.5 Mb</span><span><svg width="10" height="8"><path d="M1,1 L9,1 L5,7Z" fill="currentColor"/></svg>annotated variant</span><span><svg width="10" height="8"><path d="M1,1 L9,1 L5,5Z" fill="var(--ink-3)"/></svg>centromere</span></div>`;

  function hbarStack(rows) {
    // rows: [{label, sub, streams:{k:v}}]
    const W = 1000, lab = 250, barH = 26, gap = 22, H = rows.length * (barH + gap) + 8, w = W - lab - 10;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ancestry by harmonized stream for each service">
      <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--s-composite)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--surface)" stroke-width="1.6" opacity=".55"/></pattern></defs>`;
    rows.forEach((r, i) => {
      const y = i * (barH + gap) + 4;
      s += `<text class="lbl-strong" x="0" y="${y + 11}">${esc(r.label)}</text><text x="0" y="${y + 26}">${esc(r.sub)}</text>`;
      let x = lab;
      const tot = STREAM_ORDER.reduce((a, k) => a + (r.streams[k] || 0), 0);
      STREAM_ORDER.forEach((k) => {
        const v = r.streams[k]; if (!v) return;
        const ww = (w * v) / tot;
        const fill = k === "composite" ? "url(#hatch)" : `var(--s-${k})`;
        s += `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(ww - 2, 0.8).toFixed(1)}" height="${barH}" rx="3" fill="${fill}" data-tip="${esc(tt(A.ancestry.streams[k].name, [["share", fmt(v, 1) + "%"], ["service", r.label]]))}"/>`;
        if (ww > 52) s += `<text x="${(x + 7).toFixed(1)}" y="${y + 17}" style="fill:#fff;font-weight:600;paint-order:stroke;stroke:rgba(0,0,0,.25);stroke-width:2px">${fmt(v, v < 10 ? 1 : 0)}%</text>`;
        x += ww;
      });
    });
    return s + `</svg>`;
  }
  const streamLegend = () => `<div class="legend">${STREAM_ORDER.map((k) => `<span><i class="${k === "composite" ? "hatch-bg" : ""}" style="background-color:var(--s-${k})"></i>${esc(A.ancestry.streams[k].name)}</span>`).join("")}</div>`;

  function dotRow(items, max, opts = {}) {
    const W = 1000, lab = 0, H = 70, w = W - 40;
    const X = (v) => 20 + (w * v) / max;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
    for (let t = 0; t <= max; t += opts.step || 5) s += `<g class="grid"><line x1="${X(t)}" x2="${X(t)}" y1="14" y2="44"/></g><text x="${X(t)}" y="62" text-anchor="middle">${t}%</text>`;
    s += `<line x1="${X(0)}" x2="${X(max)}" y1="29" y2="29" stroke="var(--rule)" stroke-width="2"/>`;
    const placed = [];
    items.sort((a, b) => a[1] - b[1]).forEach(([name, v], i) => {
      const x = X(v);
      s += `<circle cx="${x}" cy="29" r="7" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" data-tip="${esc(tt(name, [["value", fmt(v, 1) + "%"]]))}"/>`;
      placed.push([name, v, x, i]);
    });
    s += `</svg>`;
    const list = placed.map(([n, v]) => `<span><b>${fmt(v, 1)}%</b> ${esc(n)}</span>`).join(" · ");
    return s + `<div class="legend" style="gap:4px 14px">${list}</div>`;
  }

  /* ---------------- pages ---------------- */
  const RENDER = {};

  /* ---------- ornament: 8-point girih star lattice (drawn, not fetched) ---------- */
  const ORNAMENT = `<svg class="ornament" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs><pattern id="girih" width="64" height="64" patternUnits="userSpaceOnUse">
    <g fill="none" stroke="currentColor" stroke-width="0.8"><path d="M32 4 L38 26 L60 32 L38 38 L32 60 L26 38 L4 32 L26 26 Z"/><rect x="18" y="18" width="28" height="28" transform="rotate(45 32 32)"/>
    <rect x="18" y="18" width="28" height="28"/><circle cx="32" cy="32" r="5"/><path d="M0 0 L10 10 M64 0 L54 10 M0 64 L10 54 M64 64 L54 54"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#girih)"/></svg>`;

  const RINGS = [
    { key: "genealogy", reach: 0.55, verdict: "Partly", extra: "Only three threads are traced directly: your Y (father's line), mtDNA (mother's line) and X (entirely from your mother)." },
    { key: "genetic", reach: 1, verdict: "Directly", extra: "This is what your 638,544 markers measure." },
    { key: "affinity", reach: 0.95, verdict: "Directly", extra: "Distances to reference populations: closest is Tajik (2.512)." },
    { key: "culture", reach: 0.35, verdict: "Indirectly", extra: "Only through similarity to ancient people buried in a culture's sites." },
    { key: "ethnicity", reach: 0.12, verdict: "Barely", extra: "DNA can be consistent with an ethnic identity, but it cannot confer or deny it." },
    { key: "language", reach: 0.06, verdict: "No", extra: "Languages spread by learning. Many Turkic speakers are mostly Iranian-related genetically, and vice versa." },
    { key: "nationality", reach: 0, verdict: "No", extra: "Borders are political. The 1920s Soviet borders split Tajik and Uzbek communities." },
  ];
  function ringsSvg() {
    const L = Object.fromEntries(A.knowledge.identity_layers.map((l) => [l.key, l]));
    const C = 330, r0 = 64, step = 37, band = 31;
    let s = `<svg class="chart rings" viewBox="0 0 660 660" role="img" aria-label="Identity rings: how far DNA reaches into each kind of identity">
      <defs><radialGradient id="reach" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="var(--brass)" stop-opacity=".55"/><stop offset=".38" stop-color="var(--brass)" stop-opacity=".22"/><stop offset=".62" stop-color="var(--brass)" stop-opacity=".04"/><stop offset="1" stop-color="var(--brass)" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${C}" cy="${C}" r="${r0 + step * 7}" fill="url(#reach)"/>`;
    RINGS.forEach((g, i) => {
      const r = r0 + step * i + band / 2, l = L[g.key];
      const t = esc(tt(l.name, [["DNA speaks to this", g.verdict]]) + `<div style="margin-top:6px;color:var(--ink-2)">${esc(g.extra)}</div>`);
      s += `<g class="ring" data-ring="${g.key}" data-tip="${t}">
        <circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="var(--brass)" stroke-opacity="${0.06 + g.reach * 0.4}" stroke-width="${band}"/>
        <circle cx="${C}" cy="${C}" r="${r + band / 2}" fill="none" stroke="var(--brass)" stroke-opacity="${g.reach < 0.3 ? 0.35 : 0.55}" stroke-width="0.8" ${g.reach < 0.3 ? `stroke-dasharray="2 4"` : ""}/>
        <path id="arc-${g.key}" d="M ${C - r} ${C} A ${r} ${r} 0 0 1 ${C + r} ${C}" fill="none"/>
        <text class="ring-lbl" dy="4"><textPath href="#arc-${g.key}" startOffset="50%" text-anchor="middle">${esc(l.name.toUpperCase())}</textPath></text></g>`;
    });
    s += `<circle cx="${C}" cy="${C}" r="${r0 - 8}" fill="var(--surface)" stroke="var(--brass)" stroke-width="1.2"/>
      <text x="${C}" y="${C - 6}" text-anchor="middle" class="ring-you">You</text>
      <text x="${C}" y="${C + 16}" text-anchor="middle" class="ring-you-sub">Y · mt · X · 22 autosomes</text>
      <text x="${C}" y="${C + r0 + step * 3 + 6}" text-anchor="middle" class="ring-edge">— where DNA's reach fades —</text></svg>`;
    return s;
  }

  RENDER.portrait = (el) => {
    const q = A.qc, y = A.haplogroups.y, top = A.reported.distances[0], F = A.findings;
    el.innerHTML = `
      <div class="hero-plate">${ORNAMENT}
        <div class="hero-inner">
          <div class="eyebrow">A genetic portrait · ${fmt(q.markers)} markers · ${esc(A.meta.dataset.build)}</div>
          <h1 class="display">Your father's line runs back through <em>${esc(y.yhaplo_ycc || "C1b1a1a")}</em>, your mother's through <em>${esc(A.haplogroups.mt.reported)}</em>. Between them are thousands of ancestors from the oasis cities, the Iranian plateau, the steppe and the mountains toward the Indus.</h1>
          <p class="lede">Today your genome sits closest to <b>Tajik</b> reference samples (distance ${top.distance}). What follows separates what your DNA <em>shows</em> from what it only <em>suggests</em>, and from what it cannot say at all.</p>
        </div>
        <div class="hero-facts">
          <div class="fact"><div class="v">${esc(y.yhaplo_23andme_label || "—")}</div><div class="k">paternal line · verified</div></div>
          <div class="fact"><div class="v">${esc(A.haplogroups.mt.reported)}</div><div class="k">maternal line · supported</div></div>
          <div class="fact"><div class="v">${esc(top.population)}</div><div class="k">closest living reference</div></div>
          <div class="fact"><div class="v">${fmt(q.markers)}</div><div class="k">markers · ${pct(1 - q.no_call_rate)} called</div></div>
        </div>
      </div>

      <h2>Four ways into who you are</h2>
      <p class="muted">People make sense of identity through the people they come from, the places they belong to, the story over time, and their own body. The atlas is organised the same way.</p>
      <div class="doors">
        <button class="door" data-go="lineages"><span class="door-k">People</span><span class="door-v">${esc(y.yhaplo_23andme_label)} · ${esc(A.haplogroups.mt.reported)}</span><span class="door-d">Two traceable lines, and what can honestly be assigned to each parent.</span><span class="door-go">Lineages →</span></button>
        <button class="door" data-go="tajik"><span class="door-k">Places</span><span class="door-v">Tajik · Hisor · Ayni</span><span class="door-d">Your closest reference populations on the map, with Garm and Kanibadam marked.</span><span class="door-go">Places →</span></button>
        <button class="door" data-go="river"><span class="door-k">Time</span><span class="door-v">5 streams, 10,000 years</span><span class="door-d">When each ancestral stream joined the population you descend from.</span><span class="door-go">River of ancestry →</span></button>
        <button class="door" data-go="traits"><span class="door-k">Body</span><span class="door-v">${A.traits.filter((t) => t.status === "ok").length} traits · ${A.pgx.summary.length} drug genes</span><span class="door-d">Pigmentation, diet and drug response, each with its own evidence grade.</span><span class="door-go">Traits →</span></button>
      </div>

      <h2>Seven rings of identity</h2>
      <div class="rings-wrap">
        <div>${ringsSvg()}</div>
        <div class="ring-detail" id="ring-detail">
          <div class="eyebrow">How far DNA reaches</div>
          <p class="muted" style="font-size:15px">"Ancestry" means at least seven different things. Your DNA shines brightly on the inner rings and fades toward the outer ones. Hover or tap a ring.</p>
          <div class="ring-list">${RINGS.map((g) => `<button class="ring-row" data-ring="${g.key}"><span class="reach"><i style="width:${Math.max(g.reach * 100, 3)}%"></i></span><span>${esc(A.knowledge.identity_layers.find((l) => l.key === g.key).name)}</span><span class="faint">${g.verdict}</span></button>`).join("")}</div>
          <div id="ring-text" class="ring-text"></div>
        </div>
      </div>

      <h2>What stands out</h2>
      <div class="panel">${F.slice(0, 3).map((f, i) => `<div class="finding" data-tier="${f.tier}"><div class="rank">${["i", "ii", "iii"][i]}</div><div><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p></div><div>${tier(f.tier, false)}</div></div>`).join("")}
        <button class="link" data-go="findings" style="margin-top:12px">All ${F.length} ranked findings →</button></div>

      <h2>The whole genome, at a glance</h2>
      <div class="panel"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px"><span class="muted">Heterozygosity per 2 Mb; click any chromosome.</span><button class="link" data-go="chromosomes">Chromosome explorer →</button></div>
        ${karyoLegend()}${karyogram({ rowH: 11, gap: 7 })}</div>
      <div class="notice"><strong>Educational genomic analysis, not a clinical diagnosis.</strong> A consumer array reads well under 0.1% of your genome. "Not detected" never means "not present".</div>`;
    el.querySelectorAll(".karyo-row").forEach((r) => r.addEventListener("click", () => go("chromosomes", r.dataset.ch)));
    const showRing = (key) => {
      const g = RINGS.find((x) => x.key === key), l = A.knowledge.identity_layers.find((x) => x.key === key);
      el.querySelectorAll("[data-ring]").forEach((n) => n.classList.toggle("on", n.dataset.ring === key));
      $("#ring-text", el).innerHTML = `<h3 class="serif">${esc(l.name)}</h3><p class="muted">${esc(l.what)}</p><p><b>DNA speaks: ${esc(g.verdict)}.</b> ${esc(g.extra)}</p><p class="you">${esc(l.you)}</p>`;
    };
    el.querySelectorAll("[data-ring]").forEach((n) => { n.addEventListener("mouseenter", () => showRing(n.dataset.ring)); n.addEventListener("click", () => showRing(n.dataset.ring)); });
    showRing("genetic");
  };

  /* ---------- River of ancestry ---------- */
  RENDER.river = (el) => {
    const R = Object.fromEntries(A.ancestry.illustrative_ranges.map((r) => [r.stream, r]));
    const ERAS = [["10,000 BCE", -10000], ["3000 BCE", -3000], ["1500 BCE", -1500], ["300 BCE", -300], ["AD 600", 600], ["AD 1500", 1500], ["Today", 2000]];
    const S = [
      { k: "east", join: 4, origin: "Eastern steppe, Mongolia & Siberia", event: "Turkic & Mongol eras",
        why: "Enters largely with Turkic and later Mongol-era movements (AD 600 onward). Services disagree most here: 23andMe 0.1% separately, AncestryDNA 7%, IllustrativeDNA 14.6–23%." },
      { k: "steppe", join: 2, origin: "Western steppe herders (Sintashta / Andronovo-related)", event: "Steppe arrival",
        why: "Western Steppe Herder ancestry spread south around 1800–1500 BCE; it is linked to the spread of Indo-Iranian languages. IllustrativeDNA's 'Sarmatian' and 'Magyar' components are later carriers of it." },
      { k: "oasis", join: 1, origin: "Oasis towns: BMAC → Sogdiana, Khwarazm", event: "Oasis civilisations",
        why: "The settled Iranian-speaking populations of Transoxiana. They are already a blend (mostly Iranian-farmer-related, with steppe input after ~1800 BCE), so this stream overlaps with the others." },
      { k: "iranian", join: 0, origin: "Iranian-plateau farmers & foragers", event: "",
        why: "The oldest backbone of southern Central Asia: Zagros/Iranian-Neolithic-related ancestry. 23andMe 'Iranian, Caucasian & Mesopotamian' 24.6%, AncestryDNA 'Iran/Persia' 49%." },
      { k: "south", join: 1, origin: "Indus periphery / Swat Valley", event: "Indus contacts",
        why: "A South-Asian-related signal, modelled by IllustrativeDNA with Iron-Age Swat Valley samples. It sits on the Iranian-to-South-Asian cline, so it is not evidence of recent South Asian ancestors." },
    ];
    S.forEach((x) => { const r = R[x.k]; x.lo = r.range[0]; x.hi = r.range[1]; x.mid = (x.lo + x.hi) / 2; });
    const tot = S.reduce((a, x) => a + x.mid, 0); S.forEach((x) => (x.w = (x.mid / tot) * 100));
    const W = 1160, H = 560, x0 = 200, x1 = 920, unit = 3.2, GAP_SEP = 38, GAP_JOIN = 3;
    const X = ERAS.map((_, i) => x0 + ((x1 - x0) * i) / (ERAS.length - 1));
    // vertical layout per era column
    const cols = ERAS.map((_, i) => {
      let y = 0; const pos = {};
      S.forEach((x, j) => { if (j) y += S[j - 1].join <= i && x.join <= i ? GAP_JOIN : GAP_SEP; pos[x.k] = [y, y + x.w * unit]; y += x.w * unit; });
      const off = H / 2 - 20 - y / 2; Object.values(pos).forEach((p) => { p[0] += off; p[1] += off; }); return pos;
    });
    const edge = (k, side) => { let d = ""; X.forEach((xx, i) => { const y = cols[i][k][side]; if (!i) d += `M${xx},${y}`; else { const px = X[i - 1], py = cols[i - 1][k][side], m = (px + xx) / 2; d += ` C${m},${py} ${m},${y} ${xx},${y}`; } }); return d; };
    const rev = (k) => { let d = ""; for (let i = X.length - 1; i >= 0; i--) { const y = cols[i][k][1]; if (i === X.length - 1) d += ` L${X[i]},${y}`; else { const nx = X[i + 1], ny = cols[i + 1][k][1], m = (nx + X[i]) / 2; d += ` C${m},${ny} ${m},${y} ${X[i]},${y}`; } } return d; };
    let s = `<svg class="chart river" viewBox="0 0 ${W} ${H}" role="img" aria-label="River of ancestry: five streams converging over time">
      <defs>${S.map((x) => `<linearGradient id="g-${x.k}" x1="0" x2="1"><stop offset="0" stop-color="var(--s-${x.k})" stop-opacity=".18"/><stop offset="${(X[x.join] - 0) / W}" stop-color="var(--s-${x.k})" stop-opacity=".55"/><stop offset="1" stop-color="var(--s-${x.k})" stop-opacity=".95"/></linearGradient>`).join("")}</defs>`;
    X.forEach((xx, i) => { s += `<line x1="${xx}" x2="${xx}" y1="30" y2="${H - 44}" stroke="var(--rule)" stroke-dasharray="${i === X.length - 1 ? "0" : "2 4"}"/><text x="${xx}" y="${H - 22}" text-anchor="middle" class="era">${ERAS[i][0]}</text>`; });
    s += `<g class="river-flow">`;
    S.forEach((x) => {
      const tip = esc(tt(A.ancestry.streams[x.k].name, [["share today (IllustrativeDNA)", `${fmt(x.lo, 1)}–${fmt(x.hi, 1)}%`], ["joins the region", ERAS[x.join][0] === "10,000 BCE" ? "already present" : "≈ " + ERAS[x.join][0]]]) + `<div style="margin-top:6px;color:var(--ink-2)">${esc(x.why)}</div>`);
      s += `<path class="stream" data-k="${x.k}" d="${edge(x.k, 0)}${rev(x.k)} Z" fill="url(#g-${x.k})" stroke="var(--s-${x.k})" stroke-width=".8" stroke-opacity=".6" data-tip="${tip}"/>`;
    });
    s += `</g>`;
    // join events
    S.filter((x) => x.join > 0).forEach((x) => {
      const i = x.join, y = (cols[i][x.k][0] + cols[i][x.k][1]) / 2;
      s += `<circle cx="${X[i]}" cy="${y}" r="4.5" fill="var(--brass)" stroke="var(--surface)" stroke-width="1.5"/><text x="${X[i] + 8}" y="${y - 8}" class="evt">${esc(x.event)}</text>`;
    });
    // left origins + right shares
    S.forEach((x) => {
      const yl = (cols[0][x.k][0] + cols[0][x.k][1]) / 2, yr = (cols[X.length - 1][x.k][0] + cols[X.length - 1][x.k][1]) / 2;
      s += `<text x="${x0 - 12}" y="${yl + 4}" text-anchor="end" class="origin">${esc(x.origin.split(":")[0].split(" (")[0])}</text>`;
      s += `<text x="${x1 + 16}" y="${yr - 2}" class="share-name">${esc(A.ancestry.streams[x.k].name)}</text><text x="${x1 + 16}" y="${yr + 15}" class="share-val">${fmt(x.lo, 1)}–${fmt(x.hi, 1)}%</text>`;
    });
    s += `<text x="${x1 + 16}" y="30" class="share-head">YOU TODAY</text></svg>`;

    el.innerHTML = `<div class="eyebrow">River of ancestry</div><h1>Five streams, converging into one genome</h1>
      <p class="lede">Read left to right. Each stream is ancestry you carry today. On the left the streams are apart, living in different places. They merge as each population entered the gene pool you descend from, and their width on the right is your share today.</p>
      <div class="panel river-panel">${s}
        <div class="legend">${S.map((x) => `<span><i style="background:var(--s-${x.k})"></i>${esc(A.ancestry.streams[x.k].name)}</span>`).join("")}<span><i style="background:var(--brass);border-radius:50%"></i>stream joins</span></div></div>
      <div class="grid-3">
        <div class="panel" data-tier="A"><h3>What is measured ${tier("A", false)}</h3><p class="muted" style="font-size:14px">The share ranges on the right are IllustrativeDNA's two ancient-proxy models of your genome, mapped onto shared streams (the mapping itself is Tier C).</p></div>
        <div class="panel" data-tier="C"><h3>What is literature ${tier("C", false)}</h3><p class="muted" style="font-size:14px">When each stream joined, and where it came from, are regional population histories from ancient-DNA studies (e.g. Narasimhan et al. 2019 <i>Science</i>). They have not been dated in your genome.</p></div>
        <div class="panel" data-tier="X"><h3>What it does not mean ${tier("X", false)}</h3><p class="muted" style="font-size:14px">A stream is not a people you "were". Steppe ancestry does not make you Sintashta, and East Eurasian ancestry does not make you Turkic. The rings on the Portrait page explain why.</p></div>
      </div>
      <h2>The streams, one by one</h2>
      <div class="grid-2">${S.map((x) => `<div class="panel stream-card" data-tier="C"><div style="display:flex;gap:12px;align-items:center"><i class="swatch" style="background:var(--s-${x.k})"></i><h3 style="margin:0">${esc(A.ancestry.streams[x.k].name)}</h3><span class="faint mono" style="margin-left:auto">${fmt(x.lo, 1)}–${fmt(x.hi, 1)}%</span></div><div class="faint" style="font-size:12.5px;margin:6px 0">${esc(x.origin)}</div><p class="muted" style="font-size:14px;margin:0">${esc(x.why)}</p></div>`).join("")}</div>`;
    el.querySelectorAll(".stream").forEach((p) => {
      p.addEventListener("mouseenter", () => el.querySelector(".river").classList.add("focus"));
      p.addEventListener("mouseleave", () => el.querySelector(".river").classList.remove("focus"));
    });
  };

  RENDER.findings = (el) => {
    el.innerHTML = `<div class="eyebrow">Automatically ranked</div><h1>What makes this genome interesting</h1>
      <p class="lede">Ranked by scientific confidence first (50%), then rarity (30%), then how much each finding explains (20%). No finding is promoted just for being dramatic.</p>
      <div class="panel">${A.findings.map((f, i) => `
        <div class="finding" data-tier="${f.tier}"><div class="rank">${i + 1}</div>
          <div><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p>${why([["Evidence tier", tier(f.tier)], ["Section", `<button class="link" data-go="${({ contradictions: "services", pgx: "health" })[f.section] || f.section}">Open ${esc(f.section)} →</button>`], ["Score", `${f.score} = 0.5×tier + 0.3×rarity(${f.rarity}) + 0.2×interest(${f.interest})`], ["Source", srcFile() + " and reported results"]])}</div>
          <div style="text-align:right">${tier(f.tier, false)}<div class="scorebar"><i style="width:${f.score * 100}%"></i></div></div></div>`).join("")}</div>`;
  };

  RENDER.time = (el) => {
    const streamOf = { deep: "var(--ink-3)", iranian: "var(--s-iranian)", south: "var(--s-south)", steppe: "var(--s-steppe)", oasis: "var(--s-oasis)", east: "var(--s-east)", composite: "var(--accent)" };
    el.innerHTML = `<div class="eyebrow">Ancestry through time</div><h1>Forty-five thousand years in nine moments</h1>
      <p class="lede">Each moment names populations your DNA is <em>related to</em>. Archaeological cultures are reference points, not proven ancestors. The chips under each moment show the evidence from your own data.</p>
      <div class="notice">Time-depth caution: 23andMe and AncestryDNA compare you with <strong>living</strong> people. IllustrativeDNA compares you with people who lived <strong>1–3 thousand years ago</strong>. Only the Y and mtDNA lines reach the deepest layers directly.</div>
      <div class="tl-cards">${A.knowledge.timeline.map((t) => `
        <div class="tl-card" data-tier="${t.tier}" style="--dot:${streamOf[t.stream] || "var(--accent)"}"><div class="when">${esc(t.label)}</div><div class="spine"></div>
          <div class="body"><h3>${esc(t.title)} ${tier(t.tier, false)}</h3><p class="muted" style="margin:0">${esc(t.text)}</p>
          <div>${t.evidence.map((e) => `<span class="chip ev">${esc(e)}</span>`).join("")}</div></div></div>`).join("")}</div>`;
  };

  RENDER.services = (el) => {
    const svc = A.ancestry.services;
    const rows = svc.map((s) => ({ label: s.service, sub: s.model, streams: s.streams }));
    el.innerHTML = `<div class="eyebrow">Contradictions are data</div><h1>Three services, one genome, different answers</h1>
      <p class="lede">Each service's labels are mapped onto shared "streams" so you can compare them. The hatched grey block is a service's own mixed Central Asian cluster, which cannot honestly be split.</p>
      <div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap"><h3>Ancestry by stream</h3>
        <div class="tabs" role="tablist"><button aria-selected="true" data-v="chart">Chart</button><button aria-selected="false" data-v="table">Table</button></div></div>
        ${streamLegend()}<div data-view="chart">${hbarStack(rows)}</div>
        <div data-view="table" class="hidden">${svc.map((s) => `<h3 style="margin-top:14px">${esc(s.service)} · ${esc(s.model)}</h3><table class="data"><tr><th>Service label</th><th>Stream</th><th>Source</th><th style="text-align:right">%</th></tr>${s.leaves.map((l) => `<tr><td>${esc(l.label)}</td><td>${esc(A.ancestry.streams[l.stream].name)}</td><td>${l.method === "screenshot" ? tier("A", false) + " screenshot" : tier("C", false) + " text summary only"}</td><td class="num">${fmt(l.value, 1)}</td></tr>`).join("")}</table>`).join("")}</div>
        ${why([["Service numbers", tier("A") + " read from screenshots of each service (every model sums to 100%)"], ["Stream mapping", tier("C") + " " + esc(A.ancestry.mapping_note)], ["Reconciliation", "All 37 values that also appear in your pasted text summary match the screenshots exactly."]])}
      </div>
      <h2>Where they disagree, and why</h2>
      ${A.ancestry.disagreements.map((d) => `<div class="panel" data-tier="${d.tier}"><div style="display:flex;justify-content:space-between;gap:10px"><h3>${esc(d.topic)}</h3>${tier(d.tier)}</div>${dotRow(d.values.map((x) => [...x]), Math.max(50, ...d.values.map((x) => x[1])) > 50 ? 60 : 50, { step: 10 })}<p class="muted" style="font-size:14px">${esc(d.explanation)}</p></div>`).join("")}
      <h2>What stays stable across IllustrativeDNA's two models</h2>
      <div class="panel">${rangeChart(A.ancestry.illustrative_ranges)}<p class="muted" style="font-size:14px">Model 2 has a reported genetic fit of 1.591 ("very close"); model 1's fit value isn't visible in your screenshots. Narrow ranges are robust signals. Wide ranges mean the model is trading related proxy populations against each other.</p></div>
      <h2>Why services differ</h2>
      <div class="grid-3">${A.knowledge.why_differ.map(([h, t]) => `<div class="panel"><h3>${esc(h)}</h3><p class="muted" style="font-size:14px;margin:0">${esc(t)}</p></div>`).join("")}</div>
      <div class="panel"><h3>A correction to earlier AI summaries ${tier("X")}</h3><p class="muted" style="font-size:14px">An earlier Gemini summary of these same screenshots left out IllustrativeDNA's <b>Magyar 9.6%</b> component. It also treated 23andMe's category as including South Asian ancestry, which 23andMe reports as 0%. The atlas uses the primary screenshots only.</p></div>`;
    el.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
      el.querySelectorAll("[data-view]").forEach((v) => v.classList.toggle("hidden", v.dataset.view !== b.dataset.v));
    }));
  };
  function rangeChart(ranges) {
    const W = 1000, lab = 260, rowH = 34, H = ranges.length * rowH + 30, max = 60, X = (v) => lab + ((W - lab - 20) * v) / max;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Range of each stream across IllustrativeDNA models">`;
    for (let t = 0; t <= max; t += 10) s += `<g class="grid"><line x1="${X(t)}" x2="${X(t)}" y1="0" y2="${H - 22}"/></g><text x="${X(t)}" y="${H - 6}" text-anchor="middle">${t}%</text>`;
    ranges.forEach((r, i) => {
      const y = i * rowH + 16, [a, b] = r.range;
      s += `<text x="0" y="${y + 4}" class="lbl-strong">${esc(A.ancestry.streams[r.stream].name)}</text>`;
      s += `<line x1="${X(a)}" x2="${X(b)}" y1="${y}" y2="${y}" stroke="var(--s-${r.stream})" stroke-width="6" stroke-linecap="round" opacity=".45"/>`;
      [["M1", r.model1], ["M2", r.model2]].forEach(([m, v]) => {
        s += `<circle cx="${X(v)}" cy="${y}" r="7" fill="var(--s-${r.stream})" stroke="var(--surface)" stroke-width="2" data-tip="${esc(tt(A.ancestry.streams[r.stream].name, [["model " + m.slice(1), fmt(v, 1) + "%"]]))}"/>`;
        s += `<text x="${X(v)}" y="${y - 11}" text-anchor="middle" style="font-size:10px">${m}</text>`;
      });
    });
    return s + `</svg>`;
  }

  RENDER.tajik = (el) => {
    const d = A.reported.distances, P = A.knowledge.places, BM = window.BASEMAP;
    el.innerHTML = `<div class="eyebrow">Central Asia deep-dive</div><h1>Closest to Tajiks, but "close" is not "descended from"</h1>
      <p class="lede">Genetic distance measures how similar your whole-genome profile is to the average of a reference group. A small distance is consistent with shared ancestry, but it cannot tell apart descent from a group and mixture from its neighbours.</p>
      <div class="panel flush"><div style="padding:18px 22px 0;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><h3>Reference populations on the map</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="tabs" data-g="set"><button aria-selected="true" data-set="modern">Modern</button><button aria-selected="false" data-set="ancient">Ancient</button><button aria-selected="false" data-set="both">Both</button></div>
        <div class="tabs" data-g="zoom"><button aria-selected="true" data-zoom="focus">Central Asia</button><button aria-selected="false" data-zoom="wide">Wide</button></div></div></div>
        <div id="map-wrap" style="padding:0 8px 8px"></div>
        <div class="legend" style="padding:0 22px 16px"><span><svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="var(--accent)"/></svg>modern reference (bigger = closer)</span><span><svg width="12" height="12"><path d="M6,0 L12,6 L6,12 L0,6Z" fill="var(--s-oasis)"/></svg>ancient reference</span><span><svg width="12" height="12"><path d="M6,0 L7.8,4.2 L12,4.6 L8.8,7.4 L9.8,12 L6,9.6 L2.2,12 L3.2,7.4 L0,4.6 L4.2,4.2Z" fill="var(--ink)"/></svg>family-reported / 23andMe location</span><span class="faint">Locations are approximate centroids.</span></div></div>
      <div class="grid-2">
        <div class="panel"><h3>Closest modern populations</h3>${lollipop(d.filter((x) => x.set === "modern"))}</div>
        <div class="panel"><h3>Closest ancient populations</h3>${lollipop(d.filter((x) => x.set === "ancient"))}</div>
      </div>
      <div class="panel"><h3>Reading the list ${tier("A")} ${tier("C")}</h3><ul class="clean">
        <li><b>5 of your 8 closest modern references are Tajik groups:</b> general Tajik, Hisor, Ayni, Afghanistan and Kulob. The values are service output (Tier A). What they mean is interpretation (Tier C).</li>
        <li><b>Uzbeks of Afghanistan (3.977) sit between Tajik subgroups.</b> Afghan Uzbeks are known to carry substantial Iranian-related ancestry, which is a reminder that <em>language</em> (Turkic vs Persian) does not track genetic clusters neatly.</li>
        <li><b>Turkmen appear at #6 and #8.</b> This is consistent with the East Eurasian and steppe components the services detect.</li>
        <li><b>There is no Garm/Rasht reference in the visible list,</b> so your father's reported origin cannot be tested directly. Hisor, Ayni and Kulob are the nearest proxies.</li>
        <li><b>Pamiri (Ishkashim) at 5.712</b> (secondary text only) is <em>further</em> than most Tajik groups. Pamiris are often more Iranian-shifted and less East-Eurasian-admixed, which fits your intermediate profile.</li>
        <li><b>The closest ancient reference is a post-medieval Tian Shan nomad (3.906).</b> This late population is already mixed. Your profile is closer to people after the Turkic period than to any single Iron-Age group.</li></ul>
        ${why([["Source", "IllustrativeDNA 'Closest Populations' screenshots (ranks 1–8). Ranks 9–10 come from your pasted text summary only."], ["Method", "IllustrativeDNA computes distances on G25-style PCA coordinates. The coordinates themselves were not available, so an independent PCA is not possible yet."], ["Limitation", "Distances depend on which reference samples a service holds. A population that is absent cannot appear."]])}</div>`;
    const state = { set: "modern", zoom: "focus" };
    const drawMap = () => { $("#map-wrap", el).innerHTML = mapSvg(state.set, state.zoom); bindTips($("#map-wrap", el)); };
    el.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
      b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === b));
      if (b.dataset.set) state.set = b.dataset.set; if (b.dataset.zoom) state.zoom = b.dataset.zoom; drawMap();
    }));
    drawMap();

    function mapSvg(set, zoom) {
      const B = BM.bounds, px = (lat, lon) => [((lon - B.lon0) / (B.lon1 - B.lon0)) * BM.width, ((B.lat1 - lat) / (B.lat1 - B.lat0)) * BM.height];
      const [vx0, vy0] = zoom === "focus" ? px(46, 53) : [0, 0], [vx1, vy1] = zoom === "focus" ? px(31, 83) : [BM.width, BM.height];
      const k = (vx1 - vx0) / BM.width; // scale factor so marks keep screen size
      let s = `<svg class="chart" viewBox="${vx0} ${vy0} ${vx1 - vx0} ${vy1 - vy0}" role="img" aria-label="Map of Central Asia with reference populations"><rect x="${vx0}" y="${vy0}" width="${vx1 - vx0}" height="${vy1 - vy0}" fill="var(--surface)"/>`;
      s += BM.countries.map((c) => `<path d="${c.d}" fill="var(--surface-2)" stroke="var(--rule)" stroke-width="${0.8 * k}"/>`).join("");
      const lbls = [["TAJIKISTAN", 37.9, 72.9], ["UZBEKISTAN", 41.6, 63.6], ["TURKMENISTAN", 39.2, 59.2], ["AFGHANISTAN", 33.6, 65.8], ["IRAN", 32.6, 54.5], ["KAZAKHSTAN", 48.2, 67.5], ["KYRGYZSTAN", 41.6, 74.6], ["PAKISTAN", 29.5, 69.4], ["CHINA", 38.5, 88.0], ["INDIA", 23.5, 78.5]];
      s += lbls.map(([n, la, lo]) => { const [x, y] = px(la, lo); return `<text x="${x}" y="${y}" text-anchor="middle" style="font-size:${10 * k}px;letter-spacing:.18em;fill:var(--ink-3)">${n}</text>`; }).join("");
      const pts = [];
      if (set !== "ancient") d.filter((x) => x.set === "modern").forEach((x) => pts.push({ ...x, kind: "modern" }));
      if (set !== "modern") d.filter((x) => x.set === "ancient").forEach((x) => pts.push({ ...x, kind: "ancient" }));
      pts.sort((a, b) => b.distance - a.distance).forEach((x) => {
        const ll = P[x.kind][x.population]; if (!ll) return;
        const [cx, cy] = px(ll[0], ll[1]), r = k * (4 + 12 * Math.max(0, (9 - x.distance) / 6.5));
        const t = esc(tt(x.population, [["distance", x.distance], ["rank", "#" + x.rank + " " + x.kind], ["source", x.method === "screenshot" ? "screenshot" : "text summary only"]]));
        if (x.kind === "modern") s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--accent)" fill-opacity=".55" stroke="var(--surface)" stroke-width="${1.5 * k}" data-tip="${t}"/>`;
        else s += `<path d="M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy}Z" fill="var(--s-oasis)" fill-opacity=".6" stroke="var(--surface)" stroke-width="${1.5 * k}" data-tip="${t}"/>`;
        if (x.rank === 1) s += `<text x="${cx - r - 5 * k}" y="${cy + r + 12 * k}" text-anchor="end" class="lbl-strong" style="font-size:${13 * k}px;paint-order:stroke;stroke:var(--surface);stroke-width:${3 * k}px">#1 ${esc(x.population)} · ${x.distance}</text>`;
      });
      Object.entries(P.family).forEach(([n, ll]) => {
        const [cx, cy] = px(ll[0], ll[1]);
        s += `<path transform="translate(${cx - 7 * k},${cy - 7 * k}) scale(${1.2 * k})" d="M6,0 L7.8,4.2 L12,4.6 L8.8,7.4 L9.8,12 L6,9.6 L2.2,12 L3.2,7.4 L0,4.6 L4.2,4.2Z" fill="var(--ink)" stroke="var(--surface)" stroke-width="0.8" data-tip="${esc(tt(n, [["evidence", n.includes("23andMe") ? "23andMe recent-ancestry location (Tier A)" : "family report (Tier X)"]]))}"/>`;
      });
      return s + `</svg>`;
    }
  };
  function lollipop(rows) {
    const W = 520, lab = 250, rowH = 26, H = rows.length * rowH + 28, max = 10, X = (v) => lab + ((W - lab - 30) * v) / max;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
    for (let t = 0; t <= max; t += 2) s += `<g class="grid"><line x1="${X(t)}" x2="${X(t)}" y1="0" y2="${H - 22}"/></g><text x="${X(t)}" y="${H - 6}" text-anchor="middle">${t}</text>`;
    rows.forEach((r, i) => {
      const y = i * rowH + 13, sec = r.method !== "screenshot";
      s += `<text x="0" y="${y + 4}" ${i === 0 ? 'class="lbl-strong"' : ""}>${r.rank}. ${esc(r.population)}${sec ? " †" : ""}</text>`;
      s += `<line x1="${X(0)}" x2="${X(r.distance)}" y1="${y}" y2="${y}" stroke="var(--accent)" stroke-width="2" opacity=".5"/>`;
      s += `<circle cx="${X(r.distance)}" cy="${y}" r="5.5" fill="${sec ? "var(--surface)" : "var(--accent)"}" stroke="var(--accent)" stroke-width="2" data-tip="${esc(tt(r.population, [["distance", r.distance], ["source", sec ? "text summary only (Tier C)" : "screenshot (Tier A)"]]))}"/>`;
      s += `<text x="${X(r.distance) + 10}" y="${y + 4}" class="mono">${r.distance}</text>`;
    });
    return s + `</svg><div class="faint" style="font-size:12px">Genetic distance (lower = more similar). † = from the text summary only, not verified on a screenshot.</div>`;
  }

  RENDER.identity = (el) => {
    el.innerHTML = `<div class="eyebrow">A central distinction</div><h1>Seven things people mean by "ancestry"</h1>
      <p class="lede">These overlap historically but are not synonyms. Most confusion in consumer genetics comes from sliding between them.</p>
      <div class="layers">${A.knowledge.identity_layers.map((l, i) => `<div class="layer"><div class="faint mono" style="font-size:11px">${String(i + 1).padStart(2, "0")}</div><h3>${esc(l.name)}</h3><div class="muted" style="font-size:14px">${esc(l.what)}</div><div class="you">${esc(l.you)}</div></div>`).join("")}</div>
      <div class="panel" style="margin-top:22px"><h3>Applied to one sentence</h3><p class="muted">"I am Tajik" can be a statement about ethnicity (identity), language (Tajik Persian), nationality (Tajikistan), genealogy (Tajik parents) or genetic affinity (closest to Tajik references). Your DNA speaks only to the last and, partially, to genealogy. It is consistent with the others but cannot prove or disprove them.</p></div>`;
  };

  RENDER.lineages = (el) => {
    const y = A.haplogroups.y, mt = A.haplogroups.mt, N = A.knowledge.lineage_notes;
    const byHg = {};
    const CHAIN = ["CT", "CF", "C", "C1", "C1b", "C1b1a", "C1b1a1a"];
    (y.derived || []).forEach((s) => { const [hg, snp] = s.split(" : "); if (CHAIN.includes(hg)) (byHg[hg] = byHg[hg] || []).push(snp); });
    const chain = CHAIN.filter((h) => byHg[h]);
    const ancOf = (h) => (y.ancestral || []).filter((s) => s.startsWith(h + " :")).map((s) => s.split(" : ")[1]);
    el.innerHTML = `<div class="eyebrow">Two single threads through thousands of ancestors</div><h1>Paternal ${esc(y.yhaplo_ycc || "")} · Maternal ${esc(mt.reported)}</h1>
      <p class="lede">${esc(N.y.caveat)}</p>
      <div class="grid-2">
        <div class="panel"><div style="display:flex;justify-content:space-between"><h3>Y chromosome — father's father's line</h3>${tier("A")}</div>
          <p class="muted" style="font-size:14px">${esc(N.y.summary)}</p>
          <div class="tree">${chain.map((h) => `<div class="node"><div class="dot">✓</div><div><div class="name">${esc(h)}${h === "C1b1a1a" ? ` <span class="chip">= ${esc(y.yhaplo_23andme_label)} · your branch</span>` : ""}</div><div class="snps">derived: ${esc(byHg[h].join(", "))}</div></div></div>`).join("")}
            <div class="node off"><div class="dot">✗</div><div><div class="name">C2 (M217) → C-P39 "Native American", C-M48 "Genghis cluster"</div><div class="snps">ancestral at ${esc(ancOf("C2").join(", ") || "M217")}: <b>not your branch</b></div></div></div>
            <div class="node off"><div class="dot">·</div><div><div class="name">C1b1a1a1 and below</div><div class="snps">ancestral at ${esc(ancOf("C1b1a1a1").join(", "))}: branch ends here at array resolution</div></div></div></div>
          ${why([["Method", esc(y.tool) + ` · ${fmt(y.y_markers_used)} Y calls`], ["Agreement", `yhaplo label <b>${esc(y.yhaplo_23andme_label)}</b> = your 23andMe report (C-P92)`], ["Phylogeny", N.y.phylogeny.map(esc).join("<br>")], ["Geography " + tier("C", false), esc(N.y.geography)], ["Correction", esc(N.y.correction)], ["To go deeper", "A Y-sequencing test (e.g. FTDNA Big Y) would resolve branches below C1b1a1a and give time estimates."]])}</div>
        <div class="panel"><div style="display:flex;justify-content:space-between"><h3>mtDNA — mother's mother's line</h3>${tier("A")}</div>
          <p class="muted" style="font-size:14px">${esc(N.mt.summary)}</p>
          <div class="tree">${mt.path.map((s) => `<div class="node"><div class="dot">${s.support ? "✓" : "?"}</div><div><div class="name">${esc(s.node)} <span class="faint" style="font-weight:400">· ${s.support} derived, ${s.against} against</span></div><div class="sites">${s.sites.map((x) => `<span class="site ${x.state.startsWith("derived") ? "ok" : x.state.startsWith("complement") ? "flip" : x.state.startsWith("ancestral") ? "bad" : "no"}" data-tip="${esc(tt("mt " + x.pos, [["expected (derived)", x.expected], ["observed", x.observed || "not on array"], ["state", x.state]]))}">${x.pos}${esc(x.expected)}</span>`).join("")}</div></div></div>`).join("")}</div>
          <div class="legend"><span class="site ok">derived</span><span class="site flip">opposite-strand read</span><span class="site no">not on array</span></div>
          ${why([["Method", `Your ${fmt(mt.mt_markers)} mtDNA calls checked against PhyloTree diagnostic positions (rCRS).`], ["Non-H confirmation", mt.non_h_evidence.map((x) => `${x.pos}${x.expected}: ${esc(x.observed)}`).join(" · ")], ["Strand note", "Positions 12633 and 15452 read T where A is expected. Both are C→A mutations, so the probe most likely reports the opposite strand. They are shown but not counted."], ["Geography " + tier("C", false), esc(N.mt.geography)]])}</div>
      </div>`;
  };

  RENDER.parents = (el) => {
    el.innerHTML = `<div class="eyebrow">Parental origin</div><h1>What can honestly be assigned to each parent</h1>
      <p class="lede">Your raw file is <em>unphased</em>: at each heterozygous site it says "A and G" but not which letter came from which parent. So most parental assignments are impossible from this file alone.</p>
      <table class="data panel" style="display:table">
        <tr><th>Evidence</th><th>Assignment</th><th>Status</th><th>Why</th></tr>
        <tr><td>Y chromosome (C1b1a1a)</td><td>Paternal</td><td><b>Confirmed</b> ${tier("A", false)}</td><td>Only fathers pass on a Y chromosome.</td></tr>
        <tr><td>mtDNA (T1)</td><td>Maternal</td><td><b>Confirmed</b> ${tier("A", false)}</td><td>mtDNA is inherited from the mother.</td></tr>
        <tr><td>X chromosome (all ${fmt(A.qc.per_chromosome.X.markers)} X markers)</td><td>Maternal</td><td><b>Confirmed</b> ${tier("A", false)}</td><td>You are XY (verified): your single X came from your mother. X heterozygosity is 0 outside the regions X shares with Y.</td></tr>
        <tr><td>Any autosomal SNP or segment</td><td>—</td><td><b>Unresolved</b></td><td>Needs a parent's DNA, a phased relative match, or 23andMe's Parental Inheritance report.</td></tr>
        <tr><td>"Turkic from mother, Iranic from father"</td><td>—</td><td><b>Unresolved</b> ${tier("X", false)}</td><td>Earlier AI chats suggested this from geography alone. Population frequency and stereotype are not evidence of parental origin.</td></tr>
      </table>
      <div class="grid-2">
        <div class="panel"><h3>A defensible test you can run: X-DNA with Claire</h3><p class="muted" style="font-size:14px">Because your whole X is maternal, if Claire is your <b>maternal</b> half-sister you should share X-DNA segments with her. If you share only a father, you should share essentially none. 23andMe's DNA Relatives → "DNA comparison" shows X segments. A screenshot of it turns a family report into genetic evidence.</p></div>
        <div class="panel"><h3>23andMe Parental Inheritance</h3><p class="muted" style="font-size:14px">Your inbox shows 23andMe now offers a report that phases your ancestry into two parental sets without testing a parent. It is the strongest parental-origin evidence available short of testing a parent. If you add a screenshot, the atlas will show it here as a separate, clearly labelled evidence source.</p></div>
      </div>
      <div class="panel"><h3>Family context on record ${tier("X")}</h3><ul class="clean">${A.reported.self_reported.map((c) => `<li>${esc(c.claim)} <span class="faint">(${esc(c.src)})</span></li>`).join("")}</ul></div>`;
  };

  RENDER.chromosomes = (el, arg) => {
    const sel = arg || "1";
    el.innerHTML = `<div class="eyebrow">Chromosome explorer</div><h1>Walk the genome</h1>
      <p class="lede">Each row is a chromosome drawn to scale. Colour shows how heterozygous you are in each 2 Mb window. Red bars mark runs of homozygosity, and black markers are annotated variants. Click a chromosome to open it.</p>
      <div class="panel">${karyoLegend()}<div id="karyo">${karyogram()}</div></div>
      <div class="panel" id="chrom-detail"></div>
      <div class="panel"><h3>Runs of homozygosity ${tier(A.roh.summary.tier)}</h3>
        <p class="muted" style="font-size:14px">${A.roh.summary.segments} segments, ${A.roh.summary.total_mb} Mb in total (F<sub>ROH</sub> ${A.roh.summary.froh}); longest ${A.roh.summary.longest_mb} Mb. <b>No run exceeds 5 Mb</b>, so there is no genomic signal of close parental relatedness. Several short runs sit next to centromeres (chr1, 5, 10, 11, 16), where low recombination makes such runs common in everyone.</p>
        ${why([["Method", esc(A.roh.summary.method)], ["Interpretation", "Long runs (>5–10 Mb) indicate a recent common ancestor of your two parents. Short runs reflect older population history."], ["Limitation", "Array spacing (~5 kb) and genotyping errors limit sensitivity below ~1.5 Mb."]])}</div>`;
    el.querySelectorAll(".karyo-row").forEach((r) => r.addEventListener("click", () => detail(r.dataset.ch)));
    detail(sel);
    function detail(ch) {
      el.querySelectorAll(".karyo-row").forEach((r) => r.classList.toggle("sel", r.dataset.ch === ch));
      const L = A.chromosomes[ch].length, bins = hetBins(ch), W = 1000, H = 250, top = 30, ph = 150, X = (p) => 40 + ((W - 60) * p) / L;
      const isSex = ch === "X" || ch === "Y";
      const q = A.qc.per_chromosome[ch] || {};
      const maxAll = Math.max(...bins.map((b) => b.all), 1);
      const Y = (v) => top + ph - (isSex ? v / maxAll : v / 0.4) * ph;
      let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Chromosome ${ch} detail">`;
      [0, 0.1, 0.2, 0.3, 0.4].forEach((t) => { if (!isSex) s += `<g class="grid"><line x1="40" x2="${W - 20}" y1="${Y(t)}" y2="${Y(t)}"/></g><text x="34" y="${Y(t) + 4}" text-anchor="end">${t * 100}%</text>`; });
      A.roh.segments.filter((g) => g.chrom === ch).forEach((g) => { s += `<rect x="${X(g.start)}" y="${top}" width="${Math.max(X(g.end) - X(g.start), 2)}" height="${ph}" fill="var(--roh)" opacity=".13"/>`; });
      let d = "", pen = false;
      bins.forEach((b) => {
        const v = isSex ? b.all : b.rate;
        if (v == null) { pen = false; return; }
        d += (pen ? "L" : "M") + X(b.i * A.bins.size + A.bins.size / 2).toFixed(1) + "," + Y(v).toFixed(1); pen = true;
      });
      s += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
      bins.forEach((b) => { const x0 = X(b.i * A.bins.size), x1 = X(Math.min((b.i + 1) * A.bins.size, L)); s += `<rect x="${x0}" y="${top}" width="${Math.max(x1 - x0, 1)}" height="${ph + 40}" fill="transparent" data-tip="${esc(tt(`chr${ch}:${b.i * 2}–${b.i * 2 + 2} Mb`, isSex ? [["markers", fmt(b.all)]] : [["SNVs called", fmt(b.m)], ["heterozygosity", b.rate == null ? "n/a" : pct(b.rate)]]))}"/>`; });
      const cy = top + ph + 22;
      s += `<rect x="40" y="${cy - 5}" width="${W - 60}" height="10" rx="5" fill="var(--surface-2)"/><circle cx="${X(A.chromosomes[ch].centromere)}" cy="${cy}" r="4" fill="var(--ink-3)"/>`;
      panelSites().filter((v) => v.chrom === ch).forEach((v) => {
        const x = X(v.pos);
        s += `<line x1="${x}" x2="${x}" y1="${cy - 12}" y2="${cy + 5}" stroke="var(--ink)" stroke-width="1.5"/><circle cx="${x}" cy="${cy - 14}" r="5" fill="var(--ink)" data-tip="${esc(tt(v.rsid + " · " + v.gene, [["genotype", v.genotype], ["what", v.trait || v.condition || v.star || ""], ["tier", v.tier]]))}"/>`;
      });
      for (let m = 0; m <= L; m += 25e6) s += `<text x="${X(m)}" y="${H - 4}" text-anchor="middle">${m / 1e6} Mb</text>`;
      s += `</svg>`;
      $("#chrom-detail", el).innerHTML = `<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><h3>Chromosome ${ch}</h3><span class="muted" style="font-size:13px">${fmt(q.markers || 0)} markers · ${pct((q.no_call || 0) / (q.markers || 1))} no-calls${isSex ? "" : " · " + pct((q.het || 0) / (q.snv_called || 1)) + " heterozygous"}</span></div>
        <div class="legend"><span><i style="background:var(--accent);height:2px"></i>${isSex ? "marker density" : "heterozygosity per 2 Mb"}</span><span><i style="background:var(--roh);opacity:.4"></i>run of homozygosity</span><span><i style="background:var(--ink);border-radius:50%"></i>annotated variant</span></div>${s}
        <div>${panelSites().filter((v) => v.chrom === ch).map((v) => `<span class="chip ev">${esc(v.rsid)} ${esc(v.gene)} ${esc(v.genotype)}</span>`).join("") || '<span class="faint">No annotated panel variants on this chromosome yet. Search any rsID in the Variant explorer.</span>'}</div>`;
      bindTips($("#chrom-detail", el));
    }
  };

  function gtHtml(v) {
    if (!v.genotype) return `<span class="faint">not tested</span>`;
    if (v.status !== "ok") return `<span class="gt">${esc(v.genotype)}</span> <span class="faint">${esc(v.status)}</span>`;
    return `<span class="gt">${[...v.genotype].map((c) => `<span class="${c === v.effect ? "e" : ""}">${c}</span>`).join("")}</span><span class="pips" title="${v.effect_count} of 2 copies of the ${v.effect} allele">${[0, 1].map((i) => `<i class="${i < v.effect_count ? "on" : ""}"></i>`).join("")}</span>`;
  }
  function variantWhy(v, extra = []) {
    return why([["Variant", `<span class="mono">${esc(v.rsid)}</span> · ${esc(v.gene)} · chr${esc(v.chrom)}:${fmt(v.pos || 0)} (${esc(A.meta.dataset.build)})`],
      ["Your genotype " + tier("A", false), `${esc(v.genotype)} — record #${fmt(v.provenance?.record || 0)} of ${srcFile()}`],
      ["Allele check", `expected alleles ${esc(v.effect)}/${esc(v.other)} (plus strand); observed alleles consistent${v.palindromic ? " · <b>palindromic site</b>: strand cannot be independently verified" : ""}`],
      ["Effect allele", `<b>${esc(v.effect)}</b>`], ...extra,
      ["Evidence for the link " + tier(v.tier, false), (v.refs || []).map(esc).join("<br>")],
      ["External (opens a website, sends only the rsID)", `<a href="https://www.ncbi.nlm.nih.gov/snp/${v.rsid}" target="_blank" rel="noopener noreferrer">dbSNP</a> · <a href="https://www.ncbi.nlm.nih.gov/clinvar/?term=${v.rsid}" target="_blank" rel="noopener noreferrer">ClinVar</a> · <a href="https://gnomad.broadinstitute.org/variant/${v.rsid}?dataset=gnomad_r2_1" target="_blank" rel="noopener noreferrer">gnomAD</a>`]]);
  }

  RENDER.traits = (el) => {
    const cats = [...new Set(A.traits.map((t) => t.category))];
    el.innerHTML = `<div class="eyebrow">Trait genetics</div><h1>Single variants with replicated effects</h1>
      <p class="lede">These are among the best-understood genotype–trait links. Even so, most traits are polygenic: one SNP shifts probabilities, it does not determine you. Highlighted letters are the effect allele, and the dots count your copies (0–2).</p>
      ${cats.map((c) => `<h2>${esc(c)}</h2><div class="grid-2">${A.traits.filter((t) => t.category === c).map((t) => `
        <div class="panel trait-card" data-tier="${t.tier}"><div class="top"><h3>${esc(t.trait)}</h3>${tier(t.tier, false)}</div><div class="gene">${esc(t.gene)} · ${esc(t.rsid)}</div>
          <div>${gtHtml(t)}</div><div class="muted" style="font-size:14px">${esc(t.reading || (t.genotype ? "" : "This marker is not on your array (or is a no-call)."))}</div>
          ${t.note ? `<div class="faint" style="font-size:13px">${esc(t.note)}</div>` : ""}${t.genotype && t.status === "ok" ? variantWhy(t) : ""}</div>`).join("")}</div>`).join("")}`;
  };

  RENDER.health = (el) => {
    const ap = A.health.apoe;
    el.innerHTML = `<div class="eyebrow">Health & pharmacogenomics · research mode</div><h1>Conservative, coverage-aware health genetics</h1>
      <div class="notice"><strong>This is educational genomic analysis, not a clinical diagnosis.</strong> Consumer arrays have high false-positive rates for rare variants and test only a small fraction of disease-relevant positions. Do not change any medication based on this page; discuss findings with a clinician or genetic counsellor.</div>
      <h2>Drug response (pharmacogenomics)</h2>
      <div class="panel flush"><table class="data"><tr><th>Gene</th><th>Inferred</th><th>Phenotype</th><th>Relevant to</th><th>Tier</th></tr>
        ${A.pgx.summary.map((p) => `<tr><td><b>${esc(p.gene)}</b></td><td class="mono">${esc(p.diplotype)}</td><td>${esc(p.phenotype)}<div class="faint" style="font-size:12px">${esc(p.caveat)}</div></td><td class="muted">${esc(p.drugs)}</td><td>${tier(p.tier, false)}</td></tr>`).join("")}
        ${A.pgx.not_assessable.map((p) => `<tr><td><b>${esc(p.gene)}</b></td><td class="faint">—</td><td colspan="3"><b>Insufficient data.</b> <span class="muted">${esc(p.reason)}</span></td></tr>`).join("")}</table></div>
      <details class="why panel"><summary>Show the ${A.pgx.sites.length} underlying genotypes</summary><table class="data" style="margin-top:10px"><tr><th>rsID</th><th>Gene · allele</th><th>Genotype</th><th>Function of effect allele</th></tr>${A.pgx.sites.map((s) => `<tr><td class="mono">${esc(s.rsid)}</td><td>${esc(s.gene)} ${esc(s.star)}</td><td>${gtHtml(s)}</td><td class="muted">${esc(s.function)}</td></tr>`).join("")}</table><p class="faint">Phenotypes follow CPIC allele-function conventions. Phase between two heterozygous sites is assumed, not observed.</p></details>
      <h2>Variants with established disease associations</h2>
      <div class="grid-2">${A.health.sites.map((h) => `<div class="panel trait-card" data-tier="${h.tier}"><div class="top"><h3>${esc(h.condition)}</h3>${tier(h.tier, false)}</div><div class="gene">${esc(h.gene)} ${esc(h.variant)} · ${esc(h.rsid)}</div><div>${gtHtml(h)}</div>
          <div class="muted" style="font-size:14px">${esc(h.reading || "Not tested under this rsID on your array; absence of data is not absence of risk.")}</div>
          <div class="faint" style="font-size:12.5px">Inheritance: ${esc(h.inheritance)} · ClinVar-type classification: ${esc(h.clinvar)}</div>${h.genotype && h.status === "ok" ? variantWhy(h, [["Wording", "“Associated with”, never “you will develop”."]]) : ""}</div>`).join("")}</div>
      <h2>APOE</h2>
      <div class="panel"><p class="muted" style="font-size:14px">${esc(ap.note || "")}</p>
        <button class="reveal-btn" id="apoe-btn">I understand. Show my APOE result</button>
        <div id="apoe" class="hidden" style="margin-top:14px"><div class="gt">${esc(ap.genotype || ap.status)}</div><p class="muted" style="font-size:14px">rs429358 ${esc(ap.rs429358)} · rs7412 ${esc(ap.rs7412)} ${tier(ap.tier)}. ε3/ε3 is the most common genotype worldwide and is considered the population-average reference for Alzheimer's risk.</p></div></div>
      <h2>What was NOT assessed</h2><div class="panel"><ul class="clean">${A.health.not_assessed.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    $("#apoe-btn", el).addEventListener("click", (e) => { $("#apoe", el).classList.remove("hidden"); e.target.remove(); });
  };

  RENDER.explorer = (el) => {
    const idx = [];
    [...A.traits.map((v) => ({ ...v, what: v.trait })), ...A.pgx.sites.map((v) => ({ ...v, what: v.gene + " " + v.star + " — " + v.function })), ...A.health.sites.map((v) => ({ ...v, what: v.condition }))].forEach((v) => idx.push(v));
    el.innerHTML = `<div class="eyebrow">Your personal genome encyclopedia</div><h1>Variant explorer</h1>
      <p class="lede">Search annotated variants by rsID, gene, trait or condition.${window.GENOME_GZ ? " The full-genome build can also look up any of your " + fmt(A.qc.markers) + " markers by rsID or chr:position." : " Open <span class='mono'>atlas_full.html</span> to look up any of your markers by rsID."}</p>
      <input class="search" id="q" placeholder="e.g. rs12913832, HERC2, lactase, warfarin, 15:28365618" autocomplete="off"/>
      <div id="res" style="margin-top:14px"></div>`;
    let genome = null;
    async function loadGenome() {
      if (genome || !window.GENOME_GZ) return genome;
      const bin = Uint8Array.from(atob(window.GENOME_GZ), (c) => c.charCodeAt(0));
      const txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
      genome = new Map();
      const pos = new Map();
      for (const line of txt.split("\n")) { if (!line) continue; const [r, c, p, g] = line.split("\t"); genome.set(r, [c, p, g]); pos.set(c + ":" + p, r); }
      genome.byPos = pos; return genome;
    }
    const q = $("#q", el), res = $("#res", el);
    const render = async () => {
      const t = q.value.trim().toLowerCase();
      if (!t) { res.innerHTML = `<div class="faint">${idx.length} annotated variants. Try "eye", "CYP2C19" or "rs671".</div>`; return; }
      const hits = idx.filter((v) => [v.rsid, v.gene, v.what, v.category, v.condition].join(" ").toLowerCase().includes(t)).slice(0, 30);
      let html = hits.map((v) => `<div class="panel trait-card"><div class="top"><h3>${esc(v.what)}</h3>${tier(v.tier, false)}</div><div class="gene">${esc(v.gene)} · ${esc(v.rsid)} · chr${esc(v.chrom)}:${fmt(v.pos || 0)}</div><div>${gtHtml(v)}</div><div class="muted" style="font-size:14px">${esc(v.reading || "")}</div>${v.genotype && v.status === "ok" ? variantWhy(v) : ""}</div>`).join("");
      const g = await loadGenome();
      if (g) {
        const m = t.match(/^(?:chr)?(\w+):(\d+)$/);
        const r = m ? g.byPos.get(m[1].toUpperCase() + ":" + m[2]) : t;
        const rec = g.get(r);
        if (rec && !hits.some((h) => h.rsid === r)) html = `<div class="panel"><div class="top" style="display:flex;justify-content:space-between"><h3 class="mono">${esc(r)}</h3>${tier("A", false)}</div><div class="kv" style="margin-top:8px"><dt>Genotype</dt><dd class="gt">${esc(rec[2])}</dd><dt>Location</dt><dd>chr${esc(rec[0])}:${fmt(+rec[1])} (GRCh37)</dd><dt>Source</dt><dd>${srcFile()}</dd><dt>Annotation</dt><dd class="muted">Not in the curated panel. Genotype shown as reported (plus strand); no interpretation offered.</dd><dt>Look up</dt><dd><a href="https://www.ncbi.nlm.nih.gov/snp/${esc(r)}" target="_blank" rel="noopener noreferrer">dbSNP</a> · <a href="https://www.ncbi.nlm.nih.gov/clinvar/?term=${esc(r)}" target="_blank" rel="noopener noreferrer">ClinVar</a> <span class="faint">(sends only the rsID)</span></dd></div></div>` + html;
      }
      res.innerHTML = html || `<div class="faint">No match${window.GENOME_GZ ? "" : " in the annotated panel"}.</div>`;
      bindTips(res);
    };
    q.addEventListener("input", render); render();
  };

  RENDER.quality = (el) => {
    const q = A.qc, L = A.limitations;
    const rows = CH.concat(["MT"]).filter((c) => q.per_chromosome[c]);
    const W = 1000, H = 190, bw = (W - 60) / rows.length, maxNC = Math.max(...rows.map((c) => q.per_chromosome[c].no_call / q.per_chromosome[c].markers));
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="No-call rate per chromosome">`;
    const Y = (v) => 150 - (v / Math.max(maxNC, 0.05)) * 130;
    [0, 0.02, 0.04, 0.06, 0.08].filter((t) => t <= Math.max(maxNC, 0.05)).forEach((t) => { s += `<g class="grid"><line x1="44" x2="${W}" y1="${Y(t)}" y2="${Y(t)}"/></g><text x="38" y="${Y(t) + 4}" text-anchor="end">${t * 100}%</text>`; });
    rows.forEach((c, i) => { const p = q.per_chromosome[c], v = p.no_call / p.markers, x = 50 + i * bw; s += `<rect x="${x}" y="${Y(v)}" width="${bw - 4}" height="${150 - Y(v)}" rx="3" fill="var(--accent)" data-tip="${esc(tt("chr" + c, [["markers", fmt(p.markers)], ["no-calls", fmt(p.no_call) + " (" + pct(v) + ")"], ["heterozygous", p.snv_called ? pct(p.het / p.snv_called) : "haploid"]]))}"/><text x="${x + bw / 2 - 2}" y="168" text-anchor="middle">${c}</text>`; });
    s += `</svg>`;
    el.innerHTML = `<div class="eyebrow">Data quality</div><h1>What this data can and cannot tell you</h1>
      <div class="grid-2"><div class="panel"><h3>Can</h3><ul class="clean">${L.can.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="panel"><h3>Cannot</h3><ul class="clean">${L.cannot.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <div class="panel"><h3>No-call rate by chromosome</h3>${s}<p class="faint" style="font-size:12.5px">Genome-wide ${pct(q.no_call_rate, 2)}. The Y chromosome and mtDNA carry many deliberately assayed but uninformative probes, so higher no-call rates there are expected.</p></div>
      <div class="panel"><h3>File integrity & build</h3><dl class="kv">
        <dt>File</dt><dd>${srcFile()}</dd><dt>Vendor · chip</dt><dd>${esc(A.meta.dataset.vendor)} · ${esc(A.meta.dataset.chip)}</dd>
        <dt>Build</dt><dd>${esc(A.meta.dataset.build)}: ${A.meta.dataset.build_evidence.map(esc).join("; ")}</dd>
        <dt>Markers</dt><dd>${fmt(q.markers)} (${pct(q.completeness_vs_expected)} of the ~${fmt(q.expected_markers)} expected for this chip)</dd>
        <dt>Sex chromosomes</dt><dd>${esc(q.sex_chromosome_evidence.inference)}: ${fmt(q.sex_chromosome_evidence.y_called)} Y calls; X heterozygosity outside the X–Y shared regions ${q.sex_chromosome_evidence.x_heterozygosity_excl_PAR}</dd>
        <dt>Duplicate positions</dt><dd>${fmt(q.duplicate_positions)}: rsID and internal (i-) probes at the same coordinate, a normal feature of 23andMe files. Never merged silently.</dd>
        <dt>Cross-copy check</dt><dd>The earlier truncated Google Drive copy agrees with this file at 34,771 / 34,771 shared markers.</dd></dl></div>
      <div class="panel"><h3>Sources not yet available</h3><ul class="clean">${L.sources_not_available.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  };

  RENDER.method = (el) => {
    el.innerHTML = `<div class="eyebrow">Method & privacy</div><h1>How this atlas was made</h1>
      <div class="grid-2"><div class="panel"><h3>Privacy</h3><ul class="clean">
        <li>This page makes <b>no network requests</b>: no fonts, scripts, analytics or telemetry. Everything is inline.</li>
        <li>External links (dbSNP, ClinVar, gnomAD) only open when you click them, and they send only an rsID.</li>
        <li>Your genetic data is never committed to git. The repository contains code only.</li>
        <li>Your theme choice is stored in this browser's localStorage. Nothing else is stored.</li></ul></div>
      <div class="panel"><h3>Pipeline</h3><ol class="clean" style="padding-left:18px;color:var(--ink-2)">
        <li><span class="mono">data/raw</span> is never modified. Files are hashed (SHA-256).</li>
        <li>The parser verifies the build with anchor SNPs, detects truncation, and never merges incompatible coordinates.</li>
        <li>Curated variants are allele-checked. A mismatch is flagged, never interpreted.</li>
        <li>Y haplogroup: 23andMe's open-source <span class="mono">yhaplo</span>, run locally.</li>
        <li>Service results were transcribed from screenshots and reconciled with your text summary.</li>
        <li>Every claim is tagged A/B/C/D/X and kept separate.</li></ol></div></div>
      <div class="panel"><h3>Evidence tiers</h3><div class="tier-legend" style="flex-direction:column">${Object.entries(A.meta.tiers).map(([k, v]) => `<div>${tier(k)}<span>${esc(v.desc)}</span></div>`).join("")}</div></div>
      <div class="panel"><h3>Quality-control questions asked of every claim</h3><ol class="clean" style="padding-left:18px">
        ${["Is the genotype actually present?", "Was strand orientation checked?", "Is the genome build known?", "Is the association replicated?", "In which population was it studied?", "What is the effect size?", "Monogenic or polygenic?", "Correlation or causation?", "Direct evidence or inference?", "Could the array simply lack coverage?"].map((x) => `<li>${x}</li>`).join("")}</ol></div>`;
  };

  /* ---------------- boot ---------------- */
  buildNav(); theme(); lens();
  $("#main").innerHTML = `<header id="chapter-head"></header>` + CHAPTERS.flatMap((c) => c.subs).map(([id]) => `<section class="page" id="${id}"></section>`).join("");
  let start = "portrait";
  try { start = sessionStorage.getItem("atlas-view") || start; } catch {}
  go(start);
})();
