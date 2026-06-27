import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageLayout } from "@/components/site/PageLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { listAccessories } from "@/lib/catalog.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/accessories")({
  head: () => ({
    meta: [
      { title: "الإكسسوارات · Advanced Koryo" },
      { name: "description", content: "إكسسوارات سيارات أصلية وعصرية مستوردة من كوريا." },
      { property: "og:title", content: "Korean car accessories · Advanced Koryo" },
    ],
  }),
  component: AccessoriesPage,
});

function AccessoriesPage() {
  const { lang } = useI18n();
  const fetcher = useServerFn(listAccessories);
  const { data, isLoading } = useQuery({
    queryKey: ["accessories"],
    queryFn: () => fetcher({ data: {} }),
  });

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-8 lg:pt-12">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">
            {lang === "ar" ? "الإكسسوارات" : "Accessories"}
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold">
            {lang === "ar" ? "إكسسوارات السيارات الكورية" : "Korean car accessories"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {lang === "ar"
              ? "إكسسوارات أصلية ومميزة، مختارة من أفضل المصادر في كوريا الجنوبية."
              : "Genuine and premium accessories curated directly from South Korea."}
          </p>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">…</p>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {lang === "ar" ? "لا توجد منتجات بعد." : "No accessories listed yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((a) => (
              <ProductCard
                key={a.id}
                kind="accessory"
                item={{
                  id: a.id,
                  title: lang === "ar" ? (a.name_ar || a.name) : a.name,
                  subtitle: [a.brand, a.category].filter(Boolean).join(" · ") || null,
                  image: a.images?.[0] ?? null,
                  price_sar: a.price_sar,
                  in_stock: a.in_stock,
                  badge: a.featured ? (lang === "ar" ? "مميز" : "Featured") : null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
