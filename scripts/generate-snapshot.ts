import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { XMLParser } from "fast-xml-parser";
import { LocalSnapshotStore, r2Config } from "../src/lib/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..");
export const DATA_DIR = resolve(ROOT, "data");

interface FetchResult {
  articles: RawArticle[];
  ok: boolean;
  source: string;
}

export interface RawArticle {
  title: string;
  description: string;
  link: string;
  published: string;
  source: string;
  country: string;
  category: string;
}

interface SnapshotRecord {
  id: string;
  publisher: string;
  title: string;
  published: string;
  archived: string;
  status: "VERIFIED" | "PENDING";
  hash: string;
  summary: string;
  sourceUrl: string;
  country: string;
  category: string;
}

export type SnapshotStatistics = {
  rawRecords: number;
  uniqueRecords: number;
  duplicatesRemoved: number;
  feedsSucceeded: number;
  feedsFailed: number;
  feedsTotal: number;
  newRecords: number;
  carriedOverRecords: number;
  removedRecords: number;
  generationDurationMs: number;
};

interface Snapshot {
  date: string;
  isoDate: string;
  generated: string;
  articles: number;
  sources: number;
  countries: number;
  status: string;
  hash: string;
  records: SnapshotRecord[];
  statistics?: SnapshotStatistics;
}

interface FeedConfig {
  url: string;
  source: string;
  country: string;
  category: string;
}

const FEEDS: FeedConfig[] = [
  // === News ===
  {
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    source: "BBC News",
    country: "United Kingdom",
    category: "News",
  },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    source: "The New York Times",
    country: "United States",
    category: "News",
  },
  {
    url: "https://feeds.npr.org/1001/rss.xml",
    source: "NPR",
    country: "United States",
    category: "News",
  },
  {
    url: "https://www.theguardian.com/world/rss",
    source: "The Guardian",
    country: "United Kingdom",
    category: "News",
  },
  {
    url: "https://www.spiegel.de/schlagzeilen/tops/index.rss",
    source: "Der Spiegel",
    country: "Germany",
    category: "News",
  },
  {
    url: "https://www.lemonde.fr/rss/une.xml",
    source: "Le Monde",
    country: "France",
    category: "News",
  },
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    source: "Al Jazeera",
    country: "Qatar",
    category: "News",
  },
  {
    url: "https://www.france24.com/en/rss",
    source: "France24",
    country: "France",
    category: "News",
  },
  {
    url: "https://www.euronews.com/rss",
    source: "Euronews",
    country: "France",
    category: "News",
  },
  {
    url: "https://www.cbc.ca/cmlink/rss-world",
    source: "CBC News",
    country: "Canada",
    category: "News",
  },
  {
    url: "https://abcnews.go.com/abcnews/topstories",
    source: "ABC News",
    country: "United States",
    category: "News",
  },
  {
    url: "https://www.latimes.com/rss2.0.xml",
    source: "Los Angeles Times",
    country: "United States",
    category: "News",
  },
  // === Technology ===
  {
    url: "https://www.wired.com/feed/rss",
    source: "Wired",
    country: "United States",
    category: "Technology",
  },
  {
    url: "https://arstechnica.com/feed/",
    source: "Ars Technica",
    country: "United States",
    category: "Technology",
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    source: "The Verge",
    country: "United States",
    category: "Technology",
  },
  {
    url: "https://techcrunch.com/feed/",
    source: "TechCrunch",
    country: "United States",
    category: "Technology",
  },
  {
    url: "https://news.ycombinator.com/rss",
    source: "Hacker News",
    country: "United States",
    category: "Technology",
  },
  {
    url: "https://blog.cloudflare.com/rss/",
    source: "Cloudflare Blog",
    country: "United States",
    category: "Technology",
  },
  {
    url: "https://blog.chromium.org/feeds/posts/default",
    source: "Chromium Blog",
    country: "United States",
    category: "Technology",
  },
  // === Business ===
  {
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    source: "CNBC",
    country: "United States",
    category: "Business",
  },
  {
    url: "https://feeds.bloomberg.com/markets/news.rss",
    source: "Bloomberg",
    country: "United States",
    category: "Business",
  },
  // === Science ===
  {
    url: "https://www.nasa.gov/feed/",
    source: "NASA",
    country: "United States",
    category: "Science",
  },
  {
    url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    source: "NASA Breaking News",
    country: "United States",
    category: "Science",
  },
  {
    url: "https://www.sciencedaily.com/rss/all.xml",
    source: "ScienceDaily",
    country: "United States",
    category: "Science",
  },
  {
    url: "https://home.cern/news/rss",
    source: "CERN",
    country: "Switzerland",
    category: "Science",
  },
  // === Security ===
  {
    url: "https://krebsonsecurity.com/feed/",
    source: "Krebs on Security",
    country: "United States",
    category: "Security",
  },
  {
    url: "https://blog.talosintelligence.com/feed/",
    source: "Cisco Talos",
    country: "United States",
    category: "Security",
  },
  {
    url: "https://googleprojectzero.blogspot.com/feeds/posts/default",
    source: "Google Project Zero",
    country: "United States",
    category: "Security",
  },
  // === Government ===
  {
    url: "https://www.gov.uk/government/feed",
    source: "UK Government",
    country: "United Kingdom",
    category: "Government",
  },
];

