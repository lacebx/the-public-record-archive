import { describe, it, expect } from "vitest";
import type { Record } from "../../src/lib/data";
import {
  buildTimelineTitle,
  computeTimelineFromCluster,
  buildTimelines,
  getTimelines,
  getTimeline,
  getLargestTimelines,
  getNewestTimelines,
  getOldestTimelines,
  getTimelineStats,
} from "../../src/lib/timelines";

function makeRecord(overrides: Partial<Record> & { id: string }): Record {
  return {
    id: overrides.id,
    publisher: overrides.publisher ?? "Test Pub",
    title: overrides.title ?? "Test Title",
    published: overrides.published ?? "2026-07-17T10:00:00Z",
    archived: overrides.archived ?? "2026-07-17T12:00:00Z",
    status: "VERIFIED",
    hash: overrides.hash ?? "abc123",
    summary: overrides.summary ?? "Test summary content here",
    sourceUrl: overrides.sourceUrl ?? "https://example.com/test",
    country: overrides.country ?? "United States",
    category: overrides.category ?? "News",
  };
}

describe("buildTimelineTitle", () => {
  it("uses top 3 most common significant words", () => {
    const records = [
      {
        recordId: "R1",
        title: "President signs climate bill into law",
        publisher: "BBC",
        published: "2026-07-17T10:00:00Z",
        archived: "2026-07-17T12:00:00Z",
      },
      {
        recordId: "R2",
        title: "President celebrates climate legislation",
        publisher: "CNN",
        published: "2026-07-17T12:00:00Z",
        archived: "2026-07-17T14:00:00Z",
      },
      {
        recordId: "R3",
        title: "Climate bill passes Senate committee",
        publisher: "NPR",
        published: "2026-07-17T14:00:00Z",
        archived: "2026-07-17T16:00:00Z",
      },
    ];
    const title = buildTimelineTitle(records);
    expect(title).toContain("Climate");
    expect(title).toContain("President");
  });

  it("returns fallback for records with no significant words", () => {
    const records = [
      {
        recordId: "R1",
        title: "A",
        publisher: "BBC",
        published: "2026-07-17T10:00:00Z",
        archived: "2026-07-17T12:00:00Z",
      },
    ];
    const title = buildTimelineTitle(records);
    expect(title).toContain("R1");
  });
});

describe("computeTimelineFromCluster", () => {
  it("returns null for a cluster smaller than minimum size", () => {
    const cluster = [makeRecord({ id: "R1" })];
    const tl = computeTimelineFromCluster(cluster, 0);
    expect(tl).toBeNull();
  });

  it("creates a timeline from a cluster of related records", () => {
    const cluster = [
      makeRecord({
        id: "R1",
        publisher: "BBC",
        category: "News",
        title: "Storm warning",
        published: "2026-07-17T10:00:00Z",
      }),
      makeRecord({
        id: "R2",
        publisher: "BBC",
        category: "News",
        title: "Storm damage",
        published: "2026-07-17T12:00:00Z",
      }),
      makeRecord({
        id: "R3",
        publisher: "BBC",
        category: "News",
        title: "Storm recovery",
        published: "2026-07-17T14:00:00Z",
      }),
    ];
    const tl = computeTimelineFromCluster(cluster, 0);
    expect(tl).not.toBeNull();
    if (tl) {
      expect(tl.id).toBe("TL-0001");
      expect(tl.recordCount).toBe(3);
      expect(tl.publishers).toEqual(["BBC"]);
      expect(tl.earliestPublished).toBe("2026-07-17T10:00:00Z");
      expect(tl.latestPublished).toBe("2026-07-17T14:00:00Z");
      expect(tl.relationshipTypes).toContain("same publisher");
      expect(tl.avgScore).toBeGreaterThan(0);
    }
  });

  it("sorts records chronologically by published date", () => {
    const cluster = [
      makeRecord({ id: "R1", publisher: "BBC", title: "Third", published: "2026-07-17T14:00:00Z" }),
      makeRecord({ id: "R2", publisher: "BBC", title: "First", published: "2026-07-17T10:00:00Z" }),
      makeRecord({
        id: "R3",
        publisher: "BBC",
        title: "Second",
        published: "2026-07-17T12:00:00Z",
      }),
    ];
    const tl = computeTimelineFromCluster(cluster, 0);
    expect(tl?.records[0].title).toBe("First");
    expect(tl?.records[1].title).toBe("Second");
    expect(tl?.records[2].title).toBe("Third");
  });
});

