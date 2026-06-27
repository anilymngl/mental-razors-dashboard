# Implementation Plan — Mental Razors: Governance MCP & Proof Plan

Transform `mental-razors-dashboard` into an evidence-grounded decision review layer for technical governance. The V1 implementation focuses specifically on **Architecture Decision Reviews (ADR)**, major design proposals, and technical plans.

---

## 1. Product & Governance Core Thesis

Mental Razors MCP acts as an evidence-grounded review layer. It does not replace human reviewers or make automated decisions. It enforces a strict governance contract:
- Every finding must consist of: **Exact evidence**, **Causal risk**, **Diagnostic question**, **False-positive condition**, and **Bounded action**.
- Every accepted finding results in one of four human dispositions: `MITIGATED`, `ACCEPTED`, `DEFERRED`, or `REJECTED`.
- Outcomes are captured later to close the feedback loop and prove process value.

---

## 2. Pydantic Model Extensions (`mental_razors/models.py`)

We will restructure `ReviewPacket` to expose a nested `ReviewContract` and define models for capturing outcomes:

```python
class ReviewContract(BaseModel):
    require_exact_evidence: bool = Field(default=True, description="Enforce strict evidence referencing")
    allow_no_finding: bool = Field(default=True, description="Allow empty findings output")
    max_final_findings: int = Field(default=3, description="Suggested limit on final findings")

class ReviewPacket(BaseModel):
    mode: str = Field(description="Review mode preset used")
    candidates: List[RazorCandidate] = Field(description="Relevant candidate razors and evidence")
    review_instructions: Dict[str, Any] = Field(description="Prompt guidelines for host model")
    review_contract: ReviewContract = Field(default_factory=ReviewContract, description="The governance contract constraints")

class OutcomeRecordInput(BaseModel):
    review_id: str = Field(description="Referenced review ID from record_review")
    observed_at: str = Field(description="ISO 8601 date string of the observation, e.g., YYYY-MM-DD")
    status: str = Field(description="Status of the outcome: successful | mixed | failed | unknown")
    observations: List[str] = Field(description="List of observations or notes")
    risks_materialized: List[str] = Field(description="List of razor IDs or risk descriptions that materialized")
    unexpected_issues: List[str] = Field(description="List of unexpected issues encountered")
    confidence: str = Field(description="Confidence rating: low | medium | high")

class OutcomeRecord(OutcomeRecordInput):
    outcome_id: str = Field(description="UUID v4 identifier for this outcome record")
    created_at: str = Field(description="ISO 8601 UTC timestamp")
    schema_version: int = Field(default=1, description="Format version of the outcome trail")
```

---

## 3. Storage Additions (`mental_razors/storage.py`)

Expose a new function `record_outcome` to append outcome logs to `outcomes.jsonl` located in the gitignored storage directory:
- Appends `OutcomeRecord` models to `outcomes.jsonl`.
- Ensures XDG/Application Support overrides and local fallback directories are fully synchronized with review storage paths.

---

## 4. MCP Server Updates (`servers/mcp/server.py`)

Hook up the new `record_outcome` tool to the MCP server.

```python
@mcp.tool()
def record_outcome(
    review_id: str,
    outcome: OutcomeRecordInput,
) -> OutcomeRecord:
    """
    Record observations, materialized risks, and decision success rates
    for a completed review.
    """
    # Enforce review_id matching between path parameters and body input
    outcome.review_id = review_id
    return store_outcome(outcome)
```

---

## 5. Governance Report Script (`scripts/governance_report.py`)

Create a CLI script that parses both `reviews.jsonl` and `outcomes.jsonl` to compile process metrics:
- **Decisions reviewed**: total records.
- **Accepted vs. Rejected findings**: count distribution.
- **Decision change rate**: reviews where the disposition led to concrete design updates.
- **Median review duration** (simulated or parsed if timestamps permit).
- **Materialized risks vs. Unanticipated risks** compilation.
- Outputs a clean Markdown report to stdout and a JSON summary to `.local/governance_summary.json`.

---

## 6. Verification and Testing

### Unit and Integration Tests
- **tests/test_storage.py**: Validate outcome appending, Pydantic type constraints, and link verification (rejection of malformed status/confidence).
- **tests/test_mcp_contract.py**: Verify `record_outcome` tool contract parameters are exposed, and execute it in-process.

### The Proof Evals
- **Track A (Retrospective Cases)**: Curate 20 case studies of historical engineering decisions (8 failed, 6 succeeded, 6 mixed), run them through the review tool (blinding outcomes), and check whether accepted findings predicted the materialized failures.
- **Track B (Prospective Pilot)**: Review 10 live design proposals, track decision updates, and follow up in 2–6 weeks to record outcomes.