export function sha256(data: string): string {
  return createHash("sha256").update(data, "utf-8").digest("hex");
}

export function extractText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    if (typeof o._ === "string") return o._;
    if (typeof o["#text"] === "string") return o["#text"];
  }
  return String(val);
}

export function extractLink(item: Record<string, unknown>): string {
  const link = item.link;
  if (!link) return "";
  if (typeof link === "string") return link;
  if (typeof link === "object" && link !== null) {
    const l = link as Record<string, unknown>;
    if (typeof l["@_href"] === "string") return l["@_href"];
    if (
      l.$ &&
      typeof l.$ === "object" &&
      typeof (l.$ as Record<string, unknown>).href === "string"
    ) {
      return (l.$ as Record<string, unknown>).href as string;
    }
    if (typeof l._ === "string") return l._;
  }
  return "";
}

export function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export function parseFeedItems(
  xml: string,
  feed: { source: string; country: string; category: string; url: string },
): RawArticle[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const body = JSON.parse(JSON.stringify(parsed));

  const rss = body?.rss;
  const feedRoot = body?.feed;

  let items: Record<string, unknown>[] = [];

  if (rss?.channel) {
    const ch = Array.isArray(rss.channel) ? rss.channel[0] : rss.channel;
    if (isRecord(ch) && ch.item) {
      items = Array.isArray(ch.item) ? ch.item : [ch.item];
    }
  } else if (feedRoot) {
    if (isRecord(feedRoot) && feedRoot.entry) {
      items = Array.isArray(feedRoot.entry) ? feedRoot.entry : [feedRoot.entry];
    }
  }

  const articles: RawArticle[] = [];
  for (const item of items) {
    if (!item) continue;
    const title = extractText(item.title);
    const description =
      extractText(item["content:encoded"]) ||
      extractText(item.description) ||
      extractText(item.summary);
    const link = extractLink(item);
    const pubDate =
      extractText(item.pubDate) ||
      extractText(item["dc:date"]) ||
      extractText(item.published) ||
      extractText(item.updated);

    if (!title && !description) continue;

    articles.push({
      title: title || "(untitled)",
      description: (description || title || "").slice(0, 2000),
      link: link || feed.url,
      published: pubDate || new Date().toISOString(),
      source: feed.source,
      country: feed.country,
      category: feed.category,
    });
  }
  return articles;
}

