"""Interpretive knowledge + derived ancestry/findings logic.

All population-history text uses "related to populations represented by…" language:
archaeological cultures are reference points, not asserted ancestors.
"""

from __future__ import annotations

from collections import defaultdict

TIERS = {
    "A": {"name": "Directly observed", "desc": "A genotype call in your file, or a number a service explicitly reported."},
    "B": {"name": "Strong inference", "desc": "Well-replicated genotype→phenotype link or established population-genetics method."},
    "C": {"name": "Probabilistic", "desc": "Statistical association or interpretive mapping; plausible, not deterministic."},
    "D": {"name": "Exploratory", "desc": "Hypothesis worth investigating; weak or incomplete evidence."},
    "X": {"name": "Non-genetic", "desc": "Family report or AI-chat interpretation. Context only, never evidence."},
}

IDENTITY_LAYERS = [
    dict(key="genealogy", name="Genealogy", what="Your actual biological ancestors: specific people in a family tree.",
         you="Two parents, four grandparents… Your file cannot name them. Only the Y line (father's father's…) and the mtDNA line (mother's mother's…) are traced directly."),
    dict(key="genetic", name="Genetic ancestry", what="The DNA segments you inherited and where similar DNA is found today or in the past.",
         you="Measured from your 638,544 markers; services model it differently."),
    dict(key="affinity", name="Population affinity", what="Statistical closeness to reference samples, such as a genetic distance.",
         you="Closest modern reference: 'Tajik' at distance 2.512 (IllustrativeDNA). Similarity, not descent."),
    dict(key="ethnicity", name="Ethnicity", what="A historical, social and cultural identity that people claim and share.",
         you="Tajik identity is cultural and historical. DNA can be consistent with it but cannot confer or deny it."),
    dict(key="language", name="Language", what="Linguistic affiliation, e.g. Persian/Tajik (Iranian branch of Indo-European) or Uzbek (Turkic).",
         you="Genes and languages spread by different processes. Many Turkic speakers carry mostly Iranian-related ancestry, and vice versa."),
    dict(key="nationality", name="Nationality", what="Political citizenship: Tajikistan, Uzbekistan, the USA…",
         you="Borders drawn in the 1920s cut across Tajik and Uzbek communities. Nationality has no genetic signature."),
    dict(key="culture", name="Archaeological culture", what="A material-culture label (pottery, burials) such as Sintashta, BMAC or Saka.",
         you="'Saka-related ancestry' means genetic similarity to individuals buried in Saka contexts, not that your ancestors were Saka."),
]

# Harmonized "ancestry streams". Mapping service labels onto them is interpretive (Tier C).
STREAMS = {
    "iranian": {"name": "Iranian-plateau / West Asian", "color": "var(--s-iranian)"},
    "oasis": {"name": "Central Asian oasis (Transoxiana)", "color": "var(--s-oasis)"},
    "steppe": {"name": "Steppe (Sarmatian / Magyar)", "color": "var(--s-steppe)"},
    "south": {"name": "South-Asian-related", "color": "var(--s-south)"},
    "east": {"name": "East Eurasian", "color": "var(--s-east)"},
    "anatolian": {"name": "Anatolian", "color": "var(--s-anatolian)"},
    "europe": {"name": "European", "color": "var(--s-europe)"},
    "composite": {"name": "Service's own mixed Central Asian cluster (cannot be split)", "color": "var(--s-composite)"},
    "other": {"name": "Unassigned / broad", "color": "var(--s-other)"},
}
LABEL_TO_STREAM = {
    "Central Asian": "composite", "Iranian, Caucasian & Mesopotamian": "iranian", "Anatolian": "anatolian",
    "Broadly Northern West Asian": "iranian", "Broadly Western Asian & North African": "other",
    "Scandinavian": "europe", "British & Irish": "europe", "Broadly Northwestern European": "europe",
    "Eastern European": "europe", "Broadly European": "europe", "East Asian (trace: Chinese Dai)": "east", "Unassigned": "other",
    "Iran/Persia": "iranian", "Western Himalayas & the Hindu Kush": "composite", "Mongolia & Upper Central Asia": "east",
    "Indo-Gangetic Plain": "south", "Eastern European Roma": "europe", "Germanic Europe": "europe", "Russia": "europe",
    "Wales": "europe", "Ireland": "europe",
    "Khwarazm and Transoxiana (100 BC–AD 950)": "oasis", "Turkic (AD 650–1200)": "east", "Swat Valley (300 BC–AD 1350)": "south",
    "Magyar": "steppe", "Sinitic (1230 BC–AD 1670)": "east", "Iranian Plateau": "iranian", "Khorasan (AD 1000–1570)": "iranian",
    "Sarmatian (AD 50–450)": "steppe", "Rouran Khaganate (AD 330–550)": "east", "Sinitic (1230 BC–AD 200)": "east",
}


