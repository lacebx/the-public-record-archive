import type { Record, Snapshot } from "./data";
import { getSnapshotByDate } from "./data";
import bundledSnapshot from "./snapshot-data";
import { LRUCache } from "lru-cache";

const diffCache = new LRUCache<string, DiffResult>({
  max: 20,
  ttl: 1000 * 60 * 10,
});

export type ChangeType = "added" | "removed" | "modified" | "unchanged";

export type FieldChange = {
  field: string;
  from: unknown;
  to: unknown;
};

export type DiffRecord = {
  record: Record;
  changeType: ChangeType;
  fieldChanges?: FieldChange[];
};

export type DiffSummary = {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
};

export type DiffResult = {
  from: string;
  to: string;
  summary: DiffSummary;
  added: DiffRecord[];
  removed: DiffRecord[];
  modified: DiffRecord[];
  unchanged: DiffRecord[];
};

export function stableRecordKey(record: Record): string {
  if (record.sourceUrl) return record.sourceUrl;
  return `${record.publisher}|||${record.title}`;
}

function computeFieldChanges(from: Record, to: Record): FieldChange[] {
  const changes: FieldChange[] = [];
  const fields: (keyof Record)[] = [
    "title",
    "summary",
    "hash",
    "publisher",
    "category",
    "country",
    "sourceUrl",
    "status",
  ];
  for (const field of fields) {
    if (from[field] !== to[field]) {
      changes.push({ field, from: from[field], to: to[field] });
    }
  }
  return changes;
}

type Match = { record: Record; consumed: boolean };

function buildMatches(records: Record[]): Map<string, Match[]> {
  const map = new Map<string, Match[]>();
  for (const r of records) {
    const key = stableRecordKey(r);
    const group = map.get(key);
    if (group) {
      group.push({ record: r, consumed: false });
    } else {
      map.set(key, [{ record: r, consumed: false }]);
    }
  }
  return map;
}

function consumeMatch(matches: Match[]): Match | undefined {
  for (const m of matches) {
    if (!m.consumed) {
      m.consumed = true;
      return m;
    }
  }
  return undefined;
}

function findUnconsumed(matches: Match[]): Match | undefined {
  return matches.find((m) => !m.consumed);
}

export function computeDiff(from: Snapshot, to: Snapshot): DiffResult {
  const fromMatches = buildMatches(from.records);

  const added: DiffRecord[] = [];
  const removed: DiffRecord[] = [];
  const modified: DiffRecord[] = [];
  const unchanged: DiffRecord[] = [];

  for (const toRecord of to.records) {
    const key = stableRecordKey(toRecord);
    const matches = fromMatches.get(key);

    if (!matches || matches.every((m) => m.consumed)) {
      added.push({ record: toRecord, changeType: "added" });
    } else {
      const match = consumeMatch(matches)!;
      if (match.record.hash !== toRecord.hash) {
        modified.push({
          record: toRecord,
          changeType: "modified",
          fieldChanges: computeFieldChanges(match.record, toRecord),
        });
      } else {
        unchanged.push({ record: toRecord, changeType: "unchanged" });
      }
    }
  }

  for (const [, matches] of fromMatches) {
    for (const m of matches) {
      if (!m.consumed) {
        removed.push({ record: m.record, changeType: "removed" });
      }
    }
  }

  return {
    from: from.isoDate,
    to: to.isoDate,
    summary: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
    },
    added,
    removed,
    modified,
    unchanged,
  };
}

export function getDiffCacheKey(fromDate: string, toDate: string): string {
  return `diff:${fromDate}:${toDate}`;
}

export async function getDiff(fromDate: string, toDate: string): Promise<DiffResult | null> {
  const cacheKey = getDiffCacheKey(fromDate, toDate);
  const cached = diffCache.get(cacheKey);
  if (cached) return cached;

  let fromSnapshot: Snapshot | null;
  let toSnapshot: Snapshot | null;

  if (fromDate === "latest") {
    fromSnapshot = bundledSnapshot satisfies Snapshot;
  } else {
    fromSnapshot = await getSnapshotByDate(fromDate);
  }

  if (toDate === "latest") {
    toSnapshot = bundledSnapshot satisfies Snapshot;
  } else {
    toSnapshot = await getSnapshotByDate(toDate);
  }

  if (!fromSnapshot || !toSnapshot) return null;

  const result = computeDiff(fromSnapshot, toSnapshot);
  diffCache.set(cacheKey, result);
  return result;
}

export function paginateDiffRecords(
  records: DiffRecord[],
  limit?: number,
  offset?: number,
): { items: DiffRecord[]; total: number } {
  const total = records.length;
  const start = offset ?? 0;
  const end = limit != null ? start + limit : undefined;
  return { items: records.slice(start, end), total };
}
