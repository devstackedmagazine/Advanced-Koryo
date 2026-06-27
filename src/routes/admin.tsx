import { createFileRoute, useNavigate, Link, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n, fmt } from "@/lib/i18n";
import {
  adminLoadAll, adminReservationAction, adminOrderAction, adminPaymentAction,
  adminProofAction, adminUpsertServiceFee, adminUpsertBankAccount,
  adminUpsertExchangeRate, adminCustomOrderAction, adminUpdateSetting,
  adminUpsertAccessory, adminDeleteAccessory,
  adminUpsertSparePart, adminDeleteSparePart,
  adminCreateHeroUploadUrl,
  adminUpsertVehicle, adminDeleteVehicle, adminCreateVehicleImageUploadUrl, adminImportVehicles,
} from "@/lib/admin.functions";
import { checkIsAdmin } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { LegalTab } from "@/components/admin/LegalTab";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Advanced Koryo" }] }),
  ssr: false,
  component: AdminPage,
});

type Tab =
  | "reservations" | "orders" | "payments" | "proofs" | "refunds"
  | "vehicles" | "auctions" | "import" | "accessories" | "spareParts" | "hero"
  | "fees" | "banks" | "rates" | "custom" | "messages" | "users" | "legal";

const TABS: { id: Tab; label: string }[] = [
  { id: "hero", label: "Hero image" },
  { id: "vehicles", label: "Vehicles" },
  { id: "auctions", label: "Auctions" },
  { id: "import", label: "Import Cars" },
  { id: "accessories", label: "Accessories" },
  { id: "spareParts", label: "Spare parts" },
  { id: "reservations", label: "Reservations" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "proofs", label: "Transfer Proofs" },
  { id: "refunds", label: "Refunds" },
  { id: "fees", label: "Service Fees" },
  { id: "banks", label: "Bank Accounts" },
  { id: "rates", label: "Exchange Rates" },
  { id: "custom", label: "Custom Orders" },
  { id: "messages", label: "Messages" },
  { id: "users", label: "Users" },
  { id: "legal", label: "Legal Pages" },
];


function AdminPage() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const loadAll = useServerFn(adminLoadAll);
  const checkAdmin = useServerFn(checkIsAdmin);

  const [tab, setTab] = useState<Tab>("hero");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const d = await loadAll();
      setData(d);
    } catch (e: any) { setErr(e.message); }
  }

  useEffect(() => {
    // Read ?tab=... so redirects from /admin/auctions* land on the right tab
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab") as Tab | null;
      if (t && TABS.some((x) => x.id === t)) setTab(t);
    }
    supabase.auth.getSession().then(async ({ data: s }) => {
      if (!s.session) return navigate({ to: "/auth" });
      const a = await checkAdmin();
      if (!a.isAdmin) return navigate({ to: "/account" });
      load();
    });
    // eslint-disable-next-line
  }, []);


  if (err) return <PageLayout><Outlet /><div className="p-8 text-destructive">{err}</div></PageLayout>;
  if (!data) return <PageLayout><Outlet /><div className="p-8 text-muted-foreground">Loading admin…</div></PageLayout>;

  return (
    <PageLayout>
      <Outlet />
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10">


        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold">Admin Dashboard</h1>
          <Link to="/account" className="text-sm text-muted-foreground hover:text-foreground">← My account</Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5 border-b border-border">
          {TABS.map((tt) => {
            let count = (data[tabToKey(tt.id)] ?? []).length;
            if (tt.id === "vehicles") count = (data.vehicles ?? []).filter((v: any) => (v.listing_type ?? "vehicle") === "vehicle").length;
            if (tt.id === "auctions") count = (data.vehicles ?? []).filter((v: any) => v.listing_type === "auction").length;
            return (
              <button key={tt.id} onClick={() => setTab(tt.id)}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg ${tab === tt.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {tt.label} <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}

        </div>

        <div className="mt-5">
          {tab === "hero" && <HeroTab settings={data.settings} reload={load} />}
          {tab === "accessories" && <AccessoriesTab rows={data.accessories} reload={load} />}
          {tab === "spareParts" && <SparePartsTab rows={data.spareParts} reload={load} />}
          {tab === "reservations" && <ReservationsTab rows={data.reservations} reload={load} />}
          {tab === "orders" && <OrdersTab rows={data.orders} reload={load} />}
          {tab === "payments" && <PaymentsTab rows={data.payments} reload={load} />}
          {tab === "proofs" && <ProofsTab rows={data.proofs} reload={load} />}
          {tab === "refunds" && <SimpleTable rows={data.refunds} cols={["amount", "currency", "reason", "status", "created_at"]} />}
          {tab === "vehicles" && <VehiclesTab rows={data.vehicles} reload={load} listingType="vehicle" />}
          {tab === "auctions" && <VehiclesTab rows={data.vehicles} reload={load} listingType="auction" />}
          {tab === "import" && <ImportCarsTab />}
          {tab === "fees" && <FeesTab rows={data.fees} reload={load} />}
          {tab === "banks" && <BanksTab rows={data.banks} reload={load} />}
          {tab === "rates" && <RatesTab rows={data.rates} reload={load} />}
          {tab === "custom" && <CustomOrdersTab rows={data.customOrders} reload={load} />}
          {tab === "messages" && <SimpleTable rows={data.messages} cols={["name", "phone", "email", "message", "handled", "created_at"]} />}
          {tab === "users" && <SimpleTable rows={data.users} cols={["full_name", "phone", "city", "created_at"]} />}
          {tab === "legal" && <LegalTab />}
        </div>
      </div>
    </PageLayout>
  );
}

function tabToKey(t: Tab): string {
  if (t === "fees") return "fees";
  if (t === "banks") return "banks";
  if (t === "rates") return "rates";
  if (t === "custom") return "customOrders";
  if (t === "spareParts") return "spareParts";
  if (t === "hero") return "settings";
  if (t === "import") return "vehicles";
  if (t === "auctions") return "vehicles";
  return t;
}


function ImportCarsTab() {
  const items = [
    { title: "Import from API", desc: "Bring vehicles in automatically from a partner API. Add credentials and we'll sync." },
    { title: "Import from CSV", desc: "Upload a spreadsheet (CSV/Excel) and map columns to vehicle fields." },
    { title: "Import from Encar / K-Car / Auction", desc: "Paste source URLs and we'll pull listings and images." },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm">
        <div className="font-bold mb-1">Bulk import — coming soon</div>
        <p className="text-muted-foreground">
          The database is already prepared for imports. New vehicles can carry an
          <code className="mx-1 px-1 rounded bg-card">external_source</code> /
          <code className="mx-1 px-1 rounded bg-card">external_id</code> pair plus raw payload.
          The wiring below will be enabled as soon as a source is connected.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-xl border border-border bg-card p-4 opacity-80">
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Soon</div>
            <div className="font-bold mb-1">{it.title}</div>
            <p className="text-xs text-muted-foreground mb-3">{it.desc}</p>
            <button disabled className="h-9 px-3 rounded bg-foreground/30 text-background text-xs font-bold cursor-not-allowed">
              Coming soon
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Tab components ----------------
function ReservationsTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const act = useServerFn(adminReservationAction);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
          <div>
            <div className="font-bold">{r.vehicles?.year} {r.vehicles?.make} {r.vehicles?.model}</div>
            <div className="text-xs text-muted-foreground">{fmt(Number(r.deposit_amount))} {r.currency} · {r.status} · {new Date(r.created_at).toLocaleString()}</div>
          </div>
          <div className="flex gap-1.5">
            {["approve", "cancel", "refund", "complete"].map((a) => (
              <button key={a} onClick={async () => { await act({ data: { id: r.id, action: a as any } }); reload(); }}
                className="px-2.5 h-8 rounded-md border border-border text-xs font-bold hover:bg-surface">{a}</button>
            ))}
          </div>
        </div>
      ))}
      {!rows.length && <p className="text-muted-foreground text-sm">None</p>}
    </div>
  );
}

function OrdersTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const act = useServerFn(adminOrderAction);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
          <div>
            <div className="font-bold">{r.order_type} — {fmt(Number(r.amount))} {r.currency}</div>
            <div className="text-xs text-muted-foreground">{r.description} · {r.status}</div>
          </div>
          <div className="flex gap-1.5">
            {["approve", "mark_paid", "cancel"].map((a) => (
              <button key={a} onClick={async () => { await act({ data: { id: r.id, action: a as any } }); reload(); }}
                className="px-2.5 h-8 rounded-md border border-border text-xs font-bold hover:bg-surface">{a}</button>
            ))}
          </div>
        </div>
      ))}
      {!rows.length && <p className="text-muted-foreground text-sm">None</p>}
    </div>
  );
}

function PaymentsTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const act = useServerFn(adminPaymentAction);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
          <div>
            <div className="font-bold">{r.gateway} — {fmt(Number(r.amount))} {r.currency}</div>
            <div className="text-xs text-muted-foreground">{r.payment_type} · {r.status} · ref: {r.gateway_reference ?? "—"}</div>
          </div>
          <div className="flex gap-1.5">
            {["mark_paid", "mark_failed", "refund", "cancel"].map((a) => (
              <button key={a} onClick={async () => { await act({ data: { id: r.id, action: a as any } }); reload(); }}
                className="px-2.5 h-8 rounded-md border border-border text-xs font-bold hover:bg-surface">{a.replace("_", " ")}</button>
            ))}
          </div>
        </div>
      ))}
      {!rows.length && <p className="text-muted-foreground text-sm">None</p>}
    </div>
  );
}

function ProofsTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const act = useServerFn(adminProofAction);
  const [urls, setUrls] = useState<Record<string, string>>({});
  async function getUrl(path: string) {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? "";
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-bold">{r.sender_name || "—"} · {fmt(Number(r.amount_claimed ?? 0))} {r.currency}</div>
              <div className="text-xs text-muted-foreground">{r.reference_note} · {r.status}</div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={async () => { const u = await getUrl(r.receipt_url); setUrls((m) => ({ ...m, [r.id]: u })); }} className="px-2.5 h-8 rounded-md border border-border text-xs font-bold">View receipt</button>
              <button onClick={async () => { await act({ data: { id: r.id, action: "approve" } }); reload(); }} className="px-2.5 h-8 rounded-md bg-green-500/10 text-green-700 text-xs font-bold">approve</button>
              <button onClick={async () => { await act({ data: { id: r.id, action: "reject" } }); reload(); }} className="px-2.5 h-8 rounded-md bg-destructive/10 text-destructive text-xs font-bold">reject</button>
            </div>
          </div>
          {urls[r.id] && <a href={urls[r.id]} target="_blank" rel="noopener" className="mt-2 inline-block text-xs text-gold font-bold">Open receipt ↗</a>}
        </div>
      ))}
      {!rows.length && <p className="text-muted-foreground text-sm">None</p>}
    </div>
  );
}

function FeesTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const up = useServerFn(adminUpsertServiceFee);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 grid grid-cols-1 md:grid-cols-6 gap-2 items-center text-sm">
          <div className="font-bold col-span-2">{r.name}<div className="text-xs text-muted-foreground font-normal">{r.code}</div></div>
          <input type="number" defaultValue={r.amount} className="h-9 px-2 rounded border border-border bg-surface text-sm" id={`a-${r.id}`} />
          <select defaultValue={r.currency} className="h-9 px-2 rounded border border-border bg-surface text-sm" id={`c-${r.id}`}>
            <option>USD</option><option>SAR</option><option>KRW</option>
          </select>
          <label className="text-xs flex items-center gap-1.5"><input type="checkbox" defaultChecked={r.is_free} id={`f-${r.id}`} /> Free</label>
          <label className="text-xs flex items-center gap-1.5"><input type="checkbox" defaultChecked={r.active} id={`act-${r.id}`} /> Active</label>
          <button onClick={async () => {
            await up({ data: {
              id: r.id, code: r.code, name: r.name,
              amount: Number((document.getElementById(`a-${r.id}`) as HTMLInputElement).value),
              currency: (document.getElementById(`c-${r.id}`) as HTMLSelectElement).value as any,
              is_free: (document.getElementById(`f-${r.id}`) as HTMLInputElement).checked,
              active: (document.getElementById(`act-${r.id}`) as HTMLInputElement).checked,
            } });
            reload();
          }} className="md:col-span-6 h-9 rounded bg-foreground text-background font-bold text-xs">Save</button>
        </div>
      ))}
    </div>
  );
}

function BanksTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const up = useServerFn(adminUpsertBankAccount);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 text-sm space-y-2">
          <div className="font-bold">{r.label} <span className="text-xs text-muted-foreground">({r.currency})</span></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input defaultValue={r.bank_name} id={`bn-${r.id}`} placeholder="Bank name" className="h-9 px-2 rounded border border-border bg-surface" />
            <input defaultValue={r.account_holder} id={`ah-${r.id}`} placeholder="Account holder" className="h-9 px-2 rounded border border-border bg-surface" />
            <input defaultValue={r.iban || ""} id={`ib-${r.id}`} placeholder="IBAN" className="h-9 px-2 rounded border border-border bg-surface" />
            <input defaultValue={r.account_number || ""} id={`an-${r.id}`} placeholder="Account #" className="h-9 px-2 rounded border border-border bg-surface" />
            <input defaultValue={r.swift || ""} id={`sw-${r.id}`} placeholder="SWIFT" className="h-9 px-2 rounded border border-border bg-surface" />
            <label className="text-xs flex items-center gap-1.5"><input type="checkbox" defaultChecked={r.active} id={`bka-${r.id}`} /> Active</label>
          </div>
          <button onClick={async () => {
            await up({ data: {
              id: r.id, label: r.label, currency: r.currency,
              bank_name: (document.getElementById(`bn-${r.id}`) as HTMLInputElement).value,
              account_holder: (document.getElementById(`ah-${r.id}`) as HTMLInputElement).value,
              iban: (document.getElementById(`ib-${r.id}`) as HTMLInputElement).value,
              account_number: (document.getElementById(`an-${r.id}`) as HTMLInputElement).value,
              swift: (document.getElementById(`sw-${r.id}`) as HTMLInputElement).value,
              active: (document.getElementById(`bka-${r.id}`) as HTMLInputElement).checked,
            } });
            reload();
          }} className="h-9 px-3 rounded bg-foreground text-background font-bold text-xs">Save</button>
        </div>
      ))}
    </div>
  );
}

function RatesTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const up = useServerFn(adminUpsertExchangeRate);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("SAR");
  const [rate, setRate] = useState(3.75);
  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-3 mb-4 flex items-center gap-2 text-sm flex-wrap">
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 px-2 rounded border border-border bg-surface"><option>USD</option><option>SAR</option><option>KRW</option></select>
        <span>→</span>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="h-9 px-2 rounded border border-border bg-surface"><option>SAR</option><option>USD</option><option>KRW</option></select>
        <input type="number" step="0.0001" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="h-9 px-2 rounded border border-border bg-surface w-32" />
        <button onClick={async () => { await up({ data: { from_currency: from as any, to_currency: to as any, rate } }); reload(); }} className="h-9 px-3 rounded bg-foreground text-background font-bold text-xs">Add rate</button>
      </div>
      <SimpleTable rows={rows} cols={["from_currency", "to_currency", "rate", "effective_at"]} />
    </div>
  );
}

function CustomOrdersTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const act = useServerFn(adminCustomOrderAction);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-bold">{r.full_name} · {r.phone}</div>
              <div className="text-xs text-muted-foreground">{r.make} {r.model} · {r.year_from}-{r.year_to} · budget {r.budget_min}-{r.budget_max} {r.currency}</div>
              {r.notes && <div className="text-xs mt-1">{r.notes}</div>}
            </div>
            <select defaultValue={r.status} onChange={async (e) => { await act({ data: { id: r.id, status: e.target.value as any } }); reload(); }}
              className="h-9 px-2 rounded border border-border bg-surface text-xs">
              {["submitted", "reviewing", "offered", "accepted", "rejected", "cancelled", "completed"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ rows, cols }: { rows: any[]; cols: string[] }) {
  if (!rows.length) return <p className="text-muted-foreground text-sm">None</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface"><tr>{cols.map((c) => <th key={c} className="text-start p-2 text-xs font-bold uppercase text-muted-foreground">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              {cols.map((c) => <td key={c} className="p-2">{typeof r[c] === "boolean" ? (r[c] ? "✓" : "—") : String(r[c] ?? "—").slice(0, 60)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Hero image tab ----------------
function HeroTab({ settings, reload }: { settings: any[]; reload: () => void }) {
  const updateSetting = useServerFn(adminUpdateSetting);
  const createUploadUrl = useServerFn(adminCreateHeroUploadUrl);
  const current = settings.find((s) => s.key === "homepage_hero")?.value ?? {};
  const [imageUrl, setImageUrl] = useState<string>(current.image_url ?? "");
  const [imagePath, setImagePath] = useState<string>(current.image_path ?? "");
  const [headlineAr, setHeadlineAr] = useState<string>(current.headline_ar ?? "");
  const [headlineEn, setHeadlineEn] = useState<string>(current.headline_en ?? "");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);

  async function loadPreview(path: string) {
    if (!path) return setPreviewSignedUrl(null);
    const { data } = await supabase.storage.from("site-media").createSignedUrl(path, 3600);
    setPreviewSignedUrl(data?.signedUrl ?? null);
  }

  async function handleFile(file: File) {
    setUploading(true); setMsg(null);
    try {
      const { path, token } = await createUploadUrl({ data: { filename: file.name } });
      const { error } = await supabase.storage.from("site-media").uploadToSignedUrl(path, token, file);
      if (error) throw error;
      setImagePath(path); setImageUrl(""); await loadPreview(path);
      setMsg("Uploaded — click Save to apply.");
    } catch (e: any) { setMsg(e.message); } finally { setUploading(false); }
  }

  async function save() {
    await updateSetting({ data: {
      key: "homepage_hero",
      value: {
        image_url: imageUrl || null,
        image_path: imagePath || null,
        headline_ar: headlineAr || null,
        headline_en: headlineEn || null,
      },
    } });
    setMsg("Saved.");
    reload();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">Upload new hero image</label>
          <input type="file" accept="image/*" disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="mt-2 block w-full text-sm" />
          {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
        </div>
        <div className="text-xs text-muted-foreground">— or —</div>
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground">External image URL</label>
          <input value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImagePath(""); }}
            placeholder="https://…" className="mt-2 w-full h-10 px-3 rounded border border-border bg-surface text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Headline (Arabic)</label>
            <textarea value={headlineAr} onChange={(e) => setHeadlineAr(e.target.value)} rows={2}
              placeholder="عنوان رئيسي (سطرين مع \n)"
              className="mt-2 w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Headline (English)</label>
            <textarea value={headlineEn} onChange={(e) => setHeadlineEn(e.target.value)} rows={2}
              placeholder="Headline (two lines with \n)"
              className="mt-2 w-full px-3 py-2 rounded border border-border bg-surface text-sm" />
          </div>
        </div>
        {(imageUrl || previewSignedUrl) && (
          <div>
            <div className="text-xs font-bold uppercase text-muted-foreground mb-2">Preview</div>
            <img src={imageUrl || previewSignedUrl || ""} alt="Hero preview" className="w-full max-h-64 object-cover rounded-lg border border-border" />
          </div>
        )}
        <button onClick={save} className="h-10 px-4 rounded-lg bg-foreground text-background font-bold text-sm">Save</button>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </div>
    </div>
  );
}

