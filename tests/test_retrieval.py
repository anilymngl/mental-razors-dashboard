import pytest
from mental_razors.retrieval import retrieve_candidates, tokenize, score_razor, extract_evidence
from mental_razors.loader import get_razors

def test_tokenize():
    tokens = tokenize("This is a simple TEST of the legacy-razor system!")
    # Stop words (this, is, a, of, the) are filtered out, punctuation is stripped
    assert "simple" in tokens
    assert "test" in tokens
    assert "legacy" in tokens
    assert "razor" in tokens
    assert "system" in tokens
    assert "this" not in tokens
    assert "is" not in tokens

def test_legacy_razor_retrieval():
    content = "Our software has been very successful in the past. However, developers are defensive about traditional methods and dismissive of new approaches."
    candidates = retrieve_candidates(content, mode_id="quick-check", max_candidates=3)
    
    assert len(candidates) > 0
    top_candidate = candidates[0]
    assert top_candidate.razor_id == "legacy-razor"
    assert len(top_candidate.evidence) > 0
    
    # Substring verification: quote matches index range
    evidence = top_candidate.evidence[0]
    assert content[evidence.start:evidence.end] == evidence.quote

def test_over_engineering_retrieval():
    content = "This design has too many moving parts. The developers are confused and there are frequent breakages in interconnected modules."
    candidates = retrieve_candidates(content, mode_id="quick-check", max_candidates=3)
    
    assert len(candidates) > 0
    top_candidate = candidates[0]
    assert top_candidate.razor_id == "over-engineering-razor"
    
    # Check that warning signals match
    has_breakages = False
    for ev in top_candidate.evidence:
        if "frequent breakages" in ev.quote:
            has_breakages = True
            break
    assert has_breakages

def test_priority_mode_boost():
    # Content has words matching legacy-razor and complexity-razor
    content = "The legacy system worked. But it assumes optimal behavior and has no fault tolerance."
    
    # Under quick-check, complexity-razor and legacy-razor will compete
    candidates_quick = retrieve_candidates(content, mode_id="quick-check", max_candidates=1)
    
    # Under architecture-review, complexity-razor is prioritized
    candidates_arch = retrieve_candidates(content, mode_id="architecture-review", max_candidates=1)
    
    assert len(candidates_arch) == 1
    assert candidates_arch[0].razor_id == "complexity-razor"
