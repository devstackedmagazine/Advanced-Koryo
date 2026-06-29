// HTTP client for the Rinevo/Encar scraper API.
// Four endpoints: list, detail, accident history, options.
// All image URLs are normalized to direct ci.encar.com links (never the paid proxy).

const BASE_URL = process.env.RINEVO_API_BASE_URL ?? "https://api.rinevoapi.autos/api/scraper";
const API_KEY = process.env.APICARS_API_KEY!;

function getHeaders() {
  if (!API_KEY) throw new Error("APICARS_API_KEY is not set in environment");
  return { "x-api-key": API_KEY };
}

// Strip the paid image-proxy wrapper and any query string so images load
// directly from ci.encar.com (proxied URLs return HTTP 402).
export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/image-proxy")) {
    try {
      const inner = new URL(url).searchParams.get("url");
      if (inner && inner.includes("encar.com")) return inner.split("?")[0];
    } catch {}
  }
  return url.split("?")[0];
}

function normalizeImages<T extends { image?: string; images?: string[] }>(car: T): T {
  return {
    ...car,
    image: normalizeImageUrl(car.image ?? car.images?.[0] ?? ""),
    images: (car.images ?? []).map(normalizeImageUrl),
  };
}

// The Rinevo API requires fuel codes, not human-readable strings.
// Our mapper produces "petrol"/"diesel"/"hybrid"/"electric"; map both spellings.
const FUEL_API_CODE: Record<string, string> = {
  petrol: "gas", gasoline: "gas", gas: "gas",
  diesel: "die", die: "die",
  hybrid: "hyb", hyb: "hyb",
  electric: "elec", ev: "elec", elec: "elec",
};

const SORT_API: Record<string, [string, string]> = {
  newest: ["relevance", "desc"],
  "price-low": ["price", "asc"],
  "price-high": ["price", "desc"],
  "mileage-low": ["mileage", "asc"],
};

export type ListFilters = {
  limit?: number;
  page?: number;
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  maxMileage?: number;
  priceFromKrw?: number;
  priceToKrw?: number;
  fuel?: string; // petrol|diesel|hybrid|electric → mapped to API code
  color?: string;
  bodyType?: string; // must be the exact API taxonomy string
  sort?: "newest" | "price-low" | "price-high" | "mileage-low";
};

// ENDPOINT 1 — GET /cars?<filters> → array is at json.data.cars (NOT json.data).
// Server-side filters supported by the API: brand, model, yearFrom/yearTo,
// maxMileage, priceFromKrw/priceToKrw, fuelType (coded), color, bodyType, sort.
export async function fetchEncarList(params?: ListFilters): Promise<unknown[]> {
  const url = new URL(`${BASE_URL}/cars`);
  const p = url.searchParams;
  if (params?.limit != null) p.set("limit", String(params.limit));
  if (params?.page != null) p.set("page", String(params.page));
  if (params?.brand) p.set("brand", params.brand);
  if (params?.model) p.set("model", params.model);
  if (params?.yearFrom) p.set("yearFrom", String(params.yearFrom));
  if (params?.yearTo) p.set("yearTo", String(params.yearTo));
  if (params?.maxMileage) p.set("maxMileage", String(Math.round(params.maxMileage)));
  if (params?.priceFromKrw) p.set("priceFromKrw", String(Math.round(params.priceFromKrw)));
  if (params?.priceToKrw) p.set("priceToKrw", String(Math.round(params.priceToKrw)));
  if (params?.fuel) {
    const code = FUEL_API_CODE[params.fuel.toLowerCase()];
    if (code) p.set("fuelType", code);
  }
  if (params?.color) p.set("color", params.color);
  if (params?.bodyType) p.set("bodyType", params.bodyType);
  if (params?.sort && SORT_API[params.sort]) {
    const [by, order] = SORT_API[params.sort];
    p.set("sortBy", by);
    p.set("sortOrder", order);
  }

  const res = await fetch(url.toString(), { headers: getHeaders(), cache: "no-store" });
  const json = (await res.json()) as {
    success: boolean;
    data?: { cars?: unknown[]; [k: string]: unknown };
    message?: string;
  };
  if (!json.success) throw new Error(json.message ?? "Encar list API error");

  const cars = json.data?.cars ?? [];
  return cars.map((c: any) => normalizeImages(c));
}