// ---------------- Accessories tab ----------------
function AccessoriesTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const up = useServerFn(adminUpsertAccessory);
  const del = useServerFn(adminDeleteAccessory);
  const [editing, setEditing] = useState<any | null>(null);
  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ name: "", in_stock: true, featured: false, active: true, images: [] })}
        className="h-9 px-3 rounded bg-foreground text-background font-bold text-xs">+ Add accessory</button>
      {editing && <AccessoryForm initial={editing} onCancel={() => setEditing(null)}
        onSave={async (v) => { await up({ data: v }); setEditing(null); reload(); }} />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
            <div className="flex items-center gap-3 min-w-0">
              {r.images?.[0] && <img src={r.images[0]} alt="" className="w-12 h-12 rounded object-cover" />}
              <div className="min-w-0">
                <div className="font-bold truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">{r.brand} · {r.category} · {r.price_sar ?? "—"} SAR · {r.active ? "active" : "hidden"}</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setEditing(r)} className="px-2.5 h-8 rounded-md border border-border text-xs font-bold">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: r.id } }); reload(); } }}
                className="px-2.5 h-8 rounded-md bg-destructive/10 text-destructive text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-muted-foreground text-sm">None yet</p>}
      </div>
    </div>
  );
}

function AccessoryForm({ initial, onSave, onCancel }: { initial: any; onSave: (v: any) => void; onCancel: () => void }) {
  const [v, setV] = useState<any>({ ...initial, images: initial.images ?? [] });
  const [imgInput, setImgInput] = useState("");
  return (
    <div className="rounded-xl border border-gold bg-card p-4 space-y-2 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input placeholder="Name (EN)" value={v.name ?? ""} onChange={(e) => setV({ ...v, name: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Name (AR)" value={v.name_ar ?? ""} onChange={(e) => setV({ ...v, name_ar: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" dir="rtl" />
        <input placeholder="Brand" value={v.brand ?? ""} onChange={(e) => setV({ ...v, brand: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Category" value={v.category ?? ""} onChange={(e) => setV({ ...v, category: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Slug (optional)" value={v.slug ?? ""} onChange={(e) => setV({ ...v, slug: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input type="number" placeholder="Price SAR" value={v.price_sar ?? ""} onChange={(e) => setV({ ...v, price_sar: e.target.value ? Number(e.target.value) : null })} className="h-9 px-2 rounded border border-border bg-surface" />
      </div>
      <textarea placeholder="Description (EN)" value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} className="w-full px-2 py-2 rounded border border-border bg-surface" rows={2} />
      <textarea placeholder="الوصف (AR)" value={v.description_ar ?? ""} onChange={(e) => setV({ ...v, description_ar: e.target.value })} className="w-full px-2 py-2 rounded border border-border bg-surface" rows={2} dir="rtl" />
      <div>
        <div className="text-xs font-bold mb-1">Image URLs</div>
        {(v.images ?? []).map((u: string, i: number) => (
          <div key={i} className="flex gap-1 mb-1">
            <input value={u} readOnly className="h-8 px-2 rounded border border-border bg-surface flex-1 text-xs" />
            <button onClick={() => setV({ ...v, images: v.images.filter((_: any, j: number) => j !== i) })} className="px-2 h-8 rounded bg-destructive/10 text-destructive text-xs">×</button>
          </div>
        ))}
        <div className="flex gap-1">
          <input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="https://image-url" className="h-8 px-2 rounded border border-border bg-surface flex-1 text-xs" />
          <button onClick={() => { if (imgInput) { setV({ ...v, images: [...(v.images ?? []), imgInput] }); setImgInput(""); } }} className="px-2 h-8 rounded bg-foreground text-background text-xs font-bold">Add</button>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!v.in_stock} onChange={(e) => setV({ ...v, in_stock: e.target.checked })} /> In stock</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} /> Featured</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={v.active !== false} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Active</label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(v)} className="h-9 px-4 rounded bg-foreground text-background font-bold text-xs">Save</button>
        <button onClick={onCancel} className="h-9 px-4 rounded border border-border text-xs">Cancel</button>
      </div>
    </div>
  );
}

// ---------------- Spare parts tab ----------------
function SparePartsTab({ rows, reload }: { rows: any[]; reload: () => void }) {
  const up = useServerFn(adminUpsertSparePart);
  const del = useServerFn(adminDeleteSparePart);
  const [editing, setEditing] = useState<any | null>(null);
  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ name: "", in_stock: true, oem: false, featured: false, active: true, images: [], compatible_makes: [], compatible_models: [] })}
        className="h-9 px-3 rounded bg-foreground text-background font-bold text-xs">+ Add spare part</button>
      {editing && <SparePartForm initial={editing} onCancel={() => setEditing(null)}
        onSave={async (v) => { await up({ data: v }); setEditing(null); reload(); }} />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
            <div className="flex items-center gap-3 min-w-0">
              {r.images?.[0] && <img src={r.images[0]} alt="" className="w-12 h-12 rounded object-cover" />}
              <div className="min-w-0">
                <div className="font-bold truncate">{r.name} {r.part_number && <span className="text-xs text-muted-foreground">#{r.part_number}</span>}</div>
                <div className="text-xs text-muted-foreground truncate">{r.brand} · {(r.compatible_makes ?? []).join("/")} · {r.price_sar ?? "—"} SAR{r.oem ? " · OEM" : ""}</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setEditing(r)} className="px-2.5 h-8 rounded-md border border-border text-xs font-bold">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: r.id } }); reload(); } }}
                className="px-2.5 h-8 rounded-md bg-destructive/10 text-destructive text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-muted-foreground text-sm">None yet</p>}
      </div>
    </div>
  );
}

