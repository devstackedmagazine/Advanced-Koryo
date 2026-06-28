import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { fetchEncarDetail, fetchEncarList, fetchVehicleDetailBundle } from "./encar.api";
import { mapEncarToVehicle } from "./encar.mapper";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// ---------- Hero image / homepage settings ----------
export const getHeroSetting = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_settings")
    .select("value")
    .eq("key", "homepage_hero")
    .maybeSingle();
  const value = (data?.value ?? {}) as {
    image_url?: string | null;
    image_path?: string | null;
    headline_ar?: string | null;
    headline_en?: string | null;
  };
  let resolved: string | null = value.image_url ?? null;
  if (!resolved && value.image_path) {
    const { data: signed } = await supabaseAdmin
      .storage.from("site-media")
      .createSignedUrl(value.image_path, 60 * 60 * 24 * 7); // 7 days
    resolved = signed?.signedUrl ?? null;
  }
  return {
    imageUrl: resolved,
    headlineAr: value.headline_ar ?? null,
    headlineEn: value.headline_en ?? null,
  };
});

// ---------- Vehicles (public) ----------
export const listVehicles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      featuredOnly: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      const rawList = await fetchEncarList({ limit: data.limit ?? 50 });
      const vehicles = rawList.map((c) => mapEncarToVehicle(c));
      // The API has no "featured" flag — surface the first N as featured.
      return data.featuredOnly ? vehicles.slice(0, data.limit ?? 4) : vehicles;
    } catch (err) {
      console.error("[listVehicles] Encar API error:", err);
      return [];
    }
  });

// ---------- Auctions (public) ----------
const AUCTION_LIST_COLUMNS =
  "id, slug, make, model, trim, year, mileage_km, fuel, transmission, color, exterior_color, engine_cc, body_type, price_krw, price_sar, price_usd, images, status, featured, coming_soon, korea_location, city, title_ar, title_en, stock_number, created_at, auction_source, auction_status, current_bid_krw, estimated_final_price_krw, auction_end_at";

export const listAuctions = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      featuredOnly: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s.from("vehicles")
      .select(AUCTION_LIST_COLUMNS)
      .eq("is_active", true)
      .eq("listing_type", "auction")
      .not("status", "in", "(hidden,draft)")
      .order("auction_end_at", { ascending: true, nullsFirst: false })
      .limit(data.limit ?? 100);
    if (data.featuredOnly) q = q.eq("featured", true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// Public-safe vehicle columns (excludes internal admin/cost/sourcing fields).
// auction_url and admin_notes intentionally excluded.
const VEHICLE_PUBLIC_COLUMNS =
  "id, slug, make, model, trim, year, mileage_km, fuel, transmission, color, exterior_color, interior_color, engine_cc, cylinders, body_type, drive_type, price_krw, price_sar, price_usd, images, status, featured, coming_soon, korea_location, city, title_ar, title_en, description, description_ar, condition, accident_history, options, stock_number, public_notes, inspection_notes, meta_title, meta_description, published_at, created_at, updated_at, est_shipping_sar, est_export_sar, inspection_fee_sar, negotiation_fee_sar, other_fees_sar, est_landed_sar, deposit_sar, listing_type, auction_source, auction_status, current_bid_krw, estimated_final_price_krw, auction_end_at";

export const getVehicleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const id = data.slug.match(/(\d+)$/)?.[1] ?? data.slug;
      const bundle = await fetchVehicleDetailBundle(id);
      return mapEncarToVehicle(bundle.car, {
        accident: bundle.accident,
        optionCategories: bundle.optionCategories,
        inspectionImages: bundle.inspectionImages,
      });
    } catch (err) {
      console.error("[getVehicleBySlug] Encar API error:", err);
      return null;
    }
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getAuctionBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const isUuid = UUID_RE.test(data.slug);
    const q = s.from("vehicles").select(VEHICLE_PUBLIC_COLUMNS).eq("listing_type", "auction");
    const { data: row } = isUuid
      ? await q.eq("id", data.slug).maybeSingle()
      : await q.eq("slug", data.slug).maybeSingle();
    return row;
  });



// ---------- Encar external API ----------

export const getEncarVehicle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const raw = await fetchEncarDetail(data.id);
    return mapEncarToVehicle(raw);
  });

export const listEncarVehicles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const rawList = await fetchEncarList({ limit: data.limit ?? 20 });
    return rawList.map((c) => mapEncarToVehicle(c));
  });

// ---------- Accessories ----------
export const listAccessories = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ featuredOnly: z.boolean().optional(), limit: z.number().int().min(1).max(100).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s.from("accessories")
      .select("id, slug, name, name_ar, brand, category, description, description_ar, price_sar, images, in_stock, featured, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.featuredOnly) q = q.eq("featured", true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------- Spare parts ----------
export const listSpareParts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ featuredOnly: z.boolean().optional(), limit: z.number().int().min(1).max(100).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s.from("spare_parts")
      .select("id, slug, name, name_ar, part_number, brand, category, compatible_makes, compatible_models, year_from, year_to, description, description_ar, price_sar, images, in_stock, oem, featured, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.featuredOnly) q = q.eq("featured", true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
