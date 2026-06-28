// Maps a raw Rinevo/Encar car object into the vehicle shape the UI expects
// (VehicleCard + the /cars/$id detail page). Handles Korean text translation,
// image normalization, option flattening, and KRW→SAR price derivation.

import { normalizeImageUrl } from "./encar.api";

type RawOption = { optionName?: string };
type RawOptionCategory = { options?: RawOption[] };

type RawEncarCar = {
  id?: string;
  encar_id?: string;
  title?: string;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  price?: number;
  prices?: { USD?: number; KRW?: number };
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  images?: string[];
  image?: string;
  bodyType?: string;
  type?: string;
  displacement?: number;
  location?: string;
  options?: RawOptionCategory[] | Record<string, RawOptionCategory>;
  accidentHistory?: { hasAccident?: boolean; hasSimpleRepair?: boolean };
  exportEligibility?: { warnings?: string[] };
  sellerComment?: string;
  vin?: string;
};

const SAR_PER_KRW = 0.0028;

function generateSlug(data: RawEncarCar): string {
  return `${data.brand ?? ""}-${data.model ?? ""}-${data.year ?? ""}-${data.id ?? data.encar_id ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function translateFuel(raw?: string): string {
  if (!raw) return "petrol";
  const map: Record<string, string> = {
    "가솔린": "petrol", Gasoline: "petrol",
    "디젤": "diesel", Diesel: "diesel",
    "하이브리드": "hybrid", Hybrid: "hybrid",
    "전기": "electric", Electric: "electric", EV: "electric",
    LPG: "lpg",
  };
  return map[raw.trim()] ?? "petrol";
}

function translateTransmission(raw?: string): string {
  if (!raw) return "Automatic";
  const map: Record<string, string> = {
    "오토": "Automatic", Automatic: "Automatic",
    "수동": "Manual", Manual: "Manual",
    CVT: "CVT",
  };
  return map[raw.trim()] ?? "Automatic";
}

function translateColor(raw?: string): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    "검정": "Black", "검정색": "Black",
    "흰색": "White", "흰": "White", "화이트": "White",
    "은색": "Silver", "실버": "Silver",
    "회색": "Gray", "그레이": "Gray",
    "파란색": "Blue", "파란": "Blue", "블루": "Blue",
    "빨간색": "Red", "빨간": "Red", "레드": "Red",
    "하늘색": "Sky Blue",
    "진주": "Pearl White", "펄": "Pearl White",
  };
  return map[raw.trim()] ?? raw;
}

function flattenOptions(options: RawEncarCar["options"]): string[] {
  if (!options) return [];
  const categories: RawOptionCategory[] = Array.isArray(options)
    ? options
    : (Object.values(options) as RawOptionCategory[]);
  return categories.flatMap((cat) =>
    (cat.options ?? []).map((o) => o.optionName).filter(Boolean) as string[],
  );
}

function formatAccidentHistory(acc: RawEncarCar["accidentHistory"]): string {
  if (!acc) return "Clean history";
  if (acc.hasAccident) return "Accident recorded";
  if (acc.hasSimpleRepair) return "Minor repairs only — no structural accident";
  return "Clean history";
}

function formatExportWarnings(eligibility: RawEncarCar["exportEligibility"]): string | null {
  if (!eligibility?.warnings?.length) return null;
  return eligibility.warnings.join(" | ");
}

function parseDriveTypeFromTitle(title?: string): string | null {
  if (!title) return null;
  const m = title.match(/\b(AWD|4WD|4MATIC|FWD|RWD|Quattro|xDrive)\b/i);
  return m ? m[1] : null;
}

export function mapEncarToVehicle(raw: unknown) {
  const data = raw as RawEncarCar;
  const priceKRW = data.price ?? data.prices?.KRW ?? null;
  const images = (data.images ?? (data.image ? [data.image] : [])).map(normalizeImageUrl);

  return {
    id: data.id ?? data.encar_id,
    slug: generateSlug(data),
    make: data.brand,
    model: data.model,
    trim: data.variant ?? null,
    year: data.year ?? 0,
    mileage_km: data.mileage ?? null,
    fuel: translateFuel(data.fuelType),
    transmission: translateTransmission(data.transmission),
    color: translateColor(data.color),
    exterior_color: translateColor(data.color),
    interior_color: null,
    engine_cc: data.displacement ?? null,
    cylinders: null,
    body_type: data.bodyType ?? data.type ?? null,
    drive_type: parseDriveTypeFromTitle(data.title),
    price_krw: priceKRW,
    price_usd: data.prices?.USD ?? null,
    price_sar: priceKRW ? Math.round(priceKRW * SAR_PER_KRW) : null,
    est_landed_sar: null,
    deposit_sar: null,
    images,
    title_en: data.title,
    title_ar: null,
    status: "available",
    listing_type: "vehicle",
    is_active: true,
    featured: false,
    coming_soon: false,
    city: data.location || "Korea",
    korea_location: data.location || "Korea",
    options: flattenOptions(data.options),
    accident_history: formatAccidentHistory(data.accidentHistory),
    inspection_notes: formatExportWarnings(data.exportEligibility),
    description: data.sellerComment || null,
    description_ar: null,
    condition: "Used",
    stock_number: data.id ?? data.encar_id ?? null,
    public_notes: null,
    vin: data.vin ?? null,
  };
}
