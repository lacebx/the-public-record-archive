# Known Issues

## Bugs

- **Snapshot detail comparison bug** (FIXED in PR #3). Root cause: bare
  parameters in `createServerFn` not transformed by babel plugin. See
  `docs/ai/DECISIONS.md` (ADR-003).

## Technical Debt

- **No test framework.** Project has zero tests. Testing infrastructure must be
  added (Milestone 1, Issue #9).
- **No CI/CD.** Every PR must be manually built and verified. CI/CD must be
  added (Milestone 1, Issue #10).
- **Client-side search only.** All 326+ records are loaded client-side and
  filtered in memory. Does not scale beyond current snapshot size. Server-side
  search needed (Milestone 3, Issue #14).
- **TypeScript errors.** `npm run tsc --noEmit` shows pre-existing type errors
  unrelated to current work. These should be cleaned up.
- **No error monitoring.** SSR errors are caught but not reported. Sentry or
  similar needed (Milestone 8, Issue #29).
- **No dependency auditing.** `npm audit` has not been run. Supply chain risk
  is partially mitigated by bunfig.toml (24h release age guard).

## Limitations

- **Only latest snapshot available.** Historical snapshots are generated but
  only the latest is bundled into the build. Earlier snapshots are lost on each
  build (Milestone 1, Issue #4 will fix this).
- **Snapshot data contains raw HTML.** Record `summary` fields may contain raw
  HTML from RSS feeds (e.g. NASA, NPR records have full HTML markup). Currently
  not rendered via `dangerouslySetInnerHTML`, but the data is not sanitized.
- **No language detection.** All records are treated as English even when they
  are in German, French, or Arabic.
- **Static evidence chain.** The "Evidence Chain" and "Version History"
  sections on record pages are hardcoded placeholder text (Milestone 4,
  Issue #18 will fix this).
- **API docs are static.** The `/api` page documents a hypothetical API that
  does not exist (Milestone 2, Issue #11 will fix this).

## Future Improvements

- Server-side rendering for search results (currently client-side only)
- Image archiving (currently only text content is archived)
- Metadata-only mode for large-scale crawling
- Distributed validation (allow third parties to verify and publish results)
- WARC file export for integration with Internet Archive
