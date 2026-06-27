import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Search } from "lucide-react";

const brands = ["Hyundai", "Kia", "Genesis", "KGM"];

export function SearchBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [brand, setBrand] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [fuel, setFuel] = useState("");

  return (
    <section className="relative -mt-2 lg:-mt-8">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (brand) params.set("brand", brand);
            if (yearMin) params.set("year", yearMin);
            if (priceMax) params.set("price", priceMax);
            if (fuel) params.set("fuel", fuel);
            navigate({ to: "/cars", search: Object.fromEntries(params) as never });
          }}
          className="rounded-2xl bg-card border border-border shadow-card p-4 lg:p-5 grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <Field label={t.search.brand}>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="field">
              <option value="">{t.search.any}</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label={t.search.year}>
            <select value={yearMin} onChange={(e) => setYearMin(e.target.value)} className="field">
              <option value="">{t.search.any}</option>
              {[2024, 2023, 2022, 2021, 2020].map((y) => <option key={y} value={y}>{y}+</option>)}
            </select>
          </Field>
          <Field label={t.search.price}>
            <select value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="field">
              <option value="">{t.search.any}</option>
              <option value="60000">≤ 60k</option>
              <option value="100000">≤ 100k</option>
              <option value="150000">≤ 150k</option>
              <option value="250000">≤ 250k</option>
            </select>
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
