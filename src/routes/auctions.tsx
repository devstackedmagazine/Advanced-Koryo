import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { VehicleCard } from "@/components/site/VehicleCard";
import { listAuctions } from "@/lib/catalog.functions";
import { useI18n } from "@/lib/i18n";
import { SlidersHorizontal, X, Gavel } from "lucide-react";

type Search = {
  q?: string;
  brand?: string; model?: string;
  yearFrom?: string; yearTo?: string;
  priceFrom?: string; priceTo?: string;
  kmFrom?: string; kmTo?: string;
  fuel?: string; trans?: string; body?: string;
  source?: string; aStatus?: string;
};

export const Route = createFileRoute("/auctions")({
  head: () => ({
    meta: [
      { title: "مزادات السيارات من كوريا · Advanced Koryo" },
      { name: "description", content: "تصفح سيارات المزادات المتاحة من كوريا الجنوبية، واطلب منا الفحص والمزايدة والتصدير." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const pick = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : undefined);
    return {
      q: pick("q"),
      brand: pick("brand"), model: pick("model"),
      yearFrom: pick("yearFrom"), yearTo: pick("yearTo"),
      priceFrom: pick("priceFrom"), priceTo: pick("priceTo"),
      kmFrom: pick("kmFrom"), kmTo: pick("kmTo"),
      fuel: pick("fuel"), trans: pick("trans"), body: pick("body"),
      source: pick("source"), aStatus: pick("aStatus"),
    };
  },
  component: AuctionsPage,
});

const AUCTION_SOURCES = ["Hyundai Glovis", "Lotte Auction", "K Car Auction", "Other"];
const AUCTION_STATUSES = [
  { v: "available_bid", ar: "متاح للمزايدة", en: "Open for bid" },
  { v: "ending_soon",   ar: "مزاد قريب",     en: "Ending soon" },
  { v: "ended",         ar: "انتهى المزاد",  en: "Auction ended" },
  { v: "purchased",     ar: "تم الشراء",     en: "Purchased" },
  { v: "unavailable",   ar: "غير متاح",      en: "Unavailable" },
];

function AuctionsPage() {
  const search = Route.useSearch();
  const { t, lang } = useI18n();
  const [sort, setSort] = useState<"endingSoon" | "new" | "low" | "high" | "kmLow">("endingSoon");
  const [filters, setFilters] = useState<Search>(search);
  const [showFilters, setShowFilters] = useState(false);
  const [shown, setShown] = useState(24);
  const fetcher = useServerFn(listAuctions);
  const { data, isLoading } = useQuery({
    queryKey: ["auctions", "all"],
    queryFn: () => fetcher({ data: { limit: 100 } }),
  });

  const all = (data ?? []) as any[];
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
        [c.make, c.model, c.title_ar, c.title_en, c.stock_number]
          .some((x) => String(x ?? "").toLowerCase().includes(q)),
      );
    }
    if (filters.brand) l = l.filter((c) => c.make === filters.brand);
    if (filters.model) l = l.filter((c) => c.model === filters.model);
    if (filters.yearFrom) l = l.filter((c) => c.year >= Number(filters.yearFrom));
    if (filters.yearTo) l = l.filter((c) => c.year <= Number(filters.yearTo));
    if (filters.priceFrom) l = l.filter((c) => (c.price_sar ?? 0) >= Number(filters.priceFrom));
    if (filters.priceTo) l = l.filter((c) => (c.price_sar ?? 0) <= Number(filters.priceTo));
    if (filters.kmFrom) l = l.filter((c) => (c.mileage_km ?? 0) >= Number(filters.kmFrom));
    if (filters.kmTo) l = l.filter((c) => (c.mileage_km ?? 0) <= Number(filters.kmTo));
    if (filters.fuel) l = l.filter((c) => (c.fuel ?? "").toLowerCase() === filters.fuel);
    if (filters.trans) l = l.filter((c) => (c.transmission ?? "").toLowerCase().includes(filters.trans!));
    if (filters.body) l = l.filter((c) => c.body_type === filters.body);
    if (filters.source) l = l.filter((c) => c.auction_source === filters.source);
    if (filters.aStatus) l = l.filter((c) => c.auction_status === filters.aStatus);
    if (sort === "endingSoon") l.sort((a, b) => new Date(a.auction_end_at ?? 8e15).getTime() - new Date(b.auction_end_at ?? 8e15).getTime());
    if (sort === "low") l.sort((a, b) => (a.current_bid_krw ?? 0) - (b.current_bid_krw ?? 0));
    if (sort === "high") l.sort((a, b) => (b.current_bid_krw ?? 0) - (a.current_bid_krw ?? 0));
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
            <h1 className="text-3xl lg:text-4xl font-bold inline-flex items-center gap-2">
              <Gavel className="w-7 h-7 text-gold" />
              {lang === "ar" ? "مزادات السيارات من كوريا" : "Korean Car Auctions"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {lang === "ar"
                ? "تصفح سيارات المزادات المتاحة من كوريا الجنوبية، واطلب منا الفحص والمزايدة والتصدير."
                : "Browse auction cars from South Korea — request inspection, bidding, and export."}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
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
              <option value="endingSoon">{lang === "ar" ? "ينتهي قريباً" : "Ending soon"}</option>
              <option value="new">{lang === "ar" ? "الأحدث" : "Newest year"}</option>
              <option value="low">{lang === "ar" ? "العرض: الأقل" : "Bid: low → high"}</option>
              <option value="high">{lang === "ar" ? "العرض: الأعلى" : "Bid: high → low"}</option>
              <option value="kmLow">{lang === "ar" ? "الكيلومترات: الأقل" : "Mileage: low → high"}</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
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
              <Field label={t.search.brand}>
                <select value={filters.brand ?? ""} onChange={(e) => { update("brand", e.target.value); update("model", ""); }} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label={t.search.model}>
                <select value={filters.model ?? ""} onChange={(e) => update("model", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={lang === "ar" ? "السنة من" : "Year from"}>
                  <input type="number" value={filters.yearFrom ?? ""} onChange={(e) => update("yearFrom", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm" />
                </Field>
                <Field label={lang === "ar" ? "السنة إلى" : "Year to"}>
                  <input type="number" value={filters.yearTo ?? ""} onChange={(e) => update("yearTo", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm" />
                </Field>
                <Field label={lang === "ar" ? "السعر من (ر.س)" : "Price from"}>
                  <input type="number" value={filters.priceFrom ?? ""} onChange={(e) => update("priceFrom", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm" />
                </Field>
                <Field label={lang === "ar" ? "السعر إلى (ر.س)" : "Price to"}>
                  <input type="number" value={filters.priceTo ?? ""} onChange={(e) => update("priceTo", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm" />
                </Field>
                <Field label={lang === "ar" ? "كم من" : "Km from"}>
                  <input type="number" value={filters.kmFrom ?? ""} onChange={(e) => update("kmFrom", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm" />
                </Field>
                <Field label={lang === "ar" ? "كم إلى" : "Km to"}>
                  <input type="number" value={filters.kmTo ?? ""} onChange={(e) => update("kmTo", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm" />
                </Field>
              </div>
              <Field label={t.search.fuel}>
                <select value={filters.fuel ?? ""} onChange={(e) => update("fuel", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="petrol">{t.fuels.petrol}</option>
                  <option value="diesel">{t.fuels.diesel}</option>
                  <option value="hybrid">{t.fuels.hybrid}</option>
                  <option value="electric">{t.fuels.electric}</option>
                </select>
              </Field>
              <Field label={lang === "ar" ? "ناقل الحركة" : "Transmission"}>
                <select value={filters.trans ?? ""} onChange={(e) => update("trans", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  <option value="auto">{t.transmissions.auto}</option>
                  <option value="manual">{t.transmissions.manual}</option>
                </select>
              </Field>
              {bodyTypes.length > 0 && (
                <Field label={lang === "ar" ? "نوع الهيكل" : "Body type"}>
                  <select value={filters.body ?? ""} onChange={(e) => update("body", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                    <option value="">{t.search.any}</option>
                    {bodyTypes.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              )}
              <Field label={lang === "ar" ? "المصدر" : "Auction source"}>
                <select value={filters.source ?? ""} onChange={(e) => update("source", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {AUCTION_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label={lang === "ar" ? "حالة المزاد" : "Auction status"}>
                <select value={filters.aStatus ?? ""} onChange={(e) => update("aStatus", e.target.value)} className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold">
                  <option value="">{t.search.any}</option>
                  {AUCTION_STATUSES.map((s) => <option key={s.v} value={s.v}>{lang === "ar" ? s.ar : s.en}</option>)}
                </select>
              </Field>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <p className="text-muted-foreground">…</p>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <Gavel className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {lang === "ar" ? "لا توجد سيارات مزادات تطابق التصفية." : "No auction vehicles match your filters."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {list.slice(0, shown).map((v) => <VehicleCard key={v.id} v={v} variant="auction" />)}
                </div>
                {shown < list.length && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShown((s) => s + 24)}
                      className="h-11 px-6 rounded-lg bg-foreground text-background font-bold text-sm hover:bg-gold hover:text-gold-foreground"
                    >
                      {lang === "ar" ? "عرض المزيد" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
