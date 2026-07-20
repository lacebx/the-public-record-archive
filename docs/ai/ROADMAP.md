# Version 1.0 Roadmap

> Roadmap for The Public Internet Record — organized by engineering layer.
>
> See ADR-016 for the product direction that defines this roadmap.

---

## Layer 1 — Archive Foundation

**Status:** Partial (~60% complete)
**Blocking:** All subsequent layers

### Completed

| Area                  | Status | Notes                                                     |
| --------------------- | ------ | --------------------------------------------------------- |
| Ingestion pipeline    | ✓      | 29 RSS feeds, dedup, per-feed logging, statistics         |
| Snapshot storage      | ✓      | R2 + local + bundled fallback                             |
| Snapshot format       | ✓      | Snapshot, SnapshotSummary, SnapshotStatistics types       |
| REST API v1           | ✓      | 7 endpoints, OpenAPI 3.1 spec, developer portal           |
| Diff engine           | ✓      | Cross-snapshot added/removed/modified/unchanged           |
| Related records       | ✓      | Deterministic scoring (publisher, time, Jaccard, keyword) |
| Story timelines       | ✓      | Graph-based clustering, auto-naming                       |
| Analytics             | ✓      | Neutral data: publisher, category, country, time-series   |
| Snapshot verification | ✓      | SHA-256 hash, download, archive export                    |
| CI/CD                 | ✓      | PR checks, deploy, daily scheduled snapshots              |
| Testing               | ✓      | 187 unit tests, 21 e2e                                    |
| P0 audit fixes        | ✓      | Browse claim, analytics rankings, OpenAPI examples        |
| North star docs       | ✓      | ADR-013, ADR-014, ADR-016, ROADMAP.md                     |

### Remaining

| #   | Title                                                        | Est. | Deps                          | Priority |
| --- | ------------------------------------------------------------ | ---- | ----------------------------- | -------- |
| 44  | Remove snapshot data from git, fetch from R2 at build time   | L    | None                          | Critical |
| 45  | R2 persistence reliability — retry and alert on save failure | M    | None                          | Critical |
| 46  | Individual record checksums — per-record SHA-256             | M    | Snapshot format stable        | High     |
| 47  | Fix archive generation timestamp — use snapshot timestamp    | S    | None                          | High     |
| 48  | Conditional HTTP requests for feed fetching                  | S    | None                          | Medium   |
| 49  | Server-side search index                                     | XL   | Record checksums              | High     |
| 50  | Pagination for all list endpoints                            | M    | API stable                    | High     |
| 51  | Cron snapshot failure notification                           | M    | Workflow stable               | High     |
| 18  | Real evidence chain for records                              | XL   | Record checksums, R2 reliable | High     |
| 19  | Integrity badge & web seal embed                             | S    | Evidence chain                | Low      |
| —   | OpenAPI diff endpoint docs                                   | S    | Diff engine ✓                 | Medium   |

---

## Layer 2 — Historical Research

**Status:** Not started (blocked by Layer 1)
**Blocking:** Layer 3

| #   | Title                                  | Est. | Deps                              | Priority |
| --- | -------------------------------------- | ---- | --------------------------------- | -------- |
| 52  | Cross-snapshot timeline tracking       | XL   | R2 reliable, scalable search      | High     |
| 53  | Historical date-range browse           | M    | Pagination, scalable search       | Medium   |
| 54  | Timeline auto-naming quality           | M    | Timelines ✓                       | Medium   |
| 55  | Timeline computation performance O(n²) | L    | Timelines ✓                       | Medium   |
| 25  | Version history for tracked URLs       | L    | Diff engine ✓, record checksums   | Medium   |
| 23  | Event clustering across publishers     | XL   | Cross-snapshot timelines          | Medium   |
| 24  | Trend detection and topic tracking     | XL   | Event clustering, version history | Medium   |

---

## Layer 3 — Archive Expansion

**Status:** Partial (29/50 sources, 6/20 countries)
**Blocked by:** Layer 1 (storage), parallel to Layer 2

| #   | Title                            | Est. | Deps         | Priority |
| --- | -------------------------------- | ---- | ------------ | -------- |
| 20  | Expand RSS/Atom feed sources     | L    | Storage ✓    | High     |
| 21  | Web crawling for non-RSS sources | XL   | Expand feeds | High     |
| 22  | Multilingual support             | L    | Storage ✓    | Medium   |

---

## Layer 4 — Preservation

**Status:** Not started
**Blocked by:** Layer 1

| #   | Title                                          | Est. | Deps                                | Priority |
| --- | ---------------------------------------------- | ---- | ----------------------------------- | -------- |
| 56  | OpenTimestamps cryptographic anchoring         | XL   | Snapshot format stable, R2 reliable | High     |
| 57  | WARC export for Internet Archive compatibility | M    | Archive module ✓                    | Medium   |
| 58  | IPFS pinning for decentralized preservation    | M    | Snapshot format stable              | Medium   |
| 59  | Mirror storage and backup strategy             | M    | R2 reliable                         | Medium   |
| —   | Disaster recovery documentation                | S    | Mirror strategy                     | Medium   |

---

## Layer 5 — Public Launch

**Status:** Not started
**Blocked by:** Layers 1-4

| #   | Title                                   | Est. | Deps                   | Priority |
| --- | --------------------------------------- | ---- | ---------------------- | -------- |
| 60  | Monitoring and error tracking           | M    | Deploy ✓               | High     |
| 29  | Production environment hardening        | L    | All layers stable      | High     |
| 30  | Comprehensive documentation suite       | L    | API stable             | High     |
| 61  | Accessibility audit — WCAG compliance   | M    | UI stable              | Medium   |
| 32  | Performance optimization and audit      | L    | All layers stable      | Medium   |
| 31  | Legal review & governance documentation | S    | None (can start early) | High     |
| 62  | Contributor guide — CONTRIBUTING.md     | S    | Documentation ✓        | Medium   |
| 33  | Public launch announcement & press kit  | S    | Everything             | Low      |

