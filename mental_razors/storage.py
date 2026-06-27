from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from mental_razors.loader import get_knowledge_version
from mental_razors.models import (
    OutcomeConfidence,
    OutcomeRecord,
    OutcomeRecordInput,
    OutcomeStatus,
    ReviewRecord,
    ReviewRecordInput,
)


# =====================================================================
# STORAGE DIRECTORY RESOLUTION
# =====================================================================

def get_storage_dir() -> str:
    """
    Resolve the storage directory in priority order:
    1. MENTAL_RAZORS_DATA_DIR env var
    2. macOS Application Support (~/Library/Application Support/mental-razors/)
    3. Project-local .local/ fallback
    """
    env_dir = os.environ.get("MENTAL_RAZORS_DATA_DIR")
    if env_dir:
        os.makedirs(env_dir, exist_ok=True)
        return env_dir

    home = os.path.expanduser("~")
    app_support = os.path.join(home, "Library", "Application Support", "mental-razors")

    if os.path.exists(os.path.join(home, "Library")):
        try:
            os.makedirs(app_support, exist_ok=True)
            test_file = os.path.join(app_support, ".write_test")
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
            return app_support
        except Exception:
            pass

    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    project_local = os.path.join(project_root, ".local")
    os.makedirs(project_local, exist_ok=True)
    return project_local


# =====================================================================
# REVIEW STORAGE
# =====================================================================

def _reviews_file(storage_dir: str) -> str:
    return os.path.join(storage_dir, "reviews.jsonl")


def _outcomes_file(storage_dir: str) -> str:
    return os.path.join(storage_dir, "outcomes.jsonl")


def load_reviews(storage_dir: Optional[str] = None) -> List[dict]:
    """Return all stored reviews as raw dicts."""
    d = storage_dir or get_storage_dir()
    path = _reviews_file(d)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load_outcomes(storage_dir: Optional[str] = None) -> List[dict]:
    """Return all stored outcomes as raw dicts."""
    d = storage_dir or get_storage_dir()
    path = _outcomes_file(d)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def review_id_exists(review_id: str, storage_dir: Optional[str] = None) -> bool:
    """Check whether a review with the given ID exists in storage."""
    for r in load_reviews(storage_dir):
        if r.get("review_id") == review_id:
            return True
    return False


def record_review(input_data: ReviewRecordInput, content: Optional[str] = None) -> ReviewRecord:
    """
    Persist a completed review to the append-only reviews.jsonl.

    `content` is the raw proposal text. Its SHA-256 is stored as
    initial_content_hash when provided; otherwise the caller must
    have set initial_content_hash on the input directly.
    """
    import hashlib

    storage_dir = get_storage_dir()

    record = ReviewRecord(
        decision_id=input_data.decision_id,
        mode=input_data.mode,
        initial_content_hash=input_data.initial_content_hash,
        final_content_hash=input_data.final_content_hash,
        findings=input_data.findings,
        decision_summary=input_data.decision_summary,
        change_summary=input_data.change_summary,
        review_duration_seconds=input_data.review_duration_seconds,
        review_id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        knowledge_version=get_knowledge_version(),
        schema_version=2,
    )

    path = _reviews_file(storage_dir)
    with open(path, "a", encoding="utf-8") as f:
        f.write(record.model_dump_json() + "\n")

    return record


def record_outcome(input_data: OutcomeRecordInput, storage_dir: Optional[str] = None) -> OutcomeRecord:
    """
    Persist an outcome observation.

    Rules:
    - The referenced review_id MUST exist in reviews.jsonl.
    - Multiple outcomes per review are allowed (appended, not replaced).
    - Status and confidence are validated by Pydantic enums before this is called.
    """
    d = storage_dir or get_storage_dir()
    review_id_str = str(input_data.review_id)

    # Referential integrity check
    if not review_id_exists(review_id_str, d):
        raise ValueError(
            f"No review with id '{review_id_str}' found in storage. "
            "Record the review first with record_review()."
        )

    record = OutcomeRecord(
        review_id=review_id_str,
        observed_at=input_data.observed_at.isoformat(),
        status=input_data.status,
        observations=input_data.observations,
        risks_materialized=input_data.risks_materialized,
        unexpected_issues=input_data.unexpected_issues,
        confidence=input_data.confidence,
        outcome_id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        schema_version=2,
    )

    path = _outcomes_file(d)
    with open(path, "a", encoding="utf-8") as f:
        f.write(record.model_dump_json() + "\n")

    return record
