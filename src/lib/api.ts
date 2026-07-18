import type { Snapshot, SnapshotSummary, Record } from "./data";
import { fetchSnapshotList, getSnapshotByDate } from "./data";
import bundledSnapshot from "./snapshot-data";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: ApiError;
  meta?: { [key: string]: unknown };
};

function success<T>(data: T, meta?: { [key: string]: unknown }): ApiResponse<T> {
  return { success: true, data, meta };
}

function apiError(code: string, message: string): ApiResponse<never> {
  return { success: false, data: undefined as never, error: { code, message } };
}

export type SnapshotsFilter = {
  limit?: number;
  offset?: number;
};

export type RecordsFilter = {
  date?: string;
  publisher?: string;
  category?: string;
  country?: string;
  since?: string;
  limit?: number;
  offset?: number;
};

export type SearchQuery = {
  q: string;
  limit?: number;
};

export type HealthStatus = {
  status: string;
  snapshotStore: "bundled" | "r2" | "local" | "unknown";
  snapshotDate: string;
  recordsCount: number;
};

export async function listSnapshots(
  filter?: SnapshotsFilter,
): Promise<ApiResponse<{ snapshots: SnapshotSummary[] }>> {
  try {
    const snapshots = await fetchSnapshotList();
    const limited = applyPagination(snapshots, filter?.limit, filter?.offset);
    return success(
      { snapshots: limited },
      { total: snapshots.length, limit: filter?.limit, offset: filter?.offset },
    );
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to fetch snapshot list");
  }
}

export async function getSnapshotApi(date: string): Promise<ApiResponse<{ snapshot: Snapshot }>> {
  try {
    let snapshot: Snapshot | null;
    if (date === "latest") {
      snapshot = bundledSnapshot satisfies Snapshot;
    } else {
      snapshot = await getSnapshotByDate(date);
    }
    if (!snapshot) {
      return apiError("NOT_FOUND", `Snapshot "${date}" not found`);
    }
    return success({ snapshot });
  } catch {
    return apiError("INTERNAL_ERROR", `Failed to fetch snapshot "${date}"`);
  }
}

export async function getRecords(
  filter?: RecordsFilter,
): Promise<ApiResponse<{ records: Record[] }>> {
  try {
    let sourceSnapshot: Snapshot | null = null;

    if (filter?.date) {
      sourceSnapshot =
        filter.date === "latest"
          ? (bundledSnapshot satisfies Snapshot)
          : await getSnapshotByDate(filter.date);
      if (!sourceSnapshot) {
        return apiError("NOT_FOUND", `Snapshot "${filter.date}" not found`);
      }
    } else {
      sourceSnapshot = bundledSnapshot satisfies Snapshot;
    }

    let records = [...sourceSnapshot.records];

    if (filter?.publisher) {
      const q = filter.publisher.toLowerCase();
      records = records.filter((r) => r.publisher.toLowerCase().includes(q));
    }

    if (filter?.category) {
      const q = filter.category.toLowerCase();
      records = records.filter((r) => r.category.toLowerCase().includes(q));
    }

    if (filter?.country) {
      const q = filter.country.toLowerCase();
      records = records.filter((r) => r.country.toLowerCase().includes(q));
    }

    if (filter?.since) {
      records = records.filter((r) => r.archived >= filter.since!);
    }

    const total = records.length;
    records = applyPagination(records, filter?.limit, filter?.offset);

    return success(
      { records },
      {
        total,
        limit: filter?.limit ?? records.length,
        offset: filter?.offset ?? 0,
        snapshotDate: sourceSnapshot.isoDate,
      },
    );
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to fetch records");
  }
}

export async function getRecordById(id: string): Promise<ApiResponse<{ record: Record }>> {
  try {
    const snapshot = bundledSnapshot satisfies Snapshot;
    const record = snapshot.records.find((r) => r.id === id);
    if (!record) {
      return apiError("NOT_FOUND", `Record "${id}" not found`);
    }
    return success({ record });
  } catch {
    return apiError("INTERNAL_ERROR", `Failed to fetch record "${id}"`);
  }
}

