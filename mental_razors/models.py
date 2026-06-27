from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# =====================================================================
# ENUMS — validated by Pydantic, generate clean MCP schemas
# =====================================================================

class FindingDispositionEnum(str, Enum):
    mitigated = "mitigated"
    accepted  = "accepted"
    deferred  = "deferred"
    rejected  = "rejected"


class OutcomeStatus(str, Enum):
    successful = "successful"
    mixed      = "mixed"
    failed     = "failed"
    unknown    = "unknown"


class OutcomeConfidence(str, Enum):
    low    = "low"
    medium = "medium"
    high   = "high"


# =====================================================================
# RETRIEVAL PRIMITIVES
# =====================================================================

class EvidenceCandidate(BaseModel):
    quote:           str       = Field(description="Exact substring of the input content that matched")
    start:           int       = Field(description="Starting character index of the quote in the input")
    end:             int       = Field(description="Ending character index of the quote in the input")
    matched_signals: List[str] = Field(description="List of trigger words or indicators that matched the quote")


class RazorCandidate(BaseModel):
    razor_id:              str                    = Field(description="Unique identifier for the razor")
    title:                 str                    = Field(description="Human-readable title of the razor")
    retrieval_score:       float                  = Field(description="Relevance matching score")
    evidence:              List[EvidenceCandidate] = Field(description="Traceable substring matches in the input content")
    diagnostic_questions:  List[str]              = Field(description="Concrete questions to probe this reasoning flaw")
    false_positive_conditions: List[str]          = Field(description="Conditions under which this critique is a false positive")


# =====================================================================
# REVIEW PACKET — returned by prepare_review
# =====================================================================

class ReviewContract(BaseModel):
    require_exact_evidence: bool = Field(default=True,  description="Enforce strict evidence referencing")
    allow_no_finding:       bool = Field(default=True,  description="Allow empty findings output")
    max_final_findings:     int  = Field(default=3,     description="Suggested limit on final findings")


class ReviewPacket(BaseModel):
    mode:                str                = Field(description="Review mode preset used (e.g., architecture-review)")
    candidates:          List[RazorCandidate] = Field(description="Sorted list of relevant candidate razors and evidence")
    review_instructions: Dict[str, Any]    = Field(description="Prompt guidelines for the host model")
    review_contract:     ReviewContract    = Field(default_factory=ReviewContract, description="The governance contract constraints")


# =====================================================================
# GOVERNED FINDING — the full five-part contract, stored per finding
# =====================================================================

