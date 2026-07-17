import { describe, it, expect } from "vitest";
import {
  computeDiff,
  stableRecordKey,
  paginateDiffRecords,
  type DiffRecord,
} from "../src/lib/diff";
import type { Snapshot, Record } from "../src/lib/data";
import bundledSnapshot from "../src/lib/snapshot-data";

function makeRecord(overrides: Partial<Record> & { id: string; sourceUrl: string }): Record {
  return {
    publisher: "Test Publisher",
    title: "Test Article",
    published: "2026-07-16T00:00:00Z",
    archived: "2026-07-16T01:00:00Z",
    status: "VERIFIED",
    hash: "a".repeat(64),
    summary: "Test summary",
    country: "US",
    category: "News",
    ...overrides,
  };
}

function makeSnapshot(isoDate: string, records: Record[], overrides?: Partial<Snapshot>): Snapshot {
  return {
    date: "July 16, 2026",
    isoDate,
    generated: "2026-07-16T00:00:00Z",
    articles: records.length,
    sources: new Set(records.map((r) => r.publisher)).size,
    countries: new Set(records.map((r) => r.country)).size,
    status: "VERIFIED",
    hash: "b".repeat(64),
    records,
    ...overrides,
  };
}

describe("stableRecordKey", () => {
  it("uses sourceUrl when available", () => {
    const r = makeRecord({ id: "REC-1", sourceUrl: "https://example.com/article" });
    expect(stableRecordKey(r)).toBe("https://example.com/article");
  });

  it("falls back to publisher|||title when sourceUrl is empty", () => {
    const r = makeRecord({ id: "REC-1", sourceUrl: "", title: "My Title", publisher: "My Pub" });
    expect(stableRecordKey(r)).toBe("My Pub|||My Title");
  });
});

describe("computeDiff", () => {
  it("returns all unchanged for identical snapshots", () => {
    const records = [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
      makeRecord({ id: "REC-2", sourceUrl: "https://example.com/2" }),
    ];
    const from = makeSnapshot("2026-07-15", records);
    const to = makeSnapshot("2026-07-16", records);
    const result = computeDiff(from, to);

    expect(result.summary.unchanged).toBe(2);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.modified).toBe(0);
    expect(result.unchanged).toHaveLength(2);
  });

  it("detects added records", () => {
    const fromRecords = [makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" })];
    const toRecords = [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
      makeRecord({ id: "REC-2", sourceUrl: "https://example.com/2" }),
    ];
    const from = makeSnapshot("2026-07-15", fromRecords);
    const to = makeSnapshot("2026-07-16", toRecords);
    const result = computeDiff(from, to);

    expect(result.summary.added).toBe(1);
    expect(result.summary.unchanged).toBe(1);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].record.id).toBe("REC-2");
  });

  it("detects removed records", () => {
    const fromRecords = [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
      makeRecord({ id: "REC-2", sourceUrl: "https://example.com/2" }),
    ];
    const toRecords = [makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" })];
    const from = makeSnapshot("2026-07-15", fromRecords);
    const to = makeSnapshot("2026-07-16", toRecords);
    const result = computeDiff(from, to);

    expect(result.summary.removed).toBe(1);
    expect(result.summary.unchanged).toBe(1);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].record.id).toBe("REC-2");
  });

  it("detects modified records (different hash)", () => {
    const fromRecords = [
      makeRecord({
        id: "REC-1",
        sourceUrl: "https://example.com/1",
        hash: "a".repeat(64),
        title: "Original Title",
      }),
    ];
    const toRecords = [
      makeRecord({
        id: "REC-1",
        sourceUrl: "https://example.com/1",
        hash: "b".repeat(64),
        title: "Updated Title",
      }),
    ];
    const from = makeSnapshot("2026-07-15", fromRecords);
    const to = makeSnapshot("2026-07-16", toRecords);
    const result = computeDiff(from, to);

    expect(result.summary.modified).toBe(1);
    expect(result.summary.unchanged).toBe(0);
    expect(result.modified).toHaveLength(1);
    expect(result.modified[0].record.title).toBe("Updated Title");
  });

  it("reports field-level changes for modified records", () => {
    const fromRecords = [
      makeRecord({
        id: "REC-1",
        sourceUrl: "https://example.com/1",
        hash: "a".repeat(64),
        title: "Original",
        summary: "Old summary",
        publisher: "Pub A",
        category: "Tech",
      }),
    ];
    const toRecords = [
      makeRecord({
        id: "REC-1",
        sourceUrl: "https://example.com/1",
        hash: "b".repeat(64),
        title: "Updated",
        summary: "New summary",
        publisher: "Pub B",
        category: "Science",
      }),
    ];
    const from = makeSnapshot("2026-07-15", fromRecords);
    const to = makeSnapshot("2026-07-16", toRecords);
    const result = computeDiff(from, to);

    expect(result.modified).toHaveLength(1);
    const changes = result.modified[0].fieldChanges!;
    const changeFields = changes.map((c) => c.field);
    expect(changeFields).toContain("title");
    expect(changeFields).toContain("summary");
    expect(changeFields).toContain("publisher");
    expect(changeFields).toContain("category");
    expect(changeFields).toContain("hash");

    const titleChange = changes.find((c) => c.field === "title")!;
    expect(titleChange.from).toBe("Original");
    expect(titleChange.to).toBe("Updated");
  });

  it("handles large synthetic dataset", () => {
    const count = 500;
    const fromRecords: Record[] = [];
    const toRecords: Record[] = [];

    for (let i = 0; i < count; i++) {
      fromRecords.push(
        makeRecord({
          id: `REC-FROM-${i}`,
          sourceUrl: `https://example.com/${i}`,
          hash: `a${String(i).padStart(63, "0")}`,
        }),
      );
      toRecords.push(
        makeRecord({
          id: `REC-TO-${i}`,
          sourceUrl: `https://example.com/${i}`,
          hash: i % 2 === 0 ? `a${String(i).padStart(63, "0")}` : `b${String(i).padStart(63, "0")}`,
          title: i % 3 === 0 ? `Updated ${i}` : `Article ${i}`,
        }),
      );
    }

    const from = makeSnapshot("2026-07-15", fromRecords);
    const to = makeSnapshot("2026-07-16", toRecords);
    const result = computeDiff(from, to);

    expect(result.summary.unchanged + result.summary.modified).toBe(count);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
  });

  it("handles added, removed, and modified simultaneously", () => {
    const common = makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" });
    const fromRecords = [common, makeRecord({ id: "REC-2", sourceUrl: "https://example.com/2" })];
    const toRecords = [
      { ...common, hash: "c".repeat(64) },
      makeRecord({ id: "REC-3", sourceUrl: "https://example.com/3" }),
    ];
    const from = makeSnapshot("2026-07-15", fromRecords);
    const to = makeSnapshot("2026-07-16", toRecords);
    const result = computeDiff(from, to);

    expect(result.summary.modified).toBe(1);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.added).toBe(1);
  });

  it("correctly reports from and to dates", () => {
    const records = [makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" })];
    const from = makeSnapshot("2026-07-15", records);
    const to = makeSnapshot("2026-07-16", records);
    const result = computeDiff(from, to);

    expect(result.from).toBe("2026-07-15");
    expect(result.to).toBe("2026-07-16");
  });
});

