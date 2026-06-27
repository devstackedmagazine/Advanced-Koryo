import { useI18n, fmt } from "@/lib/i18n";
import { MessageCircle, Package, ShieldCheck } from "lucide-react";

const WA = "https://wa.me/966559906064";

export type ProductCardItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string | null;
  price_sar?: number | null;
  in_stock?: boolean;
  badge?: string | null;
  oem?: boolean;
};

export function ProductCard({ item, kind }: { item: ProductCardItem; kind: "accessory" | "spare_part" }) {
  const { t, lang } = useI18n();
  const waText = `${t.brand.name} — ${kind === "accessory" ? (lang === "ar" ? "إكسسوار" : "Accessory") : (lang === "ar" ? "قطعة غيار" : "Spare part")}: ${item.title}`;
  return (
    <article className="group rounded-2xl bg-card border border-border hover:border-gold hover:shadow-card transition-all overflow-hidden">
      <div className="relative aspect-[4/3] bg-surface-elevated overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <Package className="w-10 h-10" />
          </div>
        )}
        {item.badge && (
          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-wider">
            {item.badge}
          </span>
        )}
        {item.oem && (
          <span className="absolute top-3 end-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold text-gold-foreground text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" /> OEM
          </span>
        )}
        <span className="absolute bottom-3 end-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-[10px] font-bold">
          {item.in_stock ? (lang === "ar" ? "متوفر" : "In stock") : (lang === "ar" ? "حسب الطلب" : "On request")}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-base truncate">{item.title}</h3>
        {item.subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.subtitle}</p>}
        <div className="mt-3 flex items-center justify-between">
          <div>
            {item.price_sar != null ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.common.sar}</div>
                <div className="text-lg font-bold text-gold">{fmt(Number(item.price_sar))}</div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">{lang === "ar" ? "السعر عند الطلب" : "Price on request"}</div>
            )}
          </div>
          <a
            href={`${WA}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-whatsapp text-white text-xs font-bold hover:opacity-90"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" /> {t.cta.whatsapp}
          </a>
        </div>
      </div>
    </article>
  );
}
