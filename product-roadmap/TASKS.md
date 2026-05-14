# Execution Backlog

Legend: [ ] not started, [~] in progress, [x] done

## Milestone A: Search Relevance (Immediate)
- [ ] Add temporary diagnostic logging for search scores and top titles.
- [x] Add hybrid retrieval in search route (vector + text candidates).
- [x] Add rerank weighted scoring and score normalization.
- [x] Add minimum relevance threshold and safe fallback behavior.
- [ ] Validate relevance using exploratory real-user queries (no fixed benchmark gate).

Acceptance criteria
- Top 5 results are consistently relevant for typical conversational queries.
- Irrelevant clusters are consistently pushed below top results.

## Milestone B: Pagination and Full Retrieval UX (In Progress)
- [x] Set card page size to 15 items in frontend constants.
- [x] Add fixed bottom pagination dock with clickable page numbers.
- [x] Keep grid scroll behavior intact with pagination dock visible.
- [x] Enable full bookmark retrieval mode for home view.
- [x] Remove default search hard limit from frontend query path.
- [x] Add mobile back button to close opened bookmark detail and return to card list.
- [ ] Verify pagination behavior on mobile and desktop breakpoints.

Acceptance criteria
- Vault view renders 15 cards per page with smooth page switching.
- Pagination dock stays fixed at bottom center while content scrolls.
- Search/list data retrieval is not hard-capped by previous default limits.

## Milestone C: Filter Settings and Folder UX
- [x] Add filter/settings button near tags/search controls.
- [x] Add result limit control in UI and pass through API.
- [x] Add folder filter dropdown in UI.
- [ ] Expose collection CRUD UI backed by existing collections API.
- [ ] Add card action: move bookmark to folder.
- [ ] Add folder detail view showing bookmark titles/cards in that folder.

Acceptance criteria
- User can create a folder named "ai tools" and assign bookmarks from cards.
- User can filter to a folder and only see matching bookmarks.

## Milestone D: Metadata Quality
- [ ] Add low-quality title detector rules.
- [ ] Add metadata retry/backoff and delayed refresh job.
- [ ] Add fallback title generation from URL/domain path.
- [ ] Add admin/debug endpoint or script to reprocess weak metadata rows.

Acceptance criteria
- Known bad pages (for example perplexity waiting page states) no longer remain with bad final titles in most cases.

## Milestone E: Open-Source Readiness
- [ ] Add architecture overview doc with backend and frontend modules.
- [ ] Add contribution guide with local setup + first issue path.
- [ ] Add issue templates for bug/feature/regression.
- [ ] Add basic CI checks for backend build and frontend lint/test.
- [ ] Publish roadmap summary in README.

Acceptance criteria
- New contributor can run project locally and submit a small PR without private instructions.

## Future Milestone (Parked): Browser Capture
- [ ] Define auth strategy for external capture client (token/session).
- [ ] Add capture endpoint for URL + optional title/notes.
- [ ] Build minimal browser capture MVP (bookmarklet or extension).
- [ ] Add docs for setup and usage.

Acceptance criteria
- Saving current tab from browser adds bookmark to vault in under 2 clicks.

## Immediate next 7 tasks (execution order)
1. [ ] Verify pagination dock behavior on desktop and mobile.
2. [ ] Add hybrid retrieval in backend search route.
3. [ ] Add rerank + threshold and validate with exploratory natural queries.
4. [ ] Build frontend filter/settings drawer with result limit + folder filter.
5. [ ] Wire collection CRUD UI to existing backend endpoints.
6. [ ] Add move-to-folder action in bookmark card/detail UI.
7. [ ] Add metadata quality heuristics for weak titles.
