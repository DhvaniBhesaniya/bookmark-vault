# Bookmark Vault Product Roadmap

This folder is the single source of truth for turning Bookmark Vault into a next-level open-source product inspired by KaraKeep-style strengths while keeping your current Rust + Axum + MongoDB architecture.

## Files
- GOALS.md: Product goals, user outcomes, and success metrics.
- GAP_RESEARCH_KARAKEEP.md: Research-based comparison (current vs target).
- IMPLEMENTATION_PLAN.md: Phased technical execution plan.
- TASKS.md: Prioritized backlog with milestones and acceptance criteria.

## How to use
1. Start from TASKS.md and pick the next unchecked item in the active milestone.
2. Implement in small PR-sized chunks.
3. After each feature, update TASKS.md status and notes.
4. Revisit GOALS.md every sprint to ensure work is outcome-driven.

## Current decision (from latest discussion)
- Query embedding cache experiments are paused.
- Focus now is relevance, UX filtering, folders/collections UX, browser capture, metadata quality, and open-source readiness.
