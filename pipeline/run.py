"""Build data/processed from data/raw.

    python -m pipeline.run            # parse, QC, load, write inventory + report

Reads only local files. Makes no network requests.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from . import compare, genotypes, qc, store

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
GENOTYPE_GLOBS = ["drive/genome_partial/*.txt", "local/*.txt", "local/*.zip"]


def discover() -> list[Path]:
    files: list[Path] = []
    for g in GENOTYPE_GLOBS:
        files.extend(sorted(RAW.glob(g)))
    return files


def main() -> None:
    con = store.connect(OUT / "atlas.sqlite")
    parsed: dict[str, genotypes.ParsedDataset] = {}
    qcs: dict[str, dict] = {}
    for f in discover():
        ds = genotypes.parse(f)
        dataset_id = f"{f.parent.name}/{f.name}"
        q = qc.qc(ds)
        parsed[dataset_id], qcs[dataset_id] = ds, q
        store.add_dataset(con, dataset_id, ds, q)

    pairs = {}
    ids = list(parsed)
    for i, x in enumerate(ids):
        for y in ids[i + 1:]:
            pairs[f"{x} <> {y}"] = compare.concordance(parsed[x], parsed[y])

    reported_path = RAW / "manual" / "reported_results.json"
    reported = json.loads(reported_path.read_text()) if reported_path.exists() else None
    if reported:
        store.add_reported(con, reported)
    con.commit()

    inventory = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "genotype_datasets": {
            k: {"path": v.path, "sha256": v.sha256, "vendor": v.vendor, "chip": v.chip,
                "build": v.build, "build_evidence": v.build_evidence, "warnings": v.warnings,
                "qc": qcs[k]}
            for k, v in parsed.items()
        },
        "concordance": pairs,
    }
    (OUT / "inventory.json").write_text(json.dumps(inventory, indent=2))
    print(json.dumps({k: {kk: vv for kk, vv in v["qc"].items() if kk != "per_chromosome"}
                      for k, v in inventory["genotype_datasets"].items()}, indent=2))
    print(json.dumps(pairs, indent=2))


if __name__ == "__main__":
    main()
