# Work Log

---

### Session: 2026-07-16 — Establish project memory system and roadmap

**Goal:** Set up the docs/ai/ project memory system, create the GitHub roadmap,
and establish engineering workflow.

**Milestone:** N/A (infrastructure)

**Branch:** (no branch — memory files only)

**Changes made:**

- Created `docs/ai/` directory with memory system files
- Created GitHub roadmap: 8 milestones, 30 issues
- Generated `PROJECT_OVERVIEW.md` at repository root

**Files modified:**

- `PROJECT_OVERVIEW.md` (created)
- `docs/ai/PROJECT_MEMORY.md` (created)
- `docs/ai/ARCHITECTURE.md` (created)
- `docs/ai/DECISIONS.md` (created)
- `docs/ai/WORK_LOG.md` (created)
- `docs/ai/CONTEXT.md` (created)
- `docs/ai/HANDOFF.md` (created)
- `docs/ai/PROMPTS.md` (created)
- `docs/ai/KNOWN_ISSUES.md` (created)
- `docs/ai/IDEAS.md` (created)

**PR:** N/A

**Remaining work:**

- Begin working on Milestone 1, Issue #4: Persist snapshot JSON to cloud
  object storage
- Requires: Cloudflare R2 bucket setup, snapshot generator modification,
  credential configuration

---

### Session: 2026-07-16 — Fix snapshot detail page (previous session, branch: fix-snapshot-detail)

**Goal:** Fix the broken snapshot detail page where clicking "View" on a listed
snapshot showed "No snapshot exists for this date."

**Milestone:** N/A (bug fix in existing MVP)

**Issue:** (not tracked — found during development)

**Branch:** `fix-snapshot-detail`

**Changes made:**

- Changed `getSnapshotByDate` from `createServerFn` to plain async function
  in `src/lib/data.ts`

**Files modified:**

- `src/lib/data.ts`

**Tests run:**

- Dev server verified: snapshot detail page loads with correct data
- Build verified: `npm run build` succeeds

**PR:** #3 (merged)

**Root cause:**
TanStack Start's babel plugin did not transform the `createServerFn` parameter
`async (date: string) => {...}` to extract `date` from the middleware context.
The handler received the full context object instead of the bare string,
causing `date === isoDate` to always fail.

---

### Session: 2026-07-16 — Testing infrastructure (Issue #9)

**Goal:** Install Vitest, configure test infrastructure, and write tests for
snapshot generation, snapshot integrity, and data loading.

**Milestone:** Milestone 1: Persistent Archive

**Issue:** #9

**Branch:** `feature/testing-infrastructure`

**Changes made:**

- Installed `vitest` (dev dependency)
- Created `vitest.config.ts` with Node environment, path alias
- Added `test` and `test:watch` npm scripts
- Refactored `scripts/generate-snapshot.ts` — extracted `sha256`, `extractText`,
  `extractLink`, `isRecord`, `parseFeedItems`, `buildRecords`, `buildSnapshot`,
  `writeSnapshotFiles` as exported pure functions; `main()` continues to
  work as the CLI entry point
- Fixed `extractLink` to handle fast-xml-parser v5 `@_href` attribute format
- Fixed `isRecord` to exclude arrays

**Files created:**

- `vitest.config.ts` — Vitest configuration
- `tests/fixtures/sample-rss.xml` — RSS 2.0 test fixture (3 items, 1 untitled)
- `tests/fixtures/sample-atom.xml` — Atom test fixture (2 entries)
- `scripts/__tests__/generate-snapshot.test.ts` — 38 tests for sha256,
  extractText, extractLink, isRecord, parseFeedItems, buildRecords,
  buildSnapshot
- `tests/integrity.test.ts` — 3 tests: hash verification, tamper detection,
  restore recovery
- `tests/data.test.ts` — 12 tests: snapshot shape, stats consistency,
  record invariants, getSnapshotByDate

**Tests run:**

- `npm test` — 53/53 passed
- `npm run lint` — 0 errors
- `npm run build` — succeeds

**PR:** #34 (merged, closes #9)

---

### Session: 2026-07-16 — CI workflow and PR checklist (follow-up to PR #34)

**Goal:** Add CI automation for PR checks and fix pre-existing TypeScript errors.

**Milestone:** Milestone 1: Persistent Archive

