import { createServerFn } from "@tanstack/react-start";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "..", "data");

function loadLatest(): Snapshot | null {
  const p = resolve(DATA_DIR, "latest.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8")) as Snapshot;
}

function loadByDate(date: string): Snapshot | null {
  const p = resolve(DATA_DIR, `${date}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8")) as Snapshot;
}

// The babel plugin transforms these handlers to work on both client and server.
// TypeScript type annotations are cast because the compiled handler signatures
// differ from the library's declared types.
export const getSnapshot = createServerFn({ method: "GET" }).handler(
  // @ts-expect-error - compiled by babel plugin
  async () => loadLatest(),
);

export const getSnapshotByDate = createServerFn({ method: "GET" }).handler(
  // @ts-expect-error - compiled by babel plugin
  async (date: string) => loadByDate(date),
);