class GovernedFinding(BaseModel):
    """
    A single governed finding — the complete evidence-grounded review contract
    stored for every accepted, mitigated, or deferred finding.

    This is the unit of governance audit: it preserves exactly what the reviewer
    accepted as true, including the verbatim evidence quote they referenced.

    Enforcement rules (via model_validator):
    - disposition == rejected   → no evidence or contract fields required
    - disposition != rejected   → evidence_quote, evidence_start, evidence_end,
                                   causal_risk, diagnostic_question,
                                   false_positive_condition, bounded_action all required
    - disposition == mitigated  → change_summary additionally required
    """
    razor_id:   str                   = Field(description="ID of the razor this finding refers to")
    disposition: FindingDispositionEnum = Field(
        description="How this finding was treated: mitigated | accepted | deferred | rejected"
    )

    # Evidence — the exact verbatim substring from the original proposal.
    # Required for mitigated/accepted/deferred; must be null or absent for rejected.
    evidence_quote:    Optional[str] = Field(
        default=None,
        description=(
            "Verbatim substring from the original proposal the reviewer used as evidence. "
            "Must satisfy proposal_text[evidence_start:evidence_end] == evidence_quote. "
            "Required when disposition != rejected."
        ),
    )
    evidence_start:    Optional[int] = Field(
        default=None,
        description="Character offset of evidence_quote in the original proposal text. Required when disposition != rejected.",
    )
    evidence_end:      Optional[int] = Field(
        default=None,
        description="Exclusive character offset end of evidence_quote. Required when disposition != rejected.",
    )

    # Five-part governance contract — required for mitigated/accepted/deferred.
    causal_risk:          Optional[str] = Field(
        default=None,
        description="What could go wrong if this finding is ignored. Required when disposition != rejected.",
    )
    diagnostic_question:  Optional[str] = Field(
        default=None,
        description="The concrete question asked to probe this reasoning flaw. Required when disposition != rejected.",
    )
    false_positive_condition: Optional[str] = Field(
        default=None,
        description="Under what conditions would this finding be a false positive. Required when disposition != rejected.",
    )
    bounded_action:       Optional[str] = Field(
        default=None,
        description="One specific bounded action recommended to address this finding. Required when disposition != rejected.",
    )

    # Required for mitigated; strongly recommended for deferred.
    change_summary: Optional[str] = Field(
        default=None,
        description=(
            "What materially changed in the proposal as a result of this finding. "
            "Required when disposition == mitigated."
        ),
    )

    @model_validator(mode="after")
    def _enforce_governance_contract(self) -> "GovernedFinding":
        """
        Enforce governance contract completeness:
        - Non-rejected findings must supply the full five-part contract and evidence.
        - Mitigated findings must supply change_summary.
        - Empty strings are treated as missing (normalized to None).
        """
        # Normalize empty strings to None so validators catch them
        for field in (
            "evidence_quote", "causal_risk", "diagnostic_question",
            "false_positive_condition", "bounded_action", "change_summary",
        ):
            if getattr(self, field) == "":
                object.__setattr__(self, field, None)

        if self.disposition == FindingDispositionEnum.rejected:
            # Rejected findings do not carry a contract — nothing to enforce.
            return self

        # --- Required for all non-rejected findings ---
        missing = []
        for field in (
            "evidence_quote", "evidence_start", "evidence_end",
            "causal_risk", "diagnostic_question",
            "false_positive_condition", "bounded_action",
        ):
            if getattr(self, field) is None:
                missing.append(field)

        if missing:
            raise ValueError(
                f"GovernedFinding for razor '{self.razor_id}' "
                f"(disposition={self.disposition.value}) is missing required fields: "
                f"{missing}. All non-rejected findings must supply evidence "
                "and the full five-part governance contract "
                "(causal_risk, diagnostic_question, false_positive_condition, bounded_action)."
            )

        # --- Mitigated additionally requires change_summary ---
        if self.disposition == FindingDispositionEnum.mitigated and self.change_summary is None:
            raise ValueError(
                f"GovernedFinding for razor '{self.razor_id}' has disposition=mitigated "
                "but change_summary is missing. Mitigated findings must describe "
                "what materially changed in the proposal."
            )

        return self


# Backward-compatible alias kept for tests and older callers
# Use GovernedFinding for all new code.
class FindingDecision(BaseModel):
    """
    Lightweight finding record — use GovernedFinding for full evidence-grounded governance.
    Retained for backward compatibility with existing test fixtures.
    """
    razor_id:       str                   = Field(description="ID of the razor this finding refers to")
    disposition:    FindingDispositionEnum = Field(description="How this finding was treated: mitigated | accepted | deferred | rejected")
    change_summary: Optional[str]         = Field(default=None, description="What changed in the proposal as a result (for mitigated/deferred)")


# =====================================================================
# REVIEW RECORD INPUT — what the host model submits after a review
# =====================================================================

