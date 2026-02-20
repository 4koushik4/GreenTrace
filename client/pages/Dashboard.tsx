import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Leaf,
  Recycle,
  AlertTriangle,
  Coins,
  TrendingUp,
  Target,
  Camera,
  MapPin,
  Award,
  BarChart3,
  ChevronRight,
  Sparkles,
  Globe,
  TreePine,
  Zap,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowDown } from "lucide-react";
// Import our integration hooks
import {
  useAuth as useSupabaseAuth,
  useUserProfile,
  useWasteClassifications,
  useUserLocation,
} from "@/lib/supabase";

// Dashboard stats interface
interface DashboardStats {
  totalWasteSegregated: number;
  biodegradableCount: number;
  recyclableCount: number;
  hazardousCount: number;
  ecoPointsEarned: number;
  co2Saved: number;
  weeklyProgress: number;
  monthlyGoal: number;
}

// Animated Counter Component
const AnimatedCounter = ({
  value,
  suffix = "",
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setDisplayValue(Math.floor(progress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
};

export default function Dashboard() {
  // Authentication and user data
  const { user, loading: authLoading } = useSupabaseAuth();

  const { profile, loading: profileLoading } = useUserProfile(user ? user.id : null);
const { classifications } = useWasteClassifications(user ? user.id : null);

  // User location
  const { location: userLocation, saveLocation } = useUserLocation(user ? user.id : null);

  // Local state for location inputs
  const [region, setRegion] = useState(userLocation?.region || "");
  const [wardNumber, setWardNumber] = useState(userLocation?.ward_number || "");
  const [locationSaved, setLocationSaved] = useState(!!userLocation);
  const [showQRModal, setShowQRModal] = useState(false);

  // Update local state when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setRegion(userLocation.region);
      setWardNumber(userLocation.ward_number);
      setLocationSaved(true);
    }
  }, [userLocation]);


  // Show loading state while fetching data
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Ensure we have valid user data
  if (!user) return null;
if (!profile) return null;


  // Use authenticated user data only
  const userData = profile;
  const userClassifications = classifications.length > 0 ? classifications : [];

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalWasteSegregated: userData.waste_classified,
    biodegradableCount: Math.floor(userData.waste_classified * 0.4),
    recyclableCount: Math.floor(userData.waste_classified * 0.45),
    hazardousCount: Math.floor(userData.waste_classified * 0.15),
    ecoPointsEarned: userData.points,
    co2Saved: Math.floor(userData.waste_classified * 2.3),
    weeklyProgress: 78,
    monthlyGoal: 200,
  };

  // Handler functions
  const handleSaveLocation = async () => {
    if (!region.trim() || !wardNumber.trim()) {
      alert("Please fill in all location fields");
      return;
    }
    const result = await saveLocation("", region.trim(), wardNumber.trim());
    if (result) {
      setLocationSaved(true);
      alert("Location saved successfully!");
    }
  };

  // Animation variants
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

  const cardHoverVariants: any = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  // Dashboard metric cards data
  const metricCards = [
    {
      title: "Total Waste Segregated",
      value: stats.totalWasteSegregated,
      suffix: " kg",
      description: "Items properly sorted",
      icon: Leaf,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      textColor: "text-green-400",
      change: "+12% from last week",
    },
    {
      title: "Recyclables Recycled",
      value: stats.recyclableCount,
      suffix: " items",
      description: "Materials diverted from landfill",
      icon: Recycle,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
      change: "+8% from last week",
    },
    {
      title: "Hazardous Waste Handled",
      value: stats.hazardousCount,
      suffix: " items",
      description: "Safely disposed materials",
      icon: AlertTriangle,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      textColor: "text-red-400",
      change: "+3% from last week",
    },
    {
      title: "Eco-Points Earned",
      value: stats.ecoPointsEarned,
      suffix: " pts",
      description: "Reward points accumulated",
      icon: Coins,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      textColor: "text-purple-400",
      change: "+15% from last week",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {userData.full_name}! 👋
            </h1>
            <p className="text-gray-400 text-lg">
              You're making a positive impact on the environment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
              <TreePine className="w-4 h-4 mr-1" />
              {userData.level}
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">
              <Sparkles className="w-4 h-4 mr-1" />
              Eco Score: {userData.eco_score}
            </Badge>
          </div>
        </div>
      </motion.div>

     {/* ================= CENTERED GLOSSY 2 BOX SECTION ================= */}
<motion.div
  variants={itemVariants}
  className="flex justify-center"
>
  <div className="relative w-full max-w-6xl rounded-2xl overflow-hidden">
    
    {/* Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-r from-eco-primary via-eco-secondary to-eco-accent opacity-90" />
    <div className="absolute inset-0 backdrop-blur-xl bg-white/5" />

    {/* Grid Content */}
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-6 p-8">

      {/* 1️⃣ Assessment - 60% */}
      <Card className="lg:col-span-3 border border-white/20 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1">
       <CardHeader className="text-center items-center">
  <CardTitle className="text-white flex flex-col items-center gap-3 text-lg">
    <div className="p-2 bg-white/20 rounded-lg">
      <Target className="w-5 h-5 text-white" />
    </div>

    <span>Start Assessment</span>
  </CardTitle>

  <CardDescription className="text-white/80 text-sm mt-3">
    <div className="flex flex-col items-center gap-2">
      <span>1️⃣Scan Waste</span>
      <span>↓</span>
      <span>2️⃣Select Center</span>
      <span>↓</span>
      <span>3️⃣Scan QR</span>
      <span>↓</span>
      <span>4️⃣Earn Rewards</span>
    </div>
  </CardDescription>
</CardHeader>

        <CardContent>
          <Link to="/assessment">
            <Button className="w-full bg-white text-eco-primary hover:bg-white/90 shadow-lg">
              Start Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 2️⃣ QR - 40% */}
      <Card
        className="lg:col-span-2 border border-white/20 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
        onClick={() => setShowQRModal(true)}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Your QR Code
          </CardTitle>
          <CardDescription className="text-white/80 text-sm">
            Tap to view large
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-lg shadow-lg">
            <img
  src="https://i.postimg.cc/0Qt3BMFh/Screenshot-2026-01-22-200202.png"
  alt="QR Code"
  className="w-40 h-30"
/>
          </div>
        </CardContent>
      </Card>

    </div>
  </div>
</motion.div>
{/* ================= END SECTION ================= */}
 

      {/* Metric Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
      >
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={itemVariants}
            whileHover="hover"
          >
            <motion.div variants={cardHoverVariants}>
              <Card
                className={`border-0 bg-slate-800/50 backdrop-blur-sm ${card.bgColor} ${card.borderColor} border transition-all duration-300 hover:shadow-lg hover:shadow-${card.color.split("-")[1]}-500/25`}
                style={{ backgroundColor: "rgb(15, 23, 42)" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}
                    >
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-0 text-xs"
                    >
                      {card.change}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-gray-300 text-sm font-medium">
                      {card.title}
                    </h3>
                    <div className={`text-3xl font-bold ${card.textColor}`}>
                      <AnimatedCounter
                        value={card.value}
                        suffix={card.suffix}
                      />
                    </div>
                    <p className="text-gray-500 text-sm">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Environmental Impact Section */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Weekly Progress */}
        <Card
          className="border-0 bg-slate-800/50 backdrop-blur-sm"
          style={{ backgroundColor: "rgb(15, 23, 42)" }}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Weekly Progress
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your waste segregation goal for this week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {stats.totalWasteSegregated} / {stats.monthlyGoal} items
              </span>
              <span className="text-green-400 font-medium">
                {stats.weeklyProgress}%
              </span>
            </div>
            <Progress
              value={stats.weeklyProgress}
              className="h-3 bg-slate-700"
            />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4 text-green-400" />
              You're ahead of schedule! Keep it up.
            </div>
          </CardContent>
        </Card>

        {/* Environmental Impact */}
        <Card
          className="border-0 bg-slate-800/50 backdrop-blur-sm"
          style={{ backgroundColor: "rgb(15, 23, 42)" }}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Environmental Impact
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your positive contribution to the planet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  <AnimatedCounter value={stats.co2Saved} suffix=" kg" />
                </div>
                <p className="text-sm text-gray-400">CO₂ Saved</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  <AnimatedCounter value={156} suffix="L" />
                </div>
                <p className="text-sm text-gray-400">Water Saved</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap className="w-4 h-4 text-yellow-400" />
              Equivalent to powering a home for 3.2 days
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card
          className="border-0 bg-slate-800/50 backdrop-blur-sm"
          style={{ backgroundColor: "rgb(15, 23, 42)" }}
        >
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Common tasks and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Scan Waste",
                  description: "Classify new item",
                  icon: Camera,
                  color: "from-green-500 to-emerald-600",
                  href: "/scan",
                },
                {
                  title: "Assessment",
                  description: "Eco readiness",
                  icon: Target,
                  color: "from-teal-500 to-cyan-600",
                  href: "/assessment",
                },
                {
                  title: "Find Centers",
                  description: "Recycling locations",
                  icon: MapPin,
                  color: "from-blue-500 to-cyan-600",
                  href: "/centers",
                },
                {
                  title: "View Rewards",
                  description: "Redeem points",
                  icon: Award,
                  color: "from-purple-500 to-violet-600",
                  href: "/rewards",
                },
                {
                  title: "Analytics",
                  description: "View reports",
                  icon: BarChart3,
                  color: "from-orange-500 to-red-600",
                  href: "/analytics",
                },
              ].map((action, index) => (
                <motion.div
                  key={action.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className="h-auto p-4 w-full justify-start text-left bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
                    onClick={() => (window.location.href = action.href)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-lg`}
                      >
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">
                          {action.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Community Section */}
      <motion.div variants={itemVariants}>
        <Card
          className="border-0 bg-slate-800/50 backdrop-blur-sm"
          style={{ backgroundColor: "rgb(15, 23, 42)" }}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Community Impact
            </CardTitle>
            <CardDescription className="text-gray-400">
              Together we're making a difference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  <AnimatedCounter value={1247} />
                </div>
                <p className="text-gray-400">Active Users</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  <AnimatedCounter value={15680} suffix=" kg" />
                </div>
                <p className="text-gray-400">Total Waste Sorted</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  <AnimatedCounter value={89} suffix="%" />
                </div>
                <p className="text-gray-400">Accuracy Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Your QR Code</h3>
              <p className="text-gray-400 text-sm mb-6">Show this QR code at recycling centers</p>

              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200 inline-block">
                <img
  src="https://i.postimg.cc/0Qt3BMFh/Screenshot-2026-01-22-200202.png"
  alt="QR Code"
  className="w-64 h-64"
/>
              </div>

              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-purple-400 font-medium">QR Code Ready</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
