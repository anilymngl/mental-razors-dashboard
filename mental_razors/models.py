from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class EvidenceCandidate(BaseModel):
    quote: str = Field(description="Exact substring of the input content that matched")
    start: int = Field(description="Starting character index of the quote in the input")
    end: int = Field(description="Ending character index of the quote in the input")
    matched_signals: List[str] = Field(description="List of trigger words or indicators that matched the quote")

class RazorCandidate(BaseModel):
    razor_id: str = Field(description="Unique identifier for the razor")
    title: str = Field(description="Human-readable title of the razor")
    retrieval_score: float = Field(description="Relevance matching score")
    evidence: List[EvidenceCandidate] = Field(description="Traceable substring matches in the input content")
    diagnostic_questions: List[str] = Field(description="Concrete questions to probe this reasoning flaw")
    false_positive_conditions: List[str] = Field(description="Conditions under which this critique is a false positive")

class ReviewPacket(BaseModel):
    mode: str = Field(description="Review mode preset used (e.g., architecture-review)")
    candidates: List[RazorCandidate] = Field(description="Sorted list of relevant candidate razors and evidence")
    review_instructions: Dict[str, Any] = Field(description="Prompt guidelines for the host model")
    require_input_evidence: bool = Field(default=True, description="Enforce strict evidence referencing")
    allow_no_finding: bool = Field(default=True, description="Allow empty findings output")
    max_final_findings: int = Field(default=3, description="Suggested limit on final findings")

class ReviewRecordInput(BaseModel):
    decision_id: str = Field(description="User-provided identifier for the decision being audited")
    mode: str = Field(description="The review mode used")
    accepted_findings: List[str] = Field(description="List of razor IDs that were accepted as valid findings")
    rejected_findings: List[str] = Field(description="List of razor IDs that were rejected")
    decision: str = Field(description="The final decision or action taken")
    notes: Optional[str] = Field(default=None, description="Optional notes or context about the review")

class ReviewRecord(ReviewRecordInput):
    review_id: str = Field(description="UUID v4 identifier for the audit record")
    created_at: str = Field(description="ISO 8601 UTC timestamp")
    knowledge_version: str = Field(description="SHA-256 hash of the razors.yaml content")
    input_hash: str = Field(description="SHA-256 hash of the content that was reviewed")
    schema_version: int = Field(default=1, description="Format version of the audit trail")

class ClaimChallengePacket(BaseModel):
    claim: str = Field(description="The specific claim being challenged")
    context: Optional[str] = Field(default=None, description="Optional supporting context")
    candidates: List[RazorCandidate] = Field(description="Relevant candidate razors for challenging the claim")
    challenge_instructions: Dict[str, Any] = Field(description="Action guidelines for checking and challenging this claim")
