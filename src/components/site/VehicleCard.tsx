import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Fuel, Gauge, Cog, Car as CarIcon, MapPin, MessageCircle, Gavel, Clock } from "lucide-react";
import { useI18n, fmt } from "@/lib/i18n";
import { buildAuctionInquiry, buildVehicleInquiry, vehicleDetailUrl, waLink } from "@/lib/whatsapp";


export type VehicleRow = {
  id: string;
  slug: string | null;
  make: string;
  model: string;
  year: number;
  mileage_km: number | null;
  fuel: string | null;
  transmission: string | null;
  price_sar: number | null;
  price_krw: number | null;
  price_usd?: number | null;
  images: string[];
  status: string;
  featured: boolean;
  coming_soon?: boolean | null;
  city?: string | null;
  korea_location?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
  listing_type?: string | null;
  auction_source?: string | null;
  auction_status?: string | null;
  current_bid_krw?: number | string | null;
  estimated_final_price_krw?: number | string | null;
  auction_end_at?: string | null;
};


function fuelLabel(t: any, fuel: string | null) {
  if (!fuel) return "—";
  const map: Record<string, keyof typeof t.fuels> = {
    petrol: "petrol", gasoline: "petrol", diesel: "diesel", hybrid: "hybrid", electric: "electric", ev: "electric",
  };
  const k = map[fuel.toLowerCase()];
  return k ? t.fuels[k] : fuel;
}

function transLabel(t: any, trans: string | null) {
  if (!trans) return "—";
  const k = trans.toLowerCase();
  if (k.includes("auto") || k === "at") return t.transmissions.auto;
  if (k.includes("man") || k === "mt") return t.transmissions.manual;
  return trans;
}

function statusBadge(status: string, lang: "ar" | "en") {
  const m: Record<string, { ar: string; en: string; cls: string }> = {
    available:    { ar: "متوفرة",      en: "Available",    cls: "bg-green-100 text-green-700" },
    reserved:     { ar: "محجوزة",      en: "Reserved",     cls: "bg-amber-100 text-amber-700" },
    sold:         { ar: "مباعة",       en: "Sold",         cls: "bg-red-100 text-red-700" },
    under_review: { ar: "تحت المراجعة", en: "Under review", cls: "bg-blue-100 text-blue-700" },
    coming_soon:  { ar: "قريباً",       en: "Coming soon",  cls: "bg-purple-100 text-purple-700" },
    hidden:       { ar: "مخفية",       en: "Hidden",       cls: "bg-muted text-muted-foreground" },
    draft:        { ar: "مسودة",       en: "Draft",        cls: "bg-muted text-muted-foreground" },
  };
  const s = m[status] ?? { ar: status, en: status, cls: "bg-muted text-muted-foreground" };
  return { label: lang === "ar" ? s.ar : s.en, cls: s.cls };
}

function auctionStatusBadge(status: string | null | undefined, lang: "ar" | "en") {
  const m: Record<string, { ar: string; en: string; cls: string }> = {
    available_bid: { ar: "متاح للمزايدة", en: "Open for bid",  cls: "bg-green-100 text-green-700" },
    ending_soon:   { ar: "مزاد قريب",     en: "Ending soon",   cls: "bg-amber-100 text-amber-700" },
    ended:         { ar: "انتهى المزاد",  en: "Auction ended", cls: "bg-muted text-muted-foreground" },
    purchased:     { ar: "تم الشراء",     en: "Purchased",     cls: "bg-blue-100 text-blue-700" },
    unavailable:   { ar: "غير متاح",      en: "Unavailable",   cls: "bg-red-100 text-red-700" },
  };
  const key = status ?? "available_bid";
  const s = m[key] ?? m.available_bid;
  return { label: lang === "ar" ? s.ar : s.en, cls: s.cls };
}


