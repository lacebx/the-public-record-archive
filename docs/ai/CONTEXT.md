# Context

**Current milestone:** N/A — work is organized by engineering layer (see ADR-016).
**Current branch:** fix/north-star-p0 (PR #43 open)
**Last completed work:** ADR-016, ROADMAP.md, Layer 1 issue creation, P0 remediation (browse claim, analytics rankings, OpenAPI examples).
**North star:** "The Public Internet Record preserves what was publicly available on the internet at a given point in time. It never predicts, interprets, ranks, recommends, or editorializes. It preserves evidence."
**Product model:** Five engineering layers (Foundation → Research → Expansion → Preservation → Launch). Work in layer order. See `docs/ai/ROADMAP.md`.

## Data Flow

- `/snapshots/` — `getSnapshotList()` returns all dates from R2 (cached 2 min), falls back to bundled
- `/snapshots/:date` — `getSnapshotByDate()` checks LRU cache, then R2, then local store, then bundled
- Archive download — `getArchive()` works for any date via the same resolution chain
- Missing dates — loader returns `{ data: null, latestIsoDate }` rendering a 404-style page
- `/api/v1/*` — REST API endpoints render JSON responses (TanStack Start routes with data from
  `src/lib/api.ts`, which delegates to `fetchSnapshotList()`, `getSnapshotByDate()`, or
  the bundled snapshot directly)
- `/compare` — Client-side comparison page fetches from `/api/v1/diff?from=&to=`
- `/api/v1/diff` — Returns diff between two snapshots (added/removed/modified/unchanged records)

## REST API Endpoints

| Endpoint                   | Method | Description                          |
| -------------------------- | ------ | ------------------------------------ |
| `/api/v1/health`           | GET    | System health check                  |
| `/api/v1/snapshots`        | GET    | List all snapshots (?limit, ?offset) |
| `/api/v1/snapshots/{date}` | GET    | Full snapshot for a date             |
| `/api/v1/records/{id}`     | GET    | Single record by ID                  |
| `/api/v1/search`           | GET    | Search records (?q=, ?limit=)        |
| `/api/v1/archive/{date}`   | GET    | Download snapshot archive (tar.gz)   |
| `/api/v1/diff`             | GET    | Diff two snapshots (?from=&to=)      |

## Routes

| Route              | Type | Description                                |
| ------------------ | ---- | ------------------------------------------ |
| `/`                | SSR  | Homepage with today's snapshot + recent    |
| `/browse`          | SSR  | Browse records with category filter        |
| `/search`          | SSR  | Full-text search across current snapshot   |
| `/snapshots`       | SSR  | List all available snapshots               |
| `/snapshots/:date` | SSR  | Single snapshot detail + download          |
| `/record/:id`      | SSR  | Record detail with summary, hash, metadata |
| `/compare`         | CSR  | Compare two snapshots via diff API         |
| `/analytics`       | SSR  | Archive analytics dashboard (Issue #16)    |
| `/api`             | SSR  | Developer portal with endpoint docs        |
| `/api/playground`  | SSR  | Interactive Scalar API playground          |
| `/documentation`   | SSR  | Project documentation                      |
| `/about`           | SSR  | About page with project info               |

## Analytics (`src/lib/analytics.ts`)

- `computeAnalytics()` — Server-side computation from `fetchSnapshotList()` + bundled snapshot
- `computePublishers()` / `computeCategories()` / `computeCountries()` — Breakdowns with percentages
- Time-series: records, sources, new records, carried over per snapshot date
- Source health: feeds succeeded/failed/total from latest snapshot statistics
- Charts: CSS-based horizontal bars (no JS chart dependency), tables for time-series

## Diff Engine (`src/lib/diff.ts`)

- `stableRecordKey()` — Deduplication key from `sourceUrl` or `publisher|||title`
- `computeDiff()` — Classifies records as added/removed/modified/unchanged with field-level diffs
- `buildMatches()` — Multimap (`Map<string, Match[]>`) preserving duplicate keys
- `consumeMatch()` — Consumes one `from` record per `to` record (handles duplicates)
- `getDiff()` — Resolves snapshots by date, caches via `diffCache` (LRU, 20 entries, 10-min TTL)
- `paginateDiffRecords()` — Supports limit/offset for large diffs

## Developer Portal

- `/api` — Developer portal with endpoint listing, examples, error codes, and links
- `/api/playground` — Full Scalar interactive API playground
- `/openapi.json` — OpenAPI 3.1 specification

## Caching

| Cache           | TTL    | Purpose                               |
| --------------- | ------ | ------------------------------------- |
| `snapshotCache` | 5 min  | Full snapshot objects by isoDate      |
| `listCache`     | 2 min  | SnapshotSummary array from R2 listing |
| `diffCache`     | 10 min | Diff results between snapshot dates   |

## Environment Variables (R2)

| Variable               | Required | Default                 | Description           |
| ---------------------- | -------- | ----------------------- | --------------------- |
| `R2_ACCOUNT_ID`        | Yes      | —                       | Cloudflare account ID |
| `R2_ACCESS_KEY_ID`     | Yes      | —                       | R2 access key         |
| `R2_SECRET_ACCESS_KEY` | Yes      | —                       | R2 secret access key  |
| `R2_BUCKET`            | No       | `public-record-archive` | R2 bucket name        |

## Important Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run deploy` — Deploy to Cloudflare Workers
- `npm run snapshot` — Generate snapshot from RSS feeds
- `npm test` — Run all tests (vitest run) — 187 tests
- `npm run test:e2e` — Run Playwright e2e smoke tests
- `npm run typecheck` — TypeScript type check
- `npm run lint` — Lint + format source files

## Workflows

| File                             | Trigger                  | Purpose                                                                  |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `.github/workflows/ci.yml`       | PR to main               | Validate (install → snapshot → format → test → lint → typecheck → build) |
| `.github/workflows/deploy.yml`   | Push to main             | Validate + deploy to Cloudflare Workers                                  |
| `.github/workflows/snapshot.yml` | Daily 06:00 UTC + manual | Generate snapshot, validate integrity, archive artifacts                 |

## Quick Links

- Issues: https://github.com/lacebx/the-public-record-archive/issues
- Milestones: https://github.com/lacebx/the-public-record-archive/milestones
- PRs: https://github.com/lacebx/the-public-record-archive/pulls
