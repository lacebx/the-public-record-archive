# Known Issues

## Audit Findings (P0 — integrity threatening)

- **Fabricated example values in OpenAPI spec.** `/openapi.json` contains made-up example responses with 942 records, "Reuters" as a publisher (not actually ingested), and an OpenAI fictional article title. This is fabrication, not documentation. **Fix:** Replace with real examples or mark as illustrative.
- **Fabricated example values in API docs.** `src/routes/api.tsx` shows a fictional snapshot: 1,592 records from 45 sources across 12 countries. Should show "real" example or be marked as illustrative.
- **Fictional snapshot stats in health endpoint.** `src/routes/api.tsx` (health section) returns `{ snapshots: 142, records: 94252 }` — completely fabricated numbers.
- **Analytics page ranks record importance.** `src/routes/analytics.tsx` shows "Largest Stories," "Most Active Publishers," "Newest Timelines" — editorial judgment that ranks records by importance. An archive does not rank. **Fix:** Remove these sections or re-frame as neutral facts.
- **Snapshot data is bundled in git.** `src/lib/snapshot-data.ts` is auto-generated and committed. This prevents verifiability (the bundled data passes through git, not the original pipeline). **Fix:** Fetch from R2 at build time; git should only hold source code.
- **Browse page "reverse chronological order" claim.** `src/routes/browse.tsx` says records are ordered "reverse chronological" but this is not guaranteed for historical snapshots (only true for the latest snapshot which represents a single point in time).
- **Integrity certificate caveat missing.** `src/routes/record.$id.tsx` calls the hash display an "Integrity Certificate" without explaining what it actually proves (that the record hash was included in the snapshot bundle — not that the original source published this content on that date).
- **API playground has low archival value.** `/api/playground` loads a heavy Scalar client-side bundle for what is essentially a REST test tool. Researchers would prefer the raw OpenAPI spec or curl examples.
- **Diff UI implies feed-rotation is page deletion.** `/compare` shows "removed" records without explaining that feeds naturally rotate their content windows.

## Audit Findings (P1 — archival reliability)

- **R2 persistence has silent failure.** `src/lib/storage.ts` wraps R2 `save()` in try-catch that only logs errors. A snapshot could fail to persist without anyone noticing.
- **Archive generation uses current timestamp.** `src/lib/archive.ts` embeds `new Date().toISOString()` as the archive creation time instead of the snapshot's timestamp.
- **No multi-day history without R2.** If R2 is down and no snapshots have been cached locally, only the latest bundled snapshot is available.
- **"New records" stat is misleading.** "New records" vs "carried over" uses the previous snapshot as baseline, but with only one bundled snapshot available, the comparison is always against itself (all records are "new").
- **No individual record checksums.** Snapshot integrity is verified at the snapshot level only. Individual records cannot be independently verified.
- **Search is not scalable.** `src/routes/search.tsx` loads all records client-side and filters in memory.
- **No pagination.** Record lists, search results, and diff output have no pagination.

## Audit Findings (P2 — polish)

- **Timeline auto-naming quality.** Auto-generated titles from frequent words are often incoherent.
- **OpenAPI diff endpoint missing.** `/api/v1/diff` exists but is not documented in OpenAPI spec.
- **No conditional HTTP requests.** Feeds are unconditionally fetched every run.
- **Timeline computation O(n²).** `buildTimelines()` compares all pairs; fine for 700 records, won't scale to 10,000+.
- **No language detection.** All records treated as English regardless of actual language.

## Fixed (this session)

