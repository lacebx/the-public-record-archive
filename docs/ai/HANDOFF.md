# Handoff

## Current State

The project is at early MVP stage with:

- 9 routes, SSR rendering, Cloudflare Workers deployment
- Snapshot generation from 11 RSS feeds
- Client-side verification and download
- All data bundled at build time (no historical archive yet)
- Testing infrastructure: Vitest with 53 tests

## Recently Completed

- **Issue #9: Testing infrastructure** — Vitest installed, `vitest.config.ts`,
  53 tests covering snapshot generation (38), integrity (3), and data
  loading (12). Refactored `scripts/generate-snapshot.ts` to export pure
  functions. Branch: `feature/testing-infrastructure`.
- Project memory system established (`docs/ai/`)
- GitHub roadmap created (8 milestones, 30 issues)
- `PROJECT_OVERVIEW.md` written
- Bug fix: snapshot detail page (PR #3, branch: fix-snapshot-detail)

## Next

The active milestone is **Milestone 1: Persistent Archive**. The highest
priority issue is **#4: Persist snapshot JSON to cloud object storage**.

## How to Resume

1. Read `docs/ai/CONTEXT.md` and `docs/ai/HANDOFF.md`
2. Check current milestone and issue on GitHub
3. Create a branch: `feature/persist-snapshots`
4. Implement the issue
5. Update docs/ai/ files
6. Open a PR that closes the issue
