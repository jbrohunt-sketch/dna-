"""Evidence tiers. Every inference in the atlas carries exactly one."""

from enum import Enum


class Tier(str, Enum):
    A = "A"  # Directly observed: a genotype call, or a result a service explicitly reported
    B = "B"  # Strong genetic inference: well-replicated genotype->phenotype or pop-gen method
    C = "C"  # Probabilistic: statistical association, not deterministic
    D = "D"  # Exploratory / speculative: interesting hypothesis, weak or incomplete evidence
    X = "X"  # Not genetic evidence at all: self-reported family history, AI-chat claims


TIER_DESCRIPTIONS = {
    Tier.A: "Directly observed — genotype call or explicitly reported service result",
    Tier.B: "Strong genetic inference — well-established literature/method",
    Tier.C: "Probabilistic inference — associated, not deterministic",
    Tier.D: "Exploratory — hypothesis with weak or incomplete evidence",
    Tier.X: "Non-genetic claim — family report or AI-generated interpretation; context only",
}


class Transcription(str, Enum):
    """How a reported (non-genotype) value reached the database."""

    MACHINE = "machine"            # parsed from a structured export
    SCREENSHOT = "screenshot"      # read visually from a screenshot of the service UI
    SECONDARY_TEXT = "secondary"   # copied from a user/AI-written text summary; not primary
