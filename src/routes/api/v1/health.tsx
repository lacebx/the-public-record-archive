import { createFileRoute } from "@tanstack/react-router";
import { healthCheck } from "../../../lib/api";

export const Route = createFileRoute("/api/v1/health")({
  loader: async () => {
    const result = await healthCheck();
    return result;
  },
  head: () => ({
    meta: [{ title: "API Health — Public Internet Record" }],
  }),
  component: ApiHealthRoute,
});

function ApiHealthRoute() {
  const data = Route.useLoaderData();
  return <pre className="api-response">{JSON.stringify(data, null, 2)}</pre>;
}
