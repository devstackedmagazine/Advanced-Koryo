
CREATE POLICY "Users upload own proof files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own proof files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Admins manage all proof files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete proof files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
