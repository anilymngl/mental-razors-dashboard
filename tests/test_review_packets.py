import pytest
from mental_razors.review import prepare_review_packet, prepare_claim_challenge_packet

def test_prepare_review_packet():
    content = "Our software has been very successful in the past. However, developers are defensive about traditional methods."
    packet = prepare_review_packet(content, mode_id="architecture-review", max_candidates=2)
    
    assert packet.mode == "architecture-review"
    assert len(packet.candidates) <= 2
    assert packet.require_input_evidence is True
    assert packet.allow_no_finding is True
    assert "guidelines" in packet.review_instructions
    
    # Substring invariant check
    for cand in packet.candidates:
        for ev in cand.evidence:
            assert content[ev.start:ev.end] == ev.quote

def test_prepare_claim_challenge_packet():
    claim = "Deep Learning models are optimal for all datasets because they mimic the human brain."
    context = "This is a claim by an ML researcher with three PhDs."
    
    packet = prepare_claim_challenge_packet(claim, context)
    assert packet.claim == claim
    assert packet.context == context
    assert len(packet.candidates) > 0
    assert "guidelines" in packet.challenge_instructions
    
    # Verify candidate properties
    for cand in packet.candidates:
        assert cand.razor_id in ["simplicity-razor", "confidence-razor", "coherence-razor", "legacy-razor", "complexity-razor"]

def test_invalid_review_mode():
    with pytest.raises(ValueError, match="Invalid review mode 'invalid-mode'"):
        prepare_review_packet("Some content", mode_id="invalid-mode")

def test_no_finding_case():
    # Content that is clear, modular, and does not contain any of our 9 razor indicators
    clean_content = "The static website loads pre-rendered HTML files directly from a fast CDN. We run automated checks on every commit."
    packet = prepare_review_packet(clean_content, mode_id="quick-check")
    # Should have no candidates or only candidates with 0 evidence since the content has no matches
    for cand in packet.candidates:
        assert len(cand.evidence) == 0
