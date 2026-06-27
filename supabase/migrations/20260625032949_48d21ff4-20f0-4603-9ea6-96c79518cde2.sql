
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_notes text,
  ADD COLUMN IF NOT EXISTS price_usd numeric,
  ADD COLUMN IF NOT EXISTS exchange_rate_krw_sar numeric,
  ADD COLUMN IF NOT EXISTS other_fees_sar numeric,
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS import_status text,
  ADD COLUMN IF NOT EXISTS raw_import_data jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_external_uniq
  ON public.vehicles (external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

DROP POLICY IF EXISTS "Public view available vehicles" ON public.vehicles;
CREATE POLICY "Public view available vehicles"
ON public.vehicles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (is_active = true AND status NOT IN ('hidden'::vehicle_status, 'draft'::vehicle_status))
);
