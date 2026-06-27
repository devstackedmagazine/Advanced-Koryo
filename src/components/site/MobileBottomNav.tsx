import { Link } from "@tanstack/react-router";
import { Home, Car, Gavel, Wrench, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const { t, lang } = useI18n();
  const items = [
    { to: "/", icon: Home, label: t.nav.home, exact: true },
    { to: "/cars", icon: Car, label: t.nav.cars, exact: false },
    { to: "/auctions", icon: Gavel, label: lang === "ar" ? "المزادات" : "Auctions", exact: false },
    { to: "/spare-parts", icon: Wrench, label: lang === "ar" ? "قطع" : "Parts", exact: false },
    { to: "/auth", icon: User, label: t.nav.account, exact: false },
  ] as const;


  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <ul className="grid grid-cols-5 h-16">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className="h-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: it.exact }}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? "text-gold" : ""}`} />
                    <span className="font-semibold">{it.label}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
