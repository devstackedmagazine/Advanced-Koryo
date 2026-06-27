
-- Create private schema for internal helpers not exposed via the API
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

-- Recreate has_role in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Recreate every policy that referenced public.has_role, using private.has_role

-- public.user_roles
DROP POLICY "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.vehicles
DROP POLICY "Admins write vehicles" ON public.vehicles;
CREATE POLICY "Admins write vehicles" ON public.vehicles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Public view available vehicles" ON public.vehicles;
CREATE POLICY "Public view available vehicles" ON public.vehicles FOR SELECT TO public
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR ((is_active = true) AND (status <> ALL (ARRAY['hidden'::vehicle_status, 'draft'::vehicle_status]))));

-- public.service_fees
DROP POLICY "Public view active service fees" ON public.service_fees;
CREATE POLICY "Public view active service fees" ON public.service_fees FOR SELECT TO anon, authenticated
  USING (active OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins write service fees" ON public.service_fees;
CREATE POLICY "Admins write service fees" ON public.service_fees FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.admin_settings
DROP POLICY "Admins manage settings" ON public.admin_settings;
CREATE POLICY "Admins manage settings" ON public.admin_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.exchange_rates
DROP POLICY "Admins write rates" ON public.exchange_rates;
CREATE POLICY "Admins write rates" ON public.exchange_rates FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.custom_orders
DROP POLICY "Users view own custom orders" ON public.custom_orders;
CREATE POLICY "Users view own custom orders" ON public.custom_orders FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins manage custom orders" ON public.custom_orders;
CREATE POLICY "Admins manage custom orders" ON public.custom_orders FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.reservations
DROP POLICY "Users view own reservations" ON public.reservations;
CREATE POLICY "Users view own reservations" ON public.reservations FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins manage reservations" ON public.reservations;
CREATE POLICY "Admins manage reservations" ON public.reservations FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.orders
DROP POLICY "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.payments
DROP POLICY "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.refunds
DROP POLICY "Users view own refunds" ON public.refunds;
CREATE POLICY "Users view own refunds" ON public.refunds FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = refunds.payment_id AND (p.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))));
DROP POLICY "Admins manage refunds" ON public.refunds;
CREATE POLICY "Admins manage refunds" ON public.refunds FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.contact_messages
DROP POLICY "Admins manage messages" ON public.contact_messages;
CREATE POLICY "Admins manage messages" ON public.contact_messages FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.spare_parts
DROP POLICY "Admins manage spare parts" ON public.spare_parts;
CREATE POLICY "Admins manage spare parts" ON public.spare_parts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Spare parts are viewable by everyone when active" ON public.spare_parts;
CREATE POLICY "Spare parts are viewable by everyone when active" ON public.spare_parts FOR SELECT TO public
  USING ((active = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.bank_accounts
DROP POLICY "Admins manage bank accounts" ON public.bank_accounts;
CREATE POLICY "Admins manage bank accounts" ON public.bank_accounts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Customers with payments view active bank accounts" ON public.bank_accounts;
CREATE POLICY "Customers with payments view active bank accounts" ON public.bank_accounts FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR (active AND EXISTS (SELECT 1 FROM public.payments p WHERE p.user_id = auth.uid())));

-- public.payment_proofs
DROP POLICY "Users view own proofs" ON public.payment_proofs;
CREATE POLICY "Users view own proofs" ON public.payment_proofs FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins manage proofs" ON public.payment_proofs;
CREATE POLICY "Admins manage proofs" ON public.payment_proofs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.accessories
DROP POLICY "Accessories are viewable by everyone when active" ON public.accessories;
CREATE POLICY "Accessories are viewable by everyone when active" ON public.accessories FOR SELECT TO public
  USING ((active = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins manage accessories" ON public.accessories;
CREATE POLICY "Admins manage accessories" ON public.accessories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- public.legal_pages
DROP POLICY "Admins can insert legal pages" ON public.legal_pages;
CREATE POLICY "Admins can insert legal pages" ON public.legal_pages FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins can update legal pages" ON public.legal_pages;
CREATE POLICY "Admins can update legal pages" ON public.legal_pages FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins can delete legal pages" ON public.legal_pages;
CREATE POLICY "Admins can delete legal pages" ON public.legal_pages FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- storage.objects
DROP POLICY "Admins read site-media" ON storage.objects;
CREATE POLICY "Admins read site-media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Users read own proof files" ON storage.objects;
CREATE POLICY "Users read own proof files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR private.has_role(auth.uid(), 'admin'::public.app_role)));
DROP POLICY "Admins manage all proof files" ON storage.objects;
CREATE POLICY "Admins manage all proof files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins delete proof files" ON storage.objects;
CREATE POLICY "Admins delete proof files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins upload site-media" ON storage.objects;
CREATE POLICY "Admins upload site-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins update site-media" ON storage.objects;
CREATE POLICY "Admins update site-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'site-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Admins delete site-media" ON storage.objects;
CREATE POLICY "Admins delete site-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Vehicle images admin write" ON storage.objects;
CREATE POLICY "Vehicle images admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Vehicle images admin update" ON storage.objects;
CREATE POLICY "Vehicle images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'vehicle-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY "Vehicle images admin delete" ON storage.objects;
CREATE POLICY "Vehicle images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop the public has_role function entirely so it's no longer callable via the API
DROP FUNCTION public.has_role(uuid, public.app_role);
