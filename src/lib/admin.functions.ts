import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden — admin only");
}

// ---------------- Read ----------------
export const adminLoadAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const s = context.supabase;
    const [vehicles, reservations, orders, payments, proofs, refunds, fees, banks, rates, customOrders, messages, users, accessories, spareParts, settings] = await Promise.all([
      s.from("vehicles").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("reservations").select("*, vehicles(make, model, year)").order("created_at", { ascending: false }).limit(200),
      s.from("orders").select("*, vehicles(make, model, year)").order("created_at", { ascending: false }).limit(200),
      s.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("payment_proofs").select("*, payments(amount, currency, gateway, order_id)").order("created_at", { ascending: false }).limit(200),
      s.from("refunds").select("*").order("created_at", { ascending: false }).limit(100),
      s.from("service_fees").select("*").order("sort_order"),
      s.from("bank_accounts").select("*").order("sort_order"),
      s.from("exchange_rates").select("*").order("effective_at", { ascending: false }),
      s.from("custom_orders").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
      s.from("profiles").select("id, full_name, phone, city, created_at").order("created_at", { ascending: false }).limit(200),
      s.from("accessories").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("spare_parts").select("*").order("created_at", { ascending: false }).limit(200),
      s.from("admin_settings").select("*"),
    ]);
    return {
      vehicles: vehicles.data ?? [],
      reservations: reservations.data ?? [],
      orders: orders.data ?? [],
      payments: payments.data ?? [],
      proofs: proofs.data ?? [],
      refunds: refunds.data ?? [],
      fees: fees.data ?? [],
      banks: banks.data ?? [],
      rates: rates.data ?? [],
      customOrders: customOrders.data ?? [],
      messages: messages.data ?? [],
      users: users.data ?? [],
      accessories: accessories.data ?? [],
      spareParts: spareParts.data ?? [],
      settings: settings.data ?? [],
    };
  });

// ---------------- Reservations ----------------
const reservationActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "cancel", "refund", "complete"]),
  notes: z.string().optional(),
});
export const adminReservationAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reservationActionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = { admin_notes: data.notes };
    if (data.action === "approve") {
      patch.status = "approved";
      patch.approved_by = context.userId;
      patch.approved_at = new Date().toISOString();
    } else if (data.action === "cancel") patch.status = "cancelled";
    else if (data.action === "refund") {
      patch.status = "refunded";
      patch.refunded_at = new Date().toISOString();
    } else if (data.action === "complete") patch.status = "completed";
    const { error } = await context.supabase.from("reservations").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Orders ----------------
const orderActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "cancel", "mark_paid"]),
});
export const adminOrderAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => orderActionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = {};
    if (data.action === "approve") {
      patch.status = "awaiting_payment";
      patch.approved_by = context.userId;
      patch.approved_at = new Date().toISOString();
    } else if (data.action === "cancel") patch.status = "cancelled";
    else if (data.action === "mark_paid") patch.status = "paid";
    const { error } = await context.supabase.from("orders").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Payments / proofs ----------------
const paymentActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["mark_paid", "mark_failed", "cancel", "refund"]),
  reason: z.string().optional(),
});
export const adminPaymentAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => paymentActionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: payment } = await context.supabase.from("payments").select("*").eq("id", data.id).single();
    if (!payment) throw new Error("Payment not found");
    const patch: Record<string, unknown> = {};
    if (data.action === "mark_paid") {
      patch.status = "paid";
      patch.paid_at = new Date().toISOString();
      // also mark order paid
      await context.supabase.from("orders").update({ status: "paid" }).eq("id", payment.order_id);
    } else if (data.action === "mark_failed") {
      patch.status = "failed";
      patch.failure_reason = data.reason ?? null;
    } else if (data.action === "cancel") patch.status = "cancelled";
    else if (data.action === "refund") {
      patch.status = "refunded";
      await context.supabase.from("refunds").insert({
        payment_id: data.id,
        amount: payment.amount,
        currency: payment.currency,
        reason: data.reason,
        status: "paid",
        initiated_by: context.userId,
      });
    }
    const { error } = await context.supabase.from("payments").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const proofActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});
export const adminProofAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => proofActionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: proof } = await context.supabase.from("payment_proofs").select("*").eq("id", data.id).single();
    if (!proof) throw new Error("Proof not found");
    await context.supabase.from("payment_proofs").update({
      status: data.action === "approve" ? "approved" : "rejected",
      admin_notes: data.notes,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (data.action === "approve") {
      await context.supabase.from("payments").update({
        status: "paid",
        paid_at: new Date().toISOString(),
      }).eq("id", proof.payment_id);
      const { data: pay } = await context.supabase.from("payments").select("order_id").eq("id", proof.payment_id).single();
      if (pay) await context.supabase.from("orders").update({ status: "paid" }).eq("id", pay.order_id);
    }
    return { ok: true };
  });

