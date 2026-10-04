import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Medal, Award, Users, Trophy } from "lucide-react";
import { supabase, useAuth } from "@/lib/supabase";

type Timeframe = "weekly" | "monthly" | "alltime";
type LeaderboardEntryRow = {
  user_id: string;
  points: number | null;
  rank: number | null;
};
type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: string | null;
};
type RankedUser = {
  userId: string;
  displayName: string;
  avatar?: string;
  level?: string;
  points: number | null;
  rank: number;
};

const timeframeValues: Record<Timeframe, string> = {
  weekly: "weekly",
  monthly: "monthly",
  alltime: "all_time",
};

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!supabase) {
      setError("The leaderboard is unavailable because Supabase is not configured.");
      setLoading(false);
      return;
    }
    if (!user?.id) {
      setError(null);
      setRanking([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data: entries, error: entriesError } = await supabase
      .from("leaderboard_entries")
      .select("user_id, points, rank")
      .eq("timeframe", timeframeValues[timeframe])
      .eq("category", "global")
      .order("rank", { ascending: true });

    if (entriesError) {
      setRanking([]);
      setError(entriesError.message);
      setLoading(false);
      return;
    }

    const entryRows = (entries || []) as LeaderboardEntryRow[];
    if (!entryRows.length) {
      setRanking([]);
      setLoading(false);
      return;
    }

    const userIds = entryRows.map((entry) => entry.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url, level")
      .in("id", userIds);

    if (profilesError) {
      setRanking([]);
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    const profileMap = new Map(
      ((profiles || []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );
    setRanking(
      entryRows.map((entry, index) => {
        const profile = profileMap.get(entry.user_id);
        return {
          userId: entry.user_id,
          displayName:
            profile?.full_name || `User ${entry.user_id.slice(0, 8)}`,
          avatar: profile?.avatar_url || undefined,
          level: profile?.level || undefined,
          points: entry.points,
          rank: entry.rank ?? index + 1,
        };
      }),
    );
    setLoading(false);
  }, [timeframe, user?.id]);

  useEffect(() => {
    if (!supabase || !authLoading) void loadLeaderboard();
  }, [authLoading, loadLeaderboard]);

  const message =
    error ||
    (!authLoading && !user
      ? "Sign in to view the community leaderboard."
      : null);
  const currentUser = ranking.find((entry) => entry.userId === user?.id);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="font-bold text-gray-400">#{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 Community Leaderboard</h1>
        <p className="text-gray-400 text-lg">
          See how you stack up against other eco-warriors
        </p>
      </div>

      {message && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {loading || (supabase && authLoading) ? (
        <div className="py-12 text-center text-gray-300" role="status">
          Loading community rankings…
        </div>
      ) : error || !user ? null : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Ranked Users", value: ranking.length, icon: Users },
              {
                title: "Your Rank",
                value: currentUser ? `#${currentUser.rank}` : "—",
                icon: Trophy,
              },
              {
                title: "Your Points",
                value:
                  currentUser?.points === null || !currentUser
                    ? "—"
                    : currentUser.points.toLocaleString(),
                icon: Award,
              },
            ].map((stat) => (
              <Card
                key={stat.title}
                className="border-0 bg-slate-800/50 text-white"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <stat.icon className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">{stat.title}</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as Timeframe)}
            className="space-y-6"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="alltime">All Time</TabsTrigger>
            </TabsList>

            <Card className="border-0 bg-slate-800/50 text-white">
              <CardHeader>
                <CardTitle>
                  {timeframe === "weekly"
                    ? "Weekly Leaderboard"
                    : timeframe === "monthly"
                      ? "Monthly Leaderboard"
                      : "All-Time Champions"}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {timeframe === "alltime"
                    ? "Current all-time global rankings"
                    : `Current ${timeframe} global rankings`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ranking.length ? (
                  ranking.map((person) => (
                    <div
                      key={person.userId}
                      className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 border-l-4 border-green-500/60"
                    >
                      {rankIcon(person.rank)}
                      <Avatar className="h-12 w-12 border-2 border-slate-600">
                        <AvatarImage
                          src={person.avatar}
                          alt={person.displayName}
                        />
                        <AvatarFallback>
                          {person.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {person.displayName}
                          </h3>
                          {person.level && (
                            <Badge variant="secondary">{person.level}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {person.points === null
                            ? "—"
                            : person.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">points</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <Trophy className="w-12 h-12 mx-auto mb-3" />
                    No leaderboard records are available for this period.
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </>
      )}
    </motion.div>
  );
}
