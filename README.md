# GENOME ATLAS

GENOME ATLAS is a local-first research workbench for one person's consumer DNA data. It combines raw genotypes
(23andMe, AncestryDNA), reported ancestry results (23andMe, AncestryDNA, IllustrativeDNA),
haplogroups and relatives into one provenance-tracked, evidence-tiered model of a genome.

**Privacy first:** see [PRIVACY.md](PRIVACY.md). No genetic data is committed, and the pipeline makes no network requests.

## Run it locally

```bash
# 1. put your exports in data/raw/local/   (23andMe .zip/.txt, AncestryDNA .zip/.txt)
# 2. build the processed database
python3 -m pipeline.run          # -> data/processed/atlas.sqlite, inventory.json
# 3. tests (synthetic data only)
uvx pytest -q
```

Python 3.10+ with the standard library only; no install step.

## Design principles
- **Raw stays raw.** Code never writes to `data/raw/`. Everything derived goes to `data/processed/`.
- **Provenance on every row.** Each genotype stores its dataset (path + SHA-256) and its record number, and each reported
  result stores the screenshot or export it was read from.
- **Evidence tiers are never merged:** A = directly observed, B = strong inference, C = probabilistic,
  D = exploratory, X = non-genetic claim (family reports, AI-chat interpretations).
- **No silent merging.** Builds are verified against anchor SNPs, strand flips are counted rather than
  corrected, and palindromic (A/T, C/G) SNPs are flagged as having unverifiable strand.

## Pipeline modules
| Module | Role |
|---|---|
| `pipeline/genotypes.py` | Parses 23andMe/AncestryDNA formats (incl. zip, Drive-mangled text); verifies the build; detects the chip |
| `pipeline/qc.py` | Completeness, truncation, call rate, heterozygosity, sex-chromosome evidence |
| `pipeline/compare.py` | Cross-dataset concordance with strand and palindrome handling |
| `pipeline/store.py` | SQLite schema: datasets, genotypes, reported_results, population_distances, claims |
| `pipeline/evidence.py` | Evidence tier definitions |

## Build phases
1. ✅ Audit of available files
2. ✅ Parsers and normalized schema, validated on a partial genome
3. ⏳ Scientific report: needs the complete raw genotype file
4. ⏳ Interactive web interface
5. and later: ancestry visualization, traits, health/PGx, population genetics, parental-origin analysis
