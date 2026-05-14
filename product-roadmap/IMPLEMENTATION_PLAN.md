# Implementation Plan (Phased)

## Phase 0: Relevance Foundation (1-2 days)
Goal: improve generic relevance for any natural-language query, not only predefined examples.

### Deliverables
- Search quality improvements are measured with live exploratory queries from real usage.
- Score logging for returned search results to support tuning.
- No hard-coded benchmark gate for shipping.

### Technical tasks
- Add temporary debug logging for search score + title in backend search route.
- Create lightweight relevance review checklist in TASKS.md.

## Phase 1: Search relevance upgrades (2-4 days)
Goal: better top-ranked relevance for conversational search without cache complexity.

### Deliverables
- Hybrid candidate retrieval:
  - vector candidates (K > requested limit)
  - keyword/text candidates
- Rerank in Rust using weighted score.
- Minimum relevance threshold before returning.

### Notes
- Keep embedding input raw query text (no synthetic prompt injection).
- Keep current API contract unchanged for frontend compatibility.

## Phase 2: Pagination and Full Retrieval UX (1-2 days)
Goal: return complete matching sets and control display from UI.

### Deliverables
- Backend supports full retrieval mode for bookmarks/search flows.
- Frontend shows 15 cards per page.
- Fixed bottom pagination dock with clickable page numbers.
- Main grid remains scrollable and responsive.

### Notes
- Data retrieval is not hard-limited in core query path; visual limitation is via pagination and filters.

## Phase 3: Filter and folder UX (3-5 days)
Goal: users can quickly narrow results and manage folders from the main workflow.

### Deliverables
- New filter/settings control in search/tags area:
  - result limit selector
  - folder selector
  - sort mode selector (relevance/newest/oldest)
- Full folder UI:
  - create/update/delete folder
  - add/remove bookmark to/from folder from card actions
  - folder dropdown that shows bookmark titles in that folder context

### Backend/Frontend alignment
- Backend collection APIs already exist; wire frontend pages/components to them.
- Add collection filter support to bookmark listing/search routes if needed.

## Phase 4: Metadata quality pipeline (2-4 days)
Goal: fix bad titles/descriptions and improve preview quality.

### Deliverables
- Title quality heuristic pass:
  - detect low-quality patterns ("just wait", "loading", blank, generic)
  - apply fallback order with URL-derived candidate and delayed re-fetch
- Retry with backoff and stronger user-agent strategy.
- Queue-based re-enrichment for poor metadata records.

## Phase 5: Open-source maturity and scale (ongoing)
Goal: make project contributor-ready and production-friendly.

### Deliverables
- Public roadmap and issue templates.
- Contribution guide with "good first issue" pathways.
- Testing matrix for backend routes and frontend critical flows.
- Release checklist and changelog discipline.
- Optional AGPL/MIT strategy decision and governance notes.

## Future Phase (Parked): Browser capture and sync-first ingestion (4-7 days)
Goal: save directly from browsing flow, not only import HTML exports.

### Deliverables
- V1 capture endpoint for external clients (extension/bookmarklet).
- Minimal browser bookmarklet or extension MVP:
  - send current tab URL/title to API
  - auth via API token/session strategy
- Optional webhook endpoint for automated ingestion tools.

### Optional next
- Evaluate browser bookmark sync via existing ecosystems and adapters.

## Architecture priorities
1. Keep existing Rust + Mongo architecture stable.
2. Prefer incremental feature flags over big rewrites.
3. Preserve user-scoped authorization guarantees on all routes.
4. Add observability before optimization.
