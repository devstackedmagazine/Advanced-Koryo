import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 max-w-sm">
          <div className="font-bold text-lg">
            {t.brand.name}
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t.footer.about}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t.footer.links}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/cars" className="hover:text-gold">{t.nav.cars}</Link></li>
            <li><Link to="/accessories" className="hover:text-gold">{lang === "ar" ? "إكسسوارات" : "Accessories"}</Link></li>
            <li><Link to="/spare-parts" className="hover:text-gold">{lang === "ar" ? "قطع غيار" : "Spare parts"}</Link></li>
            <li><Link to="/request" className="hover:text-gold">{t.nav.request}</Link></li>
            <li><Link to="/calculator" className="hover:text-gold">{t.nav.calculator}</Link></li>
            <li><Link to="/how-it-works" className="hover:text-gold">{t.nav.how}</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t.footer.contact}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">{t.nav.about}</Link></li>
            <li><Link to="/contact" className="hover:text-gold">{t.nav.contact}</Link></li>
            <li><a href="https://wa.me/966559906064" target="_blank" rel="noopener" className="hover:text-gold">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}</span>
          <span>Seoul · Riyadh</span>
        </div>
      </div>
    </footer>
  );
}
