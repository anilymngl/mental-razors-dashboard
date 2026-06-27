# Walkthrough — Final Engineering Slice

**Branch:** `feature/mcp-knowledge-kernel-clean`
**Test result:** 48/48 passing · Build: `npm run build` clean

---

## What was built (final engineering slice)

### 1. `GovernedFinding` — the full five-part contract

**Problem:** The stored finding contained only `razor_id + disposition + change_summary`.
The audit history could not answer: what evidence was accepted? what causal risk was claimed?
what question was asked? under what condition was the finding a false positive?

**Fix (`mental_razors/models.py`):**
```python
class GovernedFinding(BaseModel):
    razor_id:   str
    disposition: FindingDispositionEnum  # mitigated | accepted | deferred | rejected

    # Evidence — verbatim substring from original proposal (required for non-rejected)
    evidence_quote:    Optional[str]  # proposal_text[start:end] == evidence_quote (validated)
    evidence_start:    Optional[int]
    evidence_end:      Optional[int]

    # Five-part review contract
    causal_risk:          Optional[str]  # what goes wrong if finding is ignored
    diagnostic_question:  Optional[str]  # the concrete question asked
    false_positive_condition: Optional[str]  # when this critique is wrong
    bounded_action:       Optional[str]  # one specific recommended action

    change_summary: Optional[str]  # what materially changed
```

`ReviewRecord.schema_version` bumped to 3. `FindingDecision` kept as backward-compatible alias.

---

### 2. Server-side hashing + evidence validation

**Problem:** `ReviewRecordInput` required the caller to pre-compute SHA-256 hashes. Hashes
were plain strings with no validation. Evidence quotes were trusted without verification.

**Fix (`mental_razors/storage.py`):**
- `ReviewRecordInput` now accepts `proposal_text` and optional `revised_text`
- `record_review()` performs three operations before writing:
  1. `_sha256(proposal_text)` → `initial_content_hash`
  2. `_sha256(revised_text)` → `final_content_hash` (if provided)
  3. `_validate_razor_ids()` — all razor_ids must exist in knowledge base
  4. `_validate_finding_evidence()` — for non-rejected findings, asserts
     `proposal_text[evidence_start:evidence_end] == evidence_quote` exactly
- Raw text discarded after validation; only hashes are stored

---

### 3. `search_razors` — filter-before-score

**Problem:** Old implementation scored all razors → truncated to `limit * 3` → filtered by category/tag.
Razors ranked outside `limit * 3` unfiltered but inside `limit` after filtering were silently dropped.

**Fix (`servers/mcp/server.py`):**
```
Old: score_all → truncate(limit*3) → filter → truncate(limit)
New: filter → score_eligible → truncate(limit)
```
Category and tag filtering now always produces the correct top-`limit` results within the requested scope.

---

### 4. GitHub Actions CI

**Added (`.github/workflows/ci.yml`):**
```yaml
jobs:
  python:   uv sync → compile_knowledge.py --check → pytest tests/ -v
  frontend: npm ci  → npm run build
```
Triggers: push to `main`/`feature/**`, PRs to `main`.

---

### 5. CLI entrypoints (`pyproject.toml`)

```toml
[project.scripts]
mental-razors-mcp    = "servers.mcp.server:main"
mental-razors-report = "scripts.governance_report:main"
```

After `uv sync`, users can run `mental-razors-mcp` directly from anywhere.

---

### 6. README rewritten as governance product documentation

Covers:
- Architecture diagram
- MCP installation + Claude Desktop config snippet
- Complete lifecycle example (prepare → record → outcome → report)
- All GovernedFinding fields documented with purpose
- Data storage directory resolution table
- MCP tools + resources reference tables
- Synthetic demo data instructions

---

## Proof

| Check | Result |
|---|---|
| `uv run python -m pytest tests/ -v` | ✅ 48/48 passed |
| `npm run build` | ✅ Compiled successfully |
| Evidence validation: wrong quote | ✅ `ValueError: Evidence validation failed` |
| Evidence validation: missing fields | ✅ `ValueError: missing required evidence fields` |
| Unknown razor_id | ✅ `ValueError: Unknown razor ID(s)` |
| Server-side hash verification | ✅ `initial_content_hash == SHA-256(proposal_text)` |
| search_razors category filter | ✅ All results within requested category |
| 5 new commits pushed | ✅ `feature/mcp-knowledge-kernel-clean` |

### Validation commands

```bash
# Full test suite
uv run python -m pytest tests/ -v

# Build
npm run build

# Demo report with synthetic data
uv run python examples/seed_synthetic_demo.py
uv run python scripts/governance_report.py --data-dir .demo-data

# Knowledge YAML validation
uv run python scripts/compile_knowledge.py --check
```

---

## Updated scorecard

| Dimension | Before | After |
|---|---|---|
| Architecture | 8.5/10 | 8.5/10 (unchanged) |
| Implementation integrity | 7.5/10 | **9/10** |
| Governance enforceability | 6/10 | **8.5/10** |
| External usability | 4.5/10 | **7.5/10** |
| Proof of value | 2/10 | 2/10 (needs real pilots) |
| Pilot readiness | 7.5/10 | **9/10** |

---

## What remains

The system is now **pilot-ready**. The only thing that raises proof-of-value is running real decisions:

```
Target: 3 real decisions reviewed
  → At least 2 accepted findings
  → At least 1 material decision change
  → Every accepted finding fully evidence-grounded
  → Median review time under 10 minutes
```

Then run:
```bash
uv run python scripts/governance_report.py
```

That report — from real decisions, with real evidence quotes and real follow-ups — is the first credible governance proof.

### 7. Enforcing the 5-part contract with Pydantic

**Problem:** Although `GovernedFinding` required the 5-part contract fields, they were technically `Optional`, and the validation was missing at the model level for non-rejected findings. A finding could be stored with a `null` causal risk or diagnostic question. Also, the README offsets had a small typo (using 20/75 instead of 15/77).

**Fix (`mental_razors/models.py`, `tests/test_storage.py`):**
- Added a `@model_validator(mode="after")` to `GovernedFinding` to enforce the contract rules.
- If `disposition != rejected`, the model enforces that `evidence_quote`, `evidence_start`, `evidence_end`, `causal_risk`, `diagnostic_question`, `false_positive_condition`, and `bounded_action` are all present.
- If `disposition == mitigated`, it also strictly enforces `change_summary`.
- Added tests `test_mitigated_finding_requires_change_summary` and `test_readme_example_validates` (with the correct 15/77 offsets).
- Corrected the `README.md` example evidence offsets.
- Updated `examples/seed_synthetic_demo.py` to write `schema_version: 3` and `GovernedFinding`-shaped records.
