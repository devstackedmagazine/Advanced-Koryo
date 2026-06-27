import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n, fmt } from "@/lib/i18n";
import { getMyOrders, initiatePayment, claimFirstAdmin, checkIsAdmin } from "@/lib/payments.functions";
import { PUBLIC_GATEWAYS } from "@/lib/payments/gateways";
import { signOut } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "حسابي · Advanced Koryo" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fetchOrders = useServerFn(getMyOrders);
  const initiate = useServerFn(initiatePayment);
  const checkAdmin = useServerFn(checkIsAdmin);
  const claimAdmin = useServerFn(claimFirstAdmin);

  const [orders, setOrders] = useState<any[]>([]);
  const [email, setEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    setEmail(u.user?.email ?? "");
    const [o, a] = await Promise.all([fetchOrders(), checkAdmin()]);
    setOrders(o);
    setIsAdmin(a.isAdmin);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function pay(orderId: string, gatewayId: string) {
    const res = await initiate({ data: { orderId, gatewayId } });
    navigate({ to: "/checkout/$paymentId", params: { paymentId: res.paymentId } });
  }

  async function makeAdmin() {
    const r = await claimAdmin();
    if (r.granted) { setIsAdmin(true); alert(lang === "ar" ? "أصبحت مديراً" : "You are now an admin"); }
    else alert(r.reason ?? "");
  }

  async function logout() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{lang === "ar" ? "حسابي" : "My account"}</h1>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <Link to="/admin" className="h-10 px-4 rounded-lg bg-gold text-gold-foreground font-bold text-sm inline-flex items-center">Admin</Link>}
            {!isAdmin && <button onClick={makeAdmin} className="h-10 px-4 rounded-lg border border-border font-bold text-xs">Claim first-admin</button>}
            <button onClick={logout} className="h-10 px-4 rounded-lg border border-border font-bold text-sm">{lang === "ar" ? "تسجيل خروج" : "Sign out"}</button>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-bold">{lang === "ar" ? "طلباتي ومدفوعاتي" : "Orders & payments"}</h2>
        {loading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : orders.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-sm">{lang === "ar" ? "لا توجد طلبات بعد." : "No orders yet."}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((o) => {
              const payments = (o.payments ?? []) as any[];
              const lastPay = payments[payments.length - 1];
              return (
                <li key={o.id} className="rounded-2xl border border-border bg-card p-4 lg:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs uppercase font-bold text-muted-foreground">{o.order_type.replace("_", " ")}</div>
                      <div className="font-bold mt-0.5">{o.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-2xl font-bold text-gold">{fmt(Number(o.amount))} <span className="text-xs">{o.currency}</span></div>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>

                  {o.status === "awaiting_payment" && !lastPay && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs font-bold text-muted-foreground mb-2">{lang === "ar" ? "اختر طريقة الدفع" : "Choose a payment method"}</div>
                      <div className="flex flex-wrap gap-2">
                        {PUBLIC_GATEWAYS.filter((g) => g.supportedCurrencies.includes(o.currency)).map((g) => (
                          <button key={g.id} onClick={() => pay(o.id, g.id)} className="px-4 h-10 rounded-lg bg-foreground text-background font-bold text-sm hover:bg-gold hover:text-gold-foreground">
                            {g.displayName[lang]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastPay && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs">
                        <span className="font-bold">{lastPay.gateway}</span>
                        <span className="text-muted-foreground"> · {lastPay.status}</span>
                      </div>
                      <Link to="/checkout/$paymentId" params={{ paymentId: lastPay.id }} className="text-sm text-gold font-bold">
                        {lastPay.status === "paid" ? (lang === "ar" ? "عرض الإيصال" : "View receipt") : (lang === "ar" ? "إكمال الدفع" : "Continue payment")} →
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-green-500/10 text-green-700",
    awaiting_payment: "bg-amber-500/10 text-amber-700",
    pending_admin_approval: "bg-amber-500/10 text-amber-700",
    cancelled: "bg-destructive/10 text-destructive",
    refunded: "bg-blue-500/10 text-blue-700",
    draft: "bg-muted text-muted-foreground",
  };
  return <span className={`mt-1 inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${colors[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
