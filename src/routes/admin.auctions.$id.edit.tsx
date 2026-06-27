import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/auctions/$id/edit")({
  ssr: false,
  component: () => {
    const { id } = Route.useParams();
    return <Navigate to="/admin" replace search={{ tab: "auctions", edit: id } as any} />;
  },
});
