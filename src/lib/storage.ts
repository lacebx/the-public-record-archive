import type { Snapshot } from "./data";

export interface SnapshotStore {
  save(isoDate: string, snapshot: Snapshot): Promise<void>;
  load(isoDate: string): Promise<Snapshot | null>;
  list(): Promise<string[]>;
}

export function r2Config(): {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
} | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || "public-record-archive";
  if (accountId && accessKeyId && secretAccessKey) {
    return { accountId, accessKeyId, secretAccessKey, bucket };
  }
  return null;
}

function dateDir(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `snapshots/${y}/${m}/${d}`;
}

export class R2SnapshotStore implements SnapshotStore {
  private client: import("@aws-sdk/client-s3").S3Client | null = null;
  private cfg: NonNullable<ReturnType<typeof r2Config>>;

  constructor() {
    const c = r2Config();
    if (!c) {
      throw new Error(
        "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
      );
    }
    this.cfg = c;
  }

  private async getClient(): Promise<import("@aws-sdk/client-s3").S3Client> {
    if (!this.client) {
      const { S3Client } = await import("@aws-sdk/client-s3");
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${this.cfg.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.cfg.accessKeyId,
          secretAccessKey: this.cfg.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  async save(isoDate: string, snapshot: Snapshot): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: `${dateDir(isoDate)}/snapshot.json`,
        Body: JSON.stringify(snapshot, null, 2),
        ContentType: "application/json",
      }),
    );
  }

  async saveLatest(snapshot: Snapshot): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: "snapshots/latest.json",
        Body: JSON.stringify(snapshot, null, 2),
        ContentType: "application/json",
      }),
    );
  }

  async load(isoDate: string): Promise<Snapshot | null> {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await this.getClient();
      const response = await client.send(
        new GetObjectCommand({
          Bucket: this.cfg.bucket,
          Key: `${dateDir(isoDate)}/snapshot.json`,
        }),
      );
      const body = await response.Body?.transformToString("utf-8");
      return body ? (JSON.parse(body) as Snapshot) : null;
    } catch {
      return null;
    }
  }

  async loadLatest(): Promise<Snapshot | null> {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await this.getClient();
      const response = await client.send(
        new GetObjectCommand({
          Bucket: this.cfg.bucket,
          Key: "snapshots/latest.json",
        }),
      );
      const body = await response.Body?.transformToString("utf-8");
      return body ? (JSON.parse(body) as Snapshot) : null;
    } catch {
      return null;
    }
  }

  async list(): Promise<string[]> {
    try {
      const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
      const client = await this.getClient();
      const dates: string[] = [];
      let token: string | undefined;

      do {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: this.cfg.bucket,
            Prefix: "snapshots/",
            ContinuationToken: token,
          }),
        );

        for (const obj of response.Contents || []) {
          const key = obj.Key || "";
          if (key.endsWith("/snapshot.json")) {
            const parts = key.split("/");
            if (parts.length === 5) {
              dates.push(`${parts[1]}-${parts[2]}-${parts[3]}`);
            }
          }
        }

        token = response.NextContinuationToken;
      } while (token);

      return dates.sort();
    } catch {
      return [];
    }
  }

  async saveArchive(isoDate: string, buffer: Buffer): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: `${dateDir(isoDate)}/public-record-${isoDate}.tar.gz`,
        Body: buffer,
        ContentType: "application/gzip",
      }),
    );
  }

  async saveManifest(isoDate: string, manifest: unknown): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: `${dateDir(isoDate)}/manifest.json`,
        Body: JSON.stringify(manifest, null, 2),
        ContentType: "application/json",
      }),
    );
  }

  async saveChecksums(isoDate: string, checksums: string): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: `${dateDir(isoDate)}/checksums.txt`,
        Body: checksums,
        ContentType: "text/plain",
      }),
    );
  }
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
