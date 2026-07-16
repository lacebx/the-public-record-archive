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
- Deploy via `nitro deploy` (GitHub Actions push to main) or `npm run deploy`.

### CI/CD Pipeline

Three GitHub Actions workflows run against `main`:

| Workflow       | Trigger                                         | Purpose                                                                 |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `ci.yml`       | Pull request to `main`                          | Validate: install → snapshot → format → test → lint → typecheck → build |
| `deploy.yml`   | Push to `main` (also validates PRs)             | Same checks + deploy to Cloudflare Workers                              |
| `snapshot.yml` | Scheduled daily 06:00 UTC + `workflow_dispatch` | Generate snapshot, validate integrity, archive artifacts                |

### Snapshot Lifecycle

1. **Scheduled execution** — GitHub Actions runs `snapshot.yml` daily at
   06:00 UTC (manually triggerable via `workflow_dispatch`).
2. **Ingestion** — `npm run snapshot` fetches 11 RSS feeds, parses RSS/Atom XML,
   and normalizes into `RawArticle` objects. SHA-256 hashes computed per-record.
3. **Snapshot assembly** — `buildRecords()` + `buildSnapshot()` produce a
   `Snapshot` object with metadata and the root SHA-256 hash (of the
   JSON-serialized records array).
4. **Storage** — Two layers:
   - **Build-time bundle**: `writeSnapshotFiles()` writes `src/lib/snapshot-data.ts`
     (TypeScript module committed to repo, used by Vite build).
   - **Persistence layer**: `persistSnapshot()` uses `LocalSnapshotStore`
     (implements `SnapshotStore` interface) to write JSON to `data/` directory.
     In CI, the `data/` directory is archived as a GitHub Actions artifact
     (90-day retention).
5. **Validation** — Inline integrity check verifies root hash matches
   re-computed SHA-256 of records. CI `snapshot.yml` fails loudly on mismatch.
6. **Verification** — Client-side SHA-256 verification using Web Crypto API
   (`src/routes/snapshots.$date.tsx`).
7. **Future** — `R2SnapshotStore` implementing the same `SnapshotStore` interface
   will upload to Cloudflare R2. No business logic changes required.

### Data Flow (Current)

```
Daily 06:00 UTC (GitHub Actions)
        │
        ▼
scripts/generate-snapshot.ts
        │
        ├──► data/YYYY-MM-DD.json          ← LocalSnapshotStore.save()
        ├──► data/latest.json              ← LocalSnapshotStore.save()
        ├──► src/lib/snapshot-data.ts      ← Build-time bundle (committed)
        └──► GitHub Actions Artifact       ← Archival (90-day retention)
                │
                ▼
          Vite Build (bundles into server + client output)
                │
                ▼
          TanStack Start SSR Runtime
                │
                ├──► getSnapshot() → returns bundled snapshot
                └──► getSnapshotByDate() → bundled if date matches,
                      otherwise tries LocalSnapshotStore.load(date)
```

### Data Flow (Target — after R2 integration)

```
Daily 06:00 UTC (GitHub Actions or Cron Trigger)
        │
        ▼
scripts/generate-snapshot.ts
        │
        ├──► Cloudflare R2 /snapshots/YYYY-MM-DD.json    ← R2SnapshotStore.save()
        ├──► Cloudflare R2 /snapshots/latest.json        ← R2SnapshotStore.save()
        └──► src/lib/snapshot-data.ts                    ← Build-time cache of latest
                │
                ▼
          TanStack Start SSR Runtime
                │
                ├──► getSnapshot() → returns bundled or fetches from R2
                ├──► getSnapshotByDate(date) → fetches from R2, falls back to bundled
                └──► listSnapshots() → R2SnapshotStore.list()
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

### Archive Download

The snapshot detail page (`/snapshots/$date`) includes an "Download Archive (.tar.gz)"
button that calls the `getArchive` server function. The archive is built on the server:

1. Snapshot data is fetched via `getSnapshotByDate()` (uses store interface)
2. `buildArchiveTarGz()` in `src/lib/archive.ts` generates files (snapshot.json,
   MANIFEST.json, SHA256SUMS, README.md) and packs them into a `.tar.gz` using
   Node.js built-in `zlib` and a minimal USTAR tar packer
3. The compressed archive is returned as base64 to the client, which triggers
   a browser download

### Storage Abstraction

```typescript
// src/lib/storage.ts
export interface SnapshotStore {
  save(isoDate: string, snapshot: Snapshot): Promise<void>;
  load(isoDate: string): Promise<Snapshot | null>;
  list(): Promise<string[]>;
}

export class LocalSnapshotStore implements SnapshotStore {
  constructor(private basePath: string) {}
  // reads/writes JSON files to local filesystem
}

// Future:
// export class R2SnapshotStore implements SnapshotStore {
//   constructor(private bucket: R2Bucket) {}
//   // reads/writes to Cloudflare R2
// }
```

Used by:

- `scripts/generate-snapshot.ts` — calls `persistSnapshot()` which uses
  `LocalSnapshotStore` to write data files.
- `src/lib/data.ts` — `getSnapshotByDate()` falls back to
  `LocalSnapshotStore.load()` when the date doesn't match the bundled snapshot.

### Key Modules

| Module                           | Purpose                                           |
| -------------------------------- | ------------------------------------------------- |
| `scripts/generate-snapshot.ts`   | RSS fetching, parsing, hashing, output generation |
| `src/lib/data.ts`                | Type definitions, server functions, data access   |
| `src/lib/storage.ts`             | SnapshotStore interface + LocalSnapshotStore      |
| `src/lib/archive.ts`             | Archive builder (tar.gz packaging)                |
| `src/lib/snapshot-data.ts`       | Auto-generated bundled snapshot data              |
| `src/routes/`                    | All application routes                            |
| `src/components/site-shell.tsx`  | Shared layout                                     |
| `src/styles.css`                 | Global styles, Tailwind, custom CSS               |
| `src/start.ts`                   | TanStack Start entry point                        |
| `src/server.ts`                  | SSR server with error recovery                    |
| `src/router.tsx`                 | TanStack Router with QueryClient                  |
| `.github/workflows/ci.yml`       | PR validation                                     |
| `.github/workflows/deploy.yml`   | Production deploy + PR validation                 |
| `.github/workflows/snapshot.yml` | Scheduled daily snapshot generation               |

## Future Architecture Considerations

- **R2 as primary storage** — All snapshots in R2, indexed by date. The
  bundled TypeScript module becomes a build-time cache for the latest snapshot.
- **Search index** — Inverted index built during snapshot generation and stored
  alongside snapshots in R2. Downloaded on demand for search queries.
- **Vector embeddings** — Stored in Cloudflare Vectorize or as flat files in R2
  for semantic search.
- **Event clustering** — Post-processing step after snapshot generation,
  results stored as JSON in R2.
- **Cron Trigger** — When R2 is active, `snapshot.yml` can be replaced by
  Cloudflare Workers Cron Triggers for tighter integration.
- **API layer** — TanStack Start server functions serving JSON responses with
  CORS headers, exposed at `/api/v1/`.
- **External timestamp anchoring** — OpenTimestamps for public verifiability.
