  /* =====================================================================
     GENOME ATLAS · instrument layer
     Shared claim substrate (A.claims), evidence inspector, command search,
     selection bus, coverage primitives, and the upgraded linked views.
     Concatenated after app.js inside the same scope (see build_site.py).
     ===================================================================== */
  const CL = A.claims || {};
  const ENT = A.entities || [];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmtNum = (n, d = 0) => (n == null ? "—" : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }));

  /* ---------- Level-3 entry point: evidence button ---------- */
  function ev(id, label = "Evidence") {
    const c = CL[id];
    if (!c) return "";
    return `<button class="ev" data-claim="${esc(id)}" aria-label="Inspect evidence for: ${esc(c.title)}" title="Inspect evidence"><b data-t="${c.tier}">${c.tier}</b><span>${esc(label)}</span></button>`;
  }
  const STRENGTH = {
    provenance: { raw_genotype: [4, "Direct genotype"], derived_raw: [3, "Computed from your genotypes"], vendor_result: [3, "Vendor-reported"], literature: [2, "Literature"], family_context: [1, "Family report"] },
    inference: { direct: [4, "No modelling"], validated: [3, "Validated method"], model_dependent: [2, "Model-dependent"], exploratory: [1, "Exploratory"] },
    coverage: { complete: [4, "Complete"], partial: [3, "Partial"], sparse: [2, "Sparse"], unavailable: [0, "Not assessable"] },
    transfer: { direct: [4, "Applies directly"], adjacent: [3, "Adjacent populations"], uncertain: [2, "Uncertain"], not_applicable: [4, "Not population-dependent"] },
  };
  const meter = (label, [v, text]) => `<div class="meter"><div class="m-lbl">${label}</div><div class="m-bar" role="img" aria-label="${label}: ${text}">${[1, 2, 3, 4].map((i) => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</div><div class="m-txt">${esc(text)}</div></div>`;
  function covBar(measured, required, unit = "") {
    if (measured == null || !required) return "";
    const f = Math.max(0, Math.min(1, measured / required));
    return `<div class="cov" role="img" aria-label="${measured} of ${required} ${unit}"><div class="cov-track"><i style="width:${Math.max(f * 100, f > 0 ? 1.5 : 0)}%"></i></div><span class="num">${fmtNum(measured)} / ${fmtNum(required)}</span>${unit ? `<span class="cov-unit">${esc(unit)}</span>` : ""}</div>`;
  }

  /* ---------- Evidence inspector (drawer / bottom sheet) ---------- */
  const drawer = document.createElement("aside");
  drawer.id = "inspector"; drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-modal", "true"); drawer.setAttribute("aria-labelledby", "insp-title"); drawer.hidden = true;
  const scrim = document.createElement("div"); scrim.id = "scrim"; scrim.hidden = true;
  document.body.append(scrim, drawer);
  let inspStack = [], inspReturn = null;
  function openClaim(id, trigger, push = true) {
    const c = CL[id]; if (!c) return;
    if (push) inspStack.push(id);
    if (trigger && !inspReturn) inspReturn = trigger;
    const P = c.provenance || {}, I = c.inference || {}, V = c.coverage || {}, T = c.populationTransferability || {}, U = c.uncertainty || {};
    const route = (c.route || "").split("/");
    drawer.innerHTML = `
      <div class="insp-head"><div class="insp-nav">${inspStack.length > 1 ? `<button class="insp-back" aria-label="Back">←</button>` : ""}<span class="eyebrow">${esc(c.category)} · evidence</span></div>
        <button class="insp-close" aria-label="Close evidence inspector">✕</button></div>
      <div class="insp-body">
        <h2 id="insp-title" class="insp-title">${esc(c.title)}</h2>
        <div class="insp-answer">${esc(c.answer)}</div>
        <div class="insp-tier">${tier(c.tier)}</div>
        <section><h4>What are we claiming?</h4><p>${esc(c.title)}: <b>${esc(c.answer)}</b>.</p></section>
        ${c.observed.length ? `<section><h4>What was directly observed</h4><table class="obs">${c.observed.map(([k, v]) => `<tr><th>${esc(k)}</th><td class="mono">${esc(v ?? "—")}</td></tr>`).join("")}</table></section>` : ""}
        ${c.transformation.length ? `<section><h4>How we got from data to claim</h4><ol class="chain">${c.transformation.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></section>` : ""}
        <section><h4>How strong is it?</h4><div class="meters">
          ${meter("Observation", STRENGTH.provenance[P.type] || [2, P.type || "—"])}
          ${meter("Model dependence", STRENGTH.inference[I.strength] || [2, I.strength || "—"])}
          ${meter("Coverage", STRENGTH.coverage[V.status] || [2, V.status || "—"])}
          ${meter("Population fit", STRENGTH.transfer[T.status] || [2, T.status || "—"])}</div>
          ${V.measured != null ? covBar(V.measured, V.required, V.unit) : ""}${V.note ? `<p class="faint small">${esc(V.note)}</p>` : ""}
          ${I.method ? `<p class="small"><span class="faint">Method:</span> ${esc(I.method)}</p>` : ""}
          ${T.referencePopulation ? `<p class="small"><span class="faint">Reference population:</span> ${esc(T.referencePopulation)}</p>` : ""}</section>
        ${U.interval || U.caveat || U.confidence ? `<section><h4>Uncertainty</h4>${U.interval ? `<p class="num">Range ${esc(U.interval.join(" – "))}</p>` : ""}${U.confidence ? `<p>Confidence: ${esc(U.confidence)}</p>` : ""}${U.caveat ? `<p class="muted">${esc(U.caveat)}</p>` : ""}</section>` : ""}
        ${c.missing.length ? `<section><h4>What is missing</h4><ul class="missing">${c.missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></section>` : ""}
        ${c.wouldChange.length ? `<section><h4>What would change this result</h4><ul class="change">${c.wouldChange.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></section>` : ""}
        ${c.dependencies.length ? `<section><h4>Depends on</h4><div class="chips">${c.dependencies.filter((d) => CL[d]).map((d) => `<button class="chip-btn" data-insp="${esc(d)}">${esc(CL[d].title)}</button>`).join("")}</div></section>` : ""}
        <section><h4>Source</h4><dl class="src"><dt>Type</dt><dd>${esc((STRENGTH.provenance[P.type] || [0, P.type])[1])}</dd><dt>Source</dt><dd>${esc(P.source)}</dd><dt>Version</dt><dd class="mono">${esc(P.sourceVersion)}</dd><dt>Imported</dt><dd class="num">${esc(P.importedAt)}</dd>
          ${c.citations.length ? `<dt>Citations</dt><dd>${c.citations.map(esc).join("<br>")}</dd>` : ""}<dt>Claim id</dt><dd class="mono">${esc(c.id)} · ${esc(c.fingerprint || "")}</dd></dl></section>
        <details class="rawjson"><summary>Raw claim object</summary><pre>${esc(JSON.stringify(c, null, 1))}</pre></details>
      </div>
      <div class="insp-foot">${c.route ? `<button class="btn" data-goroute="${esc(c.route)}">Show in atlas →</button>` : ""}</div>`;
    drawer.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => { drawer.classList.add("open"); scrim.classList.add("open"); });
    document.body.classList.add("insp-open");
    drawer.querySelector(".insp-close").focus();
  }
  function closeClaim() {
    drawer.classList.remove("open"); scrim.classList.remove("open"); document.body.classList.remove("insp-open");
    setTimeout(() => { drawer.hidden = true; scrim.hidden = true; }, RM ? 0 : 240);
    inspStack = [];
    if (inspReturn && document.contains(inspReturn)) inspReturn.focus();
    inspReturn = null;
  }
  drawer.addEventListener("click", (e) => {
    if (e.target.closest(".insp-close")) return closeClaim();
    if (e.target.closest(".insp-back")) { inspStack.pop(); return openClaim(inspStack[inspStack.length - 1], null, false); }
    const d = e.target.closest("[data-insp]"); if (d) return openClaim(d.dataset.insp);
    const g = e.target.closest("[data-goroute]"); if (g) { closeClaim(); goRoute(g.dataset.goroute); }
  });
  scrim.addEventListener("click", closeClaim);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden && cmdk.hidden !== false) closeClaim(); });
  drawer.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); closeClaim(); }
    if (e.key === "Tab") {
      const f = $$("button, [href], summary, [tabindex]:not([tabindex='-1'])", drawer).filter((x) => !x.disabled);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  function goRoute(route) {
    const [sub, ...rest] = route.split("/");
    go(sub, rest.join("/") || null);
  }

  /* ---------- Selection bus: one selection, every view reflects it ---------- */
  const SEL = { id: null };
  function select(id) {
    SEL.id = SEL.id === id ? null : id;
    $$("[data-ent]").forEach((n) => { n.classList.toggle("is-sel", n.dataset.ent === SEL.id); n.classList.toggle("is-dim", !!SEL.id && n.dataset.ent !== SEL.id && !!n.closest("[data-linked]")); });
    document.dispatchEvent(new CustomEvent("atlas:select", { detail: { id: SEL.id } }));
  }
  document.addEventListener("click", (e) => {
    const n = e.target.closest("[data-ent][data-selectable]");
    if (n) { e.preventDefault(); select(n.dataset.ent); }
  });
  document.addEventListener("keydown", (e) => {
    const n = e.target.closest && e.target.closest("[data-ent][data-selectable]");
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(n.dataset.ent); }
  });

  /* ---------- Global command search ---------- */
  const cmdk = document.createElement("div");
  cmdk.id = "cmdk"; cmdk.hidden = true; cmdk.setAttribute("role", "dialog"); cmdk.setAttribute("aria-label", "Search the atlas");
  cmdk.innerHTML = `<div class="cmdk-box"><div class="cmdk-in"><span aria-hidden="true">⌕</span><input id="cmdk-q" type="search" placeholder="Search Tajik, CYP2C19, rs12913832, chromosome 15, T1, ROH…" autocomplete="off" aria-controls="cmdk-list" aria-autocomplete="list"/><kbd>esc</kbd></div><ul id="cmdk-list" role="listbox"></ul><div class="cmdk-foot faint">Searches ${ENT.length} objects${window.GENOME_GZ ? " and all " + fmtNum(A.qc.markers) + " of your markers" : ""} locally. Nothing leaves this device.</div></div>`;
  document.body.append(cmdk);
  let cmdSel = 0, cmdRes = [], genomeMap = null;
  async function genomeIndex() {
    if (genomeMap || !window.GENOME_GZ) return genomeMap;
    const bin = Uint8Array.from(atob(window.GENOME_GZ), (c) => c.charCodeAt(0));
    const txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    genomeMap = new Map();
    for (const line of txt.split("\n")) { const [r, c, p, g] = line.split("\t"); if (r) genomeMap.set(r.toLowerCase(), [r, c, +p, g]); }
    return genomeMap;
  }
  window.atlasGenome = genomeIndex;
  function score(e, q) {
    const l = e.label.toLowerCase(), all = [l, ...(e.aliases || []).map((a) => a.toLowerCase()), (e.detail || "").toLowerCase()];
    if (l === q) return 100;
    if (l.startsWith(q)) return 80;
    if (all.some((x) => x.startsWith(q))) return 60;
    if (all.some((x) => x.includes(q))) return 40;
    const words = q.split(/\s+/);
    return words.every((w) => all.some((x) => x.includes(w))) ? 20 : 0;
  }
  async function runSearch() {
    const q = $("#cmdk-q").value.trim().toLowerCase();
    const list = $("#cmdk-list");
    if (!q) { cmdRes = ENT.filter((e) => ["pop:modern:Tajik", "gene:CYP2C19", "var:rs12913832", "chrom:15", "hg:T1", "hg:C-P92", "concept:roh", "stream:east"].includes(e.id)); }
    else cmdRes = ENT.map((e) => [score(e, q), e]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 14).map(([, e]) => e);
    if (q && /^rs\d+$|^i\d+$/.test(q) && !cmdRes.some((e) => e.label.toLowerCase() === q)) {
      const g = await genomeIndex();
      const rec = g && g.get(q);
      if (rec) cmdRes.unshift({ id: "raw:" + rec[0], type: "Raw marker", label: rec[0], detail: `chr${rec[1]}:${fmtNum(rec[2])} · ${rec[3]}`, route: `chromosomes/${rec[1]}/${rec[0]}` });
      else if (!window.GENOME_GZ) cmdRes.push({ id: "hint", type: "Raw marker", label: q, detail: "Open atlas_full.html to look up any of your markers", route: null });
    }
    cmdSel = 0;
    list.innerHTML = cmdRes.map((e, i) => `<li role="option" id="cmd-${i}" aria-selected="${i === cmdSel}" data-i="${i}"><span class="k">${esc(e.type)}</span><span class="l">${esc(e.label)}</span><span class="d">${esc(e.detail || "")}</span></li>`).join("") || `<li class="empty">No match. Try a gene, rsID, population or chromosome.</li>`;
  }
  function pickSearch(i) {
    const e = cmdRes[i]; if (!e || !e.route) return;
    closeSearch();
    goRoute(e.route);
    if (e.claim && CL[e.claim]) setTimeout(() => openClaim(e.claim), RM ? 0 : 280);
  }
  function openSearch() { cmdk.hidden = false; requestAnimationFrame(() => cmdk.classList.add("open")); $("#cmdk-q").value = ""; runSearch(); $("#cmdk-q").focus(); }
  function closeSearch() { cmdk.classList.remove("open"); cmdk.hidden = true; }
  $("#cmdk-q").addEventListener("input", runSearch);
  $("#cmdk-q").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); cmdSel = (cmdSel + (e.key === "ArrowDown" ? 1 : -1) + cmdRes.length) % Math.max(cmdRes.length, 1); $$("#cmdk-list li").forEach((li, i) => li.setAttribute("aria-selected", i === cmdSel)); $("#cmdk-q").setAttribute("aria-activedescendant", "cmd-" + cmdSel); }
    if (e.key === "Enter") pickSearch(cmdSel);
    if (e.key === "Escape") closeSearch();
  });
  $("#cmdk-list").addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) pickSearch(+li.dataset.i); });
  cmdk.addEventListener("click", (e) => { if (e.target === cmdk) closeSearch(); });
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); openSearch(); }
  });

  /* =====================================================================
     VIEWS
     ===================================================================== */
  const Lx = A.lab;
  const yrs = (y) => (y < 0 ? `${-y} BCE` : `AD ${y}`);

  /* ---------- Portrait: questions, not cards ---------- */
  RENDER.portrait = (el) => {
    const q = A.qc, y = A.haplogroups.y, mt = A.haplogroups.mt, top = A.reported.distances[0];
    const east = Lx && Lx.consensus.east_summary, r = A.roh.summary, ch = A.changes || {};
    const pg = A.pgx.summary.find((p) => p.gene === "CYP2C19");
    const eye = (A.predictions || []).find((p) => p.key === "eyes");
    const lact = A.traits.find((t) => t.rsid === "rs4988235");
    el.innerHTML = `
      <div class="hero-plate">${ORNAMENT}
        <div class="hero-inner">
          <div class="eyebrow">Your genome at a glance · <span class="num">${fmtNum(q.markers)}</span> markers · ${esc(A.meta.dataset.build)}</div>
          <h1 class="display">Your father's line runs back through <em>${esc(y.yhaplo_ycc || "")}</em>, your mother's through <em>${esc(mt.reported)}</em>. Between them are thousands of ancestors from the oasis cities, the Iranian plateau, the steppe and the mountains toward the Indus.</h1>
          <p class="lede">Every statement here opens three levels deep: the answer, an interactive view, and the evidence behind it. Press <kbd>/</kbd> to search anything.</p>
        </div>
      </div>

      <div class="qa">
        <article class="q-mod">
          <div class="q-k">Your ancestry</div>
          <h2 class="q-a">Across every model, your genome falls inside the <em>Central Asian</em> genetic landscape.</h2>
          <div class="q-facts">
            <div><span class="num big">${top.distance}</span><span>distance to ${esc(top.population)}, your closest of ${A.reported.distances.filter((d) => d.set === "modern").length} modern references ${ev("anc.dist.modern.1")}</span></div>
            ${east ? `<div><span class="num big">${east.median}%</span><span>East Eurasian, median of 8 independent models (range ${east.min}–${east.max}%) ${ev("anc.east")}</span></div>` : ""}
            <div><span class="num big">3</span><span>services that disagree by label, not by DNA ${ev("anc.services")}</span></div>
          </div>
          <div class="q-go"><button class="link" data-go="services">Compare the services →</button><button class="link" data-go="tajik">See your reference neighbourhood →</button><button class="link" data-go="river">Ancestry through time →</button></div>
        </article>

        <article class="q-mod">
          <div class="q-k">Your deepest lineages</div>
          <h2 class="q-a">Two single threads: <em>${esc(y.yhaplo_23andme_label)}</em> from your father's father's line, <em>${esc(mt.reported)}</em> from your mother's mother's line.</h2>
          <p class="muted">Ten generations back you have 1,024 ancestors. These two lines trace two of them. They are lineages, not percentages of your ancestry.</p>
          <div class="q-facts"><div><span class="num big">${y.node_coverage ? y.node_coverage.reduce((a, n) => a + n.observed_derived.length, 0) : "—"}</span><span>Y branch markers directly observed on your path ${ev("lin.y")}</span></div>
            <div><span class="num big">${mt.path.reduce((a, s) => a + s.support, 0)}</span><span>mtDNA diagnostic markers supporting T1 ${ev("lin.mt")}</span></div></div>
          <div class="q-go"><button class="link" data-go="lineages">Walk the lineages →</button></div>
        </article>

        <article class="q-mod">
          <div class="q-k">Your genome</div>
          <h2 class="q-a"><span class="num">${fmtNum(q.markers)}</span> markers read on all 25 chromosomes, with no sign that your parents were related.</h2>
          <div class="q-facts"><div><span class="num big">${(q.no_call_rate * 100).toFixed(1)}%</span><span>no-calls ${ev("gen.dataset")}</span></div>
            <div><span class="num big">${r.longest_mb} Mb</span><span>longest run of homozygosity (none over 5 Mb) ${ev("gen.roh")}</span></div>
            <div><span class="num big">XY</span><span>verified from X and Y calls ${ev("gen.sex")}</span></div></div>
          <div class="glance" data-linked>${karyoLegend()}${karyogram({ rowH: 9, gap: 6, sites: false })}</div>
          <div class="q-go"><button class="link" data-go="chromosomes">Open the genome browser →</button></div>
        </article>

        <article class="q-mod">
          <div class="q-k">Your biology</div>
          <h2 class="q-a">A few results that could matter in real life.</h2>
          <ul class="bio">
            ${pg ? `<li><span class="b-k">CYP2C19</span><span class="b-v">${esc(pg.phenotype)}</span><span class="b-d">relevant to clopidogrel, many SSRIs and PPIs</span>${ev("pgx.CYP2C19")}</li>` : ""}
            ${eye ? `<li><span class="b-k">Eye colour</span><span class="b-v">${esc(eye.guess)}</span><span class="b-d">HERC2 genotype, ~${Math.round(eye.p * 100)}% of people with it</span>${ev("trait.rs12913832")}</li>` : ""}
            ${lact ? `<li><span class="b-k">Milk</span><span class="b-v">${esc(lact.answer)}</span><span class="b-d">European-type persistence allele absent</span>${ev("trait.rs4988235")}</li>` : ""}
          </ul>
          <div class="q-go"><button class="link" data-go="health">Drug response & health →</button><button class="link" data-go="traits">Traits →</button></div>
        </article>

        <article class="q-mod uncertain">
          <div class="q-k">Your biggest uncertainties</div>
          <h2 class="q-a">What this atlas <em>cannot</em> yet say is a finding too.</h2>
          <ul class="unc">
            ${east ? `<li><b>Ancestry proportions depend on the model.</b> East Eurasian ancestry ranges from ${east.min}% to ${east.max}% across eight models, because Central Asian reference populations remain sparse. ${ev("anc.east")}</li>` : ""}
            <li><b>Your Y branch is seen through a keyhole.</b> ${y.node_coverage ? y.node_coverage.find((n) => n.node === "C1b1a1a").observed_derived.length : "?"} of ${y.node_coverage ? y.node_coverage.find((n) => n.node === "C1b1a1a").defining_snps : "?"} markers that define your terminal branch are on the array. ${ev("lin.y")}</li>
            <li><b>Nothing autosomal can be assigned to a parent.</b> Your genotypes are unphased. ${ev("lin.autosomes")}</li>
            ${Lx ? `<li><b>The admixture date is exploratory.</b> ${yrs(Lx.dating.calendar_best)} comes from a single-pulse model on proxy references. ${ev("anc.dating")}</li>` : ""}
            <li><b>Rare disease variants are largely unchecked.</b> BRCA1/2, Lynch and most cardiomyopathy genes are not comprehensively covered. ${ev("health.na.0")}</li>
          </ul>
        </article>
      </div>

      <h2>Seven rings of identity</h2>
      <div class="rings-wrap">
        <div>${ringsSvg()}</div>
        <div class="ring-detail" id="ring-detail">
          <div class="eyebrow">How far DNA reaches</div>
          <p class="muted">"Ancestry" means at least seven different things. DNA speaks clearly to the inner rings and falls silent at the outer ones.</p>
          <div class="ring-list">${RINGS.map((g) => `<button class="ring-row" data-ring="${g.key}"><span class="reach"><i style="width:${Math.max(g.reach * 100, 3)}%"></i></span><span>${esc(A.knowledge.identity_layers.find((l) => l.key === g.key).name)}</span><span class="faint">${g.verdict}</span></button>`).join("")}</div>
          <div id="ring-text" class="ring-text"></div>
        </div>
      </div>
      <p class="faint small build-line">Build ${esc(ch.snapshot || ch.previous || "")} · ${ch.baseline ? "first build: baseline for future comparisons" : `${(ch.items || []).length} claims changed since the previous build`} · <button class="link" data-go="method">What changed?</button></p>`;
    el.querySelectorAll(".karyo-row").forEach((rw) => rw.addEventListener("click", () => go("chromosomes", rw.dataset.ch)));
    const showRing = (key) => {
      const g = RINGS.find((x) => x.key === key), l = A.knowledge.identity_layers.find((x) => x.key === key);
      el.querySelectorAll("[data-ring]").forEach((n) => n.classList.toggle("on", n.dataset.ring === key));
      $("#ring-text", el).innerHTML = `<h3 class="serif">${esc(l.name)}</h3><p class="muted">${esc(l.what)}</p><p><b>DNA speaks: ${esc(g.verdict)}.</b> ${esc(g.extra)}</p><p class="you">${esc(l.you)}</p>`;
    };
    el.querySelectorAll("[data-ring]").forEach((n) => { n.addEventListener("mouseenter", () => showRing(n.dataset.ring)); n.addEventListener("click", () => showRing(n.dataset.ring)); n.addEventListener("focus", () => showRing(n.dataset.ring)); });
    showRing("genetic");
  };

  /* ---------- Findings: separate dimensions, user-chosen sort ---------- */
  RENDER.findings = (el) => {
    const W = { A: 4, B: 3, C: 2, D: 1, X: 0 };
    const F = A.findings.map((f) => ({ ...f, evidence: W[f.tier] / 4 }));
    const SORTS = [["evidence", "Strongest evidence", (a, b) => b.evidence - a.evidence], ["rarity", "Most unusual", (a, b) => b.rarity - a.rarity],
      ["relevance", "Most personally relevant", (a, b) => b.relevance - a.relevance], ["ancestry", "Ancestry", (a, b) => b.ancestry - a.ancestry || b.evidence - a.evidence],
      ["uncertain", "Most uncertain", (a, b) => a.evidence - b.evidence], ["new", "Newly discovered", (a, b) => b.new - a.new || b.rarity - a.rarity]];
    let cur = "evidence";
    const dim = (lbl, v) => `<div class="dim"><span>${lbl}</span><span class="dim-bar"><i style="width:${Math.round(v * 100)}%"></i></span></div>`;
    const claimFor = { lineages: "lin.y", pgx: null, chromosomes: "gen.roh", contradictions: "anc.services", tajik: "anc.dist.modern.1", consensus: "anc.east", ikat: "anc.dating", traits: "trait.rs3827760" };
    const draw = () => {
      const s = SORTS.find((x) => x[0] === cur);
      const list = [...F].sort(s[2]);
      el.innerHTML = `<div class="eyebrow">Findings</div><h1>What stands out, on your terms</h1>
        <p class="lede">Each finding is rated on three separate axes: how well supported it is, how unusual it is, and how much it matters to you. They are never blended into a single score, so you choose the order.</p>
        <div class="sortbar" role="radiogroup" aria-label="Sort findings">${SORTS.map(([k, n]) => `<button role="radio" aria-checked="${k === cur}" data-sort="${k}">${n}</button>`).join("")}</div>
        <ol class="findings">${list.map((f) => {
          const cid = f.section === "pgx" ? "pgx." + f.title.split(":")[0] : claimFor[f.section];
          return `<li class="finding2" data-tier="${f.tier}"><div class="f-main"><h3>${esc(f.title)}</h3><p>${esc(f.detail)}</p>
            <div class="f-tags">${f.new ? `<span class="tag new">New analysis</span>` : ""}${f.ancestry ? `<span class="tag">Ancestry</span>` : ""}</div></div>
            <div class="f-dims">${dim("Evidence", f.evidence)}${dim("Unusualness", f.rarity)}${dim("Relevance", f.relevance)}<div class="f-ev">${cid && CL[cid] ? ev(cid) : tier(f.tier)}</div></div></li>`;
        }).join("")}</ol>`;
      el.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => { cur = b.dataset.sort; draw(); }));
    };
    draw();
  };

  /* ---------- Services compared: native ↔ harmonized morph, stream tracing ---------- */
  RENDER.services = (el, arg) => {
    const SV = A.ancestry.services, ST = A.ancestry.streams;
    const state2 = { mode: "native", stream: arg && ST[arg] ? arg : null, tab: "compare" };
    const nativeTone = (i) => `color-mix(in oklab, var(--ink-3) ${18 + (i % 4) * 12}%, var(--surface))`;
    function rows() {
      return SV.map((s, si) => {
        const leaves = s.leaves.map((l, i) => ({ ...l, i }));
        const tot = leaves.reduce((a, l) => a + l.value, 0);
        const ordered = state2.mode === "native" ? leaves : [...leaves].sort((a, b) => STREAM_ORDER.indexOf(a.stream) - STREAM_ORDER.indexOf(b.stream) || b.value - a.value);
        let x = 0;
        const segs = ordered.map((l) => { const left = (x / tot) * 100, w = (l.value / tot) * 100; x += l.value; return { ...l, left, w }; });
        return `<div class="svc-row" data-svc="${si}"><div class="svc-lbl"><b>${esc(s.service)}</b><span>${esc(s.model)}</span></div>
          <div class="svc-bar" role="list" aria-label="${esc(s.service)} ${esc(s.model)}">${segs.map((l) => {
            const on = state2.stream && l.stream === state2.stream, dim = state2.stream && !on;
            const bg = state2.mode === "native" ? nativeTone(l.i) : l.stream === "composite" ? "var(--s-composite)" : `var(--s-${l.stream})`;
            return `<div role="listitem" tabindex="0" class="seg ${l.stream === "composite" && state2.mode !== "native" ? "hatch-bg" : ""} ${on ? "on" : ""} ${dim ? "dim" : ""}" data-stream="${l.stream}" style="left:${l.left}%;width:${l.w}%;background-color:${bg}"
              data-tip="${esc(tt(l.label, [["share", fmt(l.value, 1) + "%"], ["harmonized stream", ST[l.stream].name], ["source", l.method === "screenshot" ? "screenshot" : "text summary"]]))}"><span>${l.w > 9 ? esc(state2.mode === "native" ? l.label : fmt(l.value, 0) + "%") : ""}</span></div>`;
          }).join("")}</div></div>`;
      }).join("");
    }
    function trace() {
      const k = state2.stream; if (!k) return `<p class="muted">Select a stream to trace it back into each service's own categories.</p>`;
      const per = SV.map((s) => { const ls = s.leaves.filter((l) => l.stream === k); return { s, ls, tot: ls.reduce((a, l) => a + l.value, 0) }; });
      const vals = per.map((p) => p.tot), spread = Math.max(...vals) - Math.min(...vals);
      const labCons = Lx && (k === "east" ? Lx.consensus.east_summary : k === "south" ? Lx.consensus.south_summary : null);
      return `<h3 class="serif" style="font-size:22px;margin:0 0 6px"><i class="swatch" style="background:var(--s-${k});vertical-align:-1px;margin-right:8px"></i>${esc(ST[k].name)}</h3>
        <div class="trace">${per.map((p) => `<div class="tr-row"><div class="tr-svc">${esc(p.s.service)} <span class="faint">${esc(p.s.model.replace("Periodical ", ""))}</span></div>
          <div class="tr-src">${p.ls.length ? p.ls.map((l) => `<span class="src-chip">${esc(l.label)} <b class="num">${fmt(l.value, 1)}</b></span>`).join('<span class="plus">+</span>') : `<span class="faint">no category maps here</span>`}</div>
          <div class="tr-tot num">${fmt(p.tot, 1)}%</div></div>`).join("")}</div>
        <div class="trace-sum"><div><span class="faint">Spread between services</span><b class="num">${fmt(spread, 1)} pts</b>${spread > 10 ? `<span class="tag warn">diverge</span>` : `<span class="tag ok">converge</span>`}</div>
          ${labCons ? `<div><span class="faint">Independent model consensus</span><b class="num">${labCons.median}%</b><span class="faint">(${labCons.min}–${labCons.max}%)</span> ${ev(k === "east" ? "anc.east" : "anc.south")}</div>` : ""}</div>`;
    }
    function consensusTab() {
      const keys = STREAM_ORDER.filter((k) => SV.some((s) => s.streams[k]));
      return `<table class="data cons"><thead><tr><th>Stream</th>${SV.map((s) => `<th class="num">${esc(s.service.replace("IllustrativeDNA", "IDNA"))}<br><span class="faint">${esc(s.model.replace("Periodical ", "").replace("Ancestry Composition", "").replace("Ethnicity Estimate (July 2024)", ""))}</span></th>`).join("")}<th class="num">Spread</th><th>Reading</th></tr></thead><tbody>
        ${keys.map((k) => { const v = SV.map((s) => s.streams[k] || 0); const sp = Math.max(...v) - Math.min(...v);
          return `<tr data-stream-row="${k}"><td><i class="swatch" style="background:var(--s-${k});margin-right:8px;vertical-align:-2px"></i>${esc(ST[k].name)}</td>${v.map((x) => `<td class="num">${x ? fmt(x, 1) : '<span class="faint">·</span>'}</td>`).join("")}<td class="num">${fmt(sp, 1)}</td><td>${k === "composite" ? `<span class="tag">vendor cluster</span>` : sp <= 10 ? `<span class="tag ok">agree</span>` : `<span class="tag warn">model-dependent</span>`}</td></tr>`; }).join("")}</tbody></table>
        <p class="faint small">The vendor→stream mapping is interpretive (Tier C). A dot means the service has no category for that stream, which usually means the ancestry is folded into another label, not that it is absent.</p>`;
    }
    function disagreeTab() {
      return A.ancestry.disagreements.map((d) => `<div class="dis" data-tier="${d.tier}"><div class="dis-h"><h3>${esc(d.topic)}</h3>${tier(d.tier, false)}</div>${dotRow(d.values.map((x) => [...x]), 50, { step: 10 })}<p class="muted">${esc(d.explanation)}</p></div>`).join("") +
        `<h3 style="margin-top:24px">Why services differ</h3><div class="grid-3">${A.knowledge.why_differ.map(([h, t]) => `<div class="mod"><h4>${esc(h)}</h4><p class="muted small">${esc(t)}</p></div>`).join("")}</div>`;
    }
    function draw() {
      el.innerHTML = `<div class="eyebrow">Flagship · three services, one genome</div><h1>Why the ancestry companies disagree</h1>
        <p class="lede">Each service reports your genome in its own vocabulary. Switch to <b>harmonized streams</b> and the same categories slide into a shared language. Then select a stream to trace it back to where each company put it.</p>
        <div class="toolbar"><div class="seg-ctl" role="radiogroup" aria-label="Label system"><button role="radio" aria-checked="${state2.mode === "native"}" data-mode="native">Native labels</button><button role="radio" aria-checked="${state2.mode === "harmonized"}" data-mode="harmonized">Harmonized streams</button></div>
          <div class="seg-ctl" role="tablist"><button role="tab" aria-selected="${state2.tab === "compare"}" data-tab="compare">Compare</button><button role="tab" aria-selected="${state2.tab === "consensus"}" data-tab="consensus">Consensus</button><button role="tab" aria-selected="${state2.tab === "disagree"}" data-tab="disagree">Disagreement</button></div>
          ${ev("anc.services")}</div>
        <div class="stage">
          ${state2.tab === "compare" ? `<div class="svc-stage ${state2.mode}">${rows()}</div>
            <div class="stream-keys" role="list">${STREAM_ORDER.filter((k) => SV.some((s) => s.streams[k])).map((k) => `<button role="listitem" class="skey ${state2.stream === k ? "on" : ""}" data-pick="${k}"><i class="${k === "composite" ? "hatch-bg" : ""}" style="background-color:var(--s-${k})"></i>${esc(ST[k].name)}</button>`).join("")}</div>
            <div class="trace-wrap" aria-live="polite">${trace()}</div>` : state2.tab === "consensus" ? consensusTab() : disagreeTab()}
        </div>`;
      el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => morph(b.dataset.mode)));
      el.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { state2.tab = b.dataset.tab; draw(); bindTips(el); }));
      el.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => pick(b.dataset.pick)));
      el.querySelectorAll(".seg").forEach((s) => { s.addEventListener("click", () => { if (state2.mode === "native") morph("harmonized"); pick(s.dataset.stream); }); s.addEventListener("keydown", (e) => { if (e.key === "Enter") s.click(); }); });
      bindTips(el);
    }
    function morph(mode) {
      if (mode === state2.mode) return;
      state2.mode = mode;
      // animate in place: update positions/colours of existing segments (keyed by row + label)
      const stage = $(".svc-stage", el); if (!stage) return draw();
      const tmp = document.createElement("div"); tmp.innerHTML = rows();
      $$(".svc-row", stage).forEach((row, ri) => {
        const next = $$(".svc-row", tmp)[ri];
        $$(".seg", row).forEach((sg, i) => {
          const nsg = $$(".seg", next).find((x) => x.getAttribute("data-tip") === sg.getAttribute("data-tip"));
          if (!nsg) return;
          sg.style.left = nsg.style.left; sg.style.backgroundColor = nsg.style.backgroundColor; sg.className = nsg.className;
          sg.querySelector("span").innerHTML = nsg.querySelector("span").innerHTML;
        });
      });
      stage.classList.toggle("native", mode === "native"); stage.classList.toggle("harmonized", mode === "harmonized");
      el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-checked", b.dataset.mode === mode));
    }
    function pick(k) {
      state2.stream = state2.stream === k ? null : k;
      $$(".seg", el).forEach((s) => { s.classList.toggle("on", s.dataset.stream === state2.stream); s.classList.toggle("dim", !!state2.stream && s.dataset.stream !== state2.stream); });
      $$(".skey", el).forEach((b) => b.classList.toggle("on", b.dataset.pick === state2.stream));
      const tw = $(".trace-wrap", el); if (tw) tw.innerHTML = trace();
      setRoute("services", state2.stream, true);
    }
    if (state2.stream) state2.mode = "harmonized";
    draw();
  };

  /* ---------- Places: linked constellation + map + ranking + inspector ---------- */
  const ANCIENT_ERA = { // approximate period of the culture/sample label (literature; Tier C)
    "Post-Medieval Tian Shan Nomad": [1500, 1800], "Khotanese Saka": [-200, 1000], "Kushan": [30, 375], "Saka (Tian Shan)": [-800, -200], "Wusun": [-200, 400],
    "Post-Medieval Swat Valley (Singoor)": [1500, 1850], "Medieval Central Asian Nestorian (Tian Shan)": [1200, 1400], "Kangju": [-200, 500],
    "Medieval Swat Valley (Mahmud Ghaznavi Mosque)": [1000, 1200], "Ottoman Turk (Çapalıbağ)": [1300, 1900] };
  RENDER.tajik = (el, arg) => {
    const D = A.reported.distances, P = A.knowledge.places, BM = window.BASEMAP;
    const set = { v: "modern" };
    const origin = [38.56, 68.78];
    const bearing = (la, lo) => { const r = Math.PI / 180, y = Math.sin((lo - origin[1]) * r) * Math.cos(la * r), x = Math.cos(origin[0] * r) * Math.sin(la * r) - Math.sin(origin[0] * r) * Math.cos(la * r) * Math.cos((lo - origin[1]) * r); return Math.atan2(y, x); };
    const idOf = (d) => `pop:${d.set}:${d.population}`;
    function constellation() {
      const S = 460, C = S / 2, R = 200, max = 9, rows = D.filter((d) => set.v === "both" || d.set === set.v);
      let s = `<svg class="chart constel" viewBox="0 0 ${S} ${S}" role="img" aria-label="Similarity neighbourhood: distance from centre is genetic distance, direction is geographic bearing from Dushanbe">`;
      [2, 4, 6, 8].forEach((t) => { s += `<circle cx="${C}" cy="${C}" r="${(R * t) / max}" fill="none" stroke="var(--rule)" stroke-dasharray="${t % 4 ? "2 4" : "0"}"/><text x="${C + 3}" y="${C - (R * t) / max - 3}" class="axis-n">${t}</text>`; });
      s += `<text x="${C}" y="14" text-anchor="middle" class="axis-n">N</text><text x="${S - 8}" y="${C + 4}" text-anchor="end" class="axis-n">E</text>`;
      rows.forEach((d, i) => {
        const ll = P[d.set][d.population]; if (!ll) return;
        let a = bearing(ll[0], ll[1]); if (Math.abs(ll[0] - origin[0]) + Math.abs(ll[1] - origin[1]) < 0.4) a = -Math.PI / 2 + i * 0.9;
        const rr = (R * Math.min(d.distance, max)) / max, x = C + rr * Math.sin(a), y = C - rr * Math.cos(a);
        const t = esc(tt(d.population, [["distance", d.distance], ["rank", "#" + d.rank], ["type", d.set]]));
        s += `<g class="node ${d.method !== "screenshot" ? "secondary" : ""}" data-ent="${esc(idOf(d))}" data-selectable tabindex="0" role="button" aria-label="${esc(d.population)}, distance ${d.distance}" data-tip="${t}">
          ${d.set === "modern" ? `<circle cx="${x}" cy="${y}" r="7"/>` : `<path d="M${x},${y - 8} L${x + 8},${y} L${x},${y + 8} L${x - 8},${y}Z"/>`}
          <text x="${x > C + 40 ? x - 11 : x + 11}" y="${y + 4}" text-anchor="${x > C + 40 ? "end" : "start"}">${esc(d.population.replace(" (Afghanistan)", " (Afg.)").replace("Post-Medieval ", "Post-Med. ").replace("Medieval Central Asian ", "Med. C. Asian "))}</text></g>`;
      });
      s += `<circle cx="${C}" cy="${C}" r="16" fill="var(--brass)"/><text x="${C}" y="${C + 4}" text-anchor="middle" style="fill:var(--surface);font-weight:700;font-size:11px">YOU</text></svg>`;
      return s;
    }
    function mapSvg() {
      const B = BM.bounds, px = (la, lo) => [((lo - B.lon0) / (B.lon1 - B.lon0)) * BM.width, ((B.lat1 - la) / (B.lat1 - B.lat0)) * BM.height];
      const [vx0, vy0] = px(46, 53), [vx1, vy1] = px(31, 83), k = (vx1 - vx0) / BM.width;
      let s = `<svg class="chart map" viewBox="${vx0} ${vy0} ${vx1 - vx0} ${vy1 - vy0}" role="img" aria-label="Map of reference populations"><rect x="${vx0}" y="${vy0}" width="${vx1 - vx0}" height="${vy1 - vy0}" fill="var(--surface)"/>`;
      s += BM.countries.map((c) => `<path d="${c.d}" fill="var(--surface-2)" stroke="var(--rule)" stroke-width="${0.8 * k}"/>`).join("");
      D.filter((d) => set.v === "both" || d.set === set.v).forEach((d) => {
        const ll = P[d.set][d.population]; if (!ll) return; const [x, y] = px(ll[0], ll[1]), r = k * (5 + 10 * Math.max(0, (9 - d.distance) / 6.5));
        s += `<g class="node" data-ent="${esc(idOf(d))}" data-selectable tabindex="0" role="button" aria-label="${esc(d.population)} on map" data-tip="${esc(tt(d.population, [["distance", d.distance]]))}">${d.set === "modern" ? `<circle cx="${x}" cy="${y}" r="${r}"/>` : `<path d="M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y}Z"/>`}</g>`;
      });
      Object.entries(P.family).forEach(([n, ll]) => { const [x, y] = px(ll[0], ll[1]); s += `<path transform="translate(${x - 7 * k},${y - 7 * k}) scale(${1.2 * k})" d="M6,0 L7.8,4.2 L12,4.6 L8.8,7.4 L9.8,12 L6,9.6 L2.2,12 L3.2,7.4 L0,4.6 L4.2,4.2Z" fill="var(--ink)" data-tip="${esc(tt(n, [["evidence", n.includes("23andMe") ? "vendor location (A)" : "family report (X)"]]))}"/>`; });
      return s + `</svg>`;
    }
    function ranking() {
      return `<ol class="rank-list">${D.filter((d) => set.v === "both" || d.set === set.v).map((d) => `<li data-ent="${esc(idOf(d))}" data-selectable tabindex="0" role="button"><span class="r-n num">${d.rank}</span><span class="r-l">${esc(d.population)}${d.method !== "screenshot" ? ' <span class="faint" title="From your text summary only">†</span>' : ""}</span><span class="r-bar"><i style="width:${(d.distance / 10) * 100}%"></i></span><span class="r-d num">${d.distance}</span></li>`).join("")}</ol>`;
    }
    function inspector(id) {
      const d = D.find((x) => idOf(x) === id);
      if (!d) return `<div class="empty-state"><p class="serif" style="font-size:20px;margin:0 0 6px">Select a population</p><p class="muted small">Choose any point in the neighbourhood, the map or the list. All three stay in sync.</p></div>`;
      const near = D.filter((x) => x.set === d.set && x !== d).sort((a, b) => Math.abs(a.distance - d.distance) - Math.abs(b.distance - d.distance)).slice(0, 3);
      const ll = P[d.set][d.population], era = ANCIENT_ERA[d.population];
      const cid = `anc.dist.${d.set}.${d.rank}`;
      return `<div class="eyebrow">${d.set === "modern" ? "Modern reference" : "Ancient reference"} · #${d.rank}</div><h3 class="serif" style="font-size:24px;margin:2px 0 8px">${esc(d.population)}</h3>
        <dl class="kv small"><dt>Genetic distance</dt><dd class="num">${d.distance} <span class="faint">(IllustrativeDNA model)</span></dd>
        <dt>Region</dt><dd class="num">≈ ${ll ? `${ll[0].toFixed(1)}°N ${ll[1].toFixed(1)}°E` : "—"} <span class="faint">approximate centroid</span></dd>
        ${era ? `<dt>Period</dt><dd>≈ ${yrs(era[0])} – ${yrs(era[1])} <span class="faint">(literature, approximate)</span></dd>` : ""}
        <dt>Sample size</dt><dd class="faint">Not published in your results</dd>
        <dt>Comparison type</dt><dd>Whole-genome coordinate distance to a population average</dd>
        <dt>Nearby in the model</dt><dd>${near.map((n) => `<button class="link" data-ent="${esc(idOf(n))}" data-selectable>${esc(n.population)}</button>`).join(" · ")}</dd></dl>
        <div class="isnot"><div><b>This is</b> genetic similarity within one vendor's reference set.</div><div><b>This is not</b> your ethnicity, your nationality, or proof of descent.</div></div>
        ${ev(cid)}`;
    }
    function draw() {
      el.innerHTML = `<div class="eyebrow">Places · population affinity</div><h1>Your position in a Central Asian reference space</h1>
        <p class="lede">You are not assigned to a population. You sit <em>inside a neighbourhood</em> of them. Distance from the centre is genetic distance in IllustrativeDNA's model; direction is geography.</p>
        <div class="toolbar"><div class="seg-ctl" role="radiogroup" aria-label="Reference set">${["modern", "ancient", "both"].map((v) => `<button role="radio" aria-checked="${set.v === v}" data-set="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join("")}</div></div>
        <div class="places" data-linked>
          <div class="pl-constel">${constellation()}<p class="faint small">Centre = you. Rings = distance 2, 4, 6, 8. Hollow points (†) come from your text summary only.</p></div>
          <div class="pl-side"><div class="pl-insp" aria-live="polite">${inspector(SEL.id)}</div></div>
          <div class="pl-map">${mapSvg()}<div class="legend small"><span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="var(--accent)"/></svg>modern</span><span><svg width="10" height="10"><path d="M5,0 L10,5 L5,10 L0,5Z" fill="var(--s-oasis)"/></svg>ancient</span><span>★ Garm, Kanibadam (family report) and Tashkent (23andMe)</span></div></div>
          <div class="pl-rank">${ranking()}</div>
        </div>
        <div class="grid-2" style="margin-top:28px">
          <div class="unavail"><div class="u-k">Not yet available</div><h3>PCA reference space</h3><p class="muted small">A true principal-component map needs your G25 coordinates, which aren't in the data you imported. The neighbourhood above uses the distances you do have. It is not a PCA.</p><div class="u-next">Next data source → <b>IllustrativeDNA G25 coordinates</b></div></div>
          <div class="unavail"><div class="u-k">Not testable yet</div><h3>Garm / Rasht Valley</h3><p class="muted small">Your father's reported region has no reference population in these results. Hisor, Ayni and Kulob Tajiks are the nearest proxies.</p><div class="u-next">Next data source → <b>a Garm reference sample in any model</b></div></div>
        </div>`;
      el.querySelectorAll("[data-set]").forEach((b) => b.addEventListener("click", () => { set.v = b.dataset.set; draw(); }));
      bindTips(el);
      $$("[data-ent]", el).forEach((n) => { n.classList.toggle("is-sel", n.dataset.ent === SEL.id); n.classList.toggle("is-dim", !!SEL.id && n.dataset.ent !== SEL.id && !!n.closest("[data-linked]")); });
    }
    const onSel = (e) => { if (!el.classList.contains("active")) return; const box = $(".pl-insp", el); if (box) { box.innerHTML = inspector(e.detail.id); } const d = D.find((x) => idOf(x) === e.detail.id); if (d) setRoute("tajik", d.population, true); };
    document.removeEventListener("atlas:select", RENDER.tajik._h || (() => {})); RENDER.tajik._h = onSel; document.addEventListener("atlas:select", onSel);
    if (arg) { const d = D.find((x) => x.population === arg); if (d) { SEL.id = idOf(d); if (d.set === "ancient") set.v = "ancient"; } }
    draw();
  };

  /* ---------- River of ancestry: observed present vs literature past, windows not points, linked scrubber ---------- */
  RENDER.river = (el) => {
    const R = Object.fromEntries(A.ancestry.illustrative_ranges.map((r) => [r.stream, r]));
    const ERAS = [-10000, -3000, -1500, -300, 600, 1500, 2000];
    const ELBL = ["10,000 BCE", "3000 BCE", "1500 BCE", "300 BCE", "AD 600", "AD 1500", "Today"];
    const W = 1160, H = 520, x0 = 200, x1 = 920;
    const X = (yr) => { for (let i = 1; i < ERAS.length; i++) if (yr <= ERAS[i]) { const t = (yr - ERAS[i - 1]) / (ERAS[i] - ERAS[i - 1]); return x0 + ((x1 - x0) * (i - 1 + t)) / (ERAS.length - 1); } return x1; };
    const dt = Lx && Lx.dating;
    const S = [
      { k: "east", win: [[dt ? dt.calendar_range[0] : -800, dt ? dt.calendar_range[1] : -100, "Iron-Age layer (dated in your genome)", "D"], [600, 1400, "Turkic & Mongol eras (literature)", "C"]], origin: "Eastern steppe, Mongolia & Siberia" },
      { k: "steppe", win: [[-2200, -1500, "Steppe herders arrive (literature)", "C"]], origin: "Western steppe herders" },
      { k: "oasis", win: [[-2500, -1800, "Oasis civilisations form (literature)", "C"]], origin: "Oasis towns (BMAC → Sogdiana)" },
      { k: "iranian", win: [], origin: "Iranian-plateau farmers & foragers" },
      { k: "south", win: [[-2600, -1500, "Indus-periphery contacts (literature)", "C"]], origin: "Indus periphery / Swat" },
    ];
    S.forEach((s) => { const r = R[s.k]; s.lo = r.range[0]; s.hi = r.range[1]; s.mid = (s.lo + s.hi) / 2; s.join = s.win.length ? s.win[0][0] : -10000; });
    const tot = S.reduce((a, s) => a + s.mid, 0), unit = 3.1;
    S.forEach((s) => (s.w = (s.mid / tot) * 100 * unit));
    const cols = ERAS.map((yr) => {
      let y = 0; const pos = {};
      S.forEach((s, j) => { if (j) y += (S[j - 1].join <= yr && s.join <= yr) ? 3 : 34; pos[s.k] = [y, y + s.w]; y += s.w; });
      const off = H / 2 - 30 - y / 2; Object.values(pos).forEach((p) => { p[0] += off; p[1] += off; }); return pos;
    });
    const xs = ERAS.map((e) => X(e));
    const path = (k) => { let top = "", bot = ""; xs.forEach((x, i) => { const [a, b] = cols[i][k]; if (!i) top = `M${x},${a}`; else { const m = (xs[i - 1] + x) / 2; top += ` C${m},${cols[i - 1][k][0]} ${m},${a} ${x},${a}`; } });
      for (let i = xs.length - 1; i >= 0; i--) { const b = cols[i][k][1]; if (i === xs.length - 1) bot += ` L${xs[i]},${b}`; else { const m = (xs[i + 1] + xs[i]) / 2; bot += ` C${m},${cols[i + 1][k][1]} ${m},${b} ${xs[i]},${b}`; } } return top + bot + " Z"; };
    let s = `<svg class="chart river2" viewBox="0 0 ${W} ${H}" role="img" aria-label="River of ancestry with literature-derived past and model-derived present">
      <defs><pattern id="lit" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2.2" opacity=".55"/></pattern>
      ${S.map((s) => `<linearGradient id="solid-${s.k}" x1="0" x2="1"><stop offset="0" stop-color="var(--s-${s.k})" stop-opacity="0"/><stop offset="${((X(s.win.length ? s.win[s.win.length - 1][1] : -10000) - 0) / W).toFixed(3)}" stop-color="var(--s-${s.k})" stop-opacity=".92"/><stop offset="1" stop-color="var(--s-${s.k})" stop-opacity=".95"/></linearGradient><clipPath id="clip-${s.k}"><path d="${path(s.k)}"/></clipPath>`).join("")}</defs>`;
    xs.forEach((x, i) => { s += `<line x1="${x}" x2="${x}" y1="24" y2="${H - 50}" stroke="var(--rule)" stroke-dasharray="${i === xs.length - 1 ? "0" : "2 4"}"/><text x="${x}" y="${H - 30}" text-anchor="middle" class="era">${ELBL[i]}</text>`; });
    s += `<g class="flow">`;
    S.forEach((st) => {
      s += `<g class="strm" data-k="${st.k}" data-tip="${esc(tt(A.ancestry.streams[st.k].name, [["share today (IllustrativeDNA models)", `${fmt(st.lo, 1)}–${fmt(st.hi, 1)}%`], ...st.win.map((w) => ["window", `${yrs(w[0])} – ${yrs(w[1])}`])]))}">
        <path d="${path(st.k)}" fill="url(#lit)" style="color:var(--s-${st.k})" opacity=".55"/>
        <path d="${path(st.k)}" fill="url(#solid-${st.k})"/>
        ${st.win.map((w) => `<rect clip-path="url(#clip-${st.k})" x="${X(w[0])}" y="0" width="${Math.max(X(w[1]) - X(w[0]), 3)}" height="${H}" fill="var(--brass)" opacity="${w[3] === "D" ? 0.35 : 0.22}"/>`).join("")}
        <path d="${path(st.k)}" fill="none" stroke="var(--s-${st.k})" stroke-width=".8" stroke-opacity=".5"/></g>`;
    });
    s += `</g>`;
    S.forEach((st) => st.win.forEach((w, j) => { const yy = (cols[xs.length - 1][st.k][0]) - 4; const xm = (X(w[0]) + X(w[1])) / 2, ym = (() => { let i = 0; while (i < ERAS.length - 1 && ERAS[i + 1] < (w[0] + w[1]) / 2) i++; return cols[i][st.k][0]; })();
      s += `<text x="${xm}" y="${ym - 6 - j * 12}" text-anchor="middle" class="evt">${esc(w[2])}</text>`; }));
    S.forEach((st) => { const yl = (cols[0][st.k][0] + cols[0][st.k][1]) / 2, yr = (cols[xs.length - 1][st.k][0] + cols[xs.length - 1][st.k][1]) / 2;
      s += `<text x="${x0 - 12}" y="${yl + 4}" text-anchor="end" class="origin">${esc(st.origin)}</text><text x="${x1 + 16}" y="${yr - 2}" class="share-name">${esc(A.ancestry.streams[st.k].name)}</text><text x="${x1 + 16}" y="${yr + 15}" class="share-val">${fmt(st.lo, 1)}–${fmt(st.hi, 1)}%</text>`;
      s += `<rect x="${x1 - 3}" y="${cols[xs.length - 1][st.k][0]}" width="6" height="${cols[xs.length - 1][st.k][1] - cols[xs.length - 1][st.k][0]}" fill="var(--s-${st.k})"/>`; });
    s += `<line id="scrub-line" x1="${X(2000)}" x2="${X(2000)}" y1="20" y2="${H - 46}" stroke="var(--ink)" stroke-width="1.5"/><text x="${x1 + 16}" y="20" class="share-head">MODELLED TODAY</text><text x="${x0 - 12}" y="20" text-anchor="end" class="share-head">LITERATURE PAST</text></svg>`;
    const TL = A.knowledge.timeline;
    el.innerHTML = `<div class="eyebrow">Origins · river of ancestry</div><h1>Five streams, and how sure we are about each part</h1>
      <p class="lede">Read left to right. The <b>solid right edge</b> is modelled from your genome today. The <b>hatched, translucent past</b> is reconstruction from the ancient-DNA literature. Streams merge over <b>time windows</b>, never at exact dates. Drag the time scrubber and the map follows.</p>
      <div class="stage river-stage">${s}
        <div class="scrub"><label for="scrub" class="faint small">Time</label><input id="scrub" type="range" min="0" max="1000" value="1000" aria-describedby="scrub-out"/><output id="scrub-out" class="num">Today</output></div>
        <div class="legend small"><span><i style="background:var(--s-iranian)"></i>modelled present</span><span><i class="hatch-bg" style="background-color:var(--surface-2)"></i>literature-derived past</span><span><i style="background:var(--brass);opacity:.5"></i>admixture window (range, not a date)</span></div></div>
      <div class="river-ctx">
        <div class="ctx-card" aria-live="polite" id="ctx"></div>
        <div class="ctx-map" id="ctx-map"></div>
      </div>
      <div class="grid-3" style="margin-top:22px">
        <div class="mod" data-tier="C"><h4>Measured ${ev("anc.east")}</h4><p class="muted small">Share ranges come from IllustrativeDNA's two models; East Eurasian is cross-checked by eight independent models on your raw data.</p></div>
        <div class="mod" data-tier="D"><h4>Dated in your genome ${ev("anc.dating")}</h4><p class="muted small">Only one window comes from your own DNA: the East Eurasian Iron-Age layer (${dt ? `${yrs(dt.calendar_range[0])} – ${yrs(dt.calendar_range[1])}` : "—"}). All others are literature.</p></div>
        <div class="mod" data-tier="X"><h4>What it does not mean</h4><p class="muted small">A stream is ancestry, not a people you "were". Steppe ancestry does not make you Sintashta.</p></div>
      </div>`;
    const yearAt = (v) => { const f = v / 1000 * (ERAS.length - 1), i = Math.min(Math.floor(f), ERAS.length - 2); return Math.round(ERAS[i] + (f - i) * (ERAS[i + 1] - ERAS[i])); };
    const BM = window.BASEMAP, P = A.knowledge.places;
    function ctx(yr) {
      const t = [...TL].sort((a, b) => Math.abs(a.year - yr) - Math.abs(b.year - yr))[0];
      const active = Object.entries(ANCIENT_ERA).filter(([, [a, b]]) => yr >= a - 150 && yr <= b + 150).map(([n]) => n);
      const inWin = S.flatMap((st) => st.win.filter((w) => yr >= w[0] && yr <= w[1]).map((w) => [st.k, w]));
      $("#ctx", el).innerHTML = `<div class="eyebrow num">${yrs(yr)}</div><h3 class="serif" style="font-size:22px;margin:2px 0 6px">${esc(t.title)} ${tier(t.tier, false)}</h3><p class="muted small">${esc(t.text)}</p>
        ${inWin.length ? `<p class="small"><b>Mixing window open:</b> ${inWin.map(([k, w]) => `<span class="src-chip"><i class="swatch" style="background:var(--s-${k});width:9px;height:9px"></i> ${esc(w[2])}</span>`).join(" ")}</p>` : ""}
        <p class="small"><b>Ancient references from this era:</b> ${active.length ? active.map((n) => `<button class="link" data-goroute="tajik/${esc(n)}">${esc(n)}</button>`).join(" · ") : '<span class="faint">none among your closest matches</span>'}</p>`;
      const B = BM.bounds, px = (la, lo) => [((lo - B.lon0) / (B.lon1 - B.lon0)) * BM.width, ((B.lat1 - la) / (B.lat1 - B.lat0)) * BM.height];
      const [vx0, vy0] = px(47, 55), [vx1, vy1] = px(30, 85), k = (vx1 - vx0) / BM.width;
      let m = `<svg class="chart" viewBox="${vx0} ${vy0} ${vx1 - vx0} ${vy1 - vy0}" role="img" aria-label="Ancient references active around ${yrs(yr)}"><rect x="${vx0}" y="${vy0}" width="${vx1 - vx0}" height="${vy1 - vy0}" fill="var(--surface)"/>` + BM.countries.map((c) => `<path d="${c.d}" fill="var(--surface-2)" stroke="var(--rule)" stroke-width="${0.8 * k}"/>`).join("");
      Object.entries(ANCIENT_ERA).forEach(([n]) => { const ll = P.ancient[n]; if (!ll) return; const [x, y] = px(ll[0], ll[1]), on = active.includes(n), r = k * (on ? 11 : 6);
        m += `<path d="M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y}Z" fill="var(--s-oasis)" opacity="${on ? 0.9 : 0.15}" data-tip="${esc(tt(n, [["period", `${yrs(ANCIENT_ERA[n][0])} – ${yrs(ANCIENT_ERA[n][1])}`]]))}"/>`; });
      $("#ctx-map", el).innerHTML = m + `</svg>`; bindTips($("#ctx-map", el));
      $("#scrub-line", el).setAttribute("x1", X(yr)); $("#scrub-line", el).setAttribute("x2", X(yr));
      $("#scrub-out", el).textContent = yr >= 2000 ? "Today" : yrs(yr);
    }
    $("#scrub", el).addEventListener("input", (e) => ctx(yearAt(+e.target.value)));
    el.addEventListener("click", (e) => { const g = e.target.closest("[data-goroute]"); if (g) goRoute(g.dataset.goroute); });
    ctx(2000);
  };

  /* ---------- Lineages: coverage-aware tree + inheritance animation ---------- */
  RENDER.lineages = (el, arg) => {
    const y = A.haplogroups.y, mt = A.haplogroups.mt, N = A.knowledge.lineage_notes, nc = y.node_coverage || [];
    const tree = nc.map((n, i) => {
      const obs = n.observed_derived.length, tot = n.defining_snps, inferred = obs === 0;
      return `<li class="tnode ${inferred ? "inferred" : ""}"><button class="tn-btn" aria-expanded="false"><span class="tn-dot">${inferred ? "·" : "✓"}</span><span class="tn-name">${esc(n.node)}${n.node === "C1b1a1a" ? ` <span class="chip">= ${esc(y.yhaplo_23andme_label)} · you</span>` : ""}${n.node === "C1b1a1" ? ' <span class="faint small">(M356)</span>' : ""}</span>
        <span class="tn-cov">${covBar(obs, Math.max(tot, 1), "")}</span></button>
        <div class="tn-more" hidden><p class="small">${inferred ? `<b>Inferred, not observed.</b> None of this branch's ${tot} defining marker(s) are on your array; the placement follows from the branch below it.` : `<b>Observed:</b> <span class="mono">${esc(n.observed_derived.join(", "))}</span>${n.observed_ancestral.length ? ` · <b>ancestral (sub-branch absent):</b> <span class="mono">${esc(n.observed_ancestral.slice(0, 8).join(", "))}</span>` : ""}`}</p>
        <p class="faint small">${obs} of ${tot} branch-defining SNPs in ${esc(y.tree_version || "ISOGG 2016")} were directly observed.</p></div></li>`;
    }).join("");
    el.innerHTML = `<div class="eyebrow">Lineages</div><h1>Two threads, not two halves</h1>
      <p class="lede">Your Y chromosome and mtDNA each follow a single line back through time. Drag the generations slider: the number of ancestors doubles, while each lineage still traces exactly one of them.</p>
      <div class="stage gen-stage">
        <div class="gen-ctl"><label for="gen" class="faint small">Generations back</label><input id="gen" type="range" min="1" max="14" value="5"/><output id="gen-out" class="num big">5</output><button class="btn" id="gen-play" aria-label="Play generations animation">▶ Play</button></div>
        <div id="gen-viz" aria-live="polite"></div>
      </div>
      <div class="grid-2" style="margin-top:22px">
        <div class="mod" id="y"><div class="mod-h"><h3>Y chromosome · paternal line</h3>${ev("lin.y")}</div>
          <p class="muted small">${esc(N.y.summary)}</p>
          <ol class="ytree">${tree}
            <li class="tnode excluded"><div class="tn-btn static"><span class="tn-dot">✗</span><span class="tn-name">C2 (M217) → C-P39 "Native American", C-M48</span><span class="faint small">ancestral at M217: not your branch</span></div></li></ol>
          <div class="asym"><b>Asymmetry:</b> this is one paternal lineage, not a percentage of your ancestry.</div></div>
        <div class="mod" id="mt"><div class="mod-h"><h3>mtDNA · maternal line</h3>${ev("lin.mt")}</div>
          <p class="muted small">${esc(N.mt.summary)}</p>
          <div class="tree">${mt.path.map((s) => `<div class="node"><div class="dot">${s.support ? "✓" : "?"}</div><div><div class="name">${esc(s.node)} <span class="faint" style="font-weight:400">· ${s.support} derived, ${s.against} against</span></div><div class="sites">${s.sites.map((x) => `<span class="site ${x.state.startsWith("derived") ? "ok" : x.state.startsWith("complement") ? "flip" : x.state.startsWith("ancestral") ? "bad" : "no"}" data-tip="${esc(tt("mt " + x.pos, [["expected", x.expected], ["observed", x.observed || "not on array"], ["state", x.state]]))}">${x.pos}${esc(x.expected)}</span>`).join("")}</div></div></div>`).join("")}</div>
          <div class="legend small"><span class="site ok">derived</span><span class="site flip">opposite-strand read</span><span class="site no">not on array</span></div></div>
      </div>`;
    el.querySelectorAll(".tn-btn:not(.static)").forEach((b) => b.addEventListener("click", () => { const m = b.nextElementSibling; m.hidden = !m.hidden; b.setAttribute("aria-expanded", !m.hidden); }));
    const viz = $("#gen-viz", el);
    function drawGen(g) {
      const n = 2 ** g, show = Math.min(n, 1024), cols = Math.min(64, Math.ceil(Math.sqrt(show * 3.2))), cell = Math.max(3, Math.floor(640 / cols)), rows = Math.ceil(show / cols);
      const fib = (k) => { let a = 1, b = 1; for (let i = 0; i < k; i++) [a, b] = [b, a + b]; return a; };
      let sv = `<svg class="chart" viewBox="0 0 ${cols * cell} ${rows * cell}" style="max-height:340px" role="img" aria-label="${fmtNum(n)} ancestors at generation ${g}; Y and mtDNA each trace one">`;
      for (let i = 0; i < show; i++) {
        const x = (i % cols) * cell, yy = Math.floor(i / cols) * cell, isY = i === 0, isM = i === show - 1;
        sv += `<rect x="${x + 0.5}" y="${yy + 0.5}" width="${cell - 1}" height="${cell - 1}" rx="${cell > 6 ? 1.5 : 0}" fill="${isY ? "var(--s-iranian)" : isM ? "var(--s-east)" : "var(--surface-2)"}" ${isY || isM ? 'stroke="var(--ink)" stroke-width="1"' : ""}/>`;
      }
      sv += `</svg>`;
      const share = 100 / 2 ** g;
      viz.innerHTML = `<div class="gen-grid">${sv}</div><div class="gen-stats">
        <div><span class="num big">${fmtNum(n)}</span><span>genealogical ancestors${n > 1024 ? " (first 1,024 drawn)" : ""}</span></div>
        <div><span class="num big" style="color:var(--s-iranian)">1</span><span>traced by your Y (father's father's …)</span></div>
        <div><span class="num big" style="color:var(--s-east)">1</span><span>traced by your mtDNA (mother's mother's …)</span></div>
        <div><span class="num big">${fmtNum(fib(g))}</span><span>could have contributed to your X</span></div>
        <div><span class="num big">${share >= 0.01 ? share.toPrecision(2) : share.toExponential(1)}%</span><span>expected autosomal DNA from any one ancestor</span></div>
        ${g >= 8 ? `<p class="faint small">Beyond ~8–10 generations many genealogical ancestors pass on no detectable DNA at all, because chromosomes are inherited in a limited number of large pieces.</p>` : ""}</div>`;
      $("#gen-out", el).textContent = g;
    }
    const slider = $("#gen", el); slider.addEventListener("input", () => drawGen(+slider.value));
    $("#gen-play", el).addEventListener("click", () => {
      let g = 1; slider.value = 1; drawGen(1);
      if (RM) { slider.value = 10; return drawGen(10); }
      const t = setInterval(() => { g++; slider.value = g; drawGen(g); if (g >= 12) clearInterval(t); }, 520);
    });
    drawGen(5);
    if (arg === "mt" || arg === "y") setTimeout(() => $("#" + arg, el)?.scrollIntoView({ behavior: RM ? "auto" : "smooth" }), 60);
  };

  /* ---------- Genome browser: one coordinate system, lenses, semantic zoom ---------- */
  const LENSES = [["het", "Heterozygosity"], ["ancestry", "Ancestry"], ["roh", "ROH"], ["variants", "Variants"], ["density", "Marker density"], ["quality", "Data quality"]];
  RENDER.chromosomes = (el, arg) => {
    const parts = (arg || "").split("/");
    const B = { lens: B_lens(), chrom: parts[0] && A.chromosomes[parts[0]] ? parts[0] : null, focus: parts[1] || null };
    function B_lens() { try { return sessionStorage.getItem("atlas-lens") || "het"; } catch { return "het"; } }
    if (parts[0] === "roh") { B.lens = "roh"; B.chrom = null; }
    const sites = panelSites();
    const painting = Lx && Lx.painting ? Lx.painting.chromosomes : {};
    const binVal = (ch, i) => {
      const b = A.bins.data[ch];
      if (B.lens === "het") return b.markers[i] >= 10 ? [b.het[i] / b.markers[i], 0.06, 0.3] : [null];
      if (B.lens === "density") { const mx = Math.max(...b.all_markers); return [b.all_markers[i] / (mx || 1), 0, 1]; }
      if (B.lens === "quality") return b.all_markers[i] ? [b.nocall[i] / b.all_markers[i], 0, 0.12] : [null];
      if (B.lens === "ancestry") { const p = painting[ch]; if (!p) return [null]; const v = p.filter((r) => Math.floor(r[0] / 2) === i); return v.length ? [v.reduce((a, r) => a + r[3], 0) / v.length / 2, 0, 0.6] : [null]; }
      return [null];
    };
    const colorFor = (v, lo, hi) => {
      if (v == null) return "var(--surface-2)";
      const t = Math.max(0, Math.min(0.999, (v - lo) / (hi - lo)));
      if (B.lens === "ancestry") return `color-mix(in oklab, var(--s-east) ${Math.round(t * 100)}%, var(--s-iranian))`;
      if (B.lens === "quality") return `color-mix(in oklab, var(--critical) ${Math.round(t * 100)}%, var(--surface-2))`;
      return SEQ[Math.floor(t * 6)];
    };
    const LEGEND = { het: "heterozygosity per 2 Mb · low → high", ancestry: "East Eurasian share per 2 Mb (blue = West-Eurasian-related, pink = East Eurasian) · autosomes only · Tier D", roh: "runs of homozygosity ≥1.5 Mb", variants: "annotated loci (traits, drug response, health)", density: "markers per 2 Mb", quality: "no-call rate per 2 Mb" };
    function genome() {
      const Wd = 1000, lab = 44, rowH = 15, gap = 8, maxL = A.chromosomes["1"].length;
      let s = `<svg class="chart gb-genome" viewBox="0 0 ${Wd} ${CH.length * (rowH + gap) + 10}" role="img" aria-label="Whole genome, ${LENSES.find((l) => l[0] === B.lens)[1]} lens">`;
      CH.forEach((ch, r) => {
        const y = r * (rowH + gap) + 6, L = A.chromosomes[ch].length, w = ((Wd - lab - 10) * L) / maxL, bw = (w * A.bins.size) / L, n = A.bins.data[ch].markers.length;
        s += `<g class="gb-row" data-ch="${ch}" tabindex="0" role="button" aria-label="Chromosome ${ch}"><rect class="hit" x="0" y="${y - 3}" width="${Wd}" height="${rowH + 6}" fill="transparent"/><text x="${lab - 10}" y="${y + rowH - 3}" text-anchor="end" class="ch-name">${ch}</text><rect x="${lab}" y="${y}" width="${w}" height="${rowH}" rx="${rowH / 2}" fill="var(--surface-2)"/>`;
        if (!["roh", "variants"].includes(B.lens)) for (let i = 0; i < n; i++) { const x = lab + i * bw; if (x > lab + w) break; const [v, lo, hi] = binVal(ch, i); if (v == null) continue; s += `<rect x="${x.toFixed(1)}" y="${y + 1.5}" width="${Math.max(bw - 0.5, 0.6).toFixed(2)}" height="${rowH - 3}" fill="${colorFor(v, lo, hi)}"/>`; }
        const cx = lab + (w * A.chromosomes[ch].centromere) / L; s += `<rect x="${cx - 1}" y="${y - 2}" width="2" height="${rowH + 4}" fill="var(--ink-3)" opacity=".7"/>`;
        A.roh.segments.filter((g) => g.chrom === ch).forEach((g) => { s += `<rect x="${lab + (w * g.start) / L}" y="${B.lens === "roh" ? y + 1 : y + rowH + 1.5}" width="${Math.max((w * (g.end - g.start)) / L, 3)}" height="${B.lens === "roh" ? rowH - 2 : 3}" rx="1.5" fill="var(--roh)"/>`; });
        if (B.lens === "variants" || B.lens === "het") sites.filter((v) => v.chrom === ch).forEach((v) => { const x = lab + (w * v.pos) / L; s += `<path d="M${x - 3.5},${y - 5} L${x + 3.5},${y - 5} L${x},${y + 1} Z" fill="var(--ink)"/>`; });
        if (B.lens === "ancestry" && !painting[ch]) s += `<text x="${lab + w + 8}" y="${y + rowH - 3}" class="axis-n">not modelled</text>`;
        s += `</g>`;
      });
      return s + `</svg>`;
    }
    function chromosome(ch) {
      const L = A.chromosomes[ch].length, Wd = 1000, lab = 110, X = (p) => lab + ((Wd - lab - 20) * p) / L, b = A.bins.data[ch], bs = A.bins.size, n = b.markers.length;
      const tracks = [["Ideogram", 22], ["Heterozygosity", 70], ["Ancestry", 26], ["ROH", 16], ["Data quality", 18], ["Variants", 46]];
      let y = 8, s = `<svg class="chart gb-chrom" viewBox="0 0 ${Wd} ${tracks.reduce((a, t) => a + t[1] + 14, 30)}" role="img" aria-label="Chromosome ${ch} tracks">`;
      const trk = (name, h, body, lensKey) => { const on = !lensKey || lensKey === B.lens; const g = `<g class="trk ${on ? "" : "trk-dim"}"><text x="${lab - 12}" y="${y + h / 2 + 4}" text-anchor="end" class="trk-name">${name}</text>${body(y, h)}</g>`; y += h + 14; return g; };
      s += trk("Chromosome " + ch, 22, (y0, h) => { let o = `<rect x="${lab}" y="${y0}" width="${Wd - lab - 20}" height="${h}" rx="${h / 2}" fill="var(--surface-2)"/>`; for (let i = 0; i < n; i++) { const [v, lo, hi] = binVal(ch, i); if (v != null) o += `<rect x="${X(i * bs)}" y="${y0 + 2}" width="${Math.max(X(bs) - X(0) - 0.5, 0.6)}" height="${h - 4}" fill="${colorFor(v, lo, hi)}"/>`; } return o + `<rect x="${X(A.chromosomes[ch].centromere) - 1.5}" y="${y0 - 3}" width="3" height="${h + 6}" fill="var(--ink-3)"/>`; });
      s += trk("Heterozygosity", 70, (y0, h) => { let d = "", pen = false, o = `<line x1="${lab}" x2="${Wd - 20}" y1="${y0 + h}" y2="${y0 + h}" stroke="var(--rule)"/>`; for (let i = 0; i < n; i++) { const v = b.markers[i] >= 10 ? b.het[i] / b.markers[i] : null; if (v == null) { pen = false; continue; } d += (pen ? "L" : "M") + X(i * bs + bs / 2).toFixed(1) + "," + (y0 + h - (v / 0.4) * h).toFixed(1); pen = true; o += `<rect x="${X(i * bs)}" y="${y0}" width="${X(bs) - X(0)}" height="${h}" fill="transparent" data-tip="${esc(tt(`chr${ch}:${i * 2}–${i * 2 + 2} Mb`, [["SNVs", fmtNum(b.markers[i])], ["heterozygous", pct(v)]]))}"/>`; } return o + `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.8"/>`; }, "het");
      s += trk("Ancestry", 26, (y0, h) => { const p = painting[ch]; if (!p) return `<text x="${lab}" y="${y0 + 16}" class="axis-n">Not modelled for ${ch === "X" || ch === "Y" ? "sex chromosomes" : "this chromosome"} · Lab painting covers autosomes</text>`; return p.map((r) => `<rect x="${X(r[0] * 1e6)}" y="${y0}" width="${Math.max(X(1e6) - X(0), 1)}" height="${h}" fill="color-mix(in oklab, var(--s-east) ${Math.round(Math.min(r[1], 1) * 100)}%, var(--s-iranian))" opacity="${0.35 + 0.65 * Math.abs(r[1] - 0.5) * 2}" data-tip="${esc(tt(`chr${ch}:${r[0]}–${r[0] + 1} Mb`, [["P(≥1 East Eurasian copy)", pct(r[1], 0)], ["opacity", "= model certainty"]]))}"/>`).join(""); }, "ancestry");
      s += trk("ROH", 16, (y0, h) => A.roh.segments.filter((g) => g.chrom === ch).map((g) => `<rect x="${X(g.start)}" y="${y0}" width="${Math.max(X(g.end) - X(g.start), 3)}" height="${h}" rx="3" fill="var(--roh)" data-tip="${esc(tt("Run of homozygosity", [["span", `${fmtNum(g.start)}–${fmtNum(g.end)}`], ["length", g.length_mb + " Mb"]]))}"/>`).join("") || `<text x="${lab}" y="${y0 + 12}" class="axis-n">none ≥1.5 Mb</text>`, "roh");
      s += trk("Data quality", 18, (y0, h) => { let o = ""; for (let i = 0; i < n; i++) { const v = b.all_markers[i] ? b.nocall[i] / b.all_markers[i] : null; if (v != null) o += `<rect x="${X(i * bs)}" y="${y0}" width="${Math.max(X(bs) - X(0) - 0.5, 0.6)}" height="${h}" fill="color-mix(in oklab, var(--critical) ${Math.round(Math.min(v / 0.12, 1) * 100)}%, var(--surface-2))" data-tip="${esc(tt(`chr${ch}:${i * 2}–${i * 2 + 2} Mb`, [["markers", fmtNum(b.all_markers[i])], ["no-calls", pct(v)]]))}"/>`; } return o; }, "quality");
      s += trk("Variants", 46, (y0, h) => sites.filter((v) => v.chrom === ch).map((v, i) => { const x = X(v.pos), yy = y0 + 8 + (i % 3) * 12; return `<g class="vpin" data-focus="${esc(v.rsid)}" tabindex="0" role="button" aria-label="${esc(v.rsid)} ${esc(v.gene)}"><line x1="${x}" x2="${x}" y1="${y0}" y2="${y0 + h}" stroke="var(--ink)" stroke-opacity=".35"/><circle cx="${x}" cy="${yy}" r="5.5" fill="var(--ink)"/><text x="${x + 8}" y="${yy + 4}" class="vlbl">${esc(v.gene)}</text></g>`; }).join("") || `<text x="${lab}" y="${y0 + 16}" class="axis-n">no curated loci on this chromosome</text>`, "variants");
      for (let m = 0; m <= L; m += 25e6) if (X(m) < Wd - 48) s += `<text x="${X(m)}" y="${y + 6}" text-anchor="middle" class="axis-n num">${m / 1e6}</text>`;
      return s + `<text x="${Wd - 20}" y="${y + 6}" text-anchor="end" class="axis-n">Mb</text></svg>`;
    }
    async function region(ch, rsid) {
      const v = sites.find((x) => x.rsid === rsid); if (!v) return "";
      const span = 2e6, a = Math.max(0, v.pos - span), bnd = v.pos + span, Wd = 1000, X = (p) => 40 + ((Wd - 80) * (p - a)) / (bnd - a);
      let dots = "";
      const g = await (window.atlasGenome ? window.atlasGenome() : null);
      if (g) {
        let n = 0; for (const [, rec] of g) { if (rec[1] === ch && rec[2] >= a && rec[2] <= bnd) { n++; const gt = rec[3], het = gt.length === 2 && gt[0] !== gt[1], nc = gt === "--"; dots += `<circle cx="${X(rec[2])}" cy="${het ? 44 : 64}" r="2.2" fill="${nc ? "var(--critical)" : het ? "var(--accent)" : "var(--ink-3)"}" opacity=".7"/>`; } }
        dots += `<text x="40" y="20" class="axis-n">${fmtNum(n)} of your markers in this 4 Mb window · upper row heterozygous, lower homozygous</text>`;
      } else dots = `<text x="40" y="52" class="axis-n">Individual markers appear in atlas_full.html (the genome is bundled there, still offline).</text>`;
      const near = sites.filter((x) => x.chrom === ch && x.pos >= a && x.pos <= bnd);
      let s = `<svg class="chart gb-region" viewBox="0 0 ${Wd} 160" role="img" aria-label="Region around ${esc(rsid)}">${dots}
        <line x1="40" x2="${Wd - 40}" y1="96" y2="96" stroke="var(--rule)" stroke-width="2"/>
        ${near.sort((p1, p2) => p1.pos - p2.pos).map((x, i, arr) => { const crowd = i > 0 && X(x.pos) - X(arr[i - 1].pos) < 70 && i % 2 === 1, yb = crowd ? 110 : 84;
          return `<g class="vpin" data-focus="${esc(x.rsid)}" tabindex="0" role="button" aria-label="${esc(x.gene)} ${esc(x.rsid)}"><line x1="${X(x.pos)}" x2="${X(x.pos)}" y1="96" y2="${yb + (crowd ? 0 : 20)}" stroke="var(--ink-3)"/><rect x="${X(x.pos) - 34}" y="${yb}" width="68" height="20" rx="4" fill="${x.rsid === rsid ? "var(--brass)" : "var(--surface-2)"}" stroke="var(--rule)"/><text x="${X(x.pos)}" y="${yb + 14}" text-anchor="middle" class="vlbl" style="${x.rsid === rsid ? "fill:var(--surface);font-weight:700" : ""}">${esc(x.gene.split(" ")[0].split("/")[0])}</text></g>`; }).join("")}
        <text x="40" y="152" class="axis-n num">${(a / 1e6).toFixed(1)} Mb</text><text x="${Wd - 40}" y="152" text-anchor="end" class="axis-n num">${(bnd / 1e6).toFixed(1)} Mb</text>
        <text x="${Wd / 2}" y="152" text-anchor="middle" class="axis-n">Gene boxes are curated loci only; a full gene annotation track is not bundled.</text></svg>`;
      const cid = CL["trait." + rsid] ? "trait." + rsid : CL["health." + rsid] ? "health." + rsid : CL["pgx." + v.gene] ? "pgx." + v.gene : null;
      return `${s}<div class="var-card"><div><div class="eyebrow">Variant</div><div class="mono big">${esc(v.rsid)}</div><div class="faint small mono">chr${esc(ch)}:${fmtNum(v.pos)} · ${esc(A.meta.dataset.build)} · ${esc(v.gene)}</div></div>
        <div><div class="eyebrow">Your genotype</div>${gtHtml(v)}</div><div class="grow"><div class="eyebrow">Interpretation</div><div>${esc(v.answer || v.reading || v.function || v.condition || "")}</div></div><div>${cid ? ev(cid) : ""}</div></div>`;
    }
    async function draw(animateFrom) {
      const crumbs = [`<button class="crumb" data-z="genome">Genome</button>`];
      if (B.chrom) crumbs.push(`<button class="crumb" data-z="chrom">Chromosome ${B.chrom}</button>`);
      if (B.focus) { const v = sites.find((x) => x.rsid === B.focus); crumbs.push(`<span class="crumb cur">${esc(v ? v.gene : "")} · <span class="mono">${esc(B.focus)}</span></span>`); }
      el.innerHTML = `<div class="eyebrow">Genome browser</div><h1>${B.focus ? "Down to the variant" : B.chrom ? `Chromosome ${B.chrom}` : "One genome, many lenses"}</h1>
        <p class="lede">${B.focus ? "Your raw genotype in its genomic neighbourhood. Open the evidence for the full chain from marker to interpretation." : B.chrom ? "Every track shares this coordinate system. The active lens is emphasised. Select a variant to zoom to its region." : "The same chromosomes, re-coloured by the question you ask. Select a chromosome to zoom in."}</p>
        <div class="toolbar"><nav class="crumbs" aria-label="Zoom level">${crumbs.join('<span class="sep">›</span>')}</nav>
          <div class="seg-ctl" role="radiogroup" aria-label="Lens">${LENSES.map(([k, n]) => `<button role="radio" aria-checked="${B.lens === k}" data-lens="${k}">${n}</button>`).join("")}</div></div>
        <div class="stage gb-stage"><div class="gb-legend small faint">${esc(LEGEND[B.lens])}</div><div id="gb-view">${B.focus ? "" : B.chrom ? chromosome(B.chrom) : genome()}</div></div>
        ${!B.chrom ? `<div class="grid-3" style="margin-top:18px"><div class="mod"><h4>Runs of homozygosity ${ev("gen.roh")}</h4><p class="muted small">${A.roh.summary.segments} runs, ${A.roh.summary.total_mb} Mb in total; none over 5 Mb.</p></div><div class="mod"><h4>Data quality ${ev("gen.dataset")}</h4><p class="muted small">${(A.qc.no_call_rate * 100).toFixed(2)}% no-calls genome-wide. Switch to the Data quality lens to see where.</p></div><div class="mod"><h4>Ancestry lens ${Lx ? ev("anc.dating") : ""}</h4><p class="muted small">From the Lab's local-ancestry model. Exploratory (Tier D); sex chromosomes are not modelled.</p></div></div>` : ""}`;
      if (B.focus) $("#gb-view", el).innerHTML = await region(B.chrom, B.focus);
      bindTips(el);
      el.querySelectorAll("[data-lens]").forEach((b) => b.addEventListener("click", () => { B.lens = b.dataset.lens; try { sessionStorage.setItem("atlas-lens", B.lens); } catch {} draw(); }));
      el.querySelectorAll(".gb-row").forEach((r) => { const z = () => zoomTo(r); r.addEventListener("click", z); r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); z(); } }); });
      el.querySelectorAll(".vpin").forEach((p) => { const f = () => { B.focus = p.dataset.focus; B.chrom = B.chrom || sites.find((x) => x.rsid === B.focus)?.chrom; setRoute("chromosomes", `${B.chrom}/${B.focus}`); draw(); }; p.addEventListener("click", f); p.addEventListener("keydown", (e) => { if (e.key === "Enter") f(); }); });
      el.querySelectorAll("[data-z]").forEach((c) => c.addEventListener("click", () => { if (c.dataset.z === "genome") { B.chrom = null; B.focus = null; setRoute("chromosomes", null); } else { B.focus = null; setRoute("chromosomes", B.chrom); } draw(); }));
      if (animateFrom && !RM) {
        const target = $("#gb-view", el).getBoundingClientRect();
        const sx = animateFrom.width / target.width, sy = animateFrom.height / target.height;
        $("#gb-view", el).animate([{ transformOrigin: "0 0", transform: `translate(${animateFrom.left - target.left}px, ${animateFrom.top - target.top}px) scale(${sx}, ${sy})`, opacity: 0.4 }, { transformOrigin: "0 0", transform: "none", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    }
    function zoomTo(row) {
      const ch = row.dataset.ch, from = row.getBoundingClientRect();
      if (!RM) { $$(".gb-row", el).forEach((r) => r !== row && r.classList.add("recede")); }
      setTimeout(() => { B.chrom = ch; B.focus = null; setRoute("chromosomes", ch); draw(from); }, RM ? 0 : 200);
    }
    draw();
  };

  /* ---------- Traits: answer → mechanism → evidence ---------- */
  RENDER.traits = (el, arg) => {
    const cats = [...new Set(A.traits.map((t) => t.category))];
    const card = (t) => {
      const m = t.mechanism;
      return `<article class="trait2" id="t-${t.rsid}" data-tier="${t.tier}">
        <div class="t-l1"><div class="eyebrow">${esc(t.trait)}</div><div class="answer">${t.answer ? esc(t.answer) : '<span class="faint">No answer: ' + esc(t.genotype ? t.status : "not on your array") + "</span>"}</div>
          <div class="t-meta">${t.confidence ? `<span class="conf" data-c="${esc(t.confidence)}">${esc(t.confidence)}</span>` : ""}${m && /polygen|minority|small|modest|very small/i.test(m.explained) ? `<span class="tag">Polygenic: one locus of many</span>` : ""}${ev("trait." + t.rsid)}</div></div>
        ${m ? `<ol class="mech" aria-label="Biological mechanism">
            <li class="mech-geno"><span class="mono">${esc(t.gene)} · ${esc(t.rsid)}</span>${t.genotype ? `<span class="gt-inline">${gtHtml(t)}</span>` : ""}</li>
            ${m.chain.slice(1).map((c, i, arr) => `<li class="${i === arr.length - 1 ? "mech-out" : ""}">${esc(c)}</li>`).join("")}</ol>
          <p class="faint small">This locus explains ${esc(m.explained)}.</p>` : ""}
      </article>`;
    };
    el.innerHTML = `<div class="eyebrow">Body · traits</div><h1>From genotype to biology</h1>
      <p class="lede">Each trait leads with the answer, then shows the biological path from your genotype to the trait, and says how much of the trait that one locus explains.</p>
      <div class="toolbar"><button class="btn" data-go="guesses">Combined predictions →</button></div>
      ${cats.map((c) => `<h2>${esc(c)}</h2><div class="traits-grid">${A.traits.filter((t) => t.category === c).map(card).join("")}</div>`).join("")}`;
    if (arg) setTimeout(() => { const t = $("#t-" + CSS.escape(arg), el); if (t) { t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); t.classList.add("flash"); } }, 80);
  };

  /* ---------- Health & PGx: inspectable pipeline, coverage, first-class "not assessable" ---------- */
  RENDER.health = (el, arg) => {
    const ap = A.health.apoe, pg = A.pgx.summary;
    const allSites = pg.flatMap((p) => (p.coverage || {}).sites || []);
    const obs = allSites.filter((s) => s.status === "observed").length, na = allSites.filter((s) => s.status === "not_assayed").length;
    const phased = pg.filter((p) => /phase assumed/.test(p.caveat) || p.diplotype.includes("*1/*2")).length;
    const pipe = (p) => {
      const cov = p.coverage || { sites: [] };
      return `<article class="pgx" id="g-${esc(p.gene)}" data-tier="${p.tier}">
        <div class="pgx-l1"><div><div class="eyebrow">${esc(p.gene)}</div><div class="answer">${esc(p.phenotype)}</div><div class="faint small">Relevant to ${esc(p.drugs)}</div></div><div class="pgx-ev">${covBar(cov.observed, cov.total, "alleles assayed")}${ev("pgx." + p.gene)}</div></div>
        <ol class="pipeline" aria-label="From raw DNA to guideline">
          <li><span class="pl-k">Raw DNA</span><span class="pl-v">${cov.sites.map((s) => `<span class="site ${s.status === "observed" ? (s.variant_copies ? "hit" : "ok") : "no"}" title="${esc(s.allele)} · ${esc(s.rsid)}">${esc(s.allele.split(" ")[0])} <span class="mono">${esc(s.genotype || "—")}</span></span>`).join("")}</span></li>
          <li><span class="pl-k">Star alleles</span><span class="pl-v">${cov.sites.filter((s) => s.variant_copies && s.role !== "tag").map((s) => esc(s.allele)).join(", ") || "no variant allele detected"}</span></li>
          <li><span class="pl-k">Diplotype</span><span class="pl-v mono">${esc(p.diplotype)}</span></li>
          <li><span class="pl-k">Phenotype</span><span class="pl-v">${esc(p.phenotype)}</span></li>
          <li><span class="pl-k">Guideline</span><span class="pl-v">CPIC (discuss with a prescriber; no action taken here)</span></li></ol>
        <p class="faint small">${esc(p.caveat)}</p></article>`;
    };
    el.innerHTML = `<div class="eyebrow">Body · health & drug response</div><h1>Deep before broad</h1>
      <div class="notice"><strong>Educational genomic analysis, not a clinical diagnosis.</strong> Consumer arrays have high false-positive rates for rare variants. Do not change any medication based on this page.</div>
      <div class="tri" role="list" aria-label="Coverage summary">
        <div role="listitem"><span class="num big">${obs}</span><span>directly observed<br>drug-response alleles</span></div>
        <div role="listitem"><span class="num big">${phased}</span><span>calls that assume<br>phase (inferred)</span></div>
        <div role="listitem"><span class="num big">${na}</span><span>important alleles<br>not assayed</span></div>
        <div role="listitem"><span class="num big">${A.pgx.not_assessable.length}</span><span>genes not assessable<br>from an array</span></div></div>
      <h2>Drug response</h2>
      <div class="pgx-list">${pg.map(pipe).join("")}</div>
      <h2>Not assessable from this data</h2>
      <p class="muted">These are results in their own right: we <em>could not adequately check</em>, which is different from "we checked and found nothing".</p>
      <div class="unavail-grid">${A.pgx.not_assessable.map((n) => `<div class="unavail"><div class="u-k">${/HLA/.test(n.gene) ? "HLA typing unavailable" : /CYP2D6/.test(n.gene) ? "Structural variant not assayed" : "Repeat not assayed"}</div><h3>${esc(n.gene)}</h3><p class="muted small">${esc(n.reason)}</p><div class="u-next">Next data source → <b>clinical pharmacogenomic panel</b></div></div>`).join("")}
        ${A.health.not_assessed.map((t, i) => `<div class="unavail"><div class="u-k">Not comprehensively assessed</div><h3>${esc(t.split(":")[0])}</h3><p class="muted small">${esc(t.split(":").slice(1).join(":").trim())}</p><div class="u-next">Next data source → <b>clinical sequencing</b></div>${ev("health.na." + i)}</div>`).join("")}</div>
      <h2>Variants with established associations</h2>
      <div class="health-list">${A.health.sites.map((h) => `<article class="hrow" id="g-${esc(h.rsid)}" data-tier="${h.tier}"><div><div class="eyebrow">${esc(h.gene)} · ${esc(h.variant)}</div><div class="answer small-a">${esc(h.condition)}</div></div>
        <div>${h.genotype ? gtHtml(h) : `<span class="u-k">Not on this array</span>`}</div><div class="muted small">${esc(h.reading || "Absence of data is not absence of risk.")}</div><div>${ev("health." + h.rsid)}</div></article>`).join("")}</div>
      <h2>APOE</h2>
      <div class="mod"><p class="muted small">${esc(ap.note || "")}</p><button class="reveal-btn" id="apoe-btn">I understand. Show my APOE result</button>
        <div id="apoe" class="hidden" style="margin-top:14px"><div class="gt">${esc(ap.genotype || ap.status)}</div><p class="muted small">rs429358 ${esc(ap.rs429358)} · rs7412 ${esc(ap.rs7412)}. ε3/ε3 is the most common genotype and the population-average reference. ${ev("health.apoe")}</p></div></div>`;
    $("#apoe-btn", el).addEventListener("click", (e) => { $("#apoe", el).classList.remove("hidden"); e.target.remove(); });
    if (arg) setTimeout(() => { const t = $("#g-" + CSS.escape(arg), el); if (t) { t.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); t.classList.add("flash"); } }, 80);
  };

  /* ---------- Method: add "What changed" ---------- */
  const methodBase = RENDER.method;
  RENDER.method = (el) => {
    methodBase(el);
    const ch = A.changes || { items: [] };
    const box = document.createElement("div");
    box.className = "mod";
    box.innerHTML = `<h3>What changed since the previous build</h3>
      ${ch.baseline ? `<p class="muted small">This is the first build, so it is the <b>baseline</b>. Every later build compares its ${Object.keys(CL).length} claims against it and labels each one <b>New</b>, <b>Changed</b>, <b>Higher / lower confidence</b> or <b>Now assessable</b>.</p>`
        : ch.items.length ? `<ul class="changes">${ch.items.map((i) => `<li><span class="tag ${i.kind.includes("HIGHER") || i.kind.includes("NOW") ? "ok" : i.kind.includes("LOWER") || i.kind === "REMOVED" ? "warn" : ""}">${esc(i.kind)}</span> <button class="link" data-claim="${esc(i.id)}">${esc(CL[i.id]?.title || i.id)}</button>${i.before ? ` <span class="faint small">${esc(i.before)} → ${esc(i.after || "")}</span>` : ""}</li>`).join("")}</ul>`
        : `<p class="muted small">No claim changed since build ${esc(ch.previous || "")}. Snapshots live in <span class="mono">data/processed/history/</span>.</p>`}
      <p class="faint small">Each claim carries a fingerprint of its answer, tier, coverage and interval. That is how changes are detected.</p>`;
    el.appendChild(box);
    const k = document.createElement("div");
    k.className = "mod";
    k.innerHTML = `<h3>Keyboard</h3><p class="muted small"><kbd>/</kbd> or <kbd>⌘K</kbd> search · <kbd>Esc</kbd> close · <kbd>Tab</kbd> moves through every chart point · <kbd>Enter</kbd> selects. Every URL is shareable locally, e.g. <span class="mono">#chromosomes/15/rs12913832</span>.</p>`;
    el.appendChild(k);
  };

  /* ---------------- boot ---------------- */
  buildNav(); theme(); lens();
  const searchBtn = document.createElement("button");
  searchBtn.className = "search-btn"; searchBtn.innerHTML = `<span aria-hidden="true">⌕</span> Search <kbd>/</kbd>`; searchBtn.setAttribute("aria-label", "Search the atlas");
  searchBtn.addEventListener("click", openSearch);
  $("#nav-links").before(searchBtn);
  $("#main").innerHTML = `<header id="chapter-head"></header>` + CHAPTERS.flatMap((c) => c.subs).map(([id]) => `<section class="page" id="${id}" tabindex="-1"></section>`).join("");
  const r0 = parseRoute();
  let start = r0 || { sub: "portrait", arg: null };
  if (!r0) { try { start.sub = sessionStorage.getItem("atlas-view") || "portrait"; } catch {} }
  go(start.sub, start.arg, { replace: true });
})();
