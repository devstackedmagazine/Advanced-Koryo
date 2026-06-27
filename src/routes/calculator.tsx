import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n, fmt } from "@/lib/i18n";
import { calculate, PORTS } from "@/lib/import-calc";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "حاسبة الاستيراد · Advanced Koryo" },
      { name: "description", content: "احسب تكلفة استيراد سيارتك من كوريا إلى السعودية." },
    ],
  }),
  component: CalcPage,
});

function CalcPage() {
  const { t, lang } = useI18n();
  const [priceKRW, setPriceKRW] = useState(35000000);
  const [port, setPort] = useState(PORTS[0].id);
  const [fuel, setFuel] = useState<"petrol" | "diesel" | "hybrid" | "electric">("petrol");
  const calc = calculate({ priceKRW, portId: port, fuel });

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 lg:px-8 py-10 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold">{t.calc.title}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">{t.calc.sub}</p>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 space-y-4">
            <label className="block">
              <div className="text-xs font-bold mb-1">{t.calc.priceKRW}</div>
              <input
                type="number"
                value={priceKRW}
                onChange={(e) => setPriceKRW(Number(e.target.value) || 0)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-surface text-base font-bold"
              />
              <div className="mt-1 text-xs text-muted-foreground">₩{fmt(priceKRW)}</div>
            </label>
            <label className="block">
              <div className="text-xs font-bold mb-1">{t.calc.port}</div>
              <select value={port} onChange={(e) => setPort(e.target.value)} className="w-full h-12 px-3 rounded-lg border border-border bg-surface text-sm font-semibold">
                {PORTS.map((p) => <option key={p.id} value={p.id}>{p[lang]}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-xs font-bold mb-1">{t.calc.fuel}</div>
              <select value={fuel} onChange={(e) => setFuel(e.target.value as never)} className="w-full h-12 px-3 rounded-lg border border-border bg-surface text-sm font-semibold">
                <option value="petrol">{t.fuels.petrol}</option>
                <option value="diesel">{t.fuels.diesel}</option>
                <option value="hybrid">{t.fuels.hybrid}</option>
                <option value="electric">{t.fuels.electric}</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl bg-foreground text-background p-5 lg:p-6">
            <div className="text-xs uppercase tracking-wider text-gold font-bold">{t.calc.breakdown}</div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row k={t.calc.carPrice} v={calc.carPrice} />
              <Row k={t.calc.koreaFees} v={calc.koreaFees} />
              <Row k={t.calc.shipping} v={calc.shipping} />
              <Row k={t.calc.customs} v={calc.customs} />
              <Row k={t.calc.vat} v={calc.vat} />
              <Row k={t.calc.clearance} v={calc.clearance} />
            </dl>
            <div className="mt-5 pt-5 border-t border-white/15 flex items-center justify-between">
              <span className="text-sm font-bold">{t.calc.total}</span>
              <span className="text-3xl font-bold text-gold">{fmt(Math.round(calc.total))}</span>
            </div>
            <p className="mt-3 text-[11px] text-background/60">{t.calc.note}</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-background/70">{k}</dt>
      <dd className="font-bold">{fmt(Math.round(v))}</dd>
    </div>
  );
}
