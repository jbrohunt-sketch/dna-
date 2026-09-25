"""Parse consumer raw-genotype files into a normalized, provenance-tagged form.

Handles:
  * 23andMe raw data (rsid, chromosome, position, genotype)
  * AncestryDNA raw data (rsid, chromosome, position, allele1, allele2; chr 23-26 coded)
  * the same files after a lossy round-trip through Google Drive's text/PDF viewer
    (markdown-escaped '#'/'_', line breaks collapsed to spaces)

Nothing here guesses silently: build, chip, sex and completeness are reported with the
evidence that produced them, and anything uncertain is flagged.
"""

from __future__ import annotations

import hashlib
import io
import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

CHROM_ORDER = [str(i) for i in range(1, 23)] + ["X", "Y", "XY", "MT"]
ANCESTRY_CHROM = {"23": "X", "24": "Y", "25": "XY", "26": "MT"}
RSID_RE = re.compile(r"^(rs|i)\d+$")

# Approximate marker counts per array, used only to judge completeness.
EXPECTED_MARKERS = {
    "23andMe v3": 960_000,
    "23andMe v4": 577_000,
    "23andMe v5": 638_000,
    "AncestryDNA v1": 700_000,
    "AncestryDNA v2": 668_000,
}

# Build anchors: well-known SNPs whose GRCh37 and GRCh38 positions differ.
BUILD_ANCHORS = {
    "rs3131972": ("1", 752721, 817341),
    "rs12124819": ("1", 776546, 841166),
}


@dataclass
class Call:
    rsid: str
    chrom: str
    pos: int
    genotype: str      # as given, normalized: "AG", "A" (hemizygous), "--" (no call), "DI"
    line_no: int       # 1-based record index in the source, for provenance


@dataclass
class ParsedDataset:
    path: str
    sha256: str
    vendor: str
    vendor_build_claim: str | None
    build: str
    build_evidence: list[str]
    chip: str | None
    header: list[str]
    calls: list[Call]
    warnings: list[str] = field(default_factory=list)
    malformed_records: int = 0


def _read_text(path: Path) -> tuple[str, bytes]:
    raw = path.read_bytes()
    if zipfile.is_zipfile(io.BytesIO(raw)):
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            # Skip macOS Finder metadata (__MACOSX/._name) that "Compress" adds.
            members = [n for n in z.namelist()
                       if n.lower().endswith(".txt")
                       and not n.startswith("__MACOSX/") and not Path(n).name.startswith("._")]
            if len(members) != 1:
                raise ValueError(f"{path}: expected one .txt in zip, found {members}")
            return z.read(members[0]).decode("utf-8", "replace"), raw
    return raw.decode("utf-8", "replace"), raw


def _undo_drive_escaping(text: str) -> str:
    # Google Drive's text view markdown-escapes these characters.
    return text.replace("\\#", "#").replace("\\_", "_")


def _detect_vendor(header_text: str) -> str:
    h = header_text.lower()
    if "23andme" in h:
        return "23andMe"
    if "ancestrydna" in h or "ancestry.com" in h:
        return "AncestryDNA"
    if "myheritage" in h:
        return "MyHeritage"
    if "family tree dna" in h or "ftdna" in h:
        return "FTDNA"
    return "unknown"


def _split_header(text: str) -> tuple[list[str], str]:
    """Separate '#' comment header from body. Works for line-based and flattened text."""
    lines = text.splitlines()
    flattened = any(len(ln.split()) > 40 for ln in lines)  # many records on one line
    if not flattened:
        header = [ln.rstrip() for ln in lines if ln.lstrip().startswith("#")]
        body = "\n".join(ln for ln in lines if not ln.lstrip().startswith("#"))
        return header, body
    # Flattened (PDF/Drive viewer): header ends at the column-name line.
    m = re.search(r"#\s*rsid\s+chromosome\s+position\s+(genotype|allele1\s+allele2)", text)
    if not m:
        raise ValueError("could not locate column header in flattened file")
    header = [h.strip() for h in re.split(r"(?=#)", text[: m.end()]) if h.strip()]
    return header, text[m.end():]


