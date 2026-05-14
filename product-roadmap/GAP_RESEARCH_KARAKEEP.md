# Gap Research: Bookmark Vault vs KaraKeep-Inspired Target

## What Bookmark Vault already has
- User auth and protected routes.
- Bookmark CRUD with AI tagging/summaries.
- Vector search endpoint with fallback text search.
- Tag aggregation endpoint and tag UI filter.
- Import flow for browser-export HTML files.
- Collections API on backend.

## High-value gaps to close next
1. Search relevance tuning for conversational queries
- Current: vector-first search returns top-N with no strict rerank thresholding.
- Gap: conversational prompts can return loosely related items.

2. Folder UX (collections already exist server-side)
- Current: backend collection APIs exist.
- Gap: frontend does not expose full folder management and card-to-folder assignment UX at the level users expect.

3. Advanced filter controls
- Current: basic tag/type/favorite filters.
- Gap: no explicit "settings/filter" control for result limit, folder filter, and richer narrowing in one place.

4. Browser-first capture
- Current: import via HTML export only.
- Gap: no browser extension/bookmarklet/webhook ingestion for real-time capture.

5. Metadata quality hardening
- Current: scraper reads static meta tags/title only.
- Gap: dynamic pages can produce poor titles (for example, waiting/interstitial pages).

6. Open-source project maturity
- Current: working app, but no explicit contributor growth roadmap.
- Gap: missing structured public roadmap, contribution labels, architecture docs, and test-driven release process.

## KaraKeep-inspired feature directions to adapt
- Browser extension ecosystem and sync friendliness.
- Rule engine for automation.
- Better full-text/keyword retrieval quality.
- Highlights and richer content capture.
- API + webhook-first integrations.
- Strong self-hosting and contributor experience.

## Principle for this project
Adopt the useful product patterns, not a clone. Keep your Rust backend strengths and build a clear, opinionated v1/v2 roadmap.
