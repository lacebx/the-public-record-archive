import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/documentation")({
  head: () => ({
    meta: [
      { title: "Documentation — Public Internet Record" },
      {
        name: "description",
        content: "Documentation for the Public Internet Record: formats, integrity model, and access.",
      },
      { property: "og:title", content: "Documentation — Public Internet Record" },
      {
        property: "og:description",
        content: "Formats, integrity model, and access documentation for the permanent record.",
      },
    ],
  }),
  component: Docs,
});

function Docs() {
  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Documentation</h1>
      <hr className="mt-1" />

      <nav className="mt-3 text-[12px]">
        <span className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Table of Contents
        </span>
        <ul className="mt-1 list-none space-y-0.5">
          <li>1. <a href="#overview">Overview</a></li>
          <li>2. <a href="#records">Record Structure</a></li>
          <li>3. <a href="#snapshots">Snapshot Format</a></li>
          <li>4. <a href="#integrity">Integrity Model</a></li>
          <li>5. <a href="#access">Access and Licensing</a></li>
        </ul>
      </nav>

      <section id="overview" className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">1. Overview</h2>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">
          The Public Internet Record is a permanent, publicly accessible archive of primary source
          documents published on the open web. The project was established in 1998 by a consortium of
          archivists, librarians, historians, and government record keepers. Its sole purpose is the
          faithful preservation of the public record.
        </p>
      </section>

      <section id="records" className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">2. Record Structure</h2>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">
          Every record contains an immutable identifier, publisher, publication timestamp, archival
          timestamp, category, country of origin, source URL, cryptographic hash, and a full text
          summary. Records are never edited; corrections are recorded as new revisions.
        </p>
      </section>

      <section id="snapshots" className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">3. Snapshot Format</h2>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">
          Snapshots are distributed as WARC 1.1 files accompanied by a JSON manifest. The manifest
          enumerates every record and its SHA-256 hash. The snapshot root hash is a Merkle root over
          all record hashes.
        </p>
      </section>

      <section id="integrity" className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">4. Integrity Model</h2>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">
          Records are captured by multiple independent archival nodes. Each node signs the captured
          content with its archival key. A record is marked <em>Integrity Verified</em> only when at
          least three geographically distinct witness nodes agree on the resulting hash.
        </p>
      </section>

      <section id="access" className="mt-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em]">5. Access and Licensing</h2>
        <hr className="mt-1" />
        <p className="mt-2 text-[13px] leading-relaxed">
          Access to the archive is free of charge and free of registration. The archive metadata is
          released to the public domain. Original source documents retain the copyright of their
          respective publishers and are preserved under recognised research and preservation
          exceptions.
        </p>
      </section>
    </SiteShell>
  );
}
