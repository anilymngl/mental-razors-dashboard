# Mental Razors

A canonical knowledge kernel and governance MCP server for evidence-grounded decision review.

[![CI](https://github.com/anilymngl/mental-razors-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/anilymngl/mental-razors-dashboard/actions/workflows/ci.yml)

---

## What is this?

Mental Razors is a **reasoning linter** built as a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server.

It does not make decisions. It creates a disciplined review loop:

```
Proposal
  → Relevant reasoning risks (retrieved deterministically)
  → Evidence-grounded diagnostic questions
  → Human acceptance or rejection
  → Decision changes or explicit risk acceptance
  → Outcome captured later
```

The value proposition is:

> Important decisions should leave a trace showing which assumptions were challenged, which risks were accepted, and whether the review changed the decision.

### Architecture

```
knowledge/razors.yaml          ← Single source of truth (YAML)
         │
         ├── src/knowledge/razors.generated.json  ← React dashboard
         └── mental_razors/                       ← MCP server Python package
              ├── loader.py    YAML → runtime objects
              ├── retrieval.py Deterministic weighted keyword retrieval
              ├── review.py    ReviewPacket / ClaimChallengePacket assembly
              ├── storage.py   Append-only JSONL, evidence validation, referential integrity
              └── models.py    Pydantic models: GovernedFinding, ReviewRecord, OutcomeRecord

servers/mcp/server.py          ← FastMCP entrypoint (5 tools, 5 resources, 5 prompts)
scripts/governance_report.py   ← CLI report from stored reviews + outcomes
```

---

## Dashboard

Live at [https://anilymngl.github.io/mental-razors-dashboard](https://anilymngl.github.io/mental-razors-dashboard)

```bash
npm install
npm start   # http://localhost:3000
```

---

## MCP Server

### Requirements

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (or pip)

### Install

```bash
git clone https://github.com/anilymngl/mental-razors-dashboard.git
cd mental-razors-dashboard
uv sync
```

### Run

```bash
uv run mental-razors-mcp        # stdio transport (for Claude Desktop / Cursor)
uv run servers/mcp/server.py    # equivalent
```

### Configure in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mental-razors": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/mental-razors-dashboard",
        "run",
        "servers/mcp/server.py"
      ]
    }
  }
}
```

---

## Usage: complete review example

### 1. Prepare a review (retrieve candidate razors + evidence)

```
Tool: prepare_review
  content: "We will deploy three independent microservices for auth, profile, and logging."
  mode: "architecture-review"
```

Returns a `ReviewPacket` with candidate razors, exact evidence substrings, diagnostic questions, and the review contract.

### 2. Record the review after the human completes it

```json
Tool: record_review
{
  "review_record": {
    "decision_id": "arch-2026-06-27-microservices",
    "mode": "architecture-review",
    "proposal_text": "We will deploy three independent microservices for auth, profile, and logging.",
    "revised_text": "We will deploy a single modular service with separate modules for auth, profile, and logging.",
    "findings": [
      {
        "razor_id": "over-engineering-razor",
        "disposition": "mitigated",
        "evidence_quote": "three independent microservices for auth, profile, and logging",
        "evidence_start": 20,
        "evidence_end": 75,
        "causal_risk": "Three independent services add deployment overhead, distributed tracing cost, and network latency with no measured benefit at current scale.",
        "diagnostic_question": "Have you profiled the request boundaries between these services under expected load?",
        "false_positive_condition": "If each service has distinct team ownership, release cadence, and independently scalable SLOs.",
        "bounded_action": "Merge into one service with clear module boundaries; split only if profiling shows clear cross-service bottlenecks.",
        "change_summary": "Collapsed three services into a single modular service."
      }
    ],
    "decision_summary": "Mitigated over-engineering by merging three services into one modular service.",
    "change_summary": "Proposal revised to use a single service with internal modules.",
    "review_duration_seconds": 420
  }
}
```

The server:
- Computes `SHA-256(proposal_text)` as `initial_content_hash`
- Computes `SHA-256(revised_text)` as `final_content_hash`
- Validates `proposal_text[evidence_start:evidence_end] == evidence_quote`
- Validates all `razor_id` values against the knowledge base
- Discards the raw text; only hashes are stored

### 3. Record a follow-up outcome (weeks or months later)

```json
Tool: record_outcome
{
  "outcome": {
    "review_id": "<uuid-from-step-2>",
    "observed_at": "2026-08-15",
    "status": "successful",
    "observations": [
      "Single service deployed with no operational issues.",
      "Deployment time reduced by 40% vs three-service estimate."
    ],
    "risks_materialized": [],
    "unexpected_issues": [],
    "confidence": "high"
  }
}
```

### 4. Generate a governance report

```bash
uv run mental-razors-report
# or:
uv run python scripts/governance_report.py --data-dir ~/.local/mental-razors/
```

---

## Governance data storage

Real reviews and outcomes are stored in:

| Priority | Location |
|---|---|
| 1 | `$MENTAL_RAZORS_DATA_DIR` (if set) |
| 2 | `~/Library/Application Support/mental-razors/` (macOS) |
| 3 | `.local/` (project fallback) |

Files: `reviews.jsonl` and `outcomes.jsonl` — append-only.

### Synthetic demo data

```bash
# Write synthetic demo records to .demo-data/ (never touches real storage)
uv run python examples/seed_synthetic_demo.py

# Generate a demo report from synthetic data
uv run python scripts/governance_report.py --data-dir .demo-data
```

---

## Development

```bash
uv sync --group dev

# Run tests
uv run python -m pytest tests/ -v

# Recompile knowledge JSON after editing knowledge/razors.yaml
uv run python scripts/compile_knowledge.py

# Validate YAML without writing files
uv run python scripts/compile_knowledge.py --check
```

---

## MCP tools reference

| Tool | Description |
|---|---|
| `prepare_review` | Retrieve candidate razors + evidence, return host-model guidelines |
| `search_razors` | Filter-then-score razor search (category/tag filtering before scoring) |
| `prepare_claim_challenge` | Build a refutational blueprint for a specific claim |
| `record_review` | Store a governed review with evidence-validated findings |
| `record_outcome` | Record a follow-up outcome linked to an existing review |

## MCP resources reference

| Resource URI | Description |
|---|---|
| `razor://all` | All razors in JSON |
| `razor://{razor_id}` | Single razor detail |
| `review-mode://all` | All review mode configs |
| `review-mode://{mode_id}` | Single review mode |
| `knowledge://manifest` | Knowledge version, counts |

---

## CI

Two jobs run on every push and PR:

1. **Python** — `compile_knowledge.py --check` then `pytest tests/`
2. **Frontend** — `npm ci` then `npm run build`

---

**Explore, Learn, and Sharpen Your Thinking with Mental Razors.**
