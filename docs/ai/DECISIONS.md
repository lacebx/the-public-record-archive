# Architecture Decision Records

---

### ADR-001: File-based snapshot storage (no database)

Date: 2026-07-10

Decision:
Use file-based snapshot storage with no database. Snapshots are JSON files
stored in Cloudflare R2 and bundled as TypeScript modules at build time.

Context:
The project needs to store daily snapshots of public records. Requirements:
immutability, verifiability, reproducibility. A traditional database introduces
mutation risk, complexity, and cost. The archive is read-only and public.

Options considered:

- PostgreSQL (too complex, mutable, expensive to host)
- SQLite (better, but stateful and requires volume management on Workers)
- File-based JSON + R2 (simple, immutable, verifiable, cheap)

Chosen approach:
JSON files in R2 object storage. The file format IS the database. SHA-256
hashes provide integrity. R2 provides durability and global access.

Consequences:

- No complex query capabilities (must build indexes separately)
- No transactions (not needed — snapshots are write-once)
- Search requires additional index infrastructure
- R2 egress costs are zero (same as Workers)
- Reproducibility is trivial (the JSON file is the whole database)

---

### ADR-002: TanStack Start for full-stack React with SSR

Date: 2026-07-10

Decision:
Use TanStack Start (React 19, Vite, Nitro) for the application framework.

Context:
The project needs SSR for SEO, fast initial loads, and a public archive
presence. The team prefers React. Vite is the standard build tool.

Options considered:

- TanStack Start (SSR React, file-based routes, server functions)
- Next.js (mature but heavier, opinionated)
- SvelteKit (lighter but different ecosystem)

Chosen approach:
TanStack Start provides React SSR, file-based routing, and server functions
that compile to Cloudflare Workers via Nitro. The Vite integration provides
fast builds and HMR.

Consequences:

- Tied to TanStack Start ecosystem
- Server functions use babel compilation (may have edge cases — see ADR-003)
- Deployment targets Cloudflare Workers automatically

---

### ADR-003: Avoid bare parameters in createServerFn handlers

Date: 2026-07-16

Decision:
Do not rely on `createServerFn().handler(async (param: string) => {...})`
syntax for passing parameters. Instead use plain async functions when the data
is available in both client and server bundles, or use the `.validator()`
pattern for parameterized server functions.

Context:
The `getSnapshotByDate()` function was initially implemented as:

```
createServerFn({ method: "GET" }).handler(async (date: string) => {...})
```

The TanStack Start babel plugin is supposed to transform the parameter
signature to extract `date` from the middleware context (`ctx.data`). This
transformation did not occur, causing the handler to receive the entire
middleware context object as `date` instead of the bare string. The comparison
`date === isoDate` was always comparing an object to a string, returning false.

Options considered:

- Fix the babel plugin configuration (complex, fragile)
- Use `.validator()` pattern (standard TanStack approach)
- Use plain async functions (when data is universally available)

Chosen approach:
For `getSnapshotByDate`, a plain async function was used because the bundled
snapshot data is available in both client and server bundles. No RPC is needed.

Consequences:

- Functions that read universally available data don't need server functions
- The `.validator()` pattern should be used when server-side-only processing
  is required
- Documented in PROJECT_MEMORY.md as a lesson learned

---

### ADR-004: SHA-256 for record and snapshot integrity

Date: 2026-07-10

Decision:
Use SHA-256 for all cryptographic integrity verification. Per-record hashes
and a root snapshot hash that is the SHA-256 of the JSON-serialized records
array.

Context:
The archive must provide verifiable integrity. Users must be able to confirm
that a snapshot has not been tampered with.

Options considered:

- SHA-256 (standard, well-supported, Web Crypto API available client-side)
- SHA-3 (newer, less browser support)
- Merkle tree per snapshot (too complex for MVP)

Chosen approach:
SHA-256 per record (hash of `id|title|description|link|source|timestamp`)
and a root hash that is SHA-256 of the JSON-serialized records array. This
is verifiable client-side with `crypto.subtle.digest()`.

Consequences:

- Per-record hashes enable individual record verification
- Root hash enables full snapshot verification
- Future: Merkle tree for partial verification without full download
- Future: OpenTimestamps for external timestamp anchoring

---

### ADR-005: Cloudflare Workers as primary deployment target

Date: 2026-07-10

Decision:
Deploy to Cloudflare Workers via Nitro. Workers provide edge compute with
global distribution, zero cold-start management, and integration with R2.

Context:
The archive needs to be globally available, fast, and inexpensive. A
traditional server would require management, scaling, and higher costs.

Options considered:

- Cloudflare Workers (edge compute, R2 integration, free tier generous)
- Vercel Serverless (node-based, more expensive for data-heavy workloads)
- Self-hosted VPS (more control, more management)

Chosen approach:
Cloudflare Workers via Nitro. The existing project was already configured for
Workers deployment. R2 provides compatible object storage.

Consequences:

- Limited to 10ms CPU time per request on free tier (paid plan removes this)
- No persistent filesystem (must use R2 or KV)
- `nodejs_compat` flag required for some Node.js APIs
- Response size limits apply (Worker responses cannot exceed 100MB)

---

### ADR-006: Vitest for testing

Date: 2026-07-16

Decision:
Use Vitest as the test runner. Tests are co-located in `scripts/__tests__/`
(generator unit tests) and `tests/` (integration/functional tests).

Context:
The project uses Vite as its build tool. Vitest is the natural choice —
it shares Vite's transform pipeline, configuration format, and module
resolution. The alternative would be Jest or a standalone test runner.

Options considered:

- Vitest (Vite-native, fast, same config as build)
- Jest (requires separate config, slower, different transform pipeline)
- Node built-in test runner (lacks matchers, mocking, and reporting)

