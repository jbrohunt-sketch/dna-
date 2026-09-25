# Privacy model and network log

## Rules
1. **Genetic data never enters git.** `data/` is git-ignored except its README. Tests use synthetic genotypes only.
2. **The pipeline makes no network requests.** It uses only the Python standard library and SQLite. It reads `data/raw` and writes `data/processed`.
3. **External lookups send identifiers, never genotypes.** A lookup may send a variant ID, a haplogroup name or a population name to a public database. It never sends a genotype, a file, or a list of your variants.
4. **The web app (future phase) will be static and local.** It will have no analytics and no telemetry, and it will not load fonts or scripts from third-party CDNs at runtime.

## Log of every network action taken while building this project

| Date | Action | What left the machine | Genotype data sent? |
|---|---|---|---|
| 2026-09-25 | Google Drive connector: search and read the owner's own DNA-related files | Search queries such as `title contains '23andme'`. The files came *into* the session. | No |
| 2026-09-25 | Gmail connector: searched for DNA-service emails | Search queries (service names) | No |
| 2026-09-25 | Web search: `Y-DNA haplogroup C-P92 SNP P92 ISOGG C2 subclade` | Haplogroup marker name only | No |
| 2026-09-25 | Web fetch attempt: isogg.org haplogroup C tree (blocked by the network proxy) | URL only | No |

> Build-environment note: the first phases were built in a Claude Code **cloud** session. The
> files retrieved from Google Drive were held in that session's temporary container, under the
> git-ignored `data/`, and were never pushed. For fully local operation, clone the repo,
> put your exports in `data/raw/local/` and run `python3 -m pipeline.run`.
