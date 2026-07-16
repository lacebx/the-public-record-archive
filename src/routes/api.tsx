import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "API — Public Internet Record" },
      { name: "description", content: "Public HTTP API for querying the permanent record." },
      { property: "og:title", content: "API — Public Internet Record" },
      { property: "og:description", content: "Public HTTP API for querying the permanent record." },
    ],
  }),
  component: ApiPage,
});

function ApiPage() {
  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Public API</h1>
      <hr className="mt-1" />
      <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
        Read-only HTTP API. No authentication required. All responses are cacheable and reproducible.
      </p>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Base URL
        </div>
        <hr className="mt-1" />
        <pre className="mt-2 border border-[color:var(--border)] p-3 text-[12px]">
{`https://api.public-record.org/v1`}
        </pre>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Endpoints
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <thead>
            <tr>
              <th className="w-[60px]">Method</th>
              <th className="w-[260px]">Path</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET</td>
              <td>/snapshots</td>
              <td>List all snapshots.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/snapshots/:date</td>
              <td>Retrieve snapshot manifest for a UTC day.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/records</td>
              <td>List records. Supports ?publisher, ?category, ?since.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/records/:id</td>
              <td>Retrieve a single record with full metadata and hash.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td>/verify/:hash</td>
              <td>Verify integrity of a record or snapshot by SHA-256.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Example
        </div>
        <hr className="mt-1" />
        <pre className="mt-2 overflow-x-auto border border-[color:var(--border)] p-3 text-[12px]">
{`$ curl https://api.public-record.org/v1/records/REC-2026-07-16-000091
{
  "id": "REC-2026-07-16-000091",
  "publisher": "Reuters",
  "title": "OpenAI announces new governance framework...",
  "published": "2026-07-16T09:17:00Z",
  "archived":  "2026-07-16T09:18:00Z",
  "integrity": "verified",
  "hash": "a3f9b21e8c4d5a6f7b2e9c1d0a8f4b6e3c7d2a1f5b9e8c4d6a3f1b7e2c9d5a8f"
}`}
        </pre>
      </section>
    </SiteShell>
  );
}
