import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  useAuth as useSbAuth,
  useUserProfile as useSbProfile,
  supabase,
} from "@/lib/supabase";
import {
  Coins,
  Gift,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Calendar,
  Tag,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Car,
  Leaf,
  Sparkles,
  Heart,
  Trophy,
} from "lucide-react";

// Mock voucher data and types
interface Voucher {
  id: string;
  title: string;
  brand: string;
  description: string;
  pointsRequired: number;
  category: string;
  image: string;
  logo: string;
  color: string;
  validityDays: number;
  currentStock?: number;
  isActive: boolean;
  value: string;
}

interface VoucherRedemption {
  id: string;
  userId: string;
  voucherId: string;
  voucherCode: string;
  pointsUsed: number;
  status: "active" | "used" | "expired";
  redeemedAt: string;
  expiresAt: string;
  voucher?: Voucher;
}

interface UserTransaction {
  id: string;
  userId: string;
  type: "earned" | "redeemed" | "bonus";
  points: number;
  description: string;
  metadata?: any;
  createdAt: string;
}

// Mock data
type Category = { title: string; icon: string };
const voucherCategories: Record<string, Category> = {
  food: { title: "Food & Dining", icon: "🍕" },
  shopping: { title: "Shopping", icon: "🛍️" },
  entertainment: { title: "Entertainment", icon: "🎬" },
  transport: { title: "Transport", icon: "🚗" },
  health: { title: "Health & Wellness", icon: "💊" },
  eco: { title: "Eco-Friendly", icon: "🌱" },
};

const mockVouchers: Voucher[] = [
  {
    id: "v1",
    title: "20% Off All Items",
    brand: "Amazon",
    description:
      "Get 20% discount on your next purchase. Valid on electronics, books, and home items.",
    pointsRequired: 500,
    category: "shopping",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    color: "#FF9900",
    validityDays: 30,
    currentStock: 50,
    isActive: true,
    value: "₹200 OFF",
  },
  {
    id: "v2",
    title: "Free Coffee & Pastry",
    brand: "Starbucks",
    description:
      "Enjoy a complimentary coffee of your choice with a fresh pastry.",
    pointsRequired: 300,
    category: "food",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop",
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg",
    color: "#00704A",
    validityDays: 15,
    currentStock: 25,
    isActive: true,
    value: "FREE ITEM",
  },
  {
    id: "v3",
    title: "Movie Ticket BOGO",
    brand: "PVR Cinemas",
    description:
      "Buy one movie ticket and get one free. Valid for all shows except premieres.",
    pointsRequired: 800,
    category: "entertainment",
    image:
      "https://images.unsplash.com/photo-1489599904472-af1a1b851186?w=400&h=200&fit=crop",
    logo: "https://via.placeholder.com/40x40/000000/FFFFFF?text=PVR",
    color: "#E50914",
    validityDays: 45,
    currentStock: 15,
    isActive: true,
    value: "BOGO",
  },
  {
    id: "v4",
    title: "₹100 Off Ride",
    brand: "Uber",
    description:
      "Get ₹100 off your next Uber ride. Valid for rides above ₹200.",
    pointsRequired: 200,
    category: "transport",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop",
    logo: "https://via.placeholder.com/40x40/000000/FFFFFF?text=UBER",
    color: "#000000",
    validityDays: 7,
    currentStock: 100,
    isActive: true,
    value: "₹100 OFF",
  },
  {
    id: "v5",
    title: "Eco-Friendly Kit",
    brand: "GreenLife",
    description:
      "Complete eco-friendly starter kit with bamboo products and reusable bags.",
    pointsRequired: 1000,
    category: "eco",
    image:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=200&fit=crop",
    logo: "https://via.placeholder.com/40x40/22C55E/FFFFFF?text=GL",
    color: "#22C55E",
    validityDays: 60,
    currentStock: 8,
    isActive: true,
    value: "FREE KIT",
  },
  {
    id: "v6",
    title: "30% Off Health Products",
    brand: "HealthKart",
    description:
      "Get 30% discount on all health supplements and wellness products.",
    pointsRequired: 600,
    category: "health",
    image:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=200&fit=crop",
    logo: "https://via.placeholder.com/40x40/059669/FFFFFF?text=HK",
    color: "#059669",
    validityDays: 30,
    currentStock: 30,
    isActive: true,
    value: "30% OFF",
  },
];

// Utility functions
const generateVoucherCode = (brand: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  const brandCode = brand.substr(0, 3).toUpperCase();
  return `${brandCode}${random}${timestamp.substr(-4)}`;
};

const calculateVoucherValue = (voucher: Voucher): string => {
  return voucher.value;
};