function SparePartForm({ initial, onSave, onCancel }: { initial: any; onSave: (v: any) => void; onCancel: () => void }) {
  const [v, setV] = useState<any>({ ...initial, images: initial.images ?? [], compatible_makes: initial.compatible_makes ?? [], compatible_models: initial.compatible_models ?? [] });
  const [imgInput, setImgInput] = useState("");
  return (
    <div className="rounded-xl border border-gold bg-card p-4 space-y-2 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input placeholder="Name (EN)" value={v.name ?? ""} onChange={(e) => setV({ ...v, name: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Name (AR)" value={v.name_ar ?? ""} onChange={(e) => setV({ ...v, name_ar: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" dir="rtl" />
        <input placeholder="Part number" value={v.part_number ?? ""} onChange={(e) => setV({ ...v, part_number: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Brand" value={v.brand ?? ""} onChange={(e) => setV({ ...v, brand: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Category" value={v.category ?? ""} onChange={(e) => setV({ ...v, category: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Slug (optional)" value={v.slug ?? ""} onChange={(e) => setV({ ...v, slug: e.target.value })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input type="number" placeholder="Price SAR" value={v.price_sar ?? ""} onChange={(e) => setV({ ...v, price_sar: e.target.value ? Number(e.target.value) : null })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input type="number" placeholder="Year from" value={v.year_from ?? ""} onChange={(e) => setV({ ...v, year_from: e.target.value ? Number(e.target.value) : null })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input type="number" placeholder="Year to" value={v.year_to ?? ""} onChange={(e) => setV({ ...v, year_to: e.target.value ? Number(e.target.value) : null })} className="h-9 px-2 rounded border border-border bg-surface" />
        <input placeholder="Compatible makes (comma-sep: Hyundai,Kia)" value={(v.compatible_makes ?? []).join(",")} onChange={(e) => setV({ ...v, compatible_makes: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className="h-9 px-2 rounded border border-border bg-surface md:col-span-2" />
        <input placeholder="Compatible models (comma-sep)" value={(v.compatible_models ?? []).join(",")} onChange={(e) => setV({ ...v, compatible_models: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className="h-9 px-2 rounded border border-border bg-surface md:col-span-2" />
      </div>
      <textarea placeholder="Description (EN)" value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} className="w-full px-2 py-2 rounded border border-border bg-surface" rows={2} />
      <textarea placeholder="الوصف (AR)" value={v.description_ar ?? ""} onChange={(e) => setV({ ...v, description_ar: e.target.value })} className="w-full px-2 py-2 rounded border border-border bg-surface" rows={2} dir="rtl" />
      <div>
        <div className="text-xs font-bold mb-1">Image URLs</div>
        {(v.images ?? []).map((u: string, i: number) => (
          <div key={i} className="flex gap-1 mb-1">
            <input value={u} readOnly className="h-8 px-2 rounded border border-border bg-surface flex-1 text-xs" />
            <button onClick={() => setV({ ...v, images: v.images.filter((_: any, j: number) => j !== i) })} className="px-2 h-8 rounded bg-destructive/10 text-destructive text-xs">×</button>
          </div>
        ))}
        <div className="flex gap-1">
          <input value={imgInput} onChange={(e) => setImgInput(e.target.value)} placeholder="https://image-url" className="h-8 px-2 rounded border border-border bg-surface flex-1 text-xs" />
          <button onClick={() => { if (imgInput) { setV({ ...v, images: [...(v.images ?? []), imgInput] }); setImgInput(""); } }} className="px-2 h-8 rounded bg-foreground text-background text-xs font-bold">Add</button>
        </div>
      </div>
      <div className="flex gap-4 text-xs flex-wrap">
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!v.in_stock} onChange={(e) => setV({ ...v, in_stock: e.target.checked })} /> In stock</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!v.oem} onChange={(e) => setV({ ...v, oem: e.target.checked })} /> OEM</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} /> Featured</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={v.active !== false} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Active</label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(v)} className="h-9 px-4 rounded bg-foreground text-background font-bold text-xs">Save</button>
        <button onClick={onCancel} className="h-9 px-4 rounded border border-border text-xs">Cancel</button>
      </div>
    </div>
  );
}

// ---------------- Vehicles tab ----------------
const STATUS_OPTIONS = [
  { v: "available", label: "Available" },
  { v: "reserved", label: "Reserved" },
  { v: "sold", label: "Sold" },
  { v: "under_review", label: "Under review" },
  { v: "coming_soon", label: "Coming soon" },
  { v: "draft", label: "Draft (not published)" },
  { v: "hidden", label: "Hidden (unpublished)" },
];
const FUEL_OPTIONS = ["petrol", "diesel", "hybrid", "electric"];

function VehiclesTab({ rows, reload, listingType = "vehicle" }: { rows: any[]; reload: () => void; listingType?: "vehicle" | "auction" }) {
  const up = useServerFn(adminUpsertVehicle);
  const del = useServerFn(adminDeleteVehicle);
  const [editing, setEditing] = useState<any | null>(null);
  const [filter, setFilter] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const isAuction = listingType === "auction";

  const scoped = rows.filter((r) => (r.listing_type ?? "vehicle") === listingType);
  const filtered = scoped.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [r.make, r.model, r.year, r.stock_number, r.title_en, r.title_ar, r.slug, r.auction_source].some((x) =>
      String(x ?? "").toLowerCase().includes(q),
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() =>
              setEditing({
                make: "", model: "", year: new Date().getFullYear(),
                status: "draft", is_active: false, featured: false, coming_soon: false,
                listing_type: listingType,
                auction_status: isAuction ? "available_bid" : undefined,
                options: [], images: [],
              })
            }
            className="h-9 px-3 rounded bg-foreground text-background font-bold text-xs"
          >
            + Add {isAuction ? "auction" : "vehicle"}
          </button>
          {!isAuction && (
            <button
              onClick={() => setImportOpen(true)}
              className="h-9 px-3 rounded border border-border bg-card font-bold text-xs"
            >
              ⬆ Import
            </button>
          )}
        </div>

        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search make / model / stock #"
          className="h-9 px-3 rounded border border-border bg-surface text-sm w-64"
        />
      </div>

      {importOpen && (
        <ImportVehiclesDialog
          onClose={() => setImportOpen(false)}
          onDone={() => { setImportOpen(false); reload(); }}
        />
      )}


      {editing && (
        <VehicleForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={async (v) => {
            await up({ data: v });
            setEditing(null);
            reload();
          }}
        />
      )}

      <div className="space-y-2">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap text-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              {r.images?.[0] && (
                <img src={r.images[0]} alt="" className="w-14 h-14 rounded object-cover" />
              )}
              <div className="min-w-0">
                <div className="font-bold truncate">
                  {r.year} {r.make} {r.model} {r.trim && <span className="text-muted-foreground font-normal">· {r.trim}</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.stock_number && `#${r.stock_number} · `}
                  {r.price_sar ? `${fmt(Number(r.price_sar))} SAR` : "—"} · {r.status}
                  {r.featured ? " · ★ featured" : ""}
                  {r.mileage_km != null ? ` · ${fmt(Number(r.mileage_km))} km` : ""}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <a
                href={isAuction ? `/auctions/${r.slug || r.id}` : `/cars/${r.slug || r.id}`}
                target="_blank"
                rel="noopener"
                className="px-2.5 h-8 inline-flex items-center rounded-md border border-border text-xs font-bold hover:border-gold"
              >
                Preview
              </a>

              <button
                onClick={() => setEditing(r)}
                className="px-2.5 h-8 rounded-md border border-border text-xs font-bold"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  const { id, slug, created_at, updated_at, published_at, ...rest } = r;
                  setEditing({ ...rest, status: "draft", is_active: false, featured: false });
                }}
                className="px-2.5 h-8 rounded-md border border-border text-xs font-bold hover:border-gold"
              >
                Duplicate
              </button>
              <button
                onClick={async () => {
                  if (confirm("Delete this vehicle?")) {
                    try {
                      await del({ data: { id: r.id } });
                      reload();
                    } catch (e: any) {
                      alert(e.message || "Could not delete — it may be referenced by reservations.");
                    }
                  }
                }}
                className="px-2.5 h-8 rounded-md bg-destructive/10 text-destructive text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!filtered.length && <p className="text-muted-foreground text-sm">No vehicles match.</p>}
      </div>
    </div>
  );
}

function VehicleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any;
  onSave: (v: any) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<any>({
    ...initial,
    options: initial.options ?? [],
    images: initial.images ?? [],
  });
  const [optInput, setOptInput] = useState("");
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const createUploadUrl = useServerFn(adminCreateVehicleImageUploadUrl);

  function set<K extends string>(k: K, val: any) {
    setV((cur: any) => ({ ...cur, [k]: val }));
  }
  function num(val: string): number | null {
    return val === "" ? null : Number(val);
  }
  function int(val: string): number | null {
    return val === "" ? null : parseInt(val, 10);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setMsg(null);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const { path, token } = await createUploadUrl({ data: { filename: file.name } });
        const { error } = await supabase.storage
          .from("vehicle-images")
          .uploadToSignedUrl(path, token, file);
        if (error) throw error;
        const { data: signed } = await supabase.storage
          .from("vehicle-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signed?.signedUrl) newUrls.push(signed.signedUrl);
      }
      set("images", [...(v.images ?? []), ...newUrls]);
      setMsg(`Uploaded ${newUrls.length} image(s).`);
    } catch (e: any) {
      setMsg(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function moveImage(i: number, dir: -1 | 1) {
    const next = (v.images ?? []).slice();
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("images", next);
  }
  function removeImage(i: number) {
    set("images", (v.images ?? []).filter((_: any, idx: number) => idx !== i));
  }
  function setCover(i: number) {
    const next = (v.images ?? []).slice();
    const [pick] = next.splice(i, 1);
    next.unshift(pick);
    set("images", next);
  }
  function addUrl() {
    if (!imgUrlInput) return;
    set("images", [...(v.images ?? []), imgUrlInput]);
    setImgUrlInput("");
  }

  function submit() {
    if (!v.make || !v.model || !v.year) {
      setMsg("Make, model and year are required.");
      return;
    }
    onSave(v);
  }

  return (
    <div className="rounded-xl border border-gold bg-card p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{v.id ? "Edit vehicle" : "New vehicle"}</h3>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancel ✕</button>
      </div>

      <Section title="Identification">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <FInput label="Make *" value={v.make} onChange={(x) => set("make", x)} />
          <FInput label="Model *" value={v.model} onChange={(x) => set("model", x)} />
          <FInput label="Trim" value={v.trim ?? ""} onChange={(x) => set("trim", x)} />
          <FInput label="Year *" type="number" value={v.year ?? ""} onChange={(x) => set("year", int(x))} />
          <FInput label="Title (EN)" value={v.title_en ?? ""} onChange={(x) => set("title_en", x)} />
          <FInput label="Title (AR)" rtl value={v.title_ar ?? ""} onChange={(x) => set("title_ar", x)} />
          <FInput label="Slug (URL)" value={v.slug ?? ""} onChange={(x) => set("slug", x)} />
          <FInput label="Stock #" value={v.stock_number ?? ""} onChange={(x) => set("stock_number", x)} />
          <FInput label="Korea location" value={v.korea_location ?? ""} onChange={(x) => set("korea_location", x)} placeholder="Seoul, Busan…" />
          <FInput label="City (shown to public)" value={v.city ?? ""} onChange={(x) => set("city", x)} placeholder="Seoul" />
        </div>
      </Section>

      <Section title="Specs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <FInput label="Mileage (km)" type="number" value={v.mileage_km ?? ""} onChange={(x) => set("mileage_km", int(x))} />
          <FSelect label="Fuel" value={v.fuel ?? ""} onChange={(x) => set("fuel", x || null)} options={[{ v: "", label: "—" }, ...FUEL_OPTIONS.map((f) => ({ v: f, label: f }))]} />
          <FInput label="Transmission" value={v.transmission ?? ""} onChange={(x) => set("transmission", x)} placeholder="auto / manual" />
          <FInput label="Engine (cc)" type="number" value={v.engine_cc ?? ""} onChange={(x) => set("engine_cc", int(x))} />
          <FInput label="Cylinders" type="number" value={v.cylinders ?? ""} onChange={(x) => set("cylinders", int(x))} />
          <FInput label="Body type" value={v.body_type ?? ""} onChange={(x) => set("body_type", x)} placeholder="Sedan / SUV / Hatchback" />
          <FInput label="Drive type" value={v.drive_type ?? ""} onChange={(x) => set("drive_type", x)} placeholder="FWD / AWD / RWD" />
          <FInput label="Exterior color" value={v.exterior_color ?? v.color ?? ""} onChange={(x) => set("exterior_color", x)} />
          <FInput label="Interior color" value={v.interior_color ?? ""} onChange={(x) => set("interior_color", x)} />
          <FInput label="Condition" value={v.condition ?? ""} onChange={(x) => set("condition", x)} placeholder="New / Used / Auction grade 4.5" />
        </div>
      </Section>

      <Section title="Source">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FInput label="Source URL (Encar / K-Car / auction)" value={v.source_url ?? ""} onChange={(x) => set("source_url", x)} />
          <FInput label="Source platform" value={v.source_platform ?? ""} onChange={(x) => set("source_platform", x)} placeholder="Encar / K-Car / Auction" />
        </div>
      </Section>

      <Section title="Listing type & auction details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <FSelect
            label="Listing type"
            value={v.listing_type ?? "vehicle"}
            onChange={(x) => set("listing_type", x)}
            options={[
              { v: "vehicle", label: "Vehicle (normal listing)" },
              { v: "auction", label: "Auction" },
            ]}
          />
          <FSelect
            label="Auction source"
            value={v.auction_source ?? ""}
            onChange={(x) => set("auction_source", x || null)}
            options={[
              { v: "", label: "—" },
              { v: "Hyundai Glovis", label: "Hyundai Glovis" },
              { v: "Lotte Auction", label: "Lotte Auction" },
              { v: "K Car Auction", label: "K Car Auction" },
              { v: "Other", label: "Other" },
            ]}
          />
          <FSelect
            label="Auction status"
            value={v.auction_status ?? ""}
            onChange={(x) => set("auction_status", x || null)}
            options={[
              { v: "", label: "—" },
              { v: "available_bid", label: "Open for bid" },
              { v: "ending_soon", label: "Ending soon" },
              { v: "ended", label: "Ended" },
              { v: "purchased", label: "Purchased" },
              { v: "unavailable", label: "Unavailable" },
            ]}
          />
          <FInput label="Auction source URL" value={v.auction_url ?? ""} onChange={(x) => set("auction_url", x)} />
          <FInput
            label="Auction ends at"
            type="datetime-local"
            value={v.auction_end_at ? String(v.auction_end_at).slice(0, 16) : ""}
            onChange={(x) => set("auction_end_at", x ? new Date(x).toISOString() : null)}
          />
          <FInput label="Current bid (KRW)" type="number" value={v.current_bid_krw ?? ""} onChange={(x) => set("current_bid_krw", num(x))} />
          <FInput label="Estimated final (KRW)" type="number" value={v.estimated_final_price_krw ?? ""} onChange={(x) => set("estimated_final_price_krw", num(x))} />
        </div>
      </Section>


      <Section title="Pricing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <FInput label="Price (SAR)" type="number" value={v.price_sar ?? ""} onChange={(x) => set("price_sar", num(x))} />
          <FInput label="Price (USD)" type="number" value={v.price_usd ?? ""} onChange={(x) => set("price_usd", num(x))} />
          <FInput label="Price (KRW)" type="number" value={v.price_krw ?? ""} onChange={(x) => set("price_krw", num(x))} />
          <FInput label="Exchange rate (KRW → SAR)" type="number" value={v.exchange_rate_krw_sar ?? ""} onChange={(x) => set("exchange_rate_krw_sar", num(x))} />
          <FInput label="Reservation deposit (SAR)" type="number" value={v.deposit_sar ?? ""} onChange={(x) => set("deposit_sar", num(x))} />
          <FInput label="Est. shipping (SAR)" type="number" value={v.est_shipping_sar ?? ""} onChange={(x) => set("est_shipping_sar", num(x))} />
          <FInput label="Est. export (SAR)" type="number" value={v.est_export_sar ?? ""} onChange={(x) => set("est_export_sar", num(x))} />
          <FInput label="Inspection fee (SAR)" type="number" value={v.inspection_fee_sar ?? ""} onChange={(x) => set("inspection_fee_sar", num(x))} />
          <FInput label="Negotiation fee (SAR)" type="number" value={v.negotiation_fee_sar ?? ""} onChange={(x) => set("negotiation_fee_sar", num(x))} />
          <FInput label="Other fees (SAR)" type="number" value={v.other_fees_sar ?? ""} onChange={(x) => set("other_fees_sar", num(x))} />
          <FInput label="Est. landed total (SAR)" type="number" value={v.est_landed_sar ?? ""} onChange={(x) => set("est_landed_sar", num(x))} />
        </div>
      </Section>

      <Section title="Content">
        <div className="space-y-2">
          <FTextarea label="Description (EN)" value={v.description ?? ""} onChange={(x) => set("description", x)} />
          <FTextarea label="الوصف (AR)" rtl value={v.description_ar ?? ""} onChange={(x) => set("description_ar", x)} />
          <FTextarea label="Inspection notes" value={v.inspection_notes ?? ""} onChange={(x) => set("inspection_notes", x)} />
          <FTextarea label="Accident history" value={v.accident_history ?? ""} onChange={(x) => set("accident_history", x)} />
          <FTextarea label="Public notes (shown to customers)" value={v.public_notes ?? ""} onChange={(x) => set("public_notes", x)} />
          <FTextarea label="Admin private notes (not public)" value={v.admin_notes ?? ""} onChange={(x) => set("admin_notes", x)} />
        </div>

        <div className="mt-3">
          <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Options / features</div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(v.options ?? []).map((opt: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface border border-border text-xs">
                {opt}
                <button onClick={() => set("options", v.options.filter((_: any, j: number) => j !== i))} className="text-destructive">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              value={optInput}
              onChange={(e) => setOptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); if (optInput) { set("options", [...(v.options ?? []), optInput]); setOptInput(""); } }
              }}
              placeholder="Sunroof, Heated seats, CarPlay…"
              className="h-8 px-2 rounded border border-border bg-surface flex-1 text-xs"
            />
            <button
              onClick={() => { if (optInput) { set("options", [...(v.options ?? []), optInput]); setOptInput(""); } }}
              className="px-3 h-8 rounded bg-foreground text-background text-xs font-bold"
            >
              Add
            </button>
          </div>
        </div>
      </Section>

      <Section title="Images">
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="block text-xs"
          />
          {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
          <div className="mt-2 flex gap-1">
            <input
              value={imgUrlInput}
              onChange={(e) => setImgUrlInput(e.target.value)}
              placeholder="…or paste image URL"
              className="h-8 px-2 rounded border border-border bg-surface flex-1 text-xs"
            />
            <button onClick={addUrl} className="px-3 h-8 rounded bg-foreground text-background text-xs font-bold">Add URL</button>
          </div>
          {(v.images ?? []).length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {v.images.map((url: string, i: number) => (
                <div key={i} className={`relative rounded-lg overflow-hidden border-2 ${i === 0 ? "border-gold" : "border-border"}`}>
                  <img src={url} alt="" className="w-full h-24 object-cover" />
                  {i === 0 && <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded bg-gold text-gold-foreground text-[10px] font-bold">Cover</span>}
                  <div className="absolute bottom-1 inset-x-1 flex justify-between gap-1">
                    <button onClick={() => moveImage(i, -1)} className="px-1.5 py-0.5 rounded bg-background/90 text-[10px] font-bold">←</button>
                    {i !== 0 && <button onClick={() => setCover(i)} className="px-1.5 py-0.5 rounded bg-gold/90 text-gold-foreground text-[10px] font-bold">Cover</button>}
                    <button onClick={() => moveImage(i, 1)} className="px-1.5 py-0.5 rounded bg-background/90 text-[10px] font-bold">→</button>
                    <button onClick={() => removeImage(i)} className="px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground text-[10px] font-bold">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Visibility & SEO">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <FSelect
            label="Status"
            value={v.status ?? "available"}
            onChange={(x) => set("status", x)}
            options={STATUS_OPTIONS.map((o) => ({ v: o.v, label: o.label }))}
          />
          <label className="flex items-center gap-2 self-end pb-1">
            <input type="checkbox" checked={v.is_active !== false} onChange={(e) => set("is_active", e.target.checked)} />
            <span className="text-xs font-bold">Active (visible to public)</span>
          </label>
          <label className="flex items-center gap-2 self-end pb-1">
            <input type="checkbox" checked={!!v.featured} onChange={(e) => set("featured", e.target.checked)} />
            <span className="text-xs font-bold">Featured (homepage)</span>
          </label>
          <label className="flex items-center gap-2 self-end pb-1">
            <input type="checkbox" checked={!!v.coming_soon} onChange={(e) => set("coming_soon", e.target.checked)} />
            <span className="text-xs font-bold">Coming soon</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <FInput label="Meta title (SEO)" value={v.meta_title ?? ""} onChange={(x) => set("meta_title", x)} />
          <FInput label="Meta description (SEO)" value={v.meta_description ?? ""} onChange={(x) => set("meta_description", x)} />
        </div>
      </Section>

      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

      <div className="flex gap-2 flex-wrap">
        <button onClick={submit} className="h-10 px-5 rounded bg-foreground text-background font-bold text-xs">
          {v.id ? "Save changes" : "Create vehicle"}
        </button>
        <button
          onClick={() => { setV((c: any) => ({ ...c, status: "draft", is_active: false })); setTimeout(submit, 0); }}
          className="h-10 px-4 rounded border border-border text-xs font-bold"
        >
          Save as draft
        </button>
        <button onClick={onCancel} className="h-10 px-4 rounded border border-border text-xs">Cancel</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-gold mb-2">{title}</div>
      {children}
    </div>
  );
}

function FInput({
  label, value, onChange, type, rtl, placeholder,
}: { label: string; value: any; onChange: (v: string) => void; type?: string; rtl?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</div>
      <input
        type={type ?? "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        dir={rtl ? "rtl" : undefined}
        placeholder={placeholder}
        className="w-full h-9 px-2 rounded border border-border bg-surface text-sm"
      />
    </label>
  );
}

function FTextarea({
  label, value, onChange, rtl,
}: { label: string; value: string; onChange: (v: string) => void; rtl?: boolean }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</div>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        dir={rtl ? "rtl" : undefined}
        rows={3}
        className="w-full px-2 py-2 rounded border border-border bg-surface text-sm"
      />
    </label>
  );
}

function FSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-2 rounded border border-border bg-surface text-sm font-semibold"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ---------------- Import vehicles dialog ----------------
function parseCsv(text: string): Record<string, any>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some((v) => v !== "")) rows.push(cur);
        cur = [];
      } else { field += c; }
    }
  }
  if (field !== "" || cur.length) { cur.push(field); if (cur.some((v) => v !== "")) rows.push(cur); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => { obj[h] = r[i] ?? ""; });
    return obj;
  });
}

const ARRAY_FIELDS = new Set(["images", "options"]);
const BOOL_FIELDS = new Set(["featured"]);

function normalizeRow(raw: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = k.trim();
    if (v === "" || v == null) continue;
    if (ARRAY_FIELDS.has(key)) {
      out[key] = Array.isArray(v)
        ? v
        : String(v).split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    } else if (BOOL_FIELDS.has(key)) {
      out[key] = v === true || /^(true|1|yes|y)$/i.test(String(v));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const CSV_TEMPLATE =
  "make,model,year,trim,mileage_km,fuel,transmission,exterior_color,interior_color,body_type,stock_number,price_sar,price_krw,status,featured,title_en,title_ar,description,images,options\n" +
  'Hyundai,Sonata,2022,N Line,15000,petrol,automatic,White,Black,sedan,KR-1001,98000,,available,true,"Hyundai Sonata N Line 2022","سوناتا 2022","Low mileage","https://example.com/a.jpg;https://example.com/b.jpg","Sunroof;360 Camera"\n';

function ImportVehiclesDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const importFn = useServerFn(adminImportVehicles);
  const [tab, setTab] = useState<"csv" | "json" | "paste">("csv");
  const [text, setText] = useState("");
  const [mirrorImages, setMirrorImages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setText(await f.text());
  }

  async function run() {
    setErr(null); setResult(null); setBusy(true);
    try {
      let rows: Record<string, any>[] = [];
      if (tab === "json") {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array of vehicle objects");
        rows = parsed.map(normalizeRow);
      } else {
        rows = parseCsv(text).map(normalizeRow);
      }
      if (!rows.length) throw new Error("No rows parsed");
      const res = await importFn({ data: { rows, mirrorImages } });
      setResult(res);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  function download(name: string, body: string, mime = "text/csv") {
    const blob = new Blob([body], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">Import vehicles</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Duplicates (matching stock_number, or make+model+year+mileage_km) are skipped.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground text-xl leading-none px-2">×</button>
        </div>

        <div className="flex gap-1 border-b border-border">
          {(["csv", "json", "paste"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-xs font-bold border-b-2 ${tab === id ? "border-foreground" : "border-transparent text-muted-foreground"}`}
            >
              {id === "csv" ? "CSV file" : id === "json" ? "JSON file" : "Paste text"}
            </button>
          ))}
        </div>

        {tab === "csv" && (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
              <button
                onClick={() => download("vehicles-template.csv", CSV_TEMPLATE)}
                className="h-8 px-3 rounded border border-border text-xs font-bold"
              >
                Download template
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required: make, model, year. Use ";" between values in images & options.
            </p>
          </div>
        )}
        {tab === "json" && (
          <input type="file" accept=".json,application/json" onChange={onFile} className="text-sm" />
        )}
        {tab === "paste" && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste CSV or JSON here"
            className="w-full h-48 p-2 rounded border border-border bg-surface text-xs font-mono"
          />
        )}

        {text && tab !== "paste" && (
          <div className="text-xs text-muted-foreground truncate">
            Loaded {text.length.toLocaleString()} chars
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mirrorImages}
            onChange={(e) => setMirrorImages(e.target.checked)}
          />
          Mirror image URLs to storage (recommended)
        </label>

        {err && <div className="text-sm text-destructive">{err}</div>}
        {result && (
          <div className="text-sm bg-surface border border-border rounded p-3 space-y-1">
            <div>✅ Inserted: <b>{result.inserted}</b></div>
            <div>⏭ Skipped (duplicates): <b>{result.skipped}</b></div>
            <div>❌ Failed: <b>{result.failed}</b></div>
            <div>🖼 Images mirrored: <b>{result.imagesMirrored}</b></div>
            {result.errors?.length ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs">Show errors</summary>
                <ul className="text-xs mt-1 space-y-0.5">
                  {result.errors.map((e: any, i: number) => (
                    <li key={i}>Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="h-9 px-3 rounded border border-border text-xs font-bold">
            Close
          </button>
          {result ? (
            <button onClick={onDone} className="h-9 px-3 rounded bg-foreground text-background text-xs font-bold">
              Done
            </button>
          ) : (
            <button
              onClick={run}
              disabled={busy || !text.trim()}
              className="h-9 px-3 rounded bg-foreground text-background text-xs font-bold disabled:opacity-50"
            >
              {busy ? "Importing…" : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


