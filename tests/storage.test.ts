import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const R2_ACCOUNT_ID = "test-account";
const R2_ACCESS_KEY_ID = "test-key";
const R2_SECRET_ACCESS_KEY = "test-secret";

const { mockSend } = vi.hoisted(() => {
  const fn = vi.fn();
  return { mockSend: fn };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function () {
    return { send: mockSend };
  }),
  PutObjectCommand: vi.fn(function (input: unknown) {
    return input;
  }),
  GetObjectCommand: vi.fn(function (input: unknown) {
    return input;
  }),
  ListObjectsV2Command: vi.fn(function (input: unknown) {
    return input;
  }),
}));

describe("r2Config", () => {
  beforeEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
  });

  it("returns null when no env vars are set", async () => {
    const { r2Config } = await import("../src/lib/storage");
    expect(r2Config()).toBeNull();
  });

  it("returns null when only some env vars are set", async () => {
    process.env.R2_ACCOUNT_ID = R2_ACCOUNT_ID;
    process.env.R2_ACCESS_KEY_ID = R2_ACCESS_KEY_ID;
    const { r2Config } = await import("../src/lib/storage");
    expect(r2Config()).toBeNull();
  });

  it("returns config when all required env vars are set", async () => {
    process.env.R2_ACCOUNT_ID = R2_ACCOUNT_ID;
    process.env.R2_ACCESS_KEY_ID = R2_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = R2_SECRET_ACCESS_KEY;
    const { r2Config } = await import("../src/lib/storage");
    const cfg = r2Config();
    expect(cfg).not.toBeNull();
    expect(cfg!.accountId).toBe(R2_ACCOUNT_ID);
    expect(cfg!.accessKeyId).toBe(R2_ACCESS_KEY_ID);
    expect(cfg!.secretAccessKey).toBe(R2_SECRET_ACCESS_KEY);
    expect(cfg!.bucket).toBe("public-record-archive");
  });

  it("uses custom bucket name when set", async () => {
    process.env.R2_ACCOUNT_ID = R2_ACCOUNT_ID;
    process.env.R2_ACCESS_KEY_ID = R2_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = R2_SECRET_ACCESS_KEY;
    process.env.R2_BUCKET = "my-custom-bucket";
    const { r2Config } = await import("../src/lib/storage");
    expect(r2Config()!.bucket).toBe("my-custom-bucket");
  });
});

