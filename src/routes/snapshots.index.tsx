import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getSnapshot } from "../lib/data";

export const Route = createFileRoute("/snapshots/")({
  loader: async () => {
    const snapshot = await getSnapshot();
    return { snapshot };
  },
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
  const { snapshot } = Route.useLoaderData();

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
          <tr key={snapshot.isoDate}>
            <td>
              <Link to="/snapshots/$date" params={{ date: snapshot.isoDate }}>
                {snapshot.isoDate}
              </Link>
            </td>
            <td>{snapshot.articles.toLocaleString("en-US")}</td>
            <td>{snapshot.sources}</td>
            <td className="break-all">{snapshot.hash.slice(0, 24)}&hellip;</td>
            <td>
              <Link to="/snapshots/$date" params={{ date: snapshot.isoDate }}>
                view
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </SiteShell>
  );
}
