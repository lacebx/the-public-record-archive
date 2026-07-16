# Ideas

This file captures future feature ideas, product concepts, and potential
expansions that are beyond the current roadmap but worth recording.

## Product Ideas

- **Public Record API key registration portal** — Allow researchers and
  journalists to register for higher-rate API access.
- **Email newsletter** — Daily digest of the snapshot with notable changes and
  new sources.
- **Browser extension** — Allow users to archive a page they are viewing
  directly into the next snapshot.
- **WARC export** — Export snapshots in WARC format for Internet Archive
  compatibility.
- **IPFS integration** — Pin snapshots to IPFS for decentralized preservation.
- **Git-based snapshot history** — Store each snapshot as a git commit in a
  public repo, enabling native diff and history tools.
- **Distributed validation network** — Allow third parties to run the
  verification algorithm and publish their results, creating a trust network.
- **OCR for archived PDFs/images** — When crawling non-RSS sources, perform OCR
  on PDF documents to extract text for search indexing.
- **"This Day in History" feature** — Show what was archived on this date in
  previous years.
- **Source health public dashboard** — Show which sources are active, failing,
  or changed their feed URLs.
- **Donation/funding page** — The platform needs sustainable funding. Add a
  page explaining costs and accepting donations.
- **Collaborative tagging** — Allow trusted researchers to tag and categorize
  records for improved searchability.

## Technical Exploration

- **Cloudflare Durable Objects** for real-time collaboration features.
- **WebAssembly OTS verification** for client-side OpenTimestamps verification
  without a server.
- **HNSW vector index** for efficient semantic search on the edge.
- **Server-sent events** for real-time snapshot generation progress.
- **Pre-rendered static snapshots** for critical historical dates to ensure no
  single point of failure.

## Expansion Concepts

- **Academic API** — Special API access for researchers with higher rate
  limits and bulk download capabilities.
- **Legal hold API** — API that allows legal professionals to certify that a
  record existed at a specific point in time.
- **Museum/Gallery partnerships** — Partner with institutions that want to
  exhibit the "History of the Internet" through archived snapshots.
- **Educational curriculum** — Create lesson plans around using the archive
  for journalism, history, and computer science education.
