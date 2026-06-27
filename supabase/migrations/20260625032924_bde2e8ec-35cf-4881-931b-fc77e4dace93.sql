
ALTER TYPE public.vehicle_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.vehicle_status ADD VALUE IF NOT EXISTS 'coming_soon';
ALTER TYPE public.vehicle_status ADD VALUE IF NOT EXISTS 'draft';
