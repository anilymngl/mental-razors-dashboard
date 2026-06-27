import json
from typing import Optional, List, Dict, Any
from mcp.server.fastmcp import FastMCP
from mcp.types import PromptMessage, TextContent

from mental_razors.loader import (
    get_razors,
    get_categories,
    get_review_modes,
    get_knowledge_version,
)
from mental_razors.retrieval import retrieve_candidates, tokenize, score_razor, extract_evidence
from mental_razors.review import (
    prepare_review_packet,
    prepare_claim_challenge_packet,
    DEFAULT_INSTRUCTIONS,
)
from mental_razors.storage import record_review as store_review, record_outcome as store_outcome
from mental_razors.models import (
    ReviewPacket,
    ClaimChallengePacket,
    ReviewRecordInput,
    ReviewRecord,
    RazorCandidate,
    GovernedFinding,
    OutcomeRecordInput,
    OutcomeRecord,
)

# Initialize FastMCP Server
mcp = FastMCP("mental-razors")

# =====================================================================
# RESOURCES: Declarative, read-only knowledge access
# =====================================================================

@mcp.resource("razor://all")
def list_all_razors() -> str:
    """List all mental razors in JSON format"""
    return json.dumps(get_razors(), indent=2, ensure_ascii=False)

@mcp.resource("razor://{razor_id}")
def get_razor_details(razor_id: str) -> str:
    """Retrieve details for a specific mental razor by ID"""
    razors = get_razors()
    razor = next((r for r in razors if r.get("id") == razor_id), None)
    if not razor:
        return json.dumps({"error": f"Razor '{razor_id}' not found"}, indent=2)
    return json.dumps(razor, indent=2, ensure_ascii=False)

@mcp.resource("review-mode://all")
def list_all_review_modes() -> str:
    """List all review mode configurations in JSON format"""
    return json.dumps(get_review_modes(), indent=2, ensure_ascii=False)

@mcp.resource("review-mode://{mode_id}")
def get_review_mode_details(mode_id: str) -> str:
    """Retrieve details for a specific review mode by ID"""
    modes = get_review_modes()
    mode = next((m for m in modes if m.get("id") == mode_id), None)
    if not mode:
        return json.dumps({"error": f"Review mode '{mode_id}' not found"}, indent=2)
    return json.dumps(mode, indent=2, ensure_ascii=False)

@mcp.resource("knowledge://manifest")
def get_knowledge_manifest() -> str:
    """Retrieve meta information about the compiled knowledge base"""
    return json.dumps({
        "knowledge_version": get_knowledge_version(),
        "categories_count": len(get_categories()),
        "razors_count": len(get_razors()),
        "modes_count": len(get_review_modes()),
    }, indent=2)

# =====================================================================
# TOOLS: Executable operations and state side-effects
# =====================================================================

@mcp.tool()
def search_razors(
    query: str,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 5,
) -> List[RazorCandidate]:
    """
    Search the mental razors database using the shared weighted keyword retrieval engine.

    Applies category and tag filters BEFORE scoring so that narrowly-scoped filters
    never lose results that would rank inside limit after filtering but outside limit*N
    before filtering. Filter → Score → Truncate, not Score → Truncate → Filter.
    """
    all_razors = get_razors()

    # Step 1: Filter eligible razors before scoring
    eligible = []
    for r in all_razors:
        if category and r.get("category_id") != category:
            continue
        if tags and not all(t in r.get("tags", []) for t in tags):
            continue
        eligible.append(r)

    # Step 2: Score each eligible razor
    query_tokens = set(tokenize(query))
    scored = []
    for r in eligible:
        sc = score_razor(r, query_tokens, prioritize=[])
        evidence = extract_evidence(query, r)
        if sc > 0 or evidence:
            scored.append((r, sc, evidence))

    # Step 3: Sort and truncate
    scored.sort(key=lambda x: (len(x[2]) > 0, x[1]), reverse=True)

    candidates = []
    for r, sc, evidence in scored[:limit]:
        candidates.append(RazorCandidate(
            razor_id=r["id"],
            title=r.get("title", ""),
            retrieval_score=sc,
            evidence=evidence,
            diagnostic_questions=r.get("diagnostic_questions", []),
            false_positive_conditions=r.get("false_positive_conditions", []),
        ))

    return candidates


