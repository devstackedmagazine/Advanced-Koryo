
-- ACCESSORIES
CREATE TABLE public.accessories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  brand TEXT,
  category TEXT,
  description TEXT,
  description_ar TEXT,
  price_sar NUMERIC,
  images TEXT[] NOT NULL DEFAULT '{}',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.accessories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessories TO authenticated;
GRANT ALL ON public.accessories TO service_role;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accessories are viewable by everyone when active"
  ON public.accessories FOR SELECT
  USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage accessories"
  ON public.accessories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER accessories_set_updated_at
  BEFORE UPDATE ON public.accessories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SPARE PARTS
CREATE TABLE public.spare_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  part_number TEXT,
  brand TEXT,
  category TEXT,
  compatible_makes TEXT[] NOT NULL DEFAULT '{}',
  compatible_models TEXT[] NOT NULL DEFAULT '{}',
  year_from INTEGER,
  year_to INTEGER,
  description TEXT,
  description_ar TEXT,
  price_sar NUMERIC,
  images TEXT[] NOT NULL DEFAULT '{}',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  oem BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.spare_parts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spare_parts TO authenticated;
GRANT ALL ON public.spare_parts TO service_role;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Spare parts are viewable by everyone when active"
  ON public.spare_parts FOR SELECT
  USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage spare parts"
  ON public.spare_parts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER spare_parts_set_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Hero image default setting
INSERT INTO public.admin_settings (key, value, description)
VALUES ('homepage_hero', '{"image_url": null, "headline_ar": null, "headline_en": null}'::jsonb, 'Homepage hero image and optional headline overrides')
ON CONFLICT (key) DO NOTHING;
