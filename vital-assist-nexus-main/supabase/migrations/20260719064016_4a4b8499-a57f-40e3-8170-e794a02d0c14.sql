
-- 1. Harden handle_new_user: never trust client-supplied role; always default to patient.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, provider, last_login)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider','email'),
    now()
  ) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  -- SECURITY: always assign 'patient' at signup. Elevated roles must be granted by an admin.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.notifications (user_id, title, body, kind)
  VALUES (NEW.id, 'Welcome to MediRoute', 'Your account is ready. Complete your medical profile for faster emergency response.', 'system');

  RETURN NEW;
END; $$;

-- 2. Remove permissive self-insert/delete on user_roles.
DROP POLICY IF EXISTS "user_roles self insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles self delete" ON public.user_roles;

-- Admins can manage roles.
DROP POLICY IF EXISTS "user_roles admin manage" ON public.user_roles;
CREATE POLICY "user_roles admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Tighten blood_requests read access: hide PII from general authenticated users.
DROP POLICY IF EXISTS "blood_req read all" ON public.blood_requests;

-- Requester can see own rows.
DROP POLICY IF EXISTS "blood_req read own" ON public.blood_requests;
CREATE POLICY "blood_req read own" ON public.blood_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Privileged roles (admin, hospital, blood_bank) can see all rows including PII.
DROP POLICY IF EXISTS "blood_req read privileged" ON public.blood_requests;
CREATE POLICY "blood_req read privileged" ON public.blood_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hospital')
    OR public.has_role(auth.uid(), 'blood_bank')
  );
