
-- Enable realtime + REPLICA IDENTITY on core tables (idempotent)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['notifications','sos_requests','ambulance_requests','appointments','medical_records','emergency_contacts','blood_requests','triage_reports','hospitals','blood_banks']) LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Optional insurance/extra profile fields as JSON on profiles (avoid schema churn)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS insurance jsonb;

-- Allow authenticated users to read hospitals & blood_banks list (public directory-style data)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hospitals' AND policyname='hospitals_read_all') THEN
    CREATE POLICY hospitals_read_all ON public.hospitals FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blood_banks' AND policyname='blood_banks_read_all') THEN
    CREATE POLICY blood_banks_read_all ON public.blood_banks FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
