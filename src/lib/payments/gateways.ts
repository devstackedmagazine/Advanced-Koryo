import type { PaymentGateway } from "./types";

// --- Bank Transfer (manual) ---
const bankTransferGateway: PaymentGateway = {
  id: "bank_transfer",
  displayName: { en: "Bank Transfer", ar: "تحويل بنكي" },
  description: {
    en: "Transfer to our bank account, then upload your receipt. Admin verifies within 24h.",
    ar: "حوّل إلى حسابنا البنكي ثم ارفع إيصال التحويل. سيتم التحقق خلال 24 ساعة.",
  },
  supportedCurrencies: ["USD", "SAR", "KRW"],
  enabled: true,
  manual: true,
  async initiate(intent) {
    // No external API call — payment row is created with status='initiated'.
    // Customer uploads proof on the checkout page, admin reviews from /admin.
    return {
      gateway: "bank_transfer",
      gatewayReference: `BT-${intent.paymentId.slice(0, 8).toUpperCase()}`,
      checkoutUrl: null,
      status: "initiated",
    };
  },
};

// --- Eximpay (Korean cross-border) ---
// Stub: ready for credentials. When EXIMPAY_MID / EXIMPAY_API_KEY are set, the
// real call will POST to Eximpay's payment-request endpoint and return their
// hosted checkout URL. Until then, we mark the payment 'pending' and the
// admin manually settles via the dashboard.
const eximpayGateway: PaymentGateway = {
  id: "eximpay",
  displayName: { en: "Eximpay (Card / KRW)", ar: "إكسيم باي (بطاقة / وون)" },
  description: {
    en: "International card payments processed in Korea via Eximpay.",
    ar: "مدفوعات بطاقات دولية تتم معالجتها في كوريا عبر إكسيم باي.",
  },
  supportedCurrencies: ["USD", "KRW"],
  enabled: true,
  manual: false,
  async initiate(intent) {
    const mid = process.env.EXIMPAY_MID;
    const key = process.env.EXIMPAY_API_KEY;
    if (!mid || !key) {
      // Credentials not yet configured — record as pending; admin can finalise.
      return {
        gateway: "eximpay",
        gatewayReference: `EXIM-PENDING-${intent.paymentId.slice(0, 8).toUpperCase()}`,
        checkoutUrl: null,
        status: "pending",
        payload: { note: "Eximpay credentials not configured. Admin must complete settlement." },
      };
    }
    // TODO: Replace with real Eximpay payment-request API call once contract is finalised.
    // Expected shape (per Eximpay integration guide):
    //   POST https://api.eximpay.com/v1/payments
    //   headers: { Authorization: `Bearer ${key}`, "X-MID": mid }
    //   body: { amount, currency, order_id, return_url, cancel_url, ... }
    // Response: { redirect_url, tx_id }
    return {
      gateway: "eximpay",
      gatewayReference: null,
      checkoutUrl: null,
      status: "initiated",
      payload: { note: "Eximpay live integration pending." },
    };
  },
};

export const ALL_GATEWAYS: PaymentGateway[] = [bankTransferGateway, eximpayGateway];

export function getGateway(id: string): PaymentGateway | undefined {
  return ALL_GATEWAYS.find((g) => g.id === id);
}

export function gatewaysForCurrency(currency: string): PaymentGateway[] {
  return ALL_GATEWAYS.filter(
    (g) => g.enabled && g.supportedCurrencies.includes(currency as never),
  );
}

// Browser-safe list (no env access)
export const PUBLIC_GATEWAYS = ALL_GATEWAYS.map((g) => ({
  id: g.id,
  displayName: g.displayName,
  description: g.description,
  manual: g.manual,
  supportedCurrencies: g.supportedCurrencies,
}));
