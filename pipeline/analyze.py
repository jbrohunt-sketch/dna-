"""Derive the atlas data model from the parsed genome + reported results.

    python -m pipeline.analyze        # -> data/processed/atlas_data.json

Offline. Every output object carries `tier` and `provenance`.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path

from . import genotypes, knowledge, panel, qc
from .run import OUT, RAW

GRCH37_LEN = {
    "1": 249250621, "2": 243199373, "3": 198022430, "4": 191154276, "5": 180915260, "6": 171115067,
    "7": 159138663, "8": 146364022, "9": 141213431, "10": 135534747, "11": 135006516, "12": 133851895,
    "13": 115169878, "14": 107349540, "15": 102531392, "16": 90354753, "17": 81195210, "18": 78077248,
    "19": 59128983, "20": 63025520, "21": 48129895, "22": 51304566, "X": 155270560, "Y": 59373566,
}
CENTROMERE_MB = {"1": 125.0, "2": 93.3, "3": 91.0, "4": 50.4, "5": 48.4, "6": 61.0, "7": 59.9, "8": 45.6,
                 "9": 49.0, "10": 40.2, "11": 53.7, "12": 35.8, "13": 17.9, "14": 17.6, "15": 19.0,
                 "16": 36.6, "17": 24.0, "18": 17.2, "19": 26.5, "20": 27.5, "21": 13.2, "22": 14.7,
                 "X": 60.6, "Y": 12.5}
AUTOSOMES = [str(i) for i in range(1, 23)]
BIN = 2_000_000


def primary_dataset() -> Path:
    local = sorted((RAW / "local").glob("*"))
    cands = [p for p in local if p.suffix in (".zip", ".txt")]
    if not cands:
        raise SystemExit("No complete genotype file in data/raw/local/")
    return cands[0]


# ---------------------------------------------------------------- genotype annotation
def _count(gt: str, eff: str, other: str) -> tuple[int | None, str]:
    if gt == "--":
        return None, "no-call"
    if not set(gt) <= {eff, other}:
        return None, f"allele mismatch (observed {gt}, expected {eff}/{other}) — not interpreted"
    return gt.count(eff), "ok"


def annotate(G: dict, entries: list[dict], kind: str) -> list[dict]:
    out = []
    for v in entries:
        c = G.get(v["rsid"])
        row = {k: v[k] for k in v if k != "interp"} | {"kind": kind}
        if c is None:
            row |= {"genotype": None, "status": "not on this array under this rsID", "reading": None}
        else:
            n, status = _count(c.genotype, v["effect"], v["other"])
            row |= {"genotype": c.genotype, "chrom": c.chrom, "pos": c.pos, "effect_count": n, "status": status,
                    "reading": v["interp"][n] if n is not None and "interp" in v else None,
                    "palindromic": {v["effect"], v["other"]} in ({"A", "T"}, {"C", "G"}),
                    "provenance": {"record": c.line_no}}
        out.append(row)
    return out


def pgx_summary(pgx_rows: list[dict]) -> list[dict]:
    by = {(r["gene"], r["star"]): r for r in pgx_rows}

    def cnt(gene, star):
        r = by.get((gene, star))
        return r["effect_count"] if r else None

    res = []
    n2, n3, n17 = cnt("CYP2C19", "*2"), cnt("CYP2C19", "*3"), cnt("CYP2C19", "*17")
    if None not in (n2, n3, n17):
        nf = n2 + n3
        pheno = {(0, 0): ("*1/*1", "Normal metabolizer"), (1, 0): ("*1/*2 or *1/*3", "Intermediate metabolizer"),
                 (2, 0): ("*2/*2-type", "Poor metabolizer"), (0, 1): ("*1/*17", "Rapid metabolizer"),
                 (0, 2): ("*17/*17", "Ultrarapid metabolizer"), (1, 1): ("*2/*17 (phase assumed)", "Intermediate metabolizer")}.get((nf, n17), ("complex", "Indeterminate"))
        res.append(dict(gene="CYP2C19", diplotype=pheno[0], phenotype=pheno[1], tier="B",
                        caveat="Only *2, *3 and *17 are tested; rarer alleles (*4, *8, *35…) would be missed and default to *1.",
                        drugs="clopidogrel, many SSRIs, proton-pump inhibitors, voriconazole"))
    c2, c3 = cnt("CYP2C9", "*2"), cnt("CYP2C9", "*3")
    if None not in (c2, c3):
        score = 2 - 0.5 * c2 - 1.0 * c3
        pheno = "Normal metabolizer" if score == 2 else "Intermediate metabolizer" if score >= 1 else "Poor metabolizer"
        res.append(dict(gene="CYP2C9", diplotype=f"activity score {score}", phenotype=pheno, tier="B",
                        caveat="Tests *2 and *3 only; *5, *6, *8, *11 (more common in African ancestry) are not assessed.",
                        drugs="warfarin, phenytoin, several NSAIDs, siponimod"))
    v = cnt("VKORC1", "-1639G>A")
    if v is not None:
        res.append(dict(gene="VKORC1", diplotype=["GG (CC on plus strand)", "GA (CT)", "AA (TT)"][v],
                        phenotype=["Typical warfarin sensitivity", "Increased warfarin sensitivity", "High warfarin sensitivity"][v], tier="B",
                        caveat="Used together with CYP2C9 in dosing algorithms; clinicians dose by INR.", drugs="warfarin"))
    s = cnt("SLCO1B1", "*5 (521T>C)")
    if s is not None:
        res.append(dict(gene="SLCO1B1", diplotype=["521TT", "521TC", "521CC"][s],
                        phenotype=["Normal function", "Decreased function", "Poor function"][s], tier="B",
                        caveat="Assessed at the key 521T>C site only.", drugs="simvastatin and other statins (myopathy risk)"))
    c5 = cnt("CYP3A5", "*3")
    if c5 is not None:
        res.append(dict(gene="CYP3A5", diplotype=["*1/*1", "*1/*3", "*3/*3"][c5],
                        phenotype=["Normal metabolizer (expresser)", "Intermediate metabolizer (expresser)", "Poor metabolizer (non-expresser)"][c5], tier="B",
                        caveat="*6 and *7 (mainly African ancestry) not assessed.", drugs="tacrolimus"))
    d = cnt("DPYD", "*2A")
    if d is not None:
        res.append(dict(gene="DPYD", diplotype="*2A " + ["not detected", "heterozygous", "homozygous"][d],
                        phenotype="No *2A detected — this does NOT exclude other DPYD risk variants" if d == 0 else "Decreased DPD activity",
                        tier="B", caveat="Only one of several clinically important DPYD variants is tested.", drugs="fluorouracil, capecitabine"))
    t1, t2 = cnt("TPMT", "*3C"), cnt("TPMT", "*3B component")
    if None not in (t1, t2):
        res.append(dict(gene="TPMT", diplotype="no *3B/*3C alleles detected" if t1 + t2 == 0 else "variant detected",
                        phenotype="Likely normal (limited)" if t1 + t2 == 0 else "Possibly decreased activity", tier="B",
                        caveat="NUDT15 (important in East/Central Asian ancestry) is not assessed.", drugs="azathioprine, mercaptopurine"))
    return res


def apoe(G: dict) -> dict:
    a, b = (G.get(r) for r in panel.APOE["rsids"])
    if not a or not b or "--" in (a.genotype, b.genotype):
        return {"status": "not determinable", "tier": "A"}
    # ε2: rs429358 T + rs7412 T ; ε3: T + C ; ε4: C + C  (haplotypes; phase assumed)
    t429, t7412 = a.genotype.count("T"), b.genotype.count("T")
    e4 = 2 - t429
    e2 = t7412
    e3 = 2 - e4 - e2
    if e3 < 0:
        return {"status": "ambiguous (possible ε1 or phase issue)", "tier": "C"}
    alleles = ["ε2"] * e2 + ["ε3"] * e3 + ["ε4"] * e4
    return {"status": "ok", "genotype": "/".join(alleles), "rs429358": a.genotype, "rs7412": b.genotype,
            "tier": "A", "note": panel.APOE["note"]}


# ---------------------------------------------------------------- haplogroups
def mt_haplogroup(ds) -> dict:
    mt = {c.pos: c.genotype for c in ds.calls if c.chrom == "MT"}
    steps = []
    for node, sites in panel.MT_PATH:
        rows = []
        for pos, exp in sites:
            obs = mt.get(pos)
            if obs is None or obs == "--":
                state = "not tested"
            elif obs == exp:
                state = "derived ✓"
            elif obs == exp.translate(str.maketrans("ACGT", "TGCA")):
                state = "complement of expected (probe strand?)"
            else:
                state = "ancestral ✗"
            rows.append({"pos": pos, "expected": exp, "observed": obs, "state": state})
        steps.append({"node": node, "sites": rows,
                      "support": sum(r["state"] == "derived ✓" for r in rows),
                      "against": sum(r["state"] == "ancestral ✗" for r in rows)})
    non_h = [{"pos": p, "expected": e, "observed": mt.get(p)} for p, e in panel.MT_NON_H]
    return {"reported": "T1", "reported_by": "23andMe (user statement)", "path": steps, "non_h_evidence": non_h,
            "mt_markers": len(mt)}


def y_haplogroup(ds) -> dict:
    ydir = OUT / "yhaplo"
    ydir.mkdir(parents=True, exist_ok=True)
    y = sorted({c.pos: c.genotype for c in ds.calls if c.chrom == "Y" and len(c.genotype) == 1}.items())
    genos = ydir / "self.genos.txt"
    genos.write_text("ID\t" + "\t".join(str(p) for p, _ in y) + "\nself\t" + "\t".join(g for _, g in y) + "\n")
    exe = shutil.which("yhaplo") or "/tmp/claude-0/yh/bin/yhaplo"
    if Path(exe).exists():
        subprocess.run([exe, "-i", str(genos), "-o", str(ydir), "-ds", "-as"], check=True, capture_output=True)
    hg = ydir / "haplogroups.self.txt"
    if not hg.exists():
        return {"status": "yhaplo not available — install 23andMe/yhaplo to verify", "reported": "C-P92"}
    parts = hg.read_text().split()
    der = [t for t in (ydir / "derived.snps.self.txt").read_text().split()[3:] if ":" in t]
    anc = [t for t in (ydir / "ancestral.snps.self.txt").read_text().split()[3:] if ":" in t]
    return {"status": "ok", "reported": "C-P92", "reported_by": "23andMe (user statement)",
            "yhaplo_hg_snp": parts[1], "yhaplo_23andme_label": parts[2], "yhaplo_ycc": parts[3],
            "derived": [s.replace(":", " : ") for s in der], "ancestral": [s.replace(":", " : ") for s in anc],
            "y_markers_used": len(y), "tool": "23andMe yhaplo (ISOGG 2016-01-04 tree), run locally"}


# ---------------------------------------------------------------- chromosome landscape
def bins_and_roh(ds) -> tuple[dict, list[dict], dict]:
    by = defaultdict(list)
    for c in ds.calls:
        if c.chrom in GRCH37_LEN and len(c.genotype) == 2 and set(c.genotype) <= set("ACGT"):
            if c.chrom == "X" and qc.in_par(c.chrom, c.pos):
                continue
            by[c.chrom].append((c.pos, c.genotype[0] != c.genotype[1]))
    bins = {}
    for ch, L in GRCH37_LEN.items():
        n = L // BIN + 1
        m, h = [0] * n, [0] * n
        for p, het in by.get(ch, []):
            m[p // BIN] += 1
            h[p // BIN] += het
        bins[ch] = {"markers": m, "het": h}
    # markers of any type (incl. haploid) for density on X/Y/MT
    dens = defaultdict(lambda: None)
    for ch in GRCH37_LEN:
        dens[ch] = [0] * (GRCH37_LEN[ch] // BIN + 1)
    for c in ds.calls:
        if c.chrom in GRCH37_LEN:
            dens[c.chrom][c.pos // BIN] += 1
    for ch in bins:
        bins[ch]["all_markers"] = dens[ch]

    roh = []
    for ch in AUTOSOMES:
        roh.extend(_plink_roh(ch, sorted(by[ch])))
    total = sum(r["length_mb"] for r in roh)
    auto_len = sum(GRCH37_LEN[c] for c in AUTOSOMES) / 1e6
    classes = {"1.5–5 Mb": 0, "5–10 Mb": 0, ">10 Mb": 0}
    for r in roh:
        k = ">10 Mb" if r["length_mb"] > 10 else "5–10 Mb" if r["length_mb"] > 5 else "1.5–5 Mb"
        classes[k] += r["length_mb"]
    summary = {"segments": len(roh), "total_mb": round(total, 1), "froh": round(total / auto_len, 4),
               "longest_mb": round(max((r["length_mb"] for r in roh), default=0), 1),
               "by_class_mb": {k: round(v, 1) for k, v in classes.items()},
               "method": "PLINK --homozyg-style sliding window (50 SNPs, ≤1 het per window, 5% window threshold); runs ≥100 SNPs and ≥1.5 Mb, density ≤50 kb/SNP, split at gaps >1 Mb. Array data; runs <1.5 Mb are not reliable and are not reported.",
               "tier": "B"}
    return bins, roh, summary


def _plink_roh(ch, snps, win=50, win_het=1, thresh=0.05, min_snps=100, min_len=1_500_000,
               max_gap=1_000_000, max_kb_per_snp=50):
    """PLINK --homozyg-style scan: sliding windows of `win` SNPs are 'homozygous' if they
    contain <= win_het heterozygotes; a SNP is in a run if >= `thresh` of the windows
    covering it are homozygous. Runs are split at gaps > max_gap."""
    n = len(snps)
    if n < win:
        return []
    het = [h for _, h in snps]
    pref = [0]
    for h in het:
        pref.append(pref[-1] + h)
    hom_win = [pref[i + win] - pref[i] <= win_het for i in range(n - win + 1)]
    wp = [0]
    for w in hom_win:
        wp.append(wp[-1] + w)
    inrun = []
    for i in range(n):
        lo, hi = max(0, i - win + 1), min(i, n - win)
        tot = hi - lo + 1
        inrun.append(tot > 0 and (wp[hi + 1] - wp[lo]) / tot >= thresh)
    out, i = [], 0
    while i < n:
        if not inrun[i]:
            i += 1
            continue
        j = i
        while j + 1 < n and inrun[j + 1] and snps[j + 1][0] - snps[j][0] <= max_gap:
            j += 1
        span = snps[j][0] - snps[i][0]
        cnt = j - i + 1
        if cnt >= min_snps and span >= min_len and span / cnt <= max_kb_per_snp * 1000:
            out.append({"chrom": ch, "start": snps[i][0], "end": snps[j][0], "snps": cnt,
                        "hets": sum(het[i:j + 1]), "length_mb": round(span / 1e6, 2)})
        i = j + 1
    return out


# ---------------------------------------------------------------- main
def main() -> None:
    path = primary_dataset()
    ds = genotypes.parse(path)
    q = qc.qc(ds)
    G = {c.rsid: c for c in ds.calls}
    reported = json.loads((RAW / "manual" / "reported_results.json").read_text())

    traits = annotate(G, panel.TRAITS, "trait")
    pgx_rows = annotate(G, panel.PGX, "pgx")
    health = annotate(G, panel.HEALTH, "health")
    bins, roh, roh_summary = bins_and_roh(ds)

    data = {
        "meta": {"title": "GENOME ATLAS", "dataset": {"file": path.name, "sha256": ds.sha256, "vendor": ds.vendor,
                                                      "chip": ds.chip, "build": ds.build, "build_evidence": ds.build_evidence,
                                                      "header": ds.header[:3]},
                 "tiers": knowledge.TIERS},
        "qc": q,
        "chromosomes": {ch: {"length": L, "centromere": CENTROMERE_MB[ch] * 1e6} for ch, L in GRCH37_LEN.items()},
        "bins": {"size": BIN, "data": bins},
        "roh": {"segments": roh, "summary": roh_summary},
        "haplogroups": {"y": y_haplogroup(ds), "mt": mt_haplogroup(ds)},
        "traits": traits,
        "pgx": {"sites": pgx_rows, "summary": pgx_summary(pgx_rows), "not_assessable": panel.PGX_NOT_ASSESSABLE},
        "health": {"sites": health, "apoe": apoe(G), "not_assessed": panel.NOT_ASSESSED_HEALTH},
        "reported": reported,
        "ancestry": knowledge.ancestry_model(reported),
        "knowledge": {"identity_layers": knowledge.IDENTITY_LAYERS, "timeline": knowledge.TIMELINE,
                      "why_differ": knowledge.WHY_DIFFER, "places": knowledge.PLACES, "lineage_notes": knowledge.LINEAGE_NOTES},
    }
    data["findings"] = knowledge.findings(data)
    data["limitations"] = knowledge.limitations(data)
    (OUT / "atlas_data.json").write_text(json.dumps(data, ensure_ascii=False))
    print(f"atlas_data.json written: {len(traits)} traits, {len(pgx_rows)} PGx, {len(health)} health, "
          f"{roh_summary['segments']} ROH, Y={data['haplogroups']['y'].get('yhaplo_hg_snp')}")


if __name__ == "__main__":
    main()
