from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


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
# FINDING DISPOSITION — per-razor structured decision
# =====================================================================

class FindingDecision(BaseModel):
    razor_id:       str                   = Field(description="ID of the razor this finding refers to")
    disposition:    FindingDispositionEnum = Field(description="How this finding was treated: mitigated | accepted | deferred | rejected")
    change_summary: Optional[str]         = Field(default=None, description="What changed in the proposal as a result (for mitigated/deferred)")


# =====================================================================
# REVIEW RECORD — stored after a human completes a review
# =====================================================================

class ReviewRecordInput(BaseModel):
    decision_id:             str                    = Field(description="User-provided identifier for the decision being audited")
    mode:                    str                    = Field(description="The review mode used")
    initial_content_hash:    str                    = Field(description="SHA-256 of the proposal text at review start")
    final_content_hash:      Optional[str]          = Field(default=None, description="SHA-256 of the proposal after revision (None if unchanged)")
    findings:                List[FindingDecision]  = Field(description="Per-razor structured disposition records")
    decision_summary:        str                    = Field(description="One-sentence summary of the final decision")
    change_summary:          Optional[str]          = Field(default=None, description="What materially changed as a result of the review")
    review_duration_seconds: Optional[int]          = Field(default=None, description="Wall-clock review time in seconds (optional, self-reported)")


class ReviewRecord(ReviewRecordInput):
    review_id:         str = Field(description="UUID v4 identifier for the audit record")
    created_at:        str = Field(description="ISO 8601 UTC timestamp")
    knowledge_version: str = Field(description="SHA-256 hash of the razors.yaml content")
    schema_version:    int = Field(default=2, description="Format version of the audit trail")


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
    # All OutcomeRecordInput fields (flattened for serialization clarity)
    review_id:          str               = Field(description="UUID of the review this outcome is linked to (stored as string)")
    observed_at:        str               = Field(description="Date the outcome was observed (ISO format)")
    status:             OutcomeStatus     = Field(description="Outcome status")
    observations:       List[str]         = Field(description="Free-form notes")
    risks_materialized: List[str]         = Field(description="Razor IDs that materialized")
    unexpected_issues:  List[str]         = Field(description="Unanticipated issues")
    confidence:         OutcomeConfidence = Field(description="Assessment confidence")
    # Storage metadata
    outcome_id:         str = Field(description="UUID v4 identifier for this outcome record")
    created_at:         str = Field(description="ISO 8601 UTC timestamp")
    schema_version:     int = Field(default=2, description="Format version of the outcome trail")


# =====================================================================
# CLAIM CHALLENGE
# =====================================================================

class ClaimChallengePacket(BaseModel):
    claim:                  str                = Field(description="The specific claim being challenged")
    context:                Optional[str]       = Field(default=None, description="Optional supporting context")
    candidates:             List[RazorCandidate] = Field(description="Relevant candidate razors for challenging the claim")
    challenge_instructions: Dict[str, Any]     = Field(description="Action guidelines for checking and challenging this claim")