- **Milestone 4 implemented** — Related Record Engine, Story Timelines, Timeline Intelligence all completed (Issue #17).
- **Site-shell header/footer "est. 1998"** — Header said `public.record / est. 1998` and footer said `Established 1998 · Nonprofit Archival Trust`. Changed to `founded 2026` and `Founded 2026 · Independent Archival Project` respectively.
- **Milestone 2 Issue #11 closed** — REST API v1 endpoints were implemented in PR #39 but the issue was never closed.
- **Milestone 3 now 100%** — Snapshot analytics dashboard (Issue #16) implemented at `/analytics`.
- **404/Error page styling** — 404 and error boundary components used undefined shadcn CSS classes (`bg-primary`, `rounded-md`, `border-input`). Replaced with project's existing `.btn` class.
- **Browse page empty state** — When category filter matched zero records, the table was empty with no message. Added "No records match the selected category."
- **Homepage "Recently Archived" empty state** — Section was conditionally hidden with no message. Added "No records have been archived yet."
- **HTML in record summaries** — 79 records from NPR/Ars Technica contained raw HTML (`<img>`, `<p>`, `<a>`) in `summary` fields, rendered as visible text markup. Added `stripHtml()` utility (`src/lib/utils.ts`) and applied in search results, record detail pages, and meta descriptions.
- **Fictional institutional claims** — About page claimed "1998 founding," "nonprofit archival trust," "consortium of national libraries," "PO Box 1998, The Hague." Documentation page claimed WARC 1.1 format, multi-node verification, and "established in 1998." Record pages showed fictional "Evidence Chain" with witness nodes and signing keys. Root metadata said "Established 1998." All corrected to describe the project honestly as an independent archival project founded in 2026.
- **Route tree out of date** — `src/routeTree.gen.ts` did not include `/compare` or `/api/v1/diff` routes. Regenerated by running the dev server.

## Bugs

- **BBC News feed returns duplicate URLs.** 2 of ~42 BBC items share the same `sourceUrl` each day (e.g., the same sports article appearing under two different titles in the feed). URL-based dedup now strips these before record creation (~0.6% of total). Caused by the BBC RSS feed including the same article in multiple category sections.

## Technical Debt

- **No client-side search scaling.** All records are loaded client-side and filtered in memory. Does not scale beyond current snapshot size.
- **No error monitoring.** SSR errors are caught but not reported. Sentry or similar needed (Milestone 8, Issue #29).
- **No dependency auditing.** `npm audit` has not been run.
- **Diff API not in OpenAPI spec.** `/api/v1/diff` endpoint exists but is not yet documented in `public/openapi.json` or on the developer portal.
- **Snapshot logging is minimal.** The pipeline prints only "Fetching RSS feeds..." and "Total articles fetched: N". Per-feed breakdowns, newest/oldest dates, and failure diagnostics are missing, making it difficult to diagnose feed issues without external tooling.
- **No conditional HTTP requests.** `fetchFeed()` never sends `If-None-Match` or `If-Modified-Since` headers. While this is fine for a daily batch job (we want the full feed each time), it means we cannot distinguish a cached/historical response from a fresh one.

## Limitations

- **Timeline engine runs on single snapshot only.** Timelines are computed from the current bundled snapshot's ~700 records. Cross-snapshot timeline tracking across dates is not yet implemented — each daily snapshot produces its own independent timeline set.
- **Relationship scoring does not use named entity recognition.** Overlapping keywords may surface false positives when unrelated stories share common vocabulary (e.g., "court rules" could match both a legal ruling and a sports court decision). Named entity extraction would improve precision.
- **Timeline titles are auto-generated from most frequent words.** They may not always produce meaningful or human-readable titles. A human-curated naming system or NLP-based headline generation would improve quality.
- **Snapshot size is determined by feed windows.** All 29 feeds return a fixed-size window of recent items. The expected total of ~700+ records per day is the sum of these fixed windows. The pipeline does not control this — it faithfully captures whatever each feed provides.
- **Feed rollout for failures only.** When a feed fails (HTTP error), the pipeline rolls over the previous day's records for that source. But if a feed returns _fewer_ items than the previous day (e.g., 43 → 40), the pipeline does not detect this or compensate. The lower count is accepted as-is.
- **Snapshot data contains raw HTML.** Record `summary` fields may contain raw HTML from RSS feeds. Now stripped at render time via `stripHtml()`.
- **No language detection.** All records are treated as English even when they are in German, French, or Arabic.
- **Client-side compare.** The `/compare` page fetches from the diff API client-side; no SSR for comparison results.
- **API docs are static.** The `/api` page documents endpoints manually rather than generating from the OpenAPI spec.

## Future Improvements

- Server-side rendering for search results (currently client-side only)
- Image archiving (currently only text content is archived)
- Metadata-only mode for large-scale crawling
- Distributed validation (allow third parties to verify and publish results)
- WARC file export for integration with Internet Archive
- Add `/api/v1/diff` to OpenAPI spec and developer portal endpoint table
