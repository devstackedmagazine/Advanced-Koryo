
CREATE POLICY "Admins read site-media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins upload site-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update site-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete site-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));
