import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  ChevronRight,
  Globe,
  Leaf,
  MapPin,
  Recycle,
  Target,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, useAuth } from "@/lib/supabase";

interface DashboardProfile {
  full_name: string | null;
  points: number | null;
  eco_score: number | null;
  level: string | null;
}

interface Classification {
  id: string;
  classification: string;
  created_at: string;
}

interface Pickup {
  id: string;
  status: string;
  pickup_date: string;
  created_at: string;
}

const cardStyle =
  "group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-xl hover:shadow-emerald-950/20";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    let active = true;

    if (!supabase || !user) {
      setProfile(null);
      setClassifications([]);
      setPickups([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    Promise.all([
      supabase
        .from("user_profiles")
        .select("full_name, points, eco_score, level")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("waste_classifications")
        .select("id, classification, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("pickups")
        .select("id, status, pickup_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])
      .then(([profileResult, classificationResult, pickupResult]) => {
        if (!active) return;
        const fetchError =
          profileResult.error ??
          classificationResult.error ??
          pickupResult.error;
        if (fetchError) {
          setError(fetchError.message);
          return;
        }
        setProfile(profileResult.data);
        setClassifications(classificationResult.data ?? []);
        setPickups(pickupResult.data ?? []);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load your dashboard data.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!supabase) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        Supabase is not configured, so your dashboard data is unavailable.
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-64 flex items-center justify-center text-gray-300">
        <div className="flex items-center gap-3" role="status">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-gray-300">
        Sign in to view your dashboard.
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-300"
        role="alert"
      >
        <h2 className="font-semibold">Unable to load dashboard data</h2>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const countClass = (name: string) =>
    classifications.filter(
      (item) => item.classification?.toLowerCase() === name,
    ).length;
  const collectedPickups = pickups.filter(
    (pickup) => pickup.status?.toLowerCase() === "collected",
  ).length;
  const lastSevenDays = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentClassifications = classifications.filter(
    (item) => new Date(item.created_at).getTime() >= lastSevenDays,
  ).length;
  const stats = [
    {
      title: "Items Classified",
      value: classifications.length,
      detail: `${countClass("biodegradable")} biodegradable`,
      icon: Leaf,
      color: "text-green-400",
    },
    {
      title: "Recyclable",
      value: countClass("recyclable"),
      detail: "Observed classifications",
      icon: Recycle,
      color: "text-blue-400",
    },
    {
      title: "Hazardous",
      value: countClass("hazardous"),
      detail: "Observed classifications",
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "Pickups Collected",
      value: collectedPickups,
      detail: `${pickups.length} total pickup requests`,
      icon: MapPin,
      color: "text-purple-400",
    },
  ];
  const pickupStatuses = [
    "requested",
    "scheduled",
    "collected",
    "missed",
    "cancelled",
  ].map((status) => ({
    status,
    count: pickups.filter((pickup) => pickup.status?.toLowerCase() === status)
      .length,
  }));
  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.email ||
    "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 p-6 shadow-2xl shadow-emerald-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
              Your sustainability overview
            </p>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              A summary of your recorded classifications and pickups.
            </p>
          </div>
          {profile && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {profile.level && (
                <Badge className="border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-200">
                  {profile.level}
                </Badge>
              )}
              {profile.eco_score != null && (
                <Badge className="border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-violet-200">
                  Eco Score: {profile.eco_score}
                </Badge>
              )}
              {profile.points != null && (
                <Badge className="border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-sky-200">
                  {profile.points} points
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {!profile && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          No profile record is available yet. Profile scores and points are
          unavailable.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={cardStyle}>
            <CardContent className="relative p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wide text-slate-300">
                  {stat.title}
                </h2>
                <span className="rounded-xl bg-slate-950/60 p-2.5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </span>
              </div>
              <div
                className={`text-4xl font-bold tracking-tight ${stat.color}`}
              >
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {classifications.length === 0 && pickups.length === 0 && (
        <p className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-gray-300">
          No waste classifications or pickup requests are recorded for your
          account yet.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recent activity
            </CardTitle>
            <CardDescription className="text-slate-400">
              Classifications created in the last 7 days, based on their
              recorded timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tracking-tight text-emerald-300">
              {recentClassifications}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              of {classifications.length} recorded classifications
            </p>
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Environmental impact
            </CardTitle>
            <CardDescription className="text-slate-400">
              Recorded activity only. The schema does not provide measured
              weights or environmental conversion factors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-200">
              CO₂ and other environmental savings:{" "}
              <span className="font-semibold text-slate-100">Unavailable</span>
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-slate-300">
              {pickupStatuses.map(({ status, count }) => (
                <span
                  key={status}
                  className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 capitalize"
                >
                  {status}{" "}
                  <span className="ml-1 font-semibold text-white">{count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription className="text-slate-400">
            Continue with an assessment or record a new waste classification.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/assessment">
            <Button className="h-12 w-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400">
              <Target className="mr-2 h-4 w-4" />
              Start Assessment
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </Link>
          <Link to="/scan">
            <Button
              variant="outline"
              className="h-12 w-full border-slate-600 bg-slate-950/30 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
            >
              <Camera className="mr-2 h-4 w-4" />
              Scan Waste
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-12 w-full border-slate-600 bg-slate-950/20 transition hover:border-violet-300/40 hover:bg-violet-300/10 sm:col-span-2"
            onClick={() => setShowQRModal(true)}
          >
            View QR Code
          </Button>
        </CardContent>
      </Card>

      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="relative rounded-xl bg-slate-800 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Close QR code"
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={() => setShowQRModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-4 pr-8 text-xl font-semibold text-white">
              Your QR Code
            </h2>
            <img
              src="https://i.postimg.cc/0Qt3BMFh/Screenshot-2026-01-22-200202.png"
              alt="QR Code"
              className="h-64 w-64 rounded bg-white p-2"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