class ReviewRecordInput(BaseModel):
    decision_id:      str  = Field(description="User-provided identifier for the decision being audited")
    mode:             str  = Field(description="The review mode used")

    # The proposal text — the server hashes it; raw text is NOT stored.
    proposal_text:    str  = Field(
        description=(
            "The full original proposal text that was reviewed. "
            "The server computes SHA-256(proposal_text) and validates all "
            "evidence_quote fields against it. The text itself is discarded after validation."
        ),
    )
    # Optional: the revised text after the review, if the proposal changed.
    revised_text:     Optional[str] = Field(
        default=None,
        description=(
            "The revised proposal text after applying mitigations. "
            "If provided, the server hashes this as final_content_hash. "
            "The text itself is discarded after hashing."
        ),
    )

    # Governed findings — full five-part contract per finding.
    # Submissions with disposition != rejected SHOULD include evidence fields
    # and the five-part contract; the server validates evidence quotes.
    findings:         List[GovernedFinding] = Field(
        description=(
            "Governed finding records. Each non-rejected finding must include "
            "evidence_quote with character offsets that validate against proposal_text."
        ),
    )

    decision_summary:        str          = Field(description="One-sentence summary of the final decision")
    change_summary:          Optional[str] = Field(default=None, description="What materially changed as a result of the review")
    review_duration_seconds: Optional[int] = Field(
        default=None,
        description="Wall-clock review time in seconds (optional, self-reported by the reviewer)",
    )


class ReviewRecord(BaseModel):
    """Complete stored record — hashes computed by the server, text discarded."""
    decision_id:             str                   = Field(description="User-provided identifier for the decision")
    mode:                    str                   = Field(description="Review mode used")
    initial_content_hash:    str                   = Field(description="SHA-256 of the original proposal_text")
    final_content_hash:      Optional[str]         = Field(default=None, description="SHA-256 of revised_text, or None if unchanged")
    findings:                List[GovernedFinding] = Field(description="Governed finding records")
    decision_summary:        str                   = Field(description="One-sentence decision summary")
    change_summary:          Optional[str]         = Field(default=None)
    review_duration_seconds: Optional[int]         = Field(default=None)
    review_id:               str                   = Field(description="UUID v4 identifier for the audit record")
    created_at:              str                   = Field(description="ISO 8601 UTC timestamp")
    knowledge_version:       str                   = Field(description="SHA-256 hash of razors.yaml")
    schema_version:          int                   = Field(default=3, description="Format version of the audit trail")


# =====================================================================
# OUTCOME RECORD — stored after observing a decision in the field
# =====================================================================

class OutcomeRecordInput(BaseModel):
    review_id:          UUID              = Field(description="UUID of the review this outcome is linked to")
    observed_at:        date              = Field(description="Date the outcome was observed (YYYY-MM-DD)")
    status:             OutcomeStatus     = Field(description="Outcome status: successful | mixed | failed | unknown")
    observations:       List[str]         = Field(description="Free-form notes about what was observed")
    risks_materialized: List[str]         = Field(description="Razor IDs of risks that actually materialized")
    unexpected_issues:  List[str]         = Field(description="Issues not anticipated by any review finding")
    confidence:         OutcomeConfidence = Field(description="Confidence in this assessment: low | medium | high")


class OutcomeRecord(BaseModel):
    """Complete stored record — includes metadata added at write time."""
    review_id:          str               = Field(description="UUID of the review this outcome is linked to (stored as string)")
    observed_at:        str               = Field(description="Date the outcome was observed (ISO format)")
    status:             OutcomeStatus     = Field(description="Outcome status")
    observations:       List[str]         = Field(description="Free-form notes")
    risks_materialized: List[str]         = Field(description="Razor IDs that materialized")
    unexpected_issues:  List[str]         = Field(description="Unanticipated issues")
    confidence:         OutcomeConfidence = Field(description="Assessment confidence")
    outcome_id:         str               = Field(description="UUID v4 identifier for this outcome record")
    created_at:         str               = Field(description="ISO 8601 UTC timestamp")
    schema_version:     int               = Field(default=2, description="Format version of the outcome trail")


# =====================================================================
# CLAIM CHALLENGE
# =====================================================================

class ClaimChallengePacket(BaseModel):
    claim:                  str                = Field(description="The specific claim being challenged")
    context:                Optional[str]       = Field(default=None, description="Optional supporting context")
    candidates:             List[RazorCandidate] = Field(description="Relevant candidate razors for challenging the claim")
    challenge_instructions: Dict[str, Any]     = Field(description="Action guidelines for checking and challenging this claim")
