ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'vehicle',
  ADD COLUMN IF NOT EXISTS auction_source text,
  ADD COLUMN IF NOT EXISTS auction_url text,
  ADD COLUMN IF NOT EXISTS auction_status text,
  ADD COLUMN IF NOT EXISTS current_bid_krw numeric,
  ADD COLUMN IF NOT EXISTS estimated_final_price_krw numeric,
  ADD COLUMN IF NOT EXISTS auction_end_at timestamptz;

CREATE INDEX IF NOT EXISTS vehicles_listing_type_status_idx
  ON public.vehicles (listing_type, status);