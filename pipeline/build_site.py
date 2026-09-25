"""Assemble the self-contained offline app.

    python -m pipeline.build_site      # -> data/processed/atlas.html (+ atlas_full.html with genome lookup)

Output lives in data/ (git-ignored) because it embeds personal genetic data.
The page carries a Content-Security-Policy that forbids all network requests.
"""

from __future__ import annotations

import base64
import gzip
import json

from . import genotypes
from .analyze import primary_dataset
from .run import OUT, ROOT

WEB = ROOT / "web"


def _genome_blob() -> str:
    ds = genotypes.parse(primary_dataset())
    tsv = "\n".join(f"{c.rsid}\t{c.chrom}\t{c.pos}\t{c.genotype}" for c in ds.calls)
    return base64.b64encode(gzip.compress(tsv.encode(), 9)).decode()


def main() -> None:
    data = json.loads((OUT / "atlas_data.json").read_text())
    tpl = (WEB / "index.html").read_text()
    safe = lambda s: s.replace("</script", "<\\/script")
    page = (tpl.replace("/*STYLES*/", (WEB / "styles.css").read_text())
               .replace("/*BASEMAP*/", safe((WEB / "basemap.js").read_text()))
               .replace("/*DATA*/", "window.ATLAS = " + safe(json.dumps(data, ensure_ascii=False)) + ";")
               .replace("/*APP*/", safe((WEB / "app.js").read_text() + "\n" + (WEB / "instrument.js").read_text())))
    (OUT / "atlas.html").write_text(page.replace("/*GENOME*/", ""))
    (OUT / "atlas_full.html").write_text(page.replace("/*GENOME*/", 'window.GENOME_GZ = "' + _genome_blob() + '";'))
    # the user's working copy name: the full, offline build including raw-marker lookup
    (OUT / "dnaresults.html").write_text((OUT / "atlas_full.html").read_text())
    for f in ("atlas.html", "atlas_full.html", "dnaresults.html"):
        print(f, f"{(OUT / f).stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
