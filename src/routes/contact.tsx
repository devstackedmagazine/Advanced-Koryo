import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n } from "@/lib/i18n";
import { MessageCircle, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل · Advanced Koryo" },
      { name: "description", content: "تواصل مع فريق ادفاسد كوريو في الرياض وسيول." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  message: z.string().trim().min(2).max(1000),
});

function ContactPage() {
  const { t, lang } = useI18n();
  const [ok, setOk] = useState(false);

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 lg:px-8 py-10 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold">{t.contact.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.contact.sub}</p>

        <div className="mt-8 grid lg:grid-cols-[1fr_1.2fr] gap-8">
          <div className="space-y-4">
            <a href="https://wa.me/821072290580" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl bg-whatsapp text-white p-5 hover:opacity-95">
              <MessageCircle className="w-5 h-5" />
              <div>
                <div className="font-bold">WhatsApp</div>
                <div className="text-xs text-white/80">{"\u00a0"}821072290580 - 00966559906064</div>
              </div>
            </a>
            <a href="tel:+966559906064" className="flex items-center gap-3 rounded-2xl border border-border p-5 hover:border-gold">
              <Phone className="w-5 h-5 text-gold" />
              <div>
                <div className="font-bold">{t.contact.phone}</div>
                <div className="text-xs text-muted-foreground">00966559906064 - 821072290580</div>
              </div>
            </a>
            <a href="mailto:info@mykoryo.com" className="flex items-center gap-3 rounded-2xl border border-border p-5 hover:border-gold">
              <Mail className="w-5 h-5 text-gold" />
              <div>
                <div className="font-bold">Email</div>
                <div className="text-xs text-muted-foreground">info@mykoryo.com</div>
              </div>
            </a>
            <div className="grid sm:grid-cols-2 gap-3">
              {t.contact.offices.map((o) => (
                <div key={o.c} className="rounded-2xl bg-surface border border-border p-5">
                  <div className="flex items-center gap-2 text-gold">
                    <MapPin className="w-4 h-4" />
                    <span className="font-bold">{o.c}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{o.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            {ok ? (
              <div className="rounded-2xl border border-gold bg-accent p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-gold mx-auto" />
                <p className="mt-3 font-bold text-lg">{t.contact.success}</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(new FormData(e.currentTarget));
                  if (schema.safeParse(data).success) setOk(true);
                }}
                className="rounded-2xl border border-border bg-card p-5 lg:p-6 space-y-4"
              >
                <label className="block">
                  <div className="text-xs font-bold mb-1">{t.contact.name}</div>
                  <input name="name" required maxLength={80} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
                </label>
                <label className="block">
                  <div className="text-xs font-bold mb-1">{t.contact.phone}</div>
                  <input name="phone" type="tel" required maxLength={20} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
                </label>
                <label className="block">
                  <div className="text-xs font-bold mb-1">{t.contact.message}</div>
                  <textarea name="message" rows={6} required maxLength={1000} className="w-full rounded-lg border border-border bg-surface p-3 text-sm" />
                </label>
                <button type="submit" className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:bg-gold hover:text-gold-foreground">
                  {t.cta.submit}
                </button>
                <p className="text-[11px] text-muted-foreground text-center" dir={lang === "ar" ? "rtl" : "ltr"}>
                  {lang === "ar" ? "بإرسال النموذج توافق على تواصلنا معك." : "By submitting you agree to be contacted."}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
