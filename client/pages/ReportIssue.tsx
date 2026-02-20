import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, FileText, MapPin } from "lucide-react";
import { Variants } from "framer-motion";
interface Report {
  id: string;
  user_id: string;
  title?: string;
  description: string;
  category: string;
  severity: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status: string;
  created_at: string;
}

export default function ReportIssue() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [photo, setPhoto] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("illegal_dumping");
  const [severity, setSeverity] = useState("medium");
  const [loc, setLoc] = useState<{ lat?: number; lng?: number }>({});
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (user) loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("illegal_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch {
      toast({
        title: "Failed to load reports",
        variant: "destructive",
      });
    }
  };

  const getGeo = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      toast({
        title: "Location captured",
        description: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      });
    });
  };

  const handleSubmit = async (e:any) => {
  e.preventDefault();
  setError(null);

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return setError("Supabase session missing. Please re-login.");
  }

  if (!user) return setError("Please login first");
  if (!desc.trim()) return setError("Description required");
  if (!photo) return setError("Photo required");

  setSubmitting(true);

  try {
    const uid = user.id;

    const path = `${uid}/${Date.now()}_${photo.name}`;

    const { data: up, error: upErr } = await supabase.storage
      .from("Reports")
      .upload(path, photo);

    if (upErr) throw upErr;

    const { data: pub } = supabase.storage
      .from("Reports")
      .getPublicUrl(up.path);

    const photoUrl = pub.publicUrl;

    const { error } = await supabase
      .from("illegal_reports")
      .insert({
        user_id: uid,
        title: title || null,
        description: desc,
        category,
        severity,
        photo_url: photoUrl,
        latitude: loc.lat || null,
        longitude: loc.lng || null,
        address: address || null,
        status: "new",
      })
      .select();   // <-- IMPORTANT for RLS debugging

    if (error) throw error;

    toast({ title: "Report submitted successfully" });
    setDone(true);
    await loadReports();
  } catch (err:any) {
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};


  if (done) {
    return (
      <div className="container mx-auto p-4 max-w-xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>✅ Report Submitted</CardTitle>
            <CardDescription>
              Authorities will review within 24–48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Submit Another
            </Button>
            <Button onClick={() => window.history.back()}>Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🚨 Report Issues
          </h1>
          <p className="text-gray-400 text-lg">
            Help us maintain a cleaner environment by reporting issues
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="submit">
        <TabsList className="grid grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="submit" className="data-[state=active]:bg-slate-700">Submit Report</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">My Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  Report Environmental Issue
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Submit a report about environmental issues in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Title (optional)</label>
                    <Input
                      placeholder="Brief title for your report"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="illegal_dumping" className="text-white hover:bg-slate-700">Illegal Dumping</SelectItem>
                        <SelectItem value="hazardous_waste" className="text-white hover:bg-slate-700">Hazardous Waste</SelectItem>
                        <SelectItem value="blocked_drainage" className="text-white hover:bg-slate-700">Blocked Drainage</SelectItem>
                        <SelectItem value="broken_bin" className="text-white hover:bg-slate-700">Broken Bin</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-slate-700">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Severity</label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="low" className="text-white hover:bg-slate-700">Low</SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-slate-700">Medium</SelectItem>
                        <SelectItem value="high" className="text-white hover:bg-slate-700">High</SelectItem>
                        <SelectItem value="urgent" className="text-white hover:bg-slate-700">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                    <Textarea
                      placeholder="Describe the environmental issue in detail"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Photo (optional)</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                      className="bg-slate-700/50 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={getGeo}
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </Button>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Address (optional)</label>
                    <Input
                      placeholder="Enter location address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="history">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-400" />
                  My Reports History
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View all your submitted environmental reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No reports submitted yet</p>
                  </div>
                ) : (
                  reports.map((r) => (
                    <motion.div
                      key={r.id}
                      variants={itemVariants}
                      className="border border-slate-700 rounded-lg p-4 bg-slate-800/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white">{r.title || "Untitled Report"}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          r.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          r.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {r.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-2">{r.description}</p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Category: {r.category.replace('_', ' ')}</span>
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
