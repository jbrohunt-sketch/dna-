"""Emergent studies: new analyses run locally on the raw genome.

    uv run --with numpy python -m pipeline.fetch_models   # once: public reference models (no personal data sent)
    uv run --with numpy python -m pipeline.lab            # -> data/processed/lab.json

Studies
  1. Supervised admixture (maximum likelihood, EM) under several published hobbyist reference
     models, with leave-one-chromosome-out jackknife standard errors.
  2. Cross-model consensus for East-Eurasian and South-Asian-related ancestry.
  3. Local-ancestry HMM ("chromosome painting") for East-Eurasian segments, and a maximum-
     likelihood admixture date, validated on simulated genomes first.

Requires numpy. Reads data/raw + data/reference only; makes no network requests.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np

from . import genotypes
from .analyze import GRCH37_LEN, primary_dataset
from .run import OUT, ROOT

REF = ROOT / "data" / "reference" / "admix"
CM_PER_MB = 1.2          # genome-average sex-averaged recombination rate (uniform-map approximation)
GEN_YEARS = 29           # years per generation (Fenner 2005)
REF_YEAR = 1975
CHR_RANK = {str(i): i for i in range(1, 23)} | {"X": 23, "Y": 24, "MT": 25}          # approximate birth year of the parents' generation, for converting to calendar years

MODELS = {
    # model: (component names, groups)
    "puntDNAL": ["EHG-Steppe", "Oceanian", "East Eurasian", "Iran Neolithic", "Siberian", "Sub-Saharan", "African HG",
                 "South Eurasian", "Western HG", "Natufian HG", "Amerindian", "Anatolian Neolithic"],
    "AncientNearEast13": ["Southeast Asian", "Anatolia Neolithic", "CHG-EEF", "Polar", "EHG", "Sub-Saharan", "Iran-Neolithic",
                          "Karitiana", "Ancestral-Indian", "Natufian", "Siberian", "Papuan", "SHG-WHG"],
    "HarappaWorld": ["South-Indian", "Baloch", "Caucasian", "Northeast-Euro", "Southeast-Asian", "Siberian", "Northeast-Asian",
                     "Papuan", "American", "Beringian", "Mediterranean", "Southwest-Asian", "San", "East-African", "Pygmy", "West-African"],
    "TurkicK11": ["Southeast European", "West Asian", "Southeast Asian", "Sub-Saharan African", "Northeast European", "Indian",
                  "Northwest European", "Turkic", "Mongol", "Papuan", "Northeast Asian"],
    "K13M2": ["West Europe", "East Europe", "South Med", "Caucasus", "Arabia", "Siberia", "Central Asia", "India",
              "South East Asia", "West Africa", "East Africa", "Oceania", "East Asia"],
    "K12b": ["Gedrosia", "Siberian", "Northwest African", "Southeast Asian", "Atlantic Med", "North European", "South Asian",
             "East African", "Southwest Asian", "East Asian", "Caucasus", "Sub Saharan"],
    "MDLPK27": ["Nilotic-Omotic", "Ancestral-South-Indian", "North-European-Baltic", "Uralic", "Australo-Melanesian", "East-Siberean",
                "Ancestral-Yayoi", "Caucasian-Near-Eastern", "Tibeto-Burman", "Austronesian", "Central-African-Pygmean",
                "Central-African-Hunter-Catherers", "Nilo-Sahrian", "North-African", "Gedrosia-Caucasian", "Cushitic", "Congo-Pygmean",
                "Bushmen", "South-Meso-Amerindian", "South-West-European", "North-Amerindian", "Arabic", "North-Circumpolar", "Kalash",
                "Papuan-Australian", "Baltic-Finnic", "Bantu"],
    "globe13": ["Siberian", "Amerindian", "West African", "Palaeo African", "Southwest Asian", "East Asian", "Mediterranean",
                "Australasian", "Artic", "West Asian", "North European", "South Asian", "East African"],
}
# Which components count as East-Eurasian / South-Asian-related (AASI-like) in each model.
# Components that are themselves regional composites (e.g. 'Turkic', 'Central Asia', 'Uralic') are
# listed separately so the consensus never silently counts them.
EAST = {
    "puntDNAL": ["East Eurasian", "Siberian", "Amerindian"], "AncientNearEast13": ["Southeast Asian", "Siberian", "Karitiana", "Polar"],
    "HarappaWorld": ["Southeast-Asian", "Siberian", "Northeast-Asian", "American", "Beringian"],
    "TurkicK11": ["Mongol", "Northeast Asian", "Southeast Asian"], "K13M2": ["Siberia", "East Asia", "South East Asia"],
    "K12b": ["Siberian", "Southeast Asian", "East Asian"],
    "MDLPK27": ["East-Siberean", "Ancestral-Yayoi", "Tibeto-Burman", "Austronesian", "North-Amerindian", "South-Meso-Amerindian", "North-Circumpolar"],
    "globe13": ["Siberian", "Amerindian", "East Asian", "Artic"],
}
COMPOSITE = {"TurkicK11": ["Turkic"], "K13M2": ["Central Asia"], "MDLPK27": ["Uralic"]}
SOUTH = {
    "puntDNAL": ["South Eurasian"], "AncientNearEast13": ["Ancestral-Indian"], "HarappaWorld": ["South-Indian"],
    "MDLPK27": ["Ancestral-South-Indian"], "K12b": ["South Asian"], "globe13": ["South Asian"],
}
DEEP = {  # the two ancient-source models, grouped into the river's deep streams
    "puntDNAL": {"Iran-Neolithic farmers": ["Iran Neolithic"], "Anatolian farmers": ["Anatolian Neolithic"],
                 "Steppe / Eastern hunter-gatherers": ["EHG-Steppe"], "Western hunter-gatherers": ["Western HG"],
                 "East Eurasian & Siberian": ["East Eurasian", "Siberian", "Amerindian"], "South Eurasian (AASI-like)": ["South Eurasian"],
                 "Levant (Natufian)": ["Natufian HG"]},
    "AncientNearEast13": {"Iran-Neolithic farmers": ["Iran-Neolithic"], "Anatolian farmers": ["Anatolia Neolithic", "CHG-EEF"],
                          "Steppe / Eastern hunter-gatherers": ["EHG"], "Western hunter-gatherers": ["SHG-WHG"],
                          "East Eurasian & Siberian": ["Southeast Asian", "Siberian", "Karitiana", "Polar"],
                          "South Eurasian (AASI-like)": ["Ancestral-Indian"], "Levant (Natufian)": ["Natufian"]},
}


# ------------------------------------------------------------------ loading
def load_model(name: str):
    comps = MODELS[name]
    al = (REF / f"{name}.alleles").read_text().split("\n")
    F = np.loadtxt(REF / f"{name}.{len(comps)}.F", dtype=np.float64)
    snps, minor, major = [], [], []
    for line in al:
        p = line.split()
        if len(p) >= 3:
            snps.append(p[0]); minor.append(p[1]); major.append(p[2])
    return comps, snps, minor, major, F


def genotype_matrix(G: dict, snps, minor, major, F):
    """Count copies of the allele whose frequency F stores (the second allele in the .alleles file) per SNP (0/1/2); drop SNPs missing, no-called, or with alleles not {minor,major}."""
    keep, g, chrom, pos = [], [], [], []
    for i, rs in enumerate(snps):
        c = G.get(rs)
        if c is None or len(c.genotype) != 2 or "-" in c.genotype:
            continue
        if not set(c.genotype) <= {minor[i], major[i]}:
            continue
        # F stores the frequency of the allele listed second in the .alleles file
        keep.append(i); g.append(c.genotype.count(major[i])); chrom.append(c.chrom); pos.append(c.pos)
    order = np.lexsort((np.array(pos), np.array([CHR_RANK.get(c, 99) for c in chrom])))  # genomic order
    f = np.clip(F[keep], 1e-4, 1 - 1e-4)[order]
    return np.array(g, dtype=np.float64)[order], f, np.array(chrom)[order], np.array(pos)[order]


# ------------------------------------------------------------------ study 1: supervised admixture
def em_admix(g, f, q0=None, iters=20000, tol=1e-9):
    """Maximum-likelihood admixture proportions with fixed allele frequencies (same objective as
    ADMIXTURE's projection mode). EM updates accelerated with SQUAREM (Varadhan & Roland 2008)."""
    K = f.shape[1]
    n2 = 2 * len(g)
    fq = 1 - f

    def step(q):
        p = f @ q
        return q * ((g / p) @ f + ((2 - g) / (1 - p)) @ fq) / n2

    def nll(q):
        p = f @ q
        return -(g * np.log(p) + (2 - g) * np.log(1 - p)).sum()

    q = np.full(K, 1.0 / K) if q0 is None else q0.copy()
    for _ in range(iters):
        q1 = step(q); q2 = step(q1)
        r, v = q1 - q, q2 - 2 * q1 + q
        if np.abs(r).max() < tol:
            return q2
        vv = v @ v
        alpha = min(-1.0, -np.sqrt((r @ r) / vv)) if vv > 0 else -1.0
        qn = q - 2 * alpha * r + alpha * alpha * v
        if np.all(np.isfinite(qn)) and qn.min() > 0:
            qn = step(qn / qn.sum())
            if not np.all(np.isfinite(qn)) or nll(qn) > nll(q2):
                qn = q2  # extrapolation overshot: fall back to plain EM
        else:
            qn = q2
        if np.abs(qn - q).max() < tol:
            return qn
        q = qn
    return q


def jackknife(g, f, chrom):
    """Leave-one-chromosome-out jackknife standard errors."""
    full = em_admix(g, f)
    chroms = [c for c in np.unique(chrom) if c in GRCH37_LEN and c not in ("X", "Y")]
    est = np.array([em_admix(g[chrom != c], f[chrom != c], q0=full) for c in chroms])
    n = len(chroms)
    se = np.sqrt((n - 1) / n * ((est - est.mean(0)) ** 2).sum(0))
    return full, se


# ------------------------------------------------------------------ study 3: local ancestry HMM + dating
def collapse(f, q, groups: list[list[int]]):
    """Collapse component frequencies into a few ancestry groups, weighting by the person's own proportions."""
    cols, qs = [], []
    for idx in groups:
        wq = q[idx]
        s = wq.sum()
        cols.append((f[:, idx] * wq).sum(1) / s if s > 0 else f[:, idx].mean(1))
        qs.append(s)
    return np.stack(cols, 1), np.array(qs) / sum(qs)


# Diploid states: 0, 1 or 2 copies of East-Eurasian ancestry at a locus (unphased).
CONFIGS = [[((0, 0), 1.0)], [((0, 1), 0.5), ((1, 0), 0.5)], [((1, 1), 1.0)]]


def transitions(d, T, qE):
    """(n-1, 3, 3) transition matrices. Each haplotype independently re-draws its ancestry
    (P(East)=qE) after a recombination event since admixture: r = 1 - exp(-T * d)."""
    r = 1 - np.exp(-T * d)
    h = np.empty((len(d), 2, 2))
    h[:, 0, 0], h[:, 0, 1] = 1 - r * qE, r * qE
    h[:, 1, 0], h[:, 1, 1] = r * (1 - qE), 1 - r * (1 - qE)
    M = np.zeros((len(d), 3, 3))
    for k, conf in enumerate(CONFIGS):
        for (a, b), w in conf:
            for x in (0, 1):
                for y in (0, 1):
                    M[:, k, x + y] += w * h[:, a, x] * h[:, b, y]
    return M


def hmm_chrom(g, fW, fE, pos, T, qE):
    """Diploid 2-way HMM (West vs East). Returns (log-likelihood, posterior expected East copies per SNP)."""
    def emis(k):
        a1 = fE if k >= 1 else fW
        a2 = fE if k >= 2 else fW
        return np.where(g == 2, a1 * a2, np.where(g == 1, a1 * (1 - a2) + a2 * (1 - a1), (1 - a1) * (1 - a2)))
    E = np.stack([emis(0), emis(1), emis(2)], 1) + 1e-300
    n = len(g)
    M = transitions(np.diff(pos) / 1e8 * CM_PER_MB, T, qE)
    pi = np.array([(1 - qE) ** 2, 2 * qE * (1 - qE), qE ** 2])
    alpha = np.empty((n, 3)); c = np.empty(n)
    alpha[0] = pi * E[0]; c[0] = alpha[0].sum(); alpha[0] /= c[0]
    for t in range(1, n):
        v = (alpha[t - 1] @ M[t - 1]) * E[t]
        c[t] = v.sum(); alpha[t] = v / c[t]
    beta = np.ones((n, 3))
    for t in range(n - 2, -1, -1):
        beta[t] = (M[t] @ (E[t + 1] * beta[t + 1])) / c[t + 1]
    post = alpha * beta
    post /= post.sum(1, keepdims=True)
    return float(np.log(c).sum()), post


def fit_date(g, fW, fE, chrom, pos, qE, grid=(3, 5, 8, 12, 16, 20, 25, 30, 36, 44, 55, 70, 90, 120, 160, 220)):
    ll = []
    for T in grid:
        tot = 0.0
        for ch in [str(i) for i in range(1, 23)]:
            m = chrom == ch
            if m.sum() > 10:
                tot += hmm_chrom(g[m], fW[m], fE[m], pos[m], T, qE)[0]
        ll.append(tot)
    ll = np.array(ll)
    best = int(ll.argmax())
    # 2-unit log-likelihood support interval
    ok = [T for T, v in zip(grid, ll) if v >= ll[best] - 2]
    return grid[best], (min(ok), max(ok)), list(zip(grid, ll.round(2).tolist()))


def simulate(fW, fE, chrom, pos, qE, T, rng):
    """Simulate an admixed diploid genome at the model SNPs with known admixture time T."""
    g = np.zeros(len(pos))
    for ch in np.unique(chrom):
        idx = np.where(chrom == ch)[0]
        for _hap in range(2):
            state = rng.random() < qE
            prev = pos[idx[0]]
            for i in idx:
                d = (pos[i] - prev) / 1e8 * CM_PER_MB
                if rng.random() < 1 - math.exp(-T * d):
                    state = rng.random() < qE
                prev = pos[i]
                fr = fE[i] if state else fW[i]
                g[i] += rng.random() < fr
    return g


# ------------------------------------------------------------------ main
def main() -> None:
    ds = genotypes.parse(primary_dataset())
    G = {c.rsid: c for c in ds.calls}
    out = {"models": {}, "method": {"cm_per_mb": CM_PER_MB, "gen_years": GEN_YEARS}}
    cache = {}
    for name, comps in MODELS.items():
        if not (REF / f"{name}.alleles").exists():
            continue
        comps, snps, mi, ma, F = load_model(name)
        g, f, chrom, pos = genotype_matrix(G, snps, mi, ma, F)
        q, se = jackknife(g, f, chrom)
        cache[name] = (comps, g, f, chrom, pos, q)
        out["models"][name] = {"snps_used": int(len(g)), "snps_in_model": len(snps),
                               "components": [{"name": c, "pct": round(100 * float(a), 2), "se": round(100 * float(s), 2)}
                                              for c, a, s in sorted(zip(comps, q, se), key=lambda x: -x[1])]}
        print(name, len(g), "SNPs", " ".join(f"{c}:{100*a:.1f}±{100*s:.1f}" for c, a, s in sorted(zip(comps, q, se), key=lambda x: -x[1])[:6]))

    def share(name, members):
        comps, *_ , q = cache[name]
        return 100 * sum(q[comps.index(m)] for m in members)
    out["consensus"] = {
        "east": [{"model": m, "pct": round(share(m, EAST[m]), 1), "composite_excluded": [{"name": c, "pct": round(share(m, [c]), 1)} for c in COMPOSITE.get(m, [])]} for m in EAST if m in cache],
        "south": [{"model": m, "pct": round(share(m, SOUTH[m]), 1)} for m in SOUTH if m in cache],
    }
    for k in ("east", "south"):
        v = sorted(x["pct"] for x in out["consensus"][k])
        out["consensus"][k + "_summary"] = {"median": round(float(np.median(v)), 1), "min": v[0], "max": v[-1]}
    out["deep"] = {m: {grp: round(share(m, mem), 1) for grp, mem in DEEP[m].items()} for m in DEEP if m in cache}

    # ---- study 3: painting + dating with HarappaWorld (densest overlap), West vs East
    comps, g, f, chrom, pos, q = cache["HarappaWorld"]
    east_idx = [comps.index(c) for c in EAST["HarappaWorld"]]
    west_idx = [i for i in range(len(comps)) if i not in east_idx]
    fc, qc = collapse(f, q, [west_idx, east_idx])
    fW, fE, qE = fc[:, 0], fc[:, 1], float(qc[1])
    rng = np.random.default_rng(7)
    validation = []
    for T_true in (10, 25, 50):
        gs = simulate(fW, fE, chrom, pos, qE, T_true, rng)
        Tb, ci, _ = fit_date(gs, fW, fE, chrom, pos, qE)
        validation.append({"true": T_true, "estimated": Tb, "support": ci})
        print("simulation T", T_true, "->", Tb, ci)
    Tb, ci, curve = fit_date(g, fW, fE, chrom, pos, qE)
    print("REAL genome T =", Tb, ci)
    paint = {}
    for ch in [str(i) for i in range(1, 23)]:
        m = chrom == ch
        _, post = hmm_chrom(g[m], fW[m], fE[m], pos[m], Tb, qE)
        # compress to 1 Mb bins: [Mb, P(>=1 East copy), P(2 East copies), expected East copies]
        bins = {}
        for p, pr in zip(pos[m], post):
            bins.setdefault(int(p // 1e6), []).append(pr)
        paint[ch] = []
        for k, v in sorted(bins.items()):
            a = np.mean(v, 0)
            paint[ch].append([k, round(float(a[1] + a[2]), 3), round(float(a[2]), 3), round(float(a[1] + 2 * a[2]), 3)])
    # segments: runs where posterior E-copies >= 0.5
    segs = []
    for ch, arr in paint.items():
        run = None
        for mb, _p1, _p2, v in arr:
            if v >= 0.5:
                run = run or [mb, mb]
                run[1] = mb
            elif run:
                segs.append((ch, run[0], run[1] + 1)); run = None
        if run:
            segs.append((ch, run[0], run[1] + 1))
    lens = [b - a for _, a, b in segs]
    out["painting"] = {"model": "HarappaWorld (West vs East collapsed)", "qE_global": round(100 * qE, 1), "bins_mb": 1, "chromosomes": paint,
                       "segments": [{"chrom": c, "start_mb": a, "end_mb": b} for c, a, b in segs],
                       "segment_count": len(segs), "mean_segment_mb": round(float(np.mean(lens)), 1) if lens else None}
    out["dating"] = {"generations": Tb, "support_generations": ci, "curve": curve, "validation": validation,
                     "years_ago": [ci[0] * GEN_YEARS, ci[1] * GEN_YEARS], "calendar_best": REF_YEAR - Tb * GEN_YEARS,
                     "calendar_range": [REF_YEAR - ci[1] * GEN_YEARS, REF_YEAR - ci[0] * GEN_YEARS],
                     "model": "single-pulse 2-way admixture, uniform recombination map", "tier": "D"}
    (OUT / "lab.json").write_text(json.dumps(out, indent=1))
    print("lab.json written")


if __name__ == "__main__":
    main()