async function fetchFeed(feed: FeedConfig): Promise<
  FetchResult & {
    items: number;
    newestDate: string;
    oldestDate: string;
    fetchMs: number;
    parseMs: number;
    status: number;
  }
> {
  const start = performance.now();
  try {
    const response = await fetch(feed.url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "PublicInternetRecord/1.0 (archival bot)" },
    });
    const fetchMs = Math.round(performance.now() - start);
    if (!response.ok) {
      return {
        articles: [],
        ok: false,
        source: feed.source,
        items: 0,
        newestDate: "",
        oldestDate: "",
        fetchMs,
        parseMs: 0,
        status: response.status,
      };
    }
    const xml = await response.text();
    const parseStart = performance.now();
    const articles = parseFeedItems(xml, feed);
    const parseMs = Math.round(performance.now() - parseStart);

    let newestDate = "";
    let oldestDate = "";
    const dates = articles.map((a) => new Date(a.published).getTime()).filter((t) => !isNaN(t));
    if (dates.length > 0) {
      const newestTs = Math.max(...dates);
      const oldestTs = Math.min(...dates);
      newestDate = new Date(newestTs).toISOString();
      oldestDate = new Date(oldestTs).toISOString();
    }

    return {
      articles,
      ok: true,
      source: feed.source,
      items: articles.length,
      newestDate,
      oldestDate,
      fetchMs,
      parseMs,
      status: response.status,
    };
  } catch (err) {
    const fetchMs = Math.round(performance.now() - start);
    return {
      articles: [],
      ok: false,
      source: feed.source,
      items: 0,
      newestDate: "",
      oldestDate: "",
      fetchMs,
      parseMs: 0,
      status: 0,
    };
  }
}

export function deduplicateArticles(articles: RawArticle[]): {
  deduped: RawArticle[];
  removed: number;
} {
  const seen = new Set<string>();
  const deduped: RawArticle[] = [];
  for (const a of articles) {
    const key = a.link || a.title;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(a);
  }
  return { deduped, removed: articles.length - deduped.length };
}

function formatAge(iso: string): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "future";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export async function loadPreviousSnapshot(): Promise<Snapshot | null> {
  try {
    const { readFileSync } = await import("node:fs");
    const latestPath = resolve(DATA_DIR, "latest.json");
    const data = readFileSync(latestPath, "utf-8");
    return JSON.parse(data) as Snapshot;
  } catch {
    return null;
  }
}

export function buildRecords(
  articles: RawArticle[],
  isoDate: string,
  archivedAt: string,
): SnapshotRecord[] {
  return articles.map((a, i) => {
    const id = `REC-${isoDate}-${String(i + 1).padStart(6, "0")}`;
    const hashSource = `${id}|${a.title}|${a.description}|${a.link}|${a.source}|${archivedAt}`;
    const hash = sha256(hashSource);
    return {
      id,
      publisher: a.source,
      title: a.title,
      published: a.published,
      archived: archivedAt,
      status: "VERIFIED" as const,
      hash,
      summary: a.description.slice(0, 1000),
      sourceUrl: a.link,
      country: a.country,
      category: a.category,
    };
  });
}

export function buildSnapshot(
  records: SnapshotRecord[],
  isoDate: string,
  dateStr: string,
  generated: string,
  statistics?: SnapshotStatistics,
): Snapshot {
  const sourceSet = new Set(records.map((r) => r.publisher));
  const countrySet = new Set(records.map((r) => r.country));

  const recordsJson = JSON.stringify(records, null, 2);
  const snapshotHash = sha256(recordsJson);

  const s: Snapshot = {
    date: dateStr,
    isoDate,
    generated,
    articles: records.length,
    sources: sourceSet.size,
    countries: countrySet.size,
    status: "VERIFIED",
    hash: snapshotHash,
    records,
  };
  if (statistics) s.statistics = statistics;
  return s;
}

