import { createFileRoute } from "@tanstack/react-router";
import { getSnapshotApi } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/snapshots/$date")({
  loader: async ({ params }) => {
    const result = await getSnapshotApi(params.date);
    return result;
  },
  head: ({ params }) => ({
    meta: [{ title: `Snapshot ${params.date} — API · Public Internet Record` }],
  }),
  component: ApiSnapshotRoute,
});

function ApiSnapshotRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