**Issue:** (follow-up to #9)

**Branch:** `feature/testing-infrastructure` (second commit, merged in same PR)

**Changes made:**

- Created `.github/workflows/ci.yml` — runs on every PR to main:
  `npm ci → npm run snapshot → npm run format → npm test → npm run lint
→ npm run typecheck → npm run build`
- Added `typecheck` script to `package.json` (`tsc --noEmit`)
- Fixed 6 pre-existing TS errors in route `navigate()` calls:
  `search={{}}` → `search={{ category: "" }}` / `search={{ q: "" }}`
- Updated `AGENTS.md` with PR checklist

**Files created:**

- `.github/workflows/ci.yml`

**Files modified:**

- `AGENTS.md`
- `package.json`
- `src/routes/index.tsx` (2 fixes)
- `src/routes/record.$id.tsx` (1 fix)
- `src/routes/search.tsx` (1 fix)
- `src/routes/snapshots.$date.tsx` (1 fix)

**Verification:**

- `npm test` — 54/54 passed
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — succeeds

**Remaining work after Issue #9:**

- Begin Milestone 1, Issue #4: Persist snapshot JSON to cloud object storage
- Requires: Cloudflare R2 bucket setup, snapshot generator modification,
  credential configuration

---

### Session: 2026-07-16 — CI/CD pipeline and scheduled snapshots (Issue #10)

**Goal:** Complete CI/CD pipeline (deploy workflow), create scheduled daily
snapshot generation, and build storage abstraction layer.

**Milestone:** Milestone 1: Persistent Archive

**Issue:** #10

**Branch:** `feature/scheduled-snapshots`

**Changes made:**

**CI/CD pipeline (Issue #10):**

- Created `.github/workflows/ci.yml` — validates every PR to main
- Created `.github/workflows/deploy.yml` — same checks + deploys to Cloudflare
  Workers on push to main (`npx nitro deploy`, requires Cloudflare secrets)
- Added `deploy`, `deploy:preview`, and `typecheck` npm scripts
- Fixed 6 pre-existing TypeScript errors in route `search={{}}` calls
- Updated `AGENTS.md` with PR checklist

**Scheduled snapshot generation:**

- Created `.github/workflows/snapshot.yml` — runs daily at 06:00 UTC and
  supports manual trigger via `workflow_dispatch`. Generates snapshot,
  validates integrity inline, archives `data/` and `src/lib/snapshot-data.ts`
  as artifacts (90-day retention). Fails loudly on integrity mismatch.

**Storage abstraction:**

- Created `src/lib/storage.ts` — `SnapshotStore` interface (`save`, `load`,
  `list`) with `LocalSnapshotStore` filesystem implementation
- Updated `scripts/generate-snapshot.ts` — calls `persistSnapshot()` which
  uses `LocalSnapshotStore` to write data files
- Updated `src/lib/data.ts` — `getSnapshotByDate()` falls back to
  `LocalSnapshotStore.load()` when date doesn't match bundled
- Refactored generator's internal `Record` interface to `SnapshotRecord` to
  avoid collision with TypeScript's built-in `Record<K,V>` type

**Files created:**

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/snapshot.yml`
- `src/lib/storage.ts`

**Files modified:**

- `scripts/generate-snapshot.ts` — added `persistSnapshot()`, renamed
  `Record` → `SnapshotRecord`, exported `ROOT` and `DATA_DIR`
- `src/lib/data.ts` — added storage fallback in `getSnapshotByDate()`
- `package.json` — added `typecheck`, `deploy`, `deploy:preview` scripts
- `AGENTS.md` — PR checklist
- `src/routes/index.tsx` (2 fixes), `record.$id.tsx` (1), `search.tsx` (1),
  `snapshots.$date.tsx` (1) — `search={{}}` → `search={{ ... }}`

**Verification:**

- `npm test` — 54/54 passed
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — succeeds

**PR:** https://github.com/lacebx/the-public-record-archive/pull/35 (merged, closes #10)

**Remaining work after Issue #10:**

- Begin Issue #4: Persist snapshot JSON to Cloudflare R2
- Requires: Cloudflare R2 bucket setup, credential configuration

---

### Session: 2026-07-16 — Issue #8: Downloadable snapshot archive

**Goal:** Implement a downloadable tar.gz archive for each snapshot containing
snapshot.json, MANIFEST.json, SHA256SUMS, and README.md, with offline
verification support.

**Milestone:** Milestone 1: Persistent Archive

**Branch:** `feature/snapshot-archive`

**Changes made:**

- Created `src/lib/archive.ts` — archive builder module with:
  - `buildArchiveFiles()` — generates 4 archive files (snapshot.json,
    MANIFEST.json, SHA256SUMS, README.md) with SHA-256 checksums
  - `buildArchiveTarGz()` — packs files into tar.gz using a minimal USTAR
    implementation (~80 lines) + Node.js built-in `zlib.gzipSync()`
  - `archiveFilename()` — returns `public-record-{isoDate}.tar.gz`
- Updated `src/lib/data.ts` — added `getArchive` server function that fetches
  snapshot by date and builds archive on the server, returns base64
- Updated `src/routes/snapshots.$date.tsx` — added `ArchiveDownloadButton` that
  calls the server function and triggers browser download
- Created `tests/archive.test.ts` — 11 tests covering archive file generation,
  checksum verification, tar.gz structure, and edge cases
- Updated `docs/ai/` — ARCHITECTURE.md (archive data flow, key modules),
  CONTEXT.md (current state), DECISIONS.md (ADR-010), HANDOFF.md (summary)

**Files modified:**

- `src/lib/archive.ts` — new file (archive builder)
- `src/lib/data.ts` — added `getArchive` server function
- `src/routes/snapshots.$date.tsx` — added ArchiveDownloadButton
- `tests/archive.test.ts` — new tests
- `docs/ai/ARCHITECTURE.md`, `CONTEXT.md`, `DECISIONS.md`, `HANDOFF.md`

**Verification:**

- `npm test` — 65/65 passed
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors

**PR:** https://github.com/lacebx/the-public-record-archive/pull/36 (closes #8)

**Remaining work after Issue #8:**

- Begin Issue #4: Persist snapshot JSON to Cloudflare R2
- Requires: Cloudflare R2 bucket setup, credential configuration

---

### Session: 2026-07-16 — Issue #4: Persistent Cloudflare R2 storage

**Goal:** Implement R2SnapshotStore with S3-compatible API for saving snapshots,
archive bundles, manifests, and checksums to Cloudflare R2. Graceful fallback
when R2 is not configured.

**Milestone:** Milestone 1: Persistent Archive

**Branch:** `feature/r2-storage`

**Changes made:**

- Installed `@aws-sdk/client-s3` for S3-compatible R2 API
- Updated `src/lib/storage.ts`:
  - Added `r2Config()` helper (reads env vars, returns config or null)
  - Added `R2SnapshotStore` implementing `SnapshotStore` interface:
    - `save(isoDate, snapshot)` → uploads snapshot.json to R2
    - `saveLatest(snapshot)` → maintains snapshots/latest.json
    - `load(isoDate)` → downloads + parses snapshot.json from R2
    - `loadLatest()` → reads snapshots/latest.json
    - `list()` → enumerates dates from R2 keys (handles pagination)
    - `saveArchive(isoDate, buffer)` → uploads tar.gz archive
    - `saveManifest(isoDate, manifest)` → uploads manifest.json
    - `saveChecksums(isoDate, checksums)` → uploads checksums.txt
  - Key structure: `snapshots/YYYY/MM/DD/{type}`
  - All S3 imports are dynamic (only loaded when R2 is configured)
- Updated `scripts/generate-snapshot.ts`:
  - `persistSnapshot()` now syncs to R2 after local save when env vars set
  - Syncs snapshot.json, archive.tar.gz, manifest.json, checksums.txt
  - Errors logged but do not fail the run (graceful degradation)
- Updated `src/lib/data.ts`:
  - `getSnapshotByDate()` tries R2 first, then local store, then bundled data
- Created `tests/storage.test.ts` — 18 tests covering:
  - `r2Config()` with various env var combinations
  - R2SnapshotStore constructor validation
  - `save()`, `saveLatest()` — correct path and content type
  - `load()` — success and error cases
  - `list()` — sorting, pagination, empty on error
  - `saveArchive()`, `saveManifest()`, `saveChecksums()` — correct paths
  - Error propagation for failed uploads
  - LocalSnapshotStore fallback tests (missing file, empty directory)
- Updated `docs/ai/` — all memory files updated

**Files modified:**

- `src/lib/storage.ts` — added r2Config, R2SnapshotStore
- `scripts/generate-snapshot.ts` — updated persistSnapshot with R2 sync
- `src/lib/data.ts` — updated getSnapshotByDate with R2 fallback
- `tests/storage.test.ts` — 18 new tests
- `docs/ai/ARCHITECTURE.md`, `docs/ai/CONTEXT.md`, `docs/ai/DECISIONS.md`,
  `docs/ai/HANDOFF.md`, `docs/ai/WORK_LOG.md`
- `package.json`, `package-lock.json` — added @aws-sdk/client-s3

**Verification:**

- `npm test` — 83/83 passed
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — succeeds (S3 client bundled for server, ~366 KB)

**PR:** https://github.com/lacebx/the-public-record-archive/pull/37 (closes #4)

**Remaining work after Issue #4:**

- **CRITICAL**: Create Cloudflare R2 bucket + set GitHub secrets
- Review Milestone 2 issues on GitHub roadmap
- Potential optimization: use native Workers R2 binding instead of S3 client

---

### Session: 2026-07-16 — Issue #6: Serve historical snapshots on demand

**Goal:** The snapshots index page must enumerate every snapshot available in R2,
and visiting `/snapshots/:date` should fetch that specific snapshot from R2 if
not available locally. Add LRU caching for R2 responses.

**Milestone:** Milestone 1: Persistent Archive

**Branch:** `feature/historical-snapshots`

**Changes made:**

- Updated `src/lib/data.ts`:
  - Added two `LRUCache` instances (`snapshotCache` 5-min TTL, `listCache` 2-min TTL)
  - Added `fetchSnapshotList()` — plain async function that returns
    `SnapshotSummary[]` (isoDate, date, generated, articles, sources, hash)
    from R2, falls back to bundled snapshot
  - Added `getSnapshotList` server function wrapping `fetchSnapshotList()`
  - Updated `getSnapshotByDate()` to check LRU cache first, then R2, then local
  - Bundled snapshot is cached on first access
- Updated `src/routes/snapshots.index.tsx`:
  - Loads data from `getSnapshotList()` instead of `getSnapshot()`
  - Renders all snapshots in the table, not just the latest
  - Shows empty state when no snapshots available
- Updated `tests/data.test.ts`:
  - Added SnapshotSummary shape assertions to bundled snapshot tests
  - Added `getSnapshotByDate` cache reference test (same object on repeat call)
  - Added `fetchSnapshotList` tests: R2 fallback, field types, bundled last entry
- Updated `docs/ai/` — all memory files + ADR-012

**Files modified:**

- `src/lib/data.ts` — caching, fetchSnapshotList, getSnapshotList
- `src/routes/snapshots.index.tsx` — full list rendering
- `tests/data.test.ts` — listing + cache tests
- `docs/ai/ARCHITECTURE.md`, `docs/ai/CONTEXT.md`, `docs/ai/DECISIONS.md`,
  `docs/ai/HANDOFF.md`, `docs/ai/WORK_LOG.md`

**Verification:**

- `npm test`: 88/88 passed
- `npm run lint`: 0 errors (excluding auto-generated snapshot-data.ts)
- `npm run typecheck`: 0 errors
- `npm run build`: succeeds

**PR:** https://github.com/lacebx/the-public-record-archive/pull/38 (closes #6)

---

### Session: 2026-07-16 — Issue #12, #13, #14: REST API, dev portal, Scalar playground

**Goal:** Implement a versioned REST API at `/api/v1/*`, a developer portal page,
and an interactive API playground with Scalar.

**Milestone:** Milestone 2: Search & Discovery

**Issues:** #12, #13, #14

**Branch:** `feature/api-v1`

**Changes made:**

**REST API (Issue #12):**
- Created `src/lib/api.ts` — API business logic module with 7 endpoint handlers:
  `listSnapshots()`, `getSnapshotApi()`, `getRecords()`, `getRecordById()`,
  `searchRecords()`, `getArchiveData()`, `healthCheck()`
- All functions return standardized `ApiResponse<T>` objects with `success`,
  `data`, `error`, and `meta` fields
- Created 7 TanStack Start routes under `src/routes/api/v1/`:
  - `health.tsx` → `/api/v1/health`
  - `snapshots.tsx` → `/api/v1/snapshots`
  - `snapshots.$date.tsx` → `/api/v1/snapshots/{date}`
  - `records.$id.tsx` → `/api/v1/records/{id}`
  - `search.tsx` → `/api/v1/search`
  - `archive.$date.tsx` → `/api/v1/archive/{date}`
  - `index.tsx` → redirects to `/api`
- OpenAPI 3.1 spec at `public/openapi.json` with all 6 endpoints documented

**Developer Portal (Issue #13):**
- Enhanced `src/routes/api.tsx` — full developer portal with:
  - Endpoint table with live links to each API route
  - Query parameters documentation
  - Example response
  - Error codes table
  - Caching and OpenAPI/Scalar sections

**Interactive Playground (Issue #14):**
- Installed `@scalar/api-reference` and `@scalar/api-reference-react`
- Created `src/routes/api/playground.tsx` — full-page Scalar API playground

**Testing:**
- Created `tests/api.test.ts` — 22 comprehensive tests covering all endpoints

**Files created:**
- `src/lib/api.ts` — API handler functions
- `src/routes/api/v1/index.tsx`, `health.tsx`, `snapshots.tsx`,
  `snapshots.$date.tsx`, `records.$id.tsx`, `search.tsx`, `archive.$date.tsx`
- `src/routes/api/playground.tsx` — Scalar interactive playground
- `public/openapi.json` — OpenAPI 3.1 specification
- `tests/api.test.ts` — 22 API tests

**Files modified:**
- `src/routes/api.tsx` — enhanced developer portal
- `package.json`, `package-lock.json` — added Scalar deps
- `docs/ai/ARCHITECTURE.md`, `CONTEXT.md`, `DECISIONS.md`, `HANDOFF.md`,
  `WORK_LOG.md`

**Verification:**
- `npm test`: 110/110 passed (22 new + 88 existing)
- `npm run lint`: 0 errors
- `npm run typecheck`: 0 errors
- `npm run build`: succeeds

**PR:** https://github.com/lacebx/the-public-record-archive/pull/39 (closes #12, #13, #14)
