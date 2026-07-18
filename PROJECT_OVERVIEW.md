# The Public Internet Record — Project Overview

> The Public Internet Record is not a news site. It is evidence infrastructure
> for history.

---

## Current Status

The project is at **public alpha** stage. A functional web application exists
with **20 routes**, SSR rendering, and Cloudflare Workers deployment.

**What exists:**

- Snapshot generation from **29 RSS feeds** (~700+ records/day expected)
- URL deduplication at ingestion (preserves first occurrence)
- Per-feed diagnostic logging with source, item count, age, fetch/parse duration
- SnapshotStatistics metadata persisted with each snapshot
- Homepage displays generation statistics (new records, carried over, duplicates)
- Historical snapshot storage and retrieval via Cloudflare R2
- REST API v1 with 7 endpoints at `/api/v1/*`
- Developer portal at `/api` + interactive Scalar playground
- Diff engine for comparing any two snapshots (added/removed/modified/unchanged)
- Client-side verification, download, and archive export
- Snapshot analytics dashboard at `/analytics`
- Related Record Engine and Story Timelines (deterministic, no AI)
- No database, no auth, no server-side state
- Unit testing: Vitest with **187 tests**
- E2E testing: Playwright with 21 smoke tests
- CI/CD: GitHub Actions (PR checks, deploy, scheduled snapshots + artifacts)

**What is NOT yet built or needs remediation:**

- External cryptographic timestamping (OpenTimestamps)
- Real evidence chain for records (current claims need caveats)
- Cross-snapshot timeline tracking (currently single-snapshot only)
- Scalable server-side search (currently client-side only)
- Individual record checksums
- Pagination for large responses
- Expanded source coverage (29/50 sources)

**North star:** The north-star audit identified P0/P1/P2 issues that must be
remediated before any new feature development. See `docs/ai/NORTH_STAR.md`.

---

## Overall Roadmap

The roadmap to Version 1.0 is organized into 8 milestones, each representing a
meaningful product capability. Milestones build on each other but contain
parallel workstreams where possible.

```
MVP ──► Milestone 1 ──► Milestone 2 ──► Milestone 3 ──► Milestone 4
         Persistent      Public REST     Historical      Verified
         Archive         API             Search          Integrity

         Milestone 5 ──► Milestone 6 ──► Milestone 7 ──► Milestone 8
         Expanded        Change          AI-Assisted     Version 1.0
         Coverage        Intelligence    Exploration     Launch
```

### Dependency Graph

```
M1: Persistent Archive
 ├── M2: Public REST API (depends on M1)
 ├── M3: Historical Search (depends on M1)
 │    ├── M6: Change Intelligence (depends on M3)
 │    └── M7: AI Exploration (depends on M3)
 └── M4: Verified Integrity (depends on M1)
      └── M5: Expanded Coverage (parallel to M2-M4)
M8: Version 1.0 Launch (depends on all prior)
```

---

## Milestones

### Milestone 1: Persistent Archive

_Target: September 2026 — Priority: Critical_

The platform transitions from showing only today's snapshot to a true
historical archive. Users can browse, download, and verify any daily snapshot.

| Issue | Title                                         | Complexity |
| ----- | --------------------------------------------- | ---------- |
| #4    | Persist snapshot JSON to cloud object storage | M          |
| #5    | Historical snapshot listing                   | M          |
| #6    | Serve historical snapshots on demand          | L          |
| #7    | Automated daily snapshot generation via cron  | L          |
| #8    | Downloadable snapshot archive (bulk export)   | M          |
| #9    | Testing infrastructure setup                  | L          |
| #10   | CI/CD pipeline (GitHub Actions)               | M          |

**Parallel work**: Issues #9 and #10 (testing + CI) can begin immediately
without blocking other issues in this milestone.

**Blocker for**: All subsequent milestones.

---

### Milestone 2: Public REST API

_Target: October 2026 — Priority: High_

A read-only public REST API is implemented and documented. External applications
can query the archive programmatically.

| Issue | Title                                | Complexity |
| ----- | ------------------------------------ | ---------- |
| #11   | Server function-based REST endpoints | XL         |
| #12   | API rate limiting & abuse protection | L          |
| #13   | API documentation & developer portal | M          |

**Depends on**: Milestone 1 (snapshot storage must exist).
**Blocker for**: External integrations, partner projects.

---

### Milestone 3: Historical Search & Analysis

_Target: November 2026 — Priority: High_

Search across all historical snapshots, compare what changed between dates,
track how records evolve over time, and surface analytics.

| Issue | Title                                   | Complexity |
| ----- | --------------------------------------- | ---------- |
| #14   | Server-side search across all snapshots | XL         |
| #15   | Snapshot diff & change tracking         | XL         |
| #16   | Snapshot analytics dashboard            | L          |

**Depends on**: Milestone 1 (historical data must be accessible).

---

### Milestone 4: Verified Integrity

_Target: January 2027 — Priority: High_

Every snapshot is cryptographically anchored to an external trusted timestamp.
Record evidence chains display real provenance data.

