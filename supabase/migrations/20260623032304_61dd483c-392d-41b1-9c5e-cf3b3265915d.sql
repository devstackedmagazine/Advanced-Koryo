
-- Fix search_path on trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke public execute on SECURITY DEFINER helpers (only triggers + RLS should call)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Replace permissive INSERT policies with field-validated ones
DROP POLICY IF EXISTS "Anyone submit custom order" ON public.custom_orders;
CREATE POLICY "Anyone submit custom order" ON public.custom_orders FOR INSERT TO anon, authenticated
  WITH CHECK (length(full_name) > 0 AND length(phone) > 0);

DROP POLICY IF EXISTS "Anyone send message" ON public.contact_messages;
CREATE POLICY "Anyone send message" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) > 0 AND length(message) > 0);
