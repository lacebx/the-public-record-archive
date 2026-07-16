import type { Snapshot } from "./data";

export interface SnapshotStore {
  save(isoDate: string, snapshot: Snapshot): Promise<void>;
  load(isoDate: string): Promise<Snapshot | null>;
  list(): Promise<string[]>;
}

export class LocalSnapshotStore implements SnapshotStore {
  constructor(private basePath: string) {}

  async save(isoDate: string, snapshot: Snapshot): Promise<void> {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    mkdirSync(this.basePath, { recursive: true });
    writeFileSync(
      resolve(this.basePath, `${isoDate}.json`),
      JSON.stringify(snapshot, null, 2),
      "utf-8",
    );
  }

  async load(isoDate: string): Promise<Snapshot | null> {
    try {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const data = readFileSync(resolve(this.basePath, `${isoDate}.json`), "utf-8");
      return JSON.parse(data) as Snapshot;
    } catch {
      return null;
    }
  }

  async list(): Promise<string[]> {
    try {
      const { readdirSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      return readdirSync(this.basePath)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
        .sort();
    } catch {
      return [];
    }
  }
}
