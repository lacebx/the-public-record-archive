import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { XMLParser } from "fast-xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, "data");

interface RawArticle {
  title: string;
  description: string;
  link: string;
  published: string;
  source: string;
  country: string;
  category: string;
}

interface Record {
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
  records: Record[];
}

const FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC News", country: "United Kingdom", category: "News" },
  { url: "https://www.nasa.gov/feed/", source: "NASA", country: "United States", category: "Science" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", source: "The New York Times", country: "United States", category: "News" },
  { url: "https://feeds.npr.org/1001/rss.xml", source: "NPR", country: "United States", category: "News" },
  { url: "https://www.wired.com/feed/rss", source: "Wired", country: "United States", category: "Technology" },
  { url: "https://arstechnica.com/feed/", source: "Ars Technica", country: "United States", category: "Technology" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian", country: "United Kingdom", category: "News" },
  { url: "https://www.spiegel.de/schlagzeilen/tops/index.rss", source: "Der Spiegel", country: "Germany", category: "News" },
  { url: "https://www.lemonde.fr/rss/une.xml", source: "Le Monde", country: "France", category: "News" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", country: "Qatar", category: "News" },
  { url: "https://www.sciencedaily.com/rss/all.xml", source: "ScienceDaily", country: "United States", category: "Science" },
];

function extractText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    if (typeof o._ === "string") return o._;
    if (typeof o["#text"] === "string") return o["#text"];
  }
  return String(val);
}

function extractLink(item: Record<string, unknown>): string {
  const link = item.link;
  if (!link) return "";
  if (typeof link === "string") return link;
  if (typeof link === "object" && link !== null) {
    const l = link as Record<string, unknown>;
    if (l.$ && typeof l.$ === "object" && typeof (l.$ as Record<string, unknown>).href === "string") {
      return (l.$ as Record<string, unknown>).href as string;
    }
    if (typeof l._ === "string") return l._;
  }
  return "";
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

async function fetchFeed(feed: typeof FEEDS[number]): Promise<RawArticle[]> {
  try {
    const response = await fetch(feed.url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "PublicInternetRecord/1.0 (archival bot)" },
    });
    if (!response.ok) {
      console.warn(`  [${response.status}] ${feed.source}`);
      return [];
    }
    const xml = await response.text();
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
      const description = extractText(item["content:encoded"]) || extractText(item.description) || extractText(item.summary);
      const link = extractLink(item);
      const pubDate = extractText(item.pubDate) || extractText(item["dc:date"]) || extractText(item.published) || extractText(item.updated);

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
    console.log(`  ${articles.length} articles from ${feed.source}`);
    return articles;
  } catch (err) {
    console.warn(`  [error] ${feed.source}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf-8").digest("hex");
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Fetching RSS feeds...");
  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f)));
  const allArticles: RawArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allArticles.push(...r.value);
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

  const records: Record[] = allArticles.map((a, i) => {
    const id = `REC-${isoDate}-${String(i + 1).padStart(6, "0")}`;
    const hashSource = `${id}|${a.title}|${a.description}|${a.link}|${a.source}|${now.toISOString()}`;
    const hash = sha256(hashSource);
    return {
      id,
      publisher: a.source,
      title: a.title,
      published: a.published,
      archived: now.toISOString(),
      status: "VERIFIED" as const,
      hash,
      summary: a.description.slice(0, 1000),
      sourceUrl: a.link,
      country: a.country,
      category: a.category,
    };
  });

  const sourceSet = new Set(records.map((r) => r.publisher));
  const countrySet = new Set(records.map((r) => r.country));
  const categorySet = new Set(records.map((r) => r.category));

  const recordsJson = JSON.stringify(records, null, 2);
  const snapshotHash = sha256(recordsJson);

  const snapshot: Snapshot = {
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

  // Write JSON data files
  const dateFile = resolve(DATA_DIR, `${isoDate}.json`);
  const latestFile = resolve(DATA_DIR, "latest.json");
  writeFileSync(dateFile, JSON.stringify(snapshot, null, 2), "utf-8");
  writeFileSync(latestFile, JSON.stringify(snapshot, null, 2), "utf-8");

  // Generate a TypeScript module so the app never needs filesystem access at runtime
  const tsFile = resolve(ROOT, "src", "lib", "snapshot-data.ts");
  const tsContent = `// Auto-generated by scripts/generate-snapshot.ts — do not edit
import type { Snapshot } from "./data";

const data: Snapshot = ${JSON.stringify(snapshot, null, 2)};

export default data;
`;
  writeFileSync(tsFile, tsContent, "utf-8");

  console.log(`\nSnapshot saved to:`);
  console.log(`  ${dateFile}`);
  console.log(`  ${latestFile}`);
  console.log(`  ${tsFile}`);
  console.log(`\nSummary:`);
  console.log(`  Date:       ${dateStr}`);
  console.log(`  Records:    ${records.length}`);
  console.log(`  Sources:    ${sourceSet.size}`);
  console.log(`  Countries:  ${countrySet.size}`);
  console.log(`  Categories: ${[...categorySet].join(", ")}`);
  console.log(`  SHA-256:    ${snapshotHash}`);
}

main().catch((err) => {
  console.error("Snapshot generation failed:", err);
  process.exit(1);
});
