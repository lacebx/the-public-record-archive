# Handoff

## Current State

The project is at early MVP stage with:

- 9 routes, SSR rendering, Cloudflare Workers deployment
- Snapshot generation from 11 RSS feeds
- Client-side verification, download, and archive export
- Data bundled at build time + historical retrieval from R2
- No database, no auth, no server-side state
- Testing infrastructure: Vitest with 88 tests
- CI/CD: GitHub Actions (PR checks, deploy, scheduled snapshots + artifacts)
- Storage: `SnapshotStore` interface + `LocalSnapshotStore` + `R2SnapshotStore`
- Caching: Two LRU caches (5-min snapshot, 2-min list) for R2 response reduction
- Historical snapshots: full listing from R2, per-date retrieval, 404 handling

## Recently Completed

- **Issue #9:** Testing infrastructure — Vitest, 54+ tests, generator refactored
- **Issue #10:** CI/CD pipeline — workflows, storage abstraction, artifact archival
- **Issue #8:** Downloadable snapshot archive — tar.gz with manifest + checksums
- **Issue #4:** R2 storage — R2SnapshotStore, S3 API, graceful fallback, dotenv
- **Issue #6:** Historical snapshots — R2 listing, LRU caching, index page enumeration

## Next

Milestone 1 is complete. The next milestone is **Milestone 2: Search & Discovery**.

## How to Resume

1. Read `docs/ai/CONTEXT.md` and `docs/ai/HANDOFF.md`
2. Review Milestone 2 issues on GitHub roadmap
3. Check if R2 bucket is configured (required for historical snapshot testing)
4. Branch from main and implement the next issue
