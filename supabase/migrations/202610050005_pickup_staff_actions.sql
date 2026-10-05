-- Normalize legacy requests and ensure staff can set every pickup workflow status.
DO $$
DECLARE constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.pickups'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.pickups DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;

UPDATE public.pickups SET status = 'requested' WHERE status = 'pending';
ALTER TABLE public.pickups ALTER COLUMN status SET DEFAULT 'requested';
ALTER TABLE public.pickups ADD CONSTRAINT pickups_status_allowed
  CHECK (status IN ('requested','accepted','rejected','scheduled','collected','missed','cancelled'));

DROP POLICY IF EXISTS pickups_staff_update_all ON public.pickups;
CREATE POLICY pickups_staff_update_all ON public.pickups FOR UPDATE TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'staff@gt.com');
GRANT SELECT, UPDATE ON public.pickups TO authenticated;
