import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n, fmt } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { createServiceFeeOrder, initiatePayment } from "@/lib/payments.functions";
import { PUBLIC_GATEWAYS } from "@/lib/payments/gateways";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "خدماتنا والرسوم · Advanced Koryo" }] }),
  ssr: false,
  component: ServicesPage,
});

function ServicesPage() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const createOrder = useServerFn(createServiceFeeOrder);
  const initiate = useServerFn(initiatePayment);

  const [fees, setFees] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<"pick" | "pay">("pick");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  useEffect(() => {
    supabase.from("service_fees").select("*").eq("active", true).order("sort_order").then(({ data }) => setFees(data ?? []));
  }, []);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const billable = fees.filter((f) => selected.has(f.id) && !f.is_free && Number(f.amount) > 0);
  const total = billable.reduce((s, f) => s + Number(f.amount), 0);

  async function proceed() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/auth" });
    if (!billable.length) return;
    setCreating(true);
    try {
      const r = await createOrder({ data: { serviceFeeIds: billable.map((f) => f.id) } });
      setOrderId(r.orderId);
      setCurrency(billable[0].currency);
      setStep("pay");
    } finally { setCreating(false); }
  }

  async function pay(g: string) {
    if (!orderId) return;
    const res = await initiate({ data: { orderId, gatewayId: g } });
    navigate({ to: "/checkout/$paymentId", params: { paymentId: res.paymentId } });
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <h1 className="text-2xl lg:text-3xl font-bold">{lang === "ar" ? "خدماتنا والرسوم" : "Our services & fees"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{lang === "ar" ? "اختر الخدمات التي تحتاجها ثم ادفع." : "Pick the services you need, then pay."}</p>

        {step === "pick" && (
          <>
            <ul className="mt-6 space-y-2">
              {fees.map((f) => {
                const isSelected = selected.has(f.id);
                return (
                  <li key={f.id}>
                    <button onClick={() => toggle(f.id)} className={`w-full text-start rounded-xl border p-4 flex items-center justify-between gap-3 ${isSelected ? "border-gold bg-gold/5" : "border-border bg-card hover:bg-surface"}`}>
                      <div>
                        <div className="font-bold">{lang === "ar" ? (f.name_ar || f.name) : f.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{lang === "ar" ? (f.description_ar || "") : (f.description || "")}</div>
                      </div>
                      <div className="text-end">
                        {f.is_free
                          ? <span className="text-green-600 font-bold text-sm">{lang === "ar" ? "مجاناً" : "Free"}</span>
                          : <span className="text-gold font-bold">{fmt(Number(f.amount))} <span className="text-xs">{f.currency}</span></span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</div>
                <div className="text-2xl font-bold text-gold">{fmt(total)} {billable[0]?.currency || "USD"}</div>
              </div>
              <button onClick={proceed} disabled={!billable.length || creating} className="h-12 px-6 rounded-xl bg-foreground text-background font-bold disabled:opacity-50">
                {creating ? "..." : lang === "ar" ? "متابعة الدفع" : "Continue to payment"}
              </button>
            </div>
          </>
        )}

        {step === "pay" && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="font-bold">{lang === "ar" ? "اختر طريقة الدفع" : "Choose a payment method"}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PUBLIC_GATEWAYS.filter((g) => g.supportedCurrencies.includes(currency as any)).map((g) => (
                <button key={g.id} onClick={() => pay(g.id)} className="px-4 h-11 rounded-lg bg-foreground text-background font-bold text-sm hover:bg-gold hover:text-gold-foreground">
                  {g.displayName[lang]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