export function computeSnapshotStatistics(
  currentArticles: RawArticle[],
  currentRecords: SnapshotRecord[],
  duplicatesRemoved: number,
  prevSnapshot: Snapshot | null,
  generationDurationMs: number,
  feedsSucceeded: number,
  feedsFailed: number,
  feedsTotal: number,
): SnapshotStatistics {
  let carriedOver = 0;
  let newRecords = 0;

  if (prevSnapshot) {
    const prevUrls = new Set(prevSnapshot.records.map((r) => r.sourceUrl));
    for (const r of currentRecords) {
      if (prevUrls.has(r.sourceUrl)) {
        carriedOver++;
      } else {
        newRecords++;
      }
    }
  } else {
    newRecords = currentRecords.length;
  }

  const prevCount = prevSnapshot ? prevSnapshot.records.length : 0;
  const removed = prevCount - (currentRecords.length - newRecords);

  return {
    rawRecords: currentArticles.length,
    uniqueRecords: currentRecords.length,
    duplicatesRemoved,
    feedsSucceeded,
    feedsFailed,
    feedsTotal,
    newRecords,
    carriedOverRecords: carriedOver,
    removedRecords: Math.max(0, removed),
    generationDurationMs,
  };
}

export function writeSnapshotFiles(snapshot: Snapshot, isoDate: string) {
  const dateFile = resolve(DATA_DIR, `${isoDate}.json`);
  const latestFile = resolve(DATA_DIR, "latest.json");
  writeFileSync(dateFile, JSON.stringify(snapshot, null, 2), "utf-8");
  writeFileSync(latestFile, JSON.stringify(snapshot, null, 2), "utf-8");

  const tsFile = resolve(ROOT, "src", "lib", "snapshot-data.ts");
  const tsContent = `// Auto-generated by scripts/generate-snapshot.ts — do not edit
import type { Snapshot } from "./data";

const data: Snapshot = ${JSON.stringify(snapshot, null, 2)};

export default data;
`;
  writeFileSync(tsFile, tsContent, "utf-8");

  return { dateFile, latestFile, tsFile };
}

export async function persistSnapshot(snapshot: Snapshot, isoDate: string) {
  const store = new LocalSnapshotStore(DATA_DIR);
  await store.save("latest", snapshot);
  await store.save(isoDate, snapshot);

  const cfg = r2Config();
  if (cfg) {
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const { buildArchiveTarGz, buildArchiveFiles } = await import("../src/lib/archive");
    try {
      const r2 = new R2SnapshotStore();
      await r2.save(isoDate, snapshot);
      await r2.saveLatest(snapshot);

      const tarGz = await buildArchiveTarGz(snapshot);
      const files = await buildArchiveFiles(snapshot);
      const manifest = JSON.parse(files[1].content);
      const checksums = files[2].content;

      await r2.saveArchive(isoDate, tarGz);
      await r2.saveManifest(isoDate, manifest);
      await r2.saveChecksums(isoDate, checksums);

      console.log(`  Synced to R2 (bucket: ${cfg.bucket})`);
    } catch (err) {
      console.warn("  R2 sync skipped:", err instanceof Error ? err.message : String(err));
    }
  }
}

