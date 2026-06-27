import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/auctions")({
  ssr: false,
  component: () => <Navigate to="/admin" replace search={{ tab: "auctions" } as any} />,
});
