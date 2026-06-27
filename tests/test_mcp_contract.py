import pytest
from servers.mcp.server import mcp
from mental_razors.models import ReviewPacket, ClaimChallengePacket, ReviewRecord

@pytest.mark.asyncio
async def test_mcp_tool_registration():
    # Retrieve registered tools via FastMCP public API
    tools = await mcp.list_tools()
    tool_names = [t.name for t in tools]
    
    assert "search_razors" in tool_names
    assert "prepare_review" in tool_names
    assert "prepare_claim_challenge" in tool_names
    assert "record_review" in tool_names
    assert "record_outcome" in tool_names

@pytest.mark.asyncio
async def test_mcp_resource_registration():
    # Retrieve registered resources via FastMCP public API
    resources = await mcp.list_resources()
    uris = [str(r.uri) for r in resources]
    
    assert "razor://all" in uris
    assert "review-mode://all" in uris
    assert "knowledge://manifest" in uris

@pytest.mark.asyncio
async def test_mcp_prompt_registration():
    # Retrieve registered prompts via FastMCP public API
    prompts = await mcp.list_prompts()
    names = [p.name for p in prompts]
    
    assert "architecture_review" in names
    assert "strategy_review" in names
    assert "postmortem_review" in names
    assert "product_review" in names
    assert "red_team_review" in names

@pytest.mark.asyncio
async def test_mcp_tool_execution(monkeypatch):
    import json
    import tempfile
    
    # 1. search_razors
    search_res, _ = await mcp.call_tool("search_razors", {"query": "success legacy"})
    assert len(search_res) > 0
    # Check that output is valid JSON matching RazorCandidate schema
    parsed_search = json.loads(search_res[0].text)
    assert parsed_search["razor_id"] == "legacy-razor"
    assert parsed_search["retrieval_score"] > 0
    
    # 2. prepare_review
    review_res, _ = await mcp.call_tool("prepare_review", {
        "content": "Our system assumes optimal behavior from all users.",
        "mode": "architecture-review"
    })
    assert len(review_res) == 1
    parsed_review = json.loads(review_res[0].text)
    assert parsed_review["mode"] == "architecture-review"
    assert len(parsed_review["candidates"]) > 0
    assert parsed_review["review_instructions"]["role"] is not None
    
    # 3. prepare_claim_challenge
    challenge_res, _ = await mcp.call_tool("prepare_claim_challenge", {
        "claim": "The economic forecast is perfectly predictable."
    })
    assert len(challenge_res) == 1
    parsed_challenge = json.loads(challenge_res[0].text)
    assert parsed_challenge["claim"] == "The economic forecast is perfectly predictable."
    assert len(parsed_challenge["candidates"]) > 0
    
    # 4. record_review
    with tempfile.TemporaryDirectory() as tmp_dir:
        monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", tmp_dir)
        
        review_record_input = {
            "decision_id": "mcp-test-123",
            "mode": "quick-check",
            "accepted_findings": ["complexity-razor"],
            "rejected_findings": [],
            "decision": "Add error boundary fallback component.",
            "notes": "Testing record_review tool"
        }
        reviewed_content = "This is the content being reviewed."
        
        record_res, _ = await mcp.call_tool("record_review", {
            "review_record": review_record_input,
            "reviewed_content": reviewed_content
        })
        
        assert len(record_res) == 1
        parsed_record = json.loads(record_res[0].text)
        assert parsed_record["decision_id"] == "mcp-test-123"
        assert parsed_record["review_id"] is not None
        assert parsed_record["input_hash"] is not None
        
        # Verify hash matches SHA-256 of reviewed_content
        import hashlib
        expected_hash = hashlib.sha256(reviewed_content.encode('utf-8')).hexdigest()
        assert parsed_record["input_hash"] == expected_hash

        # 5. record_outcome
        outcome_input = {
            "review_id": parsed_record["review_id"],
            "observed_at": "2026-08-01",
            "status": "successful",
            "observations": ["System performed stably under load."],
            "risks_materialized": [],
            "unexpected_issues": [],
            "confidence": "high"
        }
        outcome_res, _ = await mcp.call_tool("record_outcome", {
            "review_id": parsed_record["review_id"],
            "outcome": outcome_input
        })
        assert len(outcome_res) == 1
        parsed_outcome = json.loads(outcome_res[0].text)
        assert parsed_outcome["review_id"] == parsed_record["review_id"]
        assert parsed_outcome["status"] == "successful"
        assert parsed_outcome["outcome_id"] is not None

def test_stdio_startup():
    import subprocess
    import sys
    
    # Run the server directly. It should block waiting on stdio input.
    proc = subprocess.Popen(
        [sys.executable, "servers/mcp/server.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    try:
        # If it crashed on boot, wait() will finish immediately.
        # If it works, it blocks waiting on stdin, throwing a TimeoutExpired.
        exit_code = proc.wait(timeout=1.0)
        # If it exited, verify it exited cleanly
        assert exit_code == 0
    except subprocess.TimeoutExpired:
        # Success - server started and blocks on stdio input
        proc.terminate()
        proc.wait()


