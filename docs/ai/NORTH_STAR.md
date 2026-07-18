# North Star

> The Public Internet Record is not a news site. It is **evidence infrastructure
> for history**.

---

## The Sentence

Every feature, every page, every line of code must answer one question:

**"Does this help someone verify history?"**

If the answer is no, remove it.

---

## Guiding Principles

1.  **Preserve faithfully.** Do not alter, filter, or editorialize the source
    data. Ingestion must be a pure mirror.
2.  **Never invent.** No fabricated examples, no mock data that looks real, no
    fictional claims. Every number and label must trace to an actual computation.
3.  **Never editorialize.** Do not rank records by importance, highlight "top
    stories," or suggest what a reader should pay attention to. The archive
    presents; the user decides.
4.  **Never predict.** No trend lines, no forecasts, no "most likely to change."
    Show what happened, not what might happen.
5.  **Never rank importance.** Publishing frequency, source size, and keyword
    matches are neutral data points. "Largest," "most active," and "newest" are
    editorial judgments. Frame them as facts, not recommendations.
6.  **Make verification easier than belief.** Every page should make it obvious
    how to verify a claim. The integrity mechanism should require zero trust.
7.  **Every page must increase trust.** If a page makes the archive less
    trustworthy (fabricated data, misleading claims, confusing UI), fix or
    remove it.
8.  **Simplicity beats feature count.** A simple, trustworthy archive is better
    than a complex, questionable one. Resist feature creep.
9.  **Every feature must answer the north star question.** Ask "does this help
    someone verify history?" before building. If the answer is "sort of" or "not
    really," don't build it.
10. **Remove it if not.** Existing features that fail the north star test must
    be fixed or removed before new features can be added.

---

## Audit Summary

### Routes

| Route              | Status             | Issues                                                                         |
| ------------------ | ------------------ | ------------------------------------------------------------------------------ |
| `/` (index)        | PASS               | —                                                                              |
| `/browse`          | **P0**             | Claims "reverse chronological order" — not guaranteed for historical snapshots |
| `/search`          | PASS (with caveat) | No server-side search; client-side only, doesn't scale                         |
| `/snapshots`       | PASS               | —                                                                              |
| `/snapshots/:date` | PASS               | —                                                                              |
| `/record/:id`      | **P0**             | Integrity claims need caveats; no individual record checksum                   |
| `/compare`         | **P1**             | "Removed" implies deletion; actually feed rotation. No caveat.                 |
| `/analytics`       | **P0**             | Editorial rankings (largest, most active, newest)                              |
| `/api` (portal)    | **P0**             | Fabricated example values (1,592 records, 45 sources)                          |
| `/api/playground`  | **P2**             | Low archival value for researchers; heavy client-side bundle                   |
| `/api/v1/*`        | PASS (with caveat) | Endpoints work; fabricated example in OpenAPI spec                             |
| `/timelines`       | PASS (with caveat) | Auto-naming quality; single-snapshot only                                      |
| `/timelines/:id`   | PASS (with caveat) | Same as above                                                                  |
| `/about`           | PASS               | Already cleaned up in PR #41                                                   |
| `/documentation`   | PASS               | Already cleaned up in PR #41                                                   |

### Lib Files

| File                       | Status             | Issues                                           |
| -------------------------- | ------------------ | ------------------------------------------------ |
| `src/lib/data.ts`          | PASS               | —                                                |
| `src/lib/api.ts`           | PASS               | —                                                |
| `src/lib/storage.ts`       | **P1**             | R2 save errors are silently logged, not surfaced |
| `src/lib/archive.ts`       | **P1**             | Uses `new Date()` instead of snapshot timestamp  |
| `src/lib/analytics.ts`     | **P0**             | Computes rankings used by editorial UI           |
| `src/lib/related.ts`       | PASS               | Deterministic, explainable, no AI                |
| `src/lib/timelines.ts`     | PASS (with caveat) | O(n²), single-snapshot, auto-naming quality      |
| `src/lib/diff.ts`          | PASS               | —                                                |
| `src/lib/utils.ts`         | PASS               | —                                                |
| `src/lib/snapshot-data.ts` | **P0**             | Auto-generated data committed to git             |
| `src/lib/records.ts`       | PASS               | —                                                |
| `src/lib/verification.ts`  | PASS (with caveat) | No individual record verification                |
| `src/lib/crypto.ts`        | PASS               | —                                                |

### Specs & Config

