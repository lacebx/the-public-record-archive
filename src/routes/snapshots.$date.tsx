import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getSnapshot, getSnapshotByDate } from "../lib/data";

export const Route = createFileRoute("/snapshots/$date")({
  loader: async ({ params }) => {
    const snapshot = await getSnapshotByDate(params.date);
    if (!snapshot) {
      const latest = await getSnapshot();
      return { data: null, latestIsoDate: latest.isoDate };
    }
    return { data: snapshot, latestIsoDate: null };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Snapshot ${params.date} — Public Internet Record` },
      {
        name: "description",
        content: `Verified daily snapshot of the Public Internet Record for ${params.date}.`,
      },
      { property: "og:title", content: `Snapshot ${params.date}` },
      { property: "og:description", content: "Verified daily snapshot of the public internet." },
    ],
  }),
  component: SnapshotPage,
});

function SnapshotPage() {
  const { data, latestIsoDate } = Route.useLoaderData();

  if (!data) {
    return (
      <SiteShell>
        <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Snapshot Not Found</h1>
        <hr className="mt-1" />
        <p className="mt-3 text-[12px]">
          No snapshot exists for this date.{" "}
          {latestIsoDate && (
            <Link to="/snapshots/$date" params={{ date: latestIsoDate }}>
              View latest snapshot
            </Link>
          )}
          . <Link to="/snapshots">View all snapshots</Link>.
        </p>
      </SiteShell>
    );
  }

  const { date, hash, articles, sources, countries, generated, isoDate, records } = data;

  return (
    <SiteShell>
      <hr className="rule-double" />
      <div className="py-2 text-center text-[13px] font-bold uppercase tracking-[0.12em]">
        Snapshot
      </div>
      <hr className="rule-double" />

      <table className="mt-4">
        <tbody>
          <tr>
            <td className="w-[220px]">Snapshot Date</td>
            <td>{date}</td>
          </tr>
          <tr>
            <td>Records</td>
            <td>{articles.toLocaleString("en-US")}</td>
          </tr>
          <tr>
            <td>Sources</td>
            <td>{sources}</td>
          </tr>
          <tr>
            <td>Countries</td>
            <td>{countries}</td>
          </tr>
          <tr>
            <td>Generated</td>
            <td>{generated}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td className="text-[color:var(--verified)]">{data.status}</td>
          </tr>
          <tr>
            <td>Root Hash (SHA-256)</td>
            <td className="break-all">{hash}</td>
          </tr>
          <tr>
            <td>Format</td>
            <td>JSON</td>
          </tr>
          <tr>
            <td>Approximate Size</td>
            <td>{(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex flex-wrap gap-2">
        <DownloadButton data={data} isoDate={isoDate} />
        <VerifyButton expectedHash={hash} data={data} />
        <Link to="/browse" search={{}} className="btn">
          [ Browse Contents ]
        </Link>
      </div>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Verification Instructions
        </div>
        <hr className="mt-1" />
        <pre className="mt-2 overflow-x-auto border border-[color:var(--border)] p-3 text-[12px]">
          {`$ curl -O https://public-record.org/snapshots/${isoDate}.json
$ sha256sum ${isoDate}.json
${hash}  ${isoDate}.json`}
        </pre>
      </section>

      <hr className="rule-double mt-8" />
      <div className="py-2 text-center text-[11px] text-[color:var(--muted-foreground)]">
        End of Snapshot &middot; {isoDate}
      </div>
      <hr className="rule-double" />
    </SiteShell>
  );
}

function DownloadButton({ data, isoDate }: { data: unknown; isoDate: string }) {
  const handleDownload = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isoDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleDownload} className="btn">
      [ Download Snapshot (.json) ]
    </button>
  );
}

function VerifyButton({ expectedHash, data }: { expectedHash: string; data: unknown }) {
  const [result, setResult] = useState<"idle" | "verified" | "modified">("idle");

  const handleVerify = async () => {
    const json = JSON.stringify(data, null, 2);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setResult(hex === expectedHash ? "verified" : "modified");
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleVerify} className="btn">
        [ Verify Snapshot ]
      </button>
      {result === "verified" && (
        <span className="text-[color:var(--verified)] text-[11px]">
          Integrity verified &mdash; snapshot has not been modified
        </span>
      )}
      {result === "modified" && (
        <span className="text-red-600 text-[11px]">
          Integrity check failed &mdash; snapshot has been modified
        </span>
      )}
    </div>
  );
}
