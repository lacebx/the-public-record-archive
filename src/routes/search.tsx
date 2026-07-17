import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteShell } from "../components/site-shell";
import { getSnapshot } from "../lib/data";
import { stripHtml } from "../lib/utils";

const searchSchema = z.object({
  q: z.string().optional().default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: async () => {
    const snapshot = await getSnapshot();
    return { snapshot };
  },
  head: () => ({
    meta: [
      { title: "Search Archive — Public Internet Record" },
      {
        name: "description",
        content:
          "Search the Public Internet Record archive by publisher, title, category, or hash.",
      },
      { property: "og:title", content: "Search Archive — Public Internet Record" },
      { property: "og:description", content: "Search the permanent public record." },
    ],
  }),
  component: Search,
});

function Search() {
  const { snapshot } = Route.useLoaderData();
  const { q } = Route.useSearch();
  const query = q.trim().toLowerCase();
  const results = query
    ? snapshot.records.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.publisher.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          r.summary.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query),
      )
    : [];

  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Search Archive</h1>
      <hr className="mt-1" />
      <form method="get" action="/search" className="mt-4">
        <label
          htmlFor="q"
          className="block text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]"
        >
          Query
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search historical records..."
          className="mt-1"
          autoFocus
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

      <hr className="mt-6" />

      {!query ? (
        <p className="mt-4 text-[12px] text-[color:var(--muted-foreground)]">
          Enter a query above to search {snapshot.articles.toLocaleString("en-US")} records across{" "}
          {snapshot.sources} sources.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-4 text-[12px]">
          No records match &ldquo;{q}&rdquo;. Try a different query or{" "}
          <Link to="/browse" search={{ category: "" }}>
            browse all records
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
          </p>
          <table className="mt-2">
            <thead>
              <tr>
                <th className="w-[130px]">Publisher</th>
                <th>Record</th>
                <th className="w-[90px]">Published</th>
                <th className="w-[90px]">Archived</th>
                <th className="w-[80px]">Integrity</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.publisher}</td>
                  <td>
                    <Link to="/record/$id" params={{ id: r.id }}>
                      {r.title}
                    </Link>
                    <div className="text-[11px] text-[color:var(--muted-foreground)]">
                      {stripHtml(r.summary).slice(0, 140)}&hellip;
                    </div>
                  </td>
                  <td>{r.published}</td>
                  <td>{r.archived}</td>
                  <td className="text-[color:var(--verified)]">Verified</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SiteShell>
  );
}
