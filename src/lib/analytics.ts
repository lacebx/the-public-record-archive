import type { Record } from "./data";
import { fetchSnapshotList } from "./data";
import bundledSnapshot from "./snapshot-data";
import { getTimelineStats, getTimelines, type Timeline } from "./timelines";

export type PublisherBreakdown = {
  name: string;
  count: number;
  pct: number;
};

export type CategoryBreakdown = {
  name: string;
  count: number;
  pct: number;
};

export type CountryBreakdown = {
  name: string;
  count: number;
  pct: number;
};

export type TimeSeriesPoint = {
  date: string;
  isoDate: string;
  records: number;
  sources: number;
  countries: number;
  newRecords?: number;
  carriedOver?: number;
};

export type AnalyticsData = {
  timeSeries: TimeSeriesPoint[];
  publishers: PublisherBreakdown[];
  categories: CategoryBreakdown[];
  countries: CountryBreakdown[];
  totalSnapshots: number;
  totalRecords: number;
  totalUniqueSources: number;
  oldestDate: string;
  newestDate: string;
  sourceHealth?: {
    feedsSucceeded: number;
    feedsFailed: number;
    feedsTotal: number;
    pctSuccess: number;
  };
  timelineStats?: {
    totalTimelines: number;
    totalRecordsInTimelines: number;
    largestStories: Timeline[];
    mostActivePublishers: { name: string; timelineCount: number; totalRecords: number }[];
    longestRunningTimelines: Timeline[];
    newestTimelines: Timeline[];
  };
};

export function computePublishers(records: Record[]): PublisherBreakdown[] {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.publisher, (map.get(r.publisher) || 0) + 1);
  }
  const total = records.length;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function computeCategories(records: Record[]): CategoryBreakdown[] {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.category, (map.get(r.category) || 0) + 1);
  }
  const total = records.length;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function computeCountries(records: Record[]): CountryBreakdown[] {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.country, (map.get(r.country) || 0) + 1);
  }
  const total = records.length;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export async function computeAnalytics(): Promise<AnalyticsData> {
  const summaries = await fetchSnapshotList();

  const timeSeries: TimeSeriesPoint[] = summaries.map((s) => ({
    date: s.date,
    isoDate: s.isoDate,
    records: s.articles,
    sources: s.sources,
    countries: 0,
    newRecords: s.statistics?.newRecords,
    carriedOver: s.statistics?.carriedOverRecords,
  }));

  const latestRecords = bundledSnapshot.records;
  const publishers = computePublishers(latestRecords);
  const categories = computeCategories(latestRecords);
  const countries = computeCountries(latestRecords);

  const totalRecords = summaries.reduce((sum, s) => sum + s.articles, 0);

  const newestSummary = summaries[summaries.length - 1];

  let sourceHealth: AnalyticsData["sourceHealth"];
  if (newestSummary?.statistics) {
    const st = newestSummary.statistics;
    sourceHealth = {
      feedsSucceeded: st.feedsSucceeded,
      feedsFailed: st.feedsFailed,
      feedsTotal: st.feedsTotal,
      pctSuccess: st.feedsTotal > 0 ? Math.round((st.feedsSucceeded / st.feedsTotal) * 100) : 0,
    };
  }

  const timelineStatsData = getTimelineStats();

  return {
    timeSeries,
    publishers,
    categories,
    countries,
    totalSnapshots: summaries.length,
    totalRecords,
    totalUniqueSources: publishers.length,
    oldestDate: summaries[0]?.isoDate ?? bundledSnapshot.isoDate,
    newestDate: bundledSnapshot.isoDate,
    sourceHealth,
    timelineStats: {
      totalTimelines: getTimelines().totalTimelines,
      totalRecordsInTimelines: getTimelines().totalRecordsInTimelines,
      largestStories: timelineStatsData.largestStories,
      mostActivePublishers: timelineStatsData.mostActivePublishers,
      longestRunningTimelines: timelineStatsData.longestRunningTimelines,
      newestTimelines: timelineStatsData.newestTimelines,
    },
  };
}
