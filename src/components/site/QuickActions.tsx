import { Link } from "@tanstack/react-router";
import { Car, FilePlus2, Calculator, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function QuickActions() {
  const { t } = useI18n();
  const actions = [
    { to: "/cars", icon: Car, ...t.quick.browse },
    { to: "/request", icon: FilePlus2, ...t.quick.request },
    { to: "/calculator", icon: Calculator, ...t.quick.calc },
    { href: "https://wa.me/966559906064", icon: MessageCircle, ...t.quick.wa, isWA: true },
  ] as const;

  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-10 lg:mt-14">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {actions.map((a) => {
          const Icon = a.icon;
          const inner = (
            <div className={`group h-full rounded-2xl border border-border bg-card hover:border-gold hover:shadow-card transition-all p-4 lg:p-5 flex flex-col gap-3`}>
              <div className={`grid place-items-center w-10 h-10 rounded-xl ${"isWA" in a && a.isWA ? "bg-whatsapp text-white" : "bg-primary text-primary-foreground"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm lg:text-base">{a.t}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.d}</div>
              </div>
            </div>
          );
          if ("href" in a) {
            return <a key={a.t} href={a.href} target="_blank" rel="noopener">{inner}</a>;
          }
          return <Link key={a.t} to={a.to}>{inner}</Link>;
        })}
      </div>
    </section>
  );
}
