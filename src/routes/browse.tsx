import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { SiteShell } from "../components/site-shell";
import { getSnapshot } from "../lib/data";

const browseSearchSchema = z.object({
  category: z.string().optional().default(""),
});

export const Route = createFileRoute("/browse")({
  validateSearch: (s) => browseSearchSchema.parse(s),
  loader: async () => {
    const snapshot = await getSnapshot();
    return { snapshot };
  },
  head: () => ({
    meta: [
      { title: "Browse Records — Public Internet Record" },
      {
        name: "description",
        content:
          "Browse the complete list of verified records in the Public Internet Record archive.",
      },
      { property: "og:title", content: "Browse Records — Public Internet Record" },
      { property: "og:description", content: "Complete list of verified records." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { snapshot } = Route.useLoaderData();
  const { category } = useSearch({ from: "/browse" });

  const records = snapshot.records;
  const categories = Array.from(new Set(records.map((r) => r.category))).sort();

  const filtered = category
    ? records.filter((r) => r.category.toLowerCase() === category.toLowerCase())
    : records;

  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Browse Records</h1>
      <hr className="mt-1" />
      <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
        All entries are from the current snapshot. Each record is identified by a unique archive ID
        for traceability.
      </p>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Filter by Category
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          <Link
            to="/browse"
            search={{ category: "" }}
            className={!category ? "underline font-bold" : ""}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              to="/browse"
              search={{ category: c }}
              className={category.toLowerCase() === c.toLowerCase() ? "underline font-bold" : ""}
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5">
        {filtered.length === 0 ? (
          <p className="text-[12px] text-[color:var(--muted-foreground)]">
            No records match the selected category.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="w-[170px]">Record ID</th>
                <th className="w-[130px]">Publisher</th>
                <th>Title</th>
                <th className="w-[110px]">Category</th>
                <th className="w-[90px]">Archived</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{r.id}</td>
                  <td>{r.publisher}</td>
                  <td>
                    <Link to="/record/$id" params={{ id: r.id }}>
                      {r.title}
                    </Link>
                  </td>
                  <td>{r.category}</td>
                  <td>{r.archived}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="mt-4 text-[11px] text-[color:var(--muted-foreground)]">
        Showing {filtered.length} of {records.length} records in the current snapshot.
      </p>
    </SiteShell>
  );
}
