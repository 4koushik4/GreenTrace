import { useState, useEffect, useCallback } from "react";
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
  supabase,
} from "@/lib/supabase";
import {
  calculateVoucherValue,
  voucherCategories,
  type Voucher,
  type VoucherRedemption,
  type UserTransaction,
} from "@/lib/vouchers";
import {
  fetchVouchers,
  getUserRedemptionsReal,
  getUserTransactionsReal,
  redeemVoucherReal,
} from "@/lib/voucher-operations";
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
  const canRedeem =
    voucher.isActive &&
    voucher.pointsRequired !== null &&
    userPoints >= voucher.pointsRequired &&
    (typeof voucher.currentStock !== "number" || voucher.currentStock > 0);
  const isLowStock =
    typeof voucher.currentStock === "number" && voucher.currentStock < 10;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-0 bg-slate-800/50 backdrop-blur-sm overflow-hidden relative group">
        {/* Voucher Image */}
        <div className="relative h-32 overflow-hidden bg-slate-700">
          {voucher.image ? (
            <img
              src={voucher.image}
              alt={voucher.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Gift className="w-10 h-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Brand Logo */}
          <div className="absolute top-3 left-3">
            <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-lg">
              <span className="text-slate-800 font-bold">
                {(voucher.brand || voucher.title).charAt(0)}
              </span>
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
            <h3 className="font-bold text-white text-lg">
              {voucher.brand || "Provider not specified"}
            </h3>
            <Badge
              className="text-xs px-2 py-1"
              style={{
                backgroundColor: `${voucher.color || "#64748B"}20`,
                color: voucher.color || "#CBD5E1",
                border: `1px solid ${voucher.color || "#64748B"}40`,
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
            {voucher.description || "Description unavailable"}
          </p>

          {/* Points Required */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span
                className="font-bold text-lg"
                style={{ color: canRedeem ? "#FACC15" : "#6B7280" }}
              >
                {voucher.pointsRequired ?? "Unavailable"}
              </span>
              <span className="text-gray-400 text-sm">points</span>
            </div>

            {/* Validity */}
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Calendar className="w-3 h-3" />
              <span>
                {voucher.validUntil
                  ? `Until ${new Date(voucher.validUntil).toLocaleDateString()}`
                  : "No expiry specified"}
              </span>
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
                {voucher.pointsRequired === null
                  ? "Unavailable"
                  : userPoints < voucher.pointsRequired
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
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg text-slate-800 font-bold">
              {(redemption.voucher?.title || "R").charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-white">
                {redemption.voucher?.title || "Reward unavailable"}
              </h4>
              <p className="text-gray-400 text-sm">
                {redemption.voucher?.brand || "Provider not specified"}
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
                {redemption.voucherCode || "Code unavailable"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyVoucherCode}
              disabled={!redemption.voucherCode}
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
              {redemption.expiresAt
                ? new Date(redemption.expiresAt).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Rewards() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [itemsClassified, setItemsClassified] = useState<number | null>(null);
  const [ecoScore, setEcoScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useSbAuth();

  const loadRewardsData = useCallback(async () => {
    if (!supabase) {
      setDataError("Rewards are unavailable because Supabase is not configured.");
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setDataError(null);
      setVouchers([]);
      setRedemptions([]);
      setTransactions([]);
      setUserPoints(null);
      setItemsClassified(null);
      setEcoScore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDataError(null);
    try {
      const [catalog, history, transactionHistory, profileResult, classificationResult] =
        await Promise.all([
          fetchVouchers(),
          getUserRedemptionsReal(user.id),
          getUserTransactionsReal(user.id),
          supabase
            .from("user_profiles")
            .select("points, waste_classified, eco_score")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("waste_classifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

      if (profileResult.error) throw profileResult.error;
      if (classificationResult.error) throw classificationResult.error;
      setVouchers(catalog);
      setRedemptions(history);
      setTransactions(transactionHistory);
      setUserPoints(profileResult.data?.points ?? null);
      setItemsClassified(
        classificationResult.count ??
          profileResult.data?.waste_classified ??
          null,
      );
      setEcoScore(profileResult.data?.eco_score ?? null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "Unable to load rewards data.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!supabase || !authLoading) void loadRewardsData();
  }, [authLoading, loadRewardsData]);

  const filteredVouchers =
    selectedCategory === "all"
      ? vouchers.filter((v) => v.isActive)
      : vouchers.filter((v) => v.category === selectedCategory && v.isActive);
  const availableCategories = Array.from(
    new Set(vouchers.map((voucher) => voucher.category)),
  ).map((category) => ({
    key: category,
    title:
      voucherCategories[category]?.title ||
      category.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    icon: voucherCategories[category]?.icon || "🎁",
  }));

  // Handle voucher redemption
  const handleRedeemVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsRedeemDialogOpen(true);
  };

  const confirmRedemption = async () => {
    if (!selectedVoucher || !user?.id || userPoints === null) return;

    setIsRedeeming(true);
    try {
      const redemption = await redeemVoucherReal(selectedVoucher.id, user.id);
      await loadRewardsData();

      setIsRedeemDialogOpen(false);
      setSelectedVoucher(null);
      toast({
        title: "Reward redeemed",
        description: `Code: ${redemption.voucherCode}`,
      });
      setSuccessMessage(
        `🎉 Successfully redeemed ${selectedVoucher.title}! Your voucher code: ${redemption.voucherCode}`,
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

        {loading && (
          <div className="py-8 text-center text-gray-300" role="status">
            Loading your rewards…
          </div>
        )}
        {!loading && authLoading === false && !user && (
          <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sign in to view your points, vouchers, and redemption history.
            </AlertDescription>
          </Alert>
        )}
        {dataError && (
          <Alert className="border-red-500/40 bg-red-500/10 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        )}

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
                    {userPoints === null ? "—" : <AnimatedCounter value={userPoints} />}
                  </h2>
                  <p className="text-gray-300 text-lg">Available Eco-Points</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {loading ? "—" : <AnimatedCounter value={redemptions.length} />}
                  </div>
                  <p className="text-gray-400 text-sm">Vouchers Redeemed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {itemsClassified === null ? "—" : <AnimatedCounter value={itemsClassified} />}
                  </div>
                  <p className="text-gray-400 text-sm">Items Classified</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {ecoScore === null ? "—" : <AnimatedCounter value={ecoScore} />}
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
                {availableCategories.map((category) => (
                  <Button
                    key={category.key}
                    variant={selectedCategory === category.key ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`${
                      selectedCategory === category.key
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
                      userPoints={userPoints ?? 0}
                      onRedeem={handleRedeemVoucher}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {!loading && !dataError && filteredVouchers.length === 0 && (
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
              {loading ? (
                <p className="py-8 text-center text-gray-400">Loading your vouchers…</p>
              ) : dataError ? (
                <p className="py-8 text-center text-red-300">{dataError}</p>
              ) : redemptions.length > 0 ? (
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
                  {loading ? (
                    <p className="py-8 text-center text-gray-400">Loading your transaction history…</p>
                  ) : dataError ? (
                    <p className="py-8 text-center text-red-300">{dataError}</p>
                  ) : transactions.length > 0 ? (
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
                                        {(transaction.metadata.voucherCode || transaction.metadata.voucher_code) && (
                                          <div>
                                            <span className="text-gray-400">
                                              Voucher Code:
                                            </span>
                                            <span className="text-white font-mono ml-2">
                                              {transaction.metadata.voucherCode || transaction.metadata.voucher_code}
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
                    <span className="text-slate-800 font-bold">
                      {(selectedVoucher.brand || selectedVoucher.title).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      {selectedVoucher.title}
                    </h4>
                    <p className="text-gray-400">
                      {selectedVoucher.brand || "Provider not specified"}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  {selectedVoucher.description || "Description unavailable"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg">
                <span className="text-gray-300">Points Required:</span>
                <span className="text-amber-400 font-bold text-lg">
                  {selectedVoucher.pointsRequired ?? "Unavailable"}
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
