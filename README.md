# GENOME ATLAS

GENOME ATLAS is a local-first research workbench for one person's consumer DNA data. It combines raw genotypes
(23andMe, AncestryDNA), reported ancestry results (23andMe, AncestryDNA, IllustrativeDNA),
haplogroups and relatives into one provenance-tracked, evidence-tiered model of a genome.

**Privacy first:** see [PRIVACY.md](PRIVACY.md). No genetic data is committed, and the pipeline makes no network requests.

## Run it locally

```bash
# 1. put your exports in data/raw/local/   (23andMe .zip/.txt, AncestryDNA .zip/.txt)
# 2. build the processed database + analysis
python3 -m pipeline.run          # -> data/processed/atlas.sqlite, inventory.json
python3 -m pipeline.analyze      # -> data/processed/atlas_data.json
# 3. build the offline app (open the file in any browser; no server needed)
python3 -m pipeline.build_site   # -> data/processed/atlas.html, atlas_full.html (with genome lookup)
# 3c. script-free edition for phone previews (needs node + playwright)
node tools/prerender.mjs data/processed/atlas.html data/processed/atlas_static.html
# 3b. optional Lab studies (needs numpy): independent admixture models, painting, dating
python -m pipeline.fetch_models  # one-time public reference download (~150 MB, git-ignored)
python -m pipeline.lab           # -> data/processed/lab.json (then re-run analyze + build_site)
# 4. tests (synthetic data only)
uvx pytest -q
```

Python 3.10+ with the standard library only. Optional: to verify the Y haplogroup, install 23andMe's
open-source caller with `pip install "yhaplo @ git+https://github.com/23andMe/yhaplo"`. It runs locally.

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
| `pipeline/panel.py` | Curated trait / pharmacogenomic / health variants (plus-strand alleles, refs, tiers) |
| `pipeline/knowledge.py` | Timeline, identity layers, the mapping of service labels to shared ancestry streams, the findings ranker, limitations |
| `pipeline/analyze.py` | Allele-checked annotation, CPIC-style PGx, APOE, mtDNA path check, yhaplo, ROH, chromosome bins |
| `pipeline/build_site.py` | Inlines `web/` + data into one CSP-locked offline HTML file |
| `pipeline/lab.py` | Lab: supervised admixture (EM+SQUAREM) under 8 reference models with chromosome jackknife; East/South consensus; 2-way local-ancestry HMM and admixture dating validated by simulation |
| `pipeline/fetch_models.py` | Downloads the public reference models |
| `web/` | Zero-dependency app (HTML/CSS/JS + SVG); Natural Earth basemap generated at build time |

## Build phases
1. ✅ Audit of available files
2. ✅ Parsers and normalized schema, validated on a partial genome
3. ✅ Analysis of the full 23andMe v5 file (638,544 markers)
4. ✅ Interactive offline web app with 14 sections
5. ✅ Ancestry visualization: services compared, time layers, Central Asia map
6. ✅ Traits and variant explorer
7. ✅ Health, APOE (hidden by default) and a limited PGx panel
8. ⏳ Independent population-genetics modeling: needs reference panels (AADR / 1000 Genomes) or G25 coordinates
9. ◐ Parental origin: Y, mtDNA and X are done; autosomes need phasing or relatives' data
10. ◐ Polish; ClinVar-wide annotation, to run locally where NCBI is reachable