| Issue | Title                                                | Complexity |
| ----- | ---------------------------------------------------- | ---------- |
| #17   | External cryptographic timestamping (OpenTimestamps) | XL         |
| #18   | Real evidence chain for records                      | L          |
| #19   | Integrity badge & web seal embed                     | S          |

**Depends on**: Milestone 1 (snapshots must be durable).

---

### Milestone 5: Expanded Coverage

_Target: March 2027 — Priority: Medium_

The platform ingests from a broader set of sources across more countries and
languages.

| Issue | Title                            | Complexity |
| ----- | -------------------------------- | ---------- |
| #20   | Expand RSS/Atom feed sources     | XL         |
| #21   | Web crawling for non-RSS sources | XL         |
| #22   | Multilingual support             | L          |

**Depends on**: Milestone 1 (storage infrastructure).
**Parallel work**: Issues #20, #21, #22 can proceed in parallel.

---

### Milestone 6: Change Intelligence

_Target: May 2027 — Priority: Medium_

Automatically detect, cluster, and surface meaningful changes across snapshots.

| Issue | Title                              | Complexity |
| ----- | ---------------------------------- | ---------- |
| #23   | Event clustering across publishers | XL         |
| #24   | Trend detection and topic tracking | XL         |
| #25   | Version history for tracked URLs   | L          |

**Depends on**: Milestone 3 (cross-snapshot search).

---

### Milestone 7: AI-Assisted Exploration

_Target: July 2027 — Priority: Medium_

Natural language queries, semantic search, and automated analysis of the
historical record.

| Issue | Title                            | Complexity |
| ----- | -------------------------------- | ---------- |
| #26   | Semantic search via embeddings   | XL         |
| #27   | Natural language query interface | XL         |
| #28   | Automated snapshot summaries     | M          |

**Depends on**: Milestone 3 (search infrastructure).

---

### Milestone 8: Version 1.0 Launch

_Target: September 2027 — Priority: Critical_

Production hardening, comprehensive documentation, legal review, and public
launch.

| Issue | Title                                   | Complexity |
| ----- | --------------------------------------- | ---------- |
| #29   | Production environment hardening        | L          |
| #30   | Comprehensive documentation suite       | L          |
| #31   | Legal review & governance documentation | S          |
| #32   | Performance optimization & audit        | L          |
| #33   | Public launch announcement & press kit  | M          |

**Depends on**: All prior milestones.

---

## Current Priority: North-Star Remediation

**Feature development is STOPPED.** Milestones 1-4 are complete. Milestones 5-8
are on hold.

The north-star audit revealed integrity-threatening issues. The immediate
priority is remediation, ranked by severity:

### P0 — Integrity-threatening (do first)

1. Remove fabricated example values from OpenAPI spec and API docs
2. Remove editorial rankings from analytics (largest, most active, newest)
3. Stop bundling snapshot data in git — fetch from R2 at build time
4. Fix inaccurate claims on browse page ("reverse chronological order")
5. Add caveats to integrity claims on record pages

### P1 — Archival reliability (do second)

6. Fix R2 persistence silent failure catch
7. Fix archive generation timestamp (uses current time, not snapshot time)
8. Multi-day history without R2 (cross-date lookup)
9. Fix misleading "new records" statistic
10. Individual record checksums
11. Scalable search with server-side filtering
12. Pagination for large responses

### P2 — Polish (do third)

13. Timeline auto-naming quality improvements
14. OpenAPI diff endpoint docs
15. Conditional HTTP feed requests
16. Timeline computation performance improvements

**Before any PR:**

- `npm test` (187 tests)
- `npm run lint` (0 errors)
- `npm run typecheck` (0 errors)
- `npm run build` (succeeds)

---

## Project Structure

```
├── AGENTS.md              # AI coding agent instructions
├── PROJECT_OVERVIEW.md    # This file
├── scripts/
│   └── generate-snapshot.ts   # RSS fetcher + snapshot builder
├── src/
│   ├── routes/            # 9 TanStack Start route files
│   ├── lib/
│   │   ├── data.ts        # Type definitions + server functions
│   │   ├── snapshot-data.ts # Auto-generated bundled data
│   │   └── records.ts     # Re-exports
│   ├── components/
│   │   └── site-shell.tsx # Layout wrapper
│   ├── styles.css         # Tailwind v4 + custom CSS
│   ├── router.tsx         # TanStack Router setup
│   ├── start.ts           # TanStack Start entry
│   └── server.ts          # SSR server with error recovery
├── data/                  # Generated snapshot JSON files
├── package.json           # Scripts, dependencies
├── vite.config.ts         # Build configuration
└── tsconfig.json          # TypeScript configuration
```

---

## Key Metrics

| Metric              | Current         | V1.0 Target    |
| ------------------- | --------------- | -------------- |
| Sources             | 11              | 50+            |
| Countries           | 5               | 20+            |
| Languages           | 2 (en, de, fr)  | 10+            |
| Snapshots available | 1 (latest only) | All historical |
| Routes              | 9               | 15+            |
| Tests               | 0               | 200+           |
| API endpoints       | 0               | 5+             |
| CI/CD               | None            | Full pipeline  |
| Documentation       | Minimal         | Comprehensive  |
