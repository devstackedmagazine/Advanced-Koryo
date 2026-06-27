import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAllLegalPages, adminUpsertLegalPage, type LegalPage, type LegalSection } from "@/lib/legal.functions";

type Slug = "terms" | "privacy";

export function LegalTab() {
  const loadAll = useServerFn(getAllLegalPages);
  const upsert = useServerFn(adminUpsertLegalPage);
  const [pages, setPages] = useState<Record<Slug, LegalPage | null>>({ terms: null, privacy: null });
  const [slug, setSlug] = useState<Slug>("terms");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const rows = await loadAll();
    const map: Record<Slug, LegalPage | null> = { terms: null, privacy: null };
    for (const r of rows) if (r.slug === "terms" || r.slug === "privacy") map[r.slug as Slug] = r;
    setPages(map);
  }
  useEffect(() => { load(); }, []);

  const current = pages[slug];
  if (!current) return <div className="text-sm text-muted-foreground">Loading…</div>;

  function patch(p: Partial<LegalPage>) {
    setPages((prev) => ({ ...prev, [slug]: { ...(prev[slug] as LegalPage), ...p } }));
  }
  function setSection(lang: "ar" | "en", i: number, s: Partial<LegalSection>) {
    const key = lang === "ar" ? "content_ar" : "content_en";
    const list = [...(current![key] as LegalSection[])];
    list[i] = { ...list[i], ...s };
    patch({ [key]: list } as any);
  }
  function addSection(lang: "ar" | "en") {
    const key = lang === "ar" ? "content_ar" : "content_en";
    patch({ [key]: [...(current![key] as LegalSection[]), { heading: "", body: "" }] } as any);
  }
  function removeSection(lang: "ar" | "en", i: number) {
    const key = lang === "ar" ? "content_ar" : "content_en";
    const list = (current![key] as LegalSection[]).filter((_, x) => x !== i);
    patch({ [key]: list } as any);
  }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      await upsert({ data: {
        slug,
        title_ar: current!.title_ar,
        title_en: current!.title_en,
        content_ar: current!.content_ar,
        content_en: current!.content_en,
        text_color: current!.text_color,
        heading_color: current!.heading_color,
      } });
      setMsg("Saved.");
      await load();
    } catch (e: any) { setMsg(e.message); }
    finally { setSaving(false); }
  }

  const input = "w-full h-10 px-3 rounded-md border border-border bg-background text-sm";
  const ta = "w-full px-3 py-2 rounded-md border border-border bg-background text-sm";
  const label = "block text-xs font-bold text-muted-foreground mb-1";

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["terms", "privacy"] as Slug[]).map((s) => (
          <button key={s} onClick={() => setSlug(s)}
            className={`px-3 h-9 rounded-md text-xs font-bold border ${slug === s ? "bg-foreground text-background border-foreground" : "border-border"}`}>
            {s === "terms" ? "Terms of Use" : "Privacy Policy"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className={label}>Title (Arabic)</label>
          <input className={input} value={current.title_ar} onChange={(e) => patch({ title_ar: e.target.value })} dir="rtl" /></div>
        <div><label className={label}>Title (English)</label>
          <input className={input} value={current.title_en} onChange={(e) => patch({ title_en: e.target.value })} /></div>
        <div><label className={label}>Text color</label>
          <input type="color" className="h-10 w-20 rounded border border-border" value={current.text_color} onChange={(e) => patch({ text_color: e.target.value })} /></div>
        <div><label className={label}>Heading color</label>
          <input type="color" className="h-10 w-20 rounded border border-border" value={current.heading_color} onChange={(e) => patch({ heading_color: e.target.value })} /></div>
      </div>

      {(["ar", "en"] as const).map((lang) => {
        const sections = lang === "ar" ? current.content_ar : current.content_en;
        return (
          <div key={lang} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">{lang === "ar" ? "Content (Arabic)" : "Content (English)"}</h3>
              <button onClick={() => addSection(lang)} className="px-2.5 h-8 rounded-md border border-border text-xs font-bold">+ Add section</button>
            </div>
            {sections.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Section {i + 1}</span>
                  <button onClick={() => removeSection(lang, i)} className="text-xs text-destructive font-bold">Remove</button>
                </div>
                <input className={input} placeholder="Heading" value={s.heading} dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => setSection(lang, i, { heading: e.target.value })} />
                <textarea className={ta} placeholder="Body" rows={4} value={s.body} dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => setSection(lang, i, { body: e.target.value })} />
              </div>
            ))}
            {!sections.length && <p className="text-xs text-muted-foreground">No sections.</p>}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-4 h-10 rounded-md bg-foreground text-background text-sm font-bold disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
