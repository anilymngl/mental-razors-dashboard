"""
tests/test_mcp_contract.py

Verifies the MCP server registers the correct tools, resources, and prompts,
and that the tools execute correctly against the GovernedFinding schema.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile

import pytest

from servers.mcp.server import mcp
from mental_razors.models import ReviewPacket, ClaimChallengePacket, ReviewRecord


# ── Tool / Resource / Prompt registration ────────────────────────────

@pytest.mark.asyncio
async def test_mcp_tool_registration():
    tools = await mcp.list_tools()
    tool_names = [t.name for t in tools]

    assert "search_razors" in tool_names
    assert "prepare_review" in tool_names
    assert "prepare_claim_challenge" in tool_names
    assert "record_review" in tool_names
    assert "record_outcome" in tool_names


@pytest.mark.asyncio
async def test_mcp_resource_registration():
    resources = await mcp.list_resources()
    uris = [str(r.uri) for r in resources]

    assert "razor://all" in uris
    assert "review-mode://all" in uris
    assert "knowledge://manifest" in uris


@pytest.mark.asyncio
async def test_mcp_prompt_registration():
    prompts = await mcp.list_prompts()
    names = [p.name for p in prompts]

    assert "architecture_review" in names
    assert "strategy_review" in names
    assert "postmortem_review" in names
    assert "product_review" in names
    assert "red_team_review" in names


# ── Tool execution ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search_razors_returns_results():
    results, _ = await mcp.call_tool("search_razors", {"query": "success legacy"})
    assert len(results) > 0
    parsed = json.loads(results[0].text)
    assert "razor_id" in parsed
    assert "retrieval_score" in parsed


@pytest.mark.asyncio
async def test_search_razors_filter_before_score():
    """
    When filtering by category, results must be drawn from that category only,
    even if other categories would score higher without the filter.
    """
    results, _ = await mcp.call_tool("search_razors", {
        "query": "over-engineering complexity microservices",
        "category": "expertise-traps",
        "limit": 5,
    })
    parsed = [json.loads(r.text) for r in results]
    # All returned razors must be from the requested category
    from mental_razors.loader import get_razors
    all_razors = {r["id"]: r for r in get_razors()}
    for p in parsed:
        razor = all_razors.get(p["razor_id"])
        assert razor is not None, f"Unknown razor_id: {p['razor_id']}"
        assert razor.get("category_id") == "expertise-traps", (
            f"Razor {p['razor_id']} is in category {razor.get('category_id')}, not expertise-traps"
        )


@pytest.mark.asyncio
async def test_prepare_review_returns_packet():
    results, _ = await mcp.call_tool("prepare_review", {
        "content": "Our system assumes optimal behavior from all users.",
        "mode": "architecture-review"
    })
    assert len(results) == 1
    parsed = json.loads(results[0].text)
    assert parsed["mode"] == "architecture-review"
    assert len(parsed["candidates"]) > 0
    assert parsed["review_instructions"]["role"] is not None


@pytest.mark.asyncio
async def test_prepare_claim_challenge_returns_packet():
    results, _ = await mcp.call_tool("prepare_claim_challenge", {
        "claim": "The economic forecast is perfectly predictable."
    })
    assert len(results) == 1
    parsed = json.loads(results[0].text)
    assert parsed["claim"] == "The economic forecast is perfectly predictable."
    assert len(parsed["candidates"]) > 0


@pytest.mark.asyncio
async def test_record_review_and_outcome_end_to_end(monkeypatch):
    """
    Full round-trip: record_review with GovernedFinding, then record_outcome.
    Verifies: server-side hashing, evidence validation, UUID generation, schema_version=3.
    """
    import uuid

    with tempfile.TemporaryDirectory() as tmp_dir:
        monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", tmp_dir)

        proposal = "Deploy three independent microservices for auth, profile, and logging."
        quote = "three independent microservices for auth, profile, and logging"
        start = proposal.index(quote)

        review_record_input = {
            "decision_id": "mcp-e2e-test-001",
            "mode": "quick-check",
            "proposal_text": proposal,
            "revised_text": None,
            "findings": [
                {
                    "razor_id": "over-engineering-razor",
                    "disposition": "mitigated",
                    "evidence_quote": quote,
                    "evidence_start": start,
                    "evidence_end": start + len(quote),
                    "causal_risk": "Three services add deployment overhead with no measured benefit.",
                    "diagnostic_question": "Have you profiled request boundaries?",
                    "false_positive_condition": "If each service has distinct team ownership.",
                    "bounded_action": "Merge into one service; split later if profiling confirms.",
                    "change_summary": "Merged three services into one.",
                }
            ],
            "decision_summary": "Mitigated: Merged three services into one.",
            "change_summary": "Reduced service count from three to one.",
            "review_duration_seconds": 180,
        }

        record_res, _ = await mcp.call_tool("record_review", {
            "review_record": review_record_input,
        })

        assert len(record_res) == 1
        parsed_record = json.loads(record_res[0].text)
        assert parsed_record["decision_id"] == "mcp-e2e-test-001"
        assert parsed_record["review_id"] is not None
        assert parsed_record["knowledge_version"] is not None
        assert parsed_record["schema_version"] == 3

        # Server must compute hash from proposal_text — caller never pre-computes it
        expected_hash = hashlib.sha256(proposal.encode()).hexdigest()
        assert parsed_record["initial_content_hash"] == expected_hash

        # Must be a valid UUID
        uuid.UUID(parsed_record["review_id"])

        # Governed finding must be stored with all five contract fields
        finding = parsed_record["findings"][0]
        assert finding["evidence_quote"] == quote
        assert finding["causal_risk"] is not None
        assert finding["diagnostic_question"] is not None
        assert finding["false_positive_condition"] is not None
        assert finding["bounded_action"] is not None

        # Record an outcome linked to this review
        outcome_input = {
            "review_id": parsed_record["review_id"],
            "observed_at": "2026-08-01",
            "status": "successful",
            "observations": ["System ran stably after merge."],
            "risks_materialized": [],
            "unexpected_issues": [],
            "confidence": "high",
        }

        outcome_res, _ = await mcp.call_tool("record_outcome", {
            "outcome": outcome_input,
        })
        assert len(outcome_res) == 1
        parsed_outcome = json.loads(outcome_res[0].text)
        assert parsed_outcome["review_id"] == parsed_record["review_id"]
        assert parsed_outcome["status"] == "successful"
        assert parsed_outcome["outcome_id"] is not None
        assert parsed_outcome["schema_version"] == 2


# ── Stdio startup ─────────────────────────────────────────────────────

def test_stdio_startup():
    """
    Start the MCP server as a subprocess; it should block waiting for
    stdio input (TimeoutExpired = success) rather than crash.
    """
    import os as _os
    project_root = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
    env = _os.environ.copy()
    env["PYTHONPATH"] = project_root

    proc = subprocess.Popen(
        [sys.executable, "servers/mcp/server.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=project_root,
        env=env,
    )
    try:
        exit_code = proc.wait(timeout=2.0)
        stderr = proc.stderr.read()
        raise AssertionError(
            f"Server exited with code {exit_code} immediately after start.\n"
            f"Stderr:\n{stderr}"
        )
    except subprocess.TimeoutExpired:
        # Success: server started and is blocking on stdin
        proc.terminate()
        proc.wait()
