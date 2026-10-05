-- Rebuild pickup and issue update policies for the citizen/staff model.
-- Policies compare direct row ownership or the staff JWT email and never
-- query admin_users, avoiding recursive RLS checks.
DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('pickups', 'waste_reports')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, policy_row.tablename);
  END LOOP;
END $$;

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
CREATE POLICY pickups_user_read_own ON public.pickups FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text);
CREATE POLICY pickups_user_create_own ON public.pickups FOR INSERT TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text AND status = 'requested');
CREATE POLICY pickups_user_cancel_own ON public.pickups FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text AND status = 'cancelled');
CREATE POLICY pickups_staff_read_all ON public.pickups FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
CREATE POLICY pickups_staff_update_all ON public.pickups FOR UPDATE TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
GRANT SELECT, INSERT, UPDATE ON public.pickups TO authenticated;

ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY waste_reports_citizen_read_own ON public.waste_reports FOR SELECT TO authenticated
  USING (citizen_id::text = auth.uid()::text);
CREATE POLICY waste_reports_citizen_insert_own ON public.waste_reports FOR INSERT TO authenticated
  WITH CHECK (citizen_id::text = auth.uid()::text AND status = 'pending');
CREATE POLICY waste_reports_citizen_update_own ON public.waste_reports FOR UPDATE TO authenticated
  USING (citizen_id::text = auth.uid()::text AND status = 'pending')
  WITH CHECK (citizen_id::text = auth.uid()::text AND status = 'pending');
CREATE POLICY waste_reports_staff_read_all ON public.waste_reports FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
CREATE POLICY waste_reports_staff_update_all ON public.waste_reports FOR UPDATE TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
GRANT SELECT, INSERT, UPDATE ON public.waste_reports TO authenticated;

-- The staff dashboard uses these four states. Replace a stale status check if
-- the deployed schema still has a narrower constraint.
DO $$
DECLARE constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.waste_reports'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.waste_reports DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;
ALTER TABLE public.waste_reports ADD CONSTRAINT waste_reports_status_allowed
  CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected'));