// ---------------- Upserts: service fees, banks, rates, vehicles ----------------
export const adminUpsertServiceFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    code: z.string(),
    name: z.string(),
    name_ar: z.string().optional(),
    amount: z.number().min(0),
    currency: z.enum(["USD", "SAR", "KRW"]),
    is_free: z.boolean(),
    active: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      const { error } = await context.supabase.from("service_fees").update({
        name: data.name, name_ar: data.name_ar, amount: data.amount,
        currency: data.currency, is_free: data.is_free, active: data.active,
      }).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("service_fees").insert(data as never);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminUpsertBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    label: z.string(),
    bank_name: z.string(),
    account_holder: z.string(),
    iban: z.string().optional(),
    account_number: z.string().optional(),
    swift: z.string().optional(),
    currency: z.enum(["USD", "SAR", "KRW"]),
    active: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      const { error } = await context.supabase.from("bank_accounts").update(data).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("bank_accounts").insert(data);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminUpsertExchangeRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    from_currency: z.enum(["USD", "SAR", "KRW"]),
    to_currency: z.enum(["USD", "SAR", "KRW"]),
    rate: z.number().positive(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("exchange_rates").insert({ ...data, effective_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

const vehicleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional().nullable(),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional().nullable(),
  year: z.number().int(),
  mileage_km: z.number().int().optional().nullable(),
  fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]).optional().nullable(),
  transmission: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  exterior_color: z.string().optional().nullable(),
  interior_color: z.string().optional().nullable(),
  engine_cc: z.number().int().optional().nullable(),
  cylinders: z.number().int().optional().nullable(),
  body_type: z.string().optional().nullable(),
  drive_type: z.string().optional().nullable(),
  korea_location: z.string().optional().nullable(),
  stock_number: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  source_platform: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  title_ar: z.string().optional().nullable(),
  title_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  accident_history: z.string().optional().nullable(),
  inspection_notes: z.string().optional().nullable(),
  admin_notes: z.string().optional().nullable(),
  options: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  price_krw: z.number().optional().nullable(),
  price_sar: z.number().optional().nullable(),
  est_landed_sar: z.number().optional().nullable(),
  est_shipping_sar: z.number().optional().nullable(),
  est_export_sar: z.number().optional().nullable(),
  inspection_fee_sar: z.number().optional().nullable(),
  negotiation_fee_sar: z.number().optional().nullable(),
  deposit_sar: z.number().optional().nullable(),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  status: z.enum(["available", "reserved", "sold", "hidden", "under_review", "coming_soon", "draft"]),
  featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  coming_soon: z.boolean().optional(),
  city: z.string().optional().nullable(),
  public_notes: z.string().optional().nullable(),
  price_usd: z.number().optional().nullable(),
  exchange_rate_krw_sar: z.number().optional().nullable(),
  other_fees_sar: z.number().optional().nullable(),
  external_source: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
  import_status: z.string().optional().nullable(),
  // ---- Auction fields ----
  listing_type: z.enum(["vehicle", "auction"]).optional(),
  auction_source: z.string().optional().nullable(),
  auction_url: z.string().optional().nullable(),
  auction_status: z.string().optional().nullable(),
  current_bid_krw: z.number().optional().nullable(),
  estimated_final_price_krw: z.number().optional().nullable(),
  auction_end_at: z.string().optional().nullable(),
});

