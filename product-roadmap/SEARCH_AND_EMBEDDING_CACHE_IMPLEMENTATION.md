# Bookmark Vault: Embedding Cache (MongoDB) + High-Relevance Search (Hybrid)

This document describes **how to implement**:
1) **Caching embeddings in MongoDB** to reduce embedding API cost and latency.
2) **Best-match search results** for natural-language queries, including behavior like:
   - Query: `"ai coding agents and ides"`
   - Returned bookmarks: only the ones related to **AI coding agents / IDEs** (e.g. *Claude*, *ChatGPT*, *VS Code*) and **not** irrelevant clusters like *Rust tutorials*.

> Codebase context: Rust backend using Axum + MongoDB Atlas vector search (`$vectorSearch`). Frontend uses `useSearch()` to call `GET /search?q=...&limit=...`.

---

## REVIEWED IMPLEMENTATION STRATEGY (13 May 2026)

After analysing the actual codebase, the original plan is architecturally correct but benefits from a phased, incremental approach. Key findings and deviations documented below.

### Confirmed codebase facts
- `generate_embedding()` in `gemini.rs` returns `Vec<f64>` only — no model name. Must be changed for cache versioning.
- `text_search_fallback()` already exists in `search.rs` and proves the `$text` query pattern works. Promote it from fallback to co-signal rather than writing it from scratch.
- `Bookmark` model already has `tags: Vec<String>`, `ai_summary`, `title`, `description` — all fields needed for MongoDB text index. No schema changes needed.
- `useSearch.js` has `staleTime: 10000`, so React Query already caches results client-side for 10s. No frontend changes needed for these features.
- `AppState` exposes `state.db` (MongoDB `Database`) and `state.collection<T>()` helper — cache collection can be accessed directly without `db.rs` changes.

### What NOT to implement (deviations from original plan)

| Suggestion | Why skip |
|---|---|
| Query embedding input augmentation (`"Search intent: {q}. Include results about..."`) | Distorts embedding space. Bookmark embeddings were generated from raw text. Query embeddings must stay raw for consistent cosine similarity. |
| In-progress lock for concurrent cache writes | Premature. Duplicate Gemini calls in a 200ms window are negligible cost. `upsert: true` is sufficient. |
| Adaptive weighting by query length | No data to tune this yet. Fixed weights first, measure, then adapt. |
| SHA-256 hash as cache key | Unnecessary for query strings (<200 chars). Use normalized query directly as `_id`. Simpler and debuggable. Only hash if very long queries become common. |
| Cache hit rate metrics collection | Add a `tracing::info!("cache hit for: {}", cache_key)` log line only. No counters for v1. |

### Cache key: only cache query embeddings, not bookmark embeddings
`generate_embedding()` is called in two places: (1) search queries, (2) bookmark creation/import. **Only cache query embeddings.** Bookmark content is unique and never repeats — caching it wastes storage.

Safe approach: add a new `generate_embedding_with_model()` and keep the old signature as a thin wrapper so bookmark creation code is not touched:

```rust
// gemini.rs — backward-compatible change
pub async fn generate_embedding(&self, text: &str) -> anyhow::Result<Vec<f64>> {
    let (embedding, _model) = self.generate_embedding_with_model(text).await?;
    Ok(embedding)
}

pub async fn generate_embedding_with_model(&self, text: &str) -> anyhow::Result<(Vec<f64>, String)> {
    // existing loop logic, but return (embedding, model.clone()) on success
}
```

### Score normalization is mandatory for hybrid combining
`$vectorSearch` scores are in `0.0–1.0`. MongoDB `$text` scores (`textScore`) are unbounded (typically `0.5–10+`). They cannot be combined directly. Normalize text scores before weighting:

```rust
let max_text = candidates.iter().map(|c| c.text_score).fold(0.0_f64, f64::max);
let normalized_text = if max_text > 0.0 { text_score / max_text } else { 0.0 };
let final_score = 0.7 * vector_score + 0.3 * normalized_text;
```

---

## PHASED ROLLOUT (recommended order)

### Phase 1 — Score threshold (30 min, immediate impact)

**Do this before anything else.** Add a minimum vector score cutoff to the existing search. This alone significantly reduces irrelevant results with zero new dependencies.

