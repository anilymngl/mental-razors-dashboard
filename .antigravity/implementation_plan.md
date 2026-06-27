# Implementation Plan — Mental Razors: Knowledge Kernel + MCP Server

Transform `mental-razors-dashboard` into a dual-consumer workspace: a canonical YAML knowledge
layer, a React dashboard that loads it dynamically, and a local Python MCP server that functions
as an **evidence-grounded review protocol server** — not an autonomous reasoning engine.

```
Canonical knowledge kernel
        ├── React dashboard   (browse / learn)
        └── Local MCP server  (retrieve / constrain / hand off)
```

The MCP server retrieves relevant razors, extracts evidence candidates, and returns a structured
`ReviewPacket`. The **host model** (Claude, Codex, OpenCode) performs the actual reasoning
critique. This boundary is the central architectural invariant of V1.

---

## Scope

**V1 = the existing 9 razors only.**

| Category | Razors |
|---|---|
| Expertise Traps | Legacy, Simplicity, Confidence |
| System Design Traps | Complexity, Innovation, Over-Engineering |
| Cognitive Blindspots | Granularity, Coherence, Procrastination |

Hitchens, Sagan, Occam and Hanlon exist as data in the current dashboard and will remain visible there.
They will **not** be included in the MCP knowledge kernel in V1. Adding them is a deliberate
content-expansion step, not a technical migration task, and is deferred to V1.1.

---

## Definition of Done

```
[ ] YAML is the only human-edited razor source.
[ ] Generated React JSON matches YAML exactly (--check mode).
[ ] Existing dashboard still renders all 9 razors.
[ ] Invalid knowledge fails compilation before React build.
[ ] MCP exposes typed Resources, Tools, and Prompts.
[ ] Retrieval returns candidates, not invented certainty.
[ ] Every evidence candidate is a traceable substring of the original input.
[ ] Empty/no-finding reviews are fully supported.
[ ] Runtime review history does not dirty the repository.
[ ] MCP SDK is pinned to >=1.27,<2.
[ ] Deterministic tests and model-assisted evals are in separate suites.
[ ] Each stored review records its knowledge_version (content hash of razors.yaml).
```

---

## Repository Layout

```
mental-razors-dashboard/
├── knowledge/
│   ├── razors.yaml
│   ├── review-modes.yaml
│   └── schemas/
│       ├── razors.schema.json
│       └── review-modes.schema.json
│
├── src/
│   ├── components/
│   │   └── RazorsDashboard.jsx   (refactored to load generated JSON)
│   └── knowledge/
│       ├── razors.generated.json
│       └── review-modes.generated.json
│
├── mental_razors/               (core Python package)
│   ├── __init__.py
│   ├── models.py
│   ├── loader.py
│   ├── validation.py
│   ├── retrieval.py
│   ├── review.py
│   └── storage.py
│
├── servers/
│   └── mcp/
│       └── server.py            (thin FastMCP adapter only)
│
├── scripts/
│   └── compile_knowledge.py
│
├── tests/
│   ├── cases/
│   │   ├── retrieval_cases.yaml
│   │   └── review_packet_cases.yaml
│   ├── test_compiler.py
│   ├── test_knowledge.py
│   ├── test_retrieval.py
│   ├── test_review_packets.py
│   ├── test_mcp_contract.py
│   └── test_storage.py
│
├── evals/
│   ├── reasoning_cases.yaml
│   └── run_reasoning_eval.py
│
├── .local/                      # gitignored — runtime review history
├── pyproject.toml
├── uv.lock
└── package.json
```

`server.py` stays thin. All logic lives in `mental_razors/`. The MCP layer is a delivery adapter.

---

## Proposed Changes

---

### Slice 1 — Knowledge Extraction

#### [NEW] [razors.yaml](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/razors.yaml)

Flat canonical model. The React camelCase shape (`expertiseTraps`, `systemTraps`, etc.) is **not** replicated; the compiler groups by `category_id` at build time.

```yaml
schema_version: 1

categories:
  - id: expertise-traps
    label: Expertise Traps
    order: 10
  - id: system-design-traps
    label: System Design Traps
    order: 20
  - id: cognitive-blindspots
    label: Cognitive Blindspots
    order: 30

razors:
  - id: legacy-razor
    category_id: expertise-traps
    title: Legacy Razor
    tags: [expertise, paradigm-shift, architecture]
    provenance:
      type: original
      attribution: null
      source_url: null
      notes: null
    principle: "..."
    pattern: "..."
    trigger_conditions:
      - "..."
    false_positive_conditions:
      - "..."
    indicators: [...]
    applications: [...]
    diagnostic_questions:
      - "..."
    recommended_actions:
      - "..."
    examples: [...]
```

