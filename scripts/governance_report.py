#!/usr/bin/env python3
"""
Governance Pilot Report

Compiles real governance metrics from reviews.jsonl and outcomes.jsonl.

Usage:
    uv run python scripts/governance_report.py
    uv run python scripts/governance_report.py --data-dir .local
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict
from statistics import median
from typing import Dict, List

# Ensure project root is on PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mental_razors.storage import get_storage_dir


def load_jsonl(path: str) -> List[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def format_duration(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}m {s}s"


def compile_report(data_dir: str) -> dict:
    reviews  = load_jsonl(os.path.join(data_dir, "reviews.jsonl"))
    outcomes = load_jsonl(os.path.join(data_dir, "outcomes.jsonl"))

    # ── Outcome grouping: review_id → list of outcomes (multi-outcome support) ──
    outcomes_by_review: Dict[str, List[dict]] = defaultdict(list)
    for o in outcomes:
        outcomes_by_review[o["review_id"]].append(o)

    total_reviews = len(reviews)

    # ── Per-review metrics ──
    reviews_with_accepted   = 0
    decisions_changed       = 0   # at least one finding disposition == "mitigated"
    risks_explicitly_accepted = 0  # at least one disposition == "accepted"
    no_finding_reviews      = 0

    # Finding-level disposition counting
    disposition_counts: Dict[str, int] = {"mitigated": 0, "accepted": 0,
                                           "deferred": 0, "rejected": 0}
    razor_acceptance_counts: Dict[str, int] = {}

    # Review duration (only from records where review_duration_seconds is set)
    real_durations: List[int] = []

    for r in reviews:
        findings = r.get("findings", [])
        dispositions = [f.get("disposition", "") for f in findings]

        has_accepted = any(d in ("mitigated", "accepted", "deferred") for d in dispositions)
        if has_accepted:
            reviews_with_accepted += 1
        else:
            no_finding_reviews += 1

        if "mitigated" in dispositions:
            decisions_changed += 1
        if "accepted" in dispositions or "deferred" in dispositions:
            risks_explicitly_accepted += 1

        for f in findings:
            d = f.get("disposition", "")
            if d in disposition_counts:
                disposition_counts[d] += 1
            if d in ("mitigated", "accepted", "deferred"):
                razor_id = f.get("razor_id", "unknown")
                razor_acceptance_counts[razor_id] = razor_acceptance_counts.get(razor_id, 0) + 1

        dur = r.get("review_duration_seconds")
        if dur is not None and isinstance(dur, int) and dur > 0:
            real_durations.append(dur)

    # ── Outcome metrics ──
    decisions_with_followup = len(outcomes_by_review)
    total_followup_observations = len(outcomes)

    # Anticipated vs unanticipated risk correlation
    # anticipated_and_accepted: materialized risk matches an "accepted/deferred" finding
    # anticipated_but_rejected:  materialized risk matches a "rejected" finding — powerful signal
    # unanticipated: not referenced in any finding
    anticipated_and_accepted = 0
    anticipated_but_rejected  = 0
    unanticipated             = 0

    for r in reviews:
        review_id = r.get("review_id", "")
        findings  = r.get("findings", [])
        accepted_razor_ids = {
            f["razor_id"] for f in findings
            if f.get("disposition") in ("mitigated", "accepted", "deferred")
        }
        rejected_razor_ids = {
            f["razor_id"] for f in findings
            if f.get("disposition") == "rejected"
        }

        for o in outcomes_by_review.get(review_id, []):
            for rm in o.get("risks_materialized", []):
                if rm in accepted_razor_ids:
                    anticipated_and_accepted += 1
                elif rm in rejected_razor_ids:
                    anticipated_but_rejected += 1
                else:
                    unanticipated += 1
            for _ in o.get("unexpected_issues", []):
                unanticipated += 1

    # Sorted razor acceptance table
    sorted_razors = sorted(razor_acceptance_counts.items(), key=lambda x: x[1], reverse=True)

    # Median duration — only if we have real observations
    if real_durations:
        median_duration_seconds = median(real_durations)
        median_duration_display = format_duration(median_duration_seconds)
        duration_note = f"Based on {len(real_durations)} self-reported timing(s)."
    else:
        median_duration_seconds = None
        median_duration_display = "No timing data recorded"
        duration_note = "Set review_duration_seconds in ReviewRecordInput to enable this metric."

    summary = {
        "decisions_reviewed":          total_reviews,
        "reviews_with_accepted_findings": reviews_with_accepted,
        "decisions_materially_changed": decisions_changed,
        "risks_explicitly_accepted":   risks_explicitly_accepted,
        "no_finding_reviews":          no_finding_reviews,
        "median_review_time_seconds":  median_duration_seconds,
        "disposition_counts":          disposition_counts,
        "outcome_follow_ups_decisions": decisions_with_followup,
        "outcome_follow_ups_total_observations": total_followup_observations,
        "anticipated_and_accepted_risks": anticipated_and_accepted,
        "anticipated_but_rejected_risks": anticipated_but_rejected,
        "unanticipated_risks":         unanticipated,
        "frequent_razors":             sorted_razors[:5],
    }
    return summary


def render_markdown(s: dict, data_dir: str) -> str:
    lines = [
        "# Governance Pilot Report\n",
        f"Data directory: `{data_dir}`\n",
        f"Decisions reviewed: {s['decisions_reviewed']}",
        f"Reviews with accepted findings: {s['reviews_with_accepted_findings']}",
        f"Decisions materially changed (mitigated): {s['decisions_materially_changed']}",
        f"Risks explicitly accepted or deferred: {s['risks_explicitly_accepted']}",
        f"No-finding reviews: {s['no_finding_reviews']}",
        f"Median review time: {s['median_review_time_seconds'] and format_duration(s['median_review_time_seconds']) or 'No timing data recorded'}",
        "",
        "## Disposition breakdown",
    ]
    dc = s["disposition_counts"]
    lines += [
        f"  Mitigated: {dc['mitigated']}",
        f"  Accepted:  {dc['accepted']}",
        f"  Deferred:  {dc['deferred']}",
        f"  Rejected:  {dc['rejected']}",
        "",
        "## Most frequently accepted razors",
    ]
    if s["frequent_razors"]:
        for idx, (razor_id, count) in enumerate(s["frequent_razors"], 1):
            title = razor_id.replace("-", " ").title()
            lines.append(f"  {idx}. {title} — {count}")
    else:
        lines.append("  No findings recorded yet.")

    lines += [
        "",
        "## Outcome follow-ups",
        f"  Decisions with at least one follow-up: {s['outcome_follow_ups_decisions']}/{s['decisions_reviewed']}",
        f"  Total outcome observations: {s['outcome_follow_ups_total_observations']}",
        "",
        "## Risk correlation",
        f"  Anticipated & accepted (review found it, risk materialized):  {s['anticipated_and_accepted_risks']}",
        f"  Anticipated & rejected (review flagged, team rejected, risk materialized): {s['anticipated_but_rejected_risks']}",
        f"  Unanticipated (not predicted by any finding): {s['unanticipated_risks']}",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mental Razors Governance Report")
    parser.add_argument(
        "--data-dir",
        default=None,
        help="Directory containing reviews.jsonl and outcomes.jsonl. "
             "Defaults to MENTAL_RAZORS_DATA_DIR or Application Support.",
    )
    args = parser.parse_args()

    data_dir = args.data_dir or get_storage_dir()
    summary  = compile_report(data_dir)

    print(render_markdown(summary, data_dir))
    print()

    # Save JSON summary
    summary_path = os.path.join(data_dir, "governance_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)
    print(f"JSON summary saved to {summary_path}")


if __name__ == "__main__":
    main()
