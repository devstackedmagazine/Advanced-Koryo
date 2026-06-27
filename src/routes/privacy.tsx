import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView } from "@/components/site/LegalPageView";
import { getLegalPage } from "@/lib/legal.functions";
import { PageLayout } from "@/components/site/PageLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Advanced Koryo" },
      { name: "description", content: "Privacy policy for Advanced Koryo." },
    ],
  }),
  loader: () => getLegalPage({ data: { slug: "privacy" } }),
  errorComponent: ({ error }) => (
    <PageLayout><div className="p-8 text-destructive">{error.message}</div></PageLayout>
  ),
  notFoundComponent: () => (
    <PageLayout><div className="p-8">Not found</div></PageLayout>
  ),
  component: PrivacyPage,
});

function PrivacyPage() {
  const page = Route.useLoaderData();
  return <LegalPageView page={page} />;
}
