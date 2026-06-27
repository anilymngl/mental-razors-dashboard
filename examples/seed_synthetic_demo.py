#!/usr/bin/env python3
"""
Synthetic Demo Data Seeder

Populates a DEMO data directory with 10 fabricated architecture review
records and outcome observations for illustrating report formatting.

THIS IS NOT REAL PILOT DATA. Records are explicitly marked
  "data_origin": "synthetic"
and the report header states "Synthetic Demo Report".

Usage:
    uv run python examples/seed_synthetic_demo.py
    uv run python examples/seed_synthetic_demo.py --output-dir /tmp/demo-data
    uv run python examples/seed_synthetic_demo.py --force   # overwrite existing

The script NEVER touches MENTAL_RAZORS_DATA_DIR or Application Support.
The default output directory is .demo-data/ inside the project root.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure project root is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mental_razors.loader import get_knowledge_version


SYNTHETIC_CASES = [
    {
        "decision_id": "syn-001",
        "mode": "architecture-review",
        "content": "Introduce a vector database for nine mental razors.",
        "findings": [
            {"razor_id": "over-engineering-razor", "disposition": "mitigated",
             "change_summary": "Switched to deterministic weighted retrieval."},
        ],
        "decision_summary": "Mitigated: Use deterministic weighted retrieval instead.",
        "change_summary": "Collapsed vector DB requirement into a Python module.",
        "review_duration_seconds": 240,
        "status": "successful",
        "observations": ["Retrieval met pilot requirements without vector DB overhead."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "high",
    },
    {
        "decision_id": "syn-002",
        "mode": "architecture-review",
        "content": "Deploy three independent microservices for profile, auth, and logging.",
        "findings": [
            {"razor_id": "complexity-razor", "disposition": "mitigated",
             "change_summary": "Merged into a single modular service."},
        ],
        "decision_summary": "Mitigated: Combined into one service.",
        "change_summary": "Reduced three services to one deployment unit.",
        "review_duration_seconds": 420,
        "status": "successful",
        "observations": ["Single service is easier to deploy and test."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "high",
    },
    {
        "decision_id": "syn-003",
        "mode": "architecture-review",
        "content": "Migrate legacy jQuery app to Next.js immediately with full rewrite.",
        "findings": [
            {"razor_id": "legacy-razor", "disposition": "deferred",
             "change_summary": "Step-by-step component migration instead."},
            {"razor_id": "simplicity-razor", "disposition": "rejected", "change_summary": None},
        ],
        "decision_summary": "Deferred: Migrate incrementally, not via full rewrite.",
        "change_summary": "Adopted component-by-component migration approach.",
        "review_duration_seconds": 510,
        "status": "mixed",
        "observations": ["Refactoring is slow but safe; avoided rewrite downtime."],
        "risks_materialized": ["legacy-razor"],
        "unexpected_issues": [],
        "confidence": "medium",
    },
    {
        "decision_id": "syn-004",
        "mode": "architecture-review",
        "content": "Add three evaluator agents, a vector layer, and an adjudication agent.",
        "findings": [
            {"razor_id": "granularity-razor", "disposition": "mitigated",
             "change_summary": "Scoped to one evaluator with classification metrics first."},
            {"razor_id": "over-engineering-razor", "disposition": "mitigated",
             "change_summary": "Removed vector layer and adjudication agent from scope."},
        ],
        "decision_summary": "Mitigated: Reduced to single evaluator layer.",
        "change_summary": "Deferred vector and adjudication layers until classification accuracy measured.",
        "review_duration_seconds": 390,
        "status": "successful",
        "observations": ["Single evaluator resolved most failures without multi-agent overhead."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "medium",
    },
    {
        "decision_id": "syn-005",
        "mode": "architecture-review",
        "content": "Create a custom serialization format for config files.",
        "findings": [
            {"razor_id": "simplicity-razor", "disposition": "mitigated",
             "change_summary": "Use YAML instead of custom format."},
        ],
        "decision_summary": "Mitigated: Use standard YAML parser.",
        "change_summary": "Eliminated custom format in favour of YAML.",
        "review_duration_seconds": 180,
        "status": "successful",
        "observations": ["YAML tooling worked without any extra integration."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "high",
    },
    {
        "decision_id": "syn-006",
        "mode": "architecture-review",
        "content": "Adopt new experimental JS framework just released on GitHub.",
        "findings": [
            {"razor_id": "innovation-razor", "disposition": "accepted",
             "change_summary": None},
        ],
        "decision_summary": "Accepted risk: team wants early experience with the framework.",
        "change_summary": None,
        "review_duration_seconds": 300,
        "status": "mixed",
        "observations": ["Framework had undocumented production bugs."],
        "risks_materialized": ["innovation-razor"],
        "unexpected_issues": ["Build size increased by 40%."],
        "confidence": "medium",
    },
    {
        "decision_id": "syn-007",
        "mode": "architecture-review",
        "content": "Add caching layer to all database reads before profiling.",
        "findings": [
            {"razor_id": "procrastination-razor", "disposition": "mitigated",
             "change_summary": "Profile DB latency first; cache only if bottleneck confirmed."},
        ],
        "decision_summary": "Mitigated: Defer caching until profiling confirms the bottleneck.",
        "change_summary": "Added profiling step before cache implementation.",
        "review_duration_seconds": 210,
        "status": "successful",
        "observations": ["DB query time was not the bottleneck; caching was unnecessary."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "high",
    },
    {
        "decision_id": "syn-008",
        "mode": "architecture-review",
        "content": "Rely on third-party API for checkout without any fallback.",
        "findings": [
            {"razor_id": "coherence-razor", "disposition": "mitigated",
             "change_summary": "Added pricing cache and fallback path."},
        ],
        "decision_summary": "Mitigated: Added checkout fallback caching.",
        "change_summary": "Introduced redundant pricing data source for checkout path.",
        "review_duration_seconds": 360,
        "status": "successful",
        "observations": ["Third-party API failed for 2 hours; caching saved checkout flow."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "high",
    },
    {
        "decision_id": "syn-009",
        "mode": "quick-check",
        "content": "Deploy pre-rendered HTML static website directly to CDN.",
        "findings": [],
        "decision_summary": "No findings. Proceed with deployment.",
        "change_summary": None,
        "review_duration_seconds": 120,
        "status": "successful",
        "observations": ["Website is fast and secure."],
        "risks_materialized": [],
        "unexpected_issues": [],
        "confidence": "high",
    },
    {
        "decision_id": "syn-010",
        "mode": "architecture-review",
        "content": "Build complex custom scheduling system with distributed locking.",
        "findings": [
            {"razor_id": "over-engineering-razor", "disposition": "accepted",
             "change_summary": None},
        ],
        "decision_summary": "Accepted risk: deadline prevents a simpler solution.",
        "change_summary": None,
        "review_duration_seconds": 480,
        "status": "failed",
        "observations": ["Operational ownership unclear; system broke repeatedly."],
        "risks_materialized": ["over-engineering-razor"],
        "unexpected_issues": ["Database lock escalation caused outages."],
        "confidence": "low",
    },
]


def write_record(f, record: dict) -> None:
    f.write(json.dumps(record, default=str) + "\n")


def seed(output_dir: str, force: bool) -> None:
    os.makedirs(output_dir, exist_ok=True)

    reviews_path  = os.path.join(output_dir, "reviews.jsonl")
    outcomes_path = os.path.join(output_dir, "outcomes.jsonl")

    for path in (reviews_path, outcomes_path):
        if os.path.exists(path) and not force:
            print(
                f"ERROR: {path} already exists.\n"
                "Use --force to overwrite, or choose a different --output-dir."
            )
            sys.exit(1)

    # Clear files only after both checks pass
    open(reviews_path,  "w").close()
    open(outcomes_path, "w").close()

    knowledge_ver = get_knowledge_version()

    with open(reviews_path, "a", encoding="utf-8") as rf, \
         open(outcomes_path, "a", encoding="utf-8") as of:

        for case in SYNTHETIC_CASES:
            review_id = str(uuid.uuid4())

            review = {
                "decision_id":             case["decision_id"],
                "mode":                    case["mode"],
                "initial_content_hash":    "synthetic",
                "final_content_hash":      None,
                "findings":                case["findings"],
                "decision_summary":        case["decision_summary"],
                "change_summary":          case.get("change_summary"),
                "review_duration_seconds": case["review_duration_seconds"],
                "review_id":               review_id,
                "created_at":              datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "knowledge_version":       knowledge_ver,
                "schema_version":          2,
                "data_origin":             "synthetic",
            }
            write_record(rf, review)

            outcome = {
                "review_id":          review_id,
                "observed_at":        "2026-08-01",
                "status":             case["status"],
                "observations":       case["observations"],
                "risks_materialized": case["risks_materialized"],
                "unexpected_issues":  case["unexpected_issues"],
                "confidence":         case["confidence"],
                "outcome_id":         str(uuid.uuid4()),
                "created_at":         datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "schema_version":     2,
                "data_origin":        "synthetic",
            }
            write_record(of, outcome)

    print(f"Seeded {len(SYNTHETIC_CASES)} synthetic cases to {output_dir}")
    print()
    print("To view the demo report:")
    print(f"  uv run python scripts/governance_report.py --data-dir {output_dir}")
    print()
    print("NOTE: This is a SYNTHETIC DEMO REPORT, not real governance evidence.")


def main() -> None:
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    parser = argparse.ArgumentParser(
        description="Seed synthetic demo data for governance report formatting."
    )
    parser.add_argument(
        "--output-dir",
        default=os.path.join(project_root, ".demo-data"),
        help="Directory to write demo records (default: .demo-data/). "
             "NEVER writes to MENTAL_RAZORS_DATA_DIR or Application Support.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing demo files.",
    )
    args = parser.parse_args()

    # Safety: refuse to write to real data directories
    real_data_dir = os.environ.get("MENTAL_RAZORS_DATA_DIR", "")
    if real_data_dir and os.path.abspath(args.output_dir) == os.path.abspath(real_data_dir):
        print("ERROR: --output-dir must not be MENTAL_RAZORS_DATA_DIR.")
        sys.exit(1)

    seed(args.output_dir, args.force)


if __name__ == "__main__":
    main()
