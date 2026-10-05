-- Keep the legacy profile table for the single staff profile, but remove
-- policies that query admin_users from its own RLS policy expressions.
DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', policy_row.policyname);
  END LOOP;
END $$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Staff can read and update only their own profile. The checks compare the
-- authenticated UID directly and never query admin_users recursively.
CREATE POLICY staff_profile_read_own ON public.admin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY staff_profile_update_own ON public.admin_users
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, UPDATE ON public.admin_users TO authenticated;
