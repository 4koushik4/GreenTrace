-- =====================================================
-- Role-Based Access Control Schema
-- Green India Smart Waste Management
-- =====================================================
-- Hierarchy: Super Admin > Admin > Supervisor > Citizen
-- =====================================================

-- =====================================================
-- States Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Cities / Municipalities Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    state_id UUID REFERENCES public.states(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, state_id)
);

-- =====================================================
-- Wards Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    ward_number TEXT NOT NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ward_number, city_id)
);

-- =====================================================
-- Admin Users Table (Super Admin, Admin, Supervisor)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'supervisor')),
    phone TEXT,
    avatar_url TEXT,

    -- Assignment scope
    state_id UUID REFERENCES public.states(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,

    -- Who created this admin
    created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Waste Issue Reports (from citizens)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.waste_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    citizen_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN (
        'illegal_dumping', 'overflowing_bin', 'missed_pickup',
        'hazardous_waste', 'segregation_issue', 'other'
    )),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    photo_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,

    -- Supervisor assignment
    assigned_to UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Waste Collection Logs (by supervisors)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.waste_collection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supervisor_id UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    waste_type TEXT CHECK (waste_type IN ('biodegradable', 'recyclable', 'hazardous', 'mixed')),
    quantity_kg DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Ward Segregation Stats (aggregated)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ward_segregation_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    biodegradable_kg DECIMAL(10, 2) DEFAULT 0,
    recyclable_kg DECIMAL(10, 2) DEFAULT 0,
    hazardous_kg DECIMAL(10, 2) DEFAULT 0,
    total_kg DECIMAL(10, 2) DEFAULT 0,
    segregation_rate DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ward_id, month)
);

-- =====================================================
-- Helper: function to get current user's admin role
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_state()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT state_id FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_city()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT city_id FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_ward()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT ward_id FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$;

