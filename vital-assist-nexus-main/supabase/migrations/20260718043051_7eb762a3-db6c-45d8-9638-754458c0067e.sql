
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('patient','hospital','ambulance','blood_bank','admin');
CREATE TYPE public.sos_status AS ENUM ('pending','accepted','dispatched','arriving','picked','reached','completed','cancelled');
CREATE TYPE public.priority_level AS ENUM ('critical','high','moderate','low');
CREATE TYPE public.appointment_status AS ENUM ('upcoming','completed','cancelled');

-- =========================================================
-- HELPERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  address text,
  dob date,
  gender text,
  blood_group text,
  height_cm numeric,
  weight_kg numeric,
  allergies text[] DEFAULT '{}',
  conditions text[] DEFAULT '{}',
  provider text DEFAULT 'email',
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read"   ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles self insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_roles self delete" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- =========================================================
-- USER SETTINGS
-- =========================================================
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system',
  language text DEFAULT 'en',
  notifications jsonb DEFAULT '{"email":true,"push":true,"sms":false,"appointments":true,"emergency":true}'::jsonb,
  sos_prefs jsonb DEFAULT '{"share_location":true,"auto_call_contact":true,"severity_default":"high"}'::jsonb,
  privacy jsonb DEFAULT '{"share_history_with_hospital":true}'::jsonb,
  email_prefs jsonb DEFAULT '{"marketing":false,"product":true}'::jsonb,
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings self all" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- EMERGENCY CONTACTS
-- =========================================================
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text,
  phone text NOT NULL,
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts self all" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contacts_user ON public.emergency_contacts(user_id);
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- MEDICAL RECORDS
-- =========================================================
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  title text NOT NULL,
  doctor text,
  hospital text,
  diagnosis text,
  prescription text,
  record_date date NOT NULL DEFAULT current_date,
  status text DEFAULT 'active',
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT ALL ON public.medical_records TO service_role;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "records self all" ON public.medical_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_records_user_date ON public.medical_records(user_id, record_date DESC);
CREATE TRIGGER trg_records_updated BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- APPOINTMENTS
-- =========================================================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  specialty text,
  hospital text,
  appt_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'upcoming',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt self all" ON public.appointments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_appt_user_date ON public.appointments(user_id, appt_at DESC);
CREATE TRIGGER trg_appt_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text DEFAULT 'system',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self all" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_notif_user_read ON public.notifications(user_id, read, created_at DESC);

-- =========================================================
-- SOS REQUESTS
-- =========================================================
CREATE TABLE public.sos_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority public.priority_level NOT NULL DEFAULT 'high',
  reason text,
  location_text text,
  lat numeric,
  lng numeric,
  status public.sos_status NOT NULL DEFAULT 'pending',
  hospital_name text,
  ambulance_code text,
  eta_min integer,
  distance_km numeric,
  timeline jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sos_requests TO authenticated;
GRANT ALL ON public.sos_requests TO service_role;
ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos self all" ON public.sos_requests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sos_user_created ON public.sos_requests(user_id, created_at DESC);
CREATE TRIGGER trg_sos_updated BEFORE UPDATE ON public.sos_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TRIAGE REPORTS
-- =========================================================
CREATE TABLE public.triage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms text[] NOT NULL DEFAULT '{}',
  vitals jsonb DEFAULT '{}'::jsonb,
  severity public.priority_level NOT NULL DEFAULT 'moderate',
  risk_score integer NOT NULL DEFAULT 0,
  department text,
  hospital_recommendation text,
  possible_conditions text[] DEFAULT '{}',
  ai_summary text,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.triage_reports TO authenticated;
GRANT ALL ON public.triage_reports TO service_role;
ALTER TABLE public.triage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "triage self all" ON public.triage_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_triage_user ON public.triage_reports(user_id, created_at DESC);

-- =========================================================
-- ACTIVITY LOGS
-- =========================================================
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs self read"   ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "logs self insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_logs_user ON public.activity_logs(user_id, created_at DESC);

-- =========================================================
-- HOSPITALS (public directory)
-- =========================================================
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  address text,
  phone text,
  icu_beds_free integer DEFAULT 0,
  icu_beds_total integer DEFAULT 0,
  general_beds_free integer DEFAULT 0,
  general_beds_total integer DEFAULT 0,
  doctors_on_duty integer DEFAULT 0,
  emergency_queue integer DEFAULT 0,
  rating numeric DEFAULT 4.5,
  specialties text[] DEFAULT '{}',
  lat numeric,
  lng numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hospitals TO anon, authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospitals public read" ON public.hospitals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "hospitals admin write" ON public.hospitals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hospital'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hospital'));

-- =========================================================
-- BLOOD BANKS (public directory)
-- =========================================================
CREATE TABLE public.blood_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  phone text,
  inventory jsonb DEFAULT '{}'::jsonb,
  critical_requests integer DEFAULT 0,
  lat numeric,
  lng numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blood_banks TO anon, authenticated;
GRANT ALL ON public.blood_banks TO service_role;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blood public read" ON public.blood_banks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "blood admin write" ON public.blood_banks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'blood_bank'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'blood_bank'));

-- =========================================================
-- BLOOD REQUESTS
-- =========================================================
CREATE TABLE public.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  blood_group text NOT NULL,
  units_needed integer NOT NULL DEFAULT 1,
  urgency public.priority_level NOT NULL DEFAULT 'high',
  hospital text,
  city text,
  contact_phone text,
  status text DEFAULT 'open',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_requests TO authenticated;
GRANT ALL ON public.blood_requests TO service_role;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blood_req read all"     ON public.blood_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "blood_req self insert"  ON public.blood_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blood_req self update"  ON public.blood_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blood_req self delete"  ON public.blood_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_blood_req_updated BEFORE UPDATE ON public.blood_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- AMBULANCE REQUESTS (owned by SOS creator, visible to ambulance operators)
-- =========================================================
CREATE TABLE public.ambulance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sos_id uuid REFERENCES public.sos_requests(id) ON DELETE SET NULL,
  patient_name text,
  pickup text,
  destination text,
  status text DEFAULT 'pending',
  assigned_ambulance text,
  eta_min integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambulance_requests TO authenticated;
GRANT ALL ON public.ambulance_requests TO service_role;
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amb self read" ON public.ambulance_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'ambulance') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "amb self insert" ON public.ambulance_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amb ops update"  ON public.ambulance_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'ambulance') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (true);
CREATE TRIGGER trg_amb_updated BEFORE UPDATE ON public.ambulance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- NEW USER BOOTSTRAP: profile + settings + default patient role
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, provider, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider','email'),
    now()
  ) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'patient'::public.app_role))
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, body, kind)
  VALUES (NEW.id, 'Welcome to MediRoute', 'Your account is ready. Complete your medical profile for faster emergency response.', 'system');

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
