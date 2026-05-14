# Goals and Success Metrics

## Product Vision
Build a self-hostable, AI-assisted bookmark platform that feels natural for conversational search, powerful for organization, and easy to contribute to as an open-source project.

## Core user outcomes
1. Users can search naturally (for example: "i need ai tools and pdf tools") and see relevant items at the top.
2. Users can filter quickly by tags, type, favorites, folders, and limits without friction.
3. Users can organize bookmarks into folders/collections from card-level actions.
4. Users can capture bookmarks directly from browser workflows.
5. Link metadata quality is reliable (no broken titles like "just wait a moment...").
6. Project is easy to self-host and easy for contributors to extend.

## North-star metrics
- Search quality: >= 80% top-5 relevance on curated test queries.
- Time-to-find: median <= 10 seconds to locate a bookmark.
- Organization usage: >= 50% active users use at least one folder.
- Capture adoption: >= 30% new bookmarks added through browser integration/import flows.
- Metadata quality: <= 5% bookmarks with low-quality titles after enrichment.
- Open-source health: documented setup in <= 15 minutes and first PR path clearly defined.

## Quality bars
- Every major feature has acceptance criteria and demo steps.
- No regressions in auth isolation and user-scoped data.
- UI remains responsive on desktop and mobile.
- API behavior is deterministic and observable via logs.