function formatAuctionEnd(iso: string | null | undefined, lang: "ar" | "en") {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function VehicleCard({ v, variant = "vehicle" }: { v: VehicleRow; variant?: "vehicle" | "auction" }) {
  const { t, lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const image = v.images?.[0];
  const idForUrl = v.slug || v.id;
  const loc = v.city || v.korea_location;
  const badge = statusBadge(v.status, lang);
  const isAuction = variant === "auction";
  const detailTo = isAuction ? "/auctions/$id" : "/cars/$id";
  const url = typeof window === "undefined"
    ? (isAuction ? `/auctions/${idForUrl}` : `/cars/${idForUrl}`)
    : `${window.location.origin}${isAuction ? "/auctions/" : "/cars/"}${idForUrl}`;
  const wa = isAuction
    ? waLink(buildAuctionInquiry(v, url))
    : waLink(buildVehicleInquiry(v, vehicleDetailUrl(idForUrl), lang));
  const aBadge = isAuction ? auctionStatusBadge(v.auction_status, lang) : null;
  const endLabel = isAuction ? formatAuctionEnd(v.auction_end_at ?? null, lang) : null;

  return (
    <div className="group block rounded-2xl bg-card border border-border hover:border-gold hover:shadow-card transition-all overflow-hidden flex flex-col">
      <Link to={detailTo} params={{ id: idForUrl }} className="block">
        <div className="relative aspect-[16/11] bg-surface-elevated overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={`${v.make} ${v.model}`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <CarIcon className="w-10 h-10" />
            </div>
          )}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5 items-start">
            {isAuction && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-wider">
                <Gavel className="w-3 h-3" /> {lang === "ar" ? "مزاد" : "Auction"}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-background/90 text-foreground text-[10px] font-bold">
              🇰🇷 {lang === "ar" ? "كوريا" : "Korea"}
            </span>
            {v.featured && !isAuction && (
              <span className="px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-wider">
                {lang === "ar" ? "مميز" : "Featured"}
              </span>
            )}
          </div>
          <span className={`absolute top-3 end-3 px-2 py-1 rounded-full text-[10px] font-bold ${(isAuction && aBadge ? aBadge.cls : badge.cls)}`}>
            {isAuction && aBadge ? aBadge.label : badge.label}
          </span>
        </div>
      </Link>
      <div className="p-4 lg:p-5 flex-1 flex flex-col">
        <Link to={detailTo} params={{ id: idForUrl }} className="block">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground font-semibold">{v.make}</div>
              <h3 className="font-bold text-base lg:text-lg truncate">
                {(lang === "ar" ? v.title_ar : v.title_en) || `${v.model}`}
              </h3>
              {loc && (
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {loc}
                </div>
              )}
            </div>
            <div className="text-end shrink-0">
              {isAuction ? (
                <>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "السعر الحالي" : "Current bid"}
                  </div>
                  <div className="text-base lg:text-lg font-bold text-gold">
                    {v.current_bid_krw != null ? `₩${fmt(Number(v.current_bid_krw))}` : "—"}
                  </div>
                  {v.estimated_final_price_krw != null && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {lang === "ar" ? "متوقع" : "Est."} ₩{fmt(Number(v.estimated_final_price_krw))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.common.sar}</div>
                  <div className="text-lg lg:text-xl font-bold text-gold">
                    {v.price_sar != null ? fmt(Number(v.price_sar)) : "—"}
                  </div>
                </>
              )}
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-2 text-[11px]">
            <Spec icon={<Calendar className="w-3 h-3" />} v={String(v.year)} l={t.spec.year} />
            <Spec icon={<Gauge className="w-3 h-3" />} v={v.mileage_km != null ? fmt(Number(v.mileage_km)) : "—"} l={t.spec.km} />
            <Spec icon={<Fuel className="w-3 h-3" />} v={fuelLabel(t, v.fuel)} l={t.spec.fuel} />
            <Spec icon={<Cog className="w-3 h-3" />} v={transLabel(t, v.transmission)} l={t.spec.trans} />
          </dl>
          {isAuction && endLabel && (
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" /> {lang === "ar" ? "ينتهي" : "Ends"}: {endLabel}
            </div>
          )}
        </Link>
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg bg-whatsapp text-white text-xs font-bold hover:opacity-90"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {isAuction ? (lang === "ar" ? "طلب مزايدة" : "Request bid") : "WhatsApp"}
          </a>
          <Link
            to={detailTo}
            params={{ id: idForUrl }}
            className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-3 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-gold hover:text-gold-foreground"
          >
            {lang === "ar" ? "عرض التفاصيل" : t.cta.view} <Arrow className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
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
