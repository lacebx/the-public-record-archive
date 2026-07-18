import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const jsonPath = resolve(root, "data", "latest.json");

let snapshot: { isoDate?: string; hash?: string; records?: unknown[] };
try {
  const data = readFileSync(jsonPath, "utf-8");
  snapshot = JSON.parse(data);
} catch (err) {
  console.error(
    "FAIL: could not read or parse data/latest.json:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
}

if (!snapshot.isoDate) {
  console.error("FAIL: missing isoDate");
  process.exit(1);
}
if (!snapshot.hash) {
  console.error("FAIL: missing hash");
  process.exit(1);
}
if (!Array.isArray(snapshot.records)) {
  console.error("FAIL: missing records");
  process.exit(1);
}

// Verify integrity of the TypeScript module's export structure
const tsPath = resolve(root, "src", "lib", "snapshot-data.ts");
const tsContent = readFileSync(tsPath, "utf-8");
if (!tsContent.includes(`export default data;`)) {
  console.error("FAIL: snapshot-data.ts missing export default data;");
  process.exit(1);
}

const recordsJson = JSON.stringify(snapshot.records, null, 2);
const computed = createHash("sha256").update(recordsJson, "utf-8").digest("hex");
if (computed !== snapshot.hash) {
  console.error("FAIL: integrity hash mismatch");
  process.exit(1);
}

console.log(
  `OK: snapshot valid, date=${snapshot.isoDate}, records=${snapshot.records.length}, hash=${snapshot.hash}`,
);