describe("paginateDiffRecords", () => {
  const records: DiffRecord[] = Array.from({ length: 10 }, (_, i) => ({
    record: makeRecord({ id: `REC-${i}`, sourceUrl: `https://example.com/${i}` }),
    changeType: "added" as const,
  }));

  it("returns all items when no pagination params", () => {
    const result = paginateDiffRecords(records);
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(10);
  });

  it("applies limit", () => {
    const result = paginateDiffRecords(records, 3);
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(10);
  });

  it("applies offset and limit", () => {
    const result = paginateDiffRecords(records, 3, 5);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].record.id).toBe("REC-5");
  });
});

describe("getDiff (integration with bundled snapshot)", () => {
  it("returns full unchanged diff against itself", async () => {
    const { getDiff } = await import("../src/lib/diff");
    const [r1, r2] = bundledSnapshot.records.slice(0, 2);
    // Use a stable key that will match
    const result = await getDiff(bundledSnapshot.isoDate, bundledSnapshot.isoDate);
    expect(result).not.toBeNull();
    expect(result!.summary.unchanged).toBe(bundledSnapshot.articles);
    expect(result!.summary.added).toBe(0);
    expect(result!.summary.removed).toBe(0);
    expect(result!.summary.modified).toBe(0);
  });

  it("returns null for unknown dates", async () => {
    const { getDiff } = await import("../src/lib/diff");
    const result = await getDiff("1999-01-01", bundledSnapshot.isoDate);
    expect(result).toBeNull();
  });
});

describe("stableRecordKey deduplication", () => {
  it("matches both records sharing a sourceUrl when both present", () => {
    const from = makeSnapshot("2026-07-15", [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
      makeRecord({ id: "REC-2", sourceUrl: "https://example.com/1" }),
    ]);
    const to = makeSnapshot("2026-07-16", [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
      makeRecord({ id: "REC-2", sourceUrl: "https://example.com/1", hash: "b".repeat(64) }),
    ]);
    const result = computeDiff(from, to);

    expect(result.summary.unchanged).toBe(1);
    expect(result.summary.modified).toBe(1);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
  });

  it("marks as added when a duplicate-key record appears only in to", () => {
    const from = makeSnapshot("2026-07-15", [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
    ]);
    const to = makeSnapshot("2026-07-16", [
      makeRecord({ id: "REC-1", sourceUrl: "https://example.com/1" }),
      makeRecord({ id: "REC-2", sourceUrl: "https://example.com/1" }),
    ]);
    const result = computeDiff(from, to);

    expect(result.summary.added).toBe(1);
    expect(result.summary.unchanged).toBe(1);
  });
});
