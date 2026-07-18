import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSnapshotByDate } from "../src/lib/data";
import bundledSnapshot from "../src/lib/snapshot-data";

describe("Data loading", () => {
  describe("bundled snapshot", () => {
    it("has the correct shape", () => {
      expect(bundledSnapshot).toHaveProperty("date");
      expect(bundledSnapshot).toHaveProperty("isoDate");
      expect(bundledSnapshot).toHaveProperty("generated");
      expect(bundledSnapshot).toHaveProperty("articles");
      expect(bundledSnapshot).toHaveProperty("sources");
      expect(bundledSnapshot).toHaveProperty("countries");
      expect(bundledSnapshot).toHaveProperty("status");
      expect(bundledSnapshot).toHaveProperty("hash");
      expect(bundledSnapshot).toHaveProperty("records");
    });

    it("has the correct status", () => {
      expect(bundledSnapshot.status).toBe("VERIFIED");
    });

    it("article count matches records length", () => {
      expect(bundledSnapshot.articles).toBe(bundledSnapshot.records.length);
    });

    it("source count matches unique publishers", () => {
      const uniqueSources = new Set(bundledSnapshot.records.map((r) => r.publisher));
      expect(bundledSnapshot.sources).toBe(uniqueSources.size);
    });

    it("country count matches unique countries", () => {
      const uniqueCountries = new Set(bundledSnapshot.records.map((r) => r.country));
      expect(bundledSnapshot.countries).toBe(uniqueCountries.size);
    });

    it("has at least one record", () => {
      expect(bundledSnapshot.records.length).toBeGreaterThan(0);
    });

    it("assigns unique IDs to all records", () => {
      const ids = bundledSnapshot.records.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("gives every record a non-empty hash", () => {
      for (const record of bundledSnapshot.records) {
        expect(record.hash).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it("gives every record a valid status", () => {
      for (const record of bundledSnapshot.records) {
        expect(["VERIFIED", "PENDING"]).toContain(record.status);
      }
    });

    it("gives every record a non-empty publisher", () => {
      for (const record of bundledSnapshot.records) {
        expect(record.publisher).toBeTruthy();
      }
    });

    it("has the correct SnapshotSummary shape", () => {
      expect(bundledSnapshot.isoDate).toBeTypeOf("string");
      expect(bundledSnapshot.date).toBeTypeOf("string");
      expect(bundledSnapshot.generated).toBeTypeOf("string");
      expect(bundledSnapshot.articles).toBeTypeOf("number");
      expect(bundledSnapshot.sources).toBeTypeOf("number");
      expect(bundledSnapshot.hash).toBeTypeOf("string");
    });
  });

  describe("getSnapshotByDate", () => {
    it("returns the snapshot for the correct date", async () => {
      const result = await getSnapshotByDate(bundledSnapshot.isoDate);
      expect(result).not.toBeNull();
      expect(result!.isoDate).toBe(bundledSnapshot.isoDate);
    });

    it("returns null for a non-existent date when R2 and local are unavailable", async () => {
      const result = await getSnapshotByDate("1999-01-01");
      expect(result).toBeNull();
    });

    it("returns same object reference on cached call", async () => {
      const first = await getSnapshotByDate(bundledSnapshot.isoDate);
      const second = await getSnapshotByDate(bundledSnapshot.isoDate);
      expect(first).toBe(second);
    });
  });

  describe("fetchSnapshotList", () => {
    beforeEach(() => {
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
    });

    it("returns bundled snapshot summary when R2 is not configured", async () => {
      const { fetchSnapshotList } = await import("../src/lib/data");
      const list = await fetchSnapshotList();
      expect(list).toHaveLength(1);
      expect(list[0].isoDate).toBe(bundledSnapshot.isoDate);
      expect(list[0].articles).toBe(bundledSnapshot.articles);
      expect(list[0].hash).toBe(bundledSnapshot.hash);
    });

    it("returns list with correct SnapshotSummary fields", async () => {
      const { fetchSnapshotList } = await import("../src/lib/data");
      const list = await fetchSnapshotList();
      for (const s of list) {
        expect(s).toHaveProperty("isoDate");
        expect(s).toHaveProperty("date");
        expect(s).toHaveProperty("generated");
        expect(s).toHaveProperty("articles");
        expect(s).toHaveProperty("sources");
        expect(s).toHaveProperty("hash");
        expect(typeof s.isoDate).toBe("string");
        expect(typeof s.articles).toBe("number");
        expect(typeof s.sources).toBe("number");
        expect(typeof s.hash).toBe("string");
      }
    });

    it("returns bundled snapshot as the last entry", async () => {
      const { fetchSnapshotList } = await import("../src/lib/data");
      const list = await fetchSnapshotList();
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[list.length - 1].isoDate).toBe(bundledSnapshot.isoDate);
    });
  });
});
