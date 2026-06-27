import { PageLayout } from "./PageLayout";
import { useI18n } from "@/lib/i18n";
import type { LegalPage } from "@/lib/legal.functions";

export function LegalPageView({ page }: { page: LegalPage | null }) {
  const { lang } = useI18n();
  if (!page) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">
          {lang === "ar" ? "الصفحة غير متوفرة." : "Page not available."}
        </div>
      </PageLayout>
    );
  }
  const title = lang === "ar" ? page.title_ar : page.title_en;
  const sections = lang === "ar" ? page.content_ar : page.content_en;
  const updated = new Date(page.updated_at).toLocaleDateString(lang === "ar" ? "ar" : "en");

  return (
    <PageLayout>
      <article
        className="mx-auto max-w-3xl px-4 py-12 lg:py-16 bg-background"
        style={{ color: page.text_color }}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: page.heading_color }}>
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          {lang === "ar" ? "آخر تحديث: " : "Last updated: "}{updated}
        </p>
        <div className="space-y-8 leading-relaxed">
          {sections.map((s, i) => (
            <section key={i}>
              {s.heading && (
                <h2 className="text-xl lg:text-2xl font-bold mb-3" style={{ color: page.heading_color }}>
                  {s.heading}
                </h2>
              )}
              {s.body && <p className="whitespace-pre-line">{s.body}</p>}
            </section>
          ))}
        </div>
      </article>
    </PageLayout>
  );
}
