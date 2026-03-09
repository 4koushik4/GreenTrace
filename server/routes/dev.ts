/**
 * Developer API Routes
 * All operations use Supabase service_role key → bypasses RLS entirely.
 * Every request must include a valid dev token in x-dev-token header.
 */
import { Router, Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const router = Router();

// =====================================================
// Helpers
// =====================================================

function getServiceClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getAnonClient(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Middleware: verify dev session token */
function devAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-dev-token"] as string;
  if (!token) {
    return res.status(401).json({ error: "Dev token required" });
  }
  try {
    const decoded = Buffer.from(token, "base64").toString();
    if (!decoded.startsWith("INDIA:")) {
      return res.status(403).json({ error: "Invalid dev token" });
    }
    next();
  } catch {
    return res.status(403).json({ error: "Invalid dev token" });
  }
}

// Apply auth middleware to all dev routes
router.use(devAuth);

// =====================================================
// Helper: get the best Supabase client (service > anon)
// =====================================================
function getClient(): SupabaseClient {
  const svc = getServiceClient();
  if (svc) return svc;
  const anon = getAnonClient();
  if (anon) return anon;
  throw new Error("Supabase not configured — set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
}

// =====================================================
// GET /api/dev/data — Fetch all data in one call
// =====================================================
router.get("/data", async (_req: Request, res: Response) => {
  try {
    const db = getClient();

    const [statesRes, citiesRes, wardsRes, usersRes] = await Promise.all([
      db.from("states").select("*").order("name"),
      db.from("cities").select("*").order("name"),
      db.from("wards").select("*").order("ward_number"),
      db
        .from("admin_users")
        .select(`*, state:states(name, code), city:cities(name), ward:wards(name, ward_number)`)
        .order("created_at", { ascending: false }),
    ]);

    res.json({
      states: statesRes.data || [],
      cities: citiesRes.data || [],
      wards: wardsRes.data || [],
      users: (usersRes.data || []).map((u: any) => ({
        ...u,
        state_name: u.state?.name,
        state_code: u.state?.code,
        city_name: u.city?.name,
        ward_name: u.ward ? `${u.ward.name} (${u.ward.ward_number})` : undefined,
      })),
    });
  } catch (err: any) {
    console.error("[Dev API] data fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// POST /api/dev/states — Create state
// =====================================================
router.post("/states", async (req: Request, res: Response) => {
  try {
    const db = getClient();
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: "name and code required" });

    const { data, error } = await db.from("states").insert({ name, code: code.toUpperCase() }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// POST /api/dev/cities — Create city
// =====================================================
router.post("/cities", async (req: Request, res: Response) => {
  try {
    const db = getClient();
    const { name, state_id } = req.body;
    if (!name || !state_id) return res.status(400).json({ error: "name and state_id required" });

    const { data, error } = await db.from("cities").insert({ name, state_id }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// POST /api/dev/wards — Create ward
// =====================================================
router.post("/wards", async (req: Request, res: Response) => {
  try {
    const db = getClient();
    const { name, ward_number, city_id } = req.body;
    if (!name || !ward_number || !city_id)
      return res.status(400).json({ error: "name, ward_number, and city_id required" });

    const { data, error } = await db.from("wards").insert({ name, ward_number, city_id }).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// POST /api/dev/admin-users — Create admin user
// =====================================================
router.post("/admin-users", async (req: Request, res: Response) => {
  try {
    const db = getClient();
    const { email, password, full_name, role, phone, state_id, city_id, ward_id } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: "email, password, full_name, and role are required" });
    }

    // Step 1: Create Supabase auth user using admin API (service role)
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so they can login immediately
      user_metadata: { full_name, role },
    });

    if (authError) {
      // If service role doesn't support admin.createUser, fall back to signUp
      const anonClient = getAnonClient();
      if (!anonClient) throw authError;

      const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
        email,
        password,
        options: { data: { full_name, role } },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create auth user");

      // Insert into admin_users with service role client (bypasses RLS)
      const { error: insertError } = await db.from("admin_users").insert({
        user_id: signUpData.user.id,
        email,
        full_name,
        role,
        phone: phone || null,
        state_id: state_id || null,
        city_id: city_id || null,
        ward_id: ward_id || null,
        is_active: true,
        created_by: null,
      });
      if (insertError) throw insertError;

      return res.json({ success: true, user_id: signUpData.user.id });
    }

    if (!authData.user) throw new Error("Failed to create auth user");

    // Insert into admin_users
    const { error: insertError } = await db.from("admin_users").insert({
      user_id: authData.user.id,
      email,
      full_name,
      role,
      phone: phone || null,
      state_id: state_id || null,
      city_id: city_id || null,
      ward_id: ward_id || null,
      is_active: true,
      created_by: null,
    });
    if (insertError) throw insertError;

    res.json({ success: true, user_id: authData.user.id });
  } catch (err: any) {
    console.error("[Dev API] create user error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// PATCH /api/dev/admin-users/:id/toggle — Toggle active status
// =====================================================
router.patch("/admin-users/:id/toggle", async (req: Request, res: Response) => {
  try {
    const db = getClient();
    const { id } = req.params;
    const { is_active } = req.body;

    const { error } = await db
      .from("admin_users")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// DELETE /api/dev/admin-users/:id — Delete admin user
// =====================================================
router.delete("/admin-users/:id", async (req: Request, res: Response) => {
  try {
    const db = getClient();
    const { id } = req.params;

    // Get user_id first so we can also delete from auth
    const { data: adminUser } = await db
      .from("admin_users")
      .select("user_id")
      .eq("id", id)
      .single();

    // Delete from admin_users
    const { error } = await db.from("admin_users").delete().eq("id", id);
    if (error) throw error;

    // Also try to delete from Supabase auth (best effort)
    if (adminUser?.user_id) {
      try {
        await db.auth.admin.deleteUser(adminUser.user_id);
      } catch {
        // Non-critical — admin_users row is already deleted
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
