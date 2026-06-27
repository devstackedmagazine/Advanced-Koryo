import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/site/PageLayout";
import { TrustSection } from "@/components/site/TrustSection";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us · Advanced Koryo" },
      { name: "description", content: "Learn about Advanced Koryo — specialists in exporting cars from South Korea." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 lg:px-8 py-10 lg:py-16">
        <h1 className="text-3xl lg:text-5xl font-bold">{t.about.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{t.about.sub}</p>
        
        <div className="mt-6 text-base leading-relaxed max-w-3xl whitespace-pre-line text-foreground/90">
          {t.about.body.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-4" />;
            
            const boldPhrases = [
              "ادفاسد كوريو: جسركم الموثوق إلى عالم السيارات الكورية",
              "ماذا نقدم؟",
              "الاختيار والفحص الدقيق:\u00a0",
              "التفاوض الاحترافي:",
              "تخليص الإجراءات:",
              "شحن حتى باب منزلك:",
              "رؤيتنا وقيمنا",
              "ادفاسد كوريو.. من كوريا، إلى باب منزلك.",
              "Advanced Koryo: Your trusted bridge to the world of Korean cars",
              "What we offer?",
              "Precise selection & inspection:",
              "Professional negotiation:",
              "Paperwork & clearance:",
              "Shipping to your doorstep:",
              "Our vision and values",
              "Advanced Koryo.. from Korea, to your doorstep."
            ];
            
            const isBold = boldPhrases.some(phrase => line.trim() === phrase);
            
            if (isBold) {
              return (
                <b key={i} className="block text-lg mt-8 mb-4 text-foreground font-bold">
                  {line}
                </b>
              );
            }
            
            return (
              <p key={i} className="mb-4">
                {line}
              </p>
            );
          })}
        </div>

        <dl className="mt-10 grid sm:grid-cols-3 gap-4">
          {t.about.facts.map((f) => (
            <div key={f.k} className="rounded-2xl bg-surface border border-border p-6">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{f.k}</dt>
              <dd className="mt-2 text-2xl font-bold text-gold">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <TrustSection />
    </PageLayout>
  );
}
