import { createFileRoute } from "@tanstack/react-router";
import { getArchiveData } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/archive/$date")({
  loader: async ({ params }) => {
    const result = await getArchiveData(params.date);
    return result;
  },
  head: ({ params }) => ({
    meta: [{ title: `Archive ${params.date} — API · Public Internet Record` }],
  }),
  component: ApiArchiveRoute,
});

function ApiArchiveRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