export async function searchRecords(
  query: SearchQuery,
): Promise<ApiResponse<{ results: Record[]; query: string }>> {
  try {
    const snapshot = bundledSnapshot satisfies Snapshot;
    const q = query.q.toLowerCase();
    const limit = query.limit ?? 20;

    const results = snapshot.records.filter((r) => {
      if (r.id.toLowerCase() === q) return true;
      if (r.publisher.toLowerCase().includes(q)) return true;
      if (r.title.toLowerCase().includes(q)) return true;
      if (r.summary.toLowerCase().includes(q)) return true;
      if (r.category.toLowerCase().includes(q)) return true;
      if (r.country.toLowerCase().includes(q)) return true;
      if (r.hash.toLowerCase() === q) return true;
      return false;
    });

    return success(
      { results: results.slice(0, limit), query: query.q },
      { total: results.length, limit },
    );
  } catch {
    return apiError("INTERNAL_ERROR", "Search failed");
  }
}

export async function getArchiveData(
  date: string,
): Promise<ApiResponse<{ base64: string; isoDate: string; filename: string }>> {
  try {
    let snapshot: Snapshot | null;
    if (!date || date === "latest") {
      snapshot = bundledSnapshot satisfies Snapshot;
    } else {
      snapshot = await getSnapshotByDate(date);
    }
    if (!snapshot) {
      return apiError("NOT_FOUND", `Snapshot "${date}" not found`);
    }
    const { buildArchiveTarGz, archiveFilename } = await import("./archive");
    const buf = await buildArchiveTarGz(snapshot);
    return success({
      base64: buf.toString("base64"),
      isoDate: snapshot.isoDate,
      filename: archiveFilename(snapshot.isoDate),
    });
  } catch {
    return apiError("INTERNAL_ERROR", `Failed to build archive for "${date}"`);
  }
}

export async function healthCheck(): Promise<ApiResponse<HealthStatus>> {
  try {
    const snapshot = bundledSnapshot satisfies Snapshot;
    let storeType: HealthStatus["snapshotStore"] = "bundled";
    try {
      const { r2Config } = await import("./storage");
      if (r2Config()) storeType = "r2";
    } catch {
      storeType = "bundled";
    }
    return success({
      status: "ok",
      snapshotStore: storeType,
      snapshotDate: snapshot.isoDate,
      recordsCount: snapshot.articles,
    });
  } catch {
    return apiError("SERVICE_UNAVAILABLE", "Health check failed");
  }
}

export type DiffQuery = {
  from: string;
  to: string;
  limit?: number;
  offset?: number;
};

export async function getDiffApi(query: DiffQuery): Promise<
  ApiResponse<{
    from: string;
    to: string;
    summary: { added: number; removed: number; modified: number; unchanged: number };
    added: DiffRecordItem[];
    removed: DiffRecordItem[];
    modified: DiffRecordItem[];
  }>
> {
  try {
    const { getDiff, paginateDiffRecords } = await import("./diff");
    const result = await getDiff(query.from, query.to);
    if (!result) {
      return apiError("NOT_FOUND", `Snapshot "${query.from}" or "${query.to}" not found`);
    }

    const trimmed = {
      added: paginateDiffRecords(result.added, query.limit, query.offset),
      removed: paginateDiffRecords(result.removed, query.limit, query.offset),
      modified: paginateDiffRecords(result.modified, query.limit, query.offset),
    };

    return success(
      {
        from: result.from,
        to: result.to,
        summary: result.summary,
        added: trimRecordDetails(trimmed.added.items),
        removed: trimRecordDetails(trimmed.removed.items),
        modified: trimFieldChanges(trimmed.modified.items),
      },
      {
        totalAdded: result.summary.added,
        totalRemoved: result.summary.removed,
        totalModified: result.summary.modified,
        totalUnchanged: result.summary.unchanged,
        limit: query.limit,
        offset: query.offset,
      },
    );
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to compute diff");
  }
}

type DiffRecordItem = {
  id: string;
  title: string;
  publisher: string;
  category: string;
  country: string;
  hash: string;
};

type DiffRecordModified = DiffRecordItem & {
  fieldChanges: { field: string; from: unknown; to: unknown }[];
};

function trimRecordDetails(records: { record: Record }[]): DiffRecordItem[] {
  return records.map((r) => ({
    id: r.record.id,
    title: r.record.title,
    publisher: r.record.publisher,
    category: r.record.category,
    country: r.record.country,
    hash: r.record.hash,
  }));
}

function trimFieldChanges(
  records: {
    record: Record;
    fieldChanges?: { field: string; from: unknown; to: unknown }[];
  }[],
): DiffRecordModified[] {
  return records.map((r) => ({
    id: r.record.id,
    title: r.record.title,
    publisher: r.record.publisher,
    category: r.record.category,
    country: r.record.country,
    hash: r.record.hash,
    fieldChanges: r.fieldChanges ?? [],
  }));
}

function applyPagination<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit != null ? start + limit : undefined;
  return items.slice(start, end);
}
