// Approximate landed-cost estimator: KRW → SAR with KSA import fees.
// Tunable constants — replace with live values when integrating provider APIs.

export const KRW_TO_SAR = 0.00282; // ~ as of mid-2026; tune per market.

export const PORTS = [
  { id: "jeddah", ar: "جدة الإسلامي", en: "Jeddah Islamic Port", shippingUSD: 1450 },
  { id: "dammam", ar: "الملك عبدالعزيز - الدمام", en: "King Abdulaziz Port — Dammam", shippingUSD: 1650 },
  { id: "jubail", ar: "الجبيل", en: "Jubail Commercial Port", shippingUSD: 1700 },
];

const USD_TO_SAR = 3.75;

export type CalcInput = {
  priceKRW: number;
  portId: string;
  fuel: "petrol" | "diesel" | "hybrid" | "electric";
};

export function calculate({ priceKRW, portId, fuel }: CalcInput) {
  const port = PORTS.find((p) => p.id === portId) ?? PORTS[0];
  const carPrice = priceKRW * KRW_TO_SAR;
  const koreaFees = Math.max(1500, carPrice * 0.025); // export prep, inspection
  const shipping = port.shippingUSD * USD_TO_SAR;
  const customsBase = carPrice + koreaFees + shipping;
  const customs = customsBase * 0.05;
  const vatBase = customsBase + customs;
  const vat = vatBase * 0.15;
  const clearance = 2200 + (fuel === "electric" ? -300 : 0);
  const total = customsBase + customs + vat + clearance;
  return {
    port,
    carPrice,
    koreaFees,
    shipping,
    customs,
    vat,
    clearance,
    total,
  };
}
