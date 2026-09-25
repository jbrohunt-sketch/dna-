# data/ — local only, never committed

```
data/
  raw/          # untouched originals, exactly as exported. Never edited by code.
    drive/      #   files retrieved from Google Drive (read-only copies)
    manual/     #   hand transcriptions of screenshots (reported_results.json)
    local/      #   put your own exports here (23andMe .zip/.txt, AncestryDNA .zip/.txt, CSVs)
  processed/    # everything the pipeline derives: atlas.sqlite, inventory.json, report.md
```

`.gitignore` excludes everything in this folder except this README.
If you ever see a genotype file in `git status`, stop and fix `.gitignore` first.
