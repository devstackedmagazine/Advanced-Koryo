import { Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function TrustSection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16 lg:mt-24">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">{t.trust.eyebrow}</div>
        <h2 className="mt-2 text-2xl lg:text-4xl font-bold">{t.trust.title}</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {t.trust.items.map((it, i) => (
          <figure key={i} className="rounded-2xl bg-surface border border-border p-6">
            <Quote className="w-6 h-6 text-gold mb-3" />
            <blockquote className="text-sm lg:text-base leading-relaxed">"{it.q}"</blockquote>
            <figcaption className="mt-4 pt-4 border-t border-border text-xs">
              <span className="font-bold">{it.n}</span>
              <span className="text-muted-foreground">{it.c}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
