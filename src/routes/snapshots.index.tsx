import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { PREVIOUS_SNAPSHOTS, SNAPSHOT } from "../lib/records";

export const Route = createFileRoute("/snapshots/")({
  head: () => ({
    meta: [
      { title: "Snapshots — Public Internet Record" },
      {
        name: "description",
        content: "Daily verified snapshots of the public internet, preserved permanently.",
      },
      { property: "og:title", content: "Snapshots — Public Internet Record" },
      { property: "og:description", content: "Daily verified snapshots of the public internet." },
    ],
  }),
  component: SnapshotsIndex,
});

function SnapshotsIndex() {
  const rows = [
    { date: SNAPSHOT.isoDate, articles: SNAPSHOT.articles, sources: SNAPSHOT.sources, hash: SNAPSHOT.hash.slice(0, 24) + "..." },
    ...PREVIOUS_SNAPSHOTS,
  ];
  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Snapshots</h1>
      <hr className="mt-1" />
      <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
        A snapshot is a cryptographically sealed, downloadable copy of the archive at a given UTC
        day. Snapshots are immutable and independently verifiable.
      </p>

      <table className="mt-4">
        <thead>
          <tr>
            <th className="w-[130px]">Date</th>
            <th className="w-[110px]">Records</th>
            <th className="w-[90px]">Sources</th>
            <th>Root Hash (SHA-256)</th>
            <th className="w-[80px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.date}>
              <td>
                <Link to="/snapshots/$date" params={{ date: s.date }}>
                  {s.date}
                </Link>
              </td>
              <td>{s.articles.toLocaleString("en-US")}</td>
              <td>{s.sources}</td>
              <td className="break-all">{s.hash}</td>
              <td>
                <Link to="/snapshots/$date" params={{ date: s.date }}>
                  view
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SiteShell>
  );
}
