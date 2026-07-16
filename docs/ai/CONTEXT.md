# Context

**Current milestone:** Milestone 1: Persistent Archive
**Current issue:** #4 (R2 storage) — completed
**Current branch:** feature/r2-storage
**Current PR:** https://github.com/lacebx/the-public-record-archive/pull/37 (pending)
**Last completed work:** R2SnapshotStore implementation with S3-compatible API

## Current Blockers

- No Cloudflare R2 bucket configured (requires account setup + credentials)
- No R2 credentials set in GitHub secrets (requires R2 bucket first)

## Next Recommended Action

1. Create a Cloudflare R2 bucket named `public-record-archive`
2. Generate R2 API credentials (Access Key ID + Secret Access Key)
3. Set GitHub secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. Monitor the next scheduled snapshot workflow to verify R2 sync

## Environment Variables (R2)

The following env vars activate R2 storage. When absent, the app falls back to
local storage and bundled snapshot data.

| Variable                  | Required | Default                   | Description             |
| ------------------------- | -------- | ------------------------- | ----------------------- |
| `R2_ACCOUNT_ID`           | Yes      | —                         | Cloudflare account ID   |
| `R2_ACCESS_KEY_ID`        | Yes      | —                         | R2 access key           |
| `R2_SECRET_ACCESS_KEY`    | Yes      | —                         | R2 secret access key    |
| `R2_BUCKET`               | No       | `public-record-archive`   | R2 bucket name          |

## Object Storage Structure

```
snapshots/
├── latest.json
├── YYYY/
│   └── MM/
│       └── DD/
│           ├── snapshot.json
│           ├── public-record-YYYY-MM-DD.tar.gz
│           ├── manifest.json
│           └── checksums.txt
```

## Important Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run deploy` — Deploy to Cloudflare Workers (requires secrets)
- `npm run deploy:preview` — Deploy preview build
- `npm run snapshot` — Generate snapshot from RSS feeds
- `npm test` — Run all tests (vitest run)
- `npm run test:watch` — Run tests in watch mode
- `npm run typecheck` — TypeScript type check
- `npm run lint` — Lint source files
- `npm run format` — Format source files (run after `npm run snapshot`)

## Workflows

| File                             | Trigger                  | Purpose                                                                  |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `.github/workflows/ci.yml`       | PR to main               | Validate (install → snapshot → format → test → lint → typecheck → build) |
| `.github/workflows/deploy.yml`   | Push to main (also PRs)  | Validate + deploy to Cloudflare Workers                                  |
| `.github/workflows/snapshot.yml` | Daily 06:00 UTC + manual | Generate snapshot, validate integrity, archive artifacts                 |

## Quick Links

- Issues: https://github.com/lacebx/the-public-record-archive/issues
- Milestones: https://github.com/lacebx/the-public-record-archive/milestones
- PRs: https://github.com/lacebx/the-public-record-archive/pulls
