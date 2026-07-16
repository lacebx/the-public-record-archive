import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { PREVIOUS_SNAPSHOTS, SNAPSHOT } from "../lib/records";

export const Route = createFileRoute("/snapshots/$date")({
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
  const { date } = Route.useParams();
  const isToday = date === SNAPSHOT.isoDate;
  const prev = PREVIOUS_SNAPSHOTS.find((s) => s.date === date);
  const data = isToday
    ? {
        date: SNAPSHOT.isoDate,
        articles: SNAPSHOT.articles,
        sources: SNAPSHOT.sources,
        countries: SNAPSHOT.countries,
        generated: SNAPSHOT.generated,
        hash: SNAPSHOT.hash,
      }
    : prev
      ? {
          date: prev.date,
          articles: prev.articles,
          sources: prev.sources,
          countries: 42,
          generated: "23:58 UTC",
          hash: prev.hash,
        }
      : null;

  if (!data) {
    return (
      <SiteShell>
        <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Snapshot Not Found</h1>
        <hr className="mt-1" />
        <p className="mt-3 text-[12px]">
          No snapshot exists for {date}. <Link to="/snapshots">View all snapshots</Link>.
        </p>
      </SiteShell>
    );
  }

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
            <td>{data.date}</td>
          </tr>
          <tr>
            <td>Records</td>
            <td>{data.articles.toLocaleString("en-US")}</td>
          </tr>
          <tr>
            <td>Sources</td>
            <td>{data.sources}</td>
          </tr>
          <tr>
            <td>Countries</td>
            <td>{data.countries}</td>
          </tr>
          <tr>
            <td>Generated</td>
            <td>{data.generated}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td className="text-[color:var(--verified)]">Verified</td>
          </tr>
          <tr>
            <td>Root Hash (SHA-256)</td>
            <td className="break-all">{data.hash}</td>
          </tr>
          <tr>
            <td>Format</td>
            <td>WARC 1.1 + JSON manifest</td>
          </tr>
          <tr>
            <td>Approximate Size</td>
            <td>2.14 GB (compressed)</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href="#download" className="btn">
          [ Download Snapshot (.zip) ]
        </a>
        <a href="#verify" className="btn">
          [ Verify Snapshot ]
        </a>
        <Link to="/browse" className="btn">
          [ Browse Contents ]
        </Link>
      </div>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Verification Instructions
        </div>
        <hr className="mt-1" />
        <pre className="mt-2 overflow-x-auto border border-[color:var(--border)] p-3 text-[12px]">
{`$ curl -O https://public-record.org/snapshots/${data.date}.zip
$ sha256sum ${data.date}.zip
${data.hash}  ${data.date}.zip`}
        </pre>
      </section>

      <hr className="rule-double mt-8" />
      <div className="py-2 text-center text-[11px] text-[color:var(--muted-foreground)]">
        End of Snapshot &middot; {data.date}
      </div>
      <hr className="rule-double" />
    </SiteShell>
  );
}
