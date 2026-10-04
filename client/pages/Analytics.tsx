import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, Recycle, Trash2, AlertTriangle, BarChart3 } from "lucide-react";
import { supabase, useAuth } from "@/lib/supabase";

type Timeframe = "week" | "month" | "quarter" | "year";
type Category = "all" | "biodegradable" | "recyclable" | "hazardous";
type Classification = {
  classification: Exclude<Category, "all"> | string | null;
  confidence: number | null;
  points_earned: number | null;
  created_at: string;
};

const startOfTimeframe = (timeframe: Timeframe) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (timeframe === "week") {
    const weekday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - weekday);
  } else if (timeframe === "month") {
    date.setDate(1);
  } else if (timeframe === "quarter") {
    date.setMonth(Math.floor(date.getMonth() / 3) * 3, 1);
  } else {
    date.setMonth(0, 1);
  }
  return date;
};

const categoryColors: Record<string, string> = {
  biodegradable: "bg-green-500",
  recyclable: "bg-blue-500",
  hazardous: "bg-red-500",
  unknown: "bg-gray-500",
};

const categoryIcons: Record<string, typeof Leaf> = {
  biodegradable: Leaf,
  recyclable: Recycle,
  hazardous: AlertTriangle,
  unknown: Trash2,
};

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [records, setRecords] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    if (!supabase) {
      setError("Analytics are unavailable because Supabase is not configured.");
      setLoading(false);
      return;
    }
    if (!user?.id) {
      setError(null);
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let query = supabase
      .from("waste_classifications")
      .select("classification, confidence, points_earned, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startOfTimeframe(timeframe).toISOString())
      .order("created_at", { ascending: true });
    if (selectedCategory !== "all") {
      query = query.eq("classification", selectedCategory);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
      setRecords([]);
    } else {
      setRecords((data || []) as Classification[]);
    }
    setLoading(false);
  }, [selectedCategory, timeframe, user?.id]);

  useEffect(() => {
    if (!supabase || !authLoading) void loadRecords();
  }, [authLoading, loadRecords]);

  const summary = useMemo(() => {
    const counts = records.reduce<Record<string, number>>((result, record) => {
      const category = record.classification || "unknown";
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});
    const confidenceValues = records
      .map((record) => record.confidence)
      .filter((value): value is number => value !== null);
    const averageConfidence = confidenceValues.length
      ? confidenceValues.reduce((total, value) => total + value, 0) /
        confidenceValues.length
      : null;
    const pointsEarned = records.reduce(
      (total, record) => total + (record.points_earned || 0),
      0,
    );
    const trend = records.reduce<Record<string, number>>((result, record) => {
      const date = new Date(record.created_at);
      const bucket =
        timeframe === "week"
          ? date.toLocaleDateString(undefined, { weekday: "short" })
          : timeframe === "year" || timeframe === "quarter"
            ? date.toLocaleDateString(undefined, { month: "short" })
            : date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
      result[bucket] = (result[bucket] || 0) + 1;
      return result;
    }, {});
    return { counts, averageConfidence, pointsEarned, trend };
  }, [records, timeframe]);

  const total = records.length;
  const displayError = error || (!authLoading && !user ? "Sign in to view your analytics." : null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-eco-primary to-eco-secondary bg-clip-text text-transparent">
            Environmental Impact Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your environmental contributions and see the global impact of your actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
            <SelectTrigger className="w-[140px]" aria-label="Timeframe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category)}>
            <SelectTrigger className="w-[170px]" aria-label="Waste category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="biodegradable">Biodegradable</SelectItem>
              <SelectItem value="recyclable">Recyclable</SelectItem>
              <SelectItem value="hazardous">Hazardous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {displayError && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {loading || (supabase && authLoading) ? (
        <div className="py-16 text-center text-muted-foreground" role="status">
          Loading your analytics…
        </div>
      ) : error || !user ? null : total === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No classification data for this selection</h2>
            <p className="text-muted-foreground mt-2">
              Choose another timeframe or category, or classify waste to start building your analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Classifications</p>
                <p className="text-3xl font-bold mt-2">{total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Points earned</p>
                <p className="text-3xl font-bold mt-2">{summary.pointsEarned.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Average model confidence</p>
                <p className="text-3xl font-bold mt-2">
                  {summary.averageConfidence === null
                    ? "Unavailable"
                    : `${summary.averageConfidence.toFixed(1)}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Waste Classification Breakdown</CardTitle>
                <CardDescription>
                  Distribution of your {total.toLocaleString()} classifications in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(summary.counts).map(([category, count]) => {
                  const Icon = categoryIcons[category] || Trash2;
                  const percentage = (count / total) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize flex items-center gap-2">
                          <Icon className="w-4 h-4" /> {category}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} items · {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={percentage} className={`h-3 ${categoryColors[category] || ""}`} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classification Trend</CardTitle>
                <CardDescription>Records grouped within the selected timeframe and category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-64 flex items-end justify-center gap-2 p-4">
                  {Object.entries(summary.trend).map(([label, count]) => {
                    const height = Math.max(
                      8,
                      (count / Math.max(...Object.values(summary.trend))) * 100,
                    );
                    return (
                      <motion.div
                        key={label}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className="w-8 bg-eco-primary rounded-t-md relative group"
                        title={`${label}: ${count}`}
                      >
                        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
                          {label}
                        </span>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100">
                          {count}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