def ancestry_model(reported: dict) -> dict:
    leaf = defaultdict(list)
    for r in reported["results"]:
        leaf[(r["service"], r["model"])].append(r)
    services = []
    for (svc, model), rows in leaf.items():
        if model.startswith("Unsupervised"):
            continue
        # leaves = rows with no children
        parents = {r.get("parent") for r in rows}
        leaves = [r for r in rows if r["label"] not in parents]
        streams = defaultdict(float)
        for r in leaves:
            streams[LABEL_TO_STREAM.get(r["label"], "other")] += r["value"]
        services.append({"service": svc, "model": model, "streams": {k: round(v, 1) for k, v in streams.items()},
                         "leaves": [{"label": r["label"], "value": r["value"], "stream": LABEL_TO_STREAM.get(r["label"], "other"),
                                     "method": r["method"]} for r in leaves]})
    get = lambda s, m: next(x for x in services if x["service"] == s and x["model"].startswith(m))
    d23, dad = get("23andMe", "Ancestry"), get("AncestryDNA", "Ethnicity")
    m1, m2 = get("IllustrativeDNA", "Periodical model 1"), get("IllustrativeDNA", "Periodical model 2")
    east = [(x["service"] + (" · " + x["model"].split()[-1] if x["service"] == "IllustrativeDNA" else ""), x["streams"].get("east", 0))
            for x in (d23, dad, m1, m2)]
    south = [(x["service"] + (" · " + x["model"].split()[-1] if x["service"] == "IllustrativeDNA" else ""), x["streams"].get("south", 0))
             for x in (d23, dad, m1, m2)]
    disagreements = [
        dict(topic="East Eurasian ancestry", values=east, tier="A",
             explanation="The four numbers answer different questions. 23andMe's 'Central Asian' reference cluster already contains East Eurasian ancestry, so it is absorbed into the 63.8% composite and only a 0.1% trace appears separately. AncestryDNA isolates a 7% 'Mongolia & Upper Central Asia' signal. IllustrativeDNA models you with historical proxy populations; its 'Turkic' and 'Rouran' sources are themselves partly West Eurasian, so their share overstates pure East Eurasian ancestry."),
        dict(topic="South-Asian-related ancestry", values=south, tier="A",
             explanation="23andMe reports none. AncestryDNA reports 6% Indo-Gangetic, plus part of its 32% 'Western Himalayas & Hindu Kush' composite. IllustrativeDNA uses Iron-Age Swat Valley samples, which sit on the Iranian-to-South-Asian cline. The same genetic gradient is being cut at different places."),
        dict(topic="Steppe vs oasis in IllustrativeDNA", values=[("Model 1 · Khwarazm", 48.4), ("Model 2 · Khwarazm", 15.6), ("Model 1 · steppe", 9.6), ("Model 2 · steppe", 32.4)], tier="B",
             explanation="Both models fit you well. Khwarazm/Transoxiana samples themselves carry steppe ancestry, so the model can trade one label for the other. The stable signal is the combined oasis+steppe share (58.0% vs 48.0%), not either label on its own."),
    ]
    stable = []
    for k in STREAMS:
        a, b = m1["streams"].get(k, 0), m2["streams"].get(k, 0)
        if a or b:
            stable.append({"stream": k, "model1": a, "model2": b, "range": [min(a, b), max(a, b)]})
    return {"streams": STREAMS, "services": services, "disagreements": disagreements, "illustrative_ranges": stable,
            "mapping_tier": "C",
            "mapping_note": "Assigning each service's label to a shared stream is an interpretive step (Tier C). The raw service numbers are Tier A."}


