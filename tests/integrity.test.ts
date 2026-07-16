import { describe, it, expect } from "vitest";
import { sha256 } from "../scripts/generate-snapshot";
import bundledSnapshot from "../src/lib/snapshot-data";

describe("Snapshot integrity", () => {
  it("verifies the records payload hash matches the stored hash", () => {
    const recordsJson = JSON.stringify(bundledSnapshot.records, null, 2);
    const computed = sha256(recordsJson);
    expect(computed).toBe(bundledSnapshot.hash);
  });

  it("fails verification when a record is tampered", () => {
    const records = structuredClone(bundledSnapshot.records);
    records[0] = { ...records[0], title: "TAMPERED" };
    const recordsJson = JSON.stringify(records, null, 2);
    const computed = sha256(recordsJson);
    expect(computed).not.toBe(bundledSnapshot.hash);
  });

  it("recovers verification after restoring the original record", () => {
    const recordsJson = JSON.stringify(bundledSnapshot.records, null, 2);
    const computed = sha256(recordsJson);
    expect(computed).toBe(bundledSnapshot.hash);
  });
});
