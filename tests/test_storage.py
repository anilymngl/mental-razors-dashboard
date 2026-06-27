"""
tests/test_storage.py

Tests for mental_razors/storage.py using controlled fixtures.
All tests use a temporary directory (via monkeypatch) to avoid
touching real data directories.
"""
from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import date

import pytest

from mental_razors.models import (
    FindingDispositionEnum,
    GovernedFinding,
    OutcomeConfidence,
    OutcomeRecordInput,
    OutcomeStatus,
    ReviewRecordInput,
)
from mental_razors.storage import (
    _sha256,
    get_storage_dir,
    load_outcomes,
    load_reviews,
    record_outcome,
    record_review,
    review_id_exists,
)


# ── Fixtures ──────────────────────────────────────────────────────────

PROPOSAL = "We should add three independent microservices for auth, profile and logging."

def _mitigated_finding() -> GovernedFinding:
    """A fully governed finding with a valid evidence quote from PROPOSAL."""
    quote = "three independent microservices for auth, profile and logging"
    start = PROPOSAL.index(quote)
    return GovernedFinding(
        razor_id="over-engineering-razor",
        disposition=FindingDispositionEnum.mitigated,
        evidence_quote=quote,
        evidence_start=start,
        evidence_end=start + len(quote),
        causal_risk="Three services add deployment overhead with no measured benefit.",
        diagnostic_question="Have you profiled request boundaries between these services?",
        false_positive_condition="If each service has distinct team ownership and separate release cadence.",
        bounded_action="Merge into one service; split later if profiling shows clear boundaries.",
        change_summary="Merged three services into a single modular service.",
    )


def _rejected_finding() -> GovernedFinding:
    """A rejected finding — no evidence required."""
    return GovernedFinding(
        razor_id="legacy-razor",
        disposition=FindingDispositionEnum.rejected,
    )


def _make_review_input(**kwargs) -> ReviewRecordInput:
    defaults = dict(
        decision_id="test-001",
        mode="architecture-review",
        proposal_text=PROPOSAL,
        revised_text=None,
        findings=[_mitigated_finding()],
        decision_summary="Mitigated over-engineering by merging services.",
        change_summary="Merged three services into one.",
        review_duration_seconds=300,
    )
    defaults.update(kwargs)
    return ReviewRecordInput(**defaults)


def _make_outcome_input(review_id: str, **kwargs) -> OutcomeRecordInput:
    defaults = dict(
        review_id=uuid.UUID(review_id),
        observed_at=date(2026, 8, 1),
        status=OutcomeStatus.successful,
        observations=["System ran stably."],
        risks_materialized=[],
        unexpected_issues=[],
        confidence=OutcomeConfidence.high,
    )
    defaults.update(kwargs)
    return OutcomeRecordInput(**defaults)


# ── Storage directory ─────────────────────────────────────────────────

