# Handoff

## Current State

The project is at early MVP stage with:

- 16 routes, SSR rendering, Cloudflare Workers deployment
- Snapshot generation from 11 RSS feeds
- Client-side verification, download, and archive export
- Data bundled at build time + historical retrieval from R2
- No database, no auth, no server-side state
- Testing infrastructure: Vitest with 110 tests
- CI/CD: GitHub Actions (PR checks, deploy, scheduled snapshots + artifacts)
- Storage: `SnapshotStore` interface + `LocalSnapshotStore` + `R2SnapshotStore`
- Caching: Two LRU caches (5-min snapshot, 2-min list) for R2 response reduction
- Historical snapshots: full listing from R2, per-date retrieval, 404 handling
- REST API v1: 7 endpoints at `/api/v1/*` with JSON responses
- Developer portal at `/api` with endpoint docs, examples, error codes
- Interactive API playground at `/api/playground` (Scalar with OpenAPI 3.1 spec)
- OpenAPI 3.1 specification at `/openapi.json`

## Recently Completed

- **Issue #9:** Testing infrastructure — Vitest, 54+ tests, generator refactored
- **Issue #10:** CI/CD pipeline — workflows, storage abstraction, artifact archival
- **Issue #8:** Downloadable snapshot archive — tar.gz with manifest + checksums
- **Issue #4:** R2 storage — R2SnapshotStore, S3 API, graceful fallback, dotenv
- **Issue #6:** Historical snapshots — R2 listing, LRU caching, index page enumeration
- **Issue #12:** REST API v1 — 7 endpoints (health, snapshots list/detail,
  records lookup, search, archive download)
- **Issue #13:** Developer portal — enhanced `/api` page with endpoint docs,
  examples, error codes, query params, caching info
- **Issue #14:** Interactive API playground — Scalar at `/api/playground`,
  OpenAPI 3.1 spec at `/openapi.json`

## Next

Milestone 2 is in progress. The remaining Milestone 2 issues include:
- Search index / advanced search
- Feed failure rollover refinements
- Additional API features (pagination improvements, CORS headers)

## How to Resume

1. Read `docs/ai/CONTEXT.md` and `docs/ai/HANDOFF.md`
2. Review remaining Milestone 2 issues on GitHub roadmap
3. Branch from main and implement the next issue
4. Run `npm test` (110 tests) and `npm run typecheck` before opening PRs