| File                   | Status | Issues                                                   |
| ---------------------- | ------ | -------------------------------------------------------- |
| `public/openapi.json`  | **P0** | Fabricated example values (942 records, Reuters, OpenAI) |
| `playwright.config.ts` | PASS   | —                                                        |
| `vitest.config.ts`     | PASS   | —                                                        |
| `package.json`         | PASS   | —                                                        |

### Styles

| File             | Status | Issues                                     |
| ---------------- | ------ | ------------------------------------------ |
| `src/styles.css` | PASS   | IBM Plex Mono, archival aesthetic, correct |
| `src/app.css`    | PASS   | —                                          |

---

## Remediation Roadmap

### P0 — Integrity-threatening (must fix before anything else)

1. **Remove fabricated example values from `public/openapi.json`**
   - Replace 942-record example with a real truncated snapshot or mark as "illustrative only"
   - Remove "Reuters" as a publisher (not ingested)
   - Remove fictional "OpenAI announces GPT-5" article title
2. **Remove fabricated example from `/api` portal**
   - Replace 1,592 records / 45 sources example with real data or disclaimer
3. **Remove fictional stats from health endpoint**
   - 142 snapshots / 94,252 records is fabricated
4. **Remove editorial rankings from `/analytics`**
   - "Largest Stories" ranks timelines by size (editorial)
   - "Most Active Publishers" ranks publishers (editorial)
   - "Newest Timelines" implies timeliness = importance (editorial)
   - Reframe as neutral data or remove
5. **Stop bundling snapshot data in git**
   - `src/lib/snapshot-data.ts` is auto-generated, updated each snapshot
   - Makes snapshot authorship non-verifiable (passes through git)
   - Fix: generate at build time from R2, or use git submodule, or R2-only
6. **Fix browse page "reverse chronological" claim**
   - `src/routes/browse.tsx` says "reverse chronological order"
   - Only true for the latest snapshot; not guaranteed historically
   - Fix: rephrase as "recently archived records" or remove the claim
7. **Add caveats to integrity claims on record pages**
   - "Integrity Certificate" implies more than it proves
   - The hash proves the record was in the snapshot bundle, not that the
     source published this content on this date
   - Add explanatory text about what the hash actually proves

### P1 — Archival reliability (fix after P0)

8. **Fix R2 persistence silent failure**
   - `save()` wraps S3 calls in try-catch that only logs
   - A silent R2 outage means snapshots are not persisted
   - Fix: surface errors to monitoring, retry logic
9. **Fix archive generation timestamp**
   - `src/lib/archive.ts` uses `new Date().toISOString()` as creation time
   - Should use the snapshot's actual `generated` timestamp
10. **Multi-day history without R2**
    - If R2 is unreachable and no local cache, only latest snapshot available
    - Fix: fall back to bundled historical snapshots or archive artifacts
11. **Fix "new records" statistic**
    - Uses previous snapshot as baseline; with single bundled snapshot,
      comparison is tautological (all records are "new")
    - Fix: only show cross-snapshot comparison when multiple dates exist
12. **Individual record checksums**
    - Snapshot-level verification exists; per-record verification does not
    - Add per-record SHA-256 to enable independent verification
13. **Scalable search**
    - Replace client-side filter with server-side search
    - Pre-compute search index at snapshot time
14. **Pagination**
    - Record lists, search results, diff output need pagination

### P2 — Polish (fix after P0 and P1)

15. **Timeline auto-naming quality**
    - Current: top-3 most frequent words (often incoherent)
    - Improve: better NLP or curated titles
16. **OpenAPI diff endpoint documentation**
    - `/api/v1/diff` exists but is not in the OpenAPI spec
17. **Conditional HTTP feed requests**
    - `If-None-Match` / `If-Modified-Since` for feed fetching
18. **Timeline computation O(n²)**
    - `buildTimelines()` compares all pairs; won't scale to 10,000+ records
    - Optimize with inverted index or blocking

---

## What We Do Not Do

- **No AI.** No LLMs, no embeddings, no semantic search, no automated summaries,
  no opinionated ranking. The archive is a mirror, not an editor.
- **No predictions.** No trend lines, forecasts, or "stories to watch."
- **No rankings.** No "top stories," "most important," "most read." Publishing
  frequency and keyword matches are neutral data, not editorial signals.
- **No opinions.** The archive has no opinion about what matters. It only says
  what was published and when.
- **No fabricated data.** Every number must trace to an actual computation.
  Every example must be real or explicitly marked as illustrative.
