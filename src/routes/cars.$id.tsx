import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/site/PageLayout";
import { VehicleCard } from "@/components/site/VehicleCard";
import { useI18n, fmt } from "@/lib/i18n";
import { calculate, PORTS } from "@/lib/import-calc";
import { useState } from "react";
import {
  Calendar, Fuel, Gauge, Cog, Palette, ChevronLeft, MessageCircle, BadgeCheck,
  Car as CarIcon, Share2, MapPin, Check, ShieldCheck, AlertTriangle, Search,
} from "lucide-react";
import { createReservation } from "@/lib/payments.functions";
import { getVehicleBySlug, listVehicles } from "@/lib/catalog.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cars/$id")({
  head: () => ({ meta: [{ title: "Vehicle · Advanced Koryo" }] }),
  component: CarDetail,
});

const WA_NUMBER = "966559906064";

function CarDetail() {
  const params = Route.useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fetcher = useServerFn(getVehicleBySlug);
  const listFn = useServerFn(listVehicles);
  const reserve = useServerFn(createReservation);

  const { data: v, isLoading } = useQuery({
    queryKey: ["vehicle", params.id],
    queryFn: () => fetcher({ data: { slug: params.id } }),
  });
  const { data: similar } = useQuery({
    queryKey: ["vehicles", "similar", (v as any)?.make],
    queryFn: () => listFn({ data: { limit: 8 } }),
    enabled: !!v,
  });

  const [port, setPort] = useState(PORTS[0].id);
  const [reserving, setReserving] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [shared, setShared] = useState(false);

  if (isLoading) return <PageLayout><div className="p-8 text-muted-foreground">…</div></PageLayout>;
  if (!v) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <CarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{lang === "ar" ? "السيارة غير موجودة" : "Car not found"}</h1>
          <Link to="/cars" className="mt-4 inline-block text-gold font-semibold">{lang === "ar" ? "كل السيارات" : "Back to cars"}</Link>
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

  const priceSAR = Number(veh.price_sar ?? 0);
  const priceKRW = Number(veh.price_krw ?? 0);
  const calc = priceKRW > 0 ? calculate({ priceKRW, portId: port, fuel: (veh.fuel as any) || "petrol" }) : null;
  const depositSAR = Number(veh.deposit_sar ?? Math.max(500, Math.round(priceSAR * 0.05)));

  const fullUrl = typeof window !== "undefined" ? window.location.href : "";
  const waMsg = lang === "ar"
    ? `مرحباً، أنا مهتم بهذه السيارة:\nالسيارة: ${title}\nالموديل: ${veh.year}\nالعداد: ${veh.mileage_km ?? "—"} كم\nالسعر: ${priceSAR ? fmt(priceSAR) + " ر.س" : "—"}\nالرابط: ${fullUrl}`
    : `Hello, I am interested in this vehicle:\nVehicle: ${title}\nYear: ${veh.year}\nMileage: ${veh.mileage_km ?? "—"} km\nPrice: ${priceSAR ? fmt(priceSAR) + " SAR" : "—"}\nLink: ${fullUrl}`;
  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;
  const inspectionMsg = lang === "ar"
    ? `طلب فحص مفصل للسيارة: ${title}\nالرابط: ${fullUrl}`
    : `Inspection request for vehicle: ${title}\nLink: ${fullUrl}`;
  const negotiationMsg = lang === "ar"
    ? `طلب تفاوض على سعر السيارة: ${title}\nالرابط: ${fullUrl}`
    : `Price negotiation request for vehicle: ${title}\nLink: ${fullUrl}`;
  const purchaseMsg = lang === "ar"
    ? `طلب شراء كامل للسيارة: ${title}\nالرابط: ${fullUrl}`
    : `Full purchase request for vehicle: ${title}\nLink: ${fullUrl}`;

  async function reserveNow() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/auth" });
    setReserving(true);
    try {
      await reserve({
        data: {
          vehicleSlug: veh.slug || veh.id,
          vehicleSnapshot: {
            make: veh.make, model: veh.model, year: veh.year,
            fuel: (veh.fuel as any) === "petrol" ? "gasoline" : (veh.fuel as any) || "gasoline",
            priceSAR, priceKRW, image: heroImg ?? "",
          },
          depositAmount: depositSAR,
          currency: "SAR",
        },
      });
      navigate({ to: "/account" });
    } finally { setReserving(false); }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: fullUrl });
      else { await navigator.clipboard.writeText(fullUrl); setShared(true); setTimeout(() => setShared(false), 1500); }
    } catch { /* dismissed */ }
  }

  const similarList = (similar ?? []).filter((s: any) => s.id !== veh.id && s.make === veh.make).slice(0, 4);

  const STATUS_MAP: Record<string, { ar: string; en: string; cls: string }> = {
    available:    { ar: "متوفرة",       en: "Available",    cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
    reserved:     { ar: "محجوزة",       en: "Reserved",     cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    sold:         { ar: "مباعة",        en: "Sold",         cls: "bg-destructive/15 text-destructive" },
    under_review: { ar: "تحت المراجعة",  en: "Under review", cls: "bg-blue-500/15 text-blue-700" },
    coming_soon:  { ar: "قريباً",        en: "Coming soon",  cls: "bg-purple-500/15 text-purple-700" },
    hidden:       { ar: "مخفية",        en: "Hidden",       cls: "bg-muted text-muted-foreground" },
    draft:        { ar: "مسودة",        en: "Draft",        cls: "bg-muted text-muted-foreground" },
  };
  const _s = STATUS_MAP[veh.status] ?? { ar: veh.status, en: veh.status, cls: "bg-surface" };
  const statusBadge = { label: lang === "ar" ? _s.ar : _s.en, cls: _s.cls };

  const canReserve = priceSAR > 0 && veh.status === "available";
  const displayLoc = veh.city || veh.korea_location;

  return (
    <PageLayout waMessage={waMsg}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-6 lg:pt-10 pb-32 lg:pb-12">
        <Link to="/cars" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {t.cta.back}
        </Link>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-10">
          {/* Gallery + specs */}
          <div>
            <div className="relative rounded-3xl overflow-hidden bg-surface-elevated aspect-[16/10]">
              {heroImg ? (
                <img src={heroImg} alt={title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground"><CarIcon className="w-16 h-16" /></div>
              )}
              <span className={`absolute top-4 start-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
              {veh.featured && (
                <span className="absolute top-4 end-4 px-3 py-1 rounded-full bg-gold text-gold-foreground text-xs font-bold uppercase tracking-wider">
                  {lang === "ar" ? "مميزة" : "Featured"}
                </span>
              )}
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

            {/* Title for mobile */}
            <div className="mt-6 lg:hidden">
              <div className="text-xs text-muted-foreground font-semibold">{veh.make}</div>
              <h1 className="text-2xl font-bold mt-1">{title}</h1>
              {displayLoc && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {displayLoc}
                </div>
              )}
            </div>

            {/* Specs grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { i: Calendar, l: t.spec.year, v: String(veh.year) },
                { i: Gauge, l: t.spec.km, v: veh.mileage_km != null ? `${fmt(Number(veh.mileage_km))} km` : "—" },
                { i: Fuel, l: t.spec.fuel, v: veh.fuel ?? "—" },
                { i: Cog, l: t.spec.trans, v: veh.transmission ?? "—" },
                { i: Palette, l: lang === "ar" ? "اللون الخارجي" : "Exterior color", v: veh.exterior_color ?? veh.color ?? "—" },
                { i: Palette, l: lang === "ar" ? "اللون الداخلي" : "Interior color", v: veh.interior_color ?? "—" },
                { i: Cog, l: t.spec.engine, v: veh.engine_cc ? `${veh.engine_cc} cc` : "—" },
                { i: Cog, l: lang === "ar" ? "عدد الأسطوانات" : "Cylinders", v: veh.cylinders ?? "—" },
                { i: Cog, l: lang === "ar" ? "نوع الهيكل" : "Body type", v: veh.body_type ?? "—" },
                { i: Cog, l: lang === "ar" ? "نوع الدفع" : "Drive type", v: veh.drive_type ?? "—" },
                { i: ShieldCheck, l: lang === "ar" ? "الحالة" : "Condition", v: veh.condition ?? "—" },
                { i: BadgeCheck, l: lang === "ar" ? "رقم المخزون" : "Stock #", v: veh.stock_number ?? "—" },
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

            {/* Description */}
            {(lang === "ar" ? veh.description_ar : veh.description) && (
              <section className="mt-8">
                <h2 className="text-lg font-bold mb-3">{lang === "ar" ? "الوصف" : "Description"}</h2>
                <div className="rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed whitespace-pre-line">
                  {lang === "ar" ? veh.description_ar : veh.description}
                </div>
              </section>
            )}

            {veh.public_notes && (
              <section className="mt-6">
                <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5 text-sm leading-relaxed whitespace-pre-line">
                  <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">
                    {lang === "ar" ? "ملاحظات للعميل" : "Notes for customer"}
                  </div>
                  {veh.public_notes}
                </div>
              </section>
            )}

            {/* Options */}
            {veh.options?.length > 0 && (
              <section className="mt-8">
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

            {/* Inspection / accident */}
            {(veh.inspection_notes || veh.accident_history) && (
              <section className="mt-8 grid sm:grid-cols-2 gap-3">
                {veh.inspection_notes && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="text-xs uppercase tracking-wider text-gold font-bold mb-2 inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> {lang === "ar" ? "ملاحظات الفحص" : "Inspection notes"}
                    </div>
                    <p className="text-sm whitespace-pre-line">{veh.inspection_notes}</p>
                  </div>
                )}
                {veh.accident_history && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="text-xs uppercase tracking-wider text-amber-600 font-bold mb-2 inline-flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {lang === "ar" ? "تاريخ الحوادث" : "Accident history"}
                    </div>
                    <p className="text-sm whitespace-pre-line">{veh.accident_history}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sticky sidebar */}
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

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gold">{priceSAR ? fmt(priceSAR) : "—"}</span>
                <span className="text-sm text-muted-foreground font-semibold">{t.common.sar}</span>
              </div>
              {(priceKRW > 0 || veh.price_usd) && (
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                  {priceKRW > 0 && <span>≈ ₩{fmt(priceKRW)}</span>}
                  {veh.price_usd && <span>≈ ${fmt(Number(veh.price_usd))}</span>}
                </div>
              )}

              {canReserve && (
                <button
                  onClick={reserveNow}
                  disabled={reserving}
                  className="mt-5 inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gold text-gold-foreground font-bold text-sm hover:opacity-90 disabled:opacity-60"
                >
                  <BadgeCheck className="w-4 h-4" />
                  {reserving ? "…" : lang === "ar" ? `احجز بدفعة ${fmt(depositSAR)} ر.س` : `Reserve · ${fmt(depositSAR)} SAR`}
                </button>
              )}
              <a href={waLink} target="_blank" rel="noopener"
                className="mt-2 inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-whatsapp text-white font-bold text-sm hover:opacity-90">
                <MessageCircle className="w-4 h-4" /> {lang === "ar" ? "استفسار واتساب" : "Ask on WhatsApp"}
              </a>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(inspectionMsg)}`} target="_blank" rel="noopener"
                  className="inline-flex items-center justify-center gap-1 h-11 rounded-xl bg-surface border border-border font-bold text-[11px] hover:border-gold">
                  <Search className="w-3.5 h-3.5" /> {lang === "ar" ? "فحص" : "Inspect"}
                </a>
                <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(negotiationMsg)}`} target="_blank" rel="noopener"
                  className="inline-flex items-center justify-center gap-1 h-11 rounded-xl bg-surface border border-border font-bold text-[11px] hover:border-gold">
                  {lang === "ar" ? "تفاوض" : "Negotiate"}
                </a>
                <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(purchaseMsg)}`} target="_blank" rel="noopener"
                  className="inline-flex items-center justify-center gap-1 h-11 rounded-xl bg-foreground text-background font-bold text-[11px] hover:bg-gold hover:text-gold-foreground">
                  {lang === "ar" ? "شراء كامل" : "Full purchase"}
                </a>
              </div>
              <button onClick={share}
                className="mt-2 inline-flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-surface border border-border font-bold text-xs hover:border-gold">
                <Share2 className="w-3.5 h-3.5" />
                {shared ? (lang === "ar" ? "تم النسخ ✓" : "Link copied ✓") : (lang === "ar" ? "مشاركة" : "Share")}
              </button>

              {/* Fee breakdown */}
              {(veh.est_shipping_sar || veh.est_export_sar || veh.inspection_fee_sar || veh.negotiation_fee_sar || veh.other_fees_sar) && (
                <div className="mt-5 pt-5 border-t border-border text-sm space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">
                    {lang === "ar" ? "تكاليف إضافية تقديرية" : "Estimated extras"}
                  </div>
                  {veh.est_shipping_sar && <Row k={lang === "ar" ? "الشحن" : "Shipping"} v={Number(veh.est_shipping_sar)} />}
                  {veh.est_export_sar && <Row k={lang === "ar" ? "التصدير" : "Export"} v={Number(veh.est_export_sar)} />}
                  {veh.inspection_fee_sar && <Row k={lang === "ar" ? "الفحص" : "Inspection"} v={Number(veh.inspection_fee_sar)} />}
                  {veh.negotiation_fee_sar && <Row k={lang === "ar" ? "التفاوض" : "Negotiation"} v={Number(veh.negotiation_fee_sar)} />}
                  {veh.other_fees_sar && <Row k={lang === "ar" ? "رسوم أخرى" : "Other fees"} v={Number(veh.other_fees_sar)} />}
                </div>
              )}
            </div>

            {calc && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="text-xs uppercase tracking-wider text-gold font-bold mb-3">{t.calc.breakdown}</div>
                <label className="block mb-3">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{t.calc.port}</div>
                  <select value={port} onChange={(e) => setPort(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold">
                    {PORTS.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}
                  </select>
                </label>
                <dl className="text-sm space-y-1.5">
                  <Row k={t.calc.carPrice} v={calc.carPrice} />
                  <Row k={t.calc.koreaFees} v={calc.koreaFees} />
                  <Row k={t.calc.shipping} v={calc.shipping} />
                  <Row k={t.calc.customs} v={calc.customs} />
                  <Row k={t.calc.vat} v={calc.vat} />
                  <Row k={t.calc.clearance} v={calc.clearance} />
                </dl>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-bold">{t.calc.total}</span>
                  <span className="text-xl font-bold text-gold">{fmt(Math.round(calc.total))}</span>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">{t.calc.note}</p>
              </div>
            )}
          </aside>
        </div>

        {/* Similar vehicles */}
        {similarList.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">
              {lang === "ar" ? "سيارات مشابهة" : "Similar vehicles"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarList.map((s: any) => <VehicleCard key={s.id} v={s} />)}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border p-3 flex gap-2">
        <a href={waLink} target="_blank" rel="noopener"
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-whatsapp text-white font-bold text-sm">
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
        {canReserve ? (
          <button onClick={reserveNow} disabled={reserving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-gold text-gold-foreground font-bold text-sm disabled:opacity-60">
            <BadgeCheck className="w-4 h-4" />
            {lang === "ar" ? `احجز · ${fmt(depositSAR)}` : `Reserve · ${fmt(depositSAR)}`}
          </button>
        ) : (
          <span className={`flex-1 inline-flex items-center justify-center h-12 rounded-xl font-bold text-sm ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        )}
      </div>
    </PageLayout>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{fmt(Math.round(v))}</dd>
    </div>
  );
}
