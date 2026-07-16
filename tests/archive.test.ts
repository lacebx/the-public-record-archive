import { describe, it, expect } from "vitest";
import { buildArchiveFiles, buildArchiveTarGz, archiveFilename } from "../src/lib/archive";
import { Snapshot } from "../src/lib/data";

const mockSnapshot: Snapshot = {
  date: "July 15, 2026",
  isoDate: "2026-07-15",
  generated: "2026-07-15T12:00:00Z",
  articles: 3,
  sources: 2,
  countries: 2,
  status: "VERIFIED",
  hash: "abc123def456",
  records: [
    {
      id: "rec-1",
      publisher: "Test Publisher",
      title: "Test Article 1",
      published: "2026-07-14",
      archived: "2026-07-15T12:00:00Z",
      status: "VERIFIED",
      hash: "hash1",
      summary: "Summary 1",
      sourceUrl: "https://example.com/1",
      country: "US",
      category: "technology",
    },
    {
      id: "rec-2",
      publisher: "Another Publisher",
      title: "Test Article 2",
      published: "2026-07-14",
      archived: "2026-07-15T12:00:00Z",
      status: "VERIFIED",
      hash: "hash2",
      summary: "Summary 2",
      sourceUrl: "https://example.com/2",
      country: "GB",
      category: "politics",
    },
    {
      id: "rec-3",
      publisher: "Test Publisher",
      title: "Test Article 3",
      published: "2026-07-13",
      archived: "2026-07-15T12:00:00Z",
      status: "VERIFIED",
      hash: "hash3",
      summary: "Summary 3",
      sourceUrl: "https://example.com/3",
      country: "US",
      category: "technology",
    },
  ],
};

describe("archiveFilename", () => {
  it("returns the correct filename", () => {
    expect(archiveFilename("2026-07-15")).toBe("public-record-2026-07-15.tar.gz");
  });
});

describe("buildArchiveFiles", () => {
  it("returns four files in the correct order", async () => {
    const files = await buildArchiveFiles(mockSnapshot);
    expect(files).toHaveLength(4);
    expect(files[0].path).toBe("2026-07-15/snapshot.json");
    expect(files[1].path).toBe("2026-07-15/MANIFEST.json");
    expect(files[2].path).toBe("2026-07-15/SHA256SUMS");
    expect(files[3].path).toBe("2026-07-15/README.md");
  });

  it("snapshot.json contains valid JSON matching the snapshot", async () => {
    const files = await buildArchiveFiles(mockSnapshot);
    const parsed = JSON.parse(files[0].content);
    expect(parsed.isoDate).toBe("2026-07-15");
    expect(parsed.records).toHaveLength(3);
  });

  it("MANIFEST.json has correct structure", async () => {
    const files = await buildArchiveFiles(mockSnapshot);
    const manifest = JSON.parse(files[1].content);
    expect(manifest.archive).toBe("public-record-archive");
    expect(manifest.format_version).toBe(1);
    expect(manifest.snapshot.isoDate).toBe("2026-07-15");
    expect(manifest.files).toHaveLength(4);
  });

  it("SHA256SUMS contains checksums for snapshot.json and MANIFEST.json", async () => {
    const files = await buildArchiveFiles(mockSnapshot);
    const sums = files[2].content.trim().split("\n");
    expect(sums).toHaveLength(3);
    expect(sums[0]).toMatch(/^[a-f0-9]{64} {2}2026-07-15\/snapshot.json$/);
    expect(sums[1]).toMatch(/^[a-f0-9]{64} {2}2026-07-15\/MANIFEST.json$/);
    expect(sums[2]).toMatch(/^[a-f0-9]{64} {2}2026-07-15\/README.md$/);
  });

  it("SHA256SUMS checksums are correct", async () => {
    const files = await buildArchiveFiles(mockSnapshot);
    const { createHash } = await import("node:crypto");
    const sums = files[2].content.trim().split("\n");
    for (const line of sums) {
      const [hash, filePath] = line.split("  ");
      const file = files.find((f) => f.path === filePath);
      expect(file).toBeDefined();
      const computed = createHash("sha256").update(file!.content, "utf-8").digest("hex");
      expect(computed).toBe(hash);
    }
  });

  it("README.md contains verification instructions", async () => {
    const files = await buildArchiveFiles(mockSnapshot);
    expect(files[3].content).toContain("Public Internet Record");
    expect(files[3].content).toContain("sha256sum --check");
    expect(files[3].content).toContain("abc123def456");
  });
});

describe("buildArchiveTarGz", () => {
  it("produces a non-empty gzip buffer", async () => {
    const buf = await buildArchiveTarGz(mockSnapshot);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("starts with gzip magic bytes", async () => {
    const buf = await buildArchiveTarGz(mockSnapshot);
    expect(buf[0]).toBe(0x1f);
    expect(buf[1]).toBe(0x8b);
  });

  it("decompresses to a valid tar containing four files", async () => {
    const buf = await buildArchiveTarGz(mockSnapshot);
    const { gunzipSync } = await import("node:zlib");
    const tar = gunzipSync(buf);
    // Read tar entries from the decompressed data
    const files: string[] = [];
    let offset = 0;
    while (offset < tar.length - 1024) {
      const nameBytes = tar.subarray(offset, offset + 100);
      const name = Buffer.from(nameBytes).toString("utf-8").replaceAll("\0", "").trim();
      if (!name) break;
      const sizeRaw = Buffer.from(tar.subarray(offset + 124, offset + 136)).toString("utf-8");
      const sizeStr = sizeRaw.replaceAll("\0", "").trim();
      const size = parseInt(sizeStr, 8);
      files.push(name);
      const contentSize = size === 0 ? 0 : size + (512 - (size % 512 || 512));
      offset += 512 + contentSize;
    }
    expect(files).toContain("2026-07-15/snapshot.json");
    expect(files).toContain("2026-07-15/MANIFEST.json");
    expect(files).toContain("2026-07-15/SHA256SUMS");
    expect(files).toContain("2026-07-15/README.md");
  });
});