const canRedeemVoucher = (voucher: Voucher, userPoints: number): boolean => {
  return (
    voucher.isActive &&
    userPoints >= voucher.pointsRequired &&
    (voucher.currentStock === undefined || voucher.currentStock > 0)
  );
};

// Component for animated counter
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

// Voucher Card Component
const VoucherCard = ({
  voucher,
  userPoints,
  onRedeem,
}: {
  voucher: Voucher;
  userPoints: number;
  onRedeem: (voucher: Voucher) => void;
}) => {
  const canRedeem = canRedeemVoucher(voucher, userPoints);
  const isLowStock =
    voucher.currentStock !== undefined && voucher.currentStock < 10;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-0 bg-slate-800/50 backdrop-blur-sm overflow-hidden relative group">
        {/* Voucher Image */}
        <div className="relative h-32 overflow-hidden">
          <img
            src={voucher.image}
            alt={voucher.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Brand Logo */}
          <div className="absolute top-3 left-3">
            <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-lg">
              <img
                src={voucher.logo}
                alt={voucher.brand}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://via.placeholder.com/40x40/ffffff/000000?text=${voucher.brand.charAt(0)}`;
                }}
              />
            </div>
          </div>

          {/* Stock Badge */}
          {isLowStock && (
            <Badge className="absolute top-3 right-3 bg-red-500/90 text-white">
              Only {voucher.currentStock} left!
            </Badge>
          )}

          {/* Category Icon */}
          <div className="absolute bottom-3 left-3 text-white text-2xl">
            {voucherCategories[voucher.category]?.icon || "🎁"}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Brand Name */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-lg">{voucher.brand}</h3>
            <Badge
              className="text-xs px-2 py-1"
              style={{
                backgroundColor: `${voucher.color}20`,
                color: voucher.color,
                border: `1px solid ${voucher.color}40`,
              }}
            >
              {calculateVoucherValue(voucher)}
            </Badge>
          </div>

          {/* Title & Description */}
          <h4 className="font-semibold text-white text-sm mb-1">
            {voucher.title}
          </h4>
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">
            {voucher.description}
          </p>

          {/* Points Required */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span
                className="font-bold text-lg"
                style={{ color: canRedeem ? "#FACC15" : "#6B7280" }}
              >
                {voucher.pointsRequired}
              </span>
              <span className="text-gray-400 text-sm">points</span>
            </div>

            {/* Validity */}
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Calendar className="w-3 h-3" />
              <span>{voucher.validityDays}d</span>
            </div>
          </div>

          {/* Redeem Button */}
          <Button
            onClick={() => onRedeem(voucher)}
            disabled={!canRedeem}
            className={`w-full transition-all duration-300 ${
              canRedeem
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-600 cursor-not-allowed text-gray-300"
            }`}
          >
            {canRedeem ? (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Redeem Now
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                {userPoints < voucher.pointsRequired
                  ? "Insufficient Points"
                  : "Out of Stock"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Redeemed Voucher Card Component
const RedeemedVoucherCard = ({
  redemption,
}: {
  redemption: VoucherRedemption;
}) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const copyVoucherCode = () => {
    navigator.clipboard.writeText(redemption.voucherCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/20";
      case "used":
        return "text-blue-400 bg-blue-400/20";
      case "expired":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  return (
    <Card className="border-0 bg-slate-800/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg p-2 shadow-lg">
              <img
                src={redemption.voucher?.logo}
                alt={redemption.voucher?.brand}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://via.placeholder.com/48x48/ffffff/000000?text=${redemption.voucher?.brand?.charAt(0) || "V"}`;
                }}
              />
            </div>
            <div>
              <h4 className="font-semibold text-white">
                {redemption.voucher?.title}
              </h4>
              <p className="text-gray-400 text-sm">
                {redemption.voucher?.brand}
              </p>
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(redemption.status)}`}>
            {redemption.status.toUpperCase()}
          </Badge>
        </div>

        {/* Voucher Code */}
        <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs mb-1">Voucher Code</p>
              <p className="font-mono text-white font-bold tracking-wider">
                {redemption.voucherCode}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyVoucherCode}
              className="text-gray-400 hover:text-white"
            >
              {codeCopied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Points Used</p>
            <p className="text-white font-semibold">{redemption.pointsUsed}</p>
          </div>
          <div>
            <p className="text-gray-400">Expires</p>
            <p className="text-white font-semibold">
              {new Date(redemption.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Rewards() {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { toast } = useToast();
  const { user } = useSbAuth();
  const { profile } = useSbProfile(user?.id);

  useEffect(() => {
    if (profile?.points != null) setUserPoints(profile.points);
    if (!profile) setUserPoints(2500);
  }, [profile]);

  // Mock user data
  const userData = {
    points: userPoints,
    waste_classified: 156,
    eco_score: 85,
    name: "EcoWarrior",
  };

  // Filter vouchers based on selected category
  const filteredVouchers =
    selectedCategory === "all"
      ? vouchers.filter((v) => v.isActive)
      : vouchers.filter((v) => v.category === selectedCategory && v.isActive);

  // Handle voucher redemption
  const handleRedeemVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedemption = async () => {
    if (!selectedVoucher) return;

    setIsRedeeming(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (userPoints < selectedVoucher.pointsRequired) {
        throw new Error(
          `Insufficient points. You need ${selectedVoucher.pointsRequired} points but only have ${userPoints}.`,
        );
      }

      if (
        selectedVoucher.currentStock !== undefined &&
        selectedVoucher.currentStock <= 0
      ) {
        throw new Error("This voucher is currently out of stock.");
      }

      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const voucherCode = `ECO-${rand}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedVoucher.validityDays);

      const redemption: VoucherRedemption = {
        id: `red_${Date.now()}`,
        userId: user?.id || "user123",
        voucherId: selectedVoucher.id,
        voucherCode,
        pointsUsed: selectedVoucher.pointsRequired,
        status: "active",
        redeemedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        voucher: selectedVoucher,
      };

      const transaction: UserTransaction = {
        id: `txn_${Date.now()}`,
        userId: user?.id || "user123",
        type: "redeemed",
        points: -selectedVoucher.pointsRequired,
        description: `Redeemed: ${selectedVoucher.title}`,
        metadata: {
          voucherCode,
          brand: selectedVoucher.brand,
          category: selectedVoucher.category,
        },
        createdAt: new Date().toISOString(),
      };

      setRedemptions((prev) => [redemption, ...prev]);
      setTransactions((prev) => [transaction, ...prev]);
      setUserPoints((prev) => prev - selectedVoucher.pointsRequired);

      setVouchers((prev) =>
        prev.map((v) =>
          v.id === selectedVoucher.id
            ? { ...v, currentStock: (v.currentStock || 0) - 1 }
            : v,
        ),
      );

      if (supabase && user?.id) {
        try {
          await supabase
            .from("user_profiles")
            .update({
              points: Math.max(
                0,
                (profile?.points || 0) - selectedVoucher.pointsRequired,
              ),
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        } catch {}
      }

      setIsRedeemDialogOpen(false);
      setSelectedVoucher(null);
      toast({ title: "Reward redeemed", description: `Code: ${voucherCode}` });
      setSuccessMessage(
        `🎉 Successfully redeemed ${selectedVoucher.title}! Your voucher code: ${voucherCode}`,
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Redemption failed:", error);
      toast({
        title: "Redemption failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 right-4 z-50"
            >
              <Alert className="bg-green-500/20 border-green-500/50 text-green-400 max-w-md">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              🎟️ Rewards Marketplace
            </h1>
            <p className="text-gray-400 text-lg">
              Redeem your eco-points for amazing vouchers and rewards
            </p>
          </div>
        </motion.div>

        {/* Eco-Points Balance Section */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-yellow-600/20 backdrop-blur-sm mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Coins className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-bold text-amber-400 mb-2">
                    <AnimatedCounter value={userPoints} />
                  </h2>
                  <p className="text-gray-300 text-lg">Available Eco-Points</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    <AnimatedCounter value={redemptions.length} />
                  </div>
                  <p className="text-gray-400 text-sm">Vouchers Redeemed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    <AnimatedCounter value={userData.waste_classified} />
                  </div>
                  <p className="text-gray-400 text-sm">Items Classified</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    <AnimatedCounter value={userData.eco_score} />
                  </div>
                  <p className="text-gray-400 text-sm">Eco Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="vouchers" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger
                value="vouchers"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Gift className="w-4 h-4 mr-2" />
                Vouchers
              </TabsTrigger>
              <TabsTrigger
                value="my-vouchers"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                My Vouchers
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Available Vouchers Tab */}
            <TabsContent value="vouchers" className="space-y-6">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className={`${
                    selectedCategory === "all"
                      ? "bg-red-600 text-white"
                      : "bg-slate-800/50 text-gray-300 hover:text-white"
                  }`}
                >
                  All Categories
                </Button>
                {(
                  Object.entries(voucherCategories) as [string, Category][]
                ).map(([key, category]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    onClick={() => setSelectedCategory(key)}
                    className={`${
                      selectedCategory === key
                        ? "bg-red-600 text-white"
                        : "bg-slate-800/50 text-gray-300 hover:text-white"
                    }`}
                  >
                    {category.icon} {category.title}
                  </Button>
                ))}
              </div>

              {/* Vouchers Grid */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredVouchers.map((voucher, index) => (
                  <motion.div
                    key={voucher.id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <VoucherCard
                      voucher={voucher}
                      userPoints={userPoints}
                      onRedeem={handleRedeemVoucher}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {filteredVouchers.length === 0 && (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No vouchers available
                  </h3>
                  <p className="text-gray-400">
                    Try selecting a different category or earn more points!
                  </p>
                </div>
              )}
            </TabsContent>

            {/* My Vouchers Tab */}
            <TabsContent value="my-vouchers" className="space-y-6">
              {redemptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {redemptions.map((redemption) => (
                    <RedeemedVoucherCard
                      key={redemption.id}
                      redemption={redemption}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No vouchers redeemed yet
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Start redeeming vouchers to see them here!
                  </p>
                  <Button
                    onClick={() => setSelectedCategory("all")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Browse Vouchers
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Transaction History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="border-0 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your complete points earning and spending history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.type === "earned"
                                    ? "bg-green-500/20 text-green-400"
                                    : transaction.type === "redeemed"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {transaction.type === "earned" ? (
                                  <TrendingUp className="w-5 h-5" />
                                ) : transaction.type === "redeemed" ? (
                                  <Gift className="w-5 h-5" />
                                ) : (
                                  <Star className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-white font-medium">
                                    {transaction.description}
                                  </p>
                                  <div
                                    className={`text-lg font-bold ${
                                      transaction.type === "earned"
                                        ? "text-green-400"
                                        : transaction.type === "redeemed"
                                          ? "text-red-400"
                                          : "text-blue-400"
                                    }`}
                                  >
                                    {transaction.type === "earned" ? "+" : ""}
                                    {transaction.points}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {new Date(
                                        transaction.createdAt,
                                      ).toLocaleString()}
                                    </span>
                                  </div>

                                  <Badge
                                    className={`text-xs px-2 py-1 ${
                                      transaction.type === "earned"
                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                        : transaction.type === "redeemed"
                                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    }`}
                                  >
                                    {transaction.type.charAt(0).toUpperCase() +
                                      transaction.type.slice(1)}
                                  </Badge>
                                </div>

                                {transaction.metadata &&
                                  Object.keys(transaction.metadata).length >
                                    0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-600/30">
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {transaction.metadata.voucherCode && (
                                          <div>
                                            <span className="text-gray-400">
                                              Voucher Code:
                                            </span>
                                            <span className="text-white font-mono ml-2">
                                              {transaction.metadata.voucherCode}
                                            </span>
                                          </div>
                                        )}
                                        {transaction.metadata.brand && (
                                          <div>
                                            <span className="text-gray-400">
                                              Brand:
                                            </span>
                                            <span className="text-white ml-2">
                                              {transaction.metadata.brand}
                                            </span>
                                          </div>
                                        )}
                                        {transaction.metadata.category && (
                                          <div>
                                            <span className="text-gray-400">
                                              Category:
                                            </span>
                                            <span className="text-white ml-2">
                                              {transaction.metadata.category}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                        <h4 className="text-white font-semibold mb-3">
                          Transaction Summary
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400 mb-1">
                              +
                              {transactions
                                .filter((t) => t.type === "earned")
                                .reduce((sum, t) => sum + t.points, 0)}
                            </div>
                            <p className="text-gray-400">Total Earned</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400 mb-1">
                              {transactions
                                .filter((t) => t.type === "redeemed")
                                .reduce(
                                  (sum, t) => sum + Math.abs(t.points),
                                  0,
                                )}
                            </div>
                            <p className="text-gray-400">Total Spent</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400 mb-1">
                              {transactions.length}
                            </div>
                            <p className="text-gray-400">Total Transactions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400">No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Redemption Confirmation Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Confirm Redemption
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to redeem this voucher?
            </DialogDescription>
          </DialogHeader>

          {selectedVoucher && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-2">
                    <img
                      src={selectedVoucher.logo}
                      alt={selectedVoucher.brand}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      {selectedVoucher.title}
                    </h4>
                    <p className="text-gray-400">{selectedVoucher.brand}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  {selectedVoucher.description}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg">
                <span className="text-gray-300">Points Required:</span>
                <span className="text-amber-400 font-bold text-lg">
                  {selectedVoucher.pointsRequired}
                </span>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. Points will be deducted from
                  your account.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsRedeemDialogOpen(false)}
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  disabled={isRedeeming}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRedemption}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isRedeeming}
                >
                  {isRedeeming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
