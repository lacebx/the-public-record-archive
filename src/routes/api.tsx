import { createFileRoute, Link } from "@tanstack/react-router";
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

const ENDPOINTS = [
  {
    method: "GET",
    path: "/health",
    desc: "System health check and snapshot status.",
    link: "/api/v1/health",
  },
  {
    method: "GET",
    path: "/snapshots",
    desc: "List all available daily snapshots with summary metadata.",
    link: "/api/v1/snapshots",
  },
  {
    method: "GET",
    path: "/snapshots/{date}",
    desc: "Retrieve the full snapshot for a UTC day (YYYY-MM-DD) or 'latest'.",
    link: "/api/v1/snapshots/latest",
  },
  {
    method: "GET",
    path: "/records/{id}",
    desc: "Retrieve a single record by its unique identifier (e.g. REC-2026-07-16-000091).",
    link: "/api/v1/records/REC-2026-07-16-000091",
  },
  {
    method: "GET",
    path: "/search",
    desc: "Full-text search across all records. Supports ?q= and ?limit=.",
    link: "/api/v1/search?q=OpenAI",
  },
  {
    method: "GET",
    path: "/archive/{date}",
    desc: "Download a .tar.gz archive for a snapshot date.",
    link: "/api/v1/archive/latest",
  },
];

const EXAMPLE_RESPONSE = `{
  "success": true,
  "data": {
    "snapshot": {
      "isoDate": "2026-07-16",
      "date": "July 16, 2026",
      "articles": 942,
      "sources": 47,
      "countries": 12,
      "hash": "a3f9b21e8c4d5a6f7b2e9c1d0a8f4b6e3c7d2a1f5b9e8c4d6a3f1b7e2c9d5a8f"
    }
  }
}`;

function ApiPage() {
  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Developer Portal</h1>
      <hr className="mt-1" />
      <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
        Read-only HTTP API. No authentication required. All responses are cacheable and
        reproducible.
      </p>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Base URL
        </div>
        <hr className="mt-1" />
        <pre className="mt-2 border border-[color:var(--border)] p-3 text-[12px]">/api/v1</pre>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Interactive Playground
        </div>
        <hr className="mt-1" />
        <p className="mt-2 text-[12px]">
          Try every endpoint live, see request/response details, and generate client code with our{" "}
          <Link to="/api/playground" className="font-bold underline">
            interactive API playground
          </Link>
          .
        </p>
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
              <th className="w-[220px]">Path</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((ep) => (
              <tr key={ep.path}>
                <td>{ep.method}</td>
                <td>
                  <Link to={ep.link} className="font-bold underline">
                    {ep.path}
                  </Link>
                </td>
                <td>{ep.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Query Parameters
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <thead>
            <tr>
              <th className="w-[160px]">Parameter</th>
              <th className="w-[80px]">Type</th>
              <th className="w-[60px]">Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>limit</td>
              <td>integer</td>
              <td>/snapshots</td>
              <td>Max results (1-100)</td>
            </tr>
            <tr>
              <td>offset</td>
              <td>integer</td>
              <td>/snapshots</td>
              <td>Result offset for pagination</td>
            </tr>
            <tr>
              <td>q</td>
              <td>string</td>
              <td>/search</td>
              <td>Search query (required)</td>
            </tr>
            <tr>
              <td>limit</td>
              <td>integer</td>
              <td>/search</td>
              <td>Max results (default 20)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Example Response
        </div>
        <hr className="mt-1" />
        <pre className="mt-2 overflow-x-auto border border-[color:var(--border)] p-3 text-[12px]">
          {EXAMPLE_RESPONSE}
        </pre>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Caching
        </div>
        <hr className="mt-1" />
        <p className="mt-2 text-[12px]">
          All responses are cacheable. The latest snapshot data is bundled at build time — responses
          are typically served from memory or edge cache. Set cache-control headers in your
          downstream clients for best performance.
        </p>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Errors
        </div>
        <hr className="mt-1" />
        <p className="mt-2 text-[12px]">
          Errors return a JSON body with <code>success: false</code> and an <code>error</code>{" "}
          object containing <code>code</code> and <code>message</code>.
        </p>
        <pre className="mt-2 border border-[color:var(--border)] p-3 text-[12px]">
          {`{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Snapshot 1999-01-01 not found"
  }
}`}
        </pre>
        <table className="mt-2">
          <thead>
            <tr>
              <th className="w-[120px]">Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NOT_FOUND</td>
              <td>The requested resource does not exist.</td>
            </tr>
            <tr>
              <td>VALIDATION_ERROR</td>
              <td>A required parameter is missing or invalid.</td>
            </tr>
            <tr>
              <td>INTERNAL_ERROR</td>
              <td>An unexpected server error occurred.</td>
            </tr>
            <tr>
              <td>SERVICE_UNAVAILABLE</td>
              <td>The service is temporarily unavailable.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          OpenAPI / Scalar
        </div>
        <hr className="mt-1" />
        <p className="mt-2 text-[12px]">
          The full API specification is available as{" "}
          <a href="/openapi.json" className="font-bold underline">
            openapi.json
          </a>{" "}
          (OpenAPI 3.1). Use it with Scalar, Postman, or other OpenAPI-compatible tools. Try the{" "}
          <Link to="/api/playground" className="font-bold underline">
            interactive playground
          </Link>{" "}
          for live testing and generated client code.
        </p>
      </section>

      <hr className="rule-double mt-8" />
      <div className="py-2 text-center text-[11px] text-[color:var(--muted-foreground)]">
        End of API Reference
      </div>
      <hr className="rule-double" />
    </SiteShell>
  );
}
