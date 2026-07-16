import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { RECORDS } from "../lib/records";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Records — Public Internet Record" },
      {
        name: "description",
        content: "Browse the complete list of verified records in the Public Internet Record archive.",
      },
      { property: "og:title", content: "Browse Records — Public Internet Record" },
      { property: "og:description", content: "Complete list of verified records." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const categories = Array.from(new Set(RECORDS.map((r) => r.category))).sort();
  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Browse Records</h1>
      <hr className="mt-1" />
      <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
        Records are listed in reverse chronological order of archival. All entries are cryptographically
        verified and immutable.
      </p>

      <section className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Filter by Category
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          <a href="#all">All</a>
          {categories.map((c) => (
            <a key={c} href={`#${c.toLowerCase()}`}>
              {c}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-5">
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
            {RECORDS.map((r) => (
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
      </section>

      <p className="mt-4 text-[11px] text-[color:var(--muted-foreground)]">
        Showing {RECORDS.length} of 5,824 records in the current snapshot.{" "}
        <a href="#older">Load older records &raquo;</a>
      </p>
    </SiteShell>
  );
}
