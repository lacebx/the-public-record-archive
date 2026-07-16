import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/")({
  loader: () => {
    throw redirect({ to: "/api" });
  },
  component: () => null,
});
