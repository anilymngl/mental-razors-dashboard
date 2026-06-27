from typing import Optional, Dict, Any
from mental_razors.models import ReviewPacket, ClaimChallengePacket
from mental_razors.retrieval import retrieve_candidates

DEFAULT_INSTRUCTIONS = {
    "architecture-review": {
        "role": "You are auditing a system architecture or design proposal for complexity and abstraction errors.",
        "guidelines": [
            "Use the supplied candidate razors only as hypotheses.",
            "For every accepted finding: quote exact evidence from the input; explain the causal risk; state a diagnostic question; state when the finding would be a false positive; recommend one bounded action.",
            "Reject weak candidates. Returning no findings is valid."
        ]
    },
    "strategy-review": {
        "role": "You are auditing a strategic plan or claim for cognitive blindspots and legacy bias.",
        "guidelines": [
            "Critique the strategy using the candidate razors.",
            "Look for confirmation bias, credentials over evidence, and historical path dependency.",
            "Quote exact evidence, explain the risk, and provide diagnostic questions."
        ]
    },
    "postmortem-review": {
        "role": "You are auditing a postmortem or retrospective report to ensure it doesn't construct stories/rationalizations.",
        "guidelines": [
            "Look for hindsight bias and post-hoc narratives.",
            "Verify if the explanations make testable predictions.",
            "For every accepted finding: provide evidence, explain risk, and suggest diagnostic questions."
        ]
    },
    "product-review": {
        "role": "You are auditing a product feature or design proposal.",
        "guidelines": [
            "Look for behavioral assumptions and over-engineering.",
            "Verify if the solution fits existing workflows or forces behavior changes without value.",
            "Quote evidence and suggest actions."
        ]
    },
    "quick-check": {
        "role": "You are performing a quick scan of the reasoning in this content.",
        "guidelines": [
            "Identify potential reasoning traps.",
            "Provide evidence, risk, and diagnostic questions for any matching razor."
        ]
    },
    "red-team": {
        "role": "You are performing a highly critical adversarial audit of this proposal.",
        "guidelines": [
            "Actively challenge assumptions, look for hidden over-engineering and legacy bias.",
            "Demand counterexamples and list false-positive conditions clearly.",
            "Quote evidence from the content."
        ]
    }
}

def prepare_review_packet(content: str, mode_id: str = "quick-check", max_candidates: int = 5) -> ReviewPacket:
    if mode_id not in DEFAULT_INSTRUCTIONS:
        raise ValueError(
            f"Invalid review mode '{mode_id}'. "
            f"Must be one of: {list(DEFAULT_INSTRUCTIONS.keys())}"
        )
        
    candidates = retrieve_candidates(content, mode_id=mode_id, max_candidates=max_candidates)
    review_instructions = DEFAULT_INSTRUCTIONS[mode_id]
    
    from mental_razors.models import ReviewContract
    contract = ReviewContract(
        require_exact_evidence=True,
        allow_no_finding=True,
        max_final_findings=3
    )
    return ReviewPacket(
        mode=mode_id,
        candidates=candidates,
        review_instructions=review_instructions,
        review_contract=contract
    )

def prepare_claim_challenge_packet(claim: str, context: Optional[str] = None) -> ClaimChallengePacket:
    query_content = f"{claim} {context or ''}"
    candidates = retrieve_candidates(query_content, mode_id="quick-check", max_candidates=3)
    
    challenge_instructions = {
        "role": "You are auditing a specific factual, theoretical or logical claim.",
        "guidelines": [
            "Assess whether the claim relies too heavily on credentials (Confidence Razor) or lacks simple, concrete failure examples (Simplicity Razor).",
            "Determine if the explanation is a coherent story rather than a model that generates testable predictions (Coherence Razor).",
            "State clear, specific boundary conditions where this claim would fail."
        ]
    }
    
    return ClaimChallengePacket(
        claim=claim,
        context=context,
        candidates=candidates,
        challenge_instructions=challenge_instructions
    )