File: `backend/src/routes/search.rs`

```rust
// After collecting cursor results, before returning:
results.retain(|doc| {
    doc.get_f64("score").unwrap_or(0.0) > 0.75  // tune based on observed scores
});
```

Start with `0.75`. Inspect actual `score` values in returned results to calibrate. Can be an env var (`SEARCH_MIN_SCORE`) for easy tuning without redeploy.

### Phase 2 — Embedding cache (Feature A)

New collection: `query_embedding_cache`. Modify `generate_embedding` to expose model name. Add cache lookup before Gemini call in `search.rs`.

### Phase 3 — Hybrid retrieval (Feature B core)

Run vector and `$text` searches in parallel with `tokio::join!`. Merge by `_id`, compute weighted score, filter, sort, return top `limit`. Refactor existing `text_search_fallback()` into a reusable `keyword_search()` helper.

### Phase 4 — Score normalization + weight tuning

Normalize text scores. Tune weights with real query data. Consider making weights configurable via env vars.

---

## Architecture (after all phases complete)

```
Query arrives
    │
    ├─ normalize(query) → cache_key
    ├─ Cache lookup (MongoDB query_embedding_cache, filter: {_id: cache_key, model: current_model})
    │     ├─ HIT  → use cached embedding  [log: "cache hit"]
    │     └─ MISS → Gemini API (generate_embedding_with_model) → upsert cache doc
    │
    ├─ tokio::join!
    │     ├─ Vector search ($vectorSearch, numCandidates: 200, limit: limit*5, max 100)
    │     └─ Keyword search ($text, filter: user_id, limit: 50)
    │
    ├─ Merge by _id into HashMap<ObjectId, CandidateScore>
    ├─ Normalize text scores (divide by max)
    ├─ final_score = 0.7 * vector_score + 0.3 * normalized_keyword_score
    ├─ Filter: final_score < MIN_SCORE → drop
    ├─ Sort descending by final_score
    ├─ Take top `limit`
    │
    └─ Return results with score field
```

---

---

## 0) Current State (What exists now)

### Search endpoint (backend)
File: `backend/src/routes/search.rs`

- Computes a query embedding:
  - `state.gemini.generate_embedding(&query.q).await`
- Calls MongoDB Atlas vector search:
  - `$vectorSearch` with:
    - `path: "embedding"`
    - `index: "vector_index"`
    - `filter: { "user_id": user_id }`
- Returns results directly (no rerank / no keyword signals).

### Embedding generation (backend)
File: `backend/src/services/gemini.rs`

- `generate_embedding(text)` calls Gemini embedding API for the provided text.

### Frontend
File: `frontend/src/hooks/useSearch.js`

- Sends the user query as `q` to `/search`.
- No search mode / no extra parameters for ranking.

### Implication
- Today, search relevance is driven **only by vector similarity**.
- Vector similarity alone can still return semantically-related but *wrong intent* items (like “Rust tutorials”) depending on how the embedding clusters interact with your dataset and query wording.
- There is **no embedding cache** for query embeddings.

---

## 1) Feature A — MongoDB embedding cache

### Goal
Avoid recomputing query embeddings on every search.

- First time query arrives:
  - generate embedding via Gemini
  - store embedding in MongoDB
- Next time same (or normalized) query arrives:
  - load embedding from MongoDB
  - skip Gemini call entirely

### Why cache in MongoDB?
- You already use MongoDB for bookmarks.
- Cache becomes persistent across restarts and deploys.
- Multi-user: keep cache per normalized query + embedding model metadata.

---

## 1.1 Cache collection + schema

Create a new collection, recommended name:
- `query_embedding_cache`

Document schema (suggested):

```rust
// backend/src/models/query_embedding_cache.rs (optional)
use serde::{Deserialize, Serialize};
use mongodb::bson::DateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryEmbeddingCacheDoc {
  #[serde(rename = "_id")]
  pub cache_key: String,          // normalized query key (or hash)

  pub query: String,             // original query (optional, but helpful for debugging)
  pub embedding: Vec<f64>,       // cached embedding

  pub model: String,            // embedding model name used (e.g., text-embedding-004)
  pub hit_count: i64,
  pub created_at: DateTime,
  pub last_used_at: DateTime,
}
```

