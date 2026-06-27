import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "اطلب سيارة · Advanced Koryo" },
      { name: "description", content: "أرسل طلب سيارتك المرغوبة من كوريا." },
    ],
  }),
  component: RequestPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  whatsapp: z.string().trim().max(20).optional(),
  city: z.string().trim().max(60).optional(),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().max(60).optional(),
  yearFrom: z.string().max(4).optional(),
  yearTo: z.string().max(4).optional(),
  budget: z.string().max(15).optional(),
  notes: z.string().max(600).optional(),
});

function RequestPage() {
  const { t } = useI18n();
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 lg:px-8 py-10 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold">{t.request.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.request.sub}</p>

        {ok ? (
          <div className="mt-8 rounded-2xl border border-gold bg-accent p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-gold mx-auto" />
            <p className="mt-3 font-bold text-lg">{t.request.success}</p>
          </div>
        ) : (
          <form
            className="mt-8 grid sm:grid-cols-2 gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
              const parsed = schema.safeParse(data);
              if (!parsed.success) {
                setErr(parsed.error.issues[0]?.message ?? "Invalid input");
                return;
              }
              setErr(null);
              const { data: u } = await supabase.auth.getUser();
              const { error } = await supabase.from("custom_orders").insert({
                user_id: u.user?.id ?? null,
                full_name: parsed.data.name,
                phone: parsed.data.phone,
                whatsapp: parsed.data.whatsapp,
                make: parsed.data.make,
                model: parsed.data.model,
                year_from: parsed.data.yearFrom ? Number(parsed.data.yearFrom) : null,
                year_to: parsed.data.yearTo ? Number(parsed.data.yearTo) : null,
                budget_max: parsed.data.budget ? Number(parsed.data.budget) : null,
                currency: "SAR",
                notes: parsed.data.notes,
              } as never);
              if (error) { setErr(error.message); return; }
              setOk(true);
            }}
          >
            <Field name="name" label={t.request.name} required />
            <Field name="phone" label={t.request.phone} required type="tel" />
            <Field name="whatsapp" label={t.request.whatsapp} type="tel" />
            <Field name="city" label={t.request.city} />
            <Field name="make" label={t.request.make} required />
            <Field name="model" label={t.request.model} />
            <Field name="yearFrom" label={t.request.yearFrom} type="number" />
            <Field name="yearTo" label={t.request.yearTo} type="number" />
            <Field name="budget" label={t.request.budget} type="number" />
            <label className="sm:col-span-2">
              <div className="text-xs font-bold mb-1">{t.request.notes}</div>
              <textarea name="notes" rows={4} maxLength={600} className="w-full rounded-lg border border-border bg-surface p-3 text-sm" />
            </label>
            {err && <p className="sm:col-span-2 text-sm text-destructive font-semibold">{err}</p>}
            <button
              type="submit"
              className="sm:col-span-2 h-12 rounded-xl bg-foreground text-background font-bold hover:bg-gold hover:text-gold-foreground"
            >
              {t.cta.send}
            </button>
          </form>
        )}
      </div>
    </PageLayout>
  );
}

function Field({ name, label, required, type = "text" }: { name: string; label: string; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <div className="text-xs font-bold mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </div>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={120}
        className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gold"
      />
    </label>
  );
}
