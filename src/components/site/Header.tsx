import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Menu, X, Languages, User, Car, MessageCircle, ChevronDown } from "lucide-react";

const WA_KR = "https://wa.me/821072290580";
const WA_SA = "https://wa.me/966559906064";

type NavItem = { to: string; label: string };
type NavGroup = { label: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "items" in e;

export function Header() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);
  const desktopNavRef = useRef<HTMLUListElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpenGroup(null);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!desktopNavRef.current) return;
      if (!desktopNavRef.current.contains(e.target as Node)) setOpenGroup(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const entries: NavEntry[] = [
    { to: "/", label: t.nav.home },
    {
      label: lang === "ar" ? "المركبات" : "Vehicles",
      items: [
        { to: "/cars", label: t.nav.cars },
        { to: "/auctions", label: lang === "ar" ? "المزادات" : "Auctions" },
        { to: "/accessories", label: lang === "ar" ? "إكسسوارات" : "Accessories" },
        { to: "/spare-parts", label: lang === "ar" ? "قطع غيار" : "Spare parts" },
      ],
    },
    {
      label: lang === "ar" ? "خدمات الاستيراد" : "Import Services",
      items: [
        { to: "/services", label: lang === "ar" ? "خدماتنا" : "Our Services" },
        { to: "/request", label: t.nav.request },
        { to: "/calculator", label: t.nav.calculator },
        { to: "/how-it-works", label: t.nav.how },
      ],
    },
    {
      label: lang === "ar" ? "الشركة" : "Company",
      items: [
        { to: "/about", label: t.nav.about },
        { to: "/contact", label: t.nav.contact },
        { to: "/terms", label: lang === "ar" ? "شروط الاستخدام" : "Terms of Use" },
        { to: "/privacy", label: lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy" },
      ],
    },
  ];

  const groupActive = (g: NavGroup) => g.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"));

  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
      <nav className="mx-auto max-w-7xl px-4 lg:px-8 h-16 lg:h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="hidden relative grid place-items-center w-10 h-10 rounded-xl bg-foreground text-background">
            <Car className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-gold border-2 border-background" />
          </span>
          <span className="font-bold tracking-tight leading-tight">
            <span className="block text-base">{t.brand.name}</span>
            <span className="block text-[10px] text-muted-foreground -mt-0.5">{t.brand.tagline}</span>
          </span>
        </Link>

        <ul
          ref={desktopNavRef}
          className="hidden lg:flex items-center justify-center gap-7 text-sm text-muted-foreground min-w-0"
        >
          {entries.map((e) => {
            if (!isGroup(e)) {
              return (
                <li key={e.to}>
                  <Link
                    to={e.to}
                    className="hover:text-foreground transition-colors"
                    activeProps={{ className: "text-foreground font-semibold" }}
                    activeOptions={{ exact: e.to === "/" }}
                  >
                    {e.label}
                  </Link>
                </li>
              );
            }
            const isOpen = openGroup === e.label;
            const active = groupActive(e);
            return (
              <li
                key={e.label}
                className="relative"
                onMouseEnter={() => setOpenGroup(e.label)}
                onMouseLeave={() => setOpenGroup((g) => (g === e.label ? null : g))}
              >
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : e.label)}
                  className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
                    active ? "text-foreground font-semibold" : ""
                  }`}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                >
                  {e.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="absolute top-full start-0 mt-2 min-w-44 rounded-md border border-border bg-background shadow-md py-1 z-50">
                    {e.items.map((i) => (
                      <Link
                        key={i.to}
                        to={i.to}
                        onClick={() => setOpenGroup(null)}
                        className="block px-3 py-2 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                        activeProps={{ className: "text-foreground font-semibold bg-surface-elevated" }}
                      >
                        {i.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-semibold hover:bg-surface-elevated transition-colors"
            aria-label="Toggle language"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-foreground text-background text-xs font-semibold hover:bg-gold hover:text-gold-foreground transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            {t.nav.login}
          </Link>
          <a
            href={WA_KR}
            target="_blank"
            rel="noopener"
            className="!hidden items-center gap-1.5 h-9 px-3 rounded-full bg-whatsapp text-white text-xs font-semibold hover:opacity-90"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {lang === "ar" ? "كوريا" : "Korea"}
          </a>
          <a
            href={WA_SA}
            target="_blank"
            rel="noopener"
            className="!hidden items-center gap-1.5 h-9 px-3 rounded-full bg-whatsapp text-white text-xs font-semibold hover:opacity-90"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {lang === "ar" ? "السعودية" : "Saudi"}
          </a>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-surface-elevated"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <ul className="px-4 py-3 space-y-1 text-sm">
            {entries.map((e) => {
              if (!isGroup(e)) {
                return (
                  <li key={e.to}>
                    <Link
                      to={e.to}
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                      activeProps={{ className: "text-foreground font-semibold bg-surface-elevated" }}
                      activeOptions={{ exact: e.to === "/" }}
                    >
                      {e.label}
                    </Link>
                  </li>
                );
              }
              const isOpen = mobileOpenGroup === e.label;
              const active = groupActive(e);
              return (
                <li key={e.label}>
                  <button
                    type="button"
                    onClick={() => setMobileOpenGroup(isOpen ? null : e.label)}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-surface-elevated ${
                      active ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span>{e.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <ul className="mt-1 ms-3 ps-2 border-s border-border space-y-1">
                      {e.items.map((i) => (
                        <li key={i.to}>
                          <Link
                            to={i.to}
                            onClick={() => setOpen(false)}
                            className="block py-2 px-3 rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                            activeProps={{ className: "text-foreground font-semibold bg-surface-elevated" }}
                          >
                            {i.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            <li className="pt-2 border-t border-border mt-2 grid grid-cols-2 gap-2">
              <a href={WA_KR} target="_blank" rel="noopener" onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md bg-whatsapp text-white text-xs font-semibold">
                <MessageCircle className="w-3.5 h-3.5" />
                {lang === "ar" ? "كوريا" : "Korea"}
              </a>
              <a href={WA_SA} target="_blank" rel="noopener" onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md bg-whatsapp text-white text-xs font-semibold">
                <MessageCircle className="w-3.5 h-3.5" />
                {lang === "ar" ? "السعودية" : "Saudi"}
              </a>
            </li>
            <li>
              <Link to="/auth" onClick={() => setOpen(false)} className="block py-2.5 px-3 rounded-md font-semibold">
                {t.nav.login}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
