import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getSnapshot } from "../lib/data";

export const Route = createFileRoute("/about")({
  loader: async () => {
    const snapshot = await getSnapshot();
    return { snapshot };
  },
  head: () => ({
    meta: [
      { title: "About — Public Internet Record" },
      {
        name: "description",
        content: "The Public Internet Record is a nonprofit archival trust preserving the primary sources of the open web since 1998.",
      },
      { property: "og:title", content: "About — Public Internet Record" },
      {
        property: "og:description",
        content: "Nonprofit archival trust preserving the primary sources of the open web since 1998.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { snapshot } = Route.useLoaderData();

  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">About</h1>
      <hr className="mt-1" />

      <p className="mt-3 text-[13px] leading-relaxed">
        The Public Internet Record is a nonprofit archival trust. Since 1998 it has continuously
        captured, verified, and preserved primary source documents published on the open web. It is
        operated by a consortium of national libraries, university archives, and independent
        historians.
      </p>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Institutional Facts
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <tbody>
            <tr>
              <td className="w-[220px]">Founded</td>
              <td>14 March 1998</td>
            </tr>
            <tr>
              <td>Legal Form</td>
              <td>Nonprofit archival trust</td>
            </tr>
            <tr>
              <td>Governance</td>
              <td>Consortium of national and university archives</td>
            </tr>
            <tr>
              <td>Funding</td>
              <td>Public grants, institutional membership, individual donations</td>
            </tr>
            <tr>
              <td>Total Records</td>
              <td>{snapshot.articles.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td>Active Sources</td>
              <td>{snapshot.sources}</td>
            </tr>
            <tr>
              <td>Countries</td>
              <td>{snapshot.countries}</td>
            </tr>
            <tr>
              <td>Latest Snapshot</td>
              <td>{snapshot.isoDate}</td>
            </tr>
            <tr>
              <td>Latest Integrity Hash</td>
              <td className="break-all text-[11px]">{snapshot.hash}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Mandate
        </div>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">
          To preserve the public record faithfully, without commercial interest, without editorial
          intervention, and without geographic bias, for the benefit of future generations of
          historians, journalists, researchers, courts, and the general public.
        </p>
      </section>

      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Contact
        </div>
        <hr className="mt-1" />
        <table className="mt-2">
          <tbody>
            <tr>
              <td className="w-[220px]">Postal</td>
              <td>Public Internet Record, PO Box 1998, The Hague, Netherlands</td>
            </tr>
            <tr>
              <td>Correspondence</td>
              <td>records @ public-record.org</td>
            </tr>
            <tr>
              <td>Security Reports</td>
              <td>security @ public-record.org</td>
            </tr>
          </tbody>
        </table>
      </section>
    </SiteShell>
  );
}
