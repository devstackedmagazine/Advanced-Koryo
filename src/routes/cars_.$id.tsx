import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { VehicleCard } from "@/components/site/VehicleCard";
import { CarDamageDiagram } from "@/components/site/CarDamageDiagram";
import { useI18n, fmt } from "@/lib/i18n";
import { calculate, PORTS } from "@/lib/import-calc";
import { getVehicleBySlug, listVehicles } from "@/lib/catalog.functions";
import { createReservation } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { WA_NUMBER, waLink } from "@/lib/whatsapp";
import {
  Calendar, Gauge, Fuel, Settings2, Palette, Zap, Circle, Car as CarIcon,
  Navigation, Shield, Hash, Fingerprint, Check, CheckCircle2, AlertTriangle,
  XCircle, Info, MessageCircle, ChevronLeft, ChevronRight, ChevronDown,
  BadgeCheck, Search,
} from "lucide-react";

export const Route = createFileRoute("/cars_/$id")({
  head: () => ({ meta: [{ title: "Vehicle · Advanced Koryo" }] }),
  component: CarDetail,
});

function CarDetail() {
  const params = Route.useParams();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const fetcher = useServerFn(getVehicleBySlug);
  const listFn = useServerFn(listVehicles);
  const reserve = useServerFn(createReservation);

  const { data: v, isLoading } = useQuery({
    queryKey: ["vehicle", params.id],
    queryFn: () => fetcher({ data: { slug: params.id } }),
  });
  const { data: similar } = useQuery({
    queryKey: ["vehicles", "similar"],
    queryFn: () => listFn({ data: { limit: 12 } }),
    enabled: !!v,
  });

  const [active, setActive] = useState(0);
  const [port, setPort] = useState(PORTS[0].id);
  const [reserving, setReserving] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  if (isLoading) return <DetailSkeleton />;

  if (!v) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="rounded-2xl border border-border bg-card p-8">
            <CarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-xl font-bold">{lang === "ar" ? "السيارة غير موجودة" : "Vehicle not found"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "ar" ? "قد لا تكون هذه السيارة متاحة بعد الآن." : "This vehicle may no longer be available."}
            </p>
            <Link to="/cars" className="mt-5 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-gold text-gold-foreground font-bold text-sm">
              {lang === "ar" ? "العودة إلى السيارات" : "Back to inventory"}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const veh = v as any;
  const images: string[] = Array.isArray(veh.images) ? veh.images.filter(Boolean) : [];
  const activeImg = images[active] ?? images[0];
  const title = lang === "ar"
    ? (veh.title_ar || `${veh.make} ${veh.model} ${veh.year}`)
    : (veh.title_en || `${veh.year} ${veh.make} ${veh.model}`);

  const priceSAR = veh.price_sar != null ? Number(veh.price_sar) : null;
  const priceKRW = veh.price_krw != null ? Number(veh.price_krw) : null;
  const priceUSD = veh.price_usd != null ? Number(veh.price_usd) : null;
  const calc = priceKRW && priceKRW > 0 ? calculate({ priceKRW, portId: port, fuel: (veh.fuel as any) || "petrol" }) : null;
  const depositSAR = Number(veh.deposit_sar ?? Math.max(500, Math.round((priceSAR ?? 0) * 0.05)));

  const fullUrl = typeof window !== "undefined" ? window.location.href : "";
  const stock = veh.stock_number ?? veh.id;
  const inquireMsg = lang === "ar"
    ? `مرحباً، أنا مهتم بالسيارة ${title} (المخزون: ${stock}). أرجو إرسال مزيد من التفاصيل.\n${fullUrl}`
    : `Hi, I'm interested in the ${veh.title_en || title} (Stock: ${stock}). Please send more details.\n${fullUrl}`;
  const inspectMsg = lang === "ar"
    ? `مرحباً، أرغب بطلب فحص للسيارة ${title} (المخزون: ${stock}).\n${fullUrl}`
    : `Hi, I'd like to request an inspection for the ${veh.title_en || title} (Stock: ${stock}).\n${fullUrl}`;

  const next = () => images.length && setActive((i) => (i + 1) % images.length);
  const prev = () => images.length && setActive((i) => (i - 1 + images.length) % images.length);

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
            priceSAR: priceSAR ?? 0, priceKRW: priceKRW ?? 0, image: activeImg ?? "",
          },
          depositAmount: depositSAR,
          currency: "SAR",
        },
      });
      navigate({ to: "/account" });
    } finally { setReserving(false); }
  }

  const STATUS: Record<string, { ar: string; en: string; cls: string }> = {
    available:    { ar: "متوفرة الآن", en: "Available Now", cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
    reserved:     { ar: "محجوزة",      en: "Reserved",      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    sold:         { ar: "مباعة",       en: "Sold",          cls: "bg-destructive/15 text-destructive" },
    under_review: { ar: "تحت المراجعة", en: "Under review",  cls: "bg-blue-500/15 text-blue-700" },
    coming_soon:  { ar: "قريباً",       en: "Coming soon",   cls: "bg-purple-500/15 text-purple-700" },
  };
  const st = STATUS[veh.status] ?? { ar: veh.status, en: veh.status, cls: "bg-surface-elevated text-muted-foreground" };
  const canReserve = (priceSAR ?? 0) > 0 && veh.status === "available";

  const mileageLabel = veh.mileage_km == null
    ? "—"
    : Number(veh.mileage_km) === 0
      ? (lang === "ar" ? "غير محدد" : "Unspecified")
      : `${fmt(Number(veh.mileage_km))} km`;

  // Full specs (skip null)
  const specs: { icon: any; label: string; value: string }[] = [
    { icon: Calendar, label: lang === "ar" ? "السنة" : "Year", value: String(veh.year ?? "—") },
    { icon: Gauge, label: lang === "ar" ? "المسافة" : "Mileage", value: mileageLabel },
    { icon: Fuel, label: lang === "ar" ? "الوقود" : "Fuel type", value: veh.fuel ?? "—" },
    { icon: Settings2, label: lang === "ar" ? "ناقل الحركة" : "Transmission", value: veh.transmission ?? "—" },
    { icon: Palette, label: lang === "ar" ? "اللون الخارجي" : "Exterior color", value: veh.exterior_color ?? veh.color ?? "—" },
    ...(veh.interior_color ? [{ icon: Palette, label: lang === "ar" ? "اللون الداخلي" : "Interior color", value: veh.interior_color }] : []),
    ...(veh.engine_cc ? [{ icon: Zap, label: lang === "ar" ? "المحرك" : "Engine", value: `${fmt(Number(veh.engine_cc))} cc` }] : []),
    ...(veh.cylinders ? [{ icon: Circle, label: lang === "ar" ? "الأسطوانات" : "Cylinders", value: String(veh.cylinders) }] : []),
    { icon: CarIcon, label: lang === "ar" ? "نوع الهيكل" : "Body type", value: veh.body_type ?? "—" },
    ...(veh.drive_type ? [{ icon: Navigation, label: lang === "ar" ? "نوع الدفع" : "Drive type", value: veh.drive_type }] : []),
    { icon: Shield, label: lang === "ar" ? "الحالة" : "Condition", value: veh.condition ?? "—" },
    { icon: Hash, label: lang === "ar" ? "رقم المخزون" : "Stock No.", value: String(stock) },
    ...(veh.vin ? [{ icon: Fingerprint, label: "VIN", value: veh.vin }] : []),
  ];

  const description = lang === "ar" ? veh.description_ar : veh.description;
  const options: string[] = Array.isArray(veh.options) ? veh.options.filter(Boolean) : [];

  // Vehicle history tone
  const accidentStr = String(veh.accident_history ?? "");
  const historyTone = accidentStr
    ? /accident recorded|حادث/i.test(accidentStr)
      ? { cls: "bg-destructive/10 border-destructive/30 text-destructive", Icon: XCircle }
      : /minor|repair|إصلاح/i.test(accidentStr)
        ? { cls: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400", Icon: AlertTriangle }
        : { cls: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400", Icon: CheckCircle2 }
    : null;
  const warnings: string[] = String(veh.inspection_notes ?? "").split(" | ").map((s) => s.trim()).filter(Boolean);
  const hasInspectionData = !!(veh.inspection_info || veh.engine_diagnostics || (veh.body_damage?.length ?? 0) > 0);

  const similarList = (similar ?? []).filter((s: any) => s.id !== veh.id && s.make === veh.make).slice(0, 4);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg font-semibold mb-4">{children}</h2>
  );

  return (
    <PageLayout waMessage={inquireMsg}>
      <div className="overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-5 lg:pt-8 pb-24 lg:pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
            <Link to="/" className="hover:text-foreground">{lang === "ar" ? "الرئيسية" : "Home"}</Link>
            <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
            <Link to="/cars" className="hover:text-foreground">{lang === "ar" ? "السيارات" : "Cars"}</Link>
            <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
            <span className="text-foreground font-medium truncate max-w-[12rem]">{title}</span>
          </nav>

          {/* Interleaved grid: gallery (col1/row1), panel (col2 sticky), details (col1/row2) */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-10 items-start">

            {/* ===== GALLERY (mobile order 1, desktop col1 row1) ===== */}
            <section className="order-1 lg:col-start-1 lg:row-start-1 min-w-0">
              <div className="relative rounded-lg overflow-hidden bg-surface-elevated aspect-[4/3]">
                {activeImg ? (
                  <img src={activeImg} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground"><CarIcon className="w-16 h-16" /></div>
                )}
                {images.length > 0 && (
                  <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-semibold">
                    {active + 1} / {images.length}
                  </span>
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Previous"
                      className="absolute top-1/2 -translate-y-1/2 start-3 grid place-items-center w-9 h-9 rounded-full bg-background/85 backdrop-blur border border-border hover:bg-background">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={next} aria-label="Next"
                      className="absolute top-1/2 -translate-y-1/2 end-3 grid place-items-center w-9 h-9 rounded-full bg-background/85 backdrop-blur border border-border hover:bg-background">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setActive(i)}
                      className={`shrink-0 w-20 h-[60px] rounded overflow-hidden border-2 ${i === active ? "border-gold" : "border-transparent"}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* ===== RIGHT PANEL (mobile order 2, desktop col2 sticky) ===== */}
            <aside className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 space-y-5 min-w-0">
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                  {lang === "ar" ? st.ar : st.en}
                </span>
                <h1 className="mt-3 text-2xl lg:text-3xl font-bold leading-tight break-words">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {veh.year}{veh.body_type ? ` • ${veh.body_type}` : ""}
                </p>
              </div>

              {/* Price block */}
              <div className="rounded-xl border border-border bg-card p-5">
                {priceKRW != null && priceKRW > 0 && (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gold">
                      {lang === "ar" ? "السعر الأصلي في كوريا" : "Original price in Korea"}
                    </div>
                    <div className="text-lg font-semibold">₩{fmt(priceKRW)}</div>
                  </>
                )}
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gold">
                  {lang === "ar" ? "السعر التقديري النهائي (ريال)" : "Estimated landed price (SAR)"}
                </div>
                <div className="text-4xl font-bold text-gold leading-tight">
                  {priceSAR != null ? `SAR ${fmt(priceSAR)}` : "—"}
                </div>
                {priceUSD != null && (
                  <div className="mt-1 text-sm text-muted-foreground">≈ ${fmt(priceUSD)}</div>
                )}
              </div>

              {/* Quick specs 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                <QuickSpec icon={Gauge} label={lang === "ar" ? "المسافة" : "Mileage"} value={mileageLabel} />
                <QuickSpec icon={Zap} label={lang === "ar" ? "المحرك" : "Engine"} value={veh.engine_cc ? `${fmt(Number(veh.engine_cc))} cc` : "—"} />
                <QuickSpec icon={Settings2} label={lang === "ar" ? "الناقل" : "Transmission"} value={veh.transmission ?? "—"} />
                <QuickSpec icon={Navigation} label={lang === "ar" ? "الدفع" : "Drive type"} value={veh.drive_type ?? "—"} />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                {canReserve && (
                  <button onClick={reserveNow} disabled={reserving}
                    className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gold text-gold-foreground font-bold text-sm hover:opacity-90 disabled:opacity-60">
                    <BadgeCheck className="w-4 h-4" />
                    {reserving ? "…" : (lang === "ar" ? `احجز هذه السيارة · ${fmt(depositSAR)} ر.س` : "Reserve This Car")}
                  </button>
                )}
                <a href={waLink(inquireMsg, WA_NUMBER)} target="_blank" rel="noopener"
                  className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-whatsapp text-whatsapp font-bold text-sm hover:bg-whatsapp hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" /> {lang === "ar" ? "استفسار عبر واتساب" : "Inquire on WhatsApp"}
                </a>
                <a href={waLink(inspectMsg, WA_NUMBER)} target="_blank" rel="noopener"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border font-bold text-sm hover:border-gold">
                  <Search className="w-4 h-4" /> {lang === "ar" ? "طلب فحص" : "Request Inspection"}
                </a>
              </div>

              {/* Import cost breakdown */}
              {calc && (
                <div className="rounded-xl border border-border bg-surface">
                  <button onClick={() => setCalcOpen((o) => !o)}
                    className="w-full flex items-center justify-between p-4 lg:cursor-default">
                    <span className="text-sm font-semibold">{lang === "ar" ? "تفصيل تكلفة الاستيراد" : "Import cost breakdown"}</span>
                    <ChevronDown className={`w-4 h-4 lg:hidden transition-transform ${calcOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`${calcOpen ? "block" : "hidden"} lg:block px-4 pb-4`}>
                    <label className="block mb-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{lang === "ar" ? "ميناء الوصول" : "Arrival port"}</span>
                      <select value={port} onChange={(e) => setPort(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-lg border border-border bg-card text-sm font-semibold">
                        {PORTS.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}
                      </select>
                    </label>
                    <dl className="text-sm space-y-1.5">
                      <CalcRow k={lang === "ar" ? "سعر السيارة" : "Vehicle price"} v={calc.carPrice} />
                      <CalcRow k={lang === "ar" ? "رسوم كوريا" : "Korea fees"} v={calc.koreaFees} />
                      <CalcRow k={lang === "ar" ? "الشحن" : "Shipping"} v={calc.shipping} />
                      <CalcRow k={lang === "ar" ? "الجمارك" : "Customs"} v={calc.customs} />
                      <CalcRow k={lang === "ar" ? "ضريبة القيمة المضافة" : "VAT"} v={calc.vat} />
                      <CalcRow k={lang === "ar" ? "التخليص" : "Clearance"} v={calc.clearance} />
                    </dl>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-sm font-bold">{lang === "ar" ? "الإجمالي (ريال)" : "Total landed (SAR)"}</span>
                      <span className="text-lg font-bold text-gold">{fmt(Math.round(calc.total))}</span>
                    </div>
                  </div>
                </div>
              )}
            </aside>

            {/* ===== LEFT DETAILS (mobile order 3, desktop col1 row2) ===== */}
            <div className="order-3 lg:col-start-1 lg:row-start-2 min-w-0 space-y-10">
              {/* Specs */}
              <section>
                <SectionTitle>{lang === "ar" ? "مواصفات المركبة" : "Vehicle Specifications"}</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specs.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                          <Icon className="w-3.5 h-3.5" /> {s.label}
                        </div>
                        <div className="mt-1 text-sm font-semibold break-words">{s.value}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Description */}
              {description && (
                <section>
                  <SectionTitle>{lang === "ar" ? "الوصف" : "Description"}</SectionTitle>
                  <div className="rounded-lg border border-border bg-card p-5 text-sm leading-relaxed whitespace-pre-line">
                    {description}
                  </div>
                </section>
              )}

              {/* Features & options */}
              {options.length > 0 && (
                <section>
                  <SectionTitle>{lang === "ar" ? "المميزات والخيارات" : "Features & Options"}</SectionTitle>
                  <div className="rounded-lg border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {options.map((opt) => (
                      <div key={opt} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 shrink-0" /> <span className="min-w-0 break-words">{opt}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Vehicle history */}
              {(historyTone || veh.public_notes || hasInspectionData) && (
                <section>
                  <SectionTitle>{lang === "ar" ? "تاريخ المركبة" : "Vehicle History"}</SectionTitle>
                  {historyTone && (
                    <div className={`rounded-lg border p-4 flex items-center gap-2 text-sm font-semibold ${historyTone.cls}`}>
                      <historyTone.Icon className="w-5 h-5 shrink-0" />
                      <span className="min-w-0 break-words">{accidentStr}</span>
                    </div>
                  )}
                  {hasInspectionData && (
                    <div className="mt-3">
                      <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                        {lang === "ar"
                          ? "مخطط الفحص يوضح الألواح التي تم إصلاحها أو استبدالها. خريطة نظيفة تعني عدم وجود أضرار مسجّلة."
                          : "The inspection map shows panels that were repaired or replaced. A clean map means no recorded damage."}
                      </p>
                      <CarDamageDiagram items={veh.body_damage ?? []} lang={lang} />
                    </div>
                  )}
                  {veh.public_notes && (
                    <div className="mt-3 rounded-lg border border-border bg-card p-4 text-sm leading-relaxed whitespace-pre-line">
                      {veh.public_notes}
                    </div>
                  )}
                </section>
              )}

              {/* Export eligibility */}
              {warnings.length > 0 && (
                <section>
                  <SectionTitle>{lang === "ar" ? "ملاحظات التصدير" : "Export Notes"}</SectionTitle>
                  <div className="flex flex-col gap-2">
                    {warnings.map((w, i) => {
                      const restricted = /restrict|محظور|ممنوع/i.test(w);
                      return (
                        <div key={i}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                            restricted
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                          }`}>
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="min-w-0 break-words">{w}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Repair history (from accident endpoint) */}
              {(veh.simple_repairs?.length > 0 || veh.structural_repairs?.length > 0) && (
                <section>
                  <SectionTitle>{lang === "ar" ? "سجل الإصلاحات" : "Repair History"}</SectionTitle>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {veh.simple_repairs?.length > 0 && (
                      <RepairTable title={lang === "ar" ? "ألواح الهيكل الخارجي" : "Body Panels"} rows={veh.simple_repairs} lang={lang} />
                    )}
                    {veh.structural_repairs?.length > 0 && (
                      <RepairTable title={lang === "ar" ? "الهيكل الإنشائي" : "Structural"} rows={veh.structural_repairs} lang={lang} />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {lang === "ar"
                      ? "X = تم الاستبدال · W = تم الإصلاح"
                      : "X = Replaced · W = Repaired"}
                  </p>
                </section>
              )}

              {/* Inspection & registration */}
              {veh.inspection_info && (veh.vin || veh.inspection_info.inspectionValidUntil || veh.inspection_info.engineType) && (
                <section>
                  <SectionTitle>{lang === "ar" ? "الفحص والتسجيل" : "Inspection & Registration"}</SectionTitle>
                  <div className="rounded-lg border border-border bg-card divide-y divide-border text-sm">
                    {veh.vin && <DataRow k="VIN" v={veh.vin} />}
                    {veh.inspection_info.firstRegistration && <DataRow k={lang === "ar" ? "أول تسجيل" : "First registration"} v={fmtDate(veh.inspection_info.firstRegistration)} />}
                    {veh.inspection_info.inspectionValidFrom && <DataRow k={lang === "ar" ? "الفحص من" : "Inspection valid from"} v={fmtDate(veh.inspection_info.inspectionValidFrom)} />}
                    {veh.inspection_info.inspectionValidUntil && <DataRow k={lang === "ar" ? "الفحص حتى" : "Inspection valid until"} v={fmtDate(veh.inspection_info.inspectionValidUntil)} />}
                    {veh.inspection_info.engineType && <DataRow k={lang === "ar" ? "نوع المحرك" : "Engine type"} v={veh.inspection_info.engineType} />}
                    {veh.inspection_info.warrantyType && <DataRow k={lang === "ar" ? "نوع الضمان" : "Warranty type"} v={veh.inspection_info.warrantyType} />}
                    {veh.inspection_info.inspectionNumber && <DataRow k={lang === "ar" ? "رقم الفحص" : "Inspection No."} v={String(veh.inspection_info.inspectionNumber)} />}
                  </div>
                </section>
              )}

              {/* Engine diagnostics */}
              {veh.engine_diagnostics && (veh.engine_diagnostics.selfDiagnosis || veh.engine_diagnostics.oilLeakage || veh.engine_diagnostics.coolantLeakage) && (
                <section>
                  <SectionTitle>{lang === "ar" ? "تشخيص المحرك" : "Engine Diagnostics"}</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <DiagCard label={lang === "ar" ? "التشخيص الذاتي" : "Self-diagnosis"} value={veh.engine_diagnostics.selfDiagnosis} />
                    <DiagCard label={lang === "ar" ? "تسرب الزيت" : "Oil leakage"} value={veh.engine_diagnostics.oilLeakage} />
                    <DiagCard label={lang === "ar" ? "تسرب سائل التبريد" : "Coolant leakage"} value={veh.engine_diagnostics.coolantLeakage} />
                  </div>
                </section>
              )}

              {/* Insurance history */}
              {veh.insurance && (Number(veh.insurance.totalIncidents) > 0 || Number(veh.insurance.totalDamageAmount) > 0 || Number(veh.insurance.ownerChangeCnt) > 0) && (
                <section>
                  <SectionTitle>{lang === "ar" ? "سجل التأمين" : "Insurance History"}</SectionTitle>
                  <div className="rounded-lg border border-border bg-card divide-y divide-border text-sm">
                    {veh.insurance.totalIncidents != null && <DataRow k={lang === "ar" ? "عدد الحوادث" : "Total incidents"} v={String(veh.insurance.totalIncidents)} />}
                    {veh.insurance.totalDamageAmount != null && <DataRow k={lang === "ar" ? "إجمالي الأضرار" : "Total damage"} v={`₩${fmt(Number(veh.insurance.totalDamageAmount))}`} />}
                    {veh.insurance.ownCarDamage?.amount != null && <DataRow k={lang === "ar" ? "ضرر السيارة" : "Own car damage"} v={`₩${fmt(Number(veh.insurance.ownCarDamage.amount))} (${veh.insurance.ownCarDamage.count ?? 0})`} />}
                    {veh.insurance.otherCarLiability?.amount != null && <DataRow k={lang === "ar" ? "أضرار الطرف الآخر" : "Other-car liability"} v={`₩${fmt(Number(veh.insurance.otherCarLiability.amount))} (${veh.insurance.otherCarLiability.count ?? 0})`} />}
                    {veh.insurance.ownerChangeCnt != null && <DataRow k={lang === "ar" ? "تغييرات الملكية" : "Owner changes"} v={String(veh.insurance.ownerChangeCnt)} />}
                    {veh.insurance.totalLossCnt != null && <DataRow k={lang === "ar" ? "خسارة كلية" : "Total-loss count"} v={String(veh.insurance.totalLossCnt)} />}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Similar vehicles — full width below */}
          {similarList.length > 0 && (
            <section className="mt-14">
              <SectionTitle>{lang === "ar" ? `المزيد من سيارات ${veh.make}` : `More ${veh.make} Vehicles`}</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {similarList.map((s: any) => <VehicleCard key={s.id} v={s} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function QuickSpec({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold break-words">{value}</div>
    </div>
  );
}

function CalcRow({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{fmt(Math.round(v))}</dd>
    </div>
  );
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const s = String(d);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return s;
}

function DataRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-end break-words min-w-0">{v}</span>
    </div>
  );
}

function RepairTable({ title, rows, lang }: { title: string; rows: { partName: string; status: string; marker: "X" | "W" }[]; lang: "ar" | "en" }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="min-w-0 break-words">{r.partName}</span>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
              r.marker === "X" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
            }`}>
              {r.marker} · {lang === "ar" ? (r.marker === "X" ? "استبدال" : "إصلاح") : r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagCard({ label, value }: { label: string; value: string | null }) {
  const v = value ?? "—";
  const good = /none|good|normal|정상|없음/i.test(v);
  const na = v === "—" || /n\/a/i.test(v);
  const cls = na ? "text-muted-foreground" : good ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold break-words ${cls}`}>{v}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <PageLayout>
      <div className="overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-5 lg:pt-8 pb-16 animate-pulse">
          <div className="h-3 w-40 rounded bg-surface-elevated mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-10 items-start">
            <section className="order-1 lg:col-start-1 lg:row-start-1">
              <div className="rounded-lg bg-surface-elevated aspect-[4/3]" />
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-20 h-[60px] rounded bg-surface-elevated" />)}
              </div>
            </section>
            <aside className="order-2 lg:col-start-2 lg:row-start-1 space-y-4">
              <div className="h-6 w-24 rounded-full bg-surface-elevated" />
              <div className="h-8 w-3/4 rounded bg-surface-elevated" />
              <div className="h-28 rounded-xl bg-surface-elevated" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-surface-elevated" />)}
              </div>
              <div className="h-12 rounded-xl bg-surface-elevated" />
              <div className="h-12 rounded-xl bg-surface-elevated" />
            </aside>
            <div className="order-3 lg:col-start-1 lg:row-start-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-[72px] rounded-lg bg-surface-elevated" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
