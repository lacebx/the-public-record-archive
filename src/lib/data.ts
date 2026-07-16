import { createServerFn } from "@tanstack/react-start";
import bundledSnapshot from "./snapshot-data";

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

export const getSnapshot = createServerFn({ method: "GET" }).handler(
  async () => bundledSnapshot satisfies Snapshot,
);

export async function getSnapshotByDate(date: string): Promise<Snapshot | null> {
  if (date === bundledSnapshot.isoDate) return bundledSnapshot satisfies Snapshot;

  try {
    const { LocalSnapshotStore } = await import("./storage");
    const { ROOT } = await import("../../scripts/generate-snapshot");
    const { resolve } = await import("node:path");
    const store = new LocalSnapshotStore(resolve(ROOT, "data"));
    return await store.load(date);
  } catch {
    return null;
  }
}
