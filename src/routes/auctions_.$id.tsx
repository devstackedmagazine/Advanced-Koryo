import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { VehicleCard } from "@/components/site/VehicleCard";
import { useI18n, fmt } from "@/lib/i18n";
import {
  Calendar, Fuel, Gauge, Cog, Palette, ChevronLeft, MessageCircle, Gavel,
  Car as CarIcon, Share2, MapPin, Check, ShieldCheck, AlertTriangle, Clock,
  Heart, Calculator,
} from "lucide-react";

import { getAuctionBySlug, listAuctions } from "@/lib/catalog.functions";
import { buildAuctionInquiry, waLink, WA_NUMBER } from "@/lib/whatsapp";

export const Route = createFileRoute("/auctions_/$id")({
  head: () => ({ meta: [{ title: "مزاد سيارة · Advanced Koryo" }] }),
  component: AuctionDetail,
});

const AUCTION_STATUS_MAP: Record<string, { ar: string; en: string; cls: string }> = {
  available_bid: { ar: "متاح للمزايدة", en: "Open for bid",  cls: "bg-green-500/15 text-green-700" },
  ending_soon:   { ar: "مزاد قريب",     en: "Ending soon",   cls: "bg-amber-500/15 text-amber-700" },
  ended:         { ar: "انتهى المزاد",  en: "Auction ended", cls: "bg-muted text-muted-foreground" },
  purchased:     { ar: "تم الشراء",     en: "Purchased",     cls: "bg-blue-500/15 text-blue-700" },
  unavailable:   { ar: "غير متاح",      en: "Unavailable",   cls: "bg-destructive/15 text-destructive" },
};

