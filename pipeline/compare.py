"""Genotype concordance between two datasets, with explicit strand handling."""

from __future__ import annotations

from collections import Counter

from .genotypes import ParsedDataset

COMP = str.maketrans("ACGT", "TGCA")


def _norm(gt: str) -> str:
    return "".join(sorted(gt))


def _palindromic(a: str, b: str) -> bool:
    alleles = set(a) | set(b)
    return alleles in ({"A", "T"}, {"C", "G"})


def concordance(a: ParsedDataset, b: ParsedDataset) -> dict:
    """Compare calls at shared rsIDs. Never merges; only reports."""
    if a.build != b.build:
        return {"comparable": False, "reason": f"builds differ ({a.build} vs {b.build}); liftover required"}
    bi = {c.rsid: c for c in b.calls}
    tally: Counter = Counter()
    examples: dict[str, list] = {}
    for ca in a.calls:
        cb = bi.get(ca.rsid)
        if cb is None:
            continue
        tally["shared"] += 1
        if (ca.chrom, ca.pos) != (cb.chrom, cb.pos):
            key = "position_mismatch"
        elif ca.genotype == "--" and cb.genotype == "--":
            key = "no_call_both"
        elif "--" in (ca.genotype, cb.genotype):
            key = "no_call_in_one"
        elif _norm(ca.genotype) == _norm(cb.genotype):
            key = "palindromic_match_unverifiable_strand" if _palindromic(ca.genotype, cb.genotype) else "match"
        elif _norm(ca.genotype.translate(COMP)) == _norm(cb.genotype):
            key = "strand_flip"
        else:
            key = "discordant"
        tally[key] += 1
        if key not in ("match",) and len(examples.setdefault(key, [])) < 5:
            examples[key].append((ca.rsid, ca.genotype, cb.genotype))
    both_called = tally["match"] + tally["palindromic_match_unverifiable_strand"] + tally["strand_flip"] + tally["discordant"]
    return {
        "comparable": True,
        "counts": dict(tally),
        "concordance_rate": round((tally["match"] + tally["palindromic_match_unverifiable_strand"]) / both_called, 6) if both_called else None,
        "examples": examples,
    }
