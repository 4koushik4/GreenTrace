import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { supabase, useAuth } from "@/lib/supabase";

interface Profile {
  full_name: string | null;
  points: number | null;
  eco_score: number | null;
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

export default function FootprintPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        .select("full_name, points, eco_score")
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
            : "Unable to load your footprint data.",
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
        Supabase is not configured, so your footprint data is unavailable.
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-gray-300">
        <div className="flex items-center gap-3" role="status">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          Loading your footprint…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-gray-300">
        Sign in to view your footprint.
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-300"
        role="alert"
      >
        <h2 className="font-semibold">Unable to load footprint data</h2>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const categories = ["biodegradable", "recyclable", "hazardous"].map(
    (category) => ({
      category,
      count: classifications.filter(
        (item) => item.classification?.toLowerCase() === category,
      ).length,
    }),
  );
  const statuses = [
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
  const collectedCount =
    statuses.find((status) => status.status === "collected")?.count ?? 0;
  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.email ||
    "your";

  return (
    <div className="container mx-auto space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Waste Footprint Tracker</CardTitle>
          <CardDescription>
            Recorded activity for {displayName}; pickup status and dates reflect
            the current records.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded bg-slate-800/40 p-4 text-white">
            <div className="text-sm opacity-80">Items Classified</div>
            <div className="text-3xl font-bold">{classifications.length}</div>
            <div className="mt-3 space-y-1 text-sm opacity-80">
              {categories.map(({ category, count }) => (
                <div key={category} className="flex justify-between">
                  <span className="capitalize">{category}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded bg-slate-800/40 p-4 text-white">
            <div className="text-sm opacity-80">Pickups Collected</div>
            <div className="text-3xl font-bold">{collectedCount}</div>
            <div className="mt-3 space-y-1 text-sm opacity-80">
              {statuses.map(({ status, count }) => (
                <div key={status} className="flex justify-between">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded bg-slate-800/40 p-4 text-white">
            <div className="text-sm opacity-80">Environmental Savings</div>
            <div className="mt-2 text-xl font-bold">Unavailable</div>
            <p className="mt-2 text-sm opacity-70">
              No measured weights or environmental conversion factors are
              recorded in the available data, so CO₂ and tree equivalents cannot
              be calculated.
            </p>
          </div>
        </CardContent>
      </Card>

      {!profile && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          No profile record is available. This report includes only the
          classifications and pickups linked to your authenticated account.
        </p>
      )}

      {classifications.length === 0 && pickups.length === 0 && (
        <p className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-gray-300">
          No classifications or pickup requests are recorded for your account
          yet.
        </p>
      )}

      {pickups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pickup records</CardTitle>
            <CardDescription>
              Scheduled date and current status are shown as stored; only
              records marked “collected” count as collected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pickups.map((pickup) => (
              <div
                key={pickup.id}
                className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium capitalize">
                  {pickup.status || "Status unavailable"}
                </span>
                <span className="text-sm text-muted-foreground">
                  Scheduled:{" "}
                  {pickup.pickup_date
                    ? /^\d{4}-\d{2}-\d{2}$/.test(pickup.pickup_date)
                      ? pickup.pickup_date
                      : new Date(pickup.pickup_date).toLocaleString()
                    : "Date unavailable"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {classifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Classification records</CardTitle>
            <CardDescription>
              Recorded category and timestamp for each classification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {classifications.map((classification) => (
              <div
                key={classification.id}
                className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium capitalize">
                  {classification.classification || "Category unavailable"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {classification.created_at
                    ? new Date(classification.created_at).toLocaleString()
                    : "Timestamp unavailable"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {profile && (
        <p className="text-sm text-muted-foreground">
          Profile values from your account:{" "}
          {profile.eco_score != null
            ? `eco score ${profile.eco_score}`
            : "eco score unavailable"}
          {" · "}
          {profile.points != null
            ? `${profile.points} points`
            : "points unavailable"}
        </p>
      )}
    </div>
  );
}
