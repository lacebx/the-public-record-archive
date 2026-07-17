# Handoff

## Current State

The project is at public alpha stage with:

- 20 routes, SSR rendering (except /compare which is CSR), Cloudflare Workers deployment
- Snapshot generation from 11 RSS feeds
- Diff engine for comparing any two snapshots (added/removed/modified/unchanged)
- Client-side verification, download, and archive export
- Data bundled at build time + historical retrieval from R2
- No database, no auth, no server-side state
- Unit testing: Vitest with 127 tests
- E2E testing: Playwright with 21 smoke tests
- CI/CD: GitHub Actions (PR checks, deploy, scheduled snapshots + artifacts)
- Storage: `SnapshotStore` interface + `LocalSnapshotStore` + `R2SnapshotStore`
- Caching: Three LRU caches (5-min snapshot, 2-min list, 10-min diff)
- Historical snapshots: full listing from R2, per-date retrieval, 404 handling
- REST API v1: 7 endpoints at `/api/v1/*` with JSON responses
- Developer portal at `/api` with endpoint docs, examples, error codes
- Interactive API playground at `/api/playground` (Scalar with OpenAPI 3.1 spec)
- OpenAPI 3.1 specification at `/openapi.json`
- Snapshot comparison at `/compare` with select dropdowns and summary cards
- Diff API at `/api/v1/diff?from=&to=` with pagination
- Playwright e2e tests covering all major routes and API endpoints

## Recently Completed

- **Issue #8:** Downloadable snapshot archive — tar.gz with manifest + checksums
- **Issue #4:** R2 storage — R2SnapshotStore, S3 API, graceful fallback, dotenv
- **Issue #6:** Historical snapshots — R2 listing, LRU caching, index page enumeration
- **Issue #12/#13/#14:** REST API v1, developer portal, Scalar playground
- **Repository health check** — verified all PRs merged, milestones accurate, Cloudflare Workers deployment
- **Public alpha polish** — fixed 404/error page styling, added browse empty state, added homepage empty state, added stripHtml utility for summary rendering
- **Honest product messaging** — removed fictional institutional claims from about page, documentation, metadata, and record pages (1998 founding date, consortium governance, witness nodes, postal address, WARC format claims)
- **Playwright e2e tests** — 21 smoke tests covering homepage, browse, search, snapshots, records, diff, API docs, playground, health, 404, and navigation

## Next

Milestone 3 has 2 open issues remaining:
- **Issue #15:** Snapshot diff & change tracking (in progress on `feature/snapshot-diff`)
- **Issue #16:** Snapshot analytics dashboard (not started)

## How to Resume

1. Read `docs/ai/CONTEXT.md` and `docs/ai/HANDOFF.md`
2. Complete `feature/snapshot-diff` branch (Issue #15) — diff engine, API endpoint, compare page, tests already written
3. Branch from main for new features
4. Run `npm test` (127 tests), `npm run typecheck`, `npm run lint`, `npm run build` before opening PRs