WHY_DIFFER = [
    ("Reference panels", "Each service compares you with its own reference samples. A population missing from the panel gets assigned to its nearest neighbours."),
    ("Label boundaries", "'Central Asian' at 23andMe and 'Iran/Persia' at Ancestry are clusters defined by their reference people, not by history or geography."),
    ("Algorithms", "Local-ancestry painting (23andMe), a mixture model (Ancestry) and distance-based fitting to ancient proxies (IllustrativeDNA) optimise different things."),
    ("Smoothing", "Segment-based methods smooth noisy calls, so small, scattered components get absorbed or pushed to 'broadly' categories."),
    ("Time depth", "IllustrativeDNA's sources are 1,000–3,000-year-old people. The others use living populations. Same genome, different era."),
    ("Collinearity", "When source populations are related to each other, many mixtures fit almost equally well, so a single number overstates certainty."),
]

TIMELINE = [
    dict(year=-45000, label="~45,000 BCE", title="Out of Africa into Asia",
         text="Your Y line's deep ancestor carried the mutation M130 (haplogroup C), one of the earliest lineages to spread across Asia after the out-of-Africa dispersal.",
         evidence=["Y: derived at M130"], tier="B", stream="deep"),
    dict(year=-22000, label="~22,000 BCE", title="Ancient North Eurasians and Ice-Age West Asia",
         text="Siberian hunter-gatherers related to the Mal'ta boy (ANE) and Ice-Age populations of the Caucasus and Iranian plateau form two of the deep sources later blended in Central Asia. Your mtDNA branch T traces to the Late-Pleistocene Near East.",
         evidence=["mtDNA: T-defining markers derived"], tier="C", stream="deep"),
    dict(year=-8000, label="~8,000 BCE", title="Farmers of the Zagros and Anatolia",
         text="Early farmers of the Iranian plateau (Zagros-related ancestry) and of Anatolia spread eastward and westward. Iranian-farmer-related ancestry becomes the backbone of later southern Central Asians.",
         evidence=["23andMe: Iranian, Caucasian & Mesopotamian 24.6%", "AncestryDNA: Iran/Persia 49%"], tier="C", stream="iranian"),
    dict(year=-2300, label="~2,300 BCE", title="Oasis civilisations (BMAC) and the Indus frontier",
         text="The Bactria–Margiana Archaeological Complex in today's Turkmenistan, Uzbekistan and Afghanistan was genetically mostly Iranian-farmer-related, with contacts toward the Indus world.",
         evidence=["IllustrativeDNA: Swat Valley 14.6–18%"], tier="C", stream="south"),
    dict(year=-1800, label="~1,800 BCE", title="Steppe pastoralists arrive",
         text="Populations related to Sintashta and Andronovo, carrying Western Steppe Herder ancestry, moved south into Central Asia. This is widely linked to the spread of Indo-Iranian languages.",
         evidence=["IllustrativeDNA: Sarmatian 32.4% (model 2) / Magyar 9.6% (model 1)"], tier="C", stream="steppe"),
    dict(year=-300, label="~300 BCE", title="Saka, Sogdians, Kushans",
         text="Iranian-speaking steppe nomads (Saka, Wusun, Kangju) and oasis city-states (Sogdiana, Khwarazm, Bactria) dominate. Your closest *ancient* reference samples come from this world.",
         evidence=["IllustrativeDNA ancient: Khotanese Saka 4.307, Kushan 5.191, Wusun 6.489, Kangju 8.019", "Khwarazm & Transoxiana 15.6–48.4%"], tier="A", stream="oasis"),
    dict(year=650, label="~AD 650", title="Turkic expansions",
         text="Turkic-speaking groups from the eastern steppe spread into Transoxiana, adding East Eurasian ancestry. Language shift often outpaced genetic change.",
         evidence=["IllustrativeDNA: Turkic 17% / Rouran 9.2%", "AncestryDNA: Mongolia & Upper Central Asia 7%", "EDAR 370A: one copy"], tier="C", stream="east"),
    dict(year=1220, label="~AD 1220", title="Mongol era and after",
         text="Further East Eurasian input. Your top ancient match, 'Post-Medieval Tian Shan Nomad' (distance 3.906), reflects this late mixed steppe population.",
         evidence=["IllustrativeDNA ancient #1: Post-Medieval Tian Shan Nomad 3.906"], tier="A", stream="east"),
    dict(year=2000, label="Present", title="Modern Tajik genetic cluster",
         text="Your closest living reference populations are Tajik groups, with Uzbeks of Afghanistan and Turkmen close behind. 23andMe places a recent-ancestry signal in the Tashkent region.",
         evidence=["IllustrativeDNA modern #1: Tajik 2.512", "23andMe: Tashkent Region, Uzbekistan"], tier="A", stream="composite"),
]

