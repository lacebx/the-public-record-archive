import { describe, it, expect, beforeAll } from "vitest";
import {
  listSnapshots,
  getSnapshotApi,
  getRecords,
  getRecordById,
  searchRecords,
  healthCheck,
  getArchiveData,
  type ApiResponse,
  type HealthStatus,
} from "../src/lib/api";
import type { Snapshot, SnapshotSummary, Record } from "../src/lib/data";
import bundledSnapshot from "../src/lib/snapshot-data";

const ISO_DATE = bundledSnapshot.isoDate;
const RECORD_ID = bundledSnapshot.records[0]?.id ?? "REC-2026-07-16-000091";

function isSuccess<T>(r: ApiResponse<T>): r is ApiResponse<T> & { success: true } {
  return r.success === true;
}

function isError(r: ApiResponse<unknown>): r is ApiResponse<unknown> & { success: false } {
  return r.success === false;
}

describe("API module", () => {
  describe("healthCheck", () => {
    it("returns ok status with bundled store", async () => {
      const result = await healthCheck();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const health = result.data as HealthStatus;
        expect(health.status).toBe("ok");
        expect(health.snapshotDate).toBe(ISO_DATE);
        expect(health.recordsCount).toBe(bundledSnapshot.articles);
        expect(["bundled", "r2", "local", "unknown"]).toContain(health.snapshotStore);
      }
    });
  });

  describe("listSnapshots", () => {
    it("returns snapshot list with bundled snapshot", async () => {
      const result = await listSnapshots();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { snapshots } = result.data as { snapshots: SnapshotSummary[] };
        expect(snapshots.length).toBeGreaterThanOrEqual(1);
        expect(snapshots[snapshots.length - 1].isoDate).toBe(ISO_DATE);
        expect(result.meta).toBeDefined();
        expect(result.meta!.total).toBeGreaterThanOrEqual(1);
      }
    });

    it("respects limit parameter", async () => {
      const result = await listSnapshots({ limit: 1 });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { snapshots } = result.data as { snapshots: SnapshotSummary[] };
        expect(snapshots.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("getSnapshotApi", () => {
    it("returns snapshot for bundled date", async () => {
      const result = await getSnapshotApi(ISO_DATE);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { snapshot } = result.data as { snapshot: Snapshot };
        expect(snapshot.isoDate).toBe(ISO_DATE);
        expect(Array.isArray(snapshot.records)).toBe(true);
      }
    });

    it('returns latest snapshot for "latest"', async () => {
      const result = await getSnapshotApi("latest");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { snapshot } = result.data as { snapshot: Snapshot };
        expect(snapshot.isoDate).toBe(ISO_DATE);
      }
    });

    it("returns NOT_FOUND for unknown date", async () => {
      const result = await getSnapshotApi("1999-01-01");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error!.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getRecords", () => {
    it("returns records from latest snapshot", async () => {
      const result = await getRecords();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { records } = result.data as { records: Record[] };
        expect(records.length).toBeGreaterThan(0);
        expect(result.meta).toBeDefined();
      }
    });

    it("filters by publisher", async () => {
      const result = await getRecords({
        publisher: bundledSnapshot.records[0].publisher,
      });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { records } = result.data as { records: Record[] };
        expect(records.length).toBeGreaterThan(0);
        for (const r of records) {
          expect(r.publisher.toLowerCase()).toContain(
            bundledSnapshot.records[0].publisher.toLowerCase(),
          );
        }
      }
    });

    it("filters by category", async () => {
      const category = bundledSnapshot.records[0].category;
      const result = await getRecords({ category });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { records } = result.data as { records: Record[] };
        expect(records.length).toBeGreaterThan(0);
        for (const r of records) {
          expect(r.category.toLowerCase()).toContain(category.toLowerCase());
        }
      }
    });

    it("filters by country", async () => {
      const country = bundledSnapshot.records[0].country;
      const result = await getRecords({ country });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { records } = result.data as { records: Record[] };
        expect(records.length).toBeGreaterThan(0);
      }
    });

    it("filters by since date", async () => {
      const result = await getRecords({ since: "2099-01-01" });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { records } = result.data as { records: Record[] };
        expect(records.length).toBe(0);
      }
    });

    it("applies pagination via limit and offset", async () => {
      const result = await getRecords({ limit: 5, offset: 0 });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { records } = result.data as { records: Record[] };
        expect(records.length).toBeLessThanOrEqual(5);
      }
    });

    it("returns NOT_FOUND for unknown snapshot date", async () => {
      const result = await getRecords({ date: "1999-01-01" });
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error!.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getRecordById", () => {
    it("returns record for valid ID", async () => {
      const result = await getRecordById(RECORD_ID);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { record } = result.data as { record: Record };
        expect(record.id).toBe(RECORD_ID);
      }
    });

    it("returns NOT_FOUND for unknown ID", async () => {
      const result = await getRecordById("REC-0000-00-00-000000");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error!.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("searchRecords", () => {
    it("returns search results by publisher", async () => {
      const q = bundledSnapshot.records[0].publisher.slice(0, 4);
      const result = await searchRecords({ q });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { results } = result.data as { results: Record[]; query: string };
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
          expect(results[0].publisher.toLowerCase()).toContain(q.toLowerCase());
        }
      }
    });

    it("returns search results by title", async () => {
      const q = bundledSnapshot.records[0].title.slice(0, 10);
      const result = await searchRecords({ q });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { results } = result.data as { results: Record[]; query: string };
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0].title.toLowerCase()).toContain(q.toLowerCase());
      }
    });

    it("respects limit parameter", async () => {
      const result = await searchRecords({ q: "the", limit: 5 });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { results } = result.data as { results: Record[]; query: string };
        expect(results.length).toBeLessThanOrEqual(5);
      }
    });

    it("returns empty results for nonsense query", async () => {
      const result = await searchRecords({ q: "zzzzzznotfound" });
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { results } = result.data as { results: Record[]; query: string };
        expect(results.length).toBe(0);
      }
    });
  });

  describe("getArchiveData", () => {
    it("returns archive for bundled date", async () => {
      const result = await getArchiveData(ISO_DATE);
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { base64, isoDate, filename } = result.data as {
          base64: string;
          isoDate: string;
          filename: string;
        };
        expect(isoDate).toBe(ISO_DATE);
        expect(filename).toContain(ISO_DATE);
        expect(filename.endsWith(".tar.gz")).toBe(true);
        expect(base64.length).toBeGreaterThan(0);
      }
    });

    it("returns archive for latest", async () => {
      const result = await getArchiveData("latest");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const { isoDate } = result.data as { isoDate: string };
        expect(isoDate).toBe(ISO_DATE);
      }
    });

    it("returns NOT_FOUND for unknown date", async () => {
      const result = await getArchiveData("1999-01-01");
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error!.code).toBe("NOT_FOUND");
      }
    });
  });
});
