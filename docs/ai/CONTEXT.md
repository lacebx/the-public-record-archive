# Context

**Current milestone:** Milestone 1: Persistent Archive
**Current issue:** #6 (serve historical snapshots on demand) — in progress
**Current branch:** feature/historical-snapshots
**Current PR:** https://github.com/lacebx/the-public-record-archive/pull/38 (pending)
**Last completed work:** Historical snapshot retrieval with R2 listing, LRU caching, and full index page

## Data Flow

- `/snapshots/` — `getSnapshotList()` returns all dates from R2 (cached 2 min), falls back to bundled
- `/snapshots/:date` — `getSnapshotByDate()` checks LRU cache, then R2, then local store, then bundled
- Archive download — `getArchive()` works for any date via the same resolution chain
- Missing dates — loader returns `{ data: null, latestIsoDate }` rendering a 404-style page

## Caching

| Cache | TTL | Purpose |
|-------|-----|---------|
| `snapshotCache` | 5 min | Full snapshot objects by isoDate |
| `listCache` | 2 min | SnapshotSummary array from R2 listing |

## Environment Variables (R2)

| Variable                  | Required | Default                   | Description             |
| ------------------------- | -------- | ------------------------- | ----------------------- |
| `R2_ACCOUNT_ID`           | Yes      | —                         | Cloudflare account ID   |
| `R2_ACCESS_KEY_ID`        | Yes      | —                         | R2 access key           |
| `R2_SECRET_ACCESS_KEY`    | Yes      | —                         | R2 secret access key    |
| `R2_BUCKET`               | No       | `public-record-archive`   | R2 bucket name          |

## Important Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run deploy` — Deploy to Cloudflare Workers
- `npm run snapshot` — Generate snapshot from RSS feeds
- `npm test` — Run all tests (vitest run)
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
