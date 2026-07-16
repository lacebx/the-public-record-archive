import { createFileRoute } from "@tanstack/react-router";
import { searchRecords } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/search")({
  validateSearch: (search: Record<string, string | undefined>) => ({
    q: search.q ?? "",
    limit: search.limit ? Number(search.limit) : undefined,
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const { q, limit } = deps.search;
    if (!q) {
      return {
        success: false,
        data: undefined as never,
        error: { code: "VALIDATION_ERROR", message: "Query parameter 'q' is required" },
      };
    }
    const result = await searchRecords({ q, limit });
    return result;
  },
  head: () => ({
    meta: [{ title: "Search — API · Public Internet Record" }],
  }),
  component: ApiSearchRoute,
});

function ApiSearchRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
