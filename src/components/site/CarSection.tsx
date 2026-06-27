import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { VehicleCard } from "./VehicleCard";
import { listVehicles } from "@/lib/catalog.functions";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function CarSection({
  filter,
  eyebrow,
  title,
  sub,
}: {
  filter: "featured" | "deal" | "auction" | "latest";
  eyebrow: string;
  title: string;
  sub: string;
}) {
  const { lang, t } = useI18n();
  const fetcher = useServerFn(listVehicles);
  const { data } = useQuery({
    queryKey: ["vehicles", filter],
    queryFn: () => fetcher({ data: { featuredOnly: filter === "featured", limit: 4 } }),
    staleTime: 60_000,
  });
  const list = (data ?? []).slice(0, 4);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  if (!list.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16 lg:mt-24">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">{eyebrow}</div>
          <h2 className="mt-2 text-2xl lg:text-4xl font-bold">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
        </div>
        <Link
          to="/cars"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:text-gold shrink-0"
        >
          {t.cta.all} <Arrow className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {list.map((v) => <VehicleCard key={v.id} v={v as any} />)}
      </div>
    </section>
  );
}
