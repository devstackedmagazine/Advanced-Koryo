
-- 1) bank_accounts: restrict SELECT to admins or authenticated users with a payment
DROP POLICY IF EXISTS "Public view active bank accounts" ON public.bank_accounts;
CREATE POLICY "Customers with payments view active bank accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (active AND EXISTS (SELECT 1 FROM public.payments p WHERE p.user_id = auth.uid()))
);
REVOKE SELECT ON public.bank_accounts FROM anon;

-- 2) custom_orders: tighten INSERT WITH CHECK
DROP POLICY IF EXISTS "Anyone submit custom order" ON public.custom_orders;
CREATE POLICY "Anyone submit custom order"
ON public.custom_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(full_name) > 0
  AND length(phone) > 0
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
);

-- 3) vehicles: column-level revokes on internal cost/sourcing fields
REVOKE SELECT (admin_notes, inspection_notes, source_url, source_platform,
  est_shipping_sar, est_export_sar, est_landed_sar, deposit_sar, inspection_fee_sar)
ON public.vehicles FROM anon, authenticated;
-- Re-grant SELECT on the remaining columns (anon/authenticated already have table-level SELECT;
-- column-level revoke turns the existing table grant into per-column. Nothing else needed
-- because the original GRANT was "SELECT" without a column list, which Postgres expands.)

-- 4) Restrict EXECUTE on SECURITY DEFINER helpers (RLS policies still call them as the table owner)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
