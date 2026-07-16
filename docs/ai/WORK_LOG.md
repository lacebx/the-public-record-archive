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

**PR:** (to be opened, closes #9)
