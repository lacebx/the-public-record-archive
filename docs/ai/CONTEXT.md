# Context

**Current milestone:** Milestone 1: Persistent Archive
**Current issue:** #9 (Testing infrastructure) — completed
**Current branch:** feature/testing-infrastructure
**Current PR:** (to be opened)
**Last completed work:** Vitest + 53 tests across snapshot generation, integrity, and data loading

## Current Blockers

- No Cloudflare R2 bucket configured (required for Issue #4)

## Next Recommended Action

Start **Issue #4: Persist snapshot JSON to cloud object storage**.

Pre-requisites:

1. Create a Cloudflare R2 bucket
2. Generate R2 API credentials (Access Key ID + Secret Access Key)
3. Configure environment variables or local `.env` file
4. Modify `scripts/generate-snapshot.ts` to upload to R2

## Important Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run snapshot` — Generate snapshot from RSS feeds
- `npm test` — Run all tests (vitest run)
- `npm run test:watch` — Run tests in watch mode
- `npm run lint` — Lint source files
- `npm run format` — Format source files

## Quick Links

- Issues: https://github.com/lacebx/the-public-record-archive/issues
- Milestones: https://github.com/lacebx/the-public-record-archive/milestones
- PRs: https://github.com/lacebx/the-public-record-archive/pulls
