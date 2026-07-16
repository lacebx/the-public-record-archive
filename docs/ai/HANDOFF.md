# Handoff

## Current State

The project is at early MVP stage with:

- 9 routes, SSR rendering, Cloudflare Workers deployment
- Snapshot generation from 11 RSS feeds
- Client-side verification and download
- All data bundled at build time (no historical archive yet)
- No database, no auth, no server-side state
- Testing infrastructure: Vitest with 83 tests
- CI/CD: GitHub Actions (PR checks, deploy, scheduled snapshots + artifacts)
- Storage abstraction: `SnapshotStore` interface + `LocalSnapshotStore` + `R2SnapshotStore`
- Downloadable snapshot archive: tar.gz with manifest, checksums, and README
- R2 storage integration: S3-compatible API with env var configuration

## Recently Completed

- **Issue #9: Testing infrastructure** — Vitest, 54 tests, generator refactored
- **Issue #10: CI/CD pipeline** — CI workflow, deploy workflow, scheduled
  snapshot workflow, storage abstraction, artifact archival
- **Issue #8: Downloadable snapshot archive** — Archive builder with minimal
  USTAR tar packer + gzip compression, server function for on-demand archive
  generation, download button on snapshot detail page
- **Issue #4: R2 SnapshotStore** — R2SnapshotStore implementing SnapshotStore
  interface with S3-compatible API, archive/manifest/checksums uploads,
  graceful fallback when R2 not configured

## Next

The highest priority action is **configuring a Cloudflare R2 bucket** and
setting the required GitHub secrets. Once R2 is active, the next milestone
(Milestone 2) can begin.

## How to Resume

1. Read `docs/ai/CONTEXT.md` and `docs/ai/HANDOFF.md`
2. Check current milestone and issue status on GitHub
3. Complete R2 setup:
   a. Create Cloudflare R2 bucket named `public-record-archive`
   b. Generate R2 API credentials
   c. Set GitHub secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   d. Verify: trigger `snapshot.yml` workflow manually and check logs
4. Review Milestone 2 issues on GitHub roadmap
5. Branch from main and implement the next issue
