import { createServerFn } from "@tanstack/react-start";
import { LRUCache } from "lru-cache";
import bundledSnapshot from "./snapshot-data";

export type Record = {
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
};

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

export type Snapshot = {
  date: string;
  isoDate: string;
  generated: string;
  articles: number;
  sources: number;
  countries: number;
  status: string;
  hash: string;
  records: Record[];
  statistics?: SnapshotStatistics;
};

export type SnapshotSummary = {
  isoDate: string;
  date: string;
  generated: string;
  articles: number;
  sources: number;
  hash: string;
  statistics?: {
    newRecords: number;
    carriedOverRecords: number;
    duplicatesRemoved: number;
    feedsSucceeded: number;
    feedsFailed: number;
    feedsTotal: number;
    generationDurationMs: number;
  };
};

const snapshotCache = new LRUCache<string, Snapshot>({
  max: 50,
  ttl: 1000 * 60 * 5,
});

const listCache = new LRUCache<string, SnapshotSummary[]>({
  max: 10,
  ttl: 1000 * 60 * 2,
});

export const getSnapshot = createServerFn({ method: "GET" }).handler(
  async () => bundledSnapshot satisfies Snapshot,
);

export async function fetchSnapshotList(): Promise<SnapshotSummary[]> {
  const cached = listCache.get("all");
  if (cached) return cached;

  try {
    const { R2SnapshotStore, r2Config } = await import("./storage");
    if (r2Config()) {
      const store = new R2SnapshotStore();
      const dates = await store.list();
      if (dates.length > 0) {
        const summaries: SnapshotSummary[] = [];
        for (const isoDate of dates) {
          const s = await getSnapshotByDate(isoDate);
          if (s) {
            const entry: SnapshotSummary = {
              isoDate: s.isoDate,
              date: s.date,
              generated: s.generated,
              articles: s.articles,
              sources: s.sources,
              hash: s.hash,
            };
            if (s.statistics) {
              entry.statistics = {
                newRecords: s.statistics.newRecords,
                carriedOverRecords: s.statistics.carriedOverRecords,
                duplicatesRemoved: s.statistics.duplicatesRemoved,
                feedsSucceeded: s.statistics.feedsSucceeded,
                feedsFailed: s.statistics.feedsFailed,
                feedsTotal: s.statistics.feedsTotal,
                generationDurationMs: s.statistics.generationDurationMs,
              };
            }
            summaries.push(entry);
          }
        }
        listCache.set("all", summaries);
        return summaries;
      }
    }
  } catch {
    // R2 not available, fall through
  }

  const fallbackEntry: SnapshotSummary = {
    isoDate: bundledSnapshot.isoDate,
    date: bundledSnapshot.date,
    generated: bundledSnapshot.generated,
    articles: bundledSnapshot.articles,
    sources: bundledSnapshot.sources,
    hash: bundledSnapshot.hash,
  };
  if (bundledSnapshot.statistics) {
    fallbackEntry.statistics = {
      newRecords: bundledSnapshot.statistics.newRecords,
      carriedOverRecords: bundledSnapshot.statistics.carriedOverRecords,
      duplicatesRemoved: bundledSnapshot.statistics.duplicatesRemoved,
      feedsSucceeded: bundledSnapshot.statistics.feedsSucceeded,
      feedsFailed: bundledSnapshot.statistics.feedsFailed,
      feedsTotal: bundledSnapshot.statistics.feedsTotal,
      generationDurationMs: bundledSnapshot.statistics.generationDurationMs,
    };
  }
  const fallback: SnapshotSummary[] = [fallbackEntry];
  return fallback;
}

export const getSnapshotList = createServerFn({ method: "GET" }).handler(async () =>
  fetchSnapshotList(),
);

export const getArchive = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { date: string })
  .handler(async ({ data }) => {
    let snapshot: Snapshot | null;
    if (!data.date || data.date === "latest") {
      snapshot = bundledSnapshot satisfies Snapshot;
    } else {
      snapshot = await getSnapshotByDate(data.date);
    }
    if (!snapshot) throw new Error("Snapshot not found");
    const { buildArchiveTarGz } = await import("./archive");
    const buf = await buildArchiveTarGz(snapshot);
    const base64 = buf.toString("base64");
    return { base64, isoDate: snapshot.isoDate };
  });

export async function getSnapshotByDate(date: string): Promise<Snapshot | null> {
  const cached = snapshotCache.get(date);
  if (cached) return cached;

  if (date === bundledSnapshot.isoDate) {
    snapshotCache.set(date, bundledSnapshot satisfies Snapshot);
    return bundledSnapshot satisfies Snapshot;
  }

  try {
    const { R2SnapshotStore, r2Config } = await import("./storage");
    if (r2Config()) {
      const store = new R2SnapshotStore();
      const snapshot = await store.load(date);
      if (snapshot) {
        snapshotCache.set(date, snapshot);
        return snapshot;
      }
    }
  } catch {
    // R2 not available, fall through
  }

  try {
    const { LocalSnapshotStore } = await import("./storage");
    const { ROOT } = await import("../../scripts/generate-snapshot");
    const { resolve } = await import("node:path");
    const store = new LocalSnapshotStore(resolve(ROOT, "data"));
    const snapshot = await store.load(date);
    if (snapshot) {
      snapshotCache.set(date, snapshot);
      return snapshot;
    }
  } catch {
    // Not found
  }

  return null;
}