-- =====================================================
-- Auto-update updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_waste_reports_updated_at
    BEFORE UPDATE ON public.waste_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_state ON public.admin_users(state_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_city ON public.admin_users(city_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_ward ON public.admin_users(ward_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON public.admin_users(created_by);
CREATE INDEX IF NOT EXISTS idx_waste_reports_citizen ON public.waste_reports(citizen_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_ward ON public.waste_reports(ward_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_status ON public.waste_reports(status);
CREATE INDEX IF NOT EXISTS idx_waste_reports_assigned ON public.waste_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collection_logs_supervisor ON public.waste_collection_logs(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_ward ON public.waste_collection_logs(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_stats_ward ON public.ward_segregation_stats(ward_id);
CREATE INDEX IF NOT EXISTS idx_cities_state ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_wards_city ON public.wards(city_id);


-- #############################################################################
--  ROW LEVEL SECURITY — ENABLE ON ALL TABLES
-- #############################################################################

ALTER TABLE public.states                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_collection_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_segregation_stats  ENABLE ROW LEVEL SECURITY;


-- #############################################################################
--  1.  STATES — Location lookup table
-- #############################################################################

-- SELECT: everyone (authenticated + anon) for dropdowns
CREATE POLICY "states_select_all"
    ON public.states FOR SELECT
    USING (true);

-- INSERT: only super_admin can add states
CREATE POLICY "states_insert_super_admin"
    ON public.states FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'super_admin'
    );

-- UPDATE: only super_admin
CREATE POLICY "states_update_super_admin"
    ON public.states FOR UPDATE
    USING  (public.get_my_admin_role() = 'super_admin')
    WITH CHECK (public.get_my_admin_role() = 'super_admin');

-- DELETE: only super_admin
CREATE POLICY "states_delete_super_admin"
    ON public.states FOR DELETE
    USING (public.get_my_admin_role() = 'super_admin');


-- #############################################################################
--  2.  CITIES — Location lookup table
-- #############################################################################

CREATE POLICY "cities_select_all"
    ON public.cities FOR SELECT
    USING (true);

-- INSERT: super_admin anywhere, admin only in their own state
CREATE POLICY "cities_insert_staff"
    ON public.cities FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'super_admin'
        OR (
            public.get_my_admin_role() = 'admin'
            AND state_id = public.get_my_admin_state()
        )
    );

CREATE POLICY "cities_update_staff"
    ON public.cities FOR UPDATE
    USING (
        public.get_my_admin_role() = 'super_admin'
        OR (
            public.get_my_admin_role() = 'admin'
            AND state_id = public.get_my_admin_state()
        )
    )
    WITH CHECK (
        public.get_my_admin_role() = 'super_admin'
        OR (
            public.get_my_admin_role() = 'admin'
            AND state_id = public.get_my_admin_state()
        )
    );

CREATE POLICY "cities_delete_super_admin"
    ON public.cities FOR DELETE
    USING (public.get_my_admin_role() = 'super_admin');


-- #############################################################################
--  3.  WARDS — Location lookup table
-- #############################################################################

CREATE POLICY "wards_select_all"
    ON public.wards FOR SELECT
    USING (true);

-- INSERT: super_admin anywhere, admin in their city
CREATE POLICY "wards_insert_staff"
    ON public.wards FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'super_admin'
        OR (
            public.get_my_admin_role() = 'admin'
            AND city_id = public.get_my_admin_city()
        )
    );

CREATE POLICY "wards_update_staff"
    ON public.wards FOR UPDATE
    USING (
        public.get_my_admin_role() = 'super_admin'
        OR (
            public.get_my_admin_role() = 'admin'
            AND city_id = public.get_my_admin_city()
        )
    )
    WITH CHECK (
        public.get_my_admin_role() = 'super_admin'
        OR (
            public.get_my_admin_role() = 'admin'
            AND city_id = public.get_my_admin_city()
        )
    );

CREATE POLICY "wards_delete_super_admin"
    ON public.wards FOR DELETE
    USING (public.get_my_admin_role() = 'super_admin');


-- #############################################################################
--  4.  ADMIN_USERS — Core role-based table
-- #############################################################################

-- ---- SELECT ----

-- 4a. Every admin can read their OWN record
CREATE POLICY "admin_users_select_own"
    ON public.admin_users FOR SELECT
    USING (auth.uid() = user_id);

-- 4b. Super admin can see EVERY admin user (full system view)
CREATE POLICY "admin_users_select_super_admin"
    ON public.admin_users FOR SELECT
    USING (public.get_my_admin_role() = 'super_admin');

-- 4c. Admin can see supervisors they directly created + admins in same city
CREATE POLICY "admin_users_select_admin"
    ON public.admin_users FOR SELECT
    USING (
        public.get_my_admin_role() = 'admin'
        AND (
            created_by = public.get_my_admin_id()          -- supervisors they created
            OR city_id  = public.get_my_admin_city()       -- colleagues in same city
        )
    );

-- 4d. Supervisor can see other supervisors in the same ward (team view)
CREATE POLICY "admin_users_select_supervisor_team"
    ON public.admin_users FOR SELECT
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- ---- INSERT ----

-- 4e. Super admin can create ANY admin user
CREATE POLICY "admin_users_insert_super_admin"
    ON public.admin_users FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'super_admin'
    );

-- 4f. Admin can create supervisors only (role = 'supervisor')
CREATE POLICY "admin_users_insert_admin"
    ON public.admin_users FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'admin'
        AND role = 'supervisor'
    );

-- ---- UPDATE ----

-- 4g. Admin users can update their OWN profile (avatar, phone, last_login)
CREATE POLICY "admin_users_update_own"
    ON public.admin_users FOR UPDATE
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4h. Super admin can update any admin user (activate/deactivate, reassign)
CREATE POLICY "admin_users_update_super_admin"
    ON public.admin_users FOR UPDATE
    USING  (public.get_my_admin_role() = 'super_admin')
    WITH CHECK (public.get_my_admin_role() = 'super_admin');

-- 4i. Admin can update supervisors they created
CREATE POLICY "admin_users_update_admin"
    ON public.admin_users FOR UPDATE
    USING (
        public.get_my_admin_role() = 'admin'
        AND created_by = public.get_my_admin_id()
        AND role = 'supervisor'
    )
    WITH CHECK (
        public.get_my_admin_role() = 'admin'
        AND role = 'supervisor'
    );

-- ---- DELETE ----

-- 4j. Super admin can delete any admin user
CREATE POLICY "admin_users_delete_super_admin"
    ON public.admin_users FOR DELETE
    USING (public.get_my_admin_role() = 'super_admin');

-- 4k. Admin can delete supervisors they created
CREATE POLICY "admin_users_delete_admin"
    ON public.admin_users FOR DELETE
    USING (
        public.get_my_admin_role() = 'admin'
        AND created_by = public.get_my_admin_id()
        AND role = 'supervisor'
    );


-- #############################################################################
--  5.  WASTE_REPORTS — Filed by citizens, managed by staff
-- #############################################################################

-- ---- SELECT ----

-- 5a. Citizen can see their own reports
CREATE POLICY "waste_reports_select_citizen_own"
    ON public.waste_reports FOR SELECT
    USING (auth.uid() = citizen_id);

-- 5b. Supervisor can see reports in their assigned ward
CREATE POLICY "waste_reports_select_supervisor_ward"
    ON public.waste_reports FOR SELECT
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- 5c. Admin can see reports in all wards of their city
CREATE POLICY "waste_reports_select_admin_city"
    ON public.waste_reports FOR SELECT
    USING (
        public.get_my_admin_role() = 'admin'
        AND ward_id IN (
            SELECT w.id FROM public.wards w
            WHERE w.city_id = public.get_my_admin_city()
        )
    );

-- 5d. Super admin can see ALL reports across the entire system
CREATE POLICY "waste_reports_select_super_admin_all"
    ON public.waste_reports FOR SELECT
    USING (public.get_my_admin_role() = 'super_admin');

-- ---- INSERT ----

-- 5e. Any authenticated user (citizen) can file a report
CREATE POLICY "waste_reports_insert_citizen"
    ON public.waste_reports FOR INSERT
    WITH CHECK (auth.uid() = citizen_id);

-- 5f. Staff can also file reports on behalf of citizens
CREATE POLICY "waste_reports_insert_staff"
    ON public.waste_reports FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() IN ('supervisor', 'admin', 'super_admin')
    );

-- ---- UPDATE ----

-- 5g. Citizen can update their OWN pending reports (edit before pickup)
CREATE POLICY "waste_reports_update_citizen_own"
    ON public.waste_reports FOR UPDATE
    USING (
        auth.uid() = citizen_id
        AND status = 'pending'
    )
    WITH CHECK (auth.uid() = citizen_id);

-- 5h. Supervisor can update reports in their ward (status, assignment, notes)
CREATE POLICY "waste_reports_update_supervisor"
    ON public.waste_reports FOR UPDATE
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    )
    WITH CHECK (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- 5i. Admin can update any report in their city
CREATE POLICY "waste_reports_update_admin"
    ON public.waste_reports FOR UPDATE
    USING (
        public.get_my_admin_role() = 'admin'
        AND ward_id IN (
            SELECT w.id FROM public.wards w
            WHERE w.city_id = public.get_my_admin_city()
        )
    )
    WITH CHECK (
        public.get_my_admin_role() = 'admin'
    );

-- 5j. Super admin can update any report
CREATE POLICY "waste_reports_update_super_admin"
    ON public.waste_reports FOR UPDATE
    USING  (public.get_my_admin_role() = 'super_admin')
    WITH CHECK (public.get_my_admin_role() = 'super_admin');

-- ---- DELETE ----

-- 5k. Citizen can delete their own pending report
CREATE POLICY "waste_reports_delete_citizen_own"
    ON public.waste_reports FOR DELETE
    USING (auth.uid() = citizen_id AND status = 'pending');

-- 5l. Admin / super admin can delete reports
CREATE POLICY "waste_reports_delete_admin"
    ON public.waste_reports FOR DELETE
    USING (public.get_my_admin_role() IN ('admin', 'super_admin'));


-- #############################################################################
--  6.  WASTE_COLLECTION_LOGS — Logged by supervisors after collection
-- #############################################################################

-- ---- SELECT ----

-- 6a. Supervisor can see logs for their own ward
CREATE POLICY "collection_logs_select_supervisor"
    ON public.waste_collection_logs FOR SELECT
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- 6b. Admin can see logs for all wards in their city
CREATE POLICY "collection_logs_select_admin"
    ON public.waste_collection_logs FOR SELECT
    USING (
        public.get_my_admin_role() = 'admin'
        AND ward_id IN (
            SELECT w.id FROM public.wards w
            WHERE w.city_id = public.get_my_admin_city()
        )
    );

-- 6c. Super admin can see all logs
CREATE POLICY "collection_logs_select_super_admin"
    ON public.waste_collection_logs FOR SELECT
    USING (public.get_my_admin_role() = 'super_admin');

-- ---- INSERT ----

-- 6d. Supervisor can log collection in their ward
CREATE POLICY "collection_logs_insert_supervisor"
    ON public.waste_collection_logs FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'supervisor'
        AND supervisor_id = public.get_my_admin_id()
        AND ward_id = public.get_my_admin_ward()
    );

