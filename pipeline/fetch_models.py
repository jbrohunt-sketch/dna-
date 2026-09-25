"""Download public reference ancestry models into data/reference/admix/ (one-time).

    python -m pipeline.fetch_models

Source: the open-source `admix` project (github.com/stevenliuyi/admix). Only these public files are
downloaded; nothing about you is sent. The files are git-ignored because they are large (~150 MB).
"""

import urllib.request

from .lab import MODELS, REF

BASE = "https://raw.githubusercontent.com/stevenliuyi/admix/master/admix/data/"


def main() -> None:
    REF.mkdir(parents=True, exist_ok=True)
    for name, comps in MODELS.items():
        for fn in (f"{name}.alleles", f"{name}.{len(comps)}.F"):
            dest = REF / fn
            if dest.exists():
                continue
            print("downloading", fn)
            urllib.request.urlretrieve(BASE + fn, dest)


if __name__ == "__main__":
    main()
