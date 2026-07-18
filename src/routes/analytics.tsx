import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { computeAnalytics } from "../lib/analytics";

export const Route = createFileRoute("/analytics")({
  loader: async () => {
    const analytics = await computeAnalytics();
    return { analytics };
  },
  head: () => ({
    meta: [
      { title: "Analytics — Public Internet Record" },
      {
        name: "description",
        content:
          "Archive growth metrics, publisher breakdown, category distribution, and source health for the Public Internet Record.",
      },
    ],
  }),
  component: Analytics,
});

function Bar({
  pct,
  label,
  count,
  max,
}: {
  pct: number;
  label: string;
  count: number;
  max: number;
}) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-[3px]">
      <span className="w-[200px] shrink-0 text-right text-[12px]">{label}</span>
      <div className="relative h-[18px] flex-1 bg-[color:var(--border)]">
        <div
          className="absolute left-0 top-0 h-full bg-[color:var(--foreground)] opacity-30"
          style={{ width: `${width}%` }}
        />
        <span className="relative z-10 ml-2 text-[11px] leading-[18px]">
          {count.toLocaleString()} ({pct}%)
        </span>
      </div>
    </div>
  );
}

function Analytics() {
  const { analytics } = Route.useLoaderData();

  return (
    <SiteShell>
      <hr className="rule-double" />
      <div className="py-3 text-center">
        <div className="text-[15px] font-bold uppercase tracking-[0.12em]">Archive Analytics</div>
        <div className="text-[12px] text-[color:var(--muted-foreground)]">
          Snapshot growth, coverage, and source health
        </div>
      </div>
      <hr className="rule-double" />

      {/* Summary cards */}
      <section className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Overview</h2>
        <hr className="mt-1" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border p-3 text-center">
            <div className="text-[24px] font-bold">{analytics.totalSnapshots}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
              Total Snapshots
            </div>
          </div>
          <div className="border p-3 text-center">
            <div className="text-[24px] font-bold">
              {analytics.timeSeries[analytics.timeSeries.length - 1]?.records.toLocaleString() ??
                "-"}
            </div>
            <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
              Latest Records
            </div>
          </div>
          <div className="border p-3 text-center">
            <div className="text-[24px] font-bold">{analytics.totalUniqueSources}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
              Unique Sources
            </div>
          </div>
          <div className="border p-3 text-center">
            <div className="text-[24px] font-bold">{analytics.timeSeries.length}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
              Days of Data
            </div>
          </div>
        </div>
      </section>

      {/* Source health */}
      {analytics.sourceHealth ? (
        <section className="mt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Source Health</h2>
          <hr className="mt-1" />
          <table className="mt-2">
            <tbody>
              <tr>
                <td className="w-[220px]">Feeds Succeeded</td>
                <td className="text-[color:var(--verified)]">
                  {analytics.sourceHealth.feedsSucceeded} / {analytics.sourceHealth.feedsTotal}
                </td>
              </tr>
              <tr>
                <td>Feeds Failed</td>
                <td>{analytics.sourceHealth.feedsFailed}</td>
              </tr>
              <tr>
                <td>Success Rate</td>
                <td>{analytics.sourceHealth.pctSuccess}%</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Time series */}
      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Records Over Time</h2>
        <hr className="mt-1" />
        {analytics.timeSeries.length > 0 ? (
          <>
            <table className="mt-2">
              <thead>
                <tr>
                  <th className="w-[160px]">Date</th>
                  <th className="w-[100px] text-right">Records</th>
                  <th className="w-[100px] text-right">Sources</th>
                  <th className="w-[100px] text-right">New</th>
                  <th className="w-[100px] text-right">Carried</th>
                </tr>
              </thead>
              <tbody>
                {analytics.timeSeries.map((p) => (
                  <tr key={p.isoDate}>
                    <td>{p.date}</td>
                    <td className="text-right tabular-nums">{p.records.toLocaleString()}</td>
                    <td className="text-right tabular-nums">{p.sources}</td>
                    <td className="text-right tabular-nums text-[color:var(--verified)]">
                      {p.newRecords != null ? `+${p.newRecords.toLocaleString()}` : "-"}
                    </td>
                    <td className="text-right tabular-nums">
                      {p.carriedOver != null ? p.carriedOver.toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-[11px] text-[color:var(--muted-foreground)]">
              <a href={`/api/v1/snapshots`} className="underline">
                Export as JSON
              </a>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
            No time-series data available.
          </p>
        )}
      </section>

      {/* Publisher breakdown */}
      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Publisher Breakdown</h2>
        <hr className="mt-1" />
        {analytics.publishers.length > 0 ? (
          <div className="mt-2">
            {analytics.publishers.map((p) => (
              <Bar
                key={p.name}
                label={p.name}
                count={p.count}
                pct={p.pct}
                max={analytics.publishers[0].count}
              />
            ))}
            <div className="mt-3 text-[11px] text-[color:var(--muted-foreground)]">
              Total: {analytics.publishers.length} sources
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
            No publisher data available.
          </p>
        )}
      </section>

      {/* Category distribution */}
      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Category Distribution</h2>
        <hr className="mt-1" />
        {analytics.categories.length > 0 ? (
          <div className="mt-2">
            {analytics.categories.map((c) => (
              <Bar
                key={c.name}
                label={c.name}
                count={c.count}
                pct={c.pct}
                max={analytics.categories[0].count}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
            No category data available.
          </p>
        )}
      </section>

      {/* Country coverage */}
      <section className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Country Coverage</h2>
        <hr className="mt-1" />
        {analytics.countries.length > 0 ? (
          <div className="mt-2">
            {analytics.countries.map((c) => (
              <Bar
                key={c.name}
                label={c.name}
                count={c.count}
                pct={c.pct}
                max={analytics.countries[0].count}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
            No country data available.
          </p>
        )}
      </section>

      {analytics.timelineStats ? (
        <>
          {/* Timeline overview */}
          <section className="mt-8">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">
              Timeline Intelligence
            </h2>
            <hr className="mt-1" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
              <div className="border p-3 text-center">
                <div className="text-[24px] font-bold">
                  {analytics.timelineStats.totalTimelines}
                </div>
                <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                  Total Timelines
                </div>
              </div>
              <div className="border p-3 text-center">
                <div className="text-[24px] font-bold">
                  {analytics.timelineStats.totalRecordsInTimelines}
                </div>
                <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                  Records in Timelines
                </div>
              </div>
            </div>
          </section>

          {/* Timeline duration */}
          <section className="mt-8">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">Timeline Span</h2>
            <hr className="mt-1" />
            {analytics.timelineStats.longestRunningTimelines.length > 0 ? (
              <table className="mt-2">
                <thead>
                  <tr>
                    <th>Timeline</th>
                    <th className="w-[70px] text-right">Records</th>
                    <th className="w-[100px]">Start</th>
                    <th className="w-[100px]">End</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.timelineStats.longestRunningTimelines.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <a href={`/timelines/${t.id}`} className="underline">
                          {t.title}
                        </a>
                      </td>
                      <td className="text-right tabular-nums">{t.recordCount}</td>
                      <td className="text-[11px]">{t.earliestPublished.slice(0, 10)}</td>
                      <td className="text-[11px]">{t.latestPublished.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
                No timelines detected yet.
              </p>
            )}
          </section>

          <div className="mt-3 text-[11px]">
            <a href="/timelines" className="underline">
              View all timelines &raquo;
            </a>
          </div>
        </>
      ) : null}
    </SiteShell>
  );
}