// ENDPOINT 2 — GET /vehicle/{id}/full → json.data. Falls back to the list on failure.
export async function fetchEncarDetail(id: string): Promise<unknown> {
  try {
    const res = await fetch(`${BASE_URL}/vehicle/${id}/full`, {
      headers: getHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { success: boolean; data?: unknown; error?: string };
    if (json.success && json.data) {
      return normalizeImages(json.data as any);
    }
  } catch {
    // fall through to list fallback
  }

  const list = await fetchEncarList({ limit: 100 });
  const car = list.find(
    (c: any) => String(c.id) === String(id) || String(c.encar_id) === String(id),
  ) as any;
  if (!car) throw new Error(`Car with id ${id} not found in list`);
  return car;
}

// ENDPOINT 3 — GET /accident-history/{id} → json.data
export async function fetchAccidentHistory(id: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/accident-history/${id}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  const json = (await res.json()) as { success: boolean; data?: unknown; message?: string };
  if (!json.success) throw new Error(json.message ?? "Encar accident-history API error");
  return json.data;
}

// ENDPOINT 4 — GET /options/{id} → json.data is a numeric-keyed object; return Object.values()
export async function fetchVehicleOptions(id: string): Promise<unknown[]> {
  const res = await fetch(`${BASE_URL}/options/${id}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  const json = (await res.json()) as { success: boolean; data?: unknown; message?: string };
  if (!json.success) throw new Error(json.message ?? "Encar options API error");
  return json.data ? Object.values(json.data as Record<string, unknown>) : [];
}

// ---------- Three-way parallel detail bundle ----------
// Detail is mandatory; accident + options are best-effort (.catch → null) and never block.
export type VehicleDetailBundle = {
  car: any;
  accident: any | null;          // normalized: accident?.data ?? accident
  optionCategories: any[] | null; // array of { category, options } (both API shapes handled)
  inspectionImages: string[];     // normalized front/back inspection photos
};

export async function fetchVehicleDetailBundle(id: string): Promise<VehicleDetailBundle> {
  const headers = getHeaders();
  const reqOpts = { headers, cache: "no-store" as const, signal: AbortSignal.timeout(8000) };

  const [carRes, accRes, optRes] = await Promise.all([
    fetch(`${BASE_URL}/vehicle/${id}/full`, reqOpts),
    fetch(`${BASE_URL}/accident-history/${id}`, reqOpts).catch(() => null),
    fetch(`${BASE_URL}/options/${id}`, reqOpts).catch(() => null),
  ]);

  // --- Car detail (mandatory, with list fallback) ---
  let car: any | null = null;
  try {
    const carJson = (await carRes.json()) as { success: boolean; data?: any };
    if (carJson.success && carJson.data) car = normalizeImages(carJson.data);
  } catch {
    /* fall through to list fallback */
  }
  if (!car) {
    const list = await fetchEncarList({ limit: 100 });
    car = list.find((c: any) => String(c.id) === String(id) || String(c.encar_id) === String(id)) ?? null;
    if (!car) throw new Error(`Car with id ${id} not found`);
  }

  // --- Accident (best-effort, dual-format normalize) ---
  let accident: any | null = null;
  try {
    if (accRes) {
      const j = (await accRes.json()) as { success?: boolean; data?: any };
      if (j && j.success !== false) accident = j.data ?? j;
    }
  } catch {
    /* ignore */
  }
  if (!accident && car.accident) accident = car.accident; // embedded fallback

  // --- Options (best-effort, both shapes) ---
  let optionCategories: any[] | null = null;
  try {
    if (optRes) {
      const j = (await optRes.json()) as { success?: boolean; data?: any };
      const raw = j?.data;
      if (Array.isArray(raw)) optionCategories = raw;
      else if (raw && typeof raw === "object") {
        optionCategories = Object.values(raw).filter((v: any) => v && typeof v === "object" && "options" in v);
      }
    }
  } catch {
    /* ignore */
  }
  if (!optionCategories && Array.isArray(car.options)) optionCategories = car.options; // embedded fallback

  // --- Inspection photos (appended after the car gallery) ---
  const front = accident?.images?.front ?? null;
  const back = accident?.images?.back ?? null;
  const inspectionImages = [front, back]
    .filter(Boolean)
    .map((u: string) => normalizeImageUrl(u));

  return { car, accident, optionCategories, inspectionImages };
}
