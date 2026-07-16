import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { RECORDS, SNAPSHOT } from "../lib/records";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Public Internet Record — Permanent Historical Archive" },
      {
        name: "description",
        content:
          "A permanent, verified archive of the public internet. Daily snapshots, cryptographic integrity, and public records for historians, journalists, and researchers.",
      },
      {
        property: "og:title",
        content: "Public Internet Record — Permanent Historical Archive",
      },
      {
        property: "og:description",
        content:
          "Verified daily snapshots of the public internet. Preserved for historians, journalists, and researchers.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      <hr className="rule-double" />
      <div className="py-3 text-center">
        <div className="text-[15px] font-bold uppercase tracking-[0.12em]">
          Public Internet Record
        </div>
        <div className="text-[12px] text-[color:var(--muted-foreground)]">
          Permanent Historical Archive
        </div>
      </div>
      <hr className="rule-double" />

      <section className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">
          Today&rsquo;s Snapshot
        </h2>
        <hr className="mt-1" />
        <table className="mt-2">
          <tbody>
            <tr>
              <td className="w-[220px]">Snapshot Date</td>
              <td>{SNAPSHOT.date}</td>
            </tr>
            <tr>
              <td>Records Archived</td>
              <td>{SNAPSHOT.articles.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td>Sources</td>
              <td>{SNAPSHOT.sources}</td>
            </tr>
            <tr>
              <td>Countries</td>
              <td>{SNAPSHOT.countries}</td>
            </tr>
            <tr>
              <td>Generated</td>
              <td>{SNAPSHOT.generated}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td className="text-[color:var(--verified)]">{SNAPSHOT.status}</td>
            </tr>
            <tr>
              <td>Integrity Hash (SHA-256)</td>
              <td className="break-all">{SNAPSHOT.hash}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/snapshots/$date"
            params={{ date: SNAPSHOT.isoDate }}
            className="btn"
          >
            [ Download Snapshot ]
          </Link>
          <Link to="/browse" className="btn">
            [ Browse Records ]
          </Link>
          <Link to="/search" className="btn">
            [ Search Archive ]
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Recently Archived</h2>
        <hr className="mt-1" />
        <table className="mt-2">
          <thead>
            <tr>
              <th className="w-[140px]">Publisher</th>
              <th>Record</th>
              <th className="w-[90px]">Published</th>
              <th className="w-[90px]">Archived</th>
              <th className="w-[90px]">Integrity</th>
            </tr>
          </thead>
          <tbody>
            {RECORDS.map((r) => (
              <tr key={r.id}>
                <td>{r.publisher}</td>
                <td>
                  <Link to="/record/$id" params={{ id: r.id }}>
                    {r.title}
                  </Link>
                </td>
                <td>{r.published}</td>
                <td>{r.archived}</td>
                <td className="text-[color:var(--verified)]">Verified</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-[12px]">
          <Link to="/browse">View all recently archived records &raquo;</Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Search the Archive</h2>
        <hr className="mt-1" />
        <form method="get" action="/search" className="mt-3">
          <label htmlFor="q" className="block text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            Query
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Search historical records..."
            className="mt-1"
          />
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <button type="submit" className="btn">
              [ Search ]
            </button>
            <span className="text-[color:var(--muted-foreground)]">
              Full-text · Publishers · Dates · SHA-256
            </span>
          </div>
        </form>
      </section>
    </SiteShell>
  );
}
