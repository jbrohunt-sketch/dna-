"""Build the Observatory into one self-contained HTML file.

    python3 observatory/build.py          # writes observatory/index.html
    python3 observatory/build.py --check  # fails if index.html is out of date

Sources live in observatory/src/. The built file inlines the stylesheet and
scripts so it opens anywhere: a phone, a file preview, a static host.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "src"
OUT = HERE / "index.html"
BANNER = "<!-- Built from observatory/src by observatory/build.py. Edit the sources, not this file. -->\n"


def build() -> str:
    html = (SRC / "index.html").read_text()

    def style(match):
        css = (SRC / match.group(1)).read_text()
        return f"<style>\n{css}</style>"

    def script(match):
        js = (SRC / match.group(1)).read_text()
        if "</script" in js:
            raise SystemExit(f"{match.group(1)} contains '</script', which would end the inline block")
        return f"<script>\n{js}</script>"

    html = re.sub(r'<link rel="stylesheet" href="([\w.-]+\.css)">', style, html)
    html = re.sub(r'<script src="([\w.-]+\.js)"></script>', script, html)
    return html.replace("<!doctype html>\n", "<!doctype html>\n" + BANNER, 1)


def main() -> None:
    built = build()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text() != built:
            raise SystemExit("observatory/index.html is out of date: run python3 observatory/build.py")
        print("observatory/index.html is up to date")
        return
    OUT.write_text(built)
    print(f"wrote {OUT.relative_to(HERE.parent)} ({len(built) // 1024} KB)")


if __name__ == "__main__":
    main()