export const adminUpsertVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => vehicleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = { ...rest };
    if (rest.status && !["hidden", "draft"].includes(rest.status)) {
      patch.published_at = new Date().toISOString();
    }
    if (id) {
      const { error } = await context.supabase.from("vehicles").update(patch as never).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("vehicles").insert(patch as never);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminCreateVehicleImageUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ filename: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `vehicles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { data: signed, error } = await context.supabase
      .storage.from("vehicle-images")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const adminCustomOrderAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["submitted", "reviewing", "offered", "accepted", "rejected", "cancelled", "completed"]),
    admin_notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("custom_orders").update({
      status: data.status, admin_notes: data.admin_notes,
    }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string(), value: z.unknown() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("admin_settings").upsert({
      key: data.key, value: data.value, updated_by: context.userId, updated_at: new Date().toISOString(),
    } as never);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Accessories ----------------
const accessorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().min(1),
  name_ar: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  price_sar: z.number().nonnegative().optional().nullable(),
  images: z.array(z.string()).optional(),
  in_stock: z.boolean().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});
export const adminUpsertAccessory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => accessorySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("accessories").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("accessories").insert(rest);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminDeleteAccessory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("accessories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Spare parts ----------------
const sparePartSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().min(1),
  name_ar: z.string().optional().nullable(),
  part_number: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  compatible_makes: z.array(z.string()).optional(),
  compatible_models: z.array(z.string()).optional(),
  year_from: z.number().int().optional().nullable(),
  year_to: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  price_sar: z.number().nonnegative().optional().nullable(),
  images: z.array(z.string()).optional(),
  in_stock: z.boolean().optional(),
  oem: z.boolean().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});
export const adminUpsertSparePart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sparePartSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("spare_parts").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("spare_parts").insert(rest);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminDeleteSparePart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("spare_parts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Vehicle delete ----------------
export const adminDeleteVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("vehicles").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Hero image (storage upload via signed URL) ----------------
export const adminCreateHeroUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ filename: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `hero/${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase
      .storage.from("site-media")
      .createSignedUploadUrl(path);
    if (error) throw error;
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

// ---------------- Bulk import vehicles ----------------
const importRowSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int(),
  trim: z.string().optional().nullable(),
  mileage_km: z.coerce.number().int().optional().nullable(),
  fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]).optional().nullable(),
  transmission: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  exterior_color: z.string().optional().nullable(),
  interior_color: z.string().optional().nullable(),
  engine_cc: z.coerce.number().int().optional().nullable(),
  cylinders: z.coerce.number().int().optional().nullable(),
  body_type: z.string().optional().nullable(),
  drive_type: z.string().optional().nullable(),
  korea_location: z.string().optional().nullable(),
  stock_number: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  source_platform: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  title_ar: z.string().optional().nullable(),
  title_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  price_krw: z.coerce.number().optional().nullable(),
  price_sar: z.coerce.number().optional().nullable(),
  est_landed_sar: z.coerce.number().optional().nullable(),
  est_shipping_sar: z.coerce.number().optional().nullable(),
  deposit_sar: z.coerce.number().optional().nullable(),
  status: z.enum(["available", "reserved", "sold", "hidden"]).optional(),
  featured: z.coerce.boolean().optional(),
  options: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

export const adminImportVehicles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      rows: z.array(z.record(z.string(), z.any())).min(1).max(500),
      mirrorImages: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const s = context.supabase;

    const result = {
      inserted: 0,
      skipped: 0,
      failed: 0,
      imagesMirrored: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (let i = 0; i < data.rows.length; i++) {
      try {
        const parsed = importRowSchema.parse(data.rows[i]);

        // dedupe: stock_number takes priority, else make+model+year+mileage_km
        let dupQuery = s.from("vehicles").select("id").limit(1);
        if (parsed.stock_number) {
          dupQuery = dupQuery.eq("stock_number", parsed.stock_number);
        } else {
          dupQuery = dupQuery
            .eq("make", parsed.make)
            .eq("model", parsed.model)
            .eq("year", parsed.year);
          if (parsed.mileage_km != null) dupQuery = dupQuery.eq("mileage_km", parsed.mileage_km);
        }
        const { data: existing } = await dupQuery.maybeSingle();
        if (existing) {
          result.skipped++;
          continue;
        }

        // mirror images
        let imageUrls = parsed.images ?? [];
        if (data.mirrorImages && imageUrls.length) {
          const mirrored: string[] = [];
          for (const url of imageUrls) {
            if (!/^https?:\/\//i.test(url)) {
              mirrored.push(url);
              continue;
            }
            try {
              const resp = await fetch(url);
              if (!resp.ok) throw new Error(`fetch ${resp.status}`);
              const ct = resp.headers.get("content-type") ?? "image/jpeg";
              const ext = (ct.split("/")[1] || "jpg").split(";")[0].replace(/[^a-z0-9]/gi, "") || "jpg";
              const ab = await resp.arrayBuffer();
              const path = `vehicles/import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
              const { error: upErr } = await s.storage
                .from("vehicle-images")
                .upload(path, new Uint8Array(ab), { contentType: ct, upsert: false });
              if (upErr) throw upErr;
              const { data: signed } = await s.storage
                .from("vehicle-images")
                .createSignedUrl(path, 60 * 60 * 24 * 365);
              if (signed?.signedUrl) {
                mirrored.push(signed.signedUrl);
                result.imagesMirrored++;
              } else {
                mirrored.push(url);
              }
            } catch {
              mirrored.push(url); // fall back to original
            }
          }
          imageUrls = mirrored;
        }

        const row = {
          ...parsed,
          images: imageUrls,
          status: parsed.status ?? "available",
          published_at: (parsed.status ?? "available") !== "hidden" ? new Date().toISOString() : null,
        };
        const { error } = await s.from("vehicles").insert(row as never);
        if (error) throw error;
        result.inserted++;
      } catch (e: any) {
        result.failed++;
        result.errors.push({ row: i + 1, error: e?.message ?? String(e) });
      }
    }

    return result;
  });

