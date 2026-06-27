
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.vehicle_status AS ENUM ('available', 'reserved', 'sold', 'hidden');
CREATE TYPE public.fuel_type AS ENUM ('gasoline', 'diesel', 'hybrid', 'electric', 'lpg');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'approved', 'cancelled', 'refunded', 'completed');
CREATE TYPE public.custom_order_status AS ENUM ('submitted', 'reviewing', 'offered', 'accepted', 'rejected', 'cancelled', 'completed');
CREATE TYPE public.order_type AS ENUM ('deposit', 'service_fee', 'full_purchase', 'remaining_balance', 'custom_order');
CREATE TYPE public.order_status AS ENUM ('draft', 'pending_admin_approval', 'awaiting_payment', 'paid', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('initiated', 'pending', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE public.currency_code AS ENUM ('USD', 'SAR', 'KRW');
CREATE TYPE public.service_fee_code AS ENUM ('inspection', 'negotiation', 'transfer', 'customs_korea', 'replace_wheels', 'custom_sourcing');

-- =========================================
-- updated_at trigger helper
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  country TEXT,
  preferred_language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- VEHICLES
-- =========================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  year INT NOT NULL,
  mileage_km INT,
  fuel public.fuel_type,
  transmission TEXT,
  color TEXT,
  engine_cc INT,
  price_krw NUMERIC(14,2),
  price_sar NUMERIC(14,2),
  est_landed_sar NUMERIC(14,2),
  deposit_sar NUMERIC(14,2),
  korea_location TEXT,
  description TEXT,
  description_ar TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.vehicle_status NOT NULL DEFAULT 'available',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view available vehicles" ON public.vehicles FOR SELECT TO anon, authenticated USING (status <> 'hidden' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write vehicles" ON public.vehicles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- SERVICE FEES (admin-editable catalog)
-- =========================================
CREATE TABLE public.service_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.service_fee_code NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency public.currency_code NOT NULL DEFAULT 'USD',
  is_free BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_fees TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_fees TO authenticated;
GRANT ALL ON public.service_fees TO service_role;
ALTER TABLE public.service_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active service fees" ON public.service_fees FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write service fees" ON public.service_fees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_service_fees_updated BEFORE UPDATE ON public.service_fees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.service_fees (code, name, name_ar, amount, currency, is_free, sort_order) VALUES
  ('inspection',     'Inspection Fee',           'رسوم الفحص',              150, 'USD', false, 1),
  ('negotiation',    'Negotiation Fee',          'رسوم التفاوض',            100, 'USD', false, 2),
  ('transfer',       'Transfer Fee',             'رسوم النقل',              100, 'USD', true,  3),
  ('customs_korea',  'Customs from South Korea', 'الجمارك من كوريا الجنوبية', 50,  'USD', true,  4),
  ('replace_wheels', 'Replace Wheels (add-on)',  'تغيير العجلات (إضافة)',    0,   'USD', false, 5),
  ('custom_sourcing','Custom Sourcing / Order',  'طلب مخصص',                 0,   'USD', false, 6);

-- =========================================
-- ADMIN SETTINGS (key/value)
-- =========================================
CREATE TABLE public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.admin_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_admin_settings_updated BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.admin_settings (key, value, description) VALUES
  ('default_deposit_usd', '500'::jsonb, 'Default refundable reservation deposit (USD)'),
  ('default_deposit_sar', '1875'::jsonb, 'Default refundable reservation deposit (SAR)'),
  ('reservation_hold_hours', '72'::jsonb, 'How long a reservation holds a vehicle before auto-release'),
  ('default_currency', '"USD"'::jsonb, 'Default checkout currency');

-- =========================================
-- EXCHANGE RATES
-- =========================================
CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency public.currency_code NOT NULL,
  to_currency public.currency_code NOT NULL,
  rate NUMERIC(18,8) NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency, effective_at)
);
GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view rates" ON public.exchange_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write rates" ON public.exchange_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.exchange_rates (from_currency, to_currency, rate) VALUES
  ('USD','SAR',3.75), ('SAR','USD',0.2667),
  ('USD','KRW',1380), ('KRW','USD',0.000725),
  ('SAR','KRW',368), ('KRW','SAR',0.00272);

-- =========================================
-- CUSTOM ORDERS (sourcing requests)
-- =========================================
CREATE TABLE public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  make TEXT,
  model TEXT,
  year_from INT,
  year_to INT,
  budget_min NUMERIC(14,2),
  budget_max NUMERIC(14,2),
  currency public.currency_code NOT NULL DEFAULT 'SAR',
  notes TEXT,
  admin_offer JSONB,
  admin_notes TEXT,
  status public.custom_order_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_orders TO authenticated;
GRANT INSERT ON public.custom_orders TO anon;
GRANT ALL ON public.custom_orders TO service_role;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit custom order" ON public.custom_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view own custom orders" ON public.custom_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage custom orders" ON public.custom_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_custom_orders_updated BEFORE UPDATE ON public.custom_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- RESERVATIONS (refundable deposit on a vehicle)
-- =========================================
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  deposit_amount NUMERIC(12,2) NOT NULL,
  currency public.currency_code NOT NULL DEFAULT 'USD',
  refundable BOOLEAN NOT NULL DEFAULT true,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  hold_until TIMESTAMPTZ,
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reservations" ON public.reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own reservations" ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reservations" ON public.reservations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_vehicle ON public.reservations(vehicle_id);

-- =========================================
-- ORDERS (top-level payable units; gateway-agnostic)
-- =========================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  custom_order_id UUID REFERENCES public.custom_orders(id) ON DELETE SET NULL,
  order_type public.order_type NOT NULL,
  description TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount NUMERIC(14,2) NOT NULL,
  currency public.currency_code NOT NULL DEFAULT 'USD',
  status public.order_status NOT NULL DEFAULT 'draft',
  requires_admin_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_vehicle ON public.orders(vehicle_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- =========================================
-- PAYMENTS (gateway-agnostic ledger)
-- =========================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  payment_type public.order_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency public.currency_code NOT NULL,
  gateway TEXT NOT NULL, -- 'stripe', 'toss', 'moyasar', 'hyperpay', 'paytabs', 'tap', 'geidea', etc
  gateway_reference TEXT, -- session id / payment intent id / etc
  gateway_payload JSONB,
  checkout_url TEXT,
  status public.payment_status NOT NULL DEFAULT 'initiated',
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_gateway_ref ON public.payments(gateway, gateway_reference);

-- =========================================
-- REFUNDS
-- =========================================
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL,
  currency public.currency_code NOT NULL,
  reason TEXT,
  gateway_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'initiated',
  initiated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own refunds" ON public.refunds FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Admins manage refunds" ON public.refunds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- CONTACT MESSAGES
-- =========================================
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone send message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage messages" ON public.contact_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
