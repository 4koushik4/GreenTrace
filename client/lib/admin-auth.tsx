/**
 * Role-Based Authentication Library
 * Handles Super Admin, Admin, and Supervisor authentication
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";

// =====================================================
// Types
// =====================================================

export type AdminRole = "super_admin" | "admin" | "supervisor";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  phone?: string;
  avatar_url?: string;
  state_id?: string;
  city_id?: string;
  ward_id?: string;
  created_by?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  state_name?: string;
  city_name?: string;
  ward_name?: string;
}

export interface WasteReport {
  id: string;
  citizen_id: string;
  ward_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  citizen_name?: string;
  ward_name?: string;
}

export interface CollectionLog {
  id: string;
  supervisor_id: string;
  ward_id: string;
  collection_date: string;
  waste_type: string;
  quantity_kg: number;
  notes?: string;
  created_at: string;
}

export interface WardStats {
  id: string;
  ward_id: string;
  month: string;
  biodegradable_kg: number;
  recyclable_kg: number;
  hazardous_kg: number;
  total_kg: number;
  segregation_rate: number;
}

// =====================================================
// Admin Auth Context
// =====================================================

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isRole: (role: AdminRole) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wait for Supabase to restore its persisted session before restoring the
  // staff profile. Otherwise dashboard queries can run without a JWT.
  useEffect(() => {
    let active = true;
    const restoreAdminUser = async () => {
      const { data, error: sessionError } = await supabase?.auth.getSession() ?? {
        data: { session: null },
        error: null,
      };
      if (!active) return;

      if (sessionError) throw sessionError;

      const authUser = data.session?.user;
      if (!authUser || authUser.email?.toLowerCase() !== "staff@gt.com") {
        localStorage.removeItem("admin_user");
        setAdminUser(null);
        return;
      }

      const stored = localStorage.getItem("admin_user");
      const saved = stored ? JSON.parse(stored) as AdminUser : null;
      if (
        saved &&
        saved.user_id === authUser.id &&
        saved.email?.toLowerCase() === "staff@gt.com" &&
        saved.role === "supervisor" &&
        saved.is_active
      ) {
        setAdminUser(saved);
        return;
      }

      if (!supabase) throw new Error("Supabase is not configured");
      const { data: profile, error: profileError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (!active) return;
      if (profileError) throw profileError;
      if (
        !profile ||
        profile.email?.toLowerCase() !== "staff@gt.com" ||
        profile.role !== "supervisor" ||
        !profile.is_active
      ) {
        localStorage.removeItem("admin_user");
        setAdminUser(null);
        return;
      }

      const restoredUser = profile as AdminUser;
      localStorage.setItem("admin_user", JSON.stringify(restoredUser));
      setAdminUser(restoredUser);
    };

    const restoreSession = async () => {
      try {
        await restoreAdminUser();
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to restore staff session.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const { data: authListener } = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        setAdminUser(null);
        localStorage.removeItem("admin_user");
      }
    }) ?? { data: { subscription: null } };

    void restoreSession();
    return () => {
      active = false;
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      if (email.trim().toLowerCase() !== "staff@gt.com") {
        setError("Only the authorized staff account can sign in here.");
        return false;
      }
      if (!supabase) throw new Error("Supabase not configured");

      // Sign in via Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return false;
      }

      // Check admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        // Keep authentication independent of optional state/city/ward joins.
        // A relationship/schema error in those tables must not block staff login.
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (adminError || !adminData) {
        setError(`Unable to load the staff profile${adminError?.message ? `: ${adminError.message}` : "."}`);
        await supabase.auth.signOut();
        return false;
      }

      if (adminData.email?.toLowerCase() !== "staff@gt.com" || adminData.role !== "supervisor") {
        setError(`Staff profile is misconfigured (email: ${adminData.email || "missing"}, role: ${adminData.role || "missing"}); expected staff@gt.com with role supervisor.`);
        await supabase.auth.signOut();
        return false;
      }

      if (!adminData.is_active) {
        setError("Your account has been deactivated.");
        await supabase.auth.signOut();
        return false;
      }

      const user: AdminUser = {
        ...adminData,
      };

      setAdminUser(user);
      localStorage.setItem("admin_user", JSON.stringify(user));

      // Update last login
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminData.id);

      return true;
    } catch (err: any) {
      setError(err.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem("admin_user");
    supabase?.auth.signOut();
  };

  const isRole = (role: AdminRole) => adminUser?.role === role;

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, error, login, logout, isRole }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// =====================================================
// API Functions
// =====================================================

/** Fetch all admins (for super_admin) */
export async function fetchAdmins(): Promise<AdminUser[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("admin_users")
    .select(`*, state:states(name), city:cities(name), ward:wards(name, ward_number)`)
    .order("created_at", { ascending: false });

  return (data || []).map((d: any) => ({
    ...d,
    state_name: d.state?.name,
    city_name: d.city?.name,
    ward_name: d.ward?.name,
  }));
}