`origin_and_evolution` and other advanced UI fields from the dashboard are preserved as optional fields.
`false_positive_conditions` and `diagnostic_questions` are **required** for every V1 razor.

#### [NEW] [review-modes.yaml](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/review-modes.yaml)

```yaml
schema_version: 1

modes:
  - id: quick-check
    label: Quick Check
    max_candidates: 3
    prioritize: []            # no bias — all razors equal weight
  - id: architecture-review
    label: Architecture Review
    max_candidates: 5
    prioritize:
      - over-engineering-razor
      - granularity-razor
      - complexity-razor
      - innovation-razor
  - id: strategy-review
    label: Strategy Review
    max_candidates: 5
    prioritize:
      - legacy-razor
      - confidence-razor
      - coherence-razor
  - id: postmortem-review
    label: Postmortem Review
    max_candidates: 5
    prioritize:
      - coherence-razor
      - granularity-razor
      - simplicity-razor
  - id: product-review
    label: Product Review
    max_candidates: 5
    prioritize:
      - innovation-razor
      - complexity-razor
      - granularity-razor
  - id: red-team
    label: Red Team
    max_candidates: 7
    prioritize: []            # all razors active, higher ceiling
```

#### [NEW] [schemas/razors.schema.json](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/schemas/razors.schema.json) & [schemas/review-modes.schema.json](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/schemas/review-modes.schema.json)

Two separate schema files (not a single compound file). Compiler-level semantic checks supplement JSON Schema:
- All razor IDs are unique
- All `category_id` values reference a declared category
- All `prioritize` entries in review-modes reference existing razor IDs
- Every razor has ≥1 `diagnostic_question`
- Every razor has ≥1 `false_positive_condition`
- `max_candidates` is within allowed range (1–10)

#### [NEW] [scripts/compile_knowledge.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/scripts/compile_knowledge.py)

Reads YAML, validates against schemas + semantic rules, emits `.generated.json` files.

Supports `--check` flag: exits non-zero if committed generated files differ from freshly compiled output.

#### [MODIFY] [package.json](file:///Users/anilyamangil/Projects/mental-razors-dashboard/package.json)

Generated JSON files are **committed** to the repo. This means `npm start` still works without Python.
The compile step is a deliberate action or runs in CI.

```json
{
  "scripts": {
    "knowledge:compile": "uv run python scripts/compile_knowledge.py",
    "knowledge:check":   "uv run python scripts/compile_knowledge.py --check",
    "prestart":          "npm run knowledge:compile",
    "prebuild":          "npm run knowledge:compile",
    "start":             "react-scripts start",
    "build":             "react-scripts build",
    "deploy":            "gh-pages -d build"
  }
}
```

#### [MODIFY] [RazorsDashboard.jsx](file:///Users/anilyamangil/Projects/mental-razors-dashboard/src/components/RazorsDashboard.jsx)

Replace the ~700-line hardcoded `razorsData` object with an import of `razors.generated.json`.
React groups razors at runtime:

```javascript
const categoryRazors = razors.filter(r => r.category_id === selectedCategoryId);
```

The category-to-tab mapping uses `categories[]` from the generated JSON, preserving visual parity.

#### [NEW] [.gitignore entry](file:///Users/anilyamangil/Projects/mental-razors-dashboard/.gitignore)

```gitignore
.local/
```

---

### Slice 2 — Retrieval Core (`mental_razors/` package)

#### [NEW] [mental_razors/models.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/models.py)

Pydantic v2 models for all tool inputs and outputs. These are the **source of truth** for MCP structured output schemas:

```python
class EvidenceCandidate(BaseModel):
    quote: str
    start: int
    end: int
    matched_signals: list[str]

class RazorCandidate(BaseModel):
    razor_id: str
    title: str
    retrieval_score: float
    evidence: list[EvidenceCandidate]
    diagnostic_questions: list[str]
    false_positive_conditions: list[str]

class ReviewPacket(BaseModel):
    mode: str
    candidates: list[RazorCandidate]
    review_instructions: dict   # rendered from the appropriate Prompt
    require_input_evidence: bool = True
    allow_no_finding: bool = True
    max_final_findings: int = 3

class ReviewRecordInput(BaseModel):
    decision_id: str
    mode: str
    accepted_findings: list[str]
    rejected_findings: list[str]
    decision: str
    notes: str | None = None

class ReviewRecord(ReviewRecordInput):
    review_id: str              # uuid4
    created_at: str             # ISO 8601
    knowledge_version: str      # sha256 of razors.yaml content
    input_hash: str             # sha256 of reviewed content
    schema_version: int = 1
```

