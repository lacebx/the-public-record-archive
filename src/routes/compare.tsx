import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { getSnapshotList } from "../lib/data";

export const Route = createFileRoute("/compare")({
  loader: async () => {
    const snapshots = await getSnapshotList();
    return { snapshots };
  },
  head: () => ({
    meta: [
      { title: "Compare Snapshots — Public Internet Record" },
      { name: "description", content: "Compare two snapshots and see what changed." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { snapshots } = Route.useLoaderData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: { added: number; removed: number; modified: number; unchanged: number };
    added: { id: string; title: string; publisher: string }[];
    removed: { id: string; title: string; publisher: string }[];
    modified: {
      id: string;
      title: string;
      publisher: string;
      fieldChanges: { field: string; from: unknown; to: unknown }[];
    }[];
    from: string;
    to: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAdded, setShowAdded] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);
  const [showModified, setShowModified] = useState(false);

  useEffect(() => {
    if (snapshots.length >= 2) {
      setFrom(snapshots[snapshots.length - 2].isoDate);
      setTo(snapshots[snapshots.length - 1].isoDate);
    } else if (snapshots.length === 1) {
      setTo(snapshots[0].isoDate);
    }
  }, [snapshots]);

  const handleCompare = async () => {
    if (!from || !to) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        `/api/v1/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message ?? "Unknown error");
      }
    } catch {
      setError("Failed to fetch diff");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: "added" | "removed" | "modified") => {
    if (section === "added") setShowAdded(!showAdded);
    if (section === "removed") setShowRemoved(!showRemoved);
    if (section === "modified") setShowModified(!showModified);
  };

  return (
    <SiteShell>
      <h1 className="text-[14px] font-bold uppercase tracking-[0.06em]">Compare Snapshots</h1>
      <hr className="mt-1" />
      <p className="mt-2 text-[12px] text-[color:var(--muted-foreground)]">
        Select two snapshots to see what changed between them.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            From
          </label>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1">
            <option value="">— Select —</option>
            {snapshots.map((s) => (
              <option key={s.isoDate} value={s.isoDate}>
                {s.isoDate} ({s.articles} records)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
            To
          </label>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1">
            <option value="">— Select —</option>
            {snapshots.map((s) => (
              <option key={s.isoDate} value={s.isoDate}>
                {s.isoDate} ({s.articles} records)
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleCompare} disabled={!from || !to || loading} className="btn">
          {loading ? "[ Comparing … ]" : "[ Compare ]"}
        </button>
      </div>

      {error && (
        <div className="mt-4 border border-red-600 p-3 text-[12px] text-red-600">{error}</div>
      )}

      {result && (
        <>
          <section className="mt-6">
            <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
              Summary — {result.from} vs {result.to}
            </div>
            <hr className="mt-1" />
            <div className="mt-3 grid grid-cols-4 gap-3">
              <SummaryCard
                label="Added"
                count={result.summary.added}
                color="var(--verified)"
                onClick={() => toggleSection("added")}
              />
              <SummaryCard
                label="Removed"
                count={result.summary.removed}
                color="#dc2626"
                onClick={() => toggleSection("removed")}
              />
              <SummaryCard
                label="Modified"
                count={result.summary.modified}
                color="#f59e0b"
                onClick={() => toggleSection("modified")}
              />
              <SummaryCard
                label="Unchanged"
                count={result.summary.unchanged}
                color="var(--muted-foreground)"
              />
            </div>
          </section>

          {showAdded && result.added.length > 0 && (
            <section className="mt-5">
              <div className="text-[11px] uppercase tracking-widest text-[color:var(--verified)]">
                + Added ({result.added.length})
              </div>
              <hr className="mt-1" />
              <div className="mt-2 space-y-1">
                {result.added.map((r) => (
                  <div key={r.id} className="text-[12px]">
                    <Link to="/record/$id" params={{ id: r.id }}>
                      {r.title}
                    </Link>
                    <span className="ml-2 text-[color:var(--muted-foreground)]">
                      — {r.publisher}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showRemoved && result.removed.length > 0 && (
            <section className="mt-5">
              <div className="text-[11px] uppercase tracking-widest text-red-600">
                − Removed ({result.removed.length})
              </div>
              <hr className="mt-1" />
              <div className="mt-2 space-y-1">
                {result.removed.map((r) => (
                  <div key={r.id} className="text-[12px]">
                    <span className="text-red-600 line-through">{r.title}</span>
                    <span className="ml-2 text-[color:var(--muted-foreground)]">
                      — {r.publisher}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showModified && result.modified.length > 0 && (
            <section className="mt-5">
              <div className="text-[11px] uppercase tracking-widest text-amber-500">
                ✎ Modified ({result.modified.length})
              </div>
              <hr className="mt-1" />
              <div className="mt-2 space-y-3">
                {result.modified.map((r) => (
                  <div key={r.id} className="border border-[color:var(--border)] p-3">
                    <div className="text-[12px] font-bold">
                      <Link to="/record/$id" params={{ id: r.id }}>
                        {r.title}
                      </Link>
                    </div>
                    <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                      {r.publisher}
                    </div>
                    <table className="mt-2 w-full text-[11px]">
                      <thead>
                        <tr>
                          <th className="w-[120px]">Field</th>
                          <th>From</th>
                          <th>To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.fieldChanges.map((fc, i) => (
                          <tr key={i}>
                            <td className="font-bold">{fc.field}</td>
                            <td className="text-red-600 line-through">
                              {String(fc.from ?? "(none)").slice(0, 80)}
                            </td>
                            <td className="text-[color:var(--verified)]">
                              {String(fc.to ?? "(none)").slice(0, 80)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </SiteShell>
  );
}

function SummaryCard({
  label,
  count,
  color,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="border border-[color:var(--border)] p-3 text-left transition-colors hover:bg-[color:var(--accent)]"
    >
      <div className="text-[24px] font-bold" style={{ color }}>
        {count.toLocaleString("en-US")}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
        {label}
      </div>
    </button>
  );
}
