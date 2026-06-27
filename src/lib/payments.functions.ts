import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getGateway } from "./payments/gateways";

const reserveSchema = z.object({
  vehicleSlug: z.string().min(1),
  vehicleSnapshot: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number().int(),
    fuel: z.enum(["gasoline", "diesel", "hybrid", "electric", "lpg"]).optional(),
    priceSAR: z.number(),
    priceKRW: z.number(),
    image: z.string().optional(),
  }),
  depositAmount: z.number().positive(),
  currency: z.enum(["USD", "SAR", "KRW"]),
});

/**
 * Create a reservation for a vehicle (deposit). Upserts the vehicle into DB if needed,
 * creates reservation + draft order. Returns the orderId for checkout flow.
 */
export const createReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reserveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Look up vehicle by slug. We do NOT create vehicles here — listings
    // must be created by admins via the admin tools. This prevents any
    // authenticated user from polluting the public catalog through the
    // reservation flow.
    const { data: existing, error: lookupErr } = await supabase
      .from("vehicles")
      .select("id, status")
      .eq("slug", data.vehicleSlug)
      .maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!existing?.id) {
      throw new Error("Vehicle not found. Please choose a vehicle from the catalog.");
    }
    if (existing.status && existing.status !== "available") {
      throw new Error("This vehicle is no longer available for reservation.");
    }
    const vehicleId = existing.id as string;

    // Enforce server-side minimum deposit from admin_settings. The client
    // cannot lower the deposit below the configured minimum.
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["default_deposit_usd", "default_deposit_sar"]);
    const settingsMap = new Map(
      (settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value]),
    );
    const parseNum = (v: unknown): number | null => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? n : null;
    };
    const minByCurrency: Record<string, number | null> = {
      USD: parseNum(settingsMap.get("default_deposit_usd")),
      SAR: parseNum(settingsMap.get("default_deposit_sar")),
      KRW: null,
    };
    const minimum = minByCurrency[data.currency];
    if (minimum != null && data.depositAmount < minimum) {
      throw new Error(
        `Deposit must be at least ${minimum} ${data.currency}.`,
      );
    }

    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        vehicle_id: vehicleId,
        deposit_amount: data.depositAmount,
        currency: data.currency,
        refundable: true,
        status: "pending",
      })
      .select("id")
      .single();
    if (rErr) throw rErr;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        vehicle_id: vehicleId,
        reservation_id: reservation.id,
        order_type: "deposit",
        description: `${data.vehicleSnapshot.year} ${data.vehicleSnapshot.make} ${data.vehicleSnapshot.model} — refundable deposit`,
        amount: data.depositAmount,
        currency: data.currency,
        status: "awaiting_payment",
      })
      .select("id")
      .single();
    if (oErr) throw oErr;

    return { orderId: order.id, reservationId: reservation.id };
  });


const serviceFeeSchema = z.object({
  serviceFeeIds: z.array(z.string().uuid()).min(1),
});

export const createServiceFeeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => serviceFeeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: fees, error: fErr } = await supabase
      .from("service_fees")
      .select("*")
      .in("id", data.serviceFeeIds);
    if (fErr) throw fErr;
    if (!fees?.length) throw new Error("No service fees found");

    const billable = fees.filter((f) => !f.is_free && Number(f.amount) > 0);
    if (!billable.length) throw new Error("Selected items are all free");

    const currency = billable[0].currency;
    if (billable.some((f) => f.currency !== currency)) throw new Error("Mixed currencies not supported");

    const amount = billable.reduce((s, f) => s + Number(f.amount), 0);
    const lineItems = billable.map((f) => ({ code: f.code, name: f.name, amount: Number(f.amount) }));

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        order_type: "service_fee",
        description: `Service fees: ${billable.map((f) => f.name).join(", ")}`,
        line_items: lineItems,
        amount,
        currency,
        status: "awaiting_payment",
      })
      .select("id")
      .single();
    if (oErr) throw oErr;

    return { orderId: order.id };
  });

