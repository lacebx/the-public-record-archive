import { createFileRoute } from "@tanstack/react-router";
import { ApiReferenceReact } from "@scalar/api-reference-react";

export const Route = createFileRoute("/api/playground")({
  head: () => ({
    meta: [
      { title: "API Playground — Public Internet Record" },
      {
        name: "description",
        content: "Interactive API playground for the Public Internet Record.",
      },
      { property: "og:title", content: "API Playground — Public Internet Record" },
    ],
  }),
  component: ApiPlaygroundPage,
});

function ApiPlaygroundPage() {
  return (
    <div className="min-h-screen">
      <ApiReferenceReact
        configuration={{
          url: "/openapi.json",
          theme: "purple",
          showSidebar: true,
          hideDownloadButton: false,
        }}
      />
    </div>
  );
}
