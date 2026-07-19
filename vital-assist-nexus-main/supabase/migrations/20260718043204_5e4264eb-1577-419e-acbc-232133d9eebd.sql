
-- Medical records (private): files stored under `<user_id>/...`
CREATE POLICY "med_read_own"   ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "med_write_own"  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "med_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "med_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-records' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars (public read, self write): files stored under `<user_id>/...`
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_write_own"   ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update_own"  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete_own"  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
