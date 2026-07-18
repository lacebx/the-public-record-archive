import { createFileRoute } from "@tanstack/react-router";
import { getRecordById } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/records/$id")({
  loader: async ({ params }) => {
    const result = await getRecordById(params.id);
    return result;
  },
  head: ({ params }) => ({
    meta: [{ title: `Record ${params.id} — API · Public Internet Record` }],
  }),
  component: ApiRecordRoute,
});

function ApiRecordRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
