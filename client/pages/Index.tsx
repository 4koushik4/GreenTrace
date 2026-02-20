import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Camera,
  Upload,
  MapPin,
  Award,
  Recycle,
  Leaf,
  AlertTriangle,
  BarChart3,
  Target,
  Users,
  TreePine,
  Zap,
  Globe,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Star,
  Coins,
  Sparkles,
  TrendingUp,
  Shield,
  Heart,
  Navigation,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Share2,
  Download,
  Scan
} from "lucide-react";

// Import our integration hooks
import { useAuth, useUserProfile, useWasteClassifications } from "@/lib/supabase";
import { useWasteClassification, validateImageForClassification } from "@/lib/ml-integration";
import { useGeolocation, useRecyclingCentersSearch } from "@/lib/openstreetmap";
import { config } from "@/lib/config";

// Mobile navigation component
const MobileNavigation = ({ isOpen, setIsOpen, selectedTab, setSelectedTab }: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 p-4 space-y-4">
            {[
              { id: "classify", label: "Classify Waste", icon: Camera },
              { id: "centers", label: "Find Centers", icon: MapPin },
              { id: "rewards", label: "Rewards", icon: Award },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((item) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  setSelectedTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                  selectedTab === item.id
                    ? "bg-gradient-to-r from-eco-primary to-eco-secondary text-white"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = count.set(value);
    const unsubscribe = rounded.onChange(setDisplayValue);
    return unsubscribe;
  }, [value, count, rounded]);

  return <motion.span>{displayValue}</motion.span>;
};

// Floating Animation Component
const FloatingIcon = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

// Professional Button Component
const ProfessionalButton = ({ 
  children, 
  variant = "primary", 
  size = "default",
  className = "",
  ...props 
}: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={className}
  >
    <Button
      className={`
        relative overflow-hidden transition-all duration-300
        ${variant === "primary" 
          ? "bg-gradient-to-r from-eco-primary to-eco-secondary hover:from-eco-primary/90 hover:to-eco-secondary/90 text-white shadow-lg hover:shadow-xl" 
          : variant === "secondary"
          ? "bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-800 border border-slate-300"
          : "bg-gradient-to-r from-eco-accent to-purple-600 hover:from-eco-accent/90 hover:to-purple-600/90 text-white"
        }
        ${size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3"}
      `}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        animate={{ x: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {children}
    </Button>
  </motion.div>
);

export default function Index() {
  // Authentication and user data
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);
  const { classifications } = useWasteClassifications(user?.id);

  // ML Classification
  const { classifyWaste, loading: mlLoading, modelReady } = useWasteClassification();
  
  // Location and maps
  const { location, getCurrentLocation } = useGeolocation();
  const { centers, searchNearbyRecyclingCenters } = useRecyclingCentersSearch();

  // Local state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("classify");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const isHeroInView = useInView(heroRef);
  const isStatsInView = useInView(statsRef);

  // Show loading state while authenticating or loading profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary"></div>
      </div>
    );
  }

  // For landing page, allow unauthenticated users to view but show limited content
  // Use authenticated data if available, otherwise show empty state
  const userData = profile || null;
  const userClassifications = classifications.length > 0 ? classifications : [];
  const nearbyRecyclingCenters = centers.length > 0 ? centers : [];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const cardHoverVariants: any = {
    hover: {
      scale: 1.03,
      y: -8,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Handle waste classification
  const handleClassification = async (file: File) => {
    const validation = validateImageForClassification(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsLoading(true);
    setClassificationResult(null);
    
    try {
      const result = await classifyWaste(file);
      setClassificationResult({
        ...result,
        pointsEarned: config.defaults.pointsPerClassification[result.type]
      });
    } catch (error) {
      console.error("Classification failed:", error);
      alert("Classification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleClassification(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle location and search
  const handleLocationSearch = async () => {
    try {
      const userLocation = await getCurrentLocation();
      await searchNearbyRecyclingCenters(userLocation, 10);
    } catch (error) {
      console.error("Location search failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/50 overflow-x-hidden">
      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={mobileNavOpen}
        setIsOpen={setMobileNavOpen}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-eco-primary/10 to-eco-secondary/10 rounded-full blur-xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-eco-accent/10 to-purple-400/10 rounded-full blur-xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-eco-nature/10 to-green-400/10 rounded-full blur-xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-eco-primary via-eco-secondary to-eco-accent rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <Recycle className="w-7 h-7 text-white" />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-eco-primary to-eco-secondary bg-clip-text text-transparent">
                  GreenTrace
                </h1>
                <p className="text-sm text-slate-600">Smart Waste Management</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {userData && (
                <>
                  <motion.div 
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full px-3 py-1.5"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Coins className="w-4 h-4 text-amber-600" />
                    <motion.span 
                      className="font-semibold text-amber-800 text-sm sm:text-base"
                      key={userData.points}
                      initial={{ scale: 1.3, color: "#059669" }}
                      animate={{ scale: 1, color: "#92400e" }}
                      transition={{ duration: 0.6 }}
                    >
                      <AnimatedCounter value={userData.points} />
                    </motion.span>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden sm:block"
                  >
                    <Badge className="bg-gradient-to-r from-eco-primary to-eco-secondary text-white border-0 shadow-md">
                      {userData.level}
                    </Badge>
                  </motion.div>
                </>
              )}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button size="icon" variant="ghost" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
              </motion.div>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <motion.section 
          ref={heroRef}
          className="text-center mb-8 sm:mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isHeroInView ? "visible" : "hidden"}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">
                Smart Waste Segregation &
                <motion.span 
                  className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-eco-primary via-eco-secondary to-eco-accent"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ backgroundSize: "200% 200%" }}
                > Recycling System
                </motion.span>
              </h2>
            </motion.div>
            
            <motion.p 
              className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Harness the power of AI to classify waste correctly, discover nearby recycling centers, and earn rewards for sustainable living.
            </motion.p>
            
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
              variants={containerVariants}
            >
              {[
                { 
                  icon: Camera, 
                  title: "AI Classification", 
                  desc: "Instant waste type identification using advanced computer vision", 
                  gradient: "from-eco-primary to-blue-600",
                  bgGradient: "from-eco-primary/5 to-blue-100/50",
                  delay: 0
                },
                { 
                  icon: MapPin, 
                  title: "Smart Locator", 
                  desc: "Find the nearest recycling facilities with real-time data", 
                  gradient: "from-eco-secondary to-green-600",
                  bgGradient: "from-eco-secondary/5 to-green-100/50",
                  delay: 0.2
                },
                { 
                  icon: Award, 
                  title: "Reward System", 
                  desc: "Earn points, unlock achievements, and compete with community", 
                  gradient: "from-eco-accent to-purple-600",
                  bgGradient: "from-eco-accent/5 to-purple-100/50",
                  delay: 0.4
                }
              ].map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <motion.div
                    whileHover="hover"
                    variants={cardHoverVariants}
                  >
                    <Card className={`border-0 bg-gradient-to-br ${item.bgGradient} backdrop-blur-sm cursor-pointer group h-full`}>
                      <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                        <div>
                          <FloatingIcon delay={item.delay}>
                            <motion.div
                              className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.3 }}
                            >
                              <item.icon className="w-8 h-8 text-white" />
                            </motion.div>
                          </FloatingIcon>
                          <h3 className="text-lg font-semibold text-slate-800 mb-3">{item.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <ProfessionalButton
                variant="primary"
                size="lg"
                onClick={triggerFileUpload}
                className="w-full sm:w-auto"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Classifying
              </ProfessionalButton>
              
              <ProfessionalButton
                variant="secondary"
                size="lg"
                onClick={handleLocationSearch}
                className="w-full sm:w-auto"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Find Centers
              </ProfessionalButton>

              <ProfessionalButton
                variant="accent"
                size="lg"
                onClick={() => window.location.href = '/ar-scanner'}
                className="w-full sm:w-auto"
              >
                <Scan className="w-5 h-5 mr-2" />
                AR Scanner
              </ProfessionalButton>
            </motion.div>
          </div>
        </motion.section>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="max-w-6xl mx-auto">
            {/* Desktop Tab Navigation */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="hidden md:block"
            >
              <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-2 shadow-lg">
                {[
                  { id: "classify", label: "Classify", icon: Camera },
                  { id: "centers", label: "Centers", icon: MapPin },
                  { id: "rewards", label: "Rewards", icon: Award },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-eco-primary data-[state=active]:to-eco-secondary data-[state=active]:text-white data-[state=active]:shadow-md rounded-xl transition-all duration-300"
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: "classify", label: "Classify", icon: Camera },
                  { id: "centers", label: "Centers", icon: MapPin },
                  { id: "rewards", label: "Rewards", icon: Award },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedTab === tab.id
                        ? "bg-gradient-to-r from-eco-primary to-eco-secondary text-white shadow-md"
                        : "bg-white/70 text-slate-600 hover:bg-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <tab.icon className="w-4 h-4 mr-1" />
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Waste Classification Tab */}
              <TabsContent value="classify" className="space-y-6 mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-xl flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        AI Waste Classification
                      </CardTitle>
                      <CardDescription className="text-base">
                        Upload or capture an image for instant AI-powered waste type identification
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Upload Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <ProfessionalButton
                            onClick={triggerFileUpload}
                            variant="primary"
                            disabled={isLoading}
                            className="w-full h-40 text-center"
                          >
                            <div className="flex flex-col items-center">
                              <motion.div
                                animate={isLoading ? { rotate: 360 } : {}}
                                transition={isLoading ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                              >
                                <Upload className="w-12 h-12 mb-3" />
                              </motion.div>
                              <div className="text-lg font-semibold mb-1">Upload Image</div>
                              <div className="text-sm opacity-90">Choose from gallery</div>
                            </div>
                          </ProfessionalButton>
                        </motion.div>
                        
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            variant="outline" 
                            className="w-full h-40 border-2 border-dashed border-slate-300 hover:border-eco-primary bg-gradient-to-br from-slate-50 to-slate-100 hover:from-eco-primary/5 hover:to-eco-secondary/5 transition-all duration-300"
                            disabled={isLoading}
                          >
                            <div className="text-center">
                              <Camera className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                              <div className="text-lg font-semibold text-slate-800 mb-1">Take Photo</div>
                              <div className="text-sm text-slate-600">Use camera</div>
                            </div>
                          </Button>
                        </motion.div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {/* Loading State */}
                      <AnimatePresence>
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
                              <CardContent className="p-8 text-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  className="w-12 h-12 border-4 border-eco-primary border-t-transparent rounded-full mx-auto mb-4"
                                />
                                <motion.p 
                                  className="text-lg font-medium text-slate-700 mb-2"
                                  animate={{ opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  🤖 AI is analyzing your image...
                                </motion.p>
                                <motion.div 
                                  className="text-sm text-slate-600"
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  Using advanced computer vision technology
                                </motion.div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Classification Result */}
                      <AnimatePresence>
                        {classificationResult && !isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.8 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                          >
                            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200/50 relative overflow-hidden">
                              <motion.div
                                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-eco-primary to-eco-secondary"
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                              />
                              <CardContent className="p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <motion.h3 
                                      className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                    >
                                      <CheckCircle className="w-6 h-6 text-green-600" />
                                      Classification Complete!
                                    </motion.h3>
                                    
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.4, type: "spring" }}
                                      className="mb-4"
                                    >
                                      <Badge className={`text-base px-4 py-2 ${
                                        classificationResult.type === 'recyclable' ? 'bg-blue-500' :
                                        classificationResult.type === 'biodegradable' ? 'bg-green-500' :
                                        'bg-red-500'
                                      } text-white border-0 shadow-md`}>
                                        ✓ {classificationResult.type.toUpperCase()}
                                      </Badge>
                                      <div className="mt-2 text-sm text-slate-600">
                                        Confidence: {classificationResult.confidence}%
                                      </div>
                                    </motion.div>
                                    
                                    <motion.div 
                                      className="space-y-2"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.5 }}
                                    >
                                      {classificationResult.details?.recommendations?.map((rec: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                          <span>{rec}</span>
                                        </div>
                                      ))}
                                    </motion.div>
                                  </div>
                                  
                                  <motion.div 
                                    className="text-center"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                  >
                                    <motion.div 
                                      className="text-3xl font-bold text-green-600 flex items-center gap-2 mb-1"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 0.6, delay: 0.7 }}
                                    >
                                      <Sparkles className="w-6 h-6" />
                                      +{classificationResult.pointsEarned}
                                    </motion.div>
                                    <div className="text-sm text-slate-600">points earned</div>
                                  </motion.div>
                                </div>

                                {/* Action Buttons */}
                                <motion.div 
                                  className="flex flex-col sm:flex-row gap-3 mt-6"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.8 }}
                                >
                                  <ProfessionalButton size="sm" className="flex-1">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Result
                                  </ProfessionalButton>
                                  <ProfessionalButton variant="secondary" size="sm" className="flex-1">
                                    <Download className="w-4 h-4 mr-2" />
                                    Save to Profile
                                  </ProfessionalButton>
                                </motion.div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Waste Categories Information */}
                      <motion.div 
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {[
                          { 
                            icon: Leaf, 
                            name: "Biodegradable", 
                            desc: "Food scraps, leaves, paper, organic materials", 
                            color: "eco-nature",
                            bgColor: "from-green-50 to-emerald-50",
                            examples: ["🍎 Food waste", "🍃 Garden waste", "📰 Paper products"]
                          },
                          { 
                            icon: Recycle, 
                            name: "Recyclable", 
                            desc: "Plastic, glass, metal, clean paper products", 
                            color: "eco-primary",
                            bgColor: "from-blue-50 to-cyan-50",
                            examples: ["♻️ Plastic bottles", "🥫 Metal cans", "🍷 Glass bottles"]
                          },
                          { 
                            icon: AlertTriangle, 
                            name: "Hazardous", 
                            desc: "Batteries, chemicals, electronics, paint", 
                            color: "red-500",
                            bgColor: "from-red-50 to-pink-50",
                            examples: ["🔋 Batteries", "📱 Electronics", "🎨 Chemicals"]
                          }
                        ].map((category, index) => (
                          <motion.div key={index} variants={itemVariants}>
                            <motion.div
                              whileHover="hover"
                              variants={cardHoverVariants}
                            >
                              <Card className={`border-0 bg-gradient-to-br ${category.bgColor} cursor-pointer group h-full`}>
                                <CardContent className="p-5">
                                  <div className="flex items-center gap-3 mb-3">
                                    <motion.div
                                      className={`w-10 h-10 bg-${category.color} rounded-xl flex items-center justify-center text-white shadow-md`}
                                      whileHover={{ rotate: 15, scale: 1.1 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <category.icon className="w-5 h-5" />
                                    </motion.div>
                                    <span className="font-semibold text-slate-800 text-lg">{category.name}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">{category.desc}</p>
                                  <div className="space-y-1">
                                    {category.examples.map((example, idx) => (
                                      <div key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                                        <span>{example}</span>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Other tabs would continue with similar mobile-responsive design patterns... */}
              {/* For brevity, I'll add placeholders for the other tabs */}
              
              <TabsContent value="centers" className="space-y-6 mt-0">
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <MapPin className="w-6 h-6" />
                      Nearby Recycling Centers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-slate-600">
                      <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-4">Interactive map and recycling centers</p>
                      <ProfessionalButton onClick={handleLocationSearch}>
                        <Navigation className="w-4 h-4 mr-2" />
                        Find Nearby Centers
                      </ProfessionalButton>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-6 mt-0">
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Award className="w-6 h-6" />
                      Rewards & Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-slate-600">
                      <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Gamification system with points and achievements</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-0">
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <BarChart3 className="w-6 h-6" />
                      Environmental Impact Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-slate-600">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Track your environmental impact and contributions</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white mt-16"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <motion.div 
              className="flex items-center justify-center gap-3 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <Recycle className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-eco-primary to-eco-secondary bg-clip-text text-transparent">
                GreenTrace
              </span>
            </motion.div>
            
            <motion.p 
              className="text-slate-300 mb-8 text-lg max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Transforming waste management through AI technology, community engagement, and sustainable practices. Join millions making a difference.
            </motion.p>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { icon: "🌱", label: "Sustainable Living", desc: "Eco-friendly practices" },
                { icon: "♻️", label: "Smart Recycling", desc: "AI-powered sorting" },
                { icon: "🏆", label: "Gamified Experience", desc: "Rewards & achievements" },
                { icon: "🌍", label: "Global Impact", desc: "Community action" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="cursor-default"
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-white mb-1">{item.label}</div>
                  <div className="text-sm text-slate-400">{item.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="text-sm text-slate-400 border-t border-slate-700 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              © 2024 GreenTrace. Built with ❤️ for a sustainable future.
            </motion.div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