describe("R2SnapshotStore", () => {
  const mockSnapshot = {
    date: "July 15, 2026",
    isoDate: "2026-07-15",
    generated: "2026-07-15T12:00:00Z",
    articles: 3,
    sources: 2,
    countries: 2,
    status: "VERIFIED",
    hash: "abc123",
    records: [
      {
        id: "rec-1",
        publisher: "Test",
        title: "Test Article",
        published: "2026-07-14",
        archived: "2026-07-15T12:00:00Z",
        status: "VERIFIED",
        hash: "hash1",
        summary: "Summary",
        sourceUrl: "https://example.com",
        country: "US",
        category: "tech",
      },
    ],
  };

  beforeEach(async () => {
    process.env.R2_ACCOUNT_ID = R2_ACCOUNT_ID;
    process.env.R2_ACCESS_KEY_ID = R2_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = R2_SECRET_ACCESS_KEY;
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
  });

  it("throws when env vars are not set", async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    const { R2SnapshotStore } = await import("../src/lib/storage");
    expect(() => new R2SnapshotStore()).toThrow("R2 not configured");
  });

  it("save uploads snapshot.json to the correct R2 path", async () => {
    mockSend.mockResolvedValue({});
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    await store.save("2026-07-15", mockSnapshot);

    expect(mockSend).toHaveBeenCalledOnce();
    const command = mockSend.mock.calls[0][0];
    expect(command.Bucket).toBe("public-record-archive");
    expect(command.Key).toBe("snapshots/2026/07/15/snapshot.json");
    expect(command.ContentType).toBe("application/json");

    const parsed = JSON.parse(command.Body);
    expect(parsed.isoDate).toBe("2026-07-15");
  });

  it("saveLatest uploads to snapshots/latest.json", async () => {
    mockSend.mockResolvedValue({});
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    await store.saveLatest(mockSnapshot);

    const command = mockSend.mock.calls[0][0];
    expect(command.Key).toBe("snapshots/latest.json");
  });

  it("load downloads and parses snapshot.json", async () => {
    mockSend.mockResolvedValue({
      Body: {
        async transformToString() {
          return JSON.stringify(mockSnapshot);
        },
      },
    });
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    const result = await store.load("2026-07-15");

    expect(result).not.toBeNull();
    expect(result!.isoDate).toBe("2026-07-15");
    expect(result!.records).toHaveLength(1);

    const command = mockSend.mock.calls[0][0];
    expect(command.Key).toBe("snapshots/2026/07/15/snapshot.json");
  });

  it("load returns null on error", async () => {
    mockSend.mockRejectedValue(new Error("Not found"));
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    const result = await store.load("2026-07-15");
    expect(result).toBeNull();
  });

  it("list returns sorted dates from R2 keys", async () => {
    mockSend.mockResolvedValue({
      Contents: [
        { Key: "snapshots/2026/07/14/snapshot.json" },
        { Key: "snapshots/2026/07/15/snapshot.json" },
        { Key: "snapshots/2026/07/13/snapshot.json" },
        { Key: "snapshots/2026/07/15/archive.tar.gz" },
      ],
      NextContinuationToken: undefined,
      IsTruncated: false,
    });
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    const dates = await store.list();

    expect(dates).toEqual(["2026-07-13", "2026-07-14", "2026-07-15"]);
  });

  it("list handles pagination", async () => {
    mockSend
      .mockResolvedValueOnce({
        Contents: [{ Key: "snapshots/2026/07/13/snapshot.json" }],
        NextContinuationToken: "token1",
        IsTruncated: true,
      })
      .mockResolvedValueOnce({
        Contents: [{ Key: "snapshots/2026/07/14/snapshot.json" }],
        NextContinuationToken: undefined,
        IsTruncated: false,
      });
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    const dates = await store.list();

    expect(dates).toEqual(["2026-07-13", "2026-07-14"]);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("list returns empty array on error", async () => {
    mockSend.mockRejectedValue(new Error("Access denied"));
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    const dates = await store.list();
    expect(dates).toEqual([]);
  });

  it("saveArchive uploads to correct path", async () => {
    mockSend.mockResolvedValue({});
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    const buf = Buffer.from("test-gzip-data");
    await store.saveArchive("2026-07-15", buf);

    const command = mockSend.mock.calls[0][0];
    expect(command.Key).toBe("snapshots/2026/07/15/public-record-2026-07-15.tar.gz");
    expect(command.ContentType).toBe("application/gzip");
    expect(command.Body).toBe(buf);
  });

  it("saveManifest uploads to correct path", async () => {
    mockSend.mockResolvedValue({});
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    await store.saveManifest("2026-07-15", { version: 1 });

    const command = mockSend.mock.calls[0][0];
    expect(command.Key).toBe("snapshots/2026/07/15/manifest.json");
  });

  it("saveChecksums uploads to correct path", async () => {
    mockSend.mockResolvedValue({});
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    await store.saveChecksums("2026-07-15", "abcdef  snapshot.json");

    const command = mockSend.mock.calls[0][0];
    expect(command.Key).toBe("snapshots/2026/07/15/checksums.txt");
  });

  it("saveArchive throws on failure", async () => {
    mockSend.mockRejectedValue(new Error("Upload failed"));
    const { R2SnapshotStore } = await import("../src/lib/storage");
    const store = new R2SnapshotStore();
    await expect(store.saveArchive("2026-07-15", Buffer.from("x"))).rejects.toThrow(
      "Upload failed",
    );
  });
});

describe("LocalSnapshotStore", () => {
  it("load returns null for non-existent date", async () => {
    const { LocalSnapshotStore } = await import("../src/lib/storage");
    const store = new LocalSnapshotStore("/tmp/nonexistent");
    const result = await store.load("2099-01-01");
    expect(result).toBeNull();
  });

  it("list returns empty for empty directory", async () => {
    const { LocalSnapshotStore } = await import("../src/lib/storage");
    const store = new LocalSnapshotStore("/tmp/nonexistent");
    const result = await store.list();
    expect(result).toEqual([]);
  });
});
