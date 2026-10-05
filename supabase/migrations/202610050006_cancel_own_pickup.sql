-- Cancel a pickup through a narrowly scoped function so the caller only needs
-- to prove ownership; it cannot modify another user's pickup.
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
