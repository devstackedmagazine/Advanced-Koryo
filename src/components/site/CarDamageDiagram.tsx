import skinImg from "@/assets/inspection/inspection-skin.gif";
import skeletonImg from "@/assets/inspection/inspection-skeleton.gif";
import { CheckCircle2 } from "lucide-react";

export type DamageItem = {
  partCode?: string;
  partName?: string;
  group: "skin" | "skeleton";
  marker: "X" | "W"; // X = Replaced (red), W = Repaired (amber)
  status?: string;
};

type Pos = { x: number; y: number };

// Approximate marker positions (percent of the composite diagram box).
// The diagram is a 3-column composite: left side-profile · top-down centre · right side-profile.
const SKIN_MAP: { kw: RegExp; pos: Pos }[] = [
  { kw: /front\s*bumper|앞.*범퍼/i, pos: { x: 50, y: 8 } },
  { kw: /rear\s*bumper|뒤.*범퍼/i, pos: { x: 50, y: 92 } },
  { kw: /hood|bonnet|후드|본넷/i, pos: { x: 50, y: 22 } },
  { kw: /roof|루프|지붕/i, pos: { x: 50, y: 46 } },
  { kw: /trunk|tail\s*gate|트렁크/i, pos: { x: 50, y: 80 } },
  { kw: /front\s*fender.*(right|우)|(right|우).*front\s*fender/i, pos: { x: 87, y: 30 } },
  { kw: /front\s*fender/i, pos: { x: 13, y: 30 } },
  { kw: /(rear\s*fender|quarter).*(right|우)/i, pos: { x: 87, y: 73 } },
  { kw: /rear\s*fender|quarter/i, pos: { x: 13, y: 73 } },
  { kw: /front\s*door.*(right|우)/i, pos: { x: 84, y: 44 } },
  { kw: /front\s*door/i, pos: { x: 16, y: 44 } },
  { kw: /rear\s*door.*(right|우)/i, pos: { x: 84, y: 60 } },
  { kw: /rear\s*door/i, pos: { x: 16, y: 60 } },
  { kw: /(side\s*sill|rocker).*(right|우)/i, pos: { x: 78, y: 66 } },
  { kw: /side\s*sill|rocker/i, pos: { x: 22, y: 66 } },
];

const SKELETON_MAP: { kw: RegExp; pos: Pos }[] = [
  { kw: /front\s*panel|radiator\s*support/i, pos: { x: 50, y: 12 } },
  { kw: /cross\s*member/i, pos: { x: 50, y: 25 } },
  { kw: /dash\s*panel|firewall/i, pos: { x: 50, y: 33 } },
  { kw: /(side\s*member|frame\s*rail|rail).*(right|우)/i, pos: { x: 58, y: 42 } },
  { kw: /side\s*member|frame\s*rail|rail/i, pos: { x: 42, y: 42 } },
  { kw: /floor/i, pos: { x: 50, y: 56 } },
  { kw: /a\s*pillar.*(right|우)/i, pos: { x: 62, y: 33 } },
  { kw: /a\s*pillar/i, pos: { x: 38, y: 33 } },
  { kw: /b\s*pillar.*(right|우)/i, pos: { x: 62, y: 48 } },
  { kw: /b\s*pillar/i, pos: { x: 38, y: 48 } },
  { kw: /c\s*pillar.*(right|우)/i, pos: { x: 62, y: 68 } },
  { kw: /c\s*pillar/i, pos: { x: 38, y: 68 } },
  { kw: /(wheel\s*house|wheelhouse).*(rear|뒤)/i, pos: { x: 15, y: 70 } },
  { kw: /(wheel\s*house|wheelhouse).*(right|우)/i, pos: { x: 85, y: 30 } },
  { kw: /wheel\s*house|wheelhouse/i, pos: { x: 15, y: 30 } },
  { kw: /inside\s*panel|inner/i, pos: { x: 30, y: 55 } },
  { kw: /package\s*tray/i, pos: { x: 50, y: 75 } },
  { kw: /rear\s*panel|back\s*panel/i, pos: { x: 50, y: 86 } },
];

function resolve(item: DamageItem): Pos | null {
  const name = item.partName ?? "";
  const map = item.group === "skin" ? SKIN_MAP : SKELETON_MAP;
  for (const m of map) if (m.kw.test(name)) return m.pos;
  return null;
}

function Panel({
  title, src, items, lang,
}: { title: string; src: string; items: DamageItem[]; lang: "ar" | "en" }) {
  const placed = items.map((it) => ({ it, pos: resolve(it) }));
  const unmapped = placed.filter((p) => !p.pos).map((p) => p.it);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{title}</div>
      <div className="relative mx-auto max-w-[240px]">
        <img src={src} alt={title} className="w-full h-auto select-none pointer-events-none opacity-90" />
        {placed.map(({ it, pos }, i) =>
          pos ? (
            <span
              key={i}
              title={`${it.partName ?? ""} — ${it.status ?? ""}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded-full text-[10px] font-black text-white shadow ${
                it.marker === "X" ? "bg-red-600" : "bg-amber-500"
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {it.marker}
            </span>
          ) : null,
        )}
        {items.length === 0 && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/90 text-white text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> {lang === "ar" ? "لا يوجد ضرر" : "No damage"}
            </span>
          </div>
        )}
      </div>
      {unmapped.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {unmapped.map((it, i) => (
            <span key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed text-[11px] font-semibold ${
                it.marker === "X" ? "border-red-400 text-red-600" : "border-amber-400 text-amber-600"
              }`}>
              {it.marker} · {it.partName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CarDamageDiagram({ items, lang }: { items: DamageItem[]; lang: "ar" | "en" }) {
  const skin = items.filter((i) => i.group === "skin");
  const skeleton = items.filter((i) => i.group !== "skin");

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Panel title={lang === "ar" ? "الهيكل الخارجي" : "Body Panels"} src={skinImg} items={skin} lang={lang} />
        <Panel title={lang === "ar" ? "الهيكل الإنشائي" : "Structural Frame"} src={skeletonImg} items={skeleton} lang={lang} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="grid place-items-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black">X</span>
          {lang === "ar" ? "تم الاستبدال" : "Replaced"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="grid place-items-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black">W</span>
          {lang === "ar" ? "تم الإصلاح" : "Repaired"}
        </span>
      </div>
    </div>
  );
}
