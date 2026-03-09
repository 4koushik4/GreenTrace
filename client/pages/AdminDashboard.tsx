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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  MapPin,
  BarChart3,
  Plus,
  LogOut,
  UserCog,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Package,
  ShoppingBag,
  Loader2,
  FileText,
  Eye,
} from "lucide-react";
import {
  useAdminAuth,
  AdminUser,
  WasteReport,
  fetchSupervisors,
  createAdminUser,
  fetchWards,
  fetchWasteReports,
  fetchDashboardStats,
  toggleAdminStatus,
  updateReportStatus,
} from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [supervisors, setSupervisors] = useState<AdminUser[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [stats, setStats] = useState({ totalReports: 0, pending: 0, resolved: 0, inProgress: 0, totalWaste: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // New supervisor form
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    ward_id: "",
  });
  const [creating, setCreating] = useState(false);

  // Report detail
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    if (!adminUser || adminUser.role !== "admin") {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [adminUser]);

  const loadData = async () => {
    if (!adminUser) return;
    setLoading(true);
    const [supervisorsData, wardsData, reportsData, statsData] = await Promise.all([
      fetchSupervisors(adminUser.id),
      fetchWards(adminUser.city_id || undefined),
      fetchWasteReports({ city_id: adminUser.city_id || undefined }),
      fetchDashboardStats({ city_id: adminUser.city_id || undefined }),
    ]);
    setSupervisors(supervisorsData);
    setWards(wardsData);
    setReports(reportsData);
    setStats(statsData);
    setLoading(false);
  };

  const handleCreateSupervisor = async () => {
    if (!adminUser) return;
    setCreating(true);
    const result = await createAdminUser(
      newSupervisor.email,
      newSupervisor.password,
      newSupervisor.fullName,
      "supervisor",
      adminUser.id,
      {
        phone: newSupervisor.phone,
        state_id: adminUser.state_id || undefined,
        city_id: adminUser.city_id || undefined,
        ward_id: newSupervisor.ward_id || undefined,
      }
    );

    if (result.success) {
      toast({ title: "Supervisor Created", description: `${newSupervisor.fullName} has been added.` });
      setShowCreateDialog(false);
      setNewSupervisor({ email: "", password: "", fullName: "", phone: "", ward_id: "" });
      loadData();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    await updateReportStatus(reportId, status, statusNote);
    toast({ title: "Report Updated", description: `Status changed to ${status}` });
    setSelectedReport(null);
    setStatusNote("");
    loadData();
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    resolved: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const severityColors: Record<string, string> = {
    low: "bg-green-500/20 text-green-300",
    medium: "bg-amber-500/20 text-amber-300",
    high: "bg-orange-500/20 text-orange-300",
    critical: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">
                {adminUser?.full_name} — {adminUser?.city_name || "City Level"}
              </p>
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
            { label: "Supervisors", value: supervisors.length, icon: UserCog, color: "from-purple-600 to-purple-700" },
            { label: "Total Reports", value: stats.totalReports, icon: FileText, color: "from-amber-600 to-amber-700" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "from-orange-600 to-orange-700" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "from-green-600 to-green-700" },
            { label: "Waste (kg)", value: stats.totalWaste, icon: Trash2, color: "from-teal-600 to-teal-700" },
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/60 border-slate-800/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="w-4 h-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="supervisors" className="data-[state=active]:bg-blue-600">
              <UserCog className="w-4 h-4 mr-1" /> Supervisors
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600">
              <AlertTriangle className="w-4 h-4 mr-1" /> Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Reports */}
              <Card className="bg-slate-900/60 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Recent Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No reports yet</p>
                  ) : (
                    <div className="space-y-3">
                      {reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">{report.title}</p>
                            <p className="text-xs text-gray-400">{report.ward_name} — {new Date(report.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge className={statusColors[report.status]}>
                            {report.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ward Overview */}
              <Card className="bg-slate-900/60 border-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    Wards Under Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {wards.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No wards assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {wards.map((ward) => {
                        const wardSupervisors = supervisors.filter((s) => s.ward_id === ward.id);
                        return (
                          <div key={ward.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-white">{ward.name}</p>
                                <p className="text-xs text-gray-400">Ward {ward.ward_number}</p>
                              </div>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {wardSupervisors.length} Supervisor{wardSupervisors.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Supervisors Tab */}
          <TabsContent value="supervisors" className="mt-6">
            <Card className="bg-slate-900/60 border-slate-800/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-purple-400" />
                    Supervisor Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create and manage ward-level supervisors
                  </CardDescription>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-1" /> Add Supervisor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Supervisor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label className="text-gray-300">Full Name</Label>
                        <Input
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          value={newSupervisor.fullName}
                          onChange={(e) => setNewSupervisor((p) => ({ ...p, fullName: e.target.value }))}
                          placeholder="Supervisor Name"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Email</Label>
                        <Input
                          type="email"
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          value={newSupervisor.email}
                          onChange={(e) => setNewSupervisor((p) => ({ ...p, email: e.target.value }))}
                          placeholder="supervisor@ward.com"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Password</Label>
                        <Input
                          type="password"
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          value={newSupervisor.password}
                          onChange={(e) => setNewSupervisor((p) => ({ ...p, password: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Phone</Label>
                        <Input
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          value={newSupervisor.phone}
                          onChange={(e) => setNewSupervisor((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Assign Ward</Label>
                        <Select
                          onValueChange={(v) => setNewSupervisor((p) => ({ ...p, ward_id: v }))}
                          value={newSupervisor.ward_id}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                            <SelectValue placeholder="Select Ward" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            {wards.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name} ({w.ward_number})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateSupervisor}
                        disabled={creating || !newSupervisor.email || !newSupervisor.password || !newSupervisor.fullName}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {supervisors.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No supervisors yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800">
                          <TableHead className="text-gray-400">Name</TableHead>
                          <TableHead className="text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-400">Ward</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supervisors.map((sup) => (
                          <TableRow key={sup.id} className="border-slate-800/50">
                            <TableCell className="text-white font-medium">{sup.full_name}</TableCell>
                            <TableCell className="text-gray-400">{sup.email}</TableCell>
                            <TableCell className="text-gray-400">
                              {sup.ward_name || "Unassigned"}
                            </TableCell>
                            <TableCell>
                              <Badge className={sup.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>
                                {sup.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAdminStatus(sup.id, !sup.is_active).then(loadData)}
                                className={sup.is_active ? "text-red-400" : "text-green-400"}
                              >
                                {sup.is_active ? "Deactivate" : "Activate"}
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
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card className="bg-slate-900/60 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Waste Issue Reports
                </CardTitle>
                <CardDescription className="text-gray-400">
                  All reports from citizens in your managed wards
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reports submitted yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800">
                          <TableHead className="text-gray-400">Title</TableHead>
                          <TableHead className="text-gray-400">Category</TableHead>
                          <TableHead className="text-gray-400">Severity</TableHead>
                          <TableHead className="text-gray-400">Ward</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Date</TableHead>
                          <TableHead className="text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id} className="border-slate-800/50">
                            <TableCell className="text-white font-medium max-w-[200px] truncate">
                              {report.title}
                            </TableCell>
                            <TableCell className="text-gray-400 capitalize">
                              {report.category?.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              <Badge className={severityColors[report.severity] || ""}>
                                {report.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">{report.ward_name}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[report.status]}>
                                {report.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {new Date(report.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {report.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateReport(report.id, "in_progress")}
                                    className="text-blue-400"
                                  >
                                    Start
                                  </Button>
                                )}
                                {report.status === "in_progress" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateReport(report.id, "resolved")}
                                    className="text-green-400"
                                  >
                                    Resolve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
