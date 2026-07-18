import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getSnapshot } from "../lib/data";
import { stripHtml } from "../lib/utils";
import { findRelated } from "../lib/related";

export const Route = createFileRoute("/record/$id")({
  loader: async ({ params }) => {
    const snapshot = await getSnapshot();
    const record = snapshot.records.find((r) => r.id === params.id);
    if (!record) throw notFound();
    const related = findRelated(record, snapshot.records, 8);
    return { record, snapshot, related };
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
        { name: "description", content: stripHtml(record.summary).slice(0, 160) },
        { property: "og:title", content: `${record.publisher}: ${record.title}` },
        { property: "og:description", content: stripHtml(record.summary).slice(0, 160) },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Record Not Found</h1>
      <hr className="mt-1" />
      <p className="mt-3 text-[12px]">
        The requested record identifier is not present in the current archive.{" "}
        <Link to="/browse" search={{ category: "" }}>
          Browse all records
        </Link>
        .
      </p>
    </SiteShell>
  ),
  component: RecordPage,
});

function RecordPage() {
  const { record, related } = Route.useLoaderData();

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
        <p className="mt-2 text-[13px] leading-relaxed">{stripHtml(record.summary)}</p>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Verification
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <tbody>
            <tr>
              <td className="w-[220px]">Original Retrieval</td>
              <td>{record.archived}, HTTP 200</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
          The SHA-256 hash of this record can be independently verified using the open-source
          tooling in this project's repository.
        </p>
      </section>

      {related.length > 0 ? (
        <section className="mt-8">
          <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            Related Records
          </div>
          <hr className="mt-1" />
          <table className="mt-2">
            <thead>
              <tr>
                <th className="w-[200px]">Title</th>
                <th className="w-[120px]">Publisher</th>
                <th className="w-[100px]">Archived</th>
                <th className="w-[110px]">Type</th>
                <th className="w-[70px] text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {related.map((r) => (
                <tr key={r.record.id}>
                  <td>
                    <Link to="/record/$id" params={{ id: r.record.id }}>
                      {r.record.title}
                    </Link>
                  </td>
                  <td>{r.record.publisher}</td>
                  <td>{r.record.archived.slice(0, 10)}</td>
                  <td className="text-[11px]">{r.type}</td>
                  <td className="text-right tabular-nums">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-[11px] text-[color:var(--muted-foreground)]">
            {related.length > 0 ? (
              <details className="cursor-pointer">
                <summary className="text-[11px]">Why these are related</summary>
                <ul className="mt-1 space-y-1">
                  {related.map((r) => (
                    <li key={r.record.id} className="border-l-2 border-[color:var(--border)] pl-2">
                      <span className="font-medium">{r.record.publisher}:</span>{" "}
                      <Link to="/record/$id" params={{ id: r.record.id }}>
                        {r.record.title}
                      </Link>{" "}
                      <span className="text-[color:var(--muted-foreground)]">
                        ({r.type}, score {r.score})
                      </span>
                      <ul className="mt-[2px] list-inside list-disc text-[10px] text-[color:var(--muted-foreground)]">
                        {r.reasons.map((reason, i) => (
                          <li key={i}>
                            {reason.factor}: +{reason.contribution} ({reason.detail})
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
          <div className="mt-3 text-[10px] italic text-[color:var(--muted-foreground)]">
            Inferred relationships based on publisher, category, time proximity, and keyword
            overlap.
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            Related Records
          </div>
          <hr className="mt-1" />
          <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
            No related records found in the current snapshot.
          </p>
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
