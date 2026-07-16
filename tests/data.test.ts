import { describe, it, expect } from "vitest";
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
  });

  describe("getSnapshotByDate", () => {
    it("returns the snapshot for the correct date", async () => {
      const result = await getSnapshotByDate(bundledSnapshot.isoDate);
      expect(result).not.toBeNull();
      expect(result!.isoDate).toBe(bundledSnapshot.isoDate);
    });

    it("returns null for a non-existent date", async () => {
      const result = await getSnapshotByDate("1999-01-01");
      expect(result).toBeNull();
    });
  });
});