async function main() {
  const startTime = performance.now();
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("─".repeat(50));
  console.log("  PUBLIC INTERNET RECORD — SNAPSHOT GENERATION");
  console.log("─".repeat(50));
  console.log("");

  const fetchResults = await Promise.all(FEEDS.map((f) => fetchFeed(f)));

  let totalRaw = 0;
  let succeeded = 0;
  let failed = 0;

  for (const r of fetchResults) {
    totalRaw += r.items;
    if (r.ok) succeeded++;
    else failed++;
  }

  // Per-feed report
  for (let i = 0; i < FEEDS.length; i++) {
    const f = FEEDS[i];
    const r = fetchResults[i];
    if (r.ok) {
      console.log(
        `${f.source.padEnd(24)} ${String(r.items).padStart(4)} items  newest: ${formatAge(r.newestDate).padStart(10)}  fetch: ${formatDuration(r.fetchMs).padStart(7)}  parse: ${formatDuration(r.parseMs).padStart(6)}`,
      );
    } else {
      const reason = r.status ? `HTTP ${r.status}` : "error";
      console.log(
        `${f.source.padEnd(24)} ${"FAILED".padStart(10)}  (${reason}) fetch: ${formatDuration(r.fetchMs).padStart(7)}`,
      );
    }
  }

  console.log("");
  console.log("─".repeat(50));

  const allArticles: RawArticle[] = [];
  const failedSources: string[] = [];

  for (const r of fetchResults) {
    allArticles.push(...r.articles);
    if (!r.ok) failedSources.push(r.source);
  }

  let carriedOverArticles = 0;

  if (failedSources.length > 0) {
    const prev = await loadPreviousSnapshot();
    if (prev) {
      for (const source of failedSources) {
        const prevRecords = prev.records.filter((r) => r.publisher === source);
        if (prevRecords.length > 0) {
          carriedOverArticles += prevRecords.length;
          for (const rec of prevRecords) {
            allArticles.push({
              title: rec.title,
              description: rec.summary,
              link: rec.sourceUrl,
              published: rec.published,
              source: rec.publisher,
              country: rec.country,
              category: rec.category,
            });
          }
        }
      }
    }
  }

  // Deduplicate
  const { deduped: dedupedArticles, removed: duplicatesRemoved } = deduplicateArticles(allArticles);
  if (duplicatesRemoved > 0) {
    console.log(`\n  Duplicate URLs removed: ${duplicatesRemoved}`);
  }
  if (carriedOverArticles > 0) {
    console.log(`  Carried over from previous snapshot: ${carriedOverArticles}`);
  }

  console.log(`\n  Raw fetched:     ${String(allArticles.length).padStart(5)}`);
  console.log(`  Duplicates:      ${String(duplicatesRemoved).padStart(5)}`);
  console.log(`  After dedup:     ${String(dedupedArticles.length).padStart(5)}`);

  if (dedupedArticles.length === 0) {
    console.error("\n  No articles after deduplication. Cannot generate snapshot.");
    process.exit(1);
  }

  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const dateStr = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const generated = now.toISOString().slice(11, 19) + " UTC";
  const archivedAt = now.toISOString();

  const records = buildRecords(dedupedArticles, isoDate, archivedAt);
  const prevSnapshot = await loadPreviousSnapshot();
  const generationDurationMs = Math.round(performance.now() - startTime);
  const statistics = computeSnapshotStatistics(
    dedupedArticles,
    records,
    duplicatesRemoved + (allArticles.length - dedupedArticles.length),
    prevSnapshot,
    generationDurationMs,
    succeeded,
    failed,
    FEEDS.length,
  );

  const snapshot = buildSnapshot(records, isoDate, dateStr, generated, statistics);
  const files = writeSnapshotFiles(snapshot, isoDate);
  await persistSnapshot(snapshot, isoDate);

  console.log(`\n  Records:         ${String(records.length).padStart(5)}`);
  console.log(`  Sources:         ${String(snapshot.sources).padStart(5)}`);
  console.log(`  Countries:       ${String(snapshot.countries).padStart(5)}`);
  console.log(`  New records:     ${String(statistics.newRecords).padStart(5)}`);
  console.log(`  Carried over:    ${String(statistics.carriedOverRecords).padStart(5)}`);
  console.log(`  Removed:         ${String(statistics.removedRecords).padStart(5)}`);
  console.log(`  Duration:        ${formatDuration(generationDurationMs).padStart(5)}`);
  console.log(`  SHA-256:         ${snapshot.hash}`);
  console.log("");
  console.log(`  Snapshot: ${files.dateFile}`);
}

main().catch((err) => {
  console.error("Snapshot generation failed:", err);
  process.exit(1);
});
