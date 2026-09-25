"""Claim / provenance registry, entity index, and version diff.

Every important result in the atlas becomes a machine-readable claim. The interface renders
claims at three depths (understand -> explore -> inspect) from this one substrate, and the
build compares claims against the previous snapshot to report what changed.

Nothing here computes new science: it restructures results already produced by analyze/lab,
and states explicitly what is missing.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

TIER_ORDER = {"A": 4, "B": 3, "C": 2, "D": 1, "X": 0}
COVERAGE_ORDER = {"unavailable": 0, "sparse": 1, "partial": 2, "complete": 3}


def _yr(y: int) -> str:
    return f"{-y} BCE" if y < 0 else f"AD {y}"


def claim(cid, title, answer, category, tier, route, *, prov, observed=(), transformation=(), inference=None,
          coverage=None, transfer=None, uncertainty=None, missing=(), would_change=(), dependencies=(),
          citations=(), entities=(), explore=None):
    return {
        "id": cid, "title": title, "answer": answer, "category": category, "tier": tier, "route": route,
        "provenance": prov, "observed": list(observed), "transformation": list(transformation),
        "inference": inference or {"strength": "direct", "method": "read directly"},
        "coverage": coverage or {"status": "complete"},
        "populationTransferability": transfer or {"status": "not_applicable"},
        "uncertainty": uncertainty or {}, "missing": list(missing), "wouldChange": list(would_change),
        "dependencies": list(dependencies), "citations": list(citations), "entities": list(entities),
        "explore": explore,
    }


def build(data: dict) -> tuple[dict, list]:
    meta = data["meta"]["dataset"]
    RAW = {"type": "raw_genotype", "source": f"23andMe raw data · {meta['file']}", "sourceVersion": f"{meta['chip']} · {meta['build']} · sha256 {meta['sha256'][:12]}",
           "importedAt": "2026-09-25"}
    DER = dict(RAW, type="derived_raw")
    C: dict[str, dict] = {}

    def add(c):
        C[c["id"]] = c

    q = data["qc"]
    # ------------------------------------------------------------ genome
    add(claim("gen.dataset", "What your raw file contains", f"{q['markers']:,} markers on all 22 autosomes, X, Y and mtDNA", "Genome", "A", "quality",
              prov=RAW, observed=[("Markers", f"{q['markers']:,}"), ("No-call rate", f"{q['no_call_rate']*100:.2f}%"), ("Build", meta["build"]), ("SHA-256", meta["sha256"])],
              transformation=["23andMe export", "parsed & allele-validated", "QC metrics"],
              coverage={"status": "partial", "measured": q["markers"], "required": 3_100_000_000, "unit": "positions of ~3.1 billion",
                        "note": "A genotyping array reads ~0.02% of the genome: chosen common variants, not the sequence."},
              missing=["Rare variants not on the chip", "Structural variants and repeats", "Phase (which parent each allele came from)"],
              would_change=["Whole-genome sequencing (≈30× coverage) would read nearly every position"], entities=["concept:array"]))
    add(claim("gen.build", "Genome build", f"{meta['build']}, verified", "Genome", "A", "quality", prov=RAW,
              observed=[(e, "") for e in meta["build_evidence"]], transformation=["header claim", "cross-checked against anchor SNP coordinates"],
              inference={"strength": "direct", "method": "anchor-SNP coordinate check"}, entities=["concept:grch37"]))
    sx = q["sex_chromosome_evidence"]
    add(claim("gen.sex", "Chromosomal sex", "XY", "Genome", "A", "quality", prov=RAW,
              observed=[("Y calls", f"{sx['y_called']:,}"), ("X heterozygosity (excl. PAR)", str(sx["x_heterozygosity_excl_PAR"]))],
              transformation=["count Y calls", "X heterozygosity outside pseudoautosomal regions"]))
    r = data["roh"]["summary"]
    add(claim("gen.roh", "Runs of homozygosity", f"No runs over 5 Mb; {r['segments']} short runs ({r['total_mb']} Mb)", "Genome", "B", "chromosomes/roh",
              prov=DER, observed=[("Segments ≥1.5 Mb", r["segments"]), ("Total", f"{r['total_mb']} Mb"), ("Longest", f"{r['longest_mb']} Mb"), ("F_ROH", r["froh"])],
              transformation=["called autosomal SNVs", "sliding-window homozygosity scan (PLINK-style)", "segments ≥1.5 Mb"],
              inference={"strength": "validated", "method": r["method"]},
              coverage={"status": "partial", "note": "Array spacing (~5 kb) limits detection below ~1.5 Mb."},
              uncertainty={"caveat": "Short runs near centromeres are common in everyone."},
              would_change=["Whole-genome sequencing would detect shorter runs"],
              dependencies=["gen.dataset"], citations=["Purcell et al. 2007 (PLINK)", "Ceballos et al. 2018 Nat Rev Genet"], entities=["concept:roh"]))

    # ------------------------------------------------------------ lineages
    y = data["haplogroups"]["y"]
    if y.get("status") == "ok":
        nc = y["node_coverage"]
        obs_n = sum(len(n["observed_derived"]) for n in nc)
        tot_n = sum(n["defining_snps"] for n in nc)
        add(claim("lin.y", "Paternal lineage (Y-DNA)", f"{y['yhaplo_ycc']} · {y['yhaplo_23andme_label']}", "Lineages", "A", "lineages/y",
                  prov=DER, observed=[("Y calls used", f"{y['y_markers_used']:,}")] + [(n["node"], ", ".join(n["observed_derived"]) or "— none on array")
                                                                               for n in nc],
                  transformation=["Y-chromosome genotypes", "matched against ISOGG 2016 tree (yhaplo)", "deepest branch with derived SNPs"],
                  inference={"strength": "validated", "method": "23andMe yhaplo, run locally; agrees with 23andMe's report"},
                  coverage={"status": "sparse", "measured": obs_n, "required": tot_n, "unit": "branch-defining SNPs on your path",
                            "note": "C1b1a1 (M356) has no marker on the array; its placement is inferred from the downstream branch."},
                  uncertainty={"caveat": "Terminal placement is limited by array resolution; sub-branches below C1b1a1a are invisible."},
                  missing=["Most branch-defining SNPs", "Branch age estimates (need a dated tree such as YFull)", "Ancient samples sharing your branch (not bundled)"],
                  would_change=["Y-chromosome sequencing (e.g. Big Y) would resolve sub-branches and dates"],
                  dependencies=["gen.dataset"], citations=["Poznik et al. 2016 (yhaplo)", "ISOGG Y-DNA tree 2016"],
                  entities=["hg:C1b1a1a", "hg:C-P92", "chrom:Y"]))
    mt = data["haplogroups"]["mt"]
    sup = sum(s["support"] for s in mt["path"])
    tested = sum(1 for s in mt["path"] for x in s["sites"] if x["observed"] not in (None, "--"))
    total = sum(len(s["sites"]) for s in mt["path"])
    add(claim("lin.mt", "Maternal lineage (mtDNA)", f"{mt['reported']}: supported by {sup} diagnostic markers", "Lineages", "A", "lineages/mt",
              prov={"type": "vendor_result", "source": "23andMe maternal haplogroup (your statement) + raw mtDNA check", "sourceVersion": "PhyloTree build 17 positions", "importedAt": "2026-09-25"},
              observed=[(f"{s['node']}", ", ".join(f"{x['pos']}{x['expected']}→{x['observed'] or '·'}" for x in s["sites"])) for s in mt["path"]],
              transformation=["23andMe reports T1", "raw mtDNA calls checked at diagnostic positions", "path R → JT → T → T1 supported"],
              inference={"strength": "validated", "method": "diagnostic-position check against PhyloTree"},
              coverage={"status": "partial", "measured": tested, "required": total, "unit": "diagnostic positions tested"},
              uncertainty={"caveat": "Two positions read on the opposite strand; sub-branch of T1 unresolved."},
              would_change=["Full mitochondrial sequencing would give the exact T1 sub-branch"], entities=["hg:T1", "chrom:MT"]))
    add(claim("lin.x", "Your X chromosome came from your mother", "100% maternal", "Lineages", "A", "lineages/parents", prov=RAW,
              observed=[("X markers", f"{q['per_chromosome']['X']['markers']:,}"), ("X heterozygosity outside PAR", "0")],
              transformation=["XY confirmed", "males inherit their only X from their mother"], dependencies=["gen.sex"], entities=["chrom:X"]))
    add(claim("lin.autosomes", "Which parent gave each autosomal segment", "Not assessable from this file", "Lineages", "A", "lineages/parents", prov=RAW,
              coverage={"status": "unavailable", "note": "Genotypes are unphased."}, inference={"strength": "exploratory", "method": "—"},
              would_change=["A parent's DNA (trio phasing)", "Phased relative matches", "23andMe Parental Inheritance report"]))

    # ------------------------------------------------------------ ancestry
    lab = data.get("lab")
    SVC = "vendor_result"
    rep = data["reported"]
    for d in rep["distances"]:
        pid = f"pop:{d['set']}:{d['population']}"
        add(claim(f"anc.dist.{d['set']}.{d['rank']}", f"Genetic distance to {d['population']}", f"{d['distance']} (#{d['rank']} {d['set']})", "Ancestry",
                  "A" if d["method"] == "screenshot" else "C", f"tajik/{d['population']}",
                  prov={"type": SVC, "source": "IllustrativeDNA · Closest populations", "sourceVersion": "screenshot" if d["method"] == "screenshot" else "your text summary (unverified)", "importedAt": "2026-09-25"},
                  observed=[("Distance", str(d["distance"])), ("Rank", f"#{d['rank']}")],
                  transformation=["IllustrativeDNA computes a distance between your coordinates and a reference average"],
                  inference={"strength": "model_dependent", "method": "G25-style distance (vendor)"},
                  transfer={"status": "direct" if "Tajik" in d["population"] else "adjacent", "referencePopulation": d["population"]},
                  uncertainty={"caveat": "Similarity within one vendor's model, not ethnicity or descent. Sample sizes of references are not published in your results."},
                  missing=["Reference sample size", "Your raw coordinates (G25)", "Garm/Rasht reference population"],
                  would_change=["Your G25 coordinates would allow an independent PCA and distance check", "A larger Central Asian reference set"],
                  entities=[pid]))
    east_d = next(x for x in data["ancestry"]["disagreements"] if x["topic"].startswith("East"))
    add(claim("anc.services", "Why the three services disagree", "Different reference panels and labels, not different DNA", "Ancestry", "A", "services",
              prov={"type": SVC, "source": "23andMe, AncestryDNA, IllustrativeDNA screenshots", "sourceVersion": "Ancestry: July 2024 update", "importedAt": "2026-09-25"},
              observed=[(a, f"{b}%") for a, b in east_d["values"]],
              transformation=["vendor categories", "mapped to harmonized streams (interpretive, Tier C)", "compared"],
              inference={"strength": "model_dependent", "method": "label harmonization"},
              uncertainty={"caveat": "The vendor→stream mapping is an interpretation."},
              would_change=["Vendors' raw segment files", "Your G25 coordinates"], entities=["stream:east", "stream:south"]))
    if lab:
        e = lab["consensus"]["east_summary"]; s_ = lab["consensus"]["south_summary"]
        add(claim("anc.east", "East Eurasian ancestry", f"≈{e['median']}% (models {e['min']}–{e['max']}%)", "Ancestry", "C", "consensus",
                  prov=dict(DER, source=DER["source"] + " + 8 public reference models (admix project)"),
                  observed=[(m["model"], f"{m['pct']}%") for m in lab["consensus"]["east"]],
                  transformation=["your genotypes at each model's SNPs", "maximum-likelihood admixture (EM)", "sum East-Eurasian components", "median across models"],
                  inference={"strength": "model_dependent", "method": "supervised admixture, jackknife SEs"},
                  coverage={"status": "partial", "note": "Each model overlaps your chip at 8–52k SNPs."},
                  transfer={"status": "adjacent", "referencePopulation": "hobbyist reference panels; Central Asian references sparse"},
                  uncertainty={"interval": [e["min"], e["max"]], "caveat": "Two models keep part of it inside mixed 'Turkic'/'Central Asia' components (excluded)."},
                  missing=["Peer-reviewed reference panel (e.g. AADR) with qpAdm"], would_change=["qpAdm modelling with published ancient genomes", "Larger Central Asian references"],
                  dependencies=["gen.dataset", "anc.services"], citations=["Alexander et al. 2009 (ADMIXTURE objective)", "Varadhan & Roland 2008 (SQUAREM)"],
                  entities=["stream:east"]))
        add(claim("anc.south", "South-Asian-related (AASI-like) ancestry", f"≈{s_['median']}% (models {s_['min']}–{s_['max']}%)", "Ancestry", "C", "consensus",
                  prov=dict(DER, source=DER["source"] + " + public reference models"), observed=[(m["model"], f"{m['pct']}%") for m in lab["consensus"]["south"]],
                  transformation=["same models", "sum AASI-like components"], inference={"strength": "model_dependent", "method": "supervised admixture"},
                  uncertainty={"interval": [s_["min"], s_["max"]]}, dependencies=["gen.dataset"], entities=["stream:south"]))
        for g, v in (lab.get("deep", {}).get("puntDNAL") or {}).items():
            v2 = lab["deep"].get("AncientNearEast13", {}).get(g)
            add(claim(f"anc.deep.{g}", g, f"{v}% (puntDNAL)" + (f" · {v2}% (ANE13)" if v2 is not None else ""), "Ancestry", "C", "deep",
                      prov=dict(DER, source="puntDNAL & AncientNearEast13 models on your raw data"), observed=[("puntDNAL", f"{v}%"), ("AncientNearEast13", f"{v2}%")],
                      transformation=["ancient-source reference frequencies", "maximum-likelihood mixture", "grouped into deep sources"],
                      inference={"strength": "model_dependent", "method": "supervised admixture on ancient-source models"},
                      uncertainty={"interval": sorted([v, v2 if v2 is not None else v]), "caveat": "Deep sources are collinear; splits between related sources are unstable."},
                      would_change=["qpAdm with published ancient genomes"], dependencies=["gen.dataset"], entities=[f"deep:{g}"]))
        dt = lab["dating"]
        add(claim("anc.dating", "When East Eurasian ancestry mixed in", f"≈ {_yr(dt['calendar_best'])} (range {_yr(dt['calendar_range'][0])}–{_yr(dt['calendar_range'][1])})", "Ancestry", "D", "ikat",
                  prov=dict(DER, source="HarappaWorld frequencies + your genotypes"),
                  observed=[("Best fit", f"{dt['generations']} generations"), ("Support", f"{dt['support_generations'][0]}–{dt['support_generations'][1]} gen")] +
                           [(f"Simulated {v['true']} gen", f"recovered {v['estimated']}") for v in dt["validation"]],
                  transformation=["2-way local-ancestry HMM", "likelihood over admixture times", "29 years/generation"],
                  inference={"strength": "exploratory", "method": dt["model"]},
                  uncertainty={"interval": dt["support_generations"], "caveat": "Single-pulse model averages several waves; proxy references bias dates older."},
                  would_change=["Phased data", "A real recombination map", "Two-pulse model", "Better East Eurasian references"],
                  dependencies=["anc.east"], citations=["Loh et al. 2013 (ALDER, principle of LD/segment dating)"], entities=["stream:east", "concept:admixture-dating"]))

    # ------------------------------------------------------------ traits
    for t in data["traits"]:
        mech = t.get("mechanism") or {}
        add(claim(f"trait.{t['rsid']}", t["trait"], t.get("answer") or "No answer (not called)", "Traits", t["tier"], f"traits/{t['rsid']}",
                  prov=RAW, observed=[("rsID", t["rsid"]), ("Genotype", t.get("genotype") or "not on array"), ("Location", f"chr{t.get('chrom')}:{t.get('pos'):,}" if t.get("pos") else "—"),
                                      ("Effect allele", t["effect"]), ("Record", str((t.get("provenance") or {}).get("record", "—")))],
                  transformation=mech.get("chain") or ["genotype", "effect-allele count", "literature association"],
                  inference={"strength": "direct" if t["tier"] == "B" else "model_dependent", "method": "single-locus association"},
                  coverage={"status": "complete" if t.get("status") == "ok" else "unavailable", "measured": 1 if t.get("status") == "ok" else 0, "required": 1},
                  transfer={"status": "adjacent", "referencePopulation": "mostly European GWAS"},
                  uncertainty={"confidence": t.get("confidence"), "caveat": ("Explains " + mech["explained"]) if mech.get("explained") else "Polygenic trait"},
                  missing=["Other loci that shape this trait"], would_change=["A polygenic score with ancestry-matched calibration"],
                  citations=t.get("refs", []), entities=[f"var:{t['rsid']}", f"gene:{t['gene']}", f"trait:{t['trait']}"]))
    # ------------------------------------------------------------ PGx
    for p in data["pgx"]["summary"]:
        cov = p.get("coverage", {})
        add(claim(f"pgx.{p['gene']}", p["gene"], p["phenotype"], "Drug response", p["tier"], f"health/{p['gene']}",
                  prov=RAW, observed=[(f"{x['allele']} · {x['rsid']}", x["genotype"] or "not on array") for x in cov.get("sites", [])],
                  transformation=["raw genotypes", "star-allele calls", "diplotype " + p["diplotype"], "phenotype (CPIC function rules)", "guideline: " + p["drugs"]],
                  inference={"strength": "validated", "method": "CPIC allele-function table"},
                  coverage={"status": "partial", "measured": cov.get("observed"), "required": cov.get("total"), "unit": "clinically important alleles assayed",
                            "note": "Rare alleles not on the array default to normal function."},
                  transfer={"status": "direct", "referencePopulation": "CPIC multi-ancestry frequency tables"},
                  uncertainty={"caveat": p["caveat"]}, missing=["Phase between heterozygous sites", "Rare and novel alleles"],
                  would_change=["Clinical PGx panel or sequencing", "Newer CPIC guideline version"],
                  citations=["CPIC guidelines (cpicpgx.org)", "PharmGKB"], entities=[f"gene:{p['gene']}"] + [f"drug:{d.strip()}" for d in p["drugs"].split(",")]))
    for n in data["pgx"]["not_assessable"]:
        add(claim(f"pgx.na.{n['gene']}", n["gene"], "Not assessable from an array", "Drug response", "A", f"health/{n['gene']}", prov=RAW,
                  coverage={"status": "unavailable", "note": n["reason"]}, inference={"strength": "exploratory", "method": "—"},
                  would_change=["Clinical pharmacogenomic testing (includes copy-number / HLA typing)"], entities=[f"gene:{n['gene']}"]))
    # ------------------------------------------------------------ health
    for h in data["health"]["sites"]:
        on = h.get("status") == "ok"
        add(claim(f"health.{h['rsid']}", h["condition"], (h.get("reading") or "").split(" — ")[0] if on else "Not tested on this array", "Health", h["tier"] if on else "A",
                  f"health/{h['rsid']}", prov=RAW, observed=[("rsID", h["rsid"]), ("Genotype", h.get("genotype") or "not on array")],
                  transformation=["genotype", "variant classification (" + h["clinvar"] + ")", "inheritance: " + h["inheritance"]],
                  coverage={"status": "complete" if on else "unavailable", "measured": int(on), "required": 1},
                  transfer={"status": "adjacent", "referencePopulation": "mostly European cohorts"},
                  uncertainty={"caveat": "Association, not diagnosis."}, missing=["Other pathogenic variants in the same gene"],
                  would_change=["Clinical confirmation", "Gene sequencing"], entities=[f"gene:{h['gene']}", f"var:{h['rsid']}"]))
    ap = data["health"]["apoe"]
    add(claim("health.apoe", "APOE", ap.get("genotype", ap["status"]), "Health", ap["tier"], "health/APOE", prov=RAW,
              observed=[("rs429358", ap.get("rs429358")), ("rs7412", ap.get("rs7412"))], transformation=["two SNPs", "haplotype ε2/ε3/ε4 (phase assumed)"],
              uncertainty={"caveat": ap.get("note", "")}, entities=["gene:APOE"]))
    for i, txt in enumerate(data["health"]["not_assessed"]):
        name = txt.split(":")[0]
        add(claim(f"health.na.{i}", name, "Not comprehensively assessed", "Health", "A", "health", prov=RAW,
                  coverage={"status": "unavailable", "note": txt}, inference={"strength": "exploratory", "method": "—"},
                  would_change=["Clinical-grade sequencing"]))
    for sid in ("rs1799963",):
        pass
    return C, entity_index(data, C)


def entity_index(data: dict, C: dict) -> list[dict]:
    E = []

    def ent(eid, typ, label, route, claim_id=None, aliases=(), detail=""):
        E.append({"id": eid, "type": typ, "label": label, "route": route, "claim": claim_id, "aliases": list(aliases), "detail": detail})

    for d in data["reported"]["distances"]:
        ent(f"pop:{d['set']}:{d['population']}", "Ancient population" if d["set"] == "ancient" else "Population", d["population"],
            f"tajik/{d['population']}", f"anc.dist.{d['set']}.{d['rank']}", detail=f"distance {d['distance']}")
    for t in data["traits"]:
        ent(f"var:{t['rsid']}", "Variant", t["rsid"], f"traits/{t['rsid']}", f"trait.{t['rsid']}", detail=f"{t['gene']} · {t.get('genotype')}")
        ent(f"trait:{t['trait']}", "Trait", t["trait"], f"traits/{t['rsid']}", f"trait.{t['rsid']}", aliases=[t["gene"]])
    genes = {}
    for grp, route in ((data["traits"], "traits"), (data["health"]["sites"], "health")):
        for v in grp:
            genes.setdefault(v["gene"], (route, v["rsid"]))
    for p in data["pgx"]["summary"]:
        ent(f"gene:{p['gene']}", "Gene", p["gene"], f"health/{p['gene']}", f"pgx.{p['gene']}", detail=p["phenotype"])
        for dname in p["drugs"].split(","):
            dname = dname.strip()
            ent(f"drug:{dname}", "Medication", dname, f"health/{p['gene']}", f"pgx.{p['gene']}", detail=f"{p['gene']} · {p['phenotype']}")
    for g, (route, rs) in genes.items():
        if not any(e["id"] == f"gene:{g}" for e in E):
            ent(f"gene:{g}", "Gene", g, f"{route}/{rs}", f"trait.{rs}" if route == "traits" else f"health.{rs}")
    for h in data["health"]["sites"]:
        ent(f"var:{h['rsid']}", "Variant", h["rsid"], f"health/{h['rsid']}", f"health.{h['rsid']}", detail=f"{h['gene']} · {h.get('genotype') or 'not on array'}")
        ent(f"cond:{h['condition']}", "Condition", h["condition"], f"health/{h['rsid']}", f"health.{h['rsid']}")
    for s in data["pgx"]["sites"] + data["pgx"].get("extra", []):
        ent(f"var:{s['rsid']}", "Variant", s["rsid"], f"health/{s['gene']}", f"pgx.{s['gene']}", detail=f"{s['gene']} {s['star']} · {s.get('genotype') or 'not on array'}")
    for ch in list(data["chromosomes"]) + ["MT"]:
        ent(f"chrom:{ch}", "Chromosome", f"Chromosome {ch}", f"chromosomes/{ch}", aliases=[f"chr{ch}", f"chr {ch}"])
    y = data["haplogroups"]["y"]
    for lab in ("C1b1a1a", "C-P92", "C-Z12426", "C1b1a1 (M356)", "C (M130)", "C2 (M217) — not your branch"):
        ent(f"hg:{lab}", "Haplogroup", lab, "lineages/y", "lin.y")
    for lab in ("T1", "T", "JT", "R"):
        ent(f"hg:{lab}", "Haplogroup", lab, "lineages/mt", "lin.mt")
    for k, s in data["ancestry"]["streams"].items():
        ent(f"stream:{k}", "Ancestry stream", s["name"], f"services/{k}", "anc.east" if k == "east" else "anc.south" if k == "south" else "anc.services")
    if data.get("lab"):
        for g in data["lab"]["deep"].get("puntDNAL", {}):
            ent(f"deep:{g}", "Ancient component", g, "deep", f"anc.deep.{g}")
    for t in data["knowledge"]["timeline"]:
        ent(f"era:{t['title']}", "Era", t["title"], "river", None, detail=t["label"])
    concepts = [("roh", "Runs of homozygosity (ROH)", "chromosomes/roh", "gen.roh"), ("grch37", "Genome build GRCh37", "quality", "gen.build"),
                ("array", "Genotyping array", "quality", "gen.dataset"), ("admixture-dating", "Admixture dating", "ikat", "anc.dating"),
                ("phasing", "Phasing (which parent)", "parents", "lin.autosomes"), ("heterozygosity", "Heterozygosity", "chromosomes", "gen.dataset"),
                ("evidence", "Evidence tiers A–D, X", "method", None), ("privacy", "Privacy model", "method", None)]
    for k, lab, route, cid in concepts:
        ent(f"concept:{k}", "Concept", lab, route, cid)
    # de-duplicate by id (first wins)
    seen, out = set(), []
    for e in E:
        if e["id"] not in seen:
            seen.add(e["id"]); out.append(e)
    return out


def fingerprint(c: dict) -> str:
    key = json.dumps([c["answer"], c["tier"], c["coverage"].get("status"), c["coverage"].get("measured"), c["uncertainty"].get("interval")], sort_keys=True, default=str)
    return hashlib.sha1(key.encode()).hexdigest()[:10]


def diff(prev: dict | None, cur: dict) -> dict:
    """Classify each claim versus the previous build: NEW, CHANGED, HIGHER/LOWER CONFIDENCE, NOW ASSESSABLE."""
    if not prev:
        return {"baseline": True, "items": []}
    items = []
    for cid, c in cur.items():
        p = prev.get(cid)
        if p is None:
            items.append({"id": cid, "kind": "NEW"}); continue
        if p.get("fingerprint") == c["fingerprint"]:
            continue
        pc, cc = COVERAGE_ORDER.get(p["coverage"].get("status"), 0), COVERAGE_ORDER.get(c["coverage"].get("status"), 0)
        if pc == 0 and cc > 0:
            kind = "NOW ASSESSABLE"
        elif TIER_ORDER[c["tier"]] > TIER_ORDER[p["tier"]]:
            kind = "HIGHER CONFIDENCE"
        elif TIER_ORDER[c["tier"]] < TIER_ORDER[p["tier"]]:
            kind = "LOWER CONFIDENCE"
        else:
            kind = "CHANGED"
        items.append({"id": cid, "kind": kind, "before": p["answer"], "after": c["answer"]})
    for cid in prev:
        if cid not in cur:
            items.append({"id": cid, "kind": "REMOVED", "before": prev[cid]["answer"]})
    return {"baseline": False, "items": items}


def attach(data: dict, out_dir: Path) -> None:
    C, E = build(data)
    for c in C.values():
        c["fingerprint"] = fingerprint(c)
    hist = out_dir / "history"
    hist.mkdir(exist_ok=True)
    snaps = sorted(hist.glob("claims-*.json"))
    prev = json.loads(snaps[-1].read_text()) if snaps else None
    ch = diff(prev, C)
    if prev is None or ch["items"]:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        (hist / f"claims-{stamp}.json").write_text(json.dumps(C))
        ch["snapshot"] = stamp
    ch["previous"] = snaps[-1].stem.replace("claims-", "") if snaps else None
    data["claims"], data["entities"], data["changes"] = C, E, ch
