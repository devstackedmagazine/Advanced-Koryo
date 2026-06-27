import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n, fmt } from "@/lib/i18n";
import { getPaymentForCheckout, submitPaymentProof } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/$paymentId")({
  head: () => ({ meta: [{ title: "إكمال الدفع · Advanced Koryo" }] }),
  component: CheckoutPage,
});

type LoadedData = Awaited<ReturnType<typeof getPaymentForCheckout>>;

function CheckoutPage() {
  const { paymentId } = Route.useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fetchPayment = useServerFn(getPaymentForCheckout);
  const submitProof = useServerFn(submitPaymentProof);

  const [data, setData] = useState<LoadedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [senderName, setSenderName] = useState("");
  const [refNote, setRefNote] = useState("");
  const [selectedBank, setSelectedBank] = useState<string>("");

  async function load() {
    try {
      const result = await fetchPayment({ data: { paymentId } });
      setData(result);
      if (result.banks.length && !selectedBank) setSelectedBank(result.banks[0].id);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      if (!s.session) navigate({ to: "/auth" });
      else load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !data) return;
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user!.id;
      const path = `${userId}/${data.payment.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      await submitProof({
        data: {
          paymentId: data.payment.id,
          bankAccountId: selectedBank || undefined,
          receiptUrl: path,
          senderName: senderName || undefined,
          referenceNote: refNote || undefined,
        },
      });
      setFile(null);
      setSenderName("");
      setRefNote("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  if (error) return (
    <PageLayout><div className="mx-auto max-w-xl px-4 py-20 text-center">
      <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
      <p className="mt-3 font-bold">{error}</p>
      <Link to="/account" className="mt-4 inline-block text-gold font-bold">Back to account</Link>
    </div></PageLayout>
  );
  if (!data) return <PageLayout><div className="py-20 text-center text-muted-foreground">Loading…</div></PageLayout>;

  const { payment, banks, proofs } = data;
  const order = payment.orders as any;
  const isPaid = payment.status === "paid";
  const isPending = payment.status === "pending";

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <h1 className="text-2xl lg:text-3xl font-bold">{lang === "ar" ? "إكمال الدفع" : "Complete payment"}</h1>
        <div className="mt-1 text-sm text-muted-foreground">{order?.description}</div>

        {/* Status banner */}
        <div className={`mt-5 rounded-2xl border p-5 ${isPaid ? "border-green-500/30 bg-green-500/5" : isPending ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-surface"}`}>
          <div className="flex items-center gap-3">
            {isPaid ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : isPending ? <Clock className="w-6 h-6 text-amber-600" /> : <Clock className="w-6 h-6" />}
            <div>
              <div className="font-bold">{isPaid ? (lang === "ar" ? "تم الدفع" : "Paid") : isPending ? (lang === "ar" ? "بانتظار التحقق" : "Awaiting verification") : (lang === "ar" ? "بانتظار الدفع" : "Awaiting payment")}</div>
              <div className="text-xl font-bold text-gold mt-0.5">{fmt(Number(payment.amount))} {payment.currency}</div>
            </div>
          </div>
        </div>

        {/* Bank details (only if bank_transfer + not yet paid) */}
        {payment.gateway === "bank_transfer" && !isPaid && (
          <>
            <h2 className="mt-8 text-lg font-bold">{lang === "ar" ? "1. حوّل المبلغ" : "1. Transfer the amount"}</h2>
            {banks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{lang === "ar" ? "لا توجد حسابات بنكية بهذه العملة. تواصل معنا عبر الواتساب." : "No bank accounts in this currency yet — please contact us on WhatsApp."}</p>
            ) : banks.map((b: any) => (
              <div key={b.id} className="mt-3 rounded-xl border border-border bg-card p-4">
                <div className="font-bold">{lang === "ar" ? (b.label_ar || b.label) : b.label}</div>
                <div className="text-sm text-muted-foreground">{b.bank_name} · {b.account_holder}</div>
                <dl className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {b.iban && <div><dt className="text-xs text-muted-foreground">IBAN</dt><dd className="font-mono text-xs">{b.iban}</dd></div>}
                  {b.account_number && <div><dt className="text-xs text-muted-foreground">Account #</dt><dd className="font-mono text-xs">{b.account_number}</dd></div>}
                  {b.swift && <div><dt className="text-xs text-muted-foreground">SWIFT</dt><dd className="font-mono text-xs">{b.swift}</dd></div>}
                  <div><dt className="text-xs text-muted-foreground">Currency</dt><dd className="font-bold">{b.currency}</dd></div>
                </dl>
              </div>
            ))}

            <h2 className="mt-8 text-lg font-bold">{lang === "ar" ? "2. ارفع إيصال التحويل" : "2. Upload your receipt"}</h2>
            <form onSubmit={handleUpload} className="mt-3 rounded-2xl border border-border bg-card p-5 space-y-3">
              {banks.length > 1 && (
                <label className="block">
                  <div className="text-xs font-bold mb-1">{lang === "ar" ? "البنك المستخدم" : "Bank used"}</div>
                  <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold">
                    {banks.map((b: any) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </label>
              )}
              <label className="block">
                <div className="text-xs font-bold mb-1">{lang === "ar" ? "اسم المُحوِّل" : "Sender name"}</div>
                <input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
              </label>
              <label className="block">
                <div className="text-xs font-bold mb-1">{lang === "ar" ? "رقم/مرجع التحويل" : "Transfer reference"}</div>
                <input value={refNote} onChange={(e) => setRefNote(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
              </label>
              <label className="block">
                <div className="text-xs font-bold mb-1">{lang === "ar" ? "إيصال التحويل (صورة أو PDF)" : "Receipt file (image or PDF)"}</div>
                <input type="file" accept="image/*,.pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
              </label>
              <button type="submit" disabled={uploading || !file} className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:bg-gold hover:text-gold-foreground disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> {uploading ? "..." : (lang === "ar" ? "إرسال الإيصال" : "Submit receipt")}
              </button>
            </form>
          </>
        )}

        {payment.gateway === "eximpay" && !isPaid && (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <p className="font-bold">{lang === "ar" ? "إكسيم باي" : "Eximpay"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "ar"
                ? "تكامل إكسيم باي قيد الإعداد. سيتواصل معك فريقنا لإكمال الدفع."
                : "Eximpay integration is being finalised. Our team will contact you to complete the payment."}
            </p>
          </div>
        )}

        {/* Existing proofs */}
        {proofs.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-bold">{lang === "ar" ? "الإيصالات المرسلة" : "Submitted receipts"}</h2>
            <ul className="mt-3 space-y-2">
              {proofs.map((p: any) => (
                <li key={p.id} className="rounded-xl border border-border bg-card p-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold">{new Date(p.created_at).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{p.reference_note || p.sender_name || "—"}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.status === "approved" ? "bg-green-500/10 text-green-700" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"}`}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PageLayout>
  );
}
