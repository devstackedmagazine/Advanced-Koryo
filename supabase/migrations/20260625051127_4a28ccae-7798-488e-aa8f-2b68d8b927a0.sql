
-- 1) payments: allow authenticated users to insert their own payments
CREATE POLICY "Users insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2) custom_orders: allow authenticated users to delete their own orders
CREATE POLICY "Users delete own custom orders"
ON public.custom_orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3) Revoke direct EXECUTE on internal trigger functions (they run as triggers,
--    not via the API). has_role stays executable because RLS policies evaluate it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
