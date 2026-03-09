import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  UserCog,
  MapPin,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  FileText,
  Plus,
  Loader2,
  ClipboardList,
  Recycle,
  Weight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  useAdminAuth,
  WasteReport,
  CollectionLog,
  fetchWasteReports,
  fetchCollectionLogs,
  fetchDashboardStats,
  updateReportStatus,
  logWasteCollection,
} from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";

export default function SupervisorDashboard() {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [collectionLogs, setCollectionLogs] = useState<CollectionLog[]>([]);
  const [stats, setStats] = useState({ totalReports: 0, pending: 0, resolved: 0, inProgress: 0, totalWaste: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");

  // Collection log form
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [newLog, setNewLog] = useState({
    waste_type: "recyclable" as string,
    quantity_kg: "",
    notes: "",
  });
  const [logging, setLogging] = useState(false);

  // Report status update
  const [updatingReport, setUpdatingReport] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminUser || adminUser.role !== "supervisor") {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [adminUser]);

  const loadData = async () => {
    if (!adminUser) return;
    setLoading(true);
    const [reportsData, logsData, statsData] = await Promise.all([
      fetchWasteReports({ ward_id: adminUser.ward_id || undefined }),
      fetchCollectionLogs(adminUser.ward_id || undefined),
      fetchDashboardStats({ ward_id: adminUser.ward_id || undefined }),
    ]);
    setReports(reportsData);
    setCollectionLogs(logsData);
    setStats(statsData);
    setLoading(false);
  };

  const handleUpdateStatus = async (reportId: string, status: string) => {
    setUpdatingReport(reportId);
    if (status === "resolved") {
      setSelectedReportId(reportId);
      setShowResolveDialog(true);
      setUpdatingReport(null);
      return;
    }
    await updateReportStatus(reportId, status);
    toast({ title: "Status Updated", description: `Report marked as ${status.replace("_", " ")}` });
    setUpdatingReport(null);
    loadData();
  };

  const handleResolve = async () => {
    if (!selectedReportId) return;
    setUpdatingReport(selectedReportId);
    await updateReportStatus(selectedReportId, "resolved", resolutionNotes);
    toast({ title: "Report Resolved" });
    setShowResolveDialog(false);
    setResolutionNotes("");
    setSelectedReportId(null);
    setUpdatingReport(null);
    loadData();
  };

  const handleLogCollection = async () => {
    if (!adminUser || !adminUser.ward_id) return;
    setLogging(true);
    await logWasteCollection({
      supervisor_id: adminUser.id,
      ward_id: adminUser.ward_id,
      waste_type: newLog.waste_type,
      quantity_kg: parseFloat(newLog.quantity_kg) || 0,
      notes: newLog.notes,
    });
    toast({ title: "Collection Logged", description: `${newLog.quantity_kg} kg of ${newLog.waste_type} waste recorded.` });
    setShowLogDialog(false);
    setNewLog({ waste_type: "recyclable", quantity_kg: "", notes: "" });
    setLogging(false);
    loadData();
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950/20 to-slate-950 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Supervisor Dashboard</h1>
              <p className="text-xs text-gray-400">
                {adminUser?.full_name} — Ward: {adminUser?.ward_name || "Unassigned"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Reports", value: stats.totalReports, icon: FileText, color: "from-amber-600 to-amber-700" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "from-orange-600 to-orange-700" },
            { label: "In Progress", value: stats.inProgress, icon: TrendingUp, color: "from-blue-600 to-blue-700" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "from-green-600 to-green-700" },
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
            <TabsTrigger value="reports" className="data-[state=active]:bg-green-600">
              <AlertTriangle className="w-4 h-4 mr-1" /> Issue Reports
            </TabsTrigger>
            <TabsTrigger value="collection" className="data-[state=active]:bg-green-600">
              <Recycle className="w-4 h-4 mr-1" /> Collection Logs
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card className="bg-slate-900/60 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Ward Issue Reports
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Review and update reports from citizens in your ward
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reports for your ward yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{report.title}</h3>
                              <Badge className={severityColors[report.severity]}>
                                {report.severity}
                              </Badge>
                              <Badge className={statusColors[report.status]}>
                                {report.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{report.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>By: {report.citizen_name}</span>
                              <span>Category: {report.category?.replace("_", " ")}</span>
                              <span>{new Date(report.created_at).toLocaleString()}</span>
                              {report.address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {report.address}
                                </span>
                              )}
                            </div>
                            {report.resolution_notes && (
                              <div className="mt-2 p-2 bg-green-500/10 rounded-lg text-sm text-green-300">
                                Resolution: {report.resolution_notes}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-1 ml-4">
                            {report.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(report.id, "in_progress")}
                                disabled={updatingReport === report.id}
                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                {updatingReport === report.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Start Work"
                                )}
                              </Button>
                            )}
                            {report.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(report.id, "resolved")}
                                disabled={updatingReport === report.id}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                Resolve
                              </Button>
                            )}
                            {(report.status === "pending" || report.status === "in_progress") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(report.id, "rejected")}
                                disabled={updatingReport === report.id}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collection Logs Tab */}
          <TabsContent value="collection" className="mt-6">
            <Card className="bg-slate-900/60 border-slate-800/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Recycle className="w-5 h-5 text-green-400" />
                    Waste Collection Logs
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Record daily waste collection details
                  </CardDescription>
                </div>
                <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-1" /> Log Collection
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>Log Waste Collection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label className="text-gray-300">Waste Type</Label>
                        <Select
                          onValueChange={(v) => setNewLog((p) => ({ ...p, waste_type: v }))}
                          value={newLog.waste_type}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="biodegradable">Biodegradable</SelectItem>
                            <SelectItem value="recyclable">Recyclable</SelectItem>
                            <SelectItem value="hazardous">Hazardous</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Quantity (kg)</Label>
                        <Input
                          type="number"
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          value={newLog.quantity_kg}
                          onChange={(e) => setNewLog((p) => ({ ...p, quantity_kg: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Notes</Label>
                        <Textarea
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          value={newLog.notes}
                          onChange={(e) => setNewLog((p) => ({ ...p, notes: e.target.value }))}
                          placeholder="Any additional notes..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button variant="ghost" onClick={() => setShowLogDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleLogCollection}
                        disabled={logging || !newLog.quantity_kg}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {logging ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                        Log Collection
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Waste summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { type: "Biodegradable", icon: "🌿", total: collectionLogs.filter(l => l.waste_type === "biodegradable").reduce((s, l) => s + l.quantity_kg, 0) },
                    { type: "Recyclable", icon: "♻️", total: collectionLogs.filter(l => l.waste_type === "recyclable").reduce((s, l) => s + l.quantity_kg, 0) },
                    { type: "Hazardous", icon: "☣️", total: collectionLogs.filter(l => l.waste_type === "hazardous").reduce((s, l) => s + l.quantity_kg, 0) },
                    { type: "Mixed", icon: "🗑️", total: collectionLogs.filter(l => l.waste_type === "mixed").reduce((s, l) => s + l.quantity_kg, 0) },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <span className="text-2xl">{item.icon}</span>
                      <p className="text-xs text-gray-400 mt-1">{item.type}</p>
                      <p className="text-lg font-bold text-white">{item.total.toFixed(1)} kg</p>
                    </div>
                  ))}
                </div>

                {collectionLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Weight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No collection logs yet. Start logging waste collected.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800">
                          <TableHead className="text-gray-400">Date</TableHead>
                          <TableHead className="text-gray-400">Waste Type</TableHead>
                          <TableHead className="text-gray-400">Quantity</TableHead>
                          <TableHead className="text-gray-400">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectionLogs.map((log) => (
                          <TableRow key={log.id} className="border-slate-800/50">
                            <TableCell className="text-white">
                              {new Date(log.collection_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                log.waste_type === "biodegradable" ? "bg-green-500/20 text-green-300" :
                                log.waste_type === "recyclable" ? "bg-blue-500/20 text-blue-300" :
                                log.waste_type === "hazardous" ? "bg-red-500/20 text-red-300" :
                                "bg-gray-500/20 text-gray-300"
                              }>
                                {log.waste_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white font-mono">{log.quantity_kg} kg</TableCell>
                            <TableCell className="text-gray-400 max-w-[200px] truncate">
                              {log.notes || "—"}
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

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Resolution Notes</Label>
              <Textarea
                className="bg-slate-800 border-slate-700 text-white mt-1"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-1" /> Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
