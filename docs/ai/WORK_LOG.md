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

---

### Session: 2026-07-17 — Repository health check, public alpha polish, honest messaging, e2e tests

**Goal:** Perform a comprehensive repository health check, fix every broken page
and empty state, remove fictional institutional claims, add Playwright e2e tests,
and prepare the project for a true public alpha.

**Milestone:** N/A (quality / readiness)

**Issues:** None directly — pre-launch preparation

**Branch:** `feature/snapshot-diff`

## Phase 1 — Repository Health

**Findings:**

- All 9 PRs merged (none open). Main branch is current.
- Milestone 1 closed (complete). Milestones 2–8 open.
- Milestone 2 has 1 open issue (#11) — superseded by #12/#13/#14 implementation.
- Cloudflare Workers deployment via `.github/workflows/deploy.yml` (not Vercel).
- No blocking unmerged PRs.

## Phase 2 — Public Alpha Polish

**Changes made:**

- **`src/routes/__root.tsx`** — Fixed 404 and error boundary components:
  - Replaced undefined shadcn CSS classes (`bg-primary`, `rounded-md`, `border-input`,
    `text-primary-foreground`) with project's existing `.btn` class
  - Removed Tailwind v4 shadcn-style classes that had no corresponding CSS definitions
- **`src/routes/browse.tsx`** — Added empty state for category filter with no matches:
  "No records match the selected category."
- **`src/routes/index.tsx`** — Added empty state for "Recently Archived" section:
  "No records have been archived yet."
- **`src/lib/utils.ts`** — Added `stripHtml()` utility function that removes HTML tags
  and decodes common HTML entities
- **`src/routes/search.tsx`** — Applied `stripHtml()` to record summaries in search results
- **`src/routes/record.$id.tsx`** — Applied `stripHtml()` to record summary display and
  meta description; fixed record meta to strip HTML from OG tags

## Phase 3 — Honest Product Messaging

**Changes made:**

- **`src/routes/about.tsx`** — Removed all fictional claims:
  - "since 1998" → "since 2026"
  - "nonprofit archival trust" → "independent archival project"
  - "consortium of national libraries, university archives, and independent historians"
    → "founded to create a durable, publicly accessible historical record"
  - Removed "Founded 14 March 1998", "Legal Form: Nonprofit archival trust",
    "Governance: Consortium of national and university archives",
    "Funding: Public grants, institutional membership, individual donations"
  - Removed fictional contact info: "PO Box 1998, The Hague, Netherlands",
    "records @ public-record.org", "security @ public-record.org"
  - Replaced with "This project is maintained on GitHub."
- **`src/routes/documentation.tsx`** — Fixed multiple fictional claims:
  - "established in 1998 by a consortium" → "established in 2026"
  - "WARC 1.1 files accompanied by a JSON manifest" → actual JSON format description
  - "multiple independent archival nodes... three geographically distinct witness nodes"
    → actual SHA-256 hash verification process
- **`src/routes/__root.tsx`** — Changed "Established 1998" → "Founded 2026" in site-wide
  meta description
- **`src/routes/record.$id.tsx`** — Removed fictional "Evidence Chain" section:
  - Removed witness nodes (node-us-01, node-jp-02, node-br-01)
  - Removed "Signed By: archivist-key-2026-Q3"
  - Removed "Version History" section with hardcoded revision
  - Replaced with simplified "Verification" section with honest description

## Phase 4 — Automated QA

**Changes made:**

- **Installed** `@playwright/test` as dev dependency
- **Created** `playwright.config.ts` with dev server auto-start
- **Created** `tests/e2e/smoke.spec.ts` with 21 smoke tests covering:
  - Homepage load with today's snapshot
  - Browse page with record display and category filter
  - Search with prompt display and results
  - Snapshots index and detail pages
  - Record detail page
  - API documentation and playground
  - Health endpoint and snapshots API
  - OpenAPI spec accessibility
  - Compare page
  - About and Documentation pages
  - Navigation links in header
  - 404 page rendering
- **Added** `npm run test:e2e` script to `package.json`

## Phase 5 — Final Verification

- `npm test` — 127/127 passed (all tests)
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — succeeds (client, SSR, Nitro)

## Files Modified

- `src/lib/utils.ts` — Added `stripHtml()` utility
- `src/routes/__root.tsx` — Fixed 404/error styling, removed "Established 1998"
- `src/routes/about.tsx` — Honest messaging rewrite
- `src/routes/documentation.tsx` — Fixed false claims in Docs
- `src/routes/index.tsx` — Empty state for Recently Archived
- `src/routes/browse.tsx` — Empty state for no filter matches
- `src/routes/search.tsx` — Strip HTML from summaries
- `src/routes/record.$id.tsx` — Strip HTML, removed fictional Evidence Chain
- `playwright.config.ts` — New e2e test configuration
- `tests/e2e/smoke.spec.ts` — New Playwright smoke tests
- `package.json` — Added `test:e2e` script and `@playwright/test` dep
- `docs/ai/CONTEXT.md`, `HANDOFF.md`, `KNOWN_ISSUES.md`, `WORK_LOG.md` — Updated
- `src/routeTree.gen.ts` — Regenerated (includes /compare and /api/v1/diff)

**PR:** https://github.com/lacebx/the-public-record-archive/pull/41 (merged)

---

### Session: 2026-07-17 — Expansion, deduplication, logging, snapshot statistics

**Goal:** Expand to ~700+ records/day via 18 new feeds, implement URL deduplication, add per-feed diagnostic logging, persist generation statistics, and expose growth on the homepage.

**Milestone:** Milestone 3: Historical Search & Analysis

**Branch:** `feature/snapshot-diff`

**Changes made:**

**New feeds (18 sources added, 11 → 29 total):**

- **News:** France24, Euronews, CBC News, ABC News, Los Angeles Times
- **Technology:** The Verge, TechCrunch, Hacker News, Cloudflare Blog, Chromium Blog
- **Business:** CNBC, Bloomberg
- **Science:** NASA Breaking News, CERN
- **Security:** Krebs on Security, Cisco Talos, Google Project Zero
- **Government:** UK Government

**Pipeline improvements (`scripts/generate-snapshot.ts`):**

- Rewrote `main()` logging with per-feed breakdown: source name, item count, newest item age, fetch/parse duration, HTTP status
- Added summary totals: raw fetched, duplicates removed, after dedup, sources, countries, new records, carried over, removed, SHA-256 hash
- Implemented `deduplicateArticles()` — URL-based dedup preserving first occurrence, with log output
- Added `computeSnapshotStatistics()` — computes new/carried-over/removed records relative to previous snapshot

**Type system (`src/lib/data.ts`):**

- Added `SnapshotStatistics` type with full generation metadata
- Added optional `statistics` field to `Snapshot` type (backward compatible)
- Extended `SnapshotSummary` with optional `statistics` subset
- Updated `fetchSnapshotList()` to propagate statistics in summaries

**Homepage (`src/routes/index.tsx`):**

- Displays new records, carried-over, and duplicates-removed counts when statistics are available

**Tests (`scripts/__tests__/generate-snapshot.test.ts`):**

- 5 dedup tests: duplicate link removal, first occurrence preserved, empty array, no duplicates, title fallback
- 2 statistics tests: new/carried-over with previous snapshot, all new without previous

**Verification:**

- `npm test` — 134/134 passed (7 new + 127 existing)
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors

**Files modified:**

- `scripts/generate-snapshot.ts` — new feeds, logging, dedup, statistics
- `src/lib/data.ts` — SnapshotStatistics type, extended Snapshot/SnapshotSummary
- `src/routes/index.tsx` — statistics display
- `scripts/__tests__/generate-snapshot.test.ts` — dedup + statistics tests
- `docs/ai/CONTEXT.md`, `HANDOFF.md`, `KNOWN_ISSUES.md`, `WORK_LOG.md` — updated

---

### Session: 2026-07-17 — Milestone 2 closure, Milestone 3 completion, analytics dashboard

**Goal:** Close remaining open issues in Milestones 2 and 3, audit cross-milestone feature coverage, implement the snapshot analytics dashboard (Issue #16).

**Milestone alignment:**

- **Milestone 2 (100% now):** Closed Issue #11 (Server function-based REST endpoints) — implemented since PR #39, just needed GitHub issue closure.
- **Milestone 3 (100% now):** Implemented Issue #16 (Snapshot analytics dashboard) — new `/analytics` route, analytics computation module, CSS-based charts.
- **Milestone 5 (partial):** Noted 18 new feeds as progress on Issue #20 (Expand sources), kept open since AC not fully met.

**Branch:** `feature/snapshot-diff`

**Changes made:**

**Issue #11 closed:**

- REST API v1 endpoints were already implemented in PR #39 (7 endpoints at `/api/v1/*`). Issue marked as completed.

**Analytics dashboard (`src/routes/analytics.tsx`):**

- New `/analytics` page with overview cards (total snapshots, latest records, unique sources, days of data)
- Source health section (feeds succeeded/failed/total, success rate)
- Time-series table: records, sources, new records, carried over per snapshot date
- Publisher breakdown with CSS-based horizontal bar charts (count and percentage)
- Category distribution with same bar chart style
- Country coverage with bar chart
- Export link to `/api/v1/snapshots` for raw JSON data
- Empty states for all sections

**Analytics engine (`src/lib/analytics.ts`):**

- `computePublishers()` — publisher frequency from records
- `computeCategories()` — category frequency from records
- `computeCountries()` — country frequency from records
- `computeAnalytics()` — aggregates time-series from `fetchSnapshotList()`, breakdowns from bundled snapshot, source health from latest statistics

**Navigation & fixes:**

- Added `/analytics` link to site-shell NAV array
- Fixed `"est. 1998"` → `"founded 2026"` in site-shell header
- Fixed `"Established 1998 · Nonprofit Archival Trust"` → `"Founded 2026 · Independent Archival Project"` in footer
- Added `feedsFailed`, `feedsTotal` to `SnapshotSummary.statistics` type

**Verification:**

- `npm test` — 134/134 passed
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — succeeds

**Files created:**

- `src/lib/analytics.ts` — analytics computation module
- `src/routes/analytics.tsx` — analytics dashboard page

**Files modified:**

- `src/components/site-shell.tsx` — nav link, header/footer text
- `src/lib/data.ts` — added feedsFailed/feedsTotal to SnapshotSummary.statistics
- `docs/ai/CONTEXT.md`, `HANDOFF.md`, `KNOWN_ISSUES.md`, `WORK_LOG.md` — updated

---

### Session: 2026-07-17 — Milestone 4: Historical Intelligence (Issue #17)

**Goal:** Implement Related Record Engine, Story Timelines, Timeline Intelligence analytics.

**Milestone:** Milestone 4: Historical Intelligence (completed)

**Branch:** `feature/snapshot-diff`

**Changes made:**

**Related Record Engine (`src/lib/related.ts`):**

- Deterministic scoring (no AI/LLM): same publisher (+30), time proximity (+5-15), title similarity (Jaccard, 0-25), keyword overlap (0-20), same category (+10), same country (+5)
- `computeRelationship()` — pairwise scoring, explainable reasons, type determination
- `findRelated()` — sorted results with configurable threshold/limit
- `precomputeFeatures()` — memoized word extraction for O(n²) performance

**Story Timeline Engine (`src/lib/timelines.ts`):**

- `buildTimelines()` — graph-based clustering (connected components, threshold ≥ 40)
- `computeTimelineFromCluster()` — auto-title from frequent words, chronological sort
- Cached accessors: `getTimelines()`, `getTimeline()`, `getLargestTimelines()`, etc.
- `getTimelineStats()` — largest stories, active publishers, longest-running, newest

**Related Records UI (`src/routes/record.$id.tsx`):**

- "Related Records" section with table and expandable reason details
- Disambiguation label distinguishing archived facts from inferred relationships
- Empty state for no related records

**Timeline Routes (`/timelines`, `/timelines/$id`):**

- Browse page with sort: newest / largest / oldest
- Detail page with chronological sequence, metadata, relationship types, disambiguation note

**Analytics Extension:**

- Timeline Intelligence section on `/analytics`: overview cards, largest stories, active publishers, longest-running, newest timelines

**Tests (44 new):**

- `scripts/__tests__/related.test.ts` — 28 tests: word extraction, similarity, scoring, type determination, findRelated edge cases
- `scripts/__tests__/timelines.test.ts` — 16 tests: title generation, cluster computation, buildTimelines, false-positive prevention, accessors

**Verification:**

- `npm test` — 187/187 passed (9 test files)
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm run build` — succeeds

**Files created:**

- `src/lib/related.ts`, `src/lib/timelines.ts`
- `src/routes/timelines.index.tsx`, `src/routes/timelines.$id.tsx`
- `scripts/__tests__/related.test.ts`, `scripts/__tests__/timelines.test.ts`

**Files modified:**

- `src/routes/record.$id.tsx` — Related Records section
- `src/components/site-shell.tsx` — Added /timelines nav link
- `src/lib/analytics.ts`, `src/routes/analytics.tsx` — Timeline intelligence
- `src/routeTree.gen.ts` — Auto-generated
- `docs/ai/*` — Updated

**PR:** _(to be opened)_

---

### Session: 2026-07-17 — North-star audit and architectural roadmap

**Goal:** Establish the project's north star ("evidence infrastructure for history"), audit every route, lib file, and spec against it, and produce a ranked remediation roadmap for Version 1.0.

**Milestone:** N/A (architectural foundation)

**Branch:** `feature/snapshot-diff`

**North star established:**

- Sentence: "The Public Internet Record is not a news site. It is evidence infrastructure for history."
- 10 guiding principles: preserve faithfully, never invent, never editorialize, never predict, never rank importance, make verification easier than belief, every page must increase trust, simplicity beats feature count, every feature must answer "does this help verify history?", remove it if not.
- All new feature development is **STOPPED**. Every decision must answer: "Does this help someone verify history?"

**Audit performed:**

- **15 routes audited** — P0 fixes needed in: `/api` (fabricated example values), `/analytics` (editorial rankings), OpenAPI spec (fabricated data), bundled snapshot data (committed to git), `/browse` (inaccurate claim), record pages (integrity caveats), `/compare` (feed rotation confusion), API playground (low archival value for researchers)
- **14 lib files audited** — P0: snapshot-data.ts is auto-generated and committed. P1: R2 persistence reliability, archive.ts uses current timestamp, scalable search, individual record checksums.
- **OpenAPI spec audited** — Fabricated example values (942 records, Reuters publisher, OpenAI title) — P0.
- **Styles audited** — No changes needed (IBM Plex Mono, archival aesthetic is correct).

**Ranked roadmap (P0/P1/P2) produced:**

- P0 (integrity-threatening): Remove fabricated example values from API docs + OpenAPI, remove analytic rankings, stop bundling snapshot data in git, fix inaccurate browse page claims, add caveats to integrity claims.
- P1 (archival reliability): R2 persistence reliability, archive generation timestamps, multi-day history without R2, "new records" misleading stat, individual record checksums, scalable search, pagination.
- P2 (polish): Timeline auto-naming quality, OpenAPI diff endpoint docs, conditional HTTP feed requests, timeline computation performance.

**Key files created/updated:**

- `docs/ai/NORTH_STAR.md` — Full north star document with principles, audit findings, remediation roadmap.
- `docs/ai/DECISIONS.md` — Added ADR-013 (north star), ADR-014 (no AI), ADR-015 (no feature development until cleanup done).

**Verification:**

- (No code changes — this was an audit/documentation session)

**Branch:** `feature/snapshot-diff`

**Remaining work:**

- Begin P0 remediation: fix fabricated data in API docs, OpenAPI spec, analytics rankings, git-bundled snapshots, inaccurate browse page claims.
- Then P1, then P2.
- No new features until audit findings are addressed.

---

### Session: 2026-07-18 — ADR-016, five-layer roadmap, new issues, GitHub housekeeping

**Goal:** Permanently document the project's V1.0 product philosophy, reorganize all remaining work into five engineering layers, and create missing issues.

**Milestone:** N/A (architectural foundation)

**Branch:** `fix/north-star-p0`

**Changes made:**

**ADR-016 (Product Direction):**
- Replaces ADR-013/014/015 with a definitive V1.0 product philosophy
- Five-layer engineering model: Foundation → Research → Expansion → Preservation → Launch
- Five gates for accepting features: North Star, Integrity, Simplicity, Dependency, Removal
- Explicit non-goals: no AI, no ranking, no recommendations, no personalization, no editorial voice
- Documented in `docs/ai/DECISIONS.md`

**Roadmap (`docs/ai/ROADMAP.md`):**
- Full issue-by-issue roadmap across all five layers
- Dependency graph showing implementation order
- Version 1.0 definition and completion criteria
- Cancelled work, duplicated work, and new issues listed

**GitHub new issues created (19 total):**
- Layer 1: #44 (unbundle snapshot), #45 (R2 reliability), #46 (per-record checksums), #47 (archive timestamp), #48 (conditional HTTP), #49 (search index), #50 (pagination), #51 (cron notification)
- Layer 2: #52 (cross-snapshot timelines), #53 (date-range browse), #54 (timeline naming), #55 (timeline performance)
- Layer 4: #56 (OpenTimestamps), #57 (WARC export), #58 (IPFS pinning), #59 (mirror/backup)
- Layer 5: #60 (monitoring), #61 (accessibility), #62 (contributor guide)

**GitHub housekeeping:**
- Opened PR #43 (P0 remediation)
- Created `layer-1` through `layer-5` labels
- All 19 new issues assigned to Milestone 8 (Version 1.0 Launch)

**Files created:**
- `docs/ai/ROADMAP.md` — Full five-layer roadmap

**Files modified:**
- `docs/ai/DECISIONS.md` — Added ADR-016, marked ADR-015 as superseded
- `docs/ai/HANDOFF.md` — Updated with V1.0 product direction and layer model
- `docs/ai/CONTEXT.md` — Updated with current state
- `docs/ai/WORK_LOG.md` — This entry

**Verification:**
- (No code changes — documentation + GitHub administration)

**Remaining work:**
- PR #43 is open for P0 fixes (review and merge)
- Begin Layer 1 implementation: #44 (unbundle snapshot), #45 (R2 reliability), #47 (archive timestamp)
- Then remaining Layer 1 issues
- Then Layer 2, 3, 4, 5 in order