**Cache key strategy**
- Start with normalized query:
  - `normalize(q) = trim + lowercase + collapse whitespace`
- Later you can switch to hashing to keep keys small:
  - `_id = sha256(normalize(q))`

> Recommended: use **hash key**, store the normalized text separately for debugging.

---

## 1.2 TTL / cleanup

To keep cache bounded (free tiers / storage limits), add TTL index:

- TTL policy based on `last_used_at` (or `created_at`)
- Example TTL: **30 days** (tune as needed)

MongoDB command:

```javascript
db.query_embedding_cache.createIndex(
  { last_used_at: 1 },
  { expireAfterSeconds: 2592000 } // 30 days
);
```

---

## 1.3 Integration: modify `/search` to use cache

### Where to implement
File: `backend/src/routes/search.rs`

### New flow in `semantic_search`:
1. Normalize query text → `cache_key`
2. Try to load cached embedding from MongoDB:
   - filter by:
     - `cache_key`
     - `model` (important if model changes)
3. If cache hit:
   - use cached embedding for `$vectorSearch`
4. If cache miss:
   - call `state.gemini.generate_embedding(&query.q).await`
   - upsert embedding into cache
   - proceed with `$vectorSearch`

### Concurrency note
Multiple identical searches at the same time can cause duplicate embedding calls. Simple mitigation:
- Use `update_one(... upsert: true)` and set `embedding` only on insert.
- If two requests compute simultaneously, last write wins, but cost duplicates remain.

More advanced mitigation (optional later):
- store an `in_progress` flag with short-lived lock.

---

## 1.4 Embedding model versioning (important)

Your cache must remain valid if you change:
- Gemini embedding model(s) list (`text-embedding-004`, `gemini-embedding-001`, etc.)

Store:
- `model` in cache doc
- ensure lookup matches the same model

Implementation detail:
- `generate_embedding()` currently loops through model list and keys; you’ll want it to also return the **model used**.
- Alternatively:
  - pick one embedding model for queries (simpler)
  - or modify `generate_embedding` signature to return `(embedding, model_name)`

---

## 2) Feature B — “Best perfect search results” (Hybrid + Rerank)

### Problem
Current behavior:
- purely vector-based
- returns top `limit` even if relevance is weak

Your example shows intent mismatch:
- Query: “ai coding agents and ides”
- Incorrect returned bucket: “rust tutorials”

### Solution overview
Implement **hybrid retrieval + reranking**:

1) **Candidate generation**
- Vector search: fetch `K` candidates (e.g. 3x–5x of `limit`)
- Keyword search: use MongoDB `$text` or token-based scoring to fetch candidates

2) **Reranking**
- For each candidate:
  - combine vector score + keyword score
- Apply a minimum score threshold
- Return top `limit`

This prevents “close-ish semantic neighbors” (like rust tutorials) from winning when they don’t match the query intent words strongly.

---

## 2.1 Required indexes

You already have a vector index for `embedding`:
- `vector_index` on `embedding`

You need a text index for keyword search.
Recommended fields for `$text`:
- `title`
- `summary`
- `tags`

If your bookmarks don’t already have a compound text index, add:

```javascript
db.bookmarks.createIndex(
  { title: "text", summary: "text", tags: "text" }
);
```

> If tags are stored as an array of strings (they are in your models), MongoDB text index supports arrays.

---

## 2.2 Candidate generation design

### A) Vector candidates
Current pipeline:
- `$vectorSearch` with `numCandidates: 100` and `limit: limit`

Change this:
- set `limit: K` where `K = limit * 5` (cap at 200 if needed)
- keep `numCandidates` high enough (e.g. 200–500)
- keep filter `{ user_id: user_id }`

Store vector score:
- already available via `$meta: vectorSearchScore`

### B) Keyword candidates
Add a parallel query:
- use `$text` with `$search: query.q`
- filter by `user_id`
- sort by text score

MongoDB text score is available via:
- projection `{ score: { $meta: "textScore" } }`
- and sort `{ score: -1 }`

---

## 2.3 Reranking strategy (simple + effective)

