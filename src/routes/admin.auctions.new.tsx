import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/auctions/new")({
  ssr: false,
  component: () => <Navigate to="/admin" replace search={{ tab: "auctions", action: "new" } as any} />,
});
