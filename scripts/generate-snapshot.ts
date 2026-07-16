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
}

const FEEDS = [
  {
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    source: "BBC News",
    country: "United Kingdom",
    category: "News",
  },
  {
    url: "https://www.nasa.gov/feed/",
    source: "NASA",
    country: "United States",
    category: "Science",
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
    url: "https://www.sciencedaily.com/rss/all.xml",
    source: "ScienceDaily",
    country: "United States",
    category: "Science",
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

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<FetchResult> {
  try {
    const response = await fetch(feed.url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "PublicInternetRecord/1.0 (archival bot)" },
    });
    if (!response.ok) {
      console.warn(`  [${response.status}] ${feed.source}`);
      return { articles: [], ok: false, source: feed.source };
    }
    const xml = await response.text();
    return { articles: parseFeedItems(xml, feed), ok: true, source: feed.source };
  } catch (err) {
    console.warn(`  [error] ${feed.source}: ${err instanceof Error ? err.message : String(err)}`);
    return { articles: [], ok: false, source: feed.source };
  }
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
): Snapshot {
  const sourceSet = new Set(records.map((r) => r.publisher));
  const countrySet = new Set(records.map((r) => r.country));

  const recordsJson = JSON.stringify(records, null, 2);
  const snapshotHash = sha256(recordsJson);

  return {
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
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Fetching RSS feeds...");
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f)));

  const allArticles: RawArticle[] = [];
  const failedSources: string[] = [];

  for (const r of results) {
    allArticles.push(...r.articles);
    if (!r.ok) failedSources.push(r.source);
  }

  if (failedSources.length > 0) {
    console.log(`\n${failedSources.length} feed(s) failed: ${failedSources.join(", ")}`);
    const prev = await loadPreviousSnapshot();
    if (prev) {
      for (const source of failedSources) {
        const prevRecords = prev.records.filter((r) => r.publisher === source);
        if (prevRecords.length > 0) {
          console.log(`  Rolling over ${prevRecords.length} records from ${source}`);
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

  console.log(`\nTotal articles fetched: ${allArticles.length}`);

  if (allArticles.length === 0) {
    console.error("No articles fetched from any source. Cannot generate snapshot.");
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

  const records = buildRecords(allArticles, isoDate, archivedAt);
  const snapshot = buildSnapshot(records, isoDate, dateStr, generated);
  const files = writeSnapshotFiles(snapshot, isoDate);
  await persistSnapshot(snapshot, isoDate);

  console.log(`\nSnapshot saved to:`);
  console.log(`  ${files.dateFile}`);
  console.log(`  ${files.latestFile}`);
  console.log(`  ${files.tsFile}`);
  console.log(`\nSummary:`);
  console.log(`  Date:       ${dateStr}`);
  console.log(`  Records:    ${records.length}`);
  console.log(`  Sources:    ${snapshot.sources}`);
  console.log(`  Countries:  ${snapshot.countries}`);
  console.log(`  SHA-256:    ${snapshot.hash}`);
}

main().catch((err) => {
  console.error("Snapshot generation failed:", err);
  process.exit(1);
});