LINEAGE_NOTES = {
    "y": dict(
        summary="Haplogroup C1b1a1a, defined by Z12426 and by P92, which sits at the same tree position. 23andMe calls it C-P92.",
        phylogeny=["C (M130) — ~50,000+ years; one of the oldest non-African Y lineages in Asia",
                   "C1 (F3393) — split from C2 early in the Upper Palaeolithic",
                   "C1b (Z16480)", "C1b1a (Z16449)", "C1b1a1 (M356) — the 'South/Central Asian' C branch",
                   "C1b1a1a (Z12426 / P92) — your terminal branch at array resolution"],
        geography="C1b1a1 (M356) is reported mainly at low frequencies in South Asia (Pakistan, India, Nepal), with scattered occurrences in Afghanistan, Iran, Central Asia and the Arabian Peninsula. This geography is a literature summary (Tier C) and not a claim about your specific ancestors.",
        correction="An earlier AI chat claimed C-P92 is a Native American lineage. That is incorrect for you. The Native American C lineage (C-P39) and the Genghis-associated C-M217 cluster both sit on the C2 branch, and your file is ancestral (not carrying the mutation) at M217, the marker that defines C2.",
        caveat="The Y chromosome follows one line: ten generations back it traces 1 of your 1,024 ancestors (about 0.1%). The mtDNA line traces one more. Everything else comes from the autosomes."),
    "mt": dict(
        summary="Haplogroup T1 (reported by 23andMe); your raw mtDNA calls support the R → JT → T path.",
        geography="Haplogroup T arose in the Late-Pleistocene Near East. T1 occurs at low to moderate frequency across Europe, the Near East, the Caucasus and Central Asia, and appears in ancient Neolithic and Bronze-Age samples (Tier C).",
        caveat="mtDNA traces only your mother's mother's mother's… line."),
}

PLACES = {
    "modern": {
        "Tajik": (38.56, 68.78), "Tajik (Hisor)": (38.53, 68.55), "Tajik (Ayni)": (39.39, 68.54),
        "Uzbek (Afghanistan)": (36.71, 67.11), "Tajik (Afghanistan)": (36.0, 69.3), "Turkmen (Iran)": (37.25, 55.17),
        "Tajik (Kulob)": (37.91, 69.78), "Turkmen (Turkmenistan)": (37.95, 58.38), "Pamiri (Ishkashim)": (36.72, 71.61),
        "Nogai (Karachay-Cherkessia)": (44.22, 42.05),
    },
    "ancient": {
        "Post-Medieval Tian Shan Nomad": (42.3, 76.5), "Khotanese Saka": (37.11, 79.93), "Kushan": (36.7, 67.1),
        "Saka (Tian Shan)": (42.8, 75.2), "Wusun": (43.5, 79.5), "Post-Medieval Swat Valley (Singoor)": (35.0, 72.5),
        "Medieval Central Asian Nestorian (Tian Shan)": (42.84, 74.6), "Kangju": (42.3, 69.6),
        "Medieval Swat Valley (Mahmud Ghaznavi Mosque)": (34.77, 72.36), "Ottoman Turk (Çapalıbağ)": (39.9, 38.5),
    },
    "family": {"Garm (father, reported)": (39.02, 70.37), "Kanibadam (mother, reported)": (40.29, 70.42),
               "Tashkent Region (23andMe recent location)": (41.3, 69.24)},
    "approximate": True,
}


