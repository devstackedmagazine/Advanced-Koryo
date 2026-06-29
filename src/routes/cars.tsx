import { createFileRoute } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { VehicleCard } from "@/components/site/VehicleCard";
import { listVehicles } from "@/lib/catalog.functions";
import { useI18n } from "@/lib/i18n";
import { BRANDS, BRAND_MODELS } from "@/lib/brands";
import { SlidersHorizontal, X } from "lucide-react";

type Search = {
  q?: string;
  brand?: string; model?: string; year?: string; yearTo?: string;
  price?: string; priceMin?: string;
  fuel?: string; body?: string; kmMax?: string;
};

type SortKey = "new" | "low" | "high" | "kmLow";

// Exact API body-type taxonomy (section 6 of the filter reference).
const BODY_TYPES = [
  "City Car", "Subcompact", "Compact", "Mid-size", "Full-size",
  "SUV", "RV", "Van / Minivan", "Truck / Pickup",
];

// UI price thresholds are SAR; the API needs KRW (mapper uses KRW × 0.0028 = SAR).
const SAR_PER_KRW = 0.0028;

const SORT_TO_API: Record<SortKey, "newest" | "price-low" | "price-high" | "mileage-low"> = {
  new: "newest", low: "price-low", high: "price-high", kmLow: "mileage-low",
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
      brand: pick("brand"), model: pick("model"),
      year: pick("year"), yearTo: pick("yearTo"),
      price: pick("price"), priceMin: pick("priceMin"),
      fuel: pick("fuel"), body: pick("body"), kmMax: pick("kmMax"),
    };
  },
  component: CarsPage,
});

function CarsPage() {
  const search = Route.useSearch();
  const { t, lang } = useI18n();
  const [sort, setSort] = useState<SortKey>("new");
  const [filters, setFilters] = useState<Search>(search);
  const [showFilters, setShowFilters] = useState(false);
  const fetcher = useServerFn(listVehicles);

  const apiSort = SORT_TO_API[sort];

  // Main result query — filters are forwarded to the Rinevo API (server-side).
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["vehicles", "list", {
      brand: filters.brand, model: filters.model, year: filters.year, yearTo: filters.yearTo,
      price: filters.price, priceMin: filters.priceMin, fuel: filters.fuel, body: filters.body,
      kmMax: filters.kmMax, sort: apiSort,
    }],
    queryFn: () => fetcher({
      data: {
        limit: 100,
        brand: filters.brand || undefined,
        model: filters.model || undefined,
        yearFrom: filters.year ? Number(filters.year) : undefined,
        yearTo: filters.yearTo ? Number(filters.yearTo) : undefined,
        maxMileage: filters.kmMax ? Number(filters.kmMax) : undefined,
        priceFromKrw: filters.priceMin ? Math.round(Number(filters.priceMin) / SAR_PER_KRW) : undefined,
        priceToKrw: filters.price ? Math.round(Number(filters.price) / SAR_PER_KRW) : undefined,
        fuel: filters.fuel || undefined,
        bodyType: filters.body || undefined,
        sort: apiSort,
      },
    }),
    placeholderData: keepPreviousData,
  });

  // Models for the selected brand come from the scanned per-brand map.
  const models = filters.brand ? (BRAND_MODELS[filters.brand] ?? []) : [];

  const all = data ?? [];
  // Free-text search is not an API filter — apply it client-side over the result page.
  const list = useMemo(() => {
    if (!filters.q) return all;
    const q = filters.q.toLowerCase();
    return all.filter((c) =>
      [c.make, c.model, (c as any).title_ar, (c as any).title_en, (c as any).stock_number]
        .some((x) => String(x ?? "").toLowerCase().includes(q)),
    );
  }, [all, filters.q]);

  const activeFilterCount = [
    filters.brand, filters.model, filters.year, filters.price,
    filters.fuel, filters.body, filters.kmMax, filters.q,
  ].filter(Boolean).length;

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
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <input
              value={filters.q ?? ""}
              onChange={(e) => update("q", e.target.value)}
              placeholder={lang === "ar" ? "ابحث ماركة، موديل، رقم مخزون…" : "Search make, model, stock #…"}
              className="h-10 px-3 rounded-lg border border-border bg-surface text-sm w-full sm:w-64"
            />
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="lg:hidden flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-surface text-sm font-semibold"
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
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="flex-1 sm:flex-none h-10 px-3 rounded-lg border border-border bg-surface text-sm font-semibold"
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
                  {BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </FilterField>
              <FilterField label={t.search.model}>
                <select
                  value={filters.model ?? ""}
                  onChange={(e) => update("model", e.target.value)}
                  disabled={!filters.brand}
                  className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold disabled:opacity-50"
                >
                  <option value="">{filters.brand ? t.search.any : (lang === "ar" ? "اختر الماركة أولاً" : "Select brand first")}</option>
                  {models.map((m) => <option key={m} value={m}>{m.trim()}</option>)}
                </select>
              </FilterField>
              <FilterField label={t.search.year}>
                <select value={filters.year ?? ""} onChange={(e) => update("year", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {[2025, 2024, 2023, 2022, 2021, 2020, 2018, 2015, 2010].map((y) => <option key={y} value={y}>{y}+</option>)}
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
              <FilterField label={lang === "ar" ? "نوع الهيكل" : "Body type"}>
                <select value={filters.body ?? ""} onChange={(e) => update("body", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </FilterField>
            </div>
          </aside>

          {/* Results */}
          <div className={isFetching && !isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col animate-pulse">
                    <div className="aspect-[16/11] bg-surface-elevated" />
                    <div className="p-4 lg:p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="h-3 w-1/3 rounded bg-surface-elevated" />
                          <div className="h-5 w-3/4 rounded bg-surface-elevated" />
                          <div className="h-3 w-1/4 rounded bg-surface-elevated" />
                        </div>
                        <div className="space-y-1.5 shrink-0">
                          <div className="h-3 w-10 rounded bg-surface-elevated ms-auto" />
                          <div className="h-6 w-16 rounded bg-surface-elevated ms-auto" />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="h-8 rounded bg-surface-elevated" />
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                        <div className="h-9 w-24 rounded-lg bg-surface-elevated" />
                        <div className="h-9 flex-1 rounded-lg bg-surface-elevated" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                {activeFilterCount === 0
                  ? (lang === "ar" ? "لا توجد سيارات متاحة حالياً." : "No vehicles available at the moment.")
                  : (lang === "ar" ? "لا توجد سيارات تطابق التصفية." : "No vehicles match your filters.")}
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