const initiateSchema = z.object({
  orderId: z.string().uuid(),
  gatewayId: z.string(),
});

export const initiatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => initiateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (oErr || !order) throw new Error("Order not found");
    if (order.user_id !== userId) throw new Error("Not your order");
    if (!["awaiting_payment", "draft", "pending_admin_approval"].includes(order.status)) {
      throw new Error(`Order is ${order.status}; cannot start payment`);
    }
    if (order.status === "pending_admin_approval") {
      throw new Error("This order needs admin approval before payment");
    }

    const gateway = getGateway(data.gatewayId);
    if (!gateway) throw new Error(`Unknown gateway: ${data.gatewayId}`);
    if (!gateway.supportedCurrencies.includes(order.currency as never)) {
      throw new Error(`${gateway.id} does not support ${order.currency}`);
    }

    // Create payment row first so the gateway has our paymentId
    const { data: paymentRow, error: pErr } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        user_id: userId,
        vehicle_id: order.vehicle_id,
        payment_type: order.order_type,
        amount: order.amount,
        currency: order.currency,
        gateway: gateway.id,
        status: "initiated",
      })
      .select("*")
      .single();
    if (pErr) throw pErr;

    const result = await gateway.initiate({
      paymentId: paymentRow.id,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency as "USD" | "SAR" | "KRW",
      description: order.description ?? undefined,
      successUrl: `/account?order=${order.id}`,
      cancelUrl: `/checkout/${paymentRow.id}`,
    });

    const { error: uErr } = await supabase
      .from("payments")
      .update({
        gateway_reference: result.gatewayReference,
        checkout_url: result.checkoutUrl,
        gateway_payload: (result.payload ?? null) as never,
        status: result.status,
      } as never)
      .eq("id", paymentRow.id);
    if (uErr) throw uErr;

    return { paymentId: paymentRow.id, checkoutUrl: result.checkoutUrl, status: result.status };
  });

const proofSchema = z.object({
  paymentId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional(),
  receiptUrl: z.string().min(1),
  senderName: z.string().optional(),
  referenceNote: z.string().optional(),
  amountClaimed: z.number().positive().optional(),
});

export const submitPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => proofSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: payment, error } = await supabase
      .from("payments")
      .select("id, user_id, currency, amount")
      .eq("id", data.paymentId)
      .single();
    if (error || !payment) throw new Error("Payment not found");
    if (payment.user_id !== userId) throw new Error("Not your payment");

    const { error: insErr } = await supabase.from("payment_proofs").insert({
      payment_id: data.paymentId,
      user_id: userId,
      bank_account_id: data.bankAccountId,
      receipt_url: data.receiptUrl,
      sender_name: data.senderName,
      reference_note: data.referenceNote,
      amount_claimed: data.amountClaimed ?? payment.amount,
      currency: payment.currency,
      status: "submitted",
    });
    if (insErr) throw insErr;

    await supabase.from("payments").update({ status: "pending" }).eq("id", data.paymentId);

    return { ok: true };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("*, payments(*), reservations(*), vehicles(slug, make, model, year, images)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getPaymentForCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*, orders(*, vehicles(make, model, year))")
      .eq("id", data.paymentId)
      .single();
    if (error || !payment) throw new Error("Payment not found");
    if (payment.user_id !== userId) throw new Error("Not your payment");

    const { data: banks } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("active", true)
      .eq("currency", payment.currency)
      .order("sort_order");

    const { data: proofs } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("payment_id", payment.id)
      .order("created_at", { ascending: false });

    return { payment, banks: banks ?? [], proofs: proofs ?? [] };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: !!data };
  });

/**
 * Idempotent bootstrap: grants the current user the 'admin' role if there are
 * currently zero admins in the system. After the first admin is set, this
 * function becomes a no-op for everyone else.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false, reason: "An admin already exists" };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { granted: true };
  });
