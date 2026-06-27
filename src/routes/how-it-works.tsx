import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/site/PageLayout";
import { HowItWorksSection } from "@/components/site/HowItWorksSection";
import { WhyUs } from "@/components/site/WhyUs";


export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "كيف نستورد · Advanced Koryo" },
      { name: "description", content: "خطوات استيراد سيارتك من كوريا إلى السعودية." },
    ],
  }),
  component: () => (
    <PageLayout>
      <div className="pt-6" />
      <HowItWorksSection />
      <WhyUs />
      
    </PageLayout>
  ),
});
