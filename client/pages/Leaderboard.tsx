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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Crown,
} from "lucide-react";

// Mock leaderboard data
const mockLeaderboardData = [
  {
    id: 1,
    name: "Sarah Green",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    points: 3247,
    wasteClassified: 156,
    level: "Eco Master",
    rank: 1,
    change: "+5",
  },
  {
    id: 2,
    name: "Alex Chen",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    points: 2986,
    wasteClassified: 142,
    level: "Eco Champion",
    rank: 2,
    change: "+2",
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    points: 2753,
    wasteClassified: 128,
    level: "Green Warrior",
    rank: 3,
    change: "-1",
  },
  {
    id: 4,
    name: "John Smith",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    points: 2445,
    wasteClassified: 117,
    level: "Eco Enthusiast",
    rank: 4,
    change: "+3",
  },
  {
    id: 5,
    name: "Lisa Wang",
    avatar:
      "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
    points: 2289,
    wasteClassified: 104,
    level: "Green Guardian",
    rank: 5,
    change: "0",
  },
];

export default function Leaderboard() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-l-yellow-400 bg-yellow-400/5";
      case 2:
        return "border-l-gray-400 bg-gray-400/5";
      case 3:
        return "border-l-amber-600 bg-amber-600/5";
      default:
        return "border-l-blue-400 bg-blue-400/5";
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏆 Community Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">
            See how you stack up against other eco-warriors
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {[
          {
            title: "Total Users",
            value: "1,247",
            icon: Users,
            color: "text-blue-400",
            change: "+45 this week",
          },
          {
            title: "Active This Week",
            value: "892",
            icon: TrendingUp,
            color: "text-green-400",
            change: "+12% increase",
          },
          {
            title: "Items Classified",
            value: "15,680",
            icon: Trophy,
            color: "text-purple-400",
            change: "+234 today",
          },
        ].map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card
              className="border-0 bg-slate-800/50 backdrop-blur-sm"
              style={{ backgroundColor: "rgb(15, 23, 42)" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-700/50">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-400 border-0 text-xs"
                  >
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-gray-300 text-sm font-medium mb-2">
                  {stat.title}
                </h3>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Leaderboard Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger
              value="weekly"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="alltime"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              All Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <Card
              className="border-0 bg-slate-800/50 backdrop-blur-sm"
              style={{ backgroundColor: "rgb(15, 23, 42)" }}
            >
              <CardHeader>
                <CardTitle className="text-white">Weekly Leaderboard</CardTitle>
                <CardDescription className="text-gray-400">
                  Top performers this week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockLeaderboardData.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${getRankColor(
                      user.rank,
                    )} hover:bg-slate-700/20 transition-all duration-300`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(user.rank)}
                      <Avatar className="h-12 w-12 border-2 border-slate-600">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {user.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-400 border-0 text-xs"
                        >
                          {user.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">
                        {user.wasteClassified} items classified
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {user.points.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        {user.change.startsWith("+") ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : user.change === "0" ? (
                          <div className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                        )}
                        <span
                          className={
                            user.change.startsWith("+")
                              ? "text-green-400"
                              : user.change === "0"
                                ? "text-gray-400"
                                : "text-red-400"
                          }
                        >
                          {user.change}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card
              className="border-0 bg-slate-800/50 backdrop-blur-sm"
              style={{ backgroundColor: "rgb(15, 23, 42)" }}
            >
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Monthly Leaderboard
                </h3>
                <p className="text-gray-400">
                  Monthly rankings coming soon! Keep sorting waste to climb the
                  weekly leaderboard.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alltime" className="space-y-4">
            <Card
              className="border-0 bg-slate-800/50 backdrop-blur-sm"
              style={{ backgroundColor: "rgb(15, 23, 42)" }}
            >
              <CardContent className="p-8 text-center">
                <Crown className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  All-Time Champions
                </h3>
                <p className="text-gray-400">
                  All-time rankings coming soon! Join the community and start
                  making an impact.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
