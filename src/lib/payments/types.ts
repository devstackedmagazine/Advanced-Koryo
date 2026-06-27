// Gateway-agnostic payment layer.
// New providers (Toss, Moyasar, HyperPay, PayTabs, Tap, Geidea, KG Inicis, NICE, Payple)
// implement PaymentGateway and register themselves in gateways.ts.

export type GatewayId = "bank_transfer" | "eximpay" | "stripe" | "toss" | "moyasar" | "hyperpay" | "paytabs" | "tap" | "geidea";

export type CurrencyCode = "USD" | "SAR" | "KRW";

export type PaymentIntent = {
  paymentId: string;             // our internal payments.id
  orderId: string;
  amount: number;
  currency: CurrencyCode;
  description?: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
};

export type InitiateResult = {
  gateway: GatewayId;
  gatewayReference: string | null; // provider id (e.g. PaymentIntent / sessionId)
  checkoutUrl: string | null;      // null for manual flows (bank transfer)
  status: "initiated" | "pending" | "paid";
  payload?: Record<string, unknown>;
};

export interface PaymentGateway {
  id: GatewayId;
  displayName: { en: string; ar: string };
  description?: { en: string; ar: string };
  supportedCurrencies: CurrencyCode[];
  enabled: boolean;
  manual: boolean; // true = customer pays out-of-band (bank transfer), admin verifies
  initiate(intent: PaymentIntent): Promise<InitiateResult>;
}
