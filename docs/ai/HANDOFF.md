# Handoff

## Current State

The project is at public alpha stage with:

- 20 routes, SSR rendering (except /compare which is CSR), Cloudflare Workers deployment
- Snapshot generation from **29 RSS feeds** (~700+ records/day expected)
- **URL deduplication** at ingestion (preserves first occurrence)
- **Per-feed diagnostic logging** with source, item count, age, fetch/parse duration
- **SnapshotStatistics** metadata persisted with each snapshot
- **Homepage** displays generation statistics (new records, carried over, duplicates)
- Diff engine for comparing any two snapshots (added/removed/modified/unchanged)
- Client-side verification, download, and archive export
- Data bundled at build time + historical retrieval from R2
- No database, no auth, no server-side state
- Unit testing: Vitest with **134 tests** (7 new: dedup + stats)
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
- **PR #41 (merged):** Repository health check, public alpha polish, honest messaging, Playwright e2e tests, diff engine
- **Pipeline expansion:** 18 new feeds (29 total), URL deduplication, per-feed logging, SnapshotStatistics type, homepage stats display
- **North-star audit:** Established "evidence infrastructure for history" north star, audited all 15 routes + 14 lib files + OpenAPI spec + styles, produced P0/P1/P2 remediation roadmap for v1.0.

## Milestone Status

| Milestone                        | Progress   | Status                                       |
| -------------------------------- | ---------- | -------------------------------------------- |
| M1: Persistent Archive           | 8/8 (100%) | Complete                                     |
| M2: Public REST API              | 3/3 (100%) | Complete                                     |
| M3: Historical Search & Analysis | 3/3 (100%) | Complete                                     |
| M4: Historical Intelligence      | 3/3 (100%) | Complete (Issue #17)                         |
| M5: Expanded Coverage            | 1/3 (33%)  | Partial (29/50 sources — on hold)            |
| M6: Change Intelligence          | 0/3 (0%)   | Not started (on hold)                        |
| M7: AI-Assisted Exploration      | 0/3 (0%)   | Not started (on hold — ADR-014 prohibits AI) |
| M8: Version 1.0 Launch           | 0/5 (0%)   | Not started                                  |

## Architecture

### Related Record Engine (`src/lib/related.ts`)

- Deterministic scoring (no AI): publisher (+30), time (+5-15), title Jaccard (+0-25), keyword Jaccard (+0-20), category (+10), country (+5)
- Threshold ≥ 35 for related, ≥ 40 for timeline clustering
- Every relationship has type, score, and explainable reasons
- Pre-computed features for O(n²) performance
- `computeRelationship(a, b)` → `{ score, type, reasons }` or null
- `findRelated(record, candidates, limit?, threshold?)` → sorted list

### Story Timeline Engine (`src/lib/timelines.ts`)

- Graph-based clustering (connected components) using related record graph
- Minimum cluster size: 2 records
- Auto-naming from top 3 most frequent significant words
- Chronological sort within timelines
- Cached results (rebuilt on module load from bundled snapshot)
- Conservative: prefers false negatives over false positives

## V1.0 Product Direction: ADR-016

The project has adopted a five-layer engineering model (ADR-016):

| Layer | Name                | Status                  |
| ----- | ------------------- | ----------------------- |
| 1     | Archive Foundation  | ~60%                    |
| 2     | Historical Research | Not started             |
| 3     | Archive Expansion   | Partial (29/50 sources) |
| 4     | Preservation        | Not started             |
| 5     | Public Launch       | Not started             |

Work must be completed in layer order. All new features must pass five gates:
North Star, Integrity, Simplicity, Dependency, Removal.

**See:** `docs/ai/ROADMAP.md` for the full issue-by-issue roadmap.

## Next

### Immediate: Complete Layer 1

1. **#44** — Unbundle snapshot data from git (critical — blocks verifiability)
2. **#45** — R2 persistence reliability (critical — silent failure loses snapshots)
3. **#47** — Fix archive timestamp (high — misleading metadata)
4. **#46** — Per-record checksums (high — enables independent verification)
5. **#48** — Conditional HTTP feeds (medium — bandwidth, source respect)
6. **#49** — Server-side search (high — scalability)
7. **#50** — Pagination (high — scalability)
8. **#51** — Cron failure notification (high — reliability)
9. **#18** — Evidence chain (high — provenance)
10. OpenAPI diff docs (medium — completeness)

### Then: Layer 2+ (when Layer 1 is stable)

See `docs/ai/ROADMAP.md` for the full dependency graph.

### Before any PR

1. `npm test` (187 tests currently)
2. `npm run lint` (0 errors)
3. `npm run typecheck` (0 errors)
4. `npm run build` (succeeds)

## How to Resume

1. Read `docs/ai/CONTEXT.md`, `docs/ai/HANDOFF.md`, `docs/ai/NORTH_STAR.md`, and `docs/ai/ROADMAP.md`
2. Read ADR-016 in `docs/ai/DECISIONS.md` for product direction
3. Work in layer order — complete Layer 1 before starting Layer 2
4. Run all checks before opening PRs