/** Fetch supervisors for a specific admin */
export async function fetchSupervisors(adminId: string): Promise<AdminUser[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("admin_users")
    .select(`*, state:states(name), city:cities(name), ward:wards(name, ward_number)`)
    .eq("role", "supervisor")
    .eq("created_by", adminId)
    .order("created_at", { ascending: false });

  return (data || []).map((d: any) => ({
    ...d,
    state_name: d.state?.name,
    city_name: d.city?.name,
    ward_name: d.ward?.name,
  }));
}

/** Create admin user (super_admin creates admin, admin creates supervisor) */
export async function createAdminUser(
  email: string,
  password: string,
  fullName: string,
  role: AdminRole,
  createdById: string,
  options: {
    phone?: string;
    state_id?: string;
    city_id?: string;
    ward_id?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  try {
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: "Failed to create user" };

    // Insert into admin_users
    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: authData.user.id,
      email,
      full_name: fullName,
      role,
      phone: options.phone,
      state_id: options.state_id,
      city_id: options.city_id,
      ward_id: options.ward_id,
      created_by: createdById,
      is_active: true,
    });

    if (insertError) return { success: false, error: insertError.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Fetch states */
export async function fetchStates() {
  if (!supabase) return [];
  const { data } = await supabase.from("states").select("*").order("name");
  return data || [];
}

/** Fetch cities by state */
export async function fetchCities(stateId?: string) {
  if (!supabase) return [];
  let q = supabase.from("cities").select("*").order("name");
  if (stateId) q = q.eq("state_id", stateId);
  const { data } = await q;
  return data || [];
}

/** Fetch wards by city */
export async function fetchWards(cityId?: string) {
  if (!supabase) return [];
  let q = supabase.from("wards").select("*").order("ward_number");
  if (cityId) q = q.eq("city_id", cityId);
  const { data } = await q;
  return data || [];
}

/** Fetch waste reports — filtered by role scope */
export async function fetchWasteReports(filters?: {
  ward_id?: string;
  city_id?: string;
  status?: string;
}): Promise<WasteReport[]> {
  if (!supabase) return [];

  let q = supabase
    .from("waste_reports")
    .select(`
      *,
      citizen:user_profiles!citizen_id(full_name),
      ward:wards(name, ward_number)
    `)
    .order("created_at", { ascending: false });

  if (filters?.ward_id) q = q.eq("ward_id", filters.ward_id);
  if (filters?.status) q = q.eq("status", filters.status);

  const { data } = await q;
  return (data || []).map((d: any) => ({
    ...d,
    citizen_name: d.citizen?.full_name || "Unknown",
    ward_name: d.ward ? `${d.ward.name} (${d.ward.ward_number})` : "N/A",
  }));
}

/** Update report status */
export async function updateReportStatus(
  reportId: string,
  status: string,
  notes?: string
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "resolved") updates.resolved_at = new Date().toISOString();
  if (notes) updates.resolution_notes = notes;
  const { error } = await supabase.from("waste_reports").update(updates).eq("id", reportId);
  if (error) throw error;
}

/** Log waste collection */
export async function logWasteCollection(log: {
  supervisor_id: string;
  ward_id: string;
  waste_type: string;
  quantity_kg: number;
  notes?: string;
}) {
  if (!supabase) return;
  await supabase.from("waste_collection_logs").insert(log);
}

/** Fetch collection logs */
export async function fetchCollectionLogs(wardId?: string): Promise<CollectionLog[]> {
  if (!supabase) return [];
  let q = supabase
    .from("waste_collection_logs")
    .select("*")
    .order("collection_date", { ascending: false });
  if (wardId) q = q.eq("ward_id", wardId);
  const { data } = await q;
  return data || [];
}

/** Fetch ward segregation stats */
export async function fetchWardStats(wardId?: string): Promise<WardStats[]> {
  if (!supabase) return [];
  let q = supabase
    .from("ward_segregation_stats")
    .select("*")
    .order("month", { ascending: false });
  if (wardId) q = q.eq("ward_id", wardId);
  const { data } = await q;
  return data || [];
}

/** Toggle admin active status */
export async function toggleAdminStatus(adminId: string, isActive: boolean) {
  if (!supabase) return;
  await supabase
    .from("admin_users")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", adminId);
}

/** Dashboard stats for admin / super admin */
export async function fetchDashboardStats(scope?: {
  city_id?: string;
  ward_id?: string;
}) {
  if (!supabase) return { totalReports: 0, pending: 0, resolved: 0, inProgress: 0, totalWaste: 0 };

  let rq = supabase.from("waste_reports").select("status", { count: "exact" });
  if (scope?.ward_id) rq = rq.eq("ward_id", scope.ward_id);

  const { data: reports } = await rq;

  const totalReports = reports?.length || 0;
  const pending = reports?.filter((r: any) => r.status === "pending").length || 0;
  const resolved = reports?.filter((r: any) => r.status === "resolved").length || 0;
  const inProgress = reports?.filter((r: any) => r.status === "in_progress").length || 0;

  let wq = supabase.from("waste_collection_logs").select("quantity_kg");
  if (scope?.ward_id) wq = wq.eq("ward_id", scope.ward_id);
  const { data: logs } = await wq;

  const totalWaste = logs?.reduce((s: number, l: any) => s + (l.quantity_kg || 0), 0) || 0;

  return { totalReports, pending, resolved, inProgress, totalWaste };
}
