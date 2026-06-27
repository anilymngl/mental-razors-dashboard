import json
from typing import Optional, List, Dict, Any
from mcp.server.fastmcp import FastMCP
from mcp.types import PromptMessage, TextContent

from mental_razors.loader import (
    get_razors,
    get_categories,
    get_review_modes,
    get_knowledge_version
)
from mental_razors.retrieval import retrieve_candidates, tokenize
from mental_razors.review import (
    prepare_review_packet,
    prepare_claim_challenge_packet,
    DEFAULT_INSTRUCTIONS
)
from mental_razors.storage import record_review as store_review, record_outcome as store_outcome
from mental_razors.models import (
    ReviewPacket,
    ClaimChallengePacket,
    ReviewRecordInput,
    ReviewRecord,
    RazorCandidate,
    OutcomeRecordInput,
    OutcomeRecord
)

# Initialize FastMCP Server
mcp = FastMCP("mental-razors")

# =====================================================================
# RESOURCES: Declarative, read-only knowledge access
# =====================================================================

@mcp.resource("razor://all")
def list_all_razors() -> str:
    """List all 9 mental razors in JSON format"""
    return json.dumps(get_razors(), indent=2, ensure_ascii=False)

@mcp.resource("razor://{razor_id}")
def get_razor_details(razor_id: str) -> str:
    """Retrieve details for a specific mental razor by ID"""
    razors = get_razors()
    razor = next((r for r in razors if r.get('id') == razor_id), None)
    if not razor:
        return json.dumps({"error": f"Razor '{razor_id}' not found"}, indent=2)
    return json.dumps(razor, indent=2, ensure_ascii=False)

@mcp.resource("review-mode://all")
def list_all_review_modes() -> str:
    """List all review modes configurations in JSON format"""
    return json.dumps(get_review_modes(), indent=2, ensure_ascii=False)

@mcp.resource("review-mode://{mode_id}")
def get_review_mode_details(mode_id: str) -> str:
    """Retrieve details for a specific review mode by ID"""
    modes = get_review_modes()
    mode = next((m for m in modes if m.get('id') == mode_id), None)
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
        "modes_count": len(get_review_modes())
    }, indent=2)

# =====================================================================
# TOOLS: Executable operations and state side-effects
# =====================================================================

@mcp.tool()
def search_razors(
    query: str,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    limit: int = 5
) -> List[RazorCandidate]:
    """
    Search the mental razors database using the shared weighted keyword retrieval engine.
    Filters the results by category or tags if provided.
    """
    # Call core weighted retrieval (retrieve_candidates) with large bounds so we can filter
    candidates = retrieve_candidates(query, mode_id="quick-check", max_candidates=limit * 3)
    
    # Filter candidates by category and tags if requested
    filtered = []
    razors = get_razors()
    for cand in candidates:
        razor = next((r for r in razors if r.get('id') == cand.razor_id), None)
        if not razor:
            continue
            
        if category and razor.get('category_id') != category:
            continue
        if tags and not all(t in razor.get('tags', []) for t in tags):
            continue
            
        filtered.append(cand)
        if len(filtered) >= limit:
            break
            
    return filtered

@mcp.tool()
def prepare_review(
    content: str,
    mode: str = "quick-check",
    max_candidates: int = 5
) -> ReviewPacket:
    """
    Scan input content, retrieve relevant candidate razors and evidence substrings,
    and output a ReviewPacket payload with host model guidelines.
    """
    return prepare_review_packet(content, mode_id=mode, max_candidates=max_candidates)

@mcp.tool()
def prepare_claim_challenge(
    claim: str,
    context: Optional[str] = None
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
    The caller must compute initial_content_hash (SHA-256 of the original proposal)
    and optionally final_content_hash if the proposal was revised.
    Findings must be structured FindingDecision records with explicit dispositions.
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
    for g in instructions['guidelines']:
        prompt += f"- {g}\n"
    prompt += f"\n====================================\n"
    prompt += f"Content to Audited:\n"
    prompt += f"====================================\n"
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