-- 6e. Admin can log collection in any ward of their city
CREATE POLICY "collection_logs_insert_admin"
    ON public.waste_collection_logs FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'admin'
        AND ward_id IN (
            SELECT w.id FROM public.wards w
            WHERE w.city_id = public.get_my_admin_city()
        )
    );

-- 6f. Super admin can log collection anywhere
CREATE POLICY "collection_logs_insert_super_admin"
    ON public.waste_collection_logs FOR INSERT
    WITH CHECK (public.get_my_admin_role() = 'super_admin');

-- ---- UPDATE ----

-- 6g. Supervisor can update their own logs
CREATE POLICY "collection_logs_update_supervisor"
    ON public.waste_collection_logs FOR UPDATE
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND supervisor_id = public.get_my_admin_id()
    )
    WITH CHECK (
        public.get_my_admin_role() = 'supervisor'
        AND supervisor_id = public.get_my_admin_id()
    );

-- 6h. Admin / super admin can update any log
CREATE POLICY "collection_logs_update_admin"
    ON public.waste_collection_logs FOR UPDATE
    USING  (public.get_my_admin_role() IN ('admin', 'super_admin'))
    WITH CHECK (public.get_my_admin_role() IN ('admin', 'super_admin'));

-- ---- DELETE ----

-- 6i. Admin / super admin can delete logs
CREATE POLICY "collection_logs_delete_admin"
    ON public.waste_collection_logs FOR DELETE
    USING (public.get_my_admin_role() IN ('admin', 'super_admin'));


