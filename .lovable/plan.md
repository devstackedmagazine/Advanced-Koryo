## Add Terms & Privacy pages with admin editor

### New routes
- `src/routes/terms.tsx` — Terms of Use page
- `src/routes/privacy.tsx` — Privacy Policy page

Both use the existing `PageLayout` + Tailwind tokens (white bg, `prose`-style typography matching the rest of the site), RTL via the existing `lang` context. They load content from the `legal_pages` table by slug (`terms` / `privacy`) and render: title, "Last updated" date, and the section list. Inline styles only for the two color tokens (text color, heading color).

### Database
Add one migration creating `public.legal_pages`:
- `id uuid pk`, `slug text unique` (`terms` | `privacy`)
- `title_ar`, `title_en`, `content_ar` (jsonb array of `{heading, body}` sections), `content_en` (same shape)
- `text_color text default '#111111'`, `heading_color text default '#000000'`
- `created_at`, `updated_at` + `set_updated_at` trigger
- GRANT `SELECT` to `anon, authenticated`; full to `service_role`
- RLS: public SELECT; INSERT/UPDATE only for `has_role(auth.uid(),'admin')`
- Seed two rows with simple placeholder Arabic/English content

### Server functions
Add `src/lib/legal.functions.ts`:
- `getLegalPage({ slug })` — public read using server publishable client
- `adminUpsertLegalPage({...})` — protected by `requireSupabaseAuth` + admin check, updates row

Routes use loader + `useSuspenseQuery` per project conventions (with `errorComponent` / `notFoundComponent`).

### Navigation
Minimal edit to `src/components/site/Header.tsx`: append two items to the existing Company group (both AR and EN labels via inline conditional). No other header changes.

### Admin editor
Add new tab `"legal"` to existing `src/routes/admin.tsx` TABS array, and a small `LegalTab` component (inline in admin.tsx or new `src/components/admin/LegalTab.tsx`) with:
- Slug selector (terms / privacy)
- Text inputs for `title_ar`, `title_en`
- `text_color` / `heading_color` via `<input type="color">`
- Repeater of sections: each with `heading` + `body` textareas (AR and EN), add/remove buttons
- Save button calling `adminUpsertLegalPage`

Uses existing button/input styles only — no new packages, no rich text editor.

### Files modified/created
- NEW: `src/routes/terms.tsx`, `src/routes/privacy.tsx`
- NEW: `src/lib/legal.functions.ts`
- NEW: `src/components/admin/LegalTab.tsx`
- NEW: migration for `legal_pages`
- EDIT: `src/components/site/Header.tsx` (2 lines in Company group)
- EDIT: `src/routes/admin.tsx` (add tab entry + render LegalTab)

No other files touched.