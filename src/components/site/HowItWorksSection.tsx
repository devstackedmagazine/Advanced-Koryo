import { Search, ShieldCheck, FileText, Ship } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const icons = [Search, ShieldCheck, FileText, Ship];

export function HowItWorksSection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16 lg:mt-24">
      <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {t.how.steps.map((s, i) => {
          const Icon = icons[i];
          return (
            <li key={i} className="rounded-2xl bg-card border border-border p-5 lg:p-6 relative">
              <div className="absolute top-4 end-4 text-5xl font-black text-primary/40 leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-foreground text-background mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-bold text-base">{s.t}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
