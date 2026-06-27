import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Fuel, Gauge, Cog } from "lucide-react";
import { useI18n, fmt } from "@/lib/i18n";
import type { Car } from "@/lib/cars";

export function CarCard({ car }: { car: Car }) {
  const { t, lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <Link
      to="/cars/$id"
      params={{ id: car.id }}
      className="group block rounded-2xl bg-card border border-border hover:border-gold hover:shadow-card transition-all overflow-hidden"
    >
      <div className="relative aspect-[16/11] bg-surface-elevated overflow-hidden">
        <img
          src={car.image}
          alt={car.model[lang]}
          width={1280}
          height={896}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {car.badge && (
          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-wider">
            {car.badge[lang]}
          </span>
        )}
        <span className="absolute top-3 end-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-[10px] font-bold">
          {car.status === "stock" ? t.common.stock : t.common.sourcing}
        </span>
      </div>
      <div className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-semibold">{car.make}</div>
            <h3 className="font-bold text-base lg:text-lg truncate">{car.model[lang]}</h3>
          </div>
          <div className="text-end shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.common.sar}</div>
            <div className="text-lg lg:text-xl font-bold text-gold">{fmt(car.priceSAR)}</div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-4 gap-2 text-[11px]">
          <Spec icon={<Calendar className="w-3 h-3" />} v={String(car.year)} l={t.spec.year} />
          <Spec icon={<Gauge className="w-3 h-3" />} v={`${fmt(car.km)}`} l={t.spec.km} />
          <Spec icon={<Fuel className="w-3 h-3" />} v={t.fuels[car.fuel]} l={t.spec.fuel} />
          <Spec icon={<Cog className="w-3 h-3" />} v={t.transmissions[car.trans]} l={t.spec.trans} />
        </dl>
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Korea · Inspected</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground group-hover:text-gold">
            {t.cta.view} <Arrow className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Spec({ icon, v, l }: { icon: React.ReactNode; v: string; l: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-muted-foreground">{icon}<span className="truncate">{l}</span></dt>
      <dd className="font-bold text-foreground truncate">{v}</dd>
    </div>
  );
}
