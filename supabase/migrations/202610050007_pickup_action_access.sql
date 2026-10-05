ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pickups_user_cancel_own ON public.pickups;
CREATE POLICY pickups_user_cancel_own ON public.pickups FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text AND status IN ('requested', 'scheduled'))
  WITH CHECK (user_id::text = auth.uid()::text AND status = 'cancelled');

DROP POLICY IF EXISTS pickups_staff_read_all ON public.pickups;
CREATE POLICY pickups_staff_read_all ON public.pickups FOR SELECT TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com');

DROP POLICY IF EXISTS pickups_staff_update_all ON public.pickups;
CREATE POLICY pickups_staff_update_all ON public.pickups FOR UPDATE TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'staff@gt.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'staff@gt.com');

GRANT SELECT, UPDATE ON public.pickups TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_own_pickup(p_pickup_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cancelled_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a pickup.' USING ERRCODE = '28000';
  END IF;

  UPDATE public.pickups
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_pickup_id
    AND user_id::text = auth.uid()::text
    AND status IN ('requested', 'scheduled')
  RETURNING id INTO cancelled_id;

  RETURN cancelled_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_own_pickup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_own_pickup(uuid) TO authenticated;
