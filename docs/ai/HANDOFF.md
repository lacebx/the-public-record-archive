# Handoff

## Current State

The project is at early MVP stage with:

- 9 routes, SSR rendering, Cloudflare Workers deployment
- Snapshot generation from 11 RSS feeds
- Client-side verification and download
- All data bundled at build time (no historical archive yet)
- No database, no auth, no server-side state
- Testing infrastructure: Vitest with 65 tests
- CI/CD: GitHub Actions (PR checks, deploy, scheduled snapshots + artifacts)
- Storage abstraction: `SnapshotStore` interface + `LocalSnapshotStore`
- Downloadable snapshot archive: tar.gz with manifest, checksums, and README

## Recently Completed

- **Issue #9: Testing infrastructure** — Vitest, 54 tests, generator refactored
- **Issue #10: CI/CD pipeline** — CI workflow, deploy workflow, scheduled
  snapshot workflow, storage abstraction, artifact archival
- **Issue #8: Downloadable snapshot archive** — Archive builder with minimal
  USTAR tar packer + gzip compression, server function for on-demand archive
  generation, download button on snapshot detail page, SHA-256 integrity
  information in MANIFEST + separate checksums file

## Next

The active milestone is **Milestone 1: Persistent Archive**. The highest
priority issue is **#4: Persist snapshot JSON to cloud object storage**.

## How to Resume

1. Read `docs/ai/CONTEXT.md` and `docs/ai/HANDOFF.md`
2. Check current milestone and issue on GitHub
3. Create a branch: `feature/r2-storage`
4. Implement:
   - Create Cloudflare R2 bucket
   - Set GitHub secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, R2 credentials)
   - Implement `R2SnapshotStore` in `src/lib/storage.ts`
   - Update `generate-snapshot.ts` to use `R2SnapshotStore` when configured
   - Update `data.ts` to use `R2SnapshotStore` for historical lookups
5. Update docs/ai/ files
6. Open a PR that closes the issue