function AuctionDetail() {
  const params = Route.useParams();
  const { t, lang } = useI18n();
  const fetcher = useServerFn(getAuctionBySlug);
  const listFn = useServerFn(listAuctions);

  const { data: v, isLoading } = useQuery({
    queryKey: ["auction", params.id],
    queryFn: () => fetcher({ data: { slug: params.id } }),
  });
  const { data: similar } = useQuery({
    queryKey: ["auctions", "similar", (v as any)?.make],
    queryFn: () => listFn({ data: { limit: 12 } }),
    enabled: !!v,
  });

  const [activeImg, setActiveImg] = useState(0);
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);

  if (isLoading) return <PageLayout><div className="p-8 text-muted-foreground">…</div></PageLayout>;
  if (!v) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <Gavel className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{lang === "ar" ? "المزاد غير موجود" : "Auction not found"}</h1>
          <Link to="/auctions" className="mt-4 inline-block text-gold font-semibold">{lang === "ar" ? "كل المزادات" : "Back to auctions"}</Link>
        </div>
      </PageLayout>
    );
  }

  const veh = v as any;
  const images: string[] = veh.images?.length ? veh.images : [];
  const heroImg = images[activeImg];
  const title = lang === "ar"
    ? (veh.title_ar || `${veh.make} ${veh.model} ${veh.year}`)
    : (veh.title_en || `${veh.year} ${veh.make} ${veh.model}`);

  const currentKRW = Number(veh.current_bid_krw ?? 0);
  const expectedKRW = Number(veh.estimated_final_price_krw ?? 0);
  const priceSAR = Number(veh.price_sar ?? 0);
  const priceUSD = Number(veh.price_usd ?? 0);

  const fullUrl = typeof window !== "undefined" ? window.location.href : "";
  const waMsg = buildAuctionInquiry(veh, fullUrl);
  const wa = waLink(waMsg);

  const _s = AUCTION_STATUS_MAP[veh.auction_status ?? "available_bid"] ?? AUCTION_STATUS_MAP.available_bid;
  const statusBadge = { label: lang === "ar" ? _s.ar : _s.en, cls: _s.cls };
  const endLabel = veh.auction_end_at
    ? new Date(veh.auction_end_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: fullUrl });
      else { await navigator.clipboard.writeText(fullUrl); setShared(true); setTimeout(() => setShared(false), 1500); }
    } catch { /* dismissed */ }
  }

  const similarList = (similar ?? []).filter((s: any) => s.id !== veh.id).slice(0, 4);
  const displayLoc = veh.city || veh.korea_location;

  return (
    <PageLayout waMessage={waMsg}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-6 lg:pt-10 pb-32 lg:pb-12">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link to="/auctions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {t.cta.back}
          </Link>
          <button onClick={share} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-bold hover:border-gold">
            <Share2 className="w-3.5 h-3.5" />
            {shared ? (lang === "ar" ? "تم النسخ ✓" : "Copied ✓") : (lang === "ar" ? "مشاركة" : "Share")}
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-10">
          {/* Gallery + specs */}
          <div>
            <div className="relative rounded-3xl overflow-hidden bg-surface-elevated aspect-[16/10]">
              {heroImg ? (
                <img src={heroImg} alt={title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground"><CarIcon className="w-16 h-16" /></div>
              )}
              <div className="absolute top-4 start-4 flex flex-col items-start gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-wider">
                  <Gavel className="w-3.5 h-3.5" /> {lang === "ar" ? "مزاد" : "Auction"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-background/90 text-foreground text-xs font-bold">
                  🇰🇷 {lang === "ar" ? "كوريا" : "Korea"}
                </span>
              </div>
              <span className={`absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-bold ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${i === activeImg ? "border-gold" : "border-border"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 lg:hidden">
              <div className="text-xs text-muted-foreground font-semibold">{veh.make}</div>
              <h1 className="text-2xl font-bold mt-1">{title}</h1>
              {displayLoc && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {displayLoc}
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm leading-relaxed flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                {lang === "ar"
                  ? "سيارات المزادات تحتاج تأكيد حالة السيارة والفحص قبل المزايدة. السعر النهائي يعتمد على نتيجة المزاد وسعر الصرف وتكاليف الشحن والجمارك."
                  : "Auction cars require condition confirmation and inspection before bidding. The final price depends on auction outcome, exchange rate, shipping and customs costs."}
              </p>
            </div>

            {/* Specs */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { i: Calendar, l: t.spec.year, v: String(veh.year) },
                { i: Gauge, l: t.spec.km, v: veh.mileage_km != null ? `${fmt(Number(veh.mileage_km))} km` : "—" },
                { i: Fuel, l: t.spec.fuel, v: veh.fuel ?? "—" },
                { i: Cog, l: t.spec.trans, v: veh.transmission ?? "—" },
                { i: Palette, l: lang === "ar" ? "اللون الخارجي" : "Exterior color", v: veh.exterior_color ?? veh.color ?? "—" },
                { i: Palette, l: lang === "ar" ? "اللون الداخلي" : "Interior color", v: veh.interior_color ?? "—" },
                { i: Cog, l: t.spec.engine, v: veh.engine_cc ? `${veh.engine_cc} cc` : "—" },
                { i: Cog, l: lang === "ar" ? "نوع الهيكل" : "Body type", v: veh.body_type ?? "—" },
                { i: Cog, l: lang === "ar" ? "نوع الدفع" : "Drive type", v: veh.drive_type ?? "—" },
                { i: ShieldCheck, l: lang === "ar" ? "الحالة" : "Condition", v: veh.condition ?? "—" },
              ].map((s, i) => {
                const Icon = s.i;
                return (
                  <div key={i} className="rounded-xl bg-surface border border-border p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {s.l}</div>
                    <div className="mt-1 font-bold text-sm">{String(s.v)}</div>
                  </div>
                );
              })}
            </div>

            {(lang === "ar" ? veh.description_ar : veh.description) && (
              <section className="mt-8">
                <h2 className="text-lg font-bold mb-3">{lang === "ar" ? "الوصف" : "Description"}</h2>
                <div className="rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed whitespace-pre-line">
                  {lang === "ar" ? veh.description_ar : veh.description}
                </div>
              </section>
            )}

            {veh.inspection_notes && (
              <section className="mt-6">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-xs uppercase tracking-wider text-gold font-bold mb-2 inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> {lang === "ar" ? "ملاحظات الفحص" : "Inspection notes"}
                  </div>
                  <p className="text-sm whitespace-pre-line">{veh.inspection_notes}</p>
                </div>
              </section>
            )}

            {veh.options?.length > 0 && (
              <section className="mt-6">
                <h2 className="text-lg font-bold mb-3">{lang === "ar" ? "المواصفات والخيارات" : "Features & options"}</h2>
                <div className="rounded-2xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {veh.options.map((opt: string) => (
                    <div key={opt} className="inline-flex items-center gap-2">
                      <Check className="w-4 h-4 text-gold shrink-0" /> {opt}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {veh.public_notes && (
              <section className="mt-6">
                <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5 text-sm leading-relaxed whitespace-pre-line">
                  <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">
                    {lang === "ar" ? "ملاحظات المزاد" : "Auction notes"}
                  </div>
                  {veh.public_notes}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 lg:sticky lg:top-24">
              <div className="hidden lg:block">
                <div className="text-xs text-muted-foreground font-semibold">{veh.make}</div>
                <h1 className="text-2xl lg:text-3xl font-bold mt-1">{title}</h1>
                {displayLoc && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {displayLoc}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    {lang === "ar" ? "السعر الحالي" : "Current bid"}
                  </div>
                  <div className="text-3xl font-bold text-gold">{currentKRW > 0 ? `₩${fmt(currentKRW)}` : "—"}</div>
                </div>
                {expectedKRW > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "السعر المتوقع: " : "Estimated final: "}</span>
                    <span className="font-bold">₩{fmt(expectedKRW)}</span>
                  </div>
                )}
                {(priceSAR > 0 || priceUSD > 0) && (
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 pt-1 border-t border-border">
                    {priceSAR > 0 && <span>{lang === "ar" ? "تقديري" : "Approx."} {fmt(priceSAR)} ر.س</span>}
                    {priceUSD > 0 && <span>≈ ${fmt(priceUSD)}</span>}
                  </div>
                )}
              </div>

              {veh.auction_source && (
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{lang === "ar" ? "مصدر المزاد" : "Auction source"}</span>
                    <span className="font-bold">{veh.auction_source}</span>
                  </div>
                  {endLabel && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lang === "ar" ? "ينتهي" : "Ends"}</span>
                      <span className="font-bold text-end">{endLabel}</span>
                    </div>
                  )}
                </div>
              )}

              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="mt-5 inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gold text-gold-foreground font-bold text-sm hover:opacity-90"
              >
                <Gavel className="w-4 h-4" /> {lang === "ar" ? "طلب مزايدة" : "Request bid"}
              </a>
              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="mt-2 inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-whatsapp text-white font-bold text-sm hover:opacity-90"
              >
                <MessageCircle className="w-4 h-4" /> {lang === "ar" ? "تواصل واتساب" : "WhatsApp"}
              </a>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/calculator"
                  className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-surface border border-border font-bold text-xs hover:border-gold"
                >
                  <Calculator className="w-3.5 h-3.5" /> {lang === "ar" ? "احسب التكلفة" : "Calculate"}
                </Link>
                <button
                  onClick={() => setSaved((s) => !s)}
                  className={`inline-flex items-center justify-center gap-1.5 h-11 rounded-xl border font-bold text-xs ${saved ? "bg-gold/15 border-gold text-gold" : "bg-surface border-border hover:border-gold"}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
                  {saved ? (lang === "ar" ? "محفوظة" : "Saved") : (lang === "ar" ? "حفظ" : "Save")}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Related auctions */}
        {similarList.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">
              {lang === "ar" ? "مزادات مشابهة" : "Related auctions"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {similarList.map((s: any) => <VehicleCard key={s.id} v={s} variant="auction" />)}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile action bar */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border p-2 grid grid-cols-2 gap-2">
        <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gold text-gold-foreground font-bold text-xs">
          <Gavel className="w-4 h-4" /> {lang === "ar" ? "طلب مزايدة" : "Request bid"}
        </a>
        <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-whatsapp text-white font-bold text-xs">
          <MessageCircle className="w-4 h-4" /> {lang === "ar" ? "واتساب" : "WhatsApp"}
        </a>
      </div>
    </PageLayout>
  );
}
