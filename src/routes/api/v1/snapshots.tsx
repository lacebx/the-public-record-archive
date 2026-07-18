import { createFileRoute } from "@tanstack/react-router";
import { listSnapshots } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/snapshots")({
  loader: async () => {
    const result = await listSnapshots();
    return result;
  },
  head: () => ({
    meta: [{ title: "Snapshots — API · Public Internet Record" }],
  }),
  component: ApiSnapshotsRoute,
});

function ApiSnapshotsRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
