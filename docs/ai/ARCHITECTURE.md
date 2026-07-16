# Architecture

## Current Architecture

### Framework Stack

- **TanStack Start** (v1.168) — Full-stack React framework with SSR, file-based
  routing, and server functions.
- **Vite 8** — Build tool via `@lovable.dev/vite-tanstack-config`.
- **Nitro 3** — SSR production server with Cloudflare Workers adapter.
- **Tailwind CSS v4** — Styling with custom CSS variables for archival
  aesthetic.
- **IBM Plex Mono** — Primary typeface (monospace).

### Deployment

- **Cloudflare Workers** — Edge compute, `nodejs_compat` flag.
- **Cloudflare R2** — Object storage for snapshot JSON files (Target — not yet
  implemented).
- Static assets served from Cloudflare's CDN.

### Data Flow (Current)

```
RSS Feeds (11 sources)
       │
       ▼
scripts/generate-snapshot.ts
       │
       ├──► data/YYYY-MM-DD.json (local copy, gitignored)
       ├──► data/latest.json (local copy, gitignored)
       └──► src/lib/snapshot-data.ts (TypeScript module, committed)
               │
               ▼
         Vite Build (bundles into server + client output)
               │
               ▼
         TanStack Start SSR Runtime
               │
               ├──► getSnapshot() → returns bundled snapshot
               └──► getSnapshotByDate() → returns bundled if date matches
```

### Data Flow (Target — after Milestone 1)

```
RSS Feeds (11+ sources)
       │
       ▼
scripts/generate-snapshot.ts
       │
       ├──► Cloudflare R2 /snapshots/YYYY-MM-DD.json
       ├──► Cloudflare R2 /snapshots/latest.json
       └──► src/lib/snapshot-data.ts (build-time cache of latest)
               │
               ▼
         TanStack Start SSR Runtime
               │
               ├──► getSnapshot() → returns bundled or fetches from R2
               ├──► getSnapshotByDate(date) → fetches from R2, falls back to bundled
               └──► listSnapshots() → lists available dates from R2
```

### Route Structure

| Path               | Component         | Data Source                          |
| ------------------ | ----------------- | ------------------------------------ |
| `/`                | HomePage          | `getSnapshot()`                      |
| `/browse`          | BrowsePage        | `getSnapshot()`                      |
| `/search`          | SearchPage        | `getSnapshot()` (client-side filter) |
| `/snapshots/`      | SnapshotsIndex    | `getSnapshot()`                      |
| `/snapshots/$date` | SnapshotPage      | `getSnapshotByDate(date)`            |
| `/record/$id`      | RecordPage        | `getSnapshot()` (find by id)         |
| `/about`           | AboutPage         | `getSnapshot()`                      |
| `/documentation`   | DocumentationPage | Static                               |
| `/api`             | ApiDocs           | Static                               |

### Snapshot Lifecycle

1. **Ingestion** — RSS feeds are fetched, parsed, and normalized into Record
   objects. SHA-256 hashes are computed per-record.
2. **Snapshot assembly** — Records are collected into a Snapshot object with
   metadata (date, record count, sources, countries, root hash).
3. **Storage** — Snapshot is written as JSON to R2 (target) and as a TypeScript
   module for build-time bundling.
4. **Verification** — Client-side SHA-256 verification using Web Crypto API.
   Target: OpenTimestamps for external anchoring.

### Key Modules

| Module                          | Purpose                                           |
| ------------------------------- | ------------------------------------------------- |
| `scripts/generate-snapshot.ts`  | RSS fetching, parsing, hashing, output generation |
| `src/lib/data.ts`               | Type definitions, server functions, data access   |
| `src/lib/snapshot-data.ts`      | Auto-generated bundled snapshot data              |
| `src/routes/`                   | All application routes                            |
| `src/components/site-shell.tsx` | Shared layout                                     |
| `src/styles.css`                | Global styles, Tailwind, custom CSS               |
| `src/start.ts`                  | TanStack Start entry point                        |
| `src/server.ts`                 | SSR server with error recovery                    |
| `src/router.tsx`                | TanStack Router with QueryClient                  |

## Future Architecture Considerations

- **R2 as primary storage** — All snapshots in R2, indexed by date. The
  bundled TypeScript module becomes a build-time cache for the latest snapshot.
- **Search index** — Inverted index built during snapshot generation and stored
  alongside snapshots in R2. Downloaded on demand for search queries.
- **Vector embeddings** — Stored in Cloudflare Vectorize or as flat files in R2
  for semantic search.
- **Event clustering** — Post-processing step after snapshot generation,
  results stored as JSON in R2.
- **Cron trigger** — Cloudflare Workers Cron Triggers for daily snapshot
  generation.
- **API layer** — TanStack Start server functions serving JSON responses with
  CORS headers, exposed at `/api/v1/`.
