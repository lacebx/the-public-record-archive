import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getTimelines, type Timeline } from "../lib/timelines";

type SortKey = "newest" | "largest" | "oldest";

export const Route = createFileRoute("/timelines/")({
  loader: async () => {
    const data = getTimelines();
    return { data };
  },
  validateSearch: (search: Record<string, unknown>): { sort?: SortKey } => {
    return {
      sort: (search.sort as SortKey) || "newest",
    };
  },
  head: () => ({
    meta: [
      { title: "Timelines — Public Internet Record" },
      {
        name: "description",
        content: "Browse evolving story timelines detected across archived records.",
      },
    ],
  }),
  component: TimelinesPage,
});

function sortTimelines(timelines: Timeline[], sort: SortKey): Timeline[] {
  const copy = timelines.slice();
  switch (sort) {
    case "largest":
      return copy.sort((a, b) => b.recordCount - a.recordCount);
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.latestPublished).getTime() - new Date(b.latestPublished).getTime(),
      );
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.latestPublished).getTime() - new Date(a.latestPublished).getTime(),
      );
  }
}

function TimelinesPage() {
  const { data } = Route.useLoaderData();
  const { sort = "newest" } = useSearch({ from: Route.id });

  const sorted = sortTimelines(data.timelines, sort);

  return (
    <SiteShell>
      <hr className="rule-double" />
      <div className="py-3 text-center">
        <div className="text-[15px] font-bold uppercase tracking-[0.12em]">Story Timelines</div>
        <div className="text-[12px] text-[color:var(--muted-foreground)]">
          {data.totalTimelines} detected &middot; {data.totalRecordsInTimelines} records grouped
        </div>
      </div>
      <hr className="rule-double" />

      <section className="mt-6">
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <span className="text-[color:var(--muted-foreground)]">Sort:</span>
          {(["newest", "largest", "oldest"] as SortKey[]).map((key) => (
            <Link
              key={key}
              to="/timelines"
              search={{ sort: key }}
              className={sort === key ? "underline font-bold" : ""}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Link>
          ))}
        </div>
        <hr className="mt-2" />

        {sorted.length > 0 ? (
          <table className="mt-2">
            <thead>
              <tr>
                <th className="w-[180px]">Timeline</th>
                <th className="w-[80px] text-right">Records</th>
                <th className="w-[120px]">Publishers</th>
                <th className="w-[100px]">Earliest</th>
                <th className="w-[100px]">Latest</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to="/timelines/$id" params={{ id: t.id }}>
                      {t.title}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums">{t.recordCount}</td>
                  <td className="text-[11px]">
                    {t.publishers.length <= 2
                      ? t.publishers.join(", ")
                      : `${t.publishers[0]}, ${t.publishers[1]} +${t.publishers.length - 2}`}
                  </td>
                  <td className="text-[11px]">{t.earliestPublished.slice(0, 10)}</td>
                  <td className="text-[11px]">{t.latestPublished.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-[12px] text-[color:var(--muted-foreground)]">
            No timelines detected. As more snapshots are archived, related stories will appear here.
          </p>
        )}
      </section>
    </SiteShell>
  );
}
