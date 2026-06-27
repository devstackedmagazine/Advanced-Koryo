import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type LegalSection = { heading: string; body: string };
export type LegalPage = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar: LegalSection[];
  content_en: LegalSection[];
  text_color: string;
  heading_color: string;
  updated_at: string;
};

const slugSchema = z.object({ slug: z.enum(["terms", "privacy"]) });

export const getLegalPage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }): Promise<LegalPage | null> => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: row, error } = await sb
      .from("legal_pages")
      .select("id, slug, title_ar, title_en, content_ar, content_en, text_color, heading_color, updated_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    return (row as LegalPage | null) ?? null;
  });

export const getAllLegalPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LegalPage[]> => {
    const { data, error } = await context.supabase
      .from("legal_pages")
      .select("id, slug, title_ar, title_en, content_ar, content_en, text_color, heading_color, updated_at")
      .order("slug");
    if (error) throw error;
    return (data ?? []) as LegalPage[];
  });

const sectionSchema = z.object({ heading: z.string(), body: z.string() });
const upsertSchema = z.object({
  slug: z.enum(["terms", "privacy"]),
  title_ar: z.string(),
  title_en: z.string(),
  content_ar: z.array(sectionSchema),
  content_en: z.array(sectionSchema),
  text_color: z.string(),
  heading_color: z.string(),
});

export const adminUpsertLegalPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) throw new Error("Forbidden — admin only");
    const { error } = await context.supabase
      .from("legal_pages")
      .upsert(
        {
          slug: data.slug,
          title_ar: data.title_ar,
          title_en: data.title_en,
          content_ar: data.content_ar as never,
          content_en: data.content_en as never,
          text_color: data.text_color,
          heading_color: data.heading_color,
        } as never,
        { onConflict: "slug" },
      );
    if (error) throw error;
    return { ok: true };
  });
