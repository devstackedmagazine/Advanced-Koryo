import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { VehicleCard } from "@/components/site/VehicleCard";
import { listVehicles } from "@/lib/catalog.functions";
import { useI18n } from "@/lib/i18n";
import { SlidersHorizontal, X } from "lucide-react";

type Search = {
  q?: string;
  brand?: string; model?: string; year?: string; price?: string;
  fuel?: string; trans?: string; body?: string; kmMax?: string;
  status?: string;
};

export const Route = createFileRoute("/cars")({
  head: () => ({
    meta: [
      { title: "السيارات · Advanced Koryo" },
      { name: "description", content: "تصفح أحدث السيارات الكورية المتوفرة للاستيراد." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const pick = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : undefined);
    return {
      q: pick("q"),
      brand: pick("brand"), model: pick("model"), year: pick("year"), price: pick("price"),
      fuel: pick("fuel"), trans: pick("trans"), body: pick("body"), kmMax: pick("kmMax"),
      status: pick("status"),
    };
  },
  component: CarsPage,
});

function CarsPage() {
  const search = Route.useSearch();
  const { t, lang } = useI18n();
  const [sort, setSort] = useState<"new" | "low" | "high" | "kmLow">("new");
  const [filters, setFilters] = useState<Search>(search);
  const [showFilters, setShowFilters] = useState(false);
  const fetcher = useServerFn(listVehicles);
  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", "all"],
    queryFn: () => fetcher({ data: { limit: 100 } }),
  });

  const all = data ?? [];
  const brands = useMemo(() => Array.from(new Set(all.map((v) => v.make))).sort(), [all]);
  const models = useMemo(
    () => Array.from(new Set(all.filter((v) => !filters.brand || v.make === filters.brand).map((v) => v.model))).sort(),
    [all, filters.brand],
  );
  const bodyTypes = useMemo(() => Array.from(new Set(all.map((v) => v.body_type).filter(Boolean) as string[])).sort(), [all]);

  const list = useMemo(() => {
    let l = all.slice();
    if (filters.q) {
      const q = filters.q.toLowerCase();
      l = l.filter((c) =>
        [c.make, c.model, (c as any).title_ar, (c as any).title_en, (c as any).stock_number]
          .some((x) => String(x ?? "").toLowerCase().includes(q)),
      );
    }
    if (filters.brand) l = l.filter((c) => c.make === filters.brand);
    if (filters.model) l = l.filter((c) => c.model === filters.model);
    if (filters.year) l = l.filter((c) => c.year >= Number(filters.year));
    if (filters.price) l = l.filter((c) => (c.price_sar ?? 0) <= Number(filters.price));
    if (filters.fuel) l = l.filter((c) => (c.fuel ?? "").toLowerCase() === filters.fuel);
    if (filters.trans) l = l.filter((c) => (c.transmission ?? "").toLowerCase().includes(filters.trans!));
    if (filters.body) l = l.filter((c) => (c as any).body_type === filters.body);
    if (filters.kmMax) l = l.filter((c) => (c.mileage_km ?? 0) <= Number(filters.kmMax));
    if (filters.status) l = l.filter((c) => c.status === filters.status);
    if (sort === "low") l.sort((a, b) => (a.price_sar ?? 0) - (b.price_sar ?? 0));
    if (sort === "high") l.sort((a, b) => (b.price_sar ?? 0) - (a.price_sar ?? 0));
    if (sort === "kmLow") l.sort((a, b) => (a.mileage_km ?? Infinity) - (b.mileage_km ?? Infinity));
    if (sort === "new") l.sort((a, b) => b.year - a.year);
    return l;
  }, [all, filters, sort]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function update<K extends keyof Search>(k: K, v: Search[K]) {
    setFilters((f) => ({ ...f, [k]: v || undefined }));
  }
  function reset() { setFilters({}); }

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-8 lg:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">{t.nav.cars}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {list.length} {lang === "ar" ? "سيارة" : "vehicles"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={filters.q ?? ""}
              onChange={(e) => update("q", e.target.value)}
              placeholder={lang === "ar" ? "ابحث ماركة، موديل، رقم مخزون…" : "Search make, model, stock #…"}
              className="h-10 px-3 rounded-lg border border-border bg-surface text-sm w-64"
            />
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="lg:hidden inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-surface text-sm font-semibold"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {lang === "ar" ? "تصفية" : "Filters"}
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold text-gold-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as never)}
              className="h-10 px-3 rounded-lg border border-border bg-surface text-sm font-semibold"
            >
              <option value="new">{lang === "ar" ? "الأحدث" : "Newest year"}</option>
              <option value="low">{lang === "ar" ? "السعر: الأقل" : "Price: low → high"}</option>
              <option value="high">{lang === "ar" ? "السعر: الأعلى" : "Price: high → low"}</option>
              <option value="kmLow">{lang === "ar" ? "الكيلومترات: الأقل" : "Mileage: low → high"}</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Filters */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-24 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm">{lang === "ar" ? "تصفية" : "Filters"}</h2>
                {activeFilterCount > 0 && (
                  <button onClick={reset} className="text-xs text-gold font-bold inline-flex items-center gap-1">
                    <X className="w-3 h-3" /> {lang === "ar" ? "مسح" : "Clear"}
                  </button>
                )}
              </div>
              <FilterField label={t.search.brand}>
                <select value={filters.brand ?? ""} onChange={(e) => { update("brand", e.target.value); update("model", ""); }} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </FilterField>
              <FilterField label={t.search.model}>
                <select value={filters.model ?? ""} onChange={(e) => update("model", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </FilterField>
              <FilterField label={t.search.year}>
                <select value={filters.year ?? ""} onChange={(e) => update("year", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {[2025, 2024, 2023, 2022, 2021, 2020, 2018, 2015].map((y) => <option key={y} value={y}>{y}+</option>)}
                </select>
              </FilterField>
              <FilterField label={lang === "ar" ? "السعر الأقصى (ر.س)" : "Max price (SAR)"}>
                <select value={filters.price ?? ""} onChange={(e) => update("price", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="60000">≤ 60,000</option>
                  <option value="100000">≤ 100,000</option>
                  <option value="150000">≤ 150,000</option>
                  <option value="250000">≤ 250,000</option>
                  <option value="500000">≤ 500,000</option>
                </select>
              </FilterField>
              <FilterField label={lang === "ar" ? "الممشى الأقصى" : "Max mileage"}>
                <select value={filters.kmMax ?? ""} onChange={(e) => update("kmMax", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="30000">≤ 30,000 km</option>
                  <option value="60000">≤ 60,000 km</option>
                  <option value="100000">≤ 100,000 km</option>
                  <option value="150000">≤ 150,000 km</option>
                </select>
              </FilterField>
              <FilterField label={t.search.fuel}>
                <select value={filters.fuel ?? ""} onChange={(e) => update("fuel", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="petrol">{t.fuels.petrol}</option>
                  <option value="diesel">{t.fuels.diesel}</option>
                  <option value="hybrid">{t.fuels.hybrid}</option>
                  <option value="electric">{t.fuels.electric}</option>
                </select>
              </FilterField>
              <FilterField label={lang === "ar" ? "ناقل الحركة" : "Transmission"}>
                <select value={filters.trans ?? ""} onChange={(e) => update("trans", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="auto">{t.transmissions.auto}</option>
                  <option value="manual">{t.transmissions.manual}</option>
                </select>
              </FilterField>
              {bodyTypes.length > 0 && (
                <FilterField label={lang === "ar" ? "نوع الهيكل" : "Body type"}>
                  <select value={filters.body ?? ""} onChange={(e) => update("body", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                    <option value="">{t.search.any}</option>
                    {bodyTypes.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </FilterField>
              )}
              <FilterField label={lang === "ar" ? "الحالة" : "Status"}>
                <select value={filters.status ?? ""} onChange={(e) => update("status", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="available">{lang === "ar" ? "متوفرة" : "Available"}</option>
                  <option value="reserved">{lang === "ar" ? "محجوزة" : "Reserved"}</option>
                  <option value="sold">{lang === "ar" ? "مباعة" : "Sold"}</option>
                  <option value="under_review">{lang === "ar" ? "تحت المراجعة" : "Under review"}</option>
                  <option value="coming_soon">{lang === "ar" ? "قريباً" : "Coming soon"}</option>
                </select>
              </FilterField>
            </div>
          </aside>

          {/* Results */}
          <div>
            {isLoading ? (
              <p className="text-muted-foreground">…</p>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                {lang === "ar" ? "لا توجد سيارات تطابق التصفية." : "No vehicles match your filters."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {list.map((v) => <VehicleCard key={v.id} v={v as any} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
