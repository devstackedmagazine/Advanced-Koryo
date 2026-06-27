import { MapPin, BadgeDollarSign, ShieldCheck, Ship } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const icons = [MapPin, BadgeDollarSign, ShieldCheck, Ship];

export function WhyUs() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16 lg:mt-24">
      <div className="rounded-3xl bg-foreground text-background p-6 lg:p-12 grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">{t.why.eyebrow}</div>
          <h2 className="mt-2 text-2xl lg:text-4xl font-bold leading-tight">{t.why.title}</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-5">
          {t.why.items.map((it, i) => {
            const Icon = icons[i];
            return (
              <li key={i} className="flex gap-3">
                <div className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-gold text-gold-foreground">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold">{it.t}</div>
                  <p className="text-sm text-background/70 mt-1">{it.d}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
