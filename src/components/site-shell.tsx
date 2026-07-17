import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/search", label: "Search" },
  { to: "/snapshots", label: "Snapshots" },
  { to: "/compare", label: "Compare" },
  { to: "/api", label: "API" },
  { to: "/documentation", label: "Documentation" },
  { to: "/about", label: "About" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-6">
      <header>
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
          public.record / est. 1998
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <Link to="/" className="text-black no-underline visited:text-black hover:underline">
            <span className="text-[15px] font-bold uppercase tracking-[0.08em]">
              Public Internet Record
            </span>
          </Link>
          <div className="text-[11px] text-[color:var(--muted-foreground)]">
            Permanent Historical Archive
          </div>
        </div>
        <hr className="mt-3" />
        <nav className="flex flex-wrap gap-x-4 gap-y-1 py-2 text-[12px]">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "underline font-bold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <hr />
      </header>

      <main className="py-6">{children}</main>

      <footer className="mt-10">
        <hr />
        <div className="flex flex-wrap justify-between gap-2 py-3 text-[11px] text-[color:var(--muted-foreground)]">
          <div>
            Public Internet Record &middot; Established 1998 &middot; Nonprofit Archival Trust
          </div>
          <div>
            <Link to="/documentation">Documentation</Link>
            {" · "}
            <Link to="/api">API</Link>
            {" · "}
            <Link to="/about">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
