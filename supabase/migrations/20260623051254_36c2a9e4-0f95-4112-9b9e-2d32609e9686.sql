
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS body_type text,
  ADD COLUMN IF NOT EXISTS drive_type text,
  ADD COLUMN IF NOT EXISTS cylinders integer,
  ADD COLUMN IF NOT EXISTS interior_color text,
  ADD COLUMN IF NOT EXISTS exterior_color text,
  ADD COLUMN IF NOT EXISTS stock_number text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_platform text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS accident_history text,
  ADD COLUMN IF NOT EXISTS inspection_notes text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS options text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS est_shipping_sar numeric(14,2),
  ADD COLUMN IF NOT EXISTS est_export_sar numeric(14,2),
  ADD COLUMN IF NOT EXISTS inspection_fee_sar numeric(14,2),
  ADD COLUMN IF NOT EXISTS negotiation_fee_sar numeric(14,2),
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

DROP POLICY IF EXISTS "Vehicle images public read" ON storage.objects;
CREATE POLICY "Vehicle images public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Vehicle images admin write" ON storage.objects;
CREATE POLICY "Vehicle images admin write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vehicle images admin update" ON storage.objects;
CREATE POLICY "Vehicle images admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vehicle images admin delete" ON storage.objects;
CREATE POLICY "Vehicle images admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));
