/**
 * Developer Dashboard — God Mode
 * Full CRUD for all admin roles, state-wise user listing, system overview.
 * Only accessible after logging in with INDIA/BHARAT credentials.
 */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  LogOut,
  Terminal,
  MapPin,
  Building,
  Landmark,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Globe,
  Activity,
} from "lucide-react";
import type { AdminRole, AdminUser } from "@/lib/admin-auth";

// =====================================================
// API helper — all calls go through Express server
// which uses the service_role key to bypass RLS.
// =====================================================

function getDevToken(): string {
  try {
    const s = localStorage.getItem("dev_session");
    return s ? JSON.parse(s).token : "";
  } catch {
    return "";
  }
}

async function devFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/api/dev${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-dev-token": getDevToken(),
      ...(opts.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// =====================================================
// Types
// =====================================================

interface DevSession {
  role: string;
  username: string;
  loginTime: string;
  token: string;
}

interface State {
  id: string;
  name: string;
  code: string;
}

interface City {
  id: string;
  name: string;
  state_id: string;
}

interface Ward {
  id: string;
  name: string;
  ward_number: string;
  city_id: string;
}

// =====================================================
// Main Component
// =====================================================

export default function DevDashboard() {
  const navigate = useNavigate();
  const [devSession, setDevSession] = useState<DevSession | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "create" | "locations">("overview");

  // Data
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search / filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Tree expand state
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // Create form
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "admin" as AdminRole,
    stateId: "",
    cityId: "",
    wardId: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Location create
  const [locationForm, setLocationForm] = useState({
    type: "state" as "state" | "city" | "ward",
    name: "",
    code: "",
    stateId: "",
    cityId: "",
    wardNumber: "",
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check dev session on mount
  useEffect(() => {
    const stored = localStorage.getItem("dev_session");
    if (!stored) {
      navigate("/dev/login");
      return;
    }
    try {
      const session = JSON.parse(stored);
      if (session.role !== "developer") {
        navigate("/dev/login");
        return;
      }
      setDevSession(session);
    } catch {
      navigate("/dev/login");
    }
  }, [navigate]);

  // Load all data via server API (bypasses RLS)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await devFetch("/data");
      setStates(data.states || []);
      setCities(data.cities || []);
      setWards(data.wards || []);
      setAllUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (devSession) loadData();
  }, [devSession, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("dev_session");
    navigate("/dev/login");
  };

  // =====================================================
  // Create User
  // =====================================================

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage(null);

    try {
      await devFetch("/admin-users", {
        method: "POST",
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          full_name: createForm.fullName,
          role: createForm.role,
          phone: createForm.phone || null,
          state_id: createForm.stateId || null,
          city_id: createForm.cityId || null,
          ward_id: createForm.wardId || null,
        }),
      });

      setCreateMessage({ type: "success", text: `${createForm.role.replace("_", " ").toUpperCase()} "${createForm.fullName}" created successfully!` });
      setCreateForm({ email: "", password: "", fullName: "", phone: "", role: "admin", stateId: "", cityId: "", wardId: "" });
      await loadData();
    } catch (err: any) {
      setCreateMessage({ type: "error", text: err.message || "Failed to create user" });
    } finally {
      setCreateLoading(false);
    }
  };

  // =====================================================
  // Create Location (State / City / Ward)
  // =====================================================

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationLoading(true);
    setLocationMessage(null);

    try {
      if (locationForm.type === "state") {
        await devFetch("/states", {
          method: "POST",
          body: JSON.stringify({ name: locationForm.name, code: locationForm.code.toUpperCase() }),
        });
        setLocationMessage({ type: "success", text: `State "${locationForm.name}" created!` });
      } else if (locationForm.type === "city") {
        if (!locationForm.stateId) throw new Error("Select a state");
        await devFetch("/cities", {
          method: "POST",
          body: JSON.stringify({ name: locationForm.name, state_id: locationForm.stateId }),
        });
        setLocationMessage({ type: "success", text: `City "${locationForm.name}" created!` });
      } else if (locationForm.type === "ward") {
        if (!locationForm.cityId) throw new Error("Select a city");
        await devFetch("/wards", {
          method: "POST",
          body: JSON.stringify({
            name: locationForm.name,
            ward_number: locationForm.wardNumber,
            city_id: locationForm.cityId,
          }),
        });
        setLocationMessage({ type: "success", text: `Ward "${locationForm.name}" created!` });
      }

      setLocationForm({ type: "state", name: "", code: "", stateId: "", cityId: "", wardNumber: "" });
      await loadData();
    } catch (err: any) {
      setLocationMessage({ type: "error", text: err.message || "Failed to create location" });
    } finally {
      setLocationLoading(false);
    }
  };

  // =====================================================
  // Toggle User Status
  // =====================================================

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await devFetch(`/admin-users/${userId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      await loadData();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  // =====================================================
  // Delete User
  // =====================================================

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) return;

    try {
      await devFetch(`/admin-users/${userId}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // =====================================================
  // Filtered users
  // =====================================================

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.state_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.city_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // =====================================================
  // State-wise tree grouping
  // =====================================================

  const usersByState = states.map((state) => {
    const stateUsers = allUsers.filter((u) => u.state_id === state.id);
    const stateCities = cities.filter((c) => c.state_id === state.id);
    return {
      ...state,
      users: stateUsers,
      cities: stateCities.map((city) => {
        const cityUsers = allUsers.filter((u) => u.city_id === city.id);
        const cityWards = wards.filter((w) => w.city_id === city.id);
        return {
          ...city,
          users: cityUsers,
          wards: cityWards.map((ward) => ({
            ...ward,
            users: allUsers.filter((u) => u.ward_id === ward.id),
          })),
        };
      }),
    };
  });

  // Unassigned users (no state)
  const unassignedUsers = allUsers.filter((u) => !u.state_id);

  // =====================================================
  // Stats
  // =====================================================

  const stats = {
    total: allUsers.length,
    superAdmins: allUsers.filter((u) => u.role === "super_admin").length,
    admins: allUsers.filter((u) => u.role === "admin").length,
    supervisors: allUsers.filter((u) => u.role === "supervisor").length,
    active: allUsers.filter((u) => u.is_active).length,
    inactive: allUsers.filter((u) => !u.is_active).length,
  };

  if (!devSession) return null;

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Bar */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-green-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Developer Console</h1>
              <p className="text-xs text-green-400 font-mono">GOD MODE ACTIVE</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-green-400 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="text-right text-xs text-gray-400">
              <div className="font-mono text-green-400">{devSession.username}</div>
              <div>Since {new Date(devSession.loginTime).toLocaleTimeString()}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users (State-wise)", icon: Users },
            { id: "create", label: "Create User", icon: UserPlus },
            { id: "locations", label: "Manage Locations", icon: Globe },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow-lg shadow-green-500/25"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ====== OVERVIEW TAB ====== */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  {[
                    { label: "Total Users", value: stats.total, color: "from-blue-500 to-blue-600", icon: Users },
                    { label: "Super Admins", value: stats.superAdmins, color: "from-purple-500 to-purple-600", icon: Shield },
                    { label: "Admins", value: stats.admins, color: "from-indigo-500 to-indigo-600", icon: Landmark },
                    { label: "Supervisors", value: stats.supervisors, color: "from-cyan-500 to-cyan-600", icon: Eye },
                    { label: "Active", value: stats.active, color: "from-green-500 to-green-600", icon: CheckCircle },
                    { label: "Inactive", value: stats.inactive, color: "from-red-500 to-red-600", icon: XCircle },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* States Overview */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    States Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {states.map((state) => {
                      const stateUsers = allUsers.filter((u) => u.state_id === state.id);
                      const stateCities = cities.filter((c) => c.state_id === state.id);
                      const stateWards = wards.filter((w) =>
                        stateCities.some((c) => c.id === w.city_id)
                      );
                      return (
                        <div key={state.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">{state.name}</h4>
                            <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                              {(state as any).code || "—"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-400">{stateUsers.length}</p>
                              <p className="text-[10px] text-gray-500">Users</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-purple-400">{stateCities.length}</p>
                              <p className="text-[10px] text-gray-500">Cities</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-cyan-400">{stateWards.length}</p>
                              <p className="text-[10px] text-gray-500">Wards</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Recent Users
                  </h3>
                  <div className="space-y-3">
                    {allUsers.slice(0, 10).map((user) => (
                      <div key={user.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            user.role === "super_admin"
                              ? "bg-purple-500/20 text-purple-400"
                              : user.role === "admin"
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user.full_name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === "super_admin"
                              ? "bg-purple-500/10 text-purple-400"
                              : user.role === "admin"
                              ? "bg-indigo-500/10 text-indigo-400"
                              : "bg-cyan-500/10 text-cyan-400"
                          }`}>
                            {user.role.replace("_", " ")}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== USERS (STATE-WISE) TAB ====== */}
            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, state, city..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>

                {/* Flat filtered list when searching */}
                {searchQuery || roleFilter !== "all" ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
                      <p className="text-sm text-gray-400">{filteredUsers.length} user(s) found</p>
                    </div>
                    <div className="divide-y divide-gray-800">
                      {filteredUsers.map((user) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          onToggle={() => handleToggleStatus(user.id, user.is_active)}
                          onDelete={() => handleDeleteUser(user.id, user.full_name)}
                        />
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="px-4 py-8 text-center text-gray-500">No users match your search.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* State-wise tree view */
                  <div className="space-y-3">
                    {usersByState.map((state) => (
                      <div key={state.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        {/* State Header */}
                        <button
                          onClick={() => {
                            const next = new Set(expandedStates);
                            next.has(state.id) ? next.delete(state.id) : next.add(state.id);
                            setExpandedStates(next);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedStates.has(state.id) ? (
                              <ChevronDown className="w-4 h-4 text-green-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <MapPin className="w-4 h-4 text-green-400" />
                            <span className="font-semibold text-white">{state.name}</span>
                            <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                              {(state as any).code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {state.users.length} user(s) · {state.cities.length} city(s)
                            </span>
                          </div>
                        </button>

                        {/* State Expanded */}
                        <AnimatePresence>
                          {expandedStates.has(state.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {/* State-level users (super_admins assigned to this state) */}
                              {state.users.filter((u) => !u.city_id).length > 0 && (
                                <div className="mx-4 mb-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                  <div className="px-3 py-2 border-b border-gray-700/50">
                                    <p className="text-xs text-purple-400 font-semibold">State-Level Users</p>
                                  </div>
                                  {state.users
                                    .filter((u) => !u.city_id)
                                    .map((user) => (
                                      <UserRow
                                        key={user.id}
                                        user={user}
                                        onToggle={() => handleToggleStatus(user.id, user.is_active)}
                                        onDelete={() => handleDeleteUser(user.id, user.full_name)}
                                        indent={1}
                                      />
                                    ))}
                                </div>
                              )}

                              {/* Cities */}
                              {state.cities.map((city) => (
                                <div key={city.id} className="mx-4 mb-3">
                                  <button
                                    onClick={() => {
                                      const next = new Set(expandedCities);
                                      next.has(city.id) ? next.delete(city.id) : next.add(city.id);
                                      setExpandedCities(next);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      {expandedCities.has(city.id) ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                      )}
                                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                                      <span className="text-sm font-medium text-white">{city.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {city.users.length} user(s) · {city.wards.length} ward(s)
                                    </span>
                                  </button>

                                  {/* City expanded */}
                                  <AnimatePresence>
                                    {expandedCities.has(city.id) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden ml-4 mt-1 space-y-1"
                                      >
                                        {/* City-level users (admins) */}
                                        {city.users.filter((u) => !u.ward_id).length > 0 && (
                                          <div className="bg-gray-800/30 rounded-lg border border-gray-700/50">
                                            <div className="px-3 py-1.5 border-b border-gray-700/50">
                                              <p className="text-[10px] text-indigo-400 font-semibold uppercase">City Admins</p>
                                            </div>
                                            {city.users
                                              .filter((u) => !u.ward_id)
                                              .map((user) => (
                                                <UserRow
                                                  key={user.id}
                                                  user={user}
                                                  onToggle={() => handleToggleStatus(user.id, user.is_active)}
                                                  onDelete={() => handleDeleteUser(user.id, user.full_name)}
                                                  indent={2}
                                                />
                                              ))}
                                          </div>
                                        )}

                                        {/* Wards */}
                                        {city.wards.map((ward) => (
                                          <div key={ward.id} className="bg-gray-800/30 rounded-lg border border-gray-700/50">
                                            <div className="px-3 py-1.5 border-b border-gray-700/50 flex items-center gap-2">
                                              <Landmark className="w-3 h-3 text-cyan-400" />
                                              <p className="text-xs text-cyan-400 font-semibold">
                                                {ward.name} ({(ward as any).ward_number})
                                              </p>
                                            </div>
                                            {ward.users.length > 0 ? (
                                              ward.users.map((user) => (
                                                <UserRow
                                                  key={user.id}
                                                  user={user}
                                                  onToggle={() => handleToggleStatus(user.id, user.is_active)}
                                                  onDelete={() => handleDeleteUser(user.id, user.full_name)}
                                                  indent={3}
                                                />
                                              ))
                                            ) : (
                                              <div className="px-3 py-2 text-xs text-gray-600">No supervisors assigned</div>
                                            )}
                                          </div>
                                        ))}

                                        {city.wards.length === 0 && city.users.filter((u) => !u.ward_id).length === 0 && (
                                          <div className="px-3 py-2 text-xs text-gray-600">No users or wards</div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}

                              {state.cities.length === 0 && state.users.filter((u) => !u.city_id).length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-600">No cities or users in this state</div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    {/* Unassigned users */}
                    {unassignedUsers.length > 0 && (
                      <div className="bg-gray-900 border border-yellow-500/20 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-yellow-500/5 border-b border-yellow-500/20 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-semibold text-yellow-400">
                            Unassigned Users ({unassignedUsers.length})
                          </span>
                        </div>
                        {unassignedUsers.map((user) => (
                          <UserRow
                            key={user.id}
                            user={user}
                            onToggle={() => handleToggleStatus(user.id, user.is_active)}
                            onDelete={() => handleDeleteUser(user.id, user.full_name)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ====== CREATE USER TAB ====== */}
            {activeTab === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-400" />
                    Create New User
                  </h3>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={createForm.fullName}
                          onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                          placeholder="e.g. Rajesh Kumar"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Email *</label>
                        <input
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                          placeholder="user@greenindia.org"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Password *</label>
                        <input
                          type="text"
                          value={createForm.password}
                          onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                          placeholder="Minimum 6 characters"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={createForm.phone}
                          onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Role *</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "super_admin", label: "Super Admin", desc: "State-level control", color: "purple" },
                          { value: "admin", label: "Admin", desc: "City-level control", color: "indigo" },
                          { value: "supervisor", label: "Supervisor", desc: "Ward-level control", color: "cyan" },
                        ].map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setCreateForm({ ...createForm, role: role.value as AdminRole })}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              createForm.role === role.value
                                ? `border-${role.color}-500 bg-${role.color}-500/10`
                                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${
                              createForm.role === role.value ? `text-${role.color}-400` : "text-white"
                            }`}>
                              {role.label}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{role.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">State</label>
                        <select
                          value={createForm.stateId}
                          onChange={(e) => setCreateForm({ ...createForm, stateId: e.target.value, cityId: "", wardId: "" })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                        >
                          <option value="">Select State</option>
                          {states.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">City</label>
                        <select
                          value={createForm.cityId}
                          onChange={(e) => setCreateForm({ ...createForm, cityId: e.target.value, wardId: "" })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                          disabled={!createForm.stateId}
                        >
                          <option value="">Select City</option>
                          {cities
                            .filter((c) => c.state_id === createForm.stateId)
                            .map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Ward</label>
                        <select
                          value={createForm.wardId}
                          onChange={(e) => setCreateForm({ ...createForm, wardId: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                          disabled={!createForm.cityId}
                        >
                          <option value="">Select Ward</option>
                          {wards
                            .filter((w) => w.city_id === createForm.cityId)
                            .map((w) => (
                              <option key={w.id} value={w.id}>{w.name} ({w.ward_number})</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    {createMessage && (
                      <div
                        className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                          createMessage.type === "success"
                            ? "bg-green-500/10 border border-green-500/20 text-green-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                        }`}
                      >
                        {createMessage.type === "success" ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        )}
                        {createMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={createLoading}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {createLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Create {createForm.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ====== MANAGE LOCATIONS TAB ====== */}
            {activeTab === "locations" && (
              <motion.div
                key="locations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create Location Form */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-400" />
                      Add Location
                    </h3>

                    <form onSubmit={handleCreateLocation} className="space-y-4">
                      {/* Type */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: "state", label: "State", icon: MapPin },
                            { value: "city", label: "City", icon: Building },
                            { value: "ward", label: "Ward", icon: Landmark },
                          ].map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() =>
                                setLocationForm({ ...locationForm, type: t.value as any, stateId: "", cityId: "" })
                              }
                              className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-all ${
                                locationForm.type === t.value
                                  ? "border-green-500 bg-green-500/10 text-green-400"
                                  : "border-gray-700 text-gray-400 hover:border-gray-600"
                              }`}
                            >
                              <t.icon className="w-4 h-4" />
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Name *</label>
                        <input
                          type="text"
                          value={locationForm.name}
                          onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                          placeholder={`e.g. ${locationForm.type === "state" ? "Gujarat" : locationForm.type === "city" ? "Ahmedabad" : "Ward 12 - Navrangpura"}`}
                          required
                        />
                      </div>

                      {/* State code */}
                      {locationForm.type === "state" && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">State Code *</label>
                          <input
                            type="text"
                            value={locationForm.code}
                            onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 font-mono uppercase"
                            placeholder="e.g. GJ"
                            maxLength={5}
                            required
                          />
                        </div>
                      )}

                      {/* Parent selectors */}
                      {locationForm.type === "city" && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Parent State *</label>
                          <select
                            value={locationForm.stateId}
                            onChange={(e) => setLocationForm({ ...locationForm, stateId: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                            required
                          >
                            <option value="">Select State</option>
                            {states.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {locationForm.type === "ward" && (
                        <>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">State *</label>
                            <select
                              value={locationForm.stateId}
                              onChange={(e) => setLocationForm({ ...locationForm, stateId: e.target.value, cityId: "" })}
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                              required
                            >
                              <option value="">Select State</option>
                              {states.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Parent City *</label>
                            <select
                              value={locationForm.cityId}
                              onChange={(e) => setLocationForm({ ...locationForm, cityId: e.target.value })}
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                              required
                              disabled={!locationForm.stateId}
                            >
                              <option value="">Select City</option>
                              {cities
                                .filter((c) => c.state_id === locationForm.stateId)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Ward Number *</label>
                            <input
                              type="text"
                              value={locationForm.wardNumber}
                              onChange={(e) => setLocationForm({ ...locationForm, wardNumber: e.target.value })}
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                              placeholder="e.g. W-012"
                              required
                            />
                          </div>
                        </>
                      )}

                      {/* Message */}
                      {locationMessage && (
                        <div
                          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                            locationMessage.type === "success"
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}
                        >
                          {locationMessage.type === "success" ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          )}
                          {locationMessage.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={locationLoading}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {locationLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            Add {locationForm.type.charAt(0).toUpperCase() + locationForm.type.slice(1)}
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Current Locations */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-400" />
                      Current Locations
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {states.map((state) => {
                        const stateCities = cities.filter((c) => c.state_id === state.id);
                        return (
                          <div key={state.id} className="bg-gray-800/50 rounded-lg border border-gray-700 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-semibold text-white">{state.name}</span>
                              <span className="text-xs font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                                {state.code}
                              </span>
                            </div>
                            {stateCities.length > 0 ? (
                              <div className="ml-4 space-y-2">
                                {stateCities.map((city) => {
                                  const cityWards = wards.filter((w) => w.city_id === city.id);
                                  return (
                                    <div key={city.id}>
                                      <div className="flex items-center gap-2">
                                        <Building className="w-3 h-3 text-indigo-400" />
                                        <span className="text-xs font-medium text-indigo-300">{city.name}</span>
                                      </div>
                                      {cityWards.length > 0 && (
                                        <div className="ml-4 mt-1 flex flex-wrap gap-1">
                                          {cityWards.map((ward) => (
                                            <span
                                              key={ward.id}
                                              className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20"
                                            >
                                              {ward.name} ({ward.ward_number})
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="ml-4 text-xs text-gray-600">No cities</p>
                            )}
                          </div>
                        );
                      })}
                      {states.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No locations configured yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// =====================================================
// User Row Component
// =====================================================

function UserRow({
  user,
  onToggle,
  onDelete,
  indent = 0,
}: {
  user: AdminUser;
  onToggle: () => void;
  onDelete: () => void;
  indent?: number;
}) {
  const roleColors: Record<string, string> = {
    super_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    supervisor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/30 transition-colors"
      style={{ paddingLeft: `${16 + indent * 16}px` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            user.role === "super_admin"
              ? "bg-purple-500/20 text-purple-400"
              : user.role === "admin"
              ? "bg-indigo-500/20 text-indigo-400"
              : "bg-cyan-500/20 text-cyan-400"
          }`}
        >
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {user.state_name && (
          <span className="hidden sm:inline text-[10px] text-gray-500">{user.state_name}</span>
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColors[user.role] || ""}`}>
          {user.role.replace("_", " ")}
        </span>
        <button
          onClick={onToggle}
          className={`p-1 rounded transition-colors ${
            user.is_active
              ? "text-green-400 hover:bg-green-500/10"
              : "text-red-400 hover:bg-red-500/10"
          }`}
          title={user.is_active ? "Deactivate" : "Activate"}
        >
          {user.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
