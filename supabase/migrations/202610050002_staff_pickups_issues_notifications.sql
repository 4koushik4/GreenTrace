-- One staff account reviews pickup requests and citizen issue reports.
-- Authentication credentials remain in Supabase Auth; no password is stored here.

CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  pickup_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS waste_type TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS pickup_date TIMESTAMPTZ;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'requested';
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Existing deployments may have a narrower status check constraint.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.pickups'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.pickups DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
UPDATE public.pickups SET status = 'requested' WHERE status IN ('pending', 'scheduled');
ALTER TABLE public.pickups ALTER COLUMN status SET DEFAULT 'requested';
ALTER TABLE public.pickups DROP CONSTRAINT IF EXISTS pickups_status_allowed;
ALTER TABLE public.pickups ADD CONSTRAINT pickups_status_allowed
  CHECK (status IN ('requested','accepted','rejected','scheduled','collected','missed','cancelled'));
CREATE INDEX IF NOT EXISTS pickups_user_created_idx ON public.pickups(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS pickups_status_date_idx ON public.pickups(status, pickup_date);
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pickups_user_read_own ON public.pickups;
CREATE POLICY pickups_user_read_own ON public.pickups FOR SELECT
  USING (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS pickups_user_create_own ON public.pickups;
CREATE POLICY pickups_user_create_own ON public.pickups FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text AND status = 'requested');
DROP POLICY IF EXISTS pickups_user_cancel_own ON public.pickups;
CREATE POLICY pickups_user_cancel_own ON public.pickups FOR UPDATE
  USING (auth.uid()::text = user_id::text AND status IN ('requested','scheduled'))
  WITH CHECK (auth.uid()::text = user_id::text AND status = 'cancelled');
DROP POLICY IF EXISTS pickups_staff_read_all ON public.pickups;
CREATE POLICY pickups_staff_read_all ON public.pickups FOR SELECT
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
DROP POLICY IF EXISTS pickups_staff_update_all ON public.pickups;
CREATE POLICY pickups_staff_update_all ON public.pickups FOR UPDATE
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
GRANT SELECT, INSERT, UPDATE ON public.pickups TO authenticated;

-- Citizens and the staff account use the same reports table.
ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;
UPDATE public.waste_reports SET status = 'pending' WHERE status = 'new';
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.waste_reports'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.waste_reports DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public.waste_reports DROP CONSTRAINT IF EXISTS waste_reports_category_allowed;
ALTER TABLE public.waste_reports ADD CONSTRAINT waste_reports_category_allowed
  CHECK (category IN ('illegal_dumping','overflowing_bin','missed_pickup','hazardous_waste','segregation_issue','blocked_drainage','broken_bin','other'));
DROP POLICY IF EXISTS waste_reports_staff_read_all ON public.waste_reports;
CREATE POLICY waste_reports_staff_read_all ON public.waste_reports FOR SELECT
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
DROP POLICY IF EXISTS waste_reports_staff_update_all ON public.waste_reports;
CREATE POLICY waste_reports_staff_update_all ON public.waste_reports FOR UPDATE
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
GRANT SELECT, INSERT, UPDATE ON public.waste_reports TO authenticated;
DROP POLICY IF EXISTS "waste_reports_insert_citizen" ON public.waste_reports;
CREATE POLICY waste_reports_insert_citizen ON public.waste_reports FOR INSERT
  WITH CHECK (auth.uid()::text = citizen_id::text AND status = 'pending');
DROP POLICY IF EXISTS "waste_reports_update_citizen_own" ON public.waste_reports;
CREATE POLICY waste_reports_update_citizen_own ON public.waste_reports FOR UPDATE
  USING (auth.uid()::text = citizen_id::text AND status = 'pending')
  WITH CHECK (auth.uid()::text = citizen_id::text AND status = 'pending');

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('user','staff')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_audience_created_idx
  ON public.notifications(audience, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_user_read_own ON public.notifications;
CREATE POLICY notifications_user_read_own ON public.notifications FOR SELECT
  USING (audience = 'user' AND recipient_id::text = auth.uid()::text);
DROP POLICY IF EXISTS notifications_staff_read ON public.notifications;
CREATE POLICY notifications_staff_read ON public.notifications FOR SELECT
  USING (audience = 'staff' AND lower(auth.jwt() ->> 'email') = 'staff@gt.com');
DROP POLICY IF EXISTS notifications_user_mark_own ON public.notifications;
CREATE POLICY notifications_user_mark_own ON public.notifications FOR UPDATE
  USING ((audience = 'user' AND recipient_id::text = auth.uid()::text) OR
         (audience = 'staff' AND lower(auth.jwt() ->> 'email') = 'staff@gt.com'))
  WITH CHECK ((audience = 'user' AND recipient_id::text = auth.uid()::text) OR
              (audience = 'staff' AND lower(auth.jwt() ->> 'email') = 'staff@gt.com'));
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_pickup_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(recipient_id,audience,title,message,entity_type,entity_id)
    VALUES (NULL,'staff','New pickup request',NEW.name || ' requested ' || NEW.waste_type || ' pickup.', 'pickup',NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(recipient_id,audience,title,message,entity_type,entity_id)
    VALUES (NEW.user_id,'user','Pickup status updated','Your pickup request is now ' || replace(NEW.status,'_',' ') || '.', 'pickup',NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pickups_notify_changes ON public.pickups;
CREATE TRIGGER pickups_notify_changes AFTER INSERT OR UPDATE ON public.pickups
  FOR EACH ROW EXECUTE FUNCTION public.notify_pickup_changes();

CREATE OR REPLACE FUNCTION public.notify_issue_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(recipient_id,audience,title,message,entity_type,entity_id)
    VALUES (NULL,'staff','New issue report',NEW.title || ' was reported.', 'issue',NEW.id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status OR NEW.resolution_notes IS DISTINCT FROM OLD.resolution_notes THEN
    INSERT INTO public.notifications(recipient_id,audience,title,message,entity_type,entity_id)
    VALUES (NEW.citizen_id,'user','Issue report updated','Your report is now ' || replace(NEW.status,'_',' ') || CASE WHEN NEW.resolution_notes IS NOT NULL THEN ': ' || NEW.resolution_notes ELSE '.' END, 'issue',NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS waste_reports_notify_changes ON public.waste_reports;
CREATE TRIGGER waste_reports_notify_changes AFTER INSERT OR UPDATE ON public.waste_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_issue_changes();

-- Make notifications live through Supabase Realtime when the standard publication exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pickups') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pickups;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'waste_reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_reports;
  END IF;
END $$;

-- Provision the single staff profile if its Supabase Auth account already exists.
INSERT INTO public.admin_users(user_id,email,full_name,role,is_active)
SELECT id,email,COALESCE(raw_user_meta_data->>'full_name','GreenTrace Staff'),'supervisor',TRUE
FROM auth.users WHERE lower(email) = 'staff@gt.com'
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, role = 'supervisor', is_active = TRUE;

CREATE OR REPLACE FUNCTION public.provision_greentrace_staff()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'staff@gt.com' THEN
    INSERT INTO public.admin_users(user_id,email,full_name,role,is_active)
    VALUES (NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name','GreenTrace Staff'),'supervisor',TRUE)
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, role = 'supervisor', is_active = TRUE;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS provision_greentrace_staff_account ON auth.users;
CREATE TRIGGER provision_greentrace_staff_account AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.provision_greentrace_staff();
