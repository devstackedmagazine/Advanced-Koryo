import { createFileRoute } from "@tanstack/react-router";
import { LegalPageView } from "@/components/site/LegalPageView";
import { getLegalPage } from "@/lib/legal.functions";
import { PageLayout } from "@/components/site/PageLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Advanced Koryo" },
      { name: "description", content: "Terms of use for Advanced Koryo." },
    ],
  }),
  loader: () => getLegalPage({ data: { slug: "terms" } }),
  errorComponent: ({ error }) => (
    <PageLayout><div className="p-8 text-destructive">{error.message}</div></PageLayout>
  ),
  notFoundComponent: () => (
    <PageLayout><div className="p-8">Not found</div></PageLayout>
  ),
  component: TermsPage,
});

function TermsPage() {
  const page = Route.useLoaderData();
  return <LegalPageView page={page} />;
}