In Rust after fetching both candidate sets:

- Build a map keyed by bookmark `_id`
- For each candidate:
  - `vector_score` (normalized to 0..1 if necessary)
  - `keyword_score` (normalize similarly)
- Combine:

```text
final_score = wv * vector_score + wk * keyword_score
```

Suggested weights:
- `wv = 0.7`, `wk = 0.3` to keep semantic strength but correct intent using keywords.
- When query is short / ambiguous, increase keyword weight.

Then:
- drop results if both scores are too low
- sort by `final_score`
- return top `limit`

### Why this fixes your example
Query: “ai coding agents and ides”
- “Claude”, “ChatGPT”, “VS Code” bookmarks:
  - keyword match: “ai”, “agents”, “ide”, “coding”
  - higher keyword scores
- “Rust tutorials”:
  - keyword mismatch:
  - lower combined score even if vector similarity is somewhat close

---

## 2.4 Query understanding improvements (embedding input)

Right now, embedding input is just `query.q`.

Improve embedding input text used for embedding:
- Append lightweight intent hints derived from query tokens (no model calls)
Example embedding input:
- `"Search intent: {query.q}. Include results about: AI coding agents, IDEs/tools, IDE integrations, developer workflows."`

Even simpler:
- normalize whitespace
- include tags-like text:
  - if query contains known IDE names (vscode, jetbrains, intellij), add them to the embedding input

This improves embedding matching quality without requiring any frontend changes.

---

## 3) Step-by-step integration checklist

### Step 1 — Create cache collection + indexes
- Create:
  - `query_embedding_cache`
- Add TTL index:
  - TTL on `last_used_at`
- (Optional) add unique index:
  - `_id` is unique inherently

### Step 2 — Add cache access code in backend
Files to touch (likely):
- `backend/src/db.rs`
  - Ensure `AppState` exposes MongoDB DB handle or collection getter
- Add model:
  - `backend/src/models/query_embedding_cache.rs` (optional)
- Add helpers:
  - `normalize_query()`, `hash_query_key()`

### Step 3 — Update `/search` endpoint to use cache
File: `backend/src/routes/search.rs`
- Before generating embedding:
  - lookup cache
- On miss:
  - generate embedding
  - insert/upsert cache doc

### Step 4 — Implement hybrid retrieval
File: `backend/src/routes/search.rs`
- Replace current pipeline-only approach with:
  - vector candidate query (fetch K)
  - keyword query (fetch M)
  - merge + rerank in Rust
- Return merged sorted results.

### Step 5 — Add/verify MongoDB text index
- Ensure text index exists on:
  - `title`, `summary`, `tags`

### Step 6 — Testing strategy
1. Regression:
   - search for known IDE terms and confirm only IDE-related bookmarks show up
2. Repeated query:
   - confirm embedding cache hit avoids Gemini calls
3. Compare ranking:
   - verify that “rust tutorials” drops out for “ai coding agents and ides”

---

## 4) Notes about implementation details in this codebase

### Embedding model return value
`generate_embedding()` currently returns only `Vec<f64>`.
For correct cache versioning, you should know:
- which embedding model succeeded

Recommended change:
- modify `generate_embedding` to return:
  - `anyhow::Result<(Vec<f64>, String)>` where `String` = model name used

Then cache doc stores `model`.

### Candidate fetch sizes
Pick values:
- `limit = 20`
- `K_vector = 100` or `limit * 5`
- `M_text = 50` (depends on your text index quality)

Then rerank to exactly `limit`.

---

## 5) Deliverables (what you should implement in the repo)

### Required
- MongoDB caching for query embeddings
- Hybrid search + rerank in `/search`
- Text index requirement documented/ensured

### Optional (later improvements)
- cache hit rate metrics
- lock-based “in progress” caching to reduce duplicate calls
- adaptive weighting based on query length / presence of IDE/tool keywords

---

## Summary

Implementing these two features will:
- **Cut embedding costs** by caching search query embeddings in MongoDB.
- **Greatly improve relevance** by combining semantic vector similarity with keyword intent matching, preventing unrelated clusters (like “Rust tutorials”) from dominating results for intent queries (“AI coding agents and IDEs”).
