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
import tempfile
import uuid
from datetime import date

import pytest

from mental_razors.models import (
    FindingDecision,
    FindingDispositionEnum,
    OutcomeConfidence,
    OutcomeRecordInput,
    OutcomeStatus,
    ReviewRecordInput,
)
from mental_razors.storage import (
    get_storage_dir,
    load_outcomes,
    load_reviews,
    record_outcome,
    record_review,
    review_id_exists,
)


# ── Fixtures ──────────────────────────────────────────────────────────

def _make_review_input(**kwargs) -> ReviewRecordInput:
    defaults = dict(
        decision_id="test-001",
        mode="architecture-review",
        initial_content_hash=hashlib.sha256(b"the proposal").hexdigest(),
        final_content_hash=None,
        findings=[
            FindingDecision(
                razor_id="over-engineering-razor",
                disposition=FindingDispositionEnum.mitigated,
                change_summary="Collapsed three services into one.",
            )
        ],
        decision_summary="Mitigated over-engineering by simplifying service boundaries.",
        change_summary="Merged three services into one module.",
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


# ── record_review ─────────────────────────────────────────────────────

def test_record_review_writes_jsonl(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    inp = _make_review_input()
    rec = record_review(inp)

    assert rec.review_id is not None
    assert rec.created_at.endswith("Z")
    assert rec.knowledge_version is not None
    assert rec.schema_version == 2

    path = tmp_path / "reviews.jsonl"
    assert path.exists()
    rows = path.read_text().splitlines()
    assert len(rows) == 1
    saved = json.loads(rows[0])
    assert saved["review_id"] == rec.review_id
    assert saved["decision_id"] == "test-001"


def test_record_review_stores_finding_dispositions(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    inp = _make_review_input(
        findings=[
            FindingDecision(
                razor_id="legacy-razor",
                disposition=FindingDispositionEnum.accepted,
                change_summary=None,
            ),
            FindingDecision(
                razor_id="simplicity-razor",
                disposition=FindingDispositionEnum.rejected,
                change_summary=None,
            ),
        ]
    )
    rec = record_review(inp)
    saved = json.loads((tmp_path / "reviews.jsonl").read_text())
    findings = saved["findings"]
    assert len(findings) == 2
    assert findings[0]["razor_id"] == "legacy-razor"
    assert findings[0]["disposition"] == "accepted"
    assert findings[1]["disposition"] == "rejected"


def test_record_review_duration_is_stored(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    inp = _make_review_input(review_duration_seconds=421)
    rec = record_review(inp)
    assert rec.review_duration_seconds == 421
    saved = json.loads((tmp_path / "reviews.jsonl").read_text())
    assert saved["review_duration_seconds"] == 421


def test_record_review_duration_optional(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    inp = _make_review_input(review_duration_seconds=None)
    rec = record_review(inp)
    assert rec.review_duration_seconds is None


def test_record_review_appends_multiple(monkeypatch, tmp_path):
    monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", str(tmp_path))
    record_review(_make_review_input(decision_id="dec-A"))
    record_review(_make_review_input(decision_id="dec-B"))
    rows = (tmp_path / "reviews.jsonl").read_text().splitlines()
    assert len(rows) == 2


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
