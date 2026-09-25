"""Data-quality metrics for a parsed genotype dataset."""

from __future__ import annotations

from collections import Counter, defaultdict

from .genotypes import CHROM_ORDER, EXPECTED_MARKERS, ParsedDataset

AUTOSOMES = [str(i) for i in range(1, 23)]


def _is_snv(gt: str) -> bool:
    return len(gt) == 2 and set(gt) <= set("ACGT")


# GRCh37 pseudoautosomal regions: diploid in males, so excluded from X-heterozygosity.
PAR_X = ((60_001, 2_699_520), (154_931_044, 155_260_560))


def in_par(chrom: str, pos: int) -> bool:
    return chrom == "X" and any(a <= pos <= b for a, b in PAR_X)


def qc(ds: ParsedDataset) -> dict:
    per_chrom: dict[str, Counter] = defaultdict(Counter)
    last_pos: dict[str, int] = {}
    seen_positions: Counter = Counter()
    for c in ds.calls:
        k = per_chrom["X_PAR" if in_par(c.chrom, c.pos) else c.chrom]
        k["markers"] += 1
        if c.genotype == "--":
            k["no_call"] += 1
        elif _is_snv(c.genotype):
            k["snv_called"] += 1
            if c.genotype[0] != c.genotype[1]:
                k["het"] += 1
        elif set(c.genotype) <= set("DI"):
            k["indel"] += 1
        elif len(c.genotype) == 1:
            k["haploid"] += 1
        k["rs" if c.rsid.startswith("rs") else "internal_id"] += 1
        last_pos[c.chrom] = max(last_pos.get(c.chrom, 0), c.pos)
        seen_positions[(c.chrom, c.pos)] += 1

    per_chrom.pop("X_PAR", None)
    present = [ch for ch in CHROM_ORDER if ch in per_chrom]
    missing = [ch for ch in CHROM_ORDER if ch not in per_chrom and ch != "XY"]
    n = len(ds.calls)
    expected = EXPECTED_MARKERS.get(ds.chip or "")
    auto_called = sum(per_chrom[c]["snv_called"] for c in AUTOSOMES if c in per_chrom)
    auto_het = sum(per_chrom[c]["het"] for c in AUTOSOMES if c in per_chrom)
    no_calls = sum(k["no_call"] for k in per_chrom.values())

    truncated_reasons = []
    if expected and n < 0.8 * expected:
        truncated_reasons.append(f"{n:,} markers vs ~{expected:,} expected for {ds.chip}")
    if present and present[-1] in AUTOSOMES and len(present) < 22:
        truncated_reasons.append(f"file ends inside chromosome {present[-1]} (last position {last_pos[present[-1]]:,})")

    return {
        "markers": n,
        "expected_markers": expected,
        "completeness_vs_expected": round(n / expected, 4) if expected else None,
        "truncated": bool(truncated_reasons),
        "truncated_reasons": truncated_reasons,
        "chromosomes_present": present,
        "chromosomes_missing": missing,
        "no_call_rate": round(no_calls / n, 5) if n else None,
        "autosomal_snv_called": auto_called,
        "autosomal_heterozygosity": round(auto_het / auto_called, 5) if auto_called else None,
        "duplicate_positions": sum(1 for v in seen_positions.values() if v > 1),
        "malformed_records": ds.malformed_records,
        "sex_chromosome_evidence": _sex_evidence(per_chrom),
        "per_chromosome": {ch: dict(per_chrom[ch]) | {"last_pos": last_pos[ch]} for ch in present},
    }


def _sex_evidence(per_chrom) -> dict:
    x, y = per_chrom.get("X"), per_chrom.get("Y")
    if not x and not y:
        return {"inference": "not assessable", "reason": "no X or Y markers in this file"}
    y_called = (y["markers"] - y["no_call"]) if y else 0
    x_called = (x["snv_called"] + x["haploid"]) if x else 0
    x_het = x["het"] / x_called if x_called else None
    if y_called > 100 and (x_het is None or x_het < 0.01):
        inf = "XY (Y calls present, X essentially homozygous)"
    elif y_called < 20 and x_het and x_het > 0.05:
        inf = "XX (no Y calls, heterozygous X)"
    else:
        inf = "ambiguous — inspect manually"
    return {"inference": inf, "y_called": y_called,
            "x_heterozygosity_excl_PAR": round(x_het, 5) if x_het is not None else None}
