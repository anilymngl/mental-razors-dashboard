import os
import tempfile
import json
import pytest
from mental_razors.models import ReviewRecordInput, OutcomeRecordInput
from mental_razors.storage import get_storage_dir, record_review, record_outcome

def test_storage_dir_override(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Override env var
        monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", tmp_dir)
        
        storage_dir = get_storage_dir()
        assert storage_dir == tmp_dir

def test_record_review(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp_dir:
        monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", tmp_dir)
        
        input_data = ReviewRecordInput(
            decision_id="test-decision-123",
            mode="quick-check",
            accepted_findings=["legacy-razor"],
            rejected_findings=["simplicity-razor"],
            decision="Refactor legacy code step-by-step",
            notes="Audit log test"
        )
        
        content = "We decided to keep the legacy codebase because it works fine."
        
        # Save record
        record = record_review(input_data, content=content)
        
        assert record.decision_id == "test-decision-123"
        assert record.mode == "quick-check"
        assert record.review_id is not None
        assert record.created_at.endswith("Z")
        assert record.knowledge_version is not None
        
        # Verify hash matches SHA-256 of the actual content
        import hashlib
        expected_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        assert record.input_hash == expected_hash
        
        # Verify that changing content changes the hash
        other_content = "Completely different text to review."
        other_record = record_review(input_data, content=other_content)
        assert other_record.input_hash != record.input_hash
        assert other_record.input_hash == hashlib.sha256(other_content.encode('utf-8')).hexdigest()
        
        # Verify JSONL file exists and is written to
        history_file = os.path.join(tmp_dir, 'reviews.jsonl')
        assert os.path.exists(history_file)
        
        with open(history_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        assert len(lines) == 2
        saved_record = json.loads(lines[0])
        assert saved_record["decision_id"] == "test-decision-123"
        assert saved_record["review_id"] == record.review_id
        assert saved_record["knowledge_version"] == record.knowledge_version
        assert saved_record["input_hash"] == expected_hash

def test_record_outcome(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp_dir:
        monkeypatch.setenv("MENTAL_RAZORS_DATA_DIR", tmp_dir)
        
        outcome_data = OutcomeRecordInput(
            review_id="test-review-uuid-456",
            observed_at="2026-08-01",
            status="successful",
            observations=["The combined service ran without any operational issues."],
            risks_materialized=[],
            unexpected_issues=[],
            confidence="medium"
        )
        
        record = record_outcome(outcome_data)
        
        assert record.review_id == "test-review-uuid-456"
        assert record.status == "successful"
        assert record.outcome_id is not None
        assert record.created_at.endswith("Z")
        
        # Check files
        outcome_file = os.path.join(tmp_dir, 'outcomes.jsonl')
        assert os.path.exists(outcome_file)
        
        with open(outcome_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        assert len(lines) == 1
        saved_record = json.loads(lines[0])
        assert saved_record["review_id"] == "test-review-uuid-456"
        assert saved_record["status"] == "successful"
        assert saved_record["outcome_id"] == record.outcome_id

        # Verify invalid status raising ValueError
        bad_status_data = OutcomeRecordInput(
            review_id="test-review-uuid-456",
            observed_at="2026-08-01",
            status="invalid-status-key",
            observations=[],
            risks_materialized=[],
            unexpected_issues=[],
            confidence="medium"
        )
        with pytest.raises(ValueError, match="Invalid outcome status"):
            record_outcome(bad_status_data)

        # Verify invalid confidence raising ValueError
        bad_confidence_data = OutcomeRecordInput(
            review_id="test-review-uuid-456",
            observed_at="2026-08-01",
            status="successful",
            observations=[],
            risks_materialized=[],
            unexpected_issues=[],
            confidence="super-high"
        )
        with pytest.raises(ValueError, match="Invalid outcome confidence"):
            record_outcome(bad_confidence_data)