@mcp.tool()
def prepare_review(
    content: str,
    mode: str = "quick-check",
    max_candidates: int = 5,
) -> ReviewPacket:
    """
    Scan input content, retrieve relevant candidate razors and evidence substrings,
    and return a ReviewPacket with host model guidelines and the review contract.
    """
    return prepare_review_packet(content, mode_id=mode, max_candidates=max_candidates)


@mcp.tool()
def prepare_claim_challenge(
    claim: str,
    context: Optional[str] = None,
) -> ClaimChallengePacket:
    """
    Create a challenge blueprint targeting a factual or logical claim.
    Retrieves relevant refutational razors and provides challenge guidelines.
    """
    return prepare_claim_challenge_packet(claim, context)


@mcp.tool()
def record_review(
    review_record: ReviewRecordInput,
) -> ReviewRecord:
    """
    Store a completed review to the append-only reviews.jsonl.

    The server (not the caller) performs these operations:
    - Computes SHA-256(proposal_text) stored as initial_content_hash
    - Computes SHA-256(revised_text) stored as final_content_hash (if provided)
    - Validates all razor_ids against the knowledge base
    - Validates evidence_quote[evidence_start:evidence_end] == proposal_text substring
      for every non-rejected GovernedFinding
    - Discards proposal_text and revised_text after validation; only hashes are stored

    Each non-rejected GovernedFinding should include:
      evidence_quote, evidence_start, evidence_end  — verbatim substring of proposal_text
      causal_risk                — what could go wrong if finding is ignored
      diagnostic_question        — the question asked to probe this flaw
      false_positive_condition   — when this finding would be a false positive
      bounded_action             — one recommended action
    """
    return store_review(review_record)


@mcp.tool()
def record_outcome(
    outcome: OutcomeRecordInput,
) -> OutcomeRecord:
    """
    Record an outcome observation for a completed review.
    The referenced review_id must exist in reviews.jsonl.
    Multiple outcomes per review are allowed (e.g., 2-week, 6-week, 3-month check-ins).
    """
    return store_outcome(outcome)


# =====================================================================
# PROMPTS: Structured host-model workflows
# =====================================================================

def render_prompt_template(mode_id: str, content: str) -> str:
    instructions = DEFAULT_INSTRUCTIONS.get(mode_id, DEFAULT_INSTRUCTIONS["quick-check"])
    prompt = f"Role: {instructions['role']}\n\n"
    prompt += "Strict Guidelines:\n"
    for g in instructions["guidelines"]:
        prompt += f"- {g}\n"
    prompt += "\n====================================\n"
    prompt += "Content to Audit:\n"
    prompt += "====================================\n"
    prompt += f"{content}\n"
    return prompt


@mcp.prompt()
def architecture_review(content: str) -> str:
    """Prompt workflow for auditing system design proposals"""
    return render_prompt_template("architecture-review", content)


@mcp.prompt()
def strategy_review(content: str) -> str:
    """Prompt workflow for auditing business or technical strategies"""
    return render_prompt_template("strategy-review", content)


@mcp.prompt()
def postmortem_review(content: str) -> str:
    """Prompt workflow for auditing incident retrospectives"""
    return render_prompt_template("postmortem-review", content)


@mcp.prompt()
def product_review(content: str) -> str:
    """Prompt workflow for auditing product feature specs"""
    return render_prompt_template("product-review", content)


@mcp.prompt()
def red_team_review(content: str) -> str:
    """Prompt workflow for adversarial testing of arguments or claims"""
    return render_prompt_template("red-team", content)


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
