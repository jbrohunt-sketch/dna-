"""SQLite store for the atlas. Every row points back to a dataset (file + sha256)."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .genotypes import ParsedDataset

SCHEMA = """
CREATE TABLE IF NOT EXISTS datasets (
  dataset_id    TEXT PRIMARY KEY,
  path          TEXT NOT NULL,
  sha256        TEXT NOT NULL,
  vendor        TEXT,
  chip          TEXT,
  build         TEXT,
  build_evidence TEXT,   -- JSON list
  complete      INTEGER, -- 0 when the file is known to be truncated
  qc            TEXT,    -- JSON
  warnings      TEXT     -- JSON list
);
CREATE TABLE IF NOT EXISTS genotypes (
  dataset_id TEXT NOT NULL REFERENCES datasets(dataset_id),
  rsid       TEXT NOT NULL,
  chrom      TEXT NOT NULL,
  pos        INTEGER NOT NULL,
  build      TEXT NOT NULL,
  genotype   TEXT NOT NULL,     -- vendor call, plus-strand per vendor header
  strand     TEXT NOT NULL,     -- 'plus (vendor-declared)'; flips resolved at annotation time
  record_no  INTEGER NOT NULL,  -- provenance: record index in source file
  PRIMARY KEY (dataset_id, rsid)
);
CREATE INDEX IF NOT EXISTS g_pos ON genotypes(chrom, pos);
CREATE TABLE IF NOT EXISTS reported_results (
  service TEXT, model TEXT, level INTEGER, parent TEXT, label TEXT, value REAL,
  source_ref TEXT, method TEXT, note TEXT, tier TEXT
);
CREATE TABLE IF NOT EXISTS population_distances (
  service TEXT, set_name TEXT, rank INTEGER, population TEXT, distance REAL,
  source_ref TEXT, method TEXT, tier TEXT
);
CREATE TABLE IF NOT EXISTS claims (
  claim TEXT, source TEXT, tier TEXT
);
"""


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path)
    con.executescript(SCHEMA)
    return con


def add_dataset(con, dataset_id: str, ds: ParsedDataset, qc: dict) -> None:
    con.execute("DELETE FROM genotypes WHERE dataset_id=?", (dataset_id,))
    con.execute(
        "INSERT OR REPLACE INTO datasets VALUES (?,?,?,?,?,?,?,?,?,?)",
        (dataset_id, ds.path, ds.sha256, ds.vendor, ds.chip, ds.build,
         json.dumps(ds.build_evidence), int(not qc["truncated"]), json.dumps(qc),
         json.dumps(ds.warnings)),
    )
    con.executemany(
        "INSERT OR IGNORE INTO genotypes VALUES (?,?,?,?,?,?,?,?)",
        ((dataset_id, c.rsid, c.chrom, c.pos, ds.build, c.genotype,
          "plus (vendor-declared)", c.line_no) for c in ds.calls),
    )


def add_reported(con, reported: dict) -> None:
    con.execute("DELETE FROM reported_results")
    con.execute("DELETE FROM population_distances")
    con.execute("DELETE FROM claims")
    src = reported["sources"]
    for r in reported["results"]:
        # A service's own reported number is Tier A as a *statement by that service*;
        # values seen only in secondary text are downgraded until verified.
        tier = "A" if r["method"] == "screenshot" else "C"
        con.execute(
            "INSERT INTO reported_results VALUES (?,?,?,?,?,?,?,?,?,?)",
            (r["service"], r["model"], r["level"], r.get("parent"), r["label"], r["value"],
             src[r["src"]]["file"], r["method"], r.get("note"), tier),
        )
    for d in reported["distances"]:
        tier = "A" if d["method"] == "screenshot" else "C"
        con.execute(
            "INSERT INTO population_distances VALUES (?,?,?,?,?,?,?,?)",
            ("IllustrativeDNA", d["set"], d["rank"], d["population"], d["distance"],
             src[d["src"]]["file"], d["method"], tier),
        )
    for c in reported["self_reported"]:
        con.execute("INSERT INTO claims VALUES (?,?,?)", (c["claim"], c["src"], "X"))