---

## Dependency Graph

```
Layer 1 (Foundation)
├── #44 — unbundle snapshot data ────────── no deps
├── #45 — R2 persistence reliability ────── no deps
├── #47 — archive timestamp fix ─────────── no deps
├── #48 — conditional HTTP feeds ────────── no deps
├── #46 — per-record checksums ──────────── snapshot format stable
├── #49 — server-side search ────────────── record checksums
├── #50 — pagination ────────────────────── API stable
├── #51 — cron failure notification ─────── workflow ✓
├── openapi diff docs ───────────────────── diff engine ✓
├── #18 — evidence chain ────────────────── #46, #45
└── #19 — integrity badge ───────────────── #18

Layer 2 (Historical Research) ────── depends on Layer 1 ✓
├── #25 — version history ────────────────── diff engine ✓, #46
├── #52 — cross-snapshot timelines ───────── #45, #49
├── #54 — timeline naming ───────────────── timelines ✓
├── #55 — timeline performance ───────────── timelines ✓
├── #53 — date-range browse ──────────────── #50, #49
├── #23 — event clustering ───────────────── #52
└── #24 — trend detection ────────────────── #23, #25

Layer 3 (Archive Expansion) ──────── depends on Layer 1, parallel Layer 2
├── #20 — expand feeds ───────────────────── storage ✓
├── #21 — web crawling ───────────────────── #20
└── #22 — multilingual ───────────────────── storage ✓

Layer 4 (Preservation) ───────────── depends on Layer 1
├── #56 — OpenTimestamps ─────────────────── snapshot format stable, #45
├── #57 — WARC export ────────────────────── archive ✓
├── #58 — IPFS pinning ────────────────────── snapshot format stable
├── #59 — mirror/backup ──────────────────── #45
└── disaster recovery ────────────────────── #59

Layer 5 (Public Launch) ──────────── depends on Layers 1-4
├── #60 — monitoring ─────────────────────── deploy ✓
├── #31 — legal review ───────────────────── no deps (early)
├── #62 — contributor guide ──────────────── #30
├── #61 — accessibility ──────────────────── UI stable
├── #29 — hardening ──────────────────────── all layers
├── #30 — documentation ──────────────────── API stable
├── #32 — performance audit ──────────────── all layers
└── #33 — launch ─────────────────────────── everything
```

---

## Version 1.0 Definition

Version 1.0 is achieved when:

1. **Layer 1 is complete and stable.** All foundation issues resolved.
2. **At least 80% of Layer 2 is complete.** Historical research features are functional.
3. **Layer 3 is at 50+ sources.** Sufficient coverage for broad usefulness.
4. **Layer 4 has OpenTimestamps implemented.** External verifiability is the defining feature.
5. **Layer 5 is complete.** Documentation, legal, monitoring, hardening done.

The five-layer model replaces the old Milestone 1-8 structure. Milestones 1-4
are recognized as completed Layer 1 work. Milestones 5-8 are subsumed into
Layers 2-5.

---

## Cancelled Work

The following issues from the old roadmap are cancelled and their milestones
closed:

| #   | Title                            | Reason          |
| --- | -------------------------------- | --------------- |
| 26  | Semantic search via embeddings   | ADR-016 (no AI) |
| 27  | Natural language query interface | ADR-016 (no AI) |
| 28  | Automated snapshot summaries     | ADR-016 (no AI) |

---

## New Issues Created

| #   | Title                                                        | Layer |
| --- | ------------------------------------------------------------ | ----- |
| 44  | Remove snapshot data from git, fetch from R2 at build time   | 1     |
| 45  | R2 persistence reliability — retry and alert on save failure | 1     |
| 46  | Individual record checksums — per-record SHA-256             | 1     |
| 47  | Fix archive generation timestamp — use snapshot timestamp    | 1     |
| 48  | Conditional HTTP requests for feed fetching                  | 1     |
| 49  | Server-side search index for scalable full-text search       | 1     |
| 50  | Pagination for all list endpoints                            | 1     |
| 51  | Cron snapshot failure notification                           | 1     |
| 52  | Cross-snapshot timeline tracking                             | 2     |
| 53  | Historical date-range browse                                 | 2     |
| 54  | Timeline auto-naming quality improvement                     | 2     |
| 55  | Timeline computation performance O(n²)                       | 2     |
| 56  | OpenTimestamps cryptographic anchoring                       | 4     |
| 57  | WARC export for Internet Archive compatibility               | 4     |
| 58  | IPFS pinning for decentralized preservation                  | 4     |
| 59  | Mirror storage and backup strategy                           | 4     |
| 60  | Monitoring and error tracking                                | 5     |
| 61  | Accessibility audit — WCAG compliance                        | 5     |
| 62  | Contributor guide — CONTRIBUTING.md                          | 5     |

---

## Quick References

| Current Layer                 | Status        | Open Issues |
| ----------------------------- | ------------- | ----------- |
| Layer 1 — Archive Foundation  | ~60% complete | 12          |
| Layer 2 — Historical Research | Not started   | 7           |
| Layer 3 — Archive Expansion   | Partial       | 3           |
| Layer 4 — Preservation        | Not started   | 4           |
| Layer 5 — Public Launch       | Not started   | 8           |

**Total open issues across all layers:** 34
**Target for Version 1.0:** All layers stable, all issues resolved.
