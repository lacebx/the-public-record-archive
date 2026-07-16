# Context

**Current milestone:** Milestone 1: Persistent Archive
**Current issue:** #8 (downloadable snapshot archive) — completed
**Current branch:** feature/snapshot-archive
**Current PR:** https://github.com/lacebx/the-public-record-archive/pull/37
**Last completed work:** Downloadable snapshot archive (tar.gz with MANIFEST, SHA256SUMS, README)

## Current Blockers

- No Cloudflare R2 bucket configured (required for Issue #4)

## Next Recommended Action

Open PR for Issue #10, then start **Issue #4: Persist snapshot JSON to cloud object storage**.

Pre-requisites for Issue #4:

1. Create a Cloudflare R2 bucket
2. Generate R2 API credentials (Access Key ID + Secret Access Key)
3. Configure environment variables in GitHub secrets
4. Implement `R2SnapshotStore` implementing `SnapshotStore` interface (already defined in `src/lib/storage.ts`)
5. Update `generate-snapshot.ts` to use `R2SnapshotStore` when configured

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
