# Walkthrough — Implementation of Mental Razors Core & MCP Server

We have successfully refactored `mental-razors-dashboard` into a multi-consumer architecture.

---

## Changes Made

### 1. Knowledge Layer (`knowledge/`)
* **[NEW] [razors.yaml](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/razors.yaml)**: Flat canonical data file representing the 9 mental razors. Includes principles, patterns, warning signs, indicators, and examples.
* **[NEW] [review-modes.yaml](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/review-modes.yaml)**: Configuration presets for review targets (e.g., `architecture-review`, `strategy-review`).
* **[NEW] [schemas/](file:///Users/anilyamangil/Projects/mental-razors-dashboard/knowledge/schemas/)**: Two separate JSON schemas validation specifications (`razors.schema.json` and `review-modes.schema.json`).

### 2. Core Python Package (`mental_razors/`)
* **[NEW] [models.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/models.py)**: Pydantic v2 schemas defining tool inputs/outputs (`EvidenceCandidate`, `RazorCandidate`, `ReviewPacket`, `ClaimChallengePacket`, `ReviewRecord`).
* **[NEW] [loader.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/loader.py)**: YAML loading, caching, path resolution, and SHA-256 content versioning.
* **[NEW] [validation.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/validation.py)**: JSON schema structural checks and semantic integrity logic (referential checking, uniqueness of IDs).
* **[NEW] [retrieval.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/retrieval.py)**: Text tokenization, custom suffix stemmer, weight scoring, evidence sentence extraction, and candidate ranking.
* **[NEW] [review.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/review.py)**: Workflow engines creating audit packages and claim challenge specifications.
* **[NEW] [storage.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/mental_razors/storage.py)**: Append-only reviews logger persisting to gitignored `.local/reviews.jsonl` (with XDG/macOS Application Support fallback).

### 3. MCP Server Adapter (`servers/mcp/`)
* **[NEW] [server.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/servers/mcp/server.py)**: Exposes FastMCP resources (`razor://`, `review-mode://`), tools (`search_razors`, `prepare_review`, `prepare_claim_challenge`, `record_review`), and prompts (`architecture_review`, `strategy_review`, etc.).

### 4. Build Scripts & Front-End Refactor
* **[NEW] [compile_knowledge.py](file:///Users/anilyamangil/Projects/mental-razors-dashboard/scripts/compile_knowledge.py)**: Invokes validation pipeline and dumps JSON to dashboard. Includes `--check` drift-detection.
* **[MODIFY] [package.json](file:///Users/anilyamangil/Projects/mental-razors-dashboard/package.json)**: Runs compilation scripts automatically during dashboard build and start tasks.
* **[MODIFY] [RazorsDashboard.jsx](file:///Users/anilyamangil/Projects/mental-razors-dashboard/src/components/RazorsDashboard.jsx)**: Dynamically loads the generated JSON file and loops categories/tabs dynamically.
* **[MODIFY] [.gitignore](file:///Users/anilyamangil/Projects/mental-razors-dashboard/.gitignore)**: Added `.local/` and `.venv/` exclusions.

---

## Validation & Testing

### 1. Deterministic Unit Tests
The test suite consists of 20 unit tests checking compiler check mode, schema semantic restrictions, token matching, ranking, and file system storage overrides.

Run command:
```bash
PYTHONPATH=. uv run --with pytest --with pytest-asyncio pytest
```

Result:
```text
tests/test_compiler.py .                                                 [  5%]
tests/test_knowledge.py .......                                          [ 40%]
tests/test_mcp_contract.py ....                                          [ 60%]
tests/test_retrieval.py ....                                             [ 80%]
tests/test_review_packets.py ..                                          [ 90%]
tests/test_storage.py ..                                                 [100%]

============================== 20 passed in 0.23s ==============================
```

### 2. Reasoning Evaluation Harness
Tested the retrieval model against 15 curated positive triggers, near-misses, and false-positive cases.

Run command:
```bash
PYTHONPATH=. uv run python evals/run_reasoning_eval.py
```

Result:
```text
Running reasoning evaluation harness on 15 cases...
============================================================
[PASS] Case 'positive-legacy': Clear trigger for Legacy Razor
[PASS] Case 'near-miss-legacy': Historical method validated with recent data - should NOT trigger
[PASS] Case 'positive-complexity': Clear trigger for Complexity Razor
[PASS] Case 'positive-innovation': Clear trigger for Innovation Razor
[PASS] Case 'near-miss-innovation': Behavior change aligned with massive value proposition - should NOT trigger
[PASS] Case 'positive-over-engineering': Clear trigger for Over-Engineering Razor
[PASS] Case 'near-miss-over-engineering': Inherently complex domain (compiler) - should NOT trigger
[PASS] Case 'positive-granularity': Clear trigger for Granularity Razor
[PASS] Case 'positive-coherence': Clear trigger for Coherence Razor
[PASS] Case 'positive-procrastination': Clear trigger for Procrastination Razor
[PASS] Case 'positive-confidence': Clear trigger for Confidence Razor
[PASS] Case 'positive-simplicity': Clear trigger for Simplicity Razor
[PASS] Case 'no-finding-1': Clean system proposal - should NOT trigger any razor
[PASS] Case 'multi-razor-ambiguity': Triggers both Legacy and Over-engineering
[PASS] Case 'near-miss-coherence': Chaotic system with probabilistic forecasts - should NOT trigger
============================================================
Retrieval Eval Results: 15 passed, 0 failed out of 15 cases.
```

### 3. Front-End Production Build
Verified React compiled successfully.

Run command:
```bash
npm run build
```

Result:
```text
Compiled successfully.
File sizes after gzip:
  81.14 kB  build/static/js/main.462855e7.js
  6.68 kB   build/static/css/main.426075a6.css
```
