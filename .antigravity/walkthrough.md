# Walkthrough — Governance Integrity Repair

**Branch:** `feature/mcp-knowledge-kernel-clean`
**Test result:** 40/40 passing · Build: `npm run build` clean

---

## What was fixed (10-point repair plan)

### 1. `RazorsDashboard.jsx` — frontend blocker resolved

**Problem:** Line 17 destructured `razorsGenerated` without importing it, causing a parse error. Lines 207/212/217 rendered `razorsData.expertiseTraps` — a deleted object.

**Fix:**
- Added `import razorsGenerated from '../knowledge/razors.generated.json'`
- Removed all `razorsData` references
- Tabs and content are now dynamically rendered from `categories[]` and `razors[]` arrays in the generated JSON — adding a new category to `razors.yaml` automatically appears in the UI after compile

---

### 2. `FindingDispositionEnum` and `FindingDecision` — structured dispositions

**Problem:** Findings were stored as flat lists of IDs (`accepted_findings: List[str]`). No structured disposition, no per-razor change summary. The governance report had to guess meaning from text.

**Fix (`mental_razors/models.py`):**
```python
class FindingDispositionEnum(str, Enum):
    mitigated = "mitigated"
    accepted  = "accepted"
    deferred  = "deferred"
    rejected  = "rejected"

class FindingDecision(BaseModel):
    razor_id:       str
    disposition:    FindingDispositionEnum
    change_summary: Optional[str]   # what changed (for mitigated/deferred)
```
`ReviewRecordInput.findings` is now `List[FindingDecision]`.

---

### 3. Real optional review duration

**Problem:** Previous implementation fabricated duration with deterministic random values.

**Fix:**
- `review_duration_seconds: Optional[int]` — self-reported by the human reviewer, never synthesized
- Governance report only shows median when at least one real timing exists; otherwise prints `"No timing data recorded"`

---

### 4. Correct three-way risk correlation

**Problem:** All materialized risks were counted as "anticipated" regardless of whether the finding was accepted or rejected.

**Fix (`scripts/governance_report.py`):**
| Bucket | Meaning |
|---|---|
| `anticipated_and_accepted` | Risk was flagged, team accepted/deferred it, it materialized |
| `anticipated_but_rejected` | Risk was flagged, team rejected the finding, it materialized anyway — the strongest governance signal |
| `unanticipated` | Risk not referenced in any finding, or listed in `unexpected_issues` |

---

### 5. Referential integrity for outcomes

**Problem:** `record_outcome()` would silently write an outcome for a non-existent review.

**Fix (`mental_razors/storage.py`):**
```python
if not review_id_exists(review_id_str, d):
    raise ValueError(f"No review with id '{review_id_str}' found in storage. ...")
```

---

### 6. Multiple outcomes per review

**Problem:** The data model and report assumed one outcome per review.

**Fix:** `outcomes.jsonl` is append-only. Multiple `record_outcome()` calls for the same `review_id` all succeed. The report groups `outcomes_by_review: Dict[str, List[dict]]` and counts correctly.

---

### 7. Strict Pydantic types

| Field | Old type | New type |
|---|---|---|
| `OutcomeRecordInput.review_id` | `str` | `UUID` |
| `OutcomeRecordInput.observed_at` | `str` | `date` |
| `OutcomeRecordInput.status` | `str` | `OutcomeStatus (Enum)` |
| `OutcomeRecordInput.confidence` | `str` | `OutcomeConfidence (Enum)` |
| `FindingDecision.disposition` | _(didn't exist)_ | `FindingDispositionEnum` |

---

### 8–9. Synthetic data seeder moved and guarded

**Old:** `scripts/populate_pilot_data.py` — could accidentally write to the real data dir; no overwrite guard; records not labelled.

**New:** `examples/seed_synthetic_demo.py`
- Default output: `.demo-data/` (never `MENTAL_RAZORS_DATA_DIR` or Application Support)
- Requires `--force` to overwrite existing demo files
- Every record carries `"data_origin": "synthetic"`
- Safety check at startup refuses to write to the real data directory
- Run demo report: `uv run python scripts/governance_report.py --data-dir .demo-data`

---

### 10. Tests rewritten against controlled fixtures

**`tests/test_storage.py` (16 new tests):**
- `FindingDecision` disposition storage
- `review_duration_seconds` optional/present
- `record_review` append behaviour
- `review_id_exists` true/false
- `record_outcome` referential integrity rejection
- `record_outcome` multi-outcome per review
- Pydantic enum validation (status, confidence)
- `date` type validation for `observed_at`
- Load helpers return empty lists on missing files

**`tests/test_mcp_contract.py` (8 tests):**
- Tool/resource/prompt registration (split into individual tests)
- Full round-trip end-to-end (record_review → record_outcome)
- `test_stdio_startup`: now passes PYTHONPATH correctly to subprocess

---

## Proof

| Check | Result |
|---|---|
| `npm run build` | ✅ Compiled successfully |
| `uv run python -m pytest tests/ -v` | ✅ 40/40 passed |
| `git push origin feature/mcp-knowledge-kernel-clean` | ✅ `d156f60..be4c3fb` |

### Commands to validate

```bash
# Build
npm run build

# Tests
uv run python -m pytest tests/ -v

# Demo report with synthetic data
uv run python examples/seed_synthetic_demo.py
uv run python scripts/governance_report.py --data-dir .demo-data
```
