# The Public Internet Record

The Public Internet Record preserves what was publicly available on the internet at a given point in time. It never predicts, interprets, ranks, recommends, or editorializes. It preserves evidence.

[public.record](https://public.record)

## Mission

This is not a news site. It is not an RSS reader. It is not a recommendation engine. It is not an AI assistant. It is not a social network. It is not a dashboard. It is not an opinion platform.

It is evidence infrastructure for history.

Every day, the archive fetches publicly available content from RSS feeds across the world, snapshots the full payload with timestamps and integrity hashes, and stores it immutably. Researchers, journalists, and the public can browse, search, diff, verify, and download any snapshot.

## Principles

- Never invent facts.
- Never summarize beyond the source.
- Never predict.
- Never rank importance.
- Never recommend.
- Never infer intent.
- Preserve chronology.
- Preserve provenance.
- Prefer verifiability over convenience.
- Simplicity beats feature count.
- Every feature must make verification easier.

## Quick Start

```sh
# Install dependencies
npm ci

# Run the development server
npm run dev

# Generate a snapshot from feeds
npm run snapshot

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

## Project Structure

```
src/
  routes/          TanStack Start route files (20 routes)
  lib/             Core logic: data, api, diff, storage, archive, analytics
  components/      Shared UI components
  styles.css       Global styles (Tailwind v4 + custom)
scripts/
  generate-snapshot.ts   RSS fetcher + snapshot builder
tests/
  unit tests (Vitest)
  e2e tests (Playwright)
.github/workflows/
  ci.yml           PR validation
  deploy.yml       Deploy to Cloudflare Workers
  snapshot.yml     Daily snapshot generation
```

## Architecture

- **No database.** Snapshot data is stored in Cloudflare R2 and bundled at build time as a fallback. The JSON file is the database.
- **No authentication.** The API is read-only and public.
- **No server-side state.** Each request is stateless. Caching is per-process with LRU.
- **Deterministic relationships.** Records are linked by shared publisher, temporal proximity, and keyword overlap -- no AI, no embeddings, no semantic search.
- **Immutable snapshots.** Each snapshot has a SHA-256 hash. Archives include checksum manifests for independent verification.

## Issue Labels

| Label | Description |
|-------|-------------|
| `layer-1` | Archive Foundation (ingestion, storage, API, search, integrity) |
| `layer-2` | Historical Research (timelines, version history, clustering) |
| `layer-3` | Archive Expansion (more sources, languages, web crawling) |
| `layer-4` | Preservation (OpenTimestamps, WARC, IPFS, mirrors) |
| `layer-5` | Public Launch (docs, accessibility, legal, monitoring) |
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Improvements or additions to documentation |
| `backend` | Server-side logic and infrastructure |
| `frontend` | UI components and client code |
| `UX` | User experience improvements |
| `data` | Data model, ingestion, and quality |
| `infrastructure` | CI/CD, deployment, monitoring |
| `security` | Integrity, access control, hardening |
| `testing` | Test coverage and test infrastructure |

## Contributing

1. Read the north star documents in `docs/ai/`: `CONTEXT.md`, `HANDOFF.md`, `NORTH_STAR.md`, `ROADMAP.md`
2. Read ADR-016 in `docs/ai/DECISIONS.md` for the product direction and five-layer engineering model
3. Work in layer order: complete Layer 1 before starting Layer 2, Layer 2 before Layer 3, and so on
4. All new features must pass five gates: North Star, Integrity, Simplicity, Dependency, Removal
5. Branch from `main`, open a PR, run all checks before requesting review

### Before Opening a PR

```sh
npm test          # All tests must pass
npm run lint      # Zero errors
npm run typecheck # Zero errors
npm run build     # Build must succeed
```

### Five Gates for New Features

1. **North Star Test:** Does this help someone verify what existed on the internet at a given point in time?
2. **Integrity Test:** Does this introduce any fabricated, editorial, or unverifiable content?
3. **Simplicity Test:** Is this the simplest possible implementation?
4. **Dependency Test:** Does this depend on work that is not yet stable?
5. **Removal Test:** If we built this, would we ever want to remove it?

A feature must pass all five. Failure at any gate is rejection.

## Deployment

Daily snapshots are generated automatically at 06:00 UTC via GitHub Actions. The site is served from Cloudflare Workers. Deployments happen on push to `main`.

## License

See `docs/` for governance and legal documentation.
