import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  ShieldCheck,
  Users,
  MapPin,
  BarChart3,
  Plus,
  LogOut,
  Eye,
  UserCog,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Globe,
  Loader2,
} from "lucide-react";
import {
  useAdminAuth,
  AdminUser,
  fetchAdmins,
  createAdminUser,
  fetchStates,
  fetchCities,
  fetchDashboardStats,
  toggleAdminStatus,
} from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminDashboard() {
  const { adminUser, logout, isRole } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalReports: 0, pending: 0, resolved: 0, inProgress: 0, totalWaste: 0 });
  const [loading, setLoading] = useState(true);

  // New admin form
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    state_id: "",
    city_id: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!adminUser || adminUser.role !== "super_admin") {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [adminUser]);

  const loadData = async () => {
    setLoading(true);
    const [adminsData, statesData, statsData] = await Promise.all([
      fetchAdmins(),
      fetchStates(),
      fetchDashboardStats(),
    ]);
    setAdmins(adminsData.filter((a) => a.role !== "super_admin"));
    setStates(statesData);
    setStats(statsData);
    setLoading(false);
  };

  const handleSelectState = async (stateId: string) => {
    setNewAdmin((p) => ({ ...p, state_id: stateId, city_id: "" }));
    const citiesData = await fetchCities(stateId);
    setCities(citiesData);
  };

  const handleCreateAdmin = async () => {
    if (!adminUser) return;
    setCreating(true);
    const result = await createAdminUser(
      newAdmin.email,
      newAdmin.password,
      newAdmin.fullName,
      "admin",
      adminUser.id,
      {
        phone: newAdmin.phone,
        state_id: newAdmin.state_id || undefined,
        city_id: newAdmin.city_id || undefined,
      }
    );

    if (result.success) {
      toast({ title: "Admin Created", description: `${newAdmin.fullName} has been added.` });
      setShowCreateDialog(false);
      setNewAdmin({ email: "", password: "", fullName: "", phone: "", state_id: "", city_id: "" });
      loadData();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    await toggleAdminStatus(admin.id, !admin.is_active);
    toast({
      title: admin.is_active ? "Admin Deactivated" : "Admin Activated",
      description: `${admin.full_name} has been ${admin.is_active ? "deactivated" : "activated"}.`,
    });
    loadData();
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Super Admin Panel</h1>
              <p className="text-xs text-gray-400">{adminUser?.full_name} — State Level</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Admins", value: admins.filter((a) => a.role === "admin").length, icon: Users, color: "from-blue-600 to-blue-700" },
            { label: "Supervisors", value: admins.filter((a) => a.role === "supervisor").length, icon: UserCog, color: "from-purple-600 to-purple-700" },
            { label: "Total Reports", value: stats.totalReports, icon: AlertTriangle, color: "from-amber-600 to-amber-700" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "from-green-600 to-green-700" },
            { label: "Waste Collected", value: `${stats.totalWaste} kg`, icon: Trash2, color: "from-teal-600 to-teal-700" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="bg-slate-900/60 border-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Admin Management */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/60 border-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Admin & Supervisor Management
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create and manage city-level admins and ward-level supervisors
                </CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-1" /> Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-gray-300">Full Name</Label>
                      <Input
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                        value={newAdmin.fullName}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Email</Label>
                      <Input
                        type="email"
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                        placeholder="admin@city.com"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Password</Label>
                      <Input
                        type="password"
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Phone</Label>
                      <Input
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                        value={newAdmin.phone}
                        onChange={(e) => setNewAdmin((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Assign State</Label>
                      <Select onValueChange={handleSelectState} value={newAdmin.state_id}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          {states.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {cities.length > 0 && (
                      <div>
                        <Label className="text-gray-300">Assign City</Label>
                        <Select
                          onValueChange={(v) => setNewAdmin((p) => ({ ...p, city_id: v }))}
                          value={newAdmin.city_id}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            {cities.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateAdmin}
                      disabled={creating || !newAdmin.email || !newAdmin.password || !newAdmin.fullName}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                      Create Admin
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No admins or supervisors yet. Create one to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-gray-400">Name</TableHead>
                        <TableHead className="text-gray-400">Email</TableHead>
                        <TableHead className="text-gray-400">Role</TableHead>
                        <TableHead className="text-gray-400">Location</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id} className="border-slate-800/50">
                          <TableCell className="text-white font-medium">
                            {admin.full_name}
                          </TableCell>
                          <TableCell className="text-gray-400">{admin.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                admin.role === "admin"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-green-500/20 text-green-300 border-green-500/30"
                              }
                            >
                              {admin.role === "admin" ? "Admin" : "Supervisor"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {admin.city_name || admin.state_name || admin.ward_name || "Unassigned"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                admin.is_active
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : "bg-red-500/20 text-red-300 border-red-500/30"
                              }
                            >
                              {admin.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(admin)}
                              className={
                                admin.is_active
                                  ? "text-red-400 hover:text-red-300"
                                  : "text-green-400 hover:text-green-300"
                              }
                            >
                              {admin.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="bg-slate-900/60 border-slate-800/50 hover:border-indigo-500/30 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/reports")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white">All Reports</p>
                <p className="text-xs text-gray-400">{stats.totalReports} total, {stats.pending} pending</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="bg-slate-900/60 border-slate-800/50 hover:border-indigo-500/30 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/analytics")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Analytics</p>
                <p className="text-xs text-gray-400">System-wide performance</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="bg-slate-900/60 border-slate-800/50 hover:border-indigo-500/30 transition-colors cursor-pointer"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Marketplace</p>
                <p className="text-xs text-gray-400">Monitor marketplace activity</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
