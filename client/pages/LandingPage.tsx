import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/components/ThemeProvider";
import {
  Recycle,
  Camera,
  MapPin,
  Award,
  Leaf,
  TreePine,
  Globe,
  Users,
  Target,
  Zap,
  Shield,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  Quote,
  Brain,
  Smartphone,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Wind,
  Waves,
  Flame,
} from "lucide-react";

// Enhanced Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const floatingVariants = {
  float: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Enhanced Interactive Background
const InteractiveBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-eco-primary/20 to-eco-secondary/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * 4,
          y: mousePosition.y * 4,
        }}
        transition={{ type: "spring", stiffness: 20, damping: 30 }}
        style={{ top: "-10%", left: "-10%" }}
      />
      <motion.div
        className="absolute w-64 h-64 bg-gradient-to-r from-eco-accent/15 to-purple-400/15 rounded-full blur-2xl"
        animate={{
          x: mousePosition.x * -2,
          y: mousePosition.y * 3,
        }}
        transition={{ type: "spring", stiffness: 15, damping: 25 }}
        style={{ bottom: "-5%", right: "-5%" }}
      />
    </div>
  );
};

// Theme Icon Component
const ThemeIcon = ({ theme }: { theme: string }) => {
  switch (theme) {
    case "light":
      return <Sun className="w-5 h-5" />;
    case "dark":
      return <Moon className="w-5 h-5" />;
    default:
      return <Sun className="w-5 h-5" />;
  }
};

const LandingPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Enhanced features with more details
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Classification",
      description:
        "Advanced computer vision identifies waste types with 95% accuracy using deep learning models.",
      details: [
        "Real-time image processing",
        "Support for 50+ waste categories",
        "Offline mode available",
        "Continuous learning from user feedback",
      ],
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      icon: Smartphone,
      title: "Smart Mobile Experience",
      description:
        "Intuitive interface optimized for mobile-first waste sorting and environmental tracking.",
      details: [
        "Progressive Web App",
        "Camera integration",
        "Voice guidance",
        "Accessibility features",
      ],
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
    },
    {
      icon: MapPin,
      title: "Global Facility Network",
      description:
        "Comprehensive database of recycling centers with real-time availability and directions.",
      details: [
        "50,000+ verified facilities",
        "Real-time capacity updates",
        "Route optimization",
        "Community reviews",
      ],
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
    },
    {
      icon: Award,
      title: "Gamified Sustainability",
      description:
        "Engaging reward system that motivates environmental action through points and achievements.",
      details: [
        "Global leaderboards",
        "Achievement badges",
        "Team challenges",
        "Eco-credit marketplace",
      ],
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
    },
    {
      icon: Target,
      title: "Impact Analytics",
      description:
        "Detailed tracking of your environmental impact with personalized insights and forecasts.",
      details: [
        "CO₂ footprint tracking",
        "Waste reduction metrics",
        "Predictive analytics",
        "Community comparisons",
      ],
      color: "from-indigo-500 to-purple-500",
      bgColor: "from-indigo-50 to-purple-50",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Connect with like-minded individuals and organizations working towards sustainable goals.",
      details: [
        "Local community groups",
        "Corporate programs",
        "Educational content",
        "Sustainability challenges",
      ],
      color: "from-teal-500 to-cyan-500",
      bgColor: "from-teal-50 to-cyan-50",
    },
  ];

  // Enhanced testimonials
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Environmental Activist",
      content:
        "GreenTrace has revolutionized how our community approaches waste management. The AI classification is incredibly accurate!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      impact: "Reduced household waste by 40%",
    },
    {
      name: "Mike Rodriguez",
      role: "Sustainability Manager",
      content:
        "The gamification aspect makes recycling fun and engaging. Our office waste sorting improved by 300%!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      impact: "300% improvement in office sorting",
    },
    {
      name: "Dr. Emily Johnson",
      role: "Community Leader",
      content:
        "Finding recycling centers has never been easier. The map integration is seamless and always up-to-date.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      impact: "Helped 500+ families find local centers",
    },
  ];

  // Impact stats
  const impactStats = [
    { label: "Waste Items Classified", value: "2.4M+", icon: Recycle },
    { label: "CO₂ Reduced", value: "1,247 tons", icon: Leaf },
    { label: "Active Users", value: "45,000+", icon: Users },
    { label: "Partner Facilities", value: "1,200+", icon: MapPin },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const textParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-x-hidden">
      <InteractiveBackground />

      {/* Enhanced Header */}
      <motion.header
        className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm"
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
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-eco-primary to-eco-secondary bg-clip-text text-transparent">
                  GreenTrace
                </h1>
                <p className="text-sm font-medium text-eco-secondary dark:text-eco-secondary">
                  Smart Waste Management
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ThemeIcon theme={theme} />
              </motion.button>

              <Link to="/login">
                <Button variant="outline" className="inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-eco-primary to-eco-secondary text-white hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <main>
        {/* Enhanced Hero Section */}
        <section className="relative py-20 sm:py-32 lg:py-40 overflow-hidden">
          <motion.div
            style={{ y: heroParallax }}
            className="absolute inset-0 bg-gradient-to-br from-eco-primary/5 via-eco-secondary/5 to-eco-accent/5"
          />

          <div className="container mx-auto px-4 relative">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-6xl mx-auto"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <Badge
                  variant="secondary"
                  className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-eco-primary/10 to-eco-secondary/10 border-eco-primary/20"
                >
                  🌍 AI-Powered Sustainability Platform
                </Badge>
                <motion.h1
                  style={{ y: textParallax }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight"
                >
                  Transform Waste into{" "}
                  <motion.span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-eco-primary via-eco-secondary to-eco-accent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ backgroundSize: "200% 200%" }}
                  >
                    Environmental Impact
                  </motion.span>
                </motion.h1>
                <motion.p
                  className="text-xl sm:text-2xl text-slate-600 mb-12 leading-relaxed max-w-4xl mx-auto"
                  variants={itemVariants}
                >
                  Join the global movement towards sustainable living with our
                  AI-powered waste classification, smart recycling network, and
                  gamified environmental action platform.
                </motion.p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              >
                <Link to="/signup">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-eco-primary to-eco-secondary text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Start Classifying
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <motion.button
                  className="flex items-center gap-3 text-slate-700 hover:text-eco-primary transition-colors group"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    {isVideoPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-1" />
                    )}
                  </div>
                  <span className="font-medium">Watch Demo</span>
                </motion.button>
              </motion.div>

              {/* Impact Statistics */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20"
              >
                {impactStats.map((stat, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="border-0 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <motion.div
                          className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <stat.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <div className="text-2xl font-bold text-slate-900 mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-slate-600">
                          {stat.label}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section id="features" className="py-20 sm:py-32 bg-white/50">
          <div className="container mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                  Revolutionary Features for{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-primary to-eco-secondary">
                    Sustainable Living
                  </span>
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  Experience the future of waste management with cutting-edge AI
                  technology, comprehensive recycling networks, and engaging
                  sustainability challenges.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={`border-0 bg-gradient-to-br ${feature.bgColor} h-full cursor-pointer group hover:shadow-xl transition-all duration-500`}
                    >
                      <CardContent className="p-8">
                        <motion.div
                          className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                        >
                          <feature.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                          {feature.description}
                        </p>
                        <ul className="space-y-2">
                          {feature.details.map((detail, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm text-slate-700"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-20 sm:py-32 bg-gradient-to-br from-slate-100 to-blue-100/30">
          <div className="container mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                  Trusted by Environmental Leaders
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Join thousands of users who are making a difference in waste
                  management and environmental conservation.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardContent className="p-12">
                      <Quote className="w-12 h-12 text-eco-primary mx-auto mb-6" />
                      <p className="text-xl text-slate-700 mb-8 leading-relaxed">
                        "{testimonials[currentTestimonial].content}"
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <img
                          src={testimonials[currentTestimonial].avatar}
                          alt={testimonials[currentTestimonial].name}
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-eco-primary/20"
                        />
                        <div className="text-left">
                          <h4 className="font-semibold text-slate-900">
                            {testimonials[currentTestimonial].name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {testimonials[currentTestimonial].role}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {[
                              ...Array(testimonials[currentTestimonial].rating),
                            ].map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="mt-4 bg-green-100 text-green-800"
                      >
                        {testimonials[currentTestimonial].impact}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Testimonial Indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? "bg-eco-primary scale-125"
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Card className="border-0 bg-gradient-to-r from-eco-primary via-eco-secondary to-eco-accent p-16 text-white relative overflow-hidden">
                <div
                  className={
                    'absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] opacity-30'
                  }
                />
                <CardContent className="relative z-10 text-center max-w-4xl mx-auto">
                  <motion.div variants={itemVariants}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                      Ready to Make an Impact?
                    </h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                      Join our growing community of eco-warriors and start your
                      journey towards sustainable waste management today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                      <Link to="/signup">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            size="lg"
                            variant="secondary"
                            className="bg-white text-eco-primary hover:bg-slate-100 px-8 py-4 text-lg font-semibold shadow-lg"
                          >
                            Get Started Free
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </Button>
                        </motion.div>
                      </Link>
                      <Link to="/about">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                          >
                            Learn More
                          </Button>
                        </motion.div>
                      </Link>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            <motion.div variants={itemVariants} className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <Recycle className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-2xl font-bold">GreenTrace</span>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed max-w-md">
                Transforming waste management through AI technology, community
                engagement, and sustainable practices. Join millions making a
                difference.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Heart, label: "Sustainable" },
                  { icon: Shield, label: "Secure" },
                  { icon: Globe, label: "Global" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 text-sm text-slate-400"
                    whileHover={{ scale: 1.05, color: "#10b981" }}
                  >
                    <feature.icon className="w-4 h-4" />
                    {feature.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                {[
                  { label: "Features", href: "#features" },
                  { label: "About Us", href: "/about" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Contact", href: "/contact" },
                ].map((link, index) => (
                  <Link
                    key={index}
                    to={link.href}
                    className="block text-slate-300 hover:text-eco-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="font-semibold mb-4">Community</h3>
              <div className="space-y-3">
                {[
                  { label: "GitHub", href: "#" },
                  { label: "Discord", href: "#" },
                  { label: "Twitter", href: "#" },
                  { label: "LinkedIn", href: "#" },
                ].map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="block text-slate-300 hover:text-eco-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400"
          >
            <p>
              © 2024 GreenTrace. Built with ❤️ for a sustainable future. All
              rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