Chosen approach:
Vitest with `environment: "node"`. Tests import TypeScript source files
directly through Vite's transform pipeline. No separate compilation step.
The `vitest.config.ts` mirrors the Vite resolve aliases.

Consequences:

- Tests share the same module resolution as the build (`@/` path aliases)
- Tests run ~1.2s cold, ~0.3s cached
- 53 initial tests across 3 test files
- Mocking HTTP in snapshot generator tests can use `vi.fn()` when needed

---

### ADR-007: Storage abstraction via SnapshotStore interface

Date: 2026-07-16

Decision:
Define a `SnapshotStore` interface (`save`, `load`, `list`) in
`src/lib/storage.ts` with a `LocalSnapshotStore` implementation. Future R2
integration will add `R2SnapshotStore` without changing business logic.

Context:
Snapshots need to be preserved long-term. The obvious target is Cloudflare R2,
but R2 is not yet configured. A storage abstraction allows development with
local filesystem storage and migration to R2 without refactoring.

Options considered:

- Direct R2 integration from the start (blocked — no R2 bucket, no credentials)
- Direct filesystem writes only (creates R2 migration work later)
- Storage interface with swappable implementations (chosen)

Chosen approach:
A minimal interface (`SnapshotStore`) with a single filesystem implementation
(`LocalSnapshotStore`). The generator calls `persistSnapshot()` which uses the
store. In CI, the data directory is archived as GitHub Actions artifacts.

Consequences:

- Adding R2 is a new class implementing the same interface
- The generator and app code never reference filesystem or R2 directly
- Artifacts provide 90-day retention without any external service
- The interface is small (3 methods) and unlikely to need changes

---

### ADR-008: GitHub Actions for scheduled snapshot generation

Date: 2026-07-16

Decision:
Use GitHub Actions scheduled workflows (cron) for daily snapshot generation
instead of Cloudflare Workers Cron Triggers.

Context:
The project needs daily automated snapshot generation. Two options exist:
Cloudflare Workers Cron Triggers (runs on Workers infrastructure) or GitHub
Actions scheduled workflows (runs on GitHub infrastructure). R2 is not yet
configured, and the snapshot generator requires Node.js filesystem access
(`node:fs`) which is not available in Workers without polyfills.

Options considered:

- Cloudflare Workers Cron Triggers (tighter integration, but R2 not configured)
- GitHub Actions scheduled workflow (simpler, works with local filesystem,
  artifact archival)
- Self-hosted cron (more control, more maintenance)

Chosen approach:
GitHub Actions schedule at 06:00 UTC daily with `workflow_dispatch` for manual
triggering. The workflow runs the full generator pipeline, validates integrity,
and archives data as artifacts (90-day retention).

Consequences:

- Snapshot runs on GitHub infrastructure (not Cloudflare)
- Artifacts provide temporary preservation without R2
- `workflow_dispatch` enables testing without waiting for cron
- Future migration: replace with Workers Cron Triggers when R2 is active
- Generator must complete within GitHub Actions 6-hour timeout (actual: ~30s)

---

---

### ADR-010: Minimal USTAR tar.gz for archive download (no external dependency)

Date: 2026-07-16

Decision:
Implement a minimal USTAR tar packer in-house rather than importing the `tar`
npm package for archive download generation.

Context:
Snapshots need a downloadable bulk export containing snapshot.json, MANIFEST.json,
SHA256SUMS, and README.md as a single file. The format must be unpackable with
standard tools (`tar xzf`) on any system. Only 4 text files need to be packaged,
and the USTAR format is simple (512-byte headers).

Options considered:

- `tar` npm package (pure JS, well-maintained, but another dependency)
- `archiver` npm package (streaming, supports tar+zip, but heavier)
- Child process `tar czf` (Linux/macOS only, not portable to Workers)
- Custom USTAR implementation (zero dependencies, ~80 lines, format is simple)

Chosen approach:
A minimal USTAR implementation in `src/lib/archive.ts` with Node.js built-in
`zlib.gzipSync()` for compression. The implementation handles ASCII filenames
only (no unicode in archive paths), which is fine for `snapshot.json`,
`MANIFEST.json`, `SHA256SUMS`, `README.md`. Total implementation: ~80 lines.

Consequences:

- Zero new dependencies
- Archive is created entirely in-memory (no temp files)
- Limited to ASCII filenames (sufficient for our use case)
- File sizes limited to what fits in a Worker response (under 100MB)
- Future: could switch to `tar` package if more complex archive structure needed

---

### ADR-009: GitHub Actions artifacts as interim snapshot storage

Date: 2026-07-16

Decision:
Store generated snapshot JSON files as GitHub Actions artifacts with 90-day
retention. This is a temporary measure until Cloudflare R2 is configured.

Context:
Daily snapshots must be preserved. R2 is the target but not yet configured.
GitHub Actions artifacts provide free storage with 90-day retention, URL
download access, and require no additional setup.

Options considered:

- GitHub Actions artifacts (free, 90-day retention, no setup)
- Git LFS (commits binary blobs to repo, pollutes history)
- Committing to a separate `data` branch (increases repo size, no retention
  enforcement)

Chosen approach:
After `npm run snapshot`, the `data/` directory is uploaded as a workflow
artifact. The TypeScript module (`src/lib/snapshot-data.ts`) is also uploaded
for reference. Both use `actions/upload-artifact@v4`.

Consequences:

- Snapshots are preserved for 90 days (extendable if needed)
- Downloadable via GitHub Artifacts UI or API
- No external service dependencies
- Artifacts are automatically deleted after retention period
- Migration to R2: replace artifact upload with R2 store call