#### [NEW] [mental_razors/retrieval.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/retrieval.py)

Weighted token scoring — no SQLite FTS, no vector DB. 9 razors do not warrant that infrastructure.

```
title                × 5
tags                 × 4
trigger_conditions   × 3
indicators           × 2
principle            × 1
examples             × 0.5
```

Review-mode priorities add a flat score bonus. Evidence candidates are extracted as
exact substrings matched to `trigger_conditions` / `indicators` tokens.

#### [NEW] [mental_razors/loader.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/loader.py)
#### [NEW] [mental_razors/validation.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/validation.py)
#### [NEW] [mental_razors/review.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/review.py)

---

### Slice 3 — MCP Adapter

#### [NEW] [pyproject.toml](file:///Users/anilyamangil/Projects/mental-razors-dashboard/pyproject.toml)

```toml
[project]
name = "mental-razors"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "mcp[cli]>=1.27,<2",
  "pydantic>=2.11,<3",
  "pyyaml>=6.0,<7",
  "jsonschema>=4.24,<5",
]

[project.optional-dependencies]
dev = ["pytest>=8", "pytest-asyncio"]
```

No third-party `fastmcp` dependency. The official SDK exposes `mcp.server.fastmcp.FastMCP`.

#### [NEW] [servers/mcp/server.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/servers/mcp/server.py)

MCP primitives are split by responsibility:

**Resources** (read-only knowledge access):
```
razor://all
razor://{razor_id}
review-mode://all
review-mode://{mode_id}
knowledge://manifest
```

**Tools** (computation / side effects):
```python
search_razors(query, category=None, tags=None, limit=5) -> RazorSearchResult
prepare_review(content, mode="quick-check", max_candidates=5) -> ReviewPacket
prepare_claim_challenge(claim, context=None) -> ClaimChallengePacket
record_review(review: ReviewRecordInput) -> ReviewRecord
```

Note: `scan_with_razors` is renamed to `prepare_review`. The output is explicitly
`candidate_findings`, not `findings`. The tool retrieves and constrains; it does **not**
produce semantic verdicts. `list_razors` and `get_razor` are served via Resources.
`review_options` is deferred to V1.1.

**Prompts** (reusable interaction patterns for host models):
```
architecture_review
strategy_review
postmortem_review
product_review
red_team_review
```

Example prompt body for `architecture_review`:
```
Use the supplied candidate razors only as hypotheses.

For every accepted finding:
1. Quote exact evidence from the input.
2. Explain the causal risk.
3. State a diagnostic question.
4. State when this finding would be a false positive.
5. Recommend one bounded action.

Reject weak candidates. Returning no findings is valid.
```

#### [NEW] [mental_razors/storage.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/storage.py)

Review history is written to a **gitignored** location, never to `knowledge/`:

Priority order:
1. `MENTAL_RAZORS_DATA_DIR` env var
2. `~/Library/Application Support/mental-razors/` (macOS)
3. `.local/` (project-local fallback)

Appends `ReviewRecord` as JSONL, one record per line.

---

### Slice 4 — Tests

#### Deterministic suite (`tests/`)

```
test_compiler.py          — compile outputs, --check drift detection
test_knowledge.py         — schema + semantic validation, ID uniqueness, referential integrity
test_retrieval.py         — expected razor in top-k for curated inputs
test_review_packets.py    — candidate count limits, evidence substring invariant
test_mcp_contract.py      — in-process MCP: tool discovery, resource URIs, bad-arg behavior
test_storage.py           — JSONL append-only, knowledge_version present, XDG/env override
```

#### Model-assisted eval suite (`evals/`) — separate, non-blocking

```
reasoning_cases.yaml      — 15–25 curated cases:
                              positive triggers
                              near-misses
                              multi-razor ambiguity
                              no-finding cases
                              false-positive traps
run_reasoning_eval.py     — runs against a live host model, scores evidence fidelity /
                              razor relevance / false-positive rejection / action boundedness
```

These evals are **never run in pytest** by default. They require a live model and produce
probabilistic results — not regressions.

---

## Execution Order

| Slice | Deliverable | Exit criterion |
|---|---|---|
| 1 | Knowledge extraction | React builds, all 9 razors render |
| 2 | Retrieval core | Deterministic retrieval tests pass |
| 3 | MCP adapter | MCP Inspector smoke test + contract tests pass |
| 4 | Review history | Storage tests pass, `.local/` is gitignored |
| 5 | Reasoning evals | 15+ cases written; eval harness runs end-to-end |
