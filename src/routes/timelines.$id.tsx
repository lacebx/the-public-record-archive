import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getTimeline } from "../lib/timelines";

export const Route = createFileRoute("/timelines/$id")({
  loader: async ({ params }) => {
    const timeline = getTimeline(params.id);
    if (!timeline) throw notFound();
    return { timeline };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Timeline not found — Public Internet Record" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.timeline.title} — Timeline — Public Internet Record` },
        {
          name: "description",
          content: `A timeline of ${loaderData.timeline.recordCount} records from ${loaderData.timeline.publishers.join(", ")} spanning ${loaderData.timeline.earliestPublished.slice(0, 10)} to ${loaderData.timeline.latestPublished.slice(0, 10)}.`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Timeline Not Found</h1>
      <hr className="mt-1" />
      <p className="mt-3 text-[12px]">
        The requested timeline does not exist. <Link to="/timelines">Browse all timelines</Link>.
      </p>
    </SiteShell>
  ),
  component: TimelineDetail,
});

function TimelineDetail() {
  const { timeline } = Route.useLoaderData();

  return (
    <SiteShell>
      <hr className="rule-double" />
      <div className="py-3">
        <div className="flex items-baseline gap-3">
          <Link to="/timelines" className="text-[11px] text-[color:var(--muted-foreground)]">
            &larr; Timelines
          </Link>
        </div>
        <div className="mt-1 text-[15px] font-bold uppercase tracking-[0.06em]">
          {timeline.title}
        </div>
        <div className="text-[11px] text-[color:var(--muted-foreground)]">{timeline.id}</div>
      </div>
      <hr className="rule-double" />

      <table className="mt-4">
        <tbody>
          <tr>
            <td className="w-[200px]">Records</td>
            <td>{timeline.recordCount}</td>
          </tr>
          <tr>
            <td>Publishers</td>
            <td>{timeline.publishers.join(", ")}</td>
          </tr>
          <tr>
            <td>Earliest Published</td>
            <td>{timeline.earliestPublished}</td>
          </tr>
          <tr>
            <td>Latest Published</td>
            <td>{timeline.latestPublished}</td>
          </tr>
          <tr>
            <td>First Archived</td>
            <td>{timeline.firstArchived}</td>
          </tr>
          <tr>
            <td>Latest Archived</td>
            <td>{timeline.latestArchived}</td>
          </tr>
          <tr>
            <td>Relationship Types</td>
            <td>{timeline.relationshipTypes.join(", ")}</td>
          </tr>
          <tr>
            <td>Average Score</td>
            <td>{timeline.avgScore}</td>
          </tr>
        </tbody>
      </table>

      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">
          Chronological Sequence
        </h2>
        <hr className="mt-1" />
        <table className="mt-2">
          <thead>
            <tr>
              <th className="w-[120px]">Published</th>
              <th className="w-[130px]">Archived</th>
              <th className="w-[140px]">Publisher</th>
              <th>Record</th>
            </tr>
          </thead>
          <tbody>
            {timeline.records.map((r) => (
              <tr key={r.recordId}>
                <td className="text-[11px] tabular-nums">{r.published.slice(0, 10)}</td>
                <td className="text-[11px] tabular-nums">{r.archived.slice(0, 10)}</td>
                <td className="text-[11px]">{r.publisher}</td>
                <td>
                  <Link to="/record/$id" params={{ id: r.recordId }}>
                    {r.title}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <div className="border-l-4 border-[color:var(--border)] pl-3">
          <p className="text-[11px] italic text-[color:var(--muted-foreground)]">
            <strong>Archived facts</strong> are displayed as captured from their original sources.{" "}
            <strong>Inferred relationships</strong> are computed from publisher, category, time
            proximity, and keyword overlap. This timeline is a computed grouping and may contain
            errors.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