def test_storage_dir_env_override(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    assert get_storage_dir() == str(tmp_path)


# ── record_review — basic persistence ────────────────────────────────

def test_record_review_writes_jsonl(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    inp = _make_review_input()
    rec = record_review(inp)

    assert rec.review_id is not None
    assert rec.created_at.endswith("Z")
    assert rec.knowledge_version is not None
    assert rec.schema_version == 3  # GovernedFinding schema

    path = tmp_path / "reviews.jsonl"
    assert path.exists()
    rows = path.read_text().splitlines()
    assert len(rows) == 1
    saved = json.loads(rows[0])
    assert saved["review_id"] == rec.review_id
    assert saved["decision_id"] == "test-001"


def test_record_review_server_computes_hash(monkeypatch, tmp_path):
    """The server must compute initial_content_hash from proposal_text, not trust the caller."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    inp = _make_review_input()
    rec = record_review(inp)

    expected_hash = _sha256(PROPOSAL)
    assert rec.initial_content_hash == expected_hash


def test_record_review_revised_text_hash(monkeypatch, tmp_path):
    """If revised_text is provided, the server stores its SHA-256 as final_content_hash."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    revised = "We will deploy a single modular service."
    inp = _make_review_input(revised_text=revised)
    rec = record_review(inp)

    assert rec.final_content_hash == _sha256(revised)
    assert rec.initial_content_hash == _sha256(PROPOSAL)
    assert rec.final_content_hash != rec.initial_content_hash


def test_record_review_no_revised_text(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rec = record_review(_make_review_input(revised_text=None))
    assert rec.final_content_hash is None


# ── GovernedFinding persistence ───────────────────────────────────────

def test_record_review_stores_governed_finding_fields(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rec = record_review(_make_review_input())
    saved = json.loads((tmp_path / "reviews.jsonl").read_text())
    finding = saved["findings"][0]

    assert finding["razor_id"] == "over-engineering-razor"
    assert finding["disposition"] == "mitigated"
    assert finding["evidence_quote"] == "three independent microservices for auth, profile and logging"
    assert finding["causal_risk"] is not None
    assert finding["diagnostic_question"] is not None
    assert finding["false_positive_condition"] is not None
    assert finding["bounded_action"] is not None
    assert finding["change_summary"] == "Merged three services into a single modular service."


def test_record_review_rejected_finding_no_evidence_required(monkeypatch, tmp_path):
    """Rejected findings do not require evidence — they should be accepted as-is."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rec = record_review(_make_review_input(findings=[_rejected_finding()]))
    saved = json.loads((tmp_path / "reviews.jsonl").read_text())
    finding = saved["findings"][0]
    assert finding["disposition"] == "rejected"
    assert finding["evidence_quote"] is None


def test_record_review_stores_duration(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rec = record_review(_make_review_input(review_duration_seconds=421))
    assert rec.review_duration_seconds == 421
    saved = json.loads((tmp_path / "reviews.jsonl").read_text())
    assert saved["review_duration_seconds"] == 421


def test_record_review_duration_optional(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rec = record_review(_make_review_input(review_duration_seconds=None))
    assert rec.review_duration_seconds is None


def test_record_review_appends_multiple(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    record_review(_make_review_input(decision_id="dec-A"))
    record_review(_make_review_input(decision_id="dec-B"))
    rows = (tmp_path / "reviews.jsonl").read_text().splitlines()
    assert len(rows) == 2


# ── Evidence validation ───────────────────────────────────────────────

def test_record_review_rejects_wrong_evidence_quote(monkeypatch, tmp_path):
    """evidence_quote must exactly match proposal_text[start:end]."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    quote = "three independent microservices for auth, profile and logging"
    start = PROPOSAL.index(quote)
    bad_finding = GovernedFinding(
        razor_id="over-engineering-razor",
        disposition=FindingDispositionEnum.mitigated,
        evidence_quote="WRONG TEXT that does not appear in the proposal",
        evidence_start=start,
        evidence_end=start + len(quote),
        causal_risk="x",
        diagnostic_question="x",
        false_positive_condition="x",
        bounded_action="x",
    )
    with pytest.raises(ValueError, match="Evidence validation failed"):
        record_review(_make_review_input(findings=[bad_finding]))


def test_record_review_rejects_missing_evidence_for_non_rejected(monkeypatch, tmp_path):
    """Non-rejected findings without evidence fields should be rejected."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    bad_finding = GovernedFinding(
        razor_id="over-engineering-razor",
        disposition=FindingDispositionEnum.mitigated,
        # No evidence_quote, evidence_start, evidence_end
    )
    with pytest.raises(ValueError, match="missing required evidence fields"):
        record_review(_make_review_input(findings=[bad_finding]))


def test_record_review_rejects_unknown_razor_id(monkeypatch, tmp_path):
    """razor_ids must exist in the knowledge base."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    bad_finding = GovernedFinding(
        razor_id="does-not-exist-razor",
        disposition=FindingDispositionEnum.rejected,
    )
    with pytest.raises(ValueError, match="Unknown razor ID"):
        record_review(_make_review_input(findings=[bad_finding]))


# ── review_id_exists ──────────────────────────────────────────────────

def test_review_id_exists_true(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rec = record_review(_make_review_input())
    assert review_id_exists(rec.review_id, str(tmp_path))


def test_review_id_exists_false(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    assert not review_id_exists("does-not-exist", str(tmp_path))


# ── record_outcome ────────────────────────────────────────────────────

def test_record_outcome_requires_existing_review(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    fake_id = str(uuid.uuid4())
    inp = _make_outcome_input(fake_id)
    with pytest.raises(ValueError, match="No review with id"):
        record_outcome(inp, storage_dir=str(tmp_path))


def test_record_outcome_writes_jsonl(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rev = record_review(_make_review_input())
    inp = _make_outcome_input(rev.review_id)
    out = record_outcome(inp, storage_dir=str(tmp_path))

    assert out.outcome_id is not None
    assert out.review_id == rev.review_id
    assert out.status == OutcomeStatus.successful

    path = tmp_path / "outcomes.jsonl"
    assert path.exists()
    saved = json.loads(path.read_text())
    assert saved["review_id"] == rev.review_id
    assert saved["status"] == "successful"
    assert saved["outcome_id"] == out.outcome_id
    assert saved["schema_version"] == 2


def test_record_outcome_allows_multiple_per_review(monkeypatch, tmp_path):
    """Multiple outcome observations per review are allowed."""
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    rev = record_review(_make_review_input())
    record_outcome(_make_outcome_input(rev.review_id, observed_at=date(2026, 8, 1)), storage_dir=str(tmp_path))
    record_outcome(_make_outcome_input(rev.review_id, observed_at=date(2026, 9, 1)), storage_dir=str(tmp_path))
    rows = (tmp_path / "outcomes.jsonl").read_text().splitlines()
    assert len(rows) == 2
    assert all(json.loads(r)["review_id"] == rev.review_id for r in rows)


def test_outcome_status_enum_validated_by_pydantic():
    """Pydantic should reject invalid status values."""
    with pytest.raises(Exception):
        OutcomeRecordInput(
            review_id=uuid.uuid4(),
            observed_at=date(2026, 8, 1),
            status="invalid-status",   # type: ignore
            observations=[],
            risks_materialized=[],
            unexpected_issues=[],
            confidence=OutcomeConfidence.medium,
        )


def test_outcome_confidence_enum_validated_by_pydantic():
    with pytest.raises(Exception):
        OutcomeRecordInput(
            review_id=uuid.uuid4(),
            observed_at=date(2026, 8, 1),
            status=OutcomeStatus.successful,
            observations=[],
            risks_materialized=[],
            unexpected_issues=[],
            confidence="super-high",  # type: ignore
        )


def test_outcome_date_typed():
    """observed_at must be a date, not an arbitrary string."""
    with pytest.raises(Exception):
        OutcomeRecordInput(
            review_id=uuid.uuid4(),
            observed_at="tomorrow maybe",  # type: ignore
            status=OutcomeStatus.successful,
            observations=[],
            risks_materialized=[],
            unexpected_issues=[],
            confidence=OutcomeConfidence.medium,
        )


# ── load helpers ──────────────────────────────────────────────────────

def test_load_reviews_returns_empty_list_when_no_file(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    assert load_reviews(str(tmp_path)) == []


def test_load_outcomes_returns_empty_list_when_no_file(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    assert load_outcomes(str(tmp_path)) == []
