# Context

**Current milestone:** Milestone 2: Search & Discovery
**Current issue:** #12, #13, #14 — REST API, dev portal, Scalar playground — complete
**Current branch:** feature/api-v1
**Current PR:** (to be opened, closes #12, #13, #14)
**Last completed work:** REST API v1 with 7 endpoints, developer portal, interactive API playground

## Data Flow

- `/snapshots/` — `getSnapshotList()` returns all dates from R2 (cached 2 min), falls back to bundled
- `/snapshots/:date` — `getSnapshotByDate()` checks LRU cache, then R2, then local store, then bundled
- Archive download — `getArchive()` works for any date via the same resolution chain
- Missing dates — loader returns `{ data: null, latestIsoDate }` rendering a 404-style page
- `/api/v1/*` — REST API endpoints render JSON responses (TanStack Start routes with data from
  `src/lib/api.ts`, which delegates to `fetchSnapshotList()`, `getSnapshotByDate()`, or
  the bundled snapshot directly)

## REST API Endpoints

| Endpoint                  | Method | Description                         |
| ------------------------- | ------ | ----------------------------------- |
| `/api/v1/health`          | GET    | System health check                 |
| `/api/v1/snapshots`       | GET    | List all snapshots (?limit, ?offset)|
| `/api/v1/snapshots/{date}`| GET    | Get full snapshot for a date        |
| `/api/v1/records/{id}`    | GET    | Get a single record by ID           |
| `/api/v1/search`          | GET    | Search records (?q=, ?limit=)       |
| `/api/v1/archive/{date}`  | GET    | Download snapshot archive (tar.gz)  |

## Developer Portal

- `/api` — Developer portal with endpoint listing, examples, error codes, and links
- `/api/playground` — Full Scalar interactive API playground
- `/openapi.json` — OpenAPI 3.1 specification

## Caching

| Cache           | TTL   | Purpose                               |
| --------------- | ----- | ------------------------------------- |
| `snapshotCache` | 5 min | Full snapshot objects by isoDate      |
| `listCache`     | 2 min | SnapshotSummary array from R2 listing |

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
- `npm test` — Run all tests (vitest run) — 110 tests
- `npm run typecheck` — TypeScript type check
- `npm run lint` — Lint source files

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
