import os
import sys
import json
import uuid
import hashlib
from datetime import datetime, timezone

# Ensure project root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mental_razors.models import ReviewRecord, OutcomeRecord
from mental_razors.loader import get_knowledge_version

def populate_data():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    local_dir = os.path.join(project_root, '.local')
    os.makedirs(local_dir, exist_ok=True)
    
    reviews_file = os.path.join(local_dir, 'reviews.jsonl')
    outcomes_file = os.path.join(local_dir, 'outcomes.jsonl')
    
    # Clear existing local files
    open(reviews_file, 'w').close()
    open(outcomes_file, 'w').close()
    
    knowledge_ver = get_knowledge_version()
    
    # 10 Pilot decisions
    cases = [
        {
            "content": "Introduce a vector database for nine mental razors.",
            "decision_id": "dec-001",
            "mode": "architecture-review",
            "accepted": ["over-engineering-razor"],
            "rejected": [],
            "decision": "Mitigated: Use deterministic weighted retrieval instead.",
            "notes": "Changed architecture to simple python module.",
            "status": "successful",
            "obs": ["Retrieval met pilot requirements without vector DB overhead."],
            "risks": [],
            "unexpected": [],
            "confidence": "high"
        },
        {
            "content": "Deploy three independent microservices for user profile, authentication, and logging.",
            "decision_id": "dec-002",
            "mode": "architecture-review",
            "accepted": ["complexity-razor"],
            "rejected": [],
            "decision": "Mitigated: Combine into a single modular monolithic service.",
            "notes": "Reduced infrastructure complexity.",
            "status": "successful",
            "obs": ["Single service is easy to deploy and test. Microservices were unnecessary."],
            "risks": [],
            "unexpected": [],
            "confidence": "high"
        },
        {
            "content": "Migrate legacy jQuery app to Next.js immediately with a full rewrite.",
            "decision_id": "dec-003",
            "mode": "architecture-review",
            "accepted": ["legacy-razor"],
            "rejected": ["simplicity-razor"],
            "decision": "Deferred: Keep the legacy app while refactoring key components step-by-step.",
            "notes": "Risk deferred to next quarter.",
            "status": "mixed",
            "obs": ["Refactoring is slow but safe. Avoided rewrite downtime."],
            "risks": ["legacy-razor"],
            "unexpected": [],
            "confidence": "medium"
        },
        {
            "content": "Add three new evaluator agents, a vector retrieval layer, and an adjudication agent.",
            "decision_id": "dec-004",
            "mode": "architecture-review",
            "accepted": ["granularity-razor", "over-engineering-razor"],
            "rejected": [],
            "decision": "Mitigated: Add only one evaluation layer and test classification accuracy.",
            "notes": "Downscaled the initial agent hierarchy.",
            "status": "successful",
            "obs": ["Single evaluator resolved 90% of failures without multi-agent consensus coordination."],
            "risks": [],
            "unexpected": [],
            "confidence": "medium"
        },
        {
            "content": "Create a custom serialization format for config files.",
            "decision_id": "dec-005",
            "mode": "architecture-review",
            "accepted": ["simplicity-razor"],
            "rejected": [],
            "decision": "Mitigated: Use standard YAML parser.",
            "notes": "Standardized file formats.",
            "status": "successful",
            "obs": ["YAML was easier to integrate and standard python tools worked fine."],
            "risks": [],
            "unexpected": [],
            "confidence": "high"
        },
        {
            "content": "Adopt a new experimental JS framework just released on GitHub.",
            "decision_id": "dec-006",
            "mode": "architecture-review",
            "accepted": ["innovation-razor"],
            "rejected": [],
            "decision": "Rejected finding: Decided to proceed because we want to gain developer experience.",
            "notes": "Finding rejected by team consensus.",
            "status": "mixed",
            "obs": ["Framework was developer-friendly but had undocumented bugs in production."],
            "risks": ["innovation-razor"],
            "unexpected": ["Build size increased by 40%."],
            "confidence": "medium"
        },
        {
            "content": "Add broad caching layer to all database reads before profiling.",
            "decision_id": "dec-007",
            "mode": "architecture-review",
            "accepted": ["procrastination-razor"],
            "rejected": [],
            "decision": "Mitigated: Profile DB latency first, caching only if slow.",
            "notes": "Avoided premature cache implementation.",
            "status": "successful",
            "obs": ["Profilers showed DB query time was not the bottleneck."],
            "risks": [],
            "unexpected": [],
            "confidence": "high"
        },
        {
            "content": "Rely on third-party API availability for the checkout path without caching.",
            "decision_id": "dec-008",
            "mode": "architecture-review",
            "accepted": ["coherence-razor"],
            "rejected": [],
            "decision": "Mitigated: Add fallback pricing database caching.",
            "notes": "Introduced checkout redundancy.",
            "status": "successful",
            "obs": ["Third-party API failed for 2 hours, caching saved checkout flow."],
            "risks": [],
            "unexpected": [],
            "confidence": "high"
        },
        {
            "content": "Deploy pre-rendered HTML static website directly to CDN.",
            "decision_id": "dec-009",
            "mode": "quick-check",
            "accepted": [],
            "rejected": [],
            "decision": "Accepted: Clean review, proceed with deployment.",
            "notes": "No findings generated.",
            "status": "successful",
            "obs": ["Website is fast and secure. Simple design worked."],
            "risks": [],
            "unexpected": [],
            "confidence": "high"
        },
        {
            "content": "Build complex custom scheduling system.",
            "decision_id": "dec-010",
            "mode": "architecture-review",
            "accepted": ["over-engineering-razor"],
            "rejected": [],
            "decision": "Accepted risk: Team consciously accepted over-engineering risk due to deadline.",
            "notes": "Risk accepted due to time limit.",
            "status": "failed",
            "obs": ["Operational ownership remained unclear and system broke repeatedly."],
            "risks": ["over-engineering-razor"],
            "unexpected": ["Database lock escalation issues."],
            "confidence": "low"
        }
    ]
    
    for case in cases:
        review_id = str(uuid.uuid4())
        content_hash = hashlib.sha256(case["content"].encode('utf-8')).hexdigest()
        
        # Save review
        review = ReviewRecord(
            decision_id=case["decision_id"],
            mode=case["mode"],
            accepted_findings=case["accepted"],
            rejected_findings=case["rejected"],
            decision=case["decision"],
            notes=case["notes"],
            review_id=review_id,
            created_at=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            knowledge_version=knowledge_ver,
            input_hash=content_hash,
            schema_version=1
        )
        
        with open(reviews_file, 'a', encoding='utf-8') as f:
            f.write(review.model_dump_json() + '\n')
            
        # Save outcome
        outcome = OutcomeRecord(
            review_id=review_id,
            observed_at=case["observed_at"] if "observed_at" in case else "2026-08-01",
            status=case["status"],
            observations=case["obs"],
            risks_materialized=case["risks"],
            unexpected_issues=case["unexpected"],
            confidence=case["confidence"],
            outcome_id=str(uuid.uuid4()),
            created_at=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            schema_version=1
        )
        
        with open(outcomes_file, 'a', encoding='utf-8') as f:
            f.write(outcome.model_dump_json() + '\n')
            
    print(f"Successfully populated 10 decisions and outcomes to {local_dir}")

if __name__ == '__main__':
    populate_data()
