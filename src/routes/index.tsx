import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/site/PageLayout";
import { Hero } from "@/components/site/Hero";
import { SearchBar } from "@/components/site/SearchBar";
import { QuickActions } from "@/components/site/QuickActions";
import { CarSection } from "@/components/site/CarSection";
import { HowItWorksSection } from "@/components/site/HowItWorksSection";
import { WhyUs } from "@/components/site/WhyUs";
import { TrustSection } from "@/components/site/TrustSection";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Advanced Koryo · تصدير واستيراد السيارات من كوريا " },
      { name: "description", content: "تصدير واستيراد السيارات من كوريا إلى السعودية ودول الخليج والعالم." },
      { property: "og:title", content: "Advanced Koryo · Korean car import" },
      { property: "og:description", content: "Source, inspect, and ship Korean vehicles to KSA & the GCC." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageLayout>
      <Sections />
    </PageLayout>
  );
}

function Sections() {
  const { t } = useI18n();
  return (
    <>
      <Hero />
      <SearchBar />
      <QuickActions />
      <CarSection filter="featured" eyebrow={t.featured.eyebrow} title={t.featured.title} sub={t.featured.sub} />
      <CarSection filter="deal" eyebrow={t.deals.eyebrow} title={t.deals.title} sub={t.deals.sub} />
      <CarSection filter="auction" eyebrow={t.auction.eyebrow} title={t.auction.title} sub={t.auction.sub} />
      <HowItWorksSection />
      <WhyUs />
      <TrustSection />
      
    </>
  );
}
