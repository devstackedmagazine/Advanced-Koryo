import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { listSpareParts } from "@/lib/catalog.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/spare-parts")({
  head: () => ({
    meta: [
      { title: "قطع الغيار · Advanced Koryo" },
      { name: "description", content: "قطع غيار أصلية للسيارات الكورية: هيونداي، كيا، جينيسيس، KGM." },
      { property: "og:title", content: "Korean spare parts · Advanced Koryo" },
    ],
  }),
  component: SparePartsPage,
});

function SparePartsPage() {
  const { lang } = useI18n();
  const fetcher = useServerFn(listSpareParts);
  const { data, isLoading } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: () => fetcher({ data: {} }),
  });
  const [make, setMake] = useState("");

  const makes = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((p) => (p.compatible_makes ?? []).forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(
    () => (data ?? []).filter((p) => !make || (p.compatible_makes ?? []).includes(make)),
    [data, make],
  );

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-8 lg:pt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">
              {lang === "ar" ? "قطع الغيار" : "Spare parts"}
            </div>
            <h1 className="mt-2 text-3xl lg:text-4xl font-bold">
              {lang === "ar" ? "قطع غيار كورية أصلية" : "Genuine Korean spare parts"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {lang === "ar"
                ? "هيونداي، كيا، جينيسيس و KGM — قطع OEM ومتوافقة بأسعار شفافة."
                : "Hyundai, Kia, Genesis & KGM — OEM and compatible parts at transparent prices."}
            </p>
          </div>
          {makes.length > 0 && (
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-surface text-sm font-semibold"
            >
              <option value="">{lang === "ar" ? "كل الماركات" : "All makes"}</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {lang === "ar" ? "لا توجد قطع غيار بعد." : "No spare parts listed yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                kind="spare_part"
                item={{
                  id: p.id,
                  title: lang === "ar" ? (p.name_ar || p.name) : p.name,
                  subtitle: [p.part_number && `#${p.part_number}`, p.brand, (p.compatible_makes ?? []).join("/")].filter(Boolean).join(" · "),
                  image: p.images?.[0] ?? null,
                  price_sar: p.price_sar,
                  in_stock: p.in_stock,
                  oem: p.oem,
                  badge: p.featured ? (lang === "ar" ? "مميز" : "Featured") : null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
