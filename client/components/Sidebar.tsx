import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Camera,
  MapPin,
  Award,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Recycle,
  Coins,
  Target,
  TrendingUp,
  Bell,
  ShoppingBag,
} from "lucide-react";
import { useAuth as useSbAuth, useUserProfile } from "@/lib/supabase";
import { useAuth as useAppAuth } from "../App";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview & statistics",
  },
  {
    title: "Scan Waste",
    href: "/scan",
    icon: Camera,
    description: "AI classification",
  },
  {
    title: "Assessment",
    href: "/assessment",
    icon: Target,
    description: "Eco readiness",
  },
  {
    title: "Schedule Pickup",
    href: "/pickup",
    icon: Bell,
    description: "Book collection",
  },
  {
    title: "My Pickups",
    href: "/pickups",
    icon: Bell,
    description: "View scheduled pickups",
  },
  
  {
    title: "Report Issue",
    href: "/report",
    icon: Users,
    description: "Dumping/Hazard",
  },
  {
    title: "Recycling Centers",
    href: "/centers",
    icon: MapPin,
    description: "Find nearby facilities",
  },
  {
    title: "Buy-Back",
    href: "/buyback",
    icon: Coins,
    description: "Sell recyclables",
  },
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
    description: "Second-hand items",
  },
  {
    title: "Sell Item",
    href: "/sell-item",
    icon: TrendingUp,
    description: "List your item",
  },
  {
    title: "Eco-Points & Rewards",
    href: "/rewards",
    icon: Award,
    description: "Redeem points",
  },
  {
    title: "Messages",
    href: "/messages",
    icon: Bell,
    description: "Chat with worker",
  },
 
  {
    title: "Reports & Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Track impact",
  },
  
];

const bottomItems = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences",
  },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: sbUser, signOut: sbSignOut } = useSbAuth();
  const { user: appUser, } = useAppAuth();
  const { profile, loading: profileLoading } = useUserProfile(sbUser?.id);
  
  // Use authenticated user data, or show loading state
  const userData = profile || null;
  const isLoading = profileLoading || !sbUser;

  const sidebarVariants: any = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const itemVariants: any = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

 const handleLogout = async () => {
  try {
    if (sbSignOut) {
      await sbSignOut();
    }

    // Clear local storage (important)
    localStorage.clear();
    sessionStorage.clear();

    // Force redirect to landing page
    window.location.href = "/";
  } catch (e) {
    console.error("Supabase logout failed:", e);
    window.location.href = "/";
  }
};



  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="fixed left-0 top-0 h-full w-80 bg-slate-900 z-50 flex flex-col lg:relative lg:translate-x-0"
        style={{ backgroundColor: "rgb(17, 24, 39)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <motion.div
            className="flex items-center gap-3"
            variants={itemVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
          >
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360, scale: 1.05 }}
              transition={{ duration: 0.8 }}
            >
              <Recycle className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-white">GreenTrace</h1>
              <p className="text-xs text-gray-400">Smart Waste Management</p>
            </div>
          </motion.div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile */}
        {isLoading ? (
          <motion.div
            className="p-6 border-b border-slate-700/50 flex items-center justify-center"
            variants={itemVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-eco-primary"></div>
          </motion.div>
        ) : userData ? (
          <motion.div
            className="p-6 border-b border-slate-700/50"
            variants={itemVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-eco-accent to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {userData.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">
                  {userData.full_name}
                </h3>
                <p className="text-gray-400 text-sm">{userData.level}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{userData.points}</span>
                </div>
                <p className="text-xs text-gray-400">Eco-Points</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="font-bold">{userData.waste_classified}</span>
                </div>
                <p className="text-xs text-gray-400">Items Sorted</p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.div
                key={item.href}
                variants={itemVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                    ${
                      isActive
                        ? "bg-red-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? "rgb(220, 38, 38)" : undefined,
                  }}
                >
                  <item.icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="w-2 h-2 bg-white rounded-full"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          {bottomItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.div
                key={item.href}
                variants={itemVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
              >
                <Link
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                    ${
                      isActive
                        ? "bg-red-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? "rgb(220, 38, 38)" : undefined,
                  }}
                >
                  <item.icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Logout Button */}
          <motion.div
            variants={itemVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
          >
            <button
              onClick={handleLogout}
              className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-red-400 hover:text-white hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/50"
            >
              <LogOut className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="font-medium">Logout</p>
                <p className="text-xs opacity-75">Sign out securely</p>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}