-- #############################################################################
--  7.  WARD_SEGREGATION_STATS — Aggregated monthly stats per ward
-- #############################################################################

-- ---- SELECT ----

-- 7a. Supervisor: own ward stats
CREATE POLICY "ward_stats_select_supervisor"
    ON public.ward_segregation_stats FOR SELECT
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- 7b. Admin: stats for wards in their city
CREATE POLICY "ward_stats_select_admin"
    ON public.ward_segregation_stats FOR SELECT
    USING (
        public.get_my_admin_role() = 'admin'
        AND ward_id IN (
            SELECT w.id FROM public.wards w
            WHERE w.city_id = public.get_my_admin_city()
        )
    );

-- 7c. Super admin: all stats
CREATE POLICY "ward_stats_select_super_admin"
    ON public.ward_segregation_stats FOR SELECT
    USING (public.get_my_admin_role() = 'super_admin');

-- ---- INSERT ----

-- 7d. Supervisor: insert stats for their ward
CREATE POLICY "ward_stats_insert_supervisor"
    ON public.ward_segregation_stats FOR INSERT
    WITH CHECK (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- 7e. Admin / super admin can insert any
CREATE POLICY "ward_stats_insert_admin"
    ON public.ward_segregation_stats FOR INSERT
    WITH CHECK (public.get_my_admin_role() IN ('admin', 'super_admin'));

-- ---- UPDATE ----

-- 7f. Supervisor: update their ward's stats
CREATE POLICY "ward_stats_update_supervisor"
    ON public.ward_segregation_stats FOR UPDATE
    USING (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    )
    WITH CHECK (
        public.get_my_admin_role() = 'supervisor'
        AND ward_id = public.get_my_admin_ward()
    );

-- 7g. Admin / super admin can update any stats
CREATE POLICY "ward_stats_update_admin"
    ON public.ward_segregation_stats FOR UPDATE
    USING  (public.get_my_admin_role() IN ('admin', 'super_admin'))
    WITH CHECK (public.get_my_admin_role() IN ('admin', 'super_admin'));

-- ---- DELETE ----

-- 7h. Super admin can delete stats
CREATE POLICY "ward_stats_delete_super_admin"
    ON public.ward_segregation_stats FOR DELETE
    USING (public.get_my_admin_role() = 'super_admin');


-- #############################################################################
--  8.  SERVICE ROLE BYPASS (for Developer / backend operations)
-- #############################################################################
--  Supabase service_role key always bypasses RLS. The developer portal
--  uses the anon key + signUp so it goes through RLS. To let the dev
--  portal create the FIRST super_admin (bootstrap), we allow inserting
--  into admin_users for any authenticated user if the table is empty.
-- #############################################################################

CREATE POLICY "admin_users_bootstrap_first_user"
    ON public.admin_users FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1)
    );


