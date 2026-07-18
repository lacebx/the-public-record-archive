import type { Record } from "./data";
import bundledSnapshot from "./snapshot-data";
import {
  computeRelationship,
  extractSignificantWords,
  precomputeFeatures,
  type Relationship,
  type RelationshipType,
  type PrecomputedFeatures,
} from "./related";

export type TimelineRecord = {
  recordId: string;
  title: string;
  publisher: string;
  published: string;
  archived: string;
};

export type Timeline = {
  id: string;
  title: string;
  records: TimelineRecord[];
  recordCount: number;
  publishers: string[];
  earliestPublished: string;
  latestPublished: string;
  firstArchived: string;
  latestArchived: string;
  relationshipTypes: RelationshipType[];
  avgScore: number;
};

export type TimelinesData = {
  timelines: Timeline[];
  totalTimelines: number;
  totalRecordsInTimelines: number;
};

const MIN_TIMELINE_SCORE = 40;
const MIN_TIMELINE_SIZE = 2;

export function buildTimelineTitle(records: TimelineRecord[]): string {
  const wordCounts = new Map<string, number>();
  for (const r of records) {
    const words = extractSignificantWords(r.title);
    for (const w of words) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
  }
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
  return sorted.length > 0 ? sorted.join(" / ") : `Timeline ${records[0]?.recordId || "unknown"}`;
}

export function computeTimelineFromCluster(
  cluster: Record[],
  clusterIndex: number,
): Timeline | null {
  if (cluster.length < MIN_TIMELINE_SIZE) return null;

  let totalScore = 0;
  let pairCount = 0;
  const typeSet = new Set<RelationshipType>();

  for (let i = 0; i < cluster.length; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      const rel = computeRelationship(cluster[i], cluster[j]);
      if (rel) {
        totalScore += rel.score;
        pairCount++;
        typeSet.add(rel.type);
      }
    }
  }

  const records: TimelineRecord[] = cluster.map((r) => ({
    recordId: r.id,
    title: r.title,
    publisher: r.publisher,
    published: r.published,
    archived: r.archived,
  }));

  records.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());

  const publishers = Array.from(new Set(records.map((r) => r.publisher))).sort();

  return {
    id: `TL-${String(clusterIndex + 1).padStart(4, "0")}`,
    title: buildTimelineTitle(records),
    records,
    recordCount: records.length,
    publishers,
    earliestPublished: records[0].published,
    latestPublished: records[records.length - 1].published,
    firstArchived: records.reduce(
      (earliest, r) => (r.archived < earliest ? r.archived : earliest),
      records[0].archived,
    ),
    latestArchived: records.reduce(
      (latest, r) => (r.archived > latest ? r.archived : latest),
      records[0].archived,
    ),
    relationshipTypes: Array.from(typeSet),
    avgScore: pairCount > 0 ? Math.round(totalScore / pairCount) : 0,
  };
}

export function buildTimelines(records: Record[]): TimelinesData {
  const n = records.length;
  const features: PrecomputedFeatures[] = records.map(precomputeFeatures);
  const adjacency: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const rel = computeRelationship(records[i], records[j], features[i], features[j]);
      if (rel && rel.score >= MIN_TIMELINE_SCORE) {
        adjacency[i].push(j);
        adjacency[j].push(i);
      }
    }
  }

  const visited = new Array(n).fill(false);
  const clusters: Record[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const stack = [i];
    const cluster: Record[] = [];
    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited[idx]) continue;
      visited[idx] = true;
      cluster.push(records[idx]);
      for (const neighbor of adjacency[idx]) {
        if (!visited[neighbor]) stack.push(neighbor);
      }
    }
    if (cluster.length >= MIN_TIMELINE_SIZE) {
      clusters.push(cluster);
    }
  }

  const timelines = clusters
    .map((c, i) => computeTimelineFromCluster(c, i))
    .filter((t): t is Timeline => t !== null)
    .sort((a, b) => new Date(b.latestPublished).getTime() - new Date(a.latestPublished).getTime());

  const totalRecordsInTimelines = timelines.reduce((s, t) => s + t.recordCount, 0);

  return { timelines, totalTimelines: timelines.length, totalRecordsInTimelines };
}

let cachedTimelines: TimelinesData | null = null;

export function getTimelines(refresh = false): TimelinesData {
  if (!cachedTimelines || refresh) {
    cachedTimelines = buildTimelines(bundledSnapshot.records);
  }
  return cachedTimelines;
}

export function getTimeline(id: string): Timeline | null {
  const data = getTimelines();
  return data.timelines.find((t) => t.id === id) ?? null;
}

export function getLargestTimelines(limit = 5): Timeline[] {
  return getTimelines()
    .timelines.slice()
    .sort((a, b) => b.recordCount - a.recordCount)
    .slice(0, limit);
}

export function getNewestTimelines(limit = 5): Timeline[] {
  return getTimelines()
    .timelines.slice()
    .sort((a, b) => new Date(b.latestPublished).getTime() - new Date(a.latestPublished).getTime())
    .slice(0, limit);
}

export function getOldestTimelines(limit = 5): Timeline[] {
  return getTimelines()
    .timelines.slice()
    .sort((a, b) => new Date(a.latestPublished).getTime() - new Date(b.latestPublished).getTime())
    .slice(0, limit);
}

export function getLongestRunningTimelines(limit = 5): Timeline[] {
  return getTimelines()
    .timelines.slice()
    .sort((a, b) => {
      const spanA = new Date(b.latestPublished).getTime() - new Date(a.earliestPublished).getTime();
      const spanB = new Date(b.latestPublished).getTime() - new Date(a.earliestPublished).getTime();
      return spanB - spanA;
    })
    .slice(0, limit);
}

export function getTimelineStats(): {
  largestStories: Timeline[];
  mostActivePublishers: { name: string; timelineCount: number; totalRecords: number }[];
  longestRunningTimelines: Timeline[];
  newestTimelines: Timeline[];
} {
  const data = getTimelines();

  const publisherMap = new Map<string, { timelineCount: number; totalRecords: number }>();
  for (const t of data.timelines) {
    for (const p of t.publishers) {
      const entry = publisherMap.get(p) || { timelineCount: 0, totalRecords: 0 };
      entry.timelineCount++;
      entry.totalRecords += t.recordCount;
      publisherMap.set(p, entry);
    }
  }

  const mostActivePublishers = Array.from(publisherMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalRecords - a.totalRecords)
    .slice(0, 5);

  return {
    largestStories: getLargestTimelines(5),
    mostActivePublishers,
    longestRunningTimelines: getLongestRunningTimelines(5),
    newestTimelines: getNewestTimelines(5),
  };
}