describe("buildTimelines", () => {
  it("returns empty timelines for unrelated records", () => {
    const records = [
      makeRecord({ id: "R1", publisher: "BBC", title: "Sports results", category: "Sports" }),
      makeRecord({ id: "R2", publisher: "CNN", title: "Tech news", category: "Technology" }),
      makeRecord({ id: "R3", publisher: "NPR", title: "Weather forecast", category: "Weather" }),
    ];
    const result = buildTimelines(records);
    expect(result.totalTimelines).toBe(0);
    expect(result.totalRecordsInTimelines).toBe(0);
  });

  it("clusters strongly related records into a timeline", () => {
    const records = [
      makeRecord({
        id: "R1",
        publisher: "BBC",
        category: "News",
        title: "Election results announced",
        published: "2026-07-17T10:00:00Z",
      }),
      makeRecord({
        id: "R2",
        publisher: "BBC",
        category: "News",
        title: "Election analysis and reaction",
        published: "2026-07-17T12:00:00Z",
      }),
      makeRecord({
        id: "R3",
        publisher: "CNN",
        category: "News",
        title: "Election results coverage",
        published: "2026-07-17T11:00:00Z",
      }),
    ];
    const result = buildTimelines(records);
    expect(result.totalTimelines).toBeGreaterThan(0);
  });

  it("creates separate timelines for distinct stories", () => {
    const records = [
      makeRecord({
        id: "R1",
        publisher: "BBC",
        category: "News",
        title: "Election results",
        published: "2026-07-17T10:00:00Z",
      }),
      makeRecord({
        id: "R2",
        publisher: "BBC",
        category: "News",
        title: "Election reaction",
        published: "2026-07-17T12:00:00Z",
      }),
      makeRecord({
        id: "R3",
        publisher: "NPR",
        category: "Sports",
        title: "World Cup final",
        published: "2026-07-17T10:00:00Z",
      }),
      makeRecord({
        id: "R4",
        publisher: "NPR",
        category: "Sports",
        title: "World Cup highlights",
        published: "2026-07-17T14:00:00Z",
      }),
    ];
    const result = buildTimelines(records);
    expect(result.totalTimelines).toBe(2);
  });

  it("handles empty record array", () => {
    const result = buildTimelines([]);
    expect(result.totalTimelines).toBe(0);
    expect(result.timelines).toEqual([]);
  });

  it("handles single record", () => {
    const records = [makeRecord({ id: "R1" })];
    const result = buildTimelines(records);
    expect(result.totalTimelines).toBe(0);
  });

  it("prefers false negatives over false positives with weak connections", () => {
    const records = [
      makeRecord({
        id: "R1",
        publisher: "BBC",
        category: "News",
        title: "Weather update",
        published: "2026-07-17T10:00:00Z",
      }),
      makeRecord({
        id: "R2",
        publisher: "CNN",
        category: "Sports",
        title: "Football match",
        published: "2026-07-20T10:00:00Z",
      }),
    ];
    const result = buildTimelines(records);
    expect(result.totalTimelines).toBe(0);
  });
});

describe("cached accessors", () => {
  it("getTimelines returns cached data", { timeout: 60000 }, () => {
    const result = getTimelines();
    expect(result).toHaveProperty("timelines");
    expect(result).toHaveProperty("totalTimelines");
    expect(result).toHaveProperty("totalRecordsInTimelines");
  });

  it("getTimeline returns null for unknown id", () => {
    expect(getTimeline("TL-NONEXISTENT")).toBeNull();
  });

  it("getLargestTimelines returns sorted by record count", () => {
    const result = getLargestTimelines(3);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].recordCount).toBeGreaterThanOrEqual(result[i].recordCount);
    }
  });

  it("getNewestTimelines returns sorted by latest published", () => {
    const result = getNewestTimelines(3);
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i - 1].latestPublished).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i].latestPublished).getTime(),
      );
    }
  });

  it("getOldestTimelines returns sorted ascending", () => {
    const result = getOldestTimelines(3);
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i - 1].latestPublished).getTime()).toBeLessThanOrEqual(
        new Date(result[i].latestPublished).getTime(),
      );
    }
  });
});

describe("getTimelineStats", () => {
  it("returns all required fields", () => {
    const stats = getTimelineStats();
    expect(stats).toHaveProperty("largestStories");
    expect(stats).toHaveProperty("mostActivePublishers");
    expect(stats).toHaveProperty("longestRunningTimelines");
    expect(stats).toHaveProperty("newestTimelines");
    expect(Array.isArray(stats.largestStories)).toBe(true);
    expect(Array.isArray(stats.mostActivePublishers)).toBe(true);
  });

  it("mostActivePublishers includes name and counts", () => {
    const stats = getTimelineStats();
    for (const p of stats.mostActivePublishers) {
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("timelineCount");
      expect(p).toHaveProperty("totalRecords");
      expect(typeof p.name).toBe("string");
      expect(typeof p.timelineCount).toBe("number");
    }
  });
});
