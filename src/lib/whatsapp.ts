import { fmt } from "@/lib/i18n";

export const WA_NUMBER = "966559906064";

type VehicleLike = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  price_sar?: number | string | null;
  title_ar?: string | null;
  title_en?: string | null;
};

function vehTitle(v: VehicleLike, lang: "ar" | "en") {
  if (lang === "ar") return v.title_ar || `${v.make ?? ""} ${v.model ?? ""} ${v.year ?? ""}`.trim();
  return v.title_en || `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim();
}

export function buildVehicleInquiry(v: VehicleLike, url: string, lang: "ar" | "en") {
  const price = v.price_sar ? fmt(Number(v.price_sar)) : "—";
  const km = v.mileage_km != null ? fmt(Number(v.mileage_km)) : "—";
  const title = vehTitle(v, lang);
  return lang === "ar"
    ? `مرحباً، أنا مهتم بهذه السيارة:\nالسيارة: ${title}\nالموديل: ${v.year ?? "—"}\nالعداد: ${km} كم\nالسعر: ${price} ر.س\nالرابط: ${url}`
    : `Hello, I am interested in this vehicle:\nVehicle: ${title}\nYear: ${v.year ?? "—"}\nMileage: ${km} km\nPrice: ${price} SAR\nLink: ${url}`;
}

export function buildAuctionInquiry(
  v: VehicleLike & {
    auction_source?: string | null;
    current_bid_krw?: number | string | null;
    estimated_final_price_krw?: number | string | null;
  },
  url: string,
) {
  const title = vehTitle(v, "ar");
  const km = v.mileage_km != null ? fmt(Number(v.mileage_km)) : "—";
  const current = v.current_bid_krw != null ? `${fmt(Number(v.current_bid_krw))} KRW` : "—";
  const expected = v.estimated_final_price_krw != null ? `${fmt(Number(v.estimated_final_price_krw))} KRW` : "—";
  return [
    "السلام عليكم، أريد طلب مزايدة على هذه السيارة من المزاد:",
    "",
    `السيارة: ${title}`,
    `السنة: ${v.year ?? "—"}`,
    `العداد: ${km} كم`,
    `المزاد: ${v.auction_source ?? "—"}`,
    `السعر الحالي: ${current}`,
    `السعر المتوقع: ${expected}`,
    `رابط السيارة: ${url}`,
    "",
    "هل يمكنكم فحصها والتأكد من إمكانية المزايدة عليها؟",
  ].join("\n");
}

export function waLink(message: string, number: string = WA_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}


export function vehicleDetailUrl(idOrSlug: string) {
  if (typeof window === "undefined") return `/cars/${idOrSlug}`;
  return `${window.location.origin}/cars/${idOrSlug}`;
}
