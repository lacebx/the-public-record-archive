# Project Memory

## Product Vision

The Public Internet Record is NOT a news website. It is a permanent historical
archive of the public internet. The mission is to create immutable, verifiable
snapshots of publicly available information so that historical records can be
preserved, searched, compared, and independently verified.

## Core Principles

1. **Preserve first, analyze second.** — Ingestion and preservation are the
   primary function. Analysis and search are built on top of a solid archive.
2. **Records must have provenance.** — Every record must trace back to its
   source and show its chain of custody.
3. **Snapshots are immutable.** — Once created, a snapshot must never be
   modified. Updates create new snapshots.
4. **Historical truth must be reproducible.** — Anyone with the snapshot data
   and the open-source tooling must be able to independently verify integrity.
5. **Every change must be traceable.** — The system must support diffing,
   version history, and change tracking across snapshots.
6. **Trust over convenience.** — Cryptographic verification and provenance
   matter more than a polished UI.

## Permanent Constraints

- No database. No server-side state. The archive is file-based.
- No authentication. The platform is a public read-only archive.
- All processing must be reproducible from source data.
- Cloudflare Workers is the deployment target (edge compute, no persistent
  filesystem).
- Snapshots are stored in Cloudflare R2 object storage.
- The bundled TypeScript module (`src/lib/snapshot-data.ts`) is the build-time
  fallback for the latest snapshot.

## Naming Conventions

- Snapshots: `YYYY-MM-DD.json`
- Record IDs: `REC-{YYYY-MM-DD}-{6-digit-sequence}`
- Branches: `feature/<description>`, `fix/<description>`,
  `refactor/<description>`, `security/<description>`
- Milestones: "Milestone N: <Product Capability>"

## Architectural Philosophy

- TanStack Start for full-stack React with SSR.
- Server functions for all data loading (no client-side fetch to external
  APIs).
- Snapshot data is generated at build time and bundled into the server/client
  output. Historical snapshots are fetched from R2 at runtime.
- The `/data/` directory contains local copies of snapshot JSON; it is
  gitignored.
- The archival aesthetic (IBM Plex Mono, double-ruled HRs, minimal design,
  institutional tone) is a permanent visual constraint.

## Major Lessons Learned

1. **`createServerFn` parameter compilation.** — TanStack Start's babel plugin
   transforms `createServerFn().handler(async (param: string) => {...})` into a
   function that receives the middleware context object, not the bare parameter.
   If the transformation doesn't occur (e.g. plugin misconfiguration), the
   function silently receives the wrong argument type. Prefer plain async
   functions or `.validator()` pattern for parameterized data access when the
   data is already available in both client and server bundles.

2. **Serverless bundle constraints.** — Files read at runtime via
   `readFileSync()` are not available in Cloudflare Workers. All data must be
   either bundled at build time (imported TypeScript module) or fetched from
   object storage (R2) at runtime.

3. **SSR error recovery.** — Uncaught errors during SSR can cause silent
   failures in production. The project uses error boundary middleware in
   `start.ts`, h3 error swallowing fix in `server.ts`, and uncaught
   exception/rejection capture in `error-capture.ts`.
