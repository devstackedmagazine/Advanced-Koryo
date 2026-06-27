import { MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function WhatsAppCTA() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16 lg:mt-24">
      <div className="rounded-3xl bg-whatsapp text-white p-6 lg:p-12 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold">{t.waCTA.title}</h2>
          <p className="mt-2 text-sm lg:text-base text-white/80 max-w-xl">{t.waCTA.sub}</p>
        </div>
        <a
          href="https://wa.me/966559906064"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-foreground text-whatsapp font-bold text-sm hover:bg-foreground/90"
        >
          <MessageCircle className="w-5 h-5" />
          {t.cta.whatsapp}
        </a>
      </div>
    </section>
  );
}