def findings(data: dict) -> list[dict]:
    f = []
    y = data["haplogroups"]["y"]
    if y.get("status") == "ok":
        f.append(dict(title=f"Y lineage verified from raw DNA: {y['yhaplo_ycc']} ({y['yhaplo_23andme_label']})",
                      detail="23andMe's open-source yhaplo, run locally on your 3,086 Y calls, independently reproduces 23andMe's label. You carry the ancestral form at M217 (C2), which rules out the Native American (C-P39) branch an earlier AI chat proposed.",
                      tier="A", rarity=0.8, interest=0.95, section="lineages"))
    mt = data["haplogroups"]["mt"]
    sup = sum(s["support"] for s in mt["path"])
    against = sum(s["against"] for s in mt["path"])
    f.append(dict(title=f"mtDNA T1 supported by {sup} diagnostic markers",
                  detail=f"R, JT, T and T1 markers are derived in your raw mtDNA calls ({against} contradicting). Two A-expected sites read T, consistent with those probes reporting the opposite strand.",
                  tier="A", rarity=0.4, interest=0.7, section="lineages"))
    ed = next((t for t in data["traits"] if t["rsid"] == "rs3827760"), None)
    if ed and ed.get("effect_count") == 1:
        f.append(dict(title="One copy of the East-Asian-associated EDAR 370A allele",
                      detail="Rare in Europe and common in East Asia. A single genotype that independently echoes the East Eurasian component every service detects in some form.",
                      tier="C", rarity=0.6, interest=0.8, section="traits"))
    for p in data["pgx"]["summary"]:
        if p["phenotype"] not in ("Normal metabolizer", "Normal function", "Typical warfarin sensitivity") and "not" not in p["phenotype"].lower() and "Likely normal" not in p["phenotype"]:
            f.append(dict(title=f"{p['gene']}: {p['phenotype']}", detail=f"{p['diplotype']}. Relevant to {p['drugs']}. Worth mentioning to a prescriber; not a reason to change any medication yourself.",
                          tier="B", rarity=0.35, interest=0.75, section="pgx"))
    r = data["roh"]["summary"]
    long_ = r["by_class_mb"][">10 Mb"] + r["by_class_mb"]["5–10 Mb"]
    verdict = ("No runs longer than 5 Mb: no genomic signal that your parents were closely related."
               if long_ == 0 else
               f"{long_} Mb lies in runs longer than 5 Mb. Long runs arise when both copies of a stretch descend from one recent common ancestor, which is common where marriage within extended families is customary.")
    f.append(dict(title=f"Runs of homozygosity: {r['total_mb']} Mb in {r['segments']} segments (longest {r['longest_mb']} Mb)",
                  detail=verdict + " Short runs mostly reflect deep population history. This is not a health finding.",
                  tier="B", rarity=0.5 if r["longest_mb"] > 10 else 0.3, interest=0.7, section="chromosomes"))
    d = data["ancestry"]["disagreements"][0]
    f.append(dict(title="Services disagree sharply on East Eurasian ancestry (0.1% to 23%)",
                  detail=f"{', '.join(f'{a}: {b}%' for a, b in d['values'])}. The disagreement comes from how each service labels ancestry, not from your DNA.",
                  tier="A", rarity=0.5, interest=0.85, section="contradictions"))
    top = data["reported"]["distances"][0]
    f.append(dict(title=f"Closest modern reference population: {top['population']} (distance {top['distance']})",
                  detail="5 of your 8 closest modern references are Tajik groups. This is similarity, not proof of genealogical descent.",
                  tier="A", rarity=0.2, interest=0.9, section="tajik"))
    w = {"A": 1.0, "B": 0.8, "C": 0.5, "D": 0.25}
    for x in f:
        x["score"] = round(0.5 * w[x["tier"]] + 0.3 * x["rarity"] + 0.2 * x["interest"], 3)
    return sorted(f, key=lambda x: -x["score"])


def limitations(data: dict) -> dict:
    q = data["qc"]
    can = [
        f"Read {q['markers']:,} markers genome-wide (GRCh37, {q['no_call_rate']*100:.1f}% no-calls).",
        "Verify haplogroups directly from Y and mtDNA calls.",
        "Report well-established single-SNP traits and a limited pharmacogenomic panel.",
        "Detect runs of homozygosity ≥1.5 Mb.",
        "Compare and explain the three services' ancestry reports.",
    ]
    cannot = [
        "Tell which parent any autosomal segment came from. That needs phasing against a parent's DNA, or 23andMe's Parental Inheritance output.",
        "Rule out disease. Arrays test <0.02% of the genome, and 'not detected' only means the tested variants were absent.",
        "Give CYP2D6, HLA or NUDT15 drug-response status.",
        "Compute an independent ancestry model or a Neanderthal percentage. These need reference panels, which are not bundled yet, so no number is invented.",
        "Resolve Y or mtDNA branches below array resolution. That needs Y sequencing (Big Y) or a full mtDNA sequence.",
        "Test for Garm/Rasht-specific ancestry, because no Garm reference population appears in your IllustrativeDNA results.",
    ]
    return {"can": can, "cannot": cannot,
            "sources_not_available": ["AncestryDNA raw data", "DNA Relatives / shared cM", "Ancestry-composition segment file",
                                      "IllustrativeDNA G25 coordinates", "23andMe Parental Inheritance report"]}