-- #############################################################################
--  9.  GRANT USAGE — Make sure authenticated users can call our helpers
-- #############################################################################

GRANT EXECUTE ON FUNCTION public.get_my_admin_role()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_id()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_city()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_ward()  TO authenticated;


-- #############################################################################
-- 10.  SEED DATA — States, Cities, Wards
-- #############################################################################
-- Run once. ON CONFLICT DO NOTHING keeps it safe to re-run.

INSERT INTO public.states (name, code) VALUES
    ('Karnataka',   'KA'),
    ('Maharashtra',  'MH'),
    ('Tamil Nadu',   'TN'),
    ('Kerala',       'KL'),
    ('Telangana',    'TG'),
    ('Gujarat',      'GJ'),
    ('Rajasthan',    'RJ'),
    ('Uttar Pradesh','UP'),
    ('West Bengal',  'WB'),
    ('Delhi',        'DL')
ON CONFLICT DO NOTHING;

INSERT INTO public.cities (name, state_id) VALUES
    ('Bengaluru',    (SELECT id FROM public.states WHERE code = 'KA')),
    ('Mysuru',       (SELECT id FROM public.states WHERE code = 'KA')),
    ('Mumbai',       (SELECT id FROM public.states WHERE code = 'MH')),
    ('Pune',         (SELECT id FROM public.states WHERE code = 'MH')),
    ('Chennai',      (SELECT id FROM public.states WHERE code = 'TN')),
    ('Coimbatore',   (SELECT id FROM public.states WHERE code = 'TN')),
    ('Kochi',        (SELECT id FROM public.states WHERE code = 'KL')),
    ('Hyderabad',    (SELECT id FROM public.states WHERE code = 'TG')),
    ('Ahmedabad',    (SELECT id FROM public.states WHERE code = 'GJ')),
    ('Jaipur',       (SELECT id FROM public.states WHERE code = 'RJ')),
    ('Lucknow',      (SELECT id FROM public.states WHERE code = 'UP')),
    ('Kolkata',      (SELECT id FROM public.states WHERE code = 'WB')),
    ('New Delhi',    (SELECT id FROM public.states WHERE code = 'DL'))
ON CONFLICT DO NOTHING;

INSERT INTO public.wards (name, ward_number, city_id) VALUES
    -- Bengaluru
    ('Koramangala',  'BLR-W01', (SELECT id FROM public.cities WHERE name = 'Bengaluru'  LIMIT 1)),
    ('Indiranagar',  'BLR-W02', (SELECT id FROM public.cities WHERE name = 'Bengaluru'  LIMIT 1)),
    ('HSR Layout',   'BLR-W03', (SELECT id FROM public.cities WHERE name = 'Bengaluru'  LIMIT 1)),
    ('Whitefield',   'BLR-W04', (SELECT id FROM public.cities WHERE name = 'Bengaluru'  LIMIT 1)),
    ('Jayanagar',    'BLR-W05', (SELECT id FROM public.cities WHERE name = 'Bengaluru'  LIMIT 1)),
    -- Mumbai
    ('Andheri',      'MUM-W01', (SELECT id FROM public.cities WHERE name = 'Mumbai'     LIMIT 1)),
    ('Bandra',       'MUM-W02', (SELECT id FROM public.cities WHERE name = 'Mumbai'     LIMIT 1)),
    ('Dadar',        'MUM-W03', (SELECT id FROM public.cities WHERE name = 'Mumbai'     LIMIT 1)),
    -- Chennai
    ('T Nagar',      'CHE-W01', (SELECT id FROM public.cities WHERE name = 'Chennai'    LIMIT 1)),
    ('Adyar',        'CHE-W02', (SELECT id FROM public.cities WHERE name = 'Chennai'    LIMIT 1)),
    ('Mylapore',     'CHE-W03', (SELECT id FROM public.cities WHERE name = 'Chennai'    LIMIT 1)),
    -- Hyderabad
    ('Banjara Hills','HYD-W01', (SELECT id FROM public.cities WHERE name = 'Hyderabad'  LIMIT 1)),
    ('Madhapur',     'HYD-W02', (SELECT id FROM public.cities WHERE name = 'Hyderabad'  LIMIT 1)),
    -- Kochi
    ('Fort Kochi',   'KOC-W01', (SELECT id FROM public.cities WHERE name = 'Kochi'      LIMIT 1)),
    ('Edappally',    'KOC-W02', (SELECT id FROM public.cities WHERE name = 'Kochi'      LIMIT 1)),
    -- Ahmedabad
    ('Navrangpura',  'AHM-W01', (SELECT id FROM public.cities WHERE name = 'Ahmedabad'  LIMIT 1)),
    ('Satellite',    'AHM-W02', (SELECT id FROM public.cities WHERE name = 'Ahmedabad'  LIMIT 1)),
    -- Pune
    ('Kothrud',      'PUN-W01', (SELECT id FROM public.cities WHERE name = 'Pune'       LIMIT 1)),
    ('Hinjewadi',    'PUN-W02', (SELECT id FROM public.cities WHERE name = 'Pune'       LIMIT 1))
ON CONFLICT DO NOTHING;


-- #############################################################################
-- DONE — Full RLS policy coverage for Green India RBAC
-- #############################################################################
--
--  Summary of policy count per table:
--  ┌───────────────────────────┬────────┬────────┬────────┬────────┐
--  │ Table                     │ SELECT │ INSERT │ UPDATE │ DELETE │
--  ├───────────────────────────┼────────┼────────┼────────┼────────┤
--  │ states                    │   1    │   1    │   1    │   1    │
--  │ cities                    │   1    │   1    │   1    │   1    │
--  │ wards                     │   1    │   1    │   1    │   1    │
--  │ admin_users               │   4    │   3    │   3    │   2    │
--  │ waste_reports             │   4    │   2    │   4    │   2    │
--  │ waste_collection_logs     │   3    │   3    │   2    │   1    │
--  │ ward_segregation_stats    │   3    │   2    │   2    │   1    │
--  └───────────────────────────┴────────┴────────┴────────┴────────┘
--  Total: 53 RLS policies
--
