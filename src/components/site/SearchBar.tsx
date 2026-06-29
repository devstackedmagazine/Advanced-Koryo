import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Search } from "lucide-react";
import { BRANDS, brandLogoUrl } from "@/lib/brands";

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2018, 2016, 2014, 2012, 2010];
const PRICES = [50000, 80000, 100000, 150000, 200000, 300000, 500000];

export function SearchBar() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [brand, setBrand] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [fuel, setFuel] = useState("");

  function submitSearch() {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (yearMin) params.set("year", yearMin);
    if (yearMax) params.set("yearTo", yearMax);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("price", priceMax);
    if (fuel) params.set("fuel", fuel);
    navigate({ to: "/cars", search: Object.fromEntries(params) as never });
  }

  return (
    <section className="relative -mt-2 lg:-mt-8">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <form
          onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
          className="rounded-2xl bg-card border border-border shadow-card p-4 lg:p-5 grid grid-cols-2 lg:grid-cols-5 items-end gap-3"
        >
          <Field label={t.search.brand}>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="field">
              <option value="">{t.search.any}</option>
              {BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
          <Field label={t.search.year}>
            <div className="flex gap-2">
              <select value={yearMin} onChange={(e) => setYearMin(e.target.value)} className="field" aria-label={lang === "ar" ? "من سنة" : "Year from"}>
                <option value="">{lang === "ar" ? "من" : "From"}</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={yearMax} onChange={(e) => setYearMax(e.target.value)} className="field" aria-label={lang === "ar" ? "إلى سنة" : "Year to"}>
                <option value="">{lang === "ar" ? "إلى" : "To"}</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </Field>
          <Field label={lang === "ar" ? "السعر (ر.س)" : "Price (SAR)"}>
            <div className="flex gap-2">
              <select value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="field" aria-label={lang === "ar" ? "السعر من" : "Price from"}>
                <option value="">{lang === "ar" ? "من" : "From"}</option>
                {PRICES.map((p) => <option key={p} value={p}>{p / 1000}k</option>)}
              </select>
              <select value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="field" aria-label={lang === "ar" ? "السعر إلى" : "Price to"}>
                <option value="">{lang === "ar" ? "إلى" : "To"}</option>
                {PRICES.map((p) => <option key={p} value={p}>{p / 1000}k</option>)}
              </select>
            </div>
          </Field>
          <Field label={t.search.fuel}>
            <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="field">
              <option value="">{t.search.any}</option>
              <option value="petrol">{t.fuels.petrol}</option>
              <option value="diesel">{t.fuels.diesel}</option>
              <option value="hybrid">{t.fuels.hybrid}</option>
              <option value="electric">{t.fuels.electric}</option>
            </select>
          </Field>
          <button
            type="submit"
            className="col-span-2 lg:col-span-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-foreground text-background font-bold text-sm hover:bg-gold hover:text-gold-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
            {t.search.submit}
          </button>
        </form>

        {/* Browse-by-brand strip — shows which brands are available at a glance */}
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2 px-1">
            {lang === "ar" ? "تصفح حسب الماركة" : "Browse by brand"}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BRANDS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => navigate({ to: "/cars", search: { brand: b.value } as never })}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-3.5 rounded-full border border-border bg-card hover:border-gold hover:shadow-card transition-all text-sm font-semibold"
              >
                {brandLogoUrl(b.slug) && (
                  <img
                    src={brandLogoUrl(b.slug)!}
                    alt=""
                    width={18}
                    height={18}
                    loading="lazy"
                    className="w-[18px] h-[18px] object-contain"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .field {
          width: 100%;
          height: 2.75rem;
          padding: 0 0.75rem;
          border-radius: 0.625rem;
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--foreground);
          appearance: none;
        }
        .field:focus { outline: 2px solid var(--gold); }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</div>
      {children}
    </label>
  );
}
