import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { RECORDS } from "../lib/records";

export const Route = createFileRoute("/record/$id")({
  loader: ({ params }) => {
    const record = RECORDS.find((r) => r.id === params.id);
    if (!record) throw notFound();
    return { record };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Record not found — Public Internet Record" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { record } = loaderData;
    return {
      meta: [
        { title: `${record.id} — ${record.publisher} — Public Internet Record` },
        { name: "description", content: record.summary.slice(0, 160) },
        { property: "og:title", content: `${record.publisher}: ${record.title}` },
        { property: "og:description", content: record.summary.slice(0, 160) },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Record Not Found</h1>
      <hr className="mt-1" />
      <p className="mt-3 text-[12px]">
        The requested record identifier is not present in the current archive.{" "}
        <Link to="/browse">Browse all records</Link>.
      </p>
    </SiteShell>
  ),
  component: RecordPage,
});

function RecordPage() {
  const { record } = Route.useLoaderData();
  const related = RECORDS.filter(
    (r) => r.category === record.category && r.id !== record.id,
  ).slice(0, 4);

  return (
    <SiteShell>
      <hr className="rule-double" />
      <div className="py-2 text-center text-[13px] font-bold uppercase tracking-[0.12em]">
        Record
      </div>
      <hr className="rule-double" />

      <table className="mt-4">
        <tbody>
          <tr>
            <td className="w-[220px]">Record Identifier</td>
            <td>{record.id}</td>
          </tr>
          <tr>
            <td>Publisher</td>
            <td>{record.publisher}</td>
          </tr>
          <tr>
            <td>Title</td>
            <td>{record.title}</td>
          </tr>
          <tr>
            <td>Category</td>
            <td>{record.category}</td>
          </tr>
          <tr>
            <td>Country of Origin</td>
            <td>{record.country}</td>
          </tr>
          <tr>
            <td>Publication Time</td>
            <td>{record.published}</td>
          </tr>
          <tr>
            <td>Archived</td>
            <td>{record.archived}</td>
          </tr>
          <tr>
            <td>Integrity</td>
            <td className="text-[color:var(--verified)]">Verified</td>
          </tr>
          <tr>
            <td>Hash (SHA-256)</td>
            <td className="break-all">{record.hash}</td>
          </tr>
          <tr>
            <td>Source URL</td>
            <td className="break-all">
              <a href={record.sourceUrl} rel="noreferrer">
                {record.sourceUrl}
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Summary
        </div>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">{record.summary}</p>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Evidence Chain
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <tbody>
            <tr>
              <td className="w-[220px]">Original Retrieval</td>
              <td>{record.archived}, HTTP 200, 42.1 KB</td>
            </tr>
            <tr>
              <td>Archival Node</td>
              <td>node-eu-03.public-record.org</td>
            </tr>
            <tr>
              <td>Witness Nodes</td>
              <td>node-us-01, node-jp-02, node-br-01</td>
            </tr>
            <tr>
              <td>Signed By</td>
              <td>archivist-key-2026-Q3</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Version History
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <thead>
            <tr>
              <th className="w-[60px]">Rev</th>
              <th className="w-[130px]">Timestamp</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>001</td>
              <td>{record.archived}</td>
              <td>Initial capture. Verified against source.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {related.length > 0 && (
        <section className="mt-6">
          <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            Related Records
          </div>
          <hr className="mt-1" />
          <ul className="mt-2 list-none space-y-1 text-[12px]">
            {related.map((r) => (
              <li key={r.id}>
                <Link to="/record/$id" params={{ id: r.id }}>
                  {r.publisher}: {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <hr className="rule-double mt-8" />
      <div className="py-2 text-center text-[11px] text-[color:var(--muted-foreground)]">
        End of Record &middot; {record.id}
      </div>
      <hr className="rule-double" />
    </SiteShell>
  );
}
