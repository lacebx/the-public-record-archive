# The Public Internet Record — Project Overview

> A platform for preserving the public record by creating immutable daily
> snapshots of publicly available information.

---

## Current Status

The project is in **early MVP** stage. A functional web application exists with:

- **8 pages** (home, browse, search, snapshots list, snapshot detail, record
  detail, about, documentation, API docs)
- **Snapshot generation** from 11 RSS feeds across 5 countries
- **Client-side verification** of snapshot integrity (SHA-256 via Web Crypto)
- **Client-side download** of snapshot JSON
- **Category and keyword search** over the latest snapshot
- **Cloudflare Workers deployment** via Nitro

### What is NOT yet built

- Historical snapshot storage and retrieval (only latest snapshot available)
- Public REST API (documentation exists, no implementation)
- Server-side search (client-side only, does not scale)
- Cross-snapshot comparison and change tracking
- External cryptographic timestamping
- Real evidence chain for records
- Expanded source coverage (11 sources is too few)
- AI-assisted exploration
- Tests, CI/CD pipeline

**Approximate progress toward Version 1.0: ~10%**

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

## Current Milestone

**Milestone 1: Persistent Archive** is the active milestone.

The immediate priority is making the archive durable and accessible across
time — without this, every subsequent capability is impossible.

### Recommended Next Tasks (in order)

1. **Issue #4** — Set up Cloudflare R2 bucket and modify the snapshot generator
   to upload JSON files. This is the foundation for everything else.
2. **Issue #10** — Set up CI/CD so every PR is tested and deployed
   automatically. This reduces friction for all future work.
3. **Issue #9** — Install Vitest and write the first tests. The project has
   zero tests and needs quality infrastructure.
4. **Issue #6** — Once R2 is working, implement `getSnapshotByDate()` to fetch
   from R2, enabling historical snapshot views.
5. **Issue #5** — Update the snapshots listing page to show all available dates
   instead of just the latest.

### Parallel workstreams

The following issues in Milestone 1 have no dependencies and can be picked up
at any time:

- #9 (Testing infrastructure) — can begin immediately
- #10 (CI/CD pipeline) — can begin immediately, needs only GitHub repo access

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