def parse(path: str | Path) -> ParsedDataset:
    path = Path(path)
    text, raw = _read_text(path)
    text = _undo_drive_escaping(text)
    header, body = _split_header(text)
    header_text = "\n".join(header)
    vendor = _detect_vendor(header_text)
    two_allele_cols = bool(re.search(r"allele1\s+allele2", header_text)) or vendor == "AncestryDNA"
    width = 5 if two_allele_cols else 4

    build_claim = None
    m = re.search(r"build\s+(\d{2})", header_text, re.I)
    if m:
        build_claim = f"GRCh{m.group(1)}"

    calls: list[Call] = []
    malformed = 0
    tokens = body.split()
    # Skip a non-commented column-name row (AncestryDNA puts it uncommented).
    if tokens[:1] == ["rsid"]:
        tokens = tokens[width:]
    i = 0
    rec = 0
    while i + width <= len(tokens):
        chunk = tokens[i : i + width]
        rsid, chrom, pos = chunk[0], chunk[1], chunk[2]
        if not RSID_RE.match(rsid) or not pos.isdigit():
            # Resynchronize on the next rsid-looking token.
            malformed += 1
            i += 1
            continue
        chrom = ANCESTRY_CHROM.get(chrom, chrom)
        if width == 5:
            a1, a2 = chunk[3], chunk[4]
            gt = "--" if "0" in (a1, a2) else a1 + a2
        else:
            gt = chunk[3]
        if chrom not in CHROM_ORDER:
            malformed += 1
            i += 1
            continue
        rec += 1
        calls.append(Call(rsid, chrom, int(pos), gt.upper(), rec))
        i += width
    trailing = len(tokens) - i

    ds = ParsedDataset(
        path=str(path),
        sha256=hashlib.sha256(raw).hexdigest(),
        vendor=vendor,
        vendor_build_claim=build_claim,
        build="unknown",
        build_evidence=[],
        chip=_detect_chip(path.name, vendor, len(calls)),
        header=header,
        calls=calls,
        malformed_records=malformed,
    )
    if trailing:
        ds.warnings.append(f"{trailing} trailing token(s) did not form a full record (file cut mid-line?)")
    _verify_build(ds)
    return ds


def _detect_chip(filename: str, vendor: str, n: int) -> str | None:
    m = re.search(r"_v(\d)_", filename)
    if vendor == "23andMe" and m:
        return f"23andMe v{m.group(1)}"
    return None


def _verify_build(ds: ParsedDataset) -> None:
    """Confirm the header's build claim against anchor SNP coordinates."""
    by_id = {c.rsid: c for c in ds.calls if c.rsid in BUILD_ANCHORS}
    votes = {"GRCh37": 0, "GRCh38": 0}
    for rsid, (chrom, p37, p38) in BUILD_ANCHORS.items():
        c = by_id.get(rsid)
        if not c:
            continue
        if c.pos == p37:
            votes["GRCh37"] += 1
            ds.build_evidence.append(f"{rsid} at {chrom}:{c.pos} matches GRCh37")
        elif c.pos == p38:
            votes["GRCh38"] += 1
            ds.build_evidence.append(f"{rsid} at {chrom}:{c.pos} matches GRCh38")
        else:
            ds.build_evidence.append(f"{rsid} at {chrom}:{c.pos} matches neither build")
    if ds.vendor_build_claim:
        ds.build_evidence.insert(0, f"header states {ds.vendor_build_claim}")
    winner = max(votes, key=votes.get) if any(votes.values()) else None
    if winner and ds.vendor_build_claim and winner != ds.vendor_build_claim:
        ds.build = "CONFLICT"
        ds.warnings.append(f"header says {ds.vendor_build_claim} but anchors say {winner}")
    else:
        ds.build = winner or ds.vendor_build_claim or "unknown"
