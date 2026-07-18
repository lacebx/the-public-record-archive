import { createFileRoute } from "@tanstack/react-router";
import { getDiffApi, type DiffQuery } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/diff")({
  validateSearch: (search: Record<string, string | undefined>): Partial<DiffQuery> => ({
    from: search.from ?? "",
    to: search.to ?? "",
    limit: search.limit ? Number(search.limit) : undefined,
    offset: search.offset ? Number(search.offset) : undefined,
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const { from, to, limit, offset } = deps.search;
    if (!from || !to) {
      return {
        success: false,
        data: undefined as never,
        error: {
          code: "VALIDATION_ERROR",
          message: "Both 'from' and 'to' parameters are required",
        },
      };
    }
    const result = await getDiffApi({ from, to, limit, offset });
    return result;
  },
  head: () => ({
    meta: [{ title: "Diff — API · Public Internet Record" }],
  }),
  component: ApiDiffRoute,
});

function ApiDiffRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